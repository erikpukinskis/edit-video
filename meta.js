var library = require("module-library")(require)

library.using([
  "web-site",
  "browser-bridge",
  "web-element"],
  function(WebSite, BrowserBridge, element) {

    var iframe = element({
      "id": "player"})

    var site = new WebSite()

    var baseBridge = new BrowserBridge()

    baseBridge.addToHead(
      element(
        "script",{
        "src": "https://www.youtube.com/player_api"}))

    baseBridge.defineFunction(
      function onYouTubePlayerAPIReady() {
        player = new YT.Player(
          "player",{
          "height": "360",
          "width": "640",
          "videoId": "Z7Seugla9KM"})
      })

    site.start(1010)

    site.addRoute(
      "get",
      "/",
      baseBridge.requestHandler(iframe))
  }
)
