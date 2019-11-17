var library = require("module-library")(require)

module.exports = library.export(
  "edit-video",[
  library.ref(),
  "web-element",
  "add-html",
  "bridge-module",
  "basic-styles"],
  function(lib, element, addHtml, bridgeModule, basicStyles) {

    function editVideo(bridge) {

      var funcs = prepareBridge(bridge)

      // Build the page

      var page = element(".page",[
        element({
          "id": "player"}),
        element(".timeline",
          element(".blocks")),
        element(
          "button.unselected.interesting-button",
          "Mark as interesting",{
          "onclick": funcs.toggleInterestingMode.withArgs(true).evalable()}),
        " ",
        element(
          "button.unselected.boring-button",
          "Clear interesting marks",{
          "onclick": funcs.toggleInterestingMode.withArgs(false).evalable()}),
        element("p",
          element(
            "button",
            "Play only interesting",{
            "onclick": funcs.playOnlyInteresting.evalable()})),
      ])

      var body = element(
        "body",{
        "onkeydown": funcs.handleKeyboardShortcut.withArgs(
            bridge.event)
            .evalable()},
        page)

      bridge.send(body)
    }

    function prepareBridge(bridge) {
      if (bridge.remember(
        "video-editor")) {
          return }

      basicStyles.addTo(bridge)

      bridge.addToHead(
        element(
          "script",{
          "src": "https://www.youtube.com/player_api"}))

      basicStyles.addTo(bridge)

      bridge.addToHead(
        element(
          "script",{
          "src": "https://www.youtube.com/player_api"}))

      bridge.addToHead(stylesheet)

      var state = bridge.defineSingleton(
        "state",
        function() {
          return {
            "player": null,
            "blockCount": null,
            "interestingMode": null,
            "isBlockInteresting": {}}
        })

      var updateBlocks = bridge.defineFunction([
        state],
        function updateBlocks(state, time) {
          if (state.pauseOnPlay) {
            return
          }
          var playerState = state.playerState
          var duration = state.player.getDuration()
          if (typeof time != "undefined") {
            var currentTime = time
          } else {
            var currentTime = state.player.getCurrentTime()
          }
          console.log("time seems to be "+currentTime)

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

      var getCurrentBlockId = bridge.defineFunction([
        state],
        function getCurrentBlockId(state) {
          return Math.floor(state.player.getCurrentTime() * 2)})

      var setBlockInteresting = bridge.defineFunction([
        state],
        function setBlockInteresting(state, blockId, isInteresting) {

          var wasInteresting = state.isBlockInteresting[blockId]

          if (isInteresting === wasInteresting) {
            return
          }

          state.isBlockInteresting[blockId] = isInteresting

          var el = document.querySelector(".block-"+blockId)

          if (isInteresting) {
            el.classList.add("interesting")
          } else {
            el.classList.remove("interesting")
          }
        })

      var toggleBlockInteresting = bridge.defineFunction([
        state,
        setBlockInteresting],
        function toggleBlockInteresting(state, setBlockInteresting, blockId) {
          var wasInteresting = state.isBlockInteresting[blockId]
          setBlockInteresting(blockId, !wasInteresting)
          var startTime = (blockId - 2)/2
          state.player.seekTo(startTime)
          setTimeout(function() {
            state.player.pauseVideo()
          }, 2000)
        })

      var updateCurrentBlockInteresting = bridge.defineSingleton(
        "updateCurrentBlockInteresting",[
        state,
        getCurrentBlockId,
        setBlockInteresting],
        function(state, getCurrentBlockId, setBlockInteresting) {

          function updateCurrentBlockInteresting(fromBlockId, isInteresting) {

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

            setBlockInteresting(blockId, isInteresting)

            var secondsAtBlockEnd = blockId * 0.5 + 0.5

            var secondsToNextBlock = secondsAtBlockEnd - state.player.getCurrentTime()

            // If we're playing, we're going to want to set a timeout to do this again. If not we're just done.

            if (state.playerState != "playing") { return }

            setTimeout(
              updateCurrentBlockInteresting.bind(null, blockId, isInteresting),
              secondsToNextBlock*1000)}

          return updateCurrentBlockInteresting
        })

      var toggleInterestingMode = bridge.defineFunction([
        state,
        updateCurrentBlockInteresting,
        getCurrentBlockId],
        function toggleInterestingMode(state, updateCurrentBlockInteresting, getCurrentBlockId, isInteresting) {

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


          updateCurrentBlockInteresting(getCurrentBlockId(), isInteresting)
        })



      // Initialize blocks

      var init = bridge.defineFunction([
        state,
        bridgeModule(lib, "web-element", bridge),
        bridgeModule(lib, "add-html", bridge),
        toggleBlockInteresting.asCall()],
        function init(state, element, addHtml, toggleBlockInteresting, duration) {
          var blockCount = state.blockCount = duration*2

          var html = ""
          for(var blockId=0; blockId<blockCount; blockId++) {
            var seconds = Math.floor(blockId/2)
            var isSecondHalf = blockId/2 - seconds > 0.1
            var minutes = Math.floor(seconds/60)
            var seconds = seconds - 60*minutes
            var label = seconds
            if (isSecondHalf) {
              label += "b"
            }
            if (minutes) {
              label = minutes+"m"+label
            }

            var el = element(
              ".block.block-"+blockId,
              label,{
              "onclick": toggleBlockInteresting.withArgs(blockId).evalable()
              })

            html += el.html()
          }

          var blocks = document.querySelector(".blocks")

          blocks.innerHTML = html
        })

      var seekAndSchedule = bridge.defineSingleton([
        state],
        function(state) {

          function seekAndSchedule(blockId) {

            if (blockId == state.blockCount) {
              state.player.pauseVideo()
              return }          
            var seconds = blockId/2

            state.player.seekTo(
              seconds)

            if (state.playerState != "playing") {
              state.player.playVideo()
            }

            while(state.isBlockInteresting[blockId] && blockId < state.blockCount) {
              blockId++ }

            if (blockId == state.blockCount) {
              return }

            var secondsAtSegmentEnd = blockId/2+0.5

            var secondsTilNextSeek = secondsAtSegmentEnd - seconds

            while(!state.isBlockInteresting[blockId] && blockId < state.blockCount) {
              blockId++ }

            setTimeout(
              seekAndSchedule.bind(
                null,
                blockId),
              secondsTilNextSeek*1000)}

          return seekAndSchedule
        })

      var firstInterestingBlockAfter = bridge.defineFunction([
        state],
        function firstInterestingBlockAfter(state, afterId) {
          var blockId = afterId

          while(!state.isBlockInteresting[blockId] && blockId < state.blockCount) {
            blockId++
          }

          if (blockId != state.blockCount) {
            return blockId
          }
        })

      var playOnlyInteresting = bridge.defineFunction([
        state,
        seekAndSchedule,
        toggleInterestingMode],
        function(state, seekAndSchedule) {

          if (!state.interestingMode != null) {
            toggleInterestingMode(state.interestingMode)
          }

          var blockId = firstInterestingBlockAfter(0)



          seekAndSchedule(blockId)
        })

      var handleKeyboardShortcut = bridge.defineFunction([
        state,
        updateBlocks],
        function handleKeyboardShortcut(state, updateblocks, event) {
          if (event.key == "k") {
            if (state.playerState == "playing") {
              state.player.pauseVideo()
            } else {
              state.player.playVideo()
            }
          } else if (event.key == "ArrowRight" || event.key == "ArrowLeft") {
            console.log("YAW!")
            var dt = event.key == "ArrowRight" ? 6 : -6
            var targetTime = state.player.getCurrentTime()+dt
            targetTime = Math.max(0, targetTime)
            console.log("seeking to "+targetTime)
            state.player.seekTo(targetTime)
            updateBlocks(targetTime)
            if (typeof state.playerState == "undefined") {
              state.pauseOnPlay = true
            }
          }
        })


      // YouTube Player Interface

      bridge.defineFunction([
        state,
        init,
        updateBlocks,
        updateCurrentBlockInteresting],
        function onYouTubePlayerAPIReady(state, init, updateBlocks, updateCurrentBlockInteresting) {

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
            "events": events})


          var events = {
            "onReady": function() {
              init(
                player.getDuration())},
            "onStateChange": function(playerState) {
              state.playerState = stateToString(playerState)
              console.log(state.playerState+" state")
              updateBlocks()

              if (state.playerState == "playing" && state.pauseOnPlay) {
                state.player.pauseVideo()
                state.pauseOnPlay = false
                return
              }

              if (state.playerState == "playing" && state.interestingMode != null) {
                  updateCurrentBlockInteresting()
              }
            },
          }

          return state
        })

      var funcs = {
        toggleInterestingMode: toggleInterestingMode,
        playOnlyInteresting: playOnlyInteresting,
        handleKeyboardShortcut: handleKeyboardShortcut }

      bridge.see(
        "video-editor", 
        funcs)

      return funcs // end prepareBridge
    }

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
        "margin-left": "320px",
        "padding": "5px 0",
        "max-width": "100%"}),

      element.style(
        ".blocks",{
        "transition-timing-function": "linear",
        "white-space": "nowrap"}),

      element.style(
        ".page",{
        "max-width": "100%",
        "overflow-x": "hidden",
        "padding": "10px"}),

      element.style(
        "body",{
        "margin": "0"}),

      element.style(
        ".block",{
        "cursor": "pointer",
        "display": "inline-block",
        "padding": "none",
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

    return editVide
  }
)