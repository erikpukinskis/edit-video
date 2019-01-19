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

    var page = [
      element({
        "id": "player"}),
      element({
        "class": "blocks"}),
      element(
        "button.unselected",
        "Mark as interesting"),
      " ",
      element(
        "button.unselected  ",
        "Mark as boring"),
    ]

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
        ".blocks",{
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
      function init(element, addHtml, player) {
        var duration = player.getDuration()
        var blockCount = duration*2
        var blocks = document.querySelector(".blocks")

        var html = ""
        for(var i=0; i<blockCount; i++) {
          html += element(".block").html()
        }
        blocks.innerHTML = html
      })

    baseBridge.defineFunction([
      init],
      function onYouTubePlayerAPIReady(init) {

        var player = new YT.Player(
          "player",{
          "height": "360",
          "width": "640",
          "videoId": "Z7Seugla9KM",
          "events": {
            "onReady": function() {
              init(
                player)}}})
      })

    site.start(1010)

    site.addRoute(
      "get",
      "/",
      baseBridge.requestHandler(page))
  }
)
