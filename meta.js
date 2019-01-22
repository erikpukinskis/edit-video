var library = require("module-library")(require)

// People to edit:
// https://www.youtube.com/watch?v=yha8PPlh7cQ


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
        "margin-left": "50px",
        "padding": "5px 0"}),

      element.style(
        ".blocks",{
        "transition-timing-function": "linear",
        "white-space": "nowrap"}),

      element.style(
        ".block",{
        "display": "inline-block",
        "line-height": "45px",
        "text-align": "center",
        "font-size": "12px",
        "color": "white",
        "margin-right": "5px",
        "width": "45px",
        "height": "45px",
        "background": "gray",

        ".interesting": {
          "background": "#0ad188"},
      }),
    ])

    baseBridge.addToHead(stylesheet)

    var state = baseBridge.defineSingleton(
      "state",
      function() {
        return {
          "player": null,
          "interestingMode": null}})

    var updateBlocks = baseBridge.defineFunction([
      state],
      function updateBlocks(state) {

        var playerState = state.playerState
        var duration = state.player.getDuration()
        var currentTime = state.player.getCurrentTime()

        var blocks = document.querySelector(".blocks")
        var elapsedPixels = currentTime*2 * 50
        var offsetAtEnd = duration*2*50
        var timeToEnd = duration - currentTime

        blocks.style["transition-duration"] = "0s"
        blocks.style["margin-left"] = "-"+elapsedPixels+"px"

        if (playerState == "playing") {
          setTimeout(function() {
            blocks.style["transition-duration"] = timeToEnd+"s"
            blocks.style["margin-left"] = "-"+offsetAtEnd+"px"
          })
        }
      })

    var getCurrentBlockId = baseBridge.defineFunction([
      state],
      function getCurrentBlockId(state) {
        return Math.floor(state.player.getCurrentTime() * 2)})

    var setBlockInteresting = baseBridge.defineSingleton([
      state,
      getCurrentBlockId],
      function(state, getCurrentBlockId) {

        function setBlockInteresting(fromBlockId, isInteresting) {

          var blockId = getCurrentBlockId()


          // If no interestingness was passed, it's because we changed state to playing again, and we just want to use the store mode and start from here

          if (typeof fromBlockId == "undefined") {
            fromBlockId = blockId
          }
          if (typeof isInteresting == "undefined") {
            isInteresting = state.interestingMode
          }

          // If the interesting mode has changed since we started this recursive loop, give up. toggleInterestingMode will start a new loop

          if (state.interestingMode != isInteresting) {
            return
          }

          document.querySelector(".block-"+blockId).classList[isInteresting ? "add" : "remove"]("interesting")

          var secondsAtBlockEnd = blockId * 0.5 + 0.5

          var secondsToNextBlock = secondsAtBlockEnd - state.player.getCurrentTime()

          // If we're playing, we're going to want to set a timeout to do this again. If not we're just done.

          if (state.playerState != "playing") { return }

          setTimeout(
            setBlockInteresting.bind(null, blockId, isInteresting),
            secondsToNextBlock*1000)}

        return setBlockInteresting
      })

    var toggleInterestingMode = baseBridge.defineFunction([
      state, setBlockInteresting, getCurrentBlockId],
      function toggleInterestingMode(state, setBlockInteresting, getCurrentBlockId, isInteresting) {

        function getButton(isInteresting) {
          return document.querySelector((isInteresting ? ".interesting" : ".boring")+"-button")
        }

        if (state.interestingMode != isInteresting) {
          var button = getButton(isInteresting) 
          var otherButton = getButton(!isInteresting)
          button.classList.remove("unselected")
          button.classList.add("selected")
          otherButton.classList.remove("selected")
          otherButton.classList.add("unselected")

          state.interestingMode = isInteresting

        } else {
          var button = getButton(state.interestingMode)           
          button.classList.remove("selected")
          button.classList.add("unselected")

          state.interestingMode = null

        }


        setBlockInteresting(getCurrentBlockId(), isInteresting)
      })



    // Initialize blocks

    var init = baseBridge.defineFunction([
      bridgeModule(lib, "web-element", baseBridge),
      bridgeModule(lib, "add-html", baseBridge)],
      function init(element, addHtml, duration) {
        var blockCount = duration*2

        var html = ""
        for(var i=0; i<blockCount; i++) {
          var seconds = Math.floor(i/2)
          var remainder = i/2 - seconds > 0.1
          var minutes = Math.floor(seconds/60)
          var seconds = seconds - 60*minutes
          var label = seconds
          if (remainder) {
            label += "b"
          }
          if (minutes) {
            label = minutes+"m"+label
          }

          html += element(".block.block-"+i, label).html()
        }

        var blocks = document.querySelector(".blocks")

        blocks.innerHTML = html
      })



    // YouTube Player Interface

    baseBridge.defineFunction([
      state,
      init,
      updateBlocks,
      setBlockInteresting],
      function onYouTubePlayerAPIReady(state, init, updateBlocks, setBlockInteresting) {

        function stateToString(playerState) {
          return {
            "-1": "unstarted",
            "0": "ended",
            "1": "playing",
            "2": "paused",
            "3": "buffering",
            "5": "video cued",
          }[playerState.data.toString()]}

        var player = state.player = new YT.Player(
          "player",{
          "height": "360",
          "width": "640",
          "videoId": "Z7Seugla9KM",
          "events": {
            "onReady": function() {
              init(
                player.getDuration())},
            "onStateChange": function(playerState) {
              state.playerState = stateToString(playerState)
              updateBlocks()
              if (state.playerState == "playing" && state.interestingMode != null) {
                  setBlockInteresting()
              }
            },
          }})
      })



    // Build the page

    var page = [
      element({
        "id": "player"}),
      element(".timeline",
        element(".blocks")),
      element(
        "button.unselected.interesting-button",
        "Mark as interesting",{
        "onclick": toggleInterestingMode.withArgs(true).evalable()}),
      " ",
      element(
        "button.unselected.boring-button",
        "Mark NOT interesting",{
        "onclick": toggleInterestingMode.withArgs(false).evalable()}),
    ]

    site.start(1010)

    site.addRoute(
      "get",
      "/",
      baseBridge.requestHandler(page))
  }
)
