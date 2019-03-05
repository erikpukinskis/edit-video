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
        "color": "black",
        "display": "none",
        ".prompted": {
          "display": "block"},
        "font-size": "3em",
        "height": "6em",
        "padding": "1em",

        ".next": {
          "display": "block",
          "color": "#999",
          "height": "0",
          "margin": "0",
          "text-overflow": "ellipsis"},

        ".next .prompt-summary": {
            "display": "none" },      
        }),

      element.style(),

      element.style(".prompt-summary", {
        "background": "black",
        "color": "white",
        "display": "block",
        "width": "5em",
        "margin": "1em auto",
        "text-align": "center",
        "font-size": "50%"}),
    ])

    baseBridge.addToHead(stylesheet)

    var advance = baseBridge.defineFunction(
      function advancePrompter(prompterState, event) {
        if (event.key == " ") {
          var direction = 1
        } else if (event.key == "s") {
          var direction = -1*prompterState.currentLine
        } else if (event.key == "e") {
          var direction = prompterState.lineCount - prompterState.currentLine - 1
        } else if (event.key == "ArrowLeft") {
          var direction = -1
        } else if (event.key == "ArrowRight") {
          var direction = 1
        } else {
          return }

        event.preventDefault()

        var nextLine = prompterState.currentLine + direction

        console.log("prompter was at", prompterState.currentLine, "but we're trying to set it to", nextLine)

        console.log("max is", prompterState.lineCount)
        if (nextLine == prompterState.lineCount || nextLine < 0) {
          return }

        document.querySelector(
          ".prompter-text.prompted")
          .classList.remove(
            "prompted")

        var next = document.querySelector(
          ".prompter-text.next")

        if (next) {
          next.classList.remove(
            "next")}

        // CSS indexes start at 1:
        var cssIndex = nextLine + 1
        var nextIndex = nextLine + 2

        document.querySelector(
          ".prompter-text:nth-of-type("+cssIndex+")")
          .classList.add(
            "prompted")

        if (nextIndex < prompterState.lineCount) {        
          document.querySelector(
            ".prompter-text:nth-of-type("+nextIndex+")")
            .classList.add(
              "next")
        }

        prompterState.currentLine = nextLine

        console.log("now prompter is at", prompterState.currentLine)
      })

    var summary = element.template(
      ".prompt-summary",
      function(number, total) {
        number++
        this.addChild(
          number+" / "+total)})

    function shoot(bridge, lines) {
      var lineEls = lines.map(
        function(line, i) {
          var el = element(
            ".prompter-text",
            summary(i,lines.length),
            line)
          if (i == 0) {
            el.addSelector(
              ".prompted")}
          if (i == 1) {
            el.addSelector(
              ".next")}
          return el})

      var instruction = element("p", element.style({"text-align": "center"}), "Press Space Bar to advance")

      var prompterSingleton = bridge.defineSingleton(
        "prompter",[
        lineEls.length],
        function(count) {
          return {
            currentLine: 0,
            lineCount: count }})

      bridge.addBodyEvent(
        "onkeyup",
        advance.withArgs(prompterSingleton, bridge.event).evalable())

      var page = element(
        lineEls,
        instruction)

      bridge.send(page)
    }

    site.start(9999)
  })