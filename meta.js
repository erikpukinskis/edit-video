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

    baseBridge.addToHead(
      element(
        "script",{
        "src": "https://www.youtube.com/player_api"}))

    var stylesheet = element.stylesheet([
      element.style(
        "button",{
          ".unselected": {
            "border": "2px solid #0ad188",
            "color": "#0ad188",
            "background": "transparent"},

          ".selected": {
            "border": "2px solid #0ad188"},
      }),

      element.style(
        ".timeline",{
        "border-left": "2px solid black",
        "padding": "5px 0"}),

      element.style(
        ".blocks",{
        "transition-timing-function": "linear",
        "white-space": "nowrap"}),

      element.style(
        ".block",{
        "display": "inline-block",
        "margin-right": "5px",
        "width": "45px",
        "height": "45px",
        "background": "gray"}),
    ])

    baseBridge.addToHead(stylesheet)

    var init = baseBridge.defineFunction([
      bridgeModule(lib, "web-element", baseBridge),
      bridgeModule(lib, "add-html", baseBridge)],
      function init(element, addHtml, duration) {
        var blockCount = duration*2

        var html = ""
        for(var i=0; i<blockCount; i++) {
          html += element(".block").html()
        }

        var blocks = document.querySelector(".blocks")

        blocks.innerHTML = html
      })

    var updateBlocks = baseBridge.defineFunction(
      function updateBlocks(state, duration, currentTime) {

        console.log(state)

        var blocks = document.querySelector(".blocks")
        var elapsedPixels = currentTime*2 * 50
        var offsetAtEnd = duration*2*50
        var timeToEnd = duration - currentTime

        if (state == "playing") {
          blocks.style["transition-duration"] = timeToEnd+"s"
          blocks.style["margin-left"] = "-"+offsetAtEnd+"px"
        } else {
          blocks.style["transition-duration"] = "0s"
          blocks.style["margin-left"] = "-"+elapsedPixels+"px"
        }
      })

    baseBridge.defineFunction([
      init,
      updateBlocks],
      function onYouTubePlayerAPIReady(init, updateBlocks) {

        function stateToString(state) {
          return {
            "-1": "unstarted",
            "0": "ended",
            "1": "playing",
            "2": "paused",
            "3": "buffering",
            "5": "video cued",
          }[state.data.toString()]}

        var player = new YT.Player(
          "player",{
          "height": "360",
          "width": "640",
          "videoId": "Z7Seugla9KM",
          "events": {
            "onReady": function() {
              init(
                player.getDuration())},
            "onStateChange": function(state) {
              updateBlocks(
                stateToString(state),
                player.getDuration(),
                player.getCurrentTime())
            },
          }})
      })

    var page = [
      element({
        "id": "player"}),
      element(".timeline",
        element(".blocks")),
      element(
        "button.unselected",
        "Mark as interesting"),
      " ",
      element(
        "button.unselected  ",
        "Mark as boring"),
    ]

    site.start(1010)

    site.addRoute(
      "get",
      "/",
      baseBridge.requestHandler(page))
  }
)
