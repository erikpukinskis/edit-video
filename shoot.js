var library = require("module-library")(require)

library.using([
  library.ref(),
  "web-site",
  "browser-bridge",
  "web-element",
  "add-html",
  "bridge-module",
  "basic-styles"],
  function(lib, WebSite, BrowserBridge, element, addHtml, bridgeModule, basicStyles) {

    var site = new WebSite()

    var baseBridge = new BrowserBridge()

    basicStyles.addTo(baseBridge)

    var p = element.template.container("p")

    var form = element("form.lil-page",{
      "method": "post",
      "action": "/prompts"},[
      p("Enter your prompts:"),
      p(element("textarea",{
        "name": "shootingPrompts"},
        element.style({
          "height": "20em"}))),
      p(element("input",{
        "type": "submit",
        "value": "Start shooting"})),
      ])

    site.addRoute(
      "get",
      "/",
      baseBridge.requestHandler(
        form))

    function trim(string) {
      return string.trim() }

    function notEmpty(string) {
      return string.length > 0 }

    site.addRoute(
      "post",
      "/prompts",
      function(request, response) {
        var text = request.body.shootingPrompts

        text = text + "\nAll done!"

        var lines = text.split("\n").map(
          trim)
          .filter(
            notEmpty)

        var bridge = baseBridge.forResponse(response)

        shoot(bridge, lines)
      })

    var stylesheet = element.stylesheet([
      element.style(".prompter-text",{
        "display": "none",
        ".prompted": {
          "display": "block"},
        "font-size": "3em",
        "text-align": "center",
        "height": "4em",
        "margin-top": "1em" }),
      ])

    baseBridge.addToHead(stylesheet)

    var advance = baseBridge.defineFunction(
      function advancePrompter(prompterState, event) {

        if (event.key == " ") {
          var direction = 1
        } else if (event.key = "ArrowLeft") {
          var direction = -1
        } else if (event.key == "ArrowRight") {
          var direction = 1
        } else {
          return }

        event.preventDefault()

        var nextLine = prompterState.currentLine + direction

        if (nextLine == prompterState.lineCount || nextLine < 0) {
          return }

        document.querySelector(
          ".prompter-text.prompted")
          .classList.remove(
            "prompted")

        // CSS indexes start at 1:
        var cssIndex = nextLine + 1

        var selector = ".prompter-text:nth-of-type("+cssIndex+")"

        document.querySelector(
          selector)
          .classList.add(
            "prompted")

        prompterState.currentLine = nextLine
      })

    function shoot(bridge, lines) {
      var lineEls = lines.map(
        function(line, i) {
          var el = element(
            ".prompter-text",
            line)
          if (i == 0) {
            el.addSelector(
              ".prompted")}
          return el})

      var instruction = element("p", element.style({"text-align": "center"}), "Press Space Bar to advance")

      var prompterSingleton = bridge.defineSingleton(
        "prompter",[
        lineEls.length],
        function(count) {
          return {
            currentLine: 0,
            lineCount: count }})

      debugger
      bridge.addBodyEvent(
        "onkeypress",
        advance.withArgs(prompterSingleton, bridge.event).evalable())

      var page = element(
        lineEls,
        instruction)

      bridge.send(page)
    }

    site.start(9999)
  })