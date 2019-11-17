var library = require("module-library")(require)

// People to edit:
// https://www.youtube.com/watch?v=yha8PPlh7cQ

library.using([
  "web-site",
  "browser-bridge",
  "./"],
  function(WebSite, BrowserBridge, editVideo) {

    var site = new WebSite()

    var baseBridge = new BrowserBridge()

    site.addRoute(
      "get",
      "/",
      function(request, response) {
        return editVideo(
          baseBridge.forResponse(
            response))})


    site.start(
      65535)})
