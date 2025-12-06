export { landingPage };

  let imageListener;

async function landingPage(docObj) {
  const dialog = docObj.querySelector("#top-ten-dialog");
  const startButton = docObj.querySelector("#start");
  const showButton = docObj.querySelector("#show-top-ten");
  const closeButton = docObj.querySelector("dialog button");
  const resolutionButton = docObj.querySelector("#resolution");
  const gameSections = docObj.querySelectorAll(".game");
  const messageEl = docObj.querySelector("#message");
  const topTenMessageEl = docObj.querySelector("#top-ten-message");
  


  // get the game response and characters to setup the play
  const setupresponse = async (api) => {
    // first check that this is not a continuation of an existing session
    
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    try {
      const checkResumeResponse = await fetch(`${api}/resumeGame`, {
        method: "GET",
        headers: headers,
        credentials: "include",
      });
      let resumedGame = false;
      if (checkResumeResponse.ok || checkResumeResponse.status === 304) {
        const checkResume = await checkResumeResponse.json();
        resumedGame = checkResume.message === "true";
      }
      
      if (resumedGame) {
        console.log("user resumes the game");
        // unblur the scene & disble the start button to hide its section
        startButton.setAttribute("disabled", true);
        const sceneSection = docObj.querySelector(
          ".game > section:last-of-type"
        );
        sceneSection.classList.remove("blur");
      } else {
        const sceneSection = docObj.querySelector(
          ".game > section:last-of-type"
        );
        sceneSection.classList.add("blur"); // we start out with a blurred image until the game is started officially

      }
      
      const response = await fetch(`${api}/scene`, {
        method: "GET",
        headers: headers,
        credentials: "include",
      });
      console.log("response type: ", response.type);
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError("Oops, we haven't got JSON!");
      }
      
      if ((response.ok || response.status === 304) && response.body) {
        const sceneData = await response.json();
        console.log(sceneData);
        const sceneId = sceneData.id;
        const secondResponse = await fetch(
          `${api}/scene/${sceneId}/characters`,
          {
            method: "GET",
            headers: headers,
            credentials: "include",
          }
        );
        if (
          (secondResponse.ok || secondResponse.status === 304) &&
          secondResponse.body
        ) {
          const characterData = await secondResponse.json();
          
          // prepare the scene image for display
          const sceneImage = updateSceneImage(docObj, sceneData);
          
          // display the characters
          let sceneCharacters = updateCharactersList(docObj, characterData);
          
          // prepare statement on the scene characters
          //const sceneCharacters = characterData.characters.reduce((acc, el, i, arr) => i < arr.length - 1 ? acc += ", " + el : acc += " and " + el)
          const h1 = `Let's find ${sceneCharacters}!`;
          const h2 = `This game will be timed! Will your time earn you a place in the top ten ?`;
          messageEl.innerText = h1;
          topTenMessageEl.innerText = h2;
          
          // add event listener to the scene
          
          imageListener = (e) =>
            displayChoice(e, docObj, api, { sceneId, imgRef: sceneImage });
          sceneImage.addEventListener("mousedown", imageListener);
          
          // "Show the dialog" button opens the dialog modally
          showButton.addEventListener("click", (e) =>
            showTopTen(e, docObj, api, sceneId, dialog));
          
          // "Close" button closes the dialog
          closeButton.addEventListener("click", () => {
            dialog.close();
          });
          
          resolutionButton.addEventListener("click", () =>
            resolutionToggle(resolutionButton, sceneImage)
          );
          
        startButton.addEventListener("click", async () => {
          // starts the game
          const gameData = getGameData(api);
          console.log("game has started: ", gameData);
          console.log(docObj.cookie);
          // and removes the unnecessary text areas from the page for game mode
          startButton.setAttribute("disabled", true);
          // and unblurs the scene
          
          const sceneSection = docObj.querySelector(
            ".game > section:last-of-type"
          );
          sceneSection.classList.remove("blur");
        });
        // show the sections on the page at last
        gameSections.forEach((el) => {
          el.toggleAttribute("hidden");
        });
      }
    } else {
      console.log(response);
      displayGeneralError(messageEl);
    }
  } catch (error) {
    console.log("caught an internal error");
    displayGeneralError(messageEl);
    console.error(error.message);
  }
};

await setupresponse(API_URL); // this value is replaced at runtime by webpack (the real value is in the webpack config files)
}

function displayGeneralError(messageEl) {
  messageEl.innerHTML =
  "<h1>Sorry, something went wrong. We weren't able to setup a game for you to play. Please try again later.";
}

function updateCharactersList(docObj, characterData) {
  const charactersList = docObj.querySelector("#characters");

  let sceneCharacters = "";
  
  characterData.characters.forEach((el, i, arr) => {
    console.log(el);
    const listItem = docObj.createElement("li");
    const labelEl = docObj.createElement("label");
    labelEl.innerText = el.name;
    const pic = new Image();
    pic.src = el.url;
    pic.alt = el.name;
    sceneCharacters +=
    i >= 0 && i < arr.length - 1 ? `${el.name}, ` : `and ${el.name}`;
    
    labelEl.appendChild(pic);
    listItem.appendChild(labelEl);
    charactersList.appendChild(listItem);
  });
  return sceneCharacters;
}

async function getGameData(api) {
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  const getGameResponse = await fetch(`${api}/game`, {
    method: "GET",
    headers: headers,
    credentials: "include",
  });
  if (
    (getGameResponse.ok || getGameResponse.status === 304) &&
    getGameResponse.body
  ) {
    const gameData = await getGameResponse.json();
    return gameData;
  } else {
    throw new Error("Failed to get game data");
  }
}

function updateSceneImage(docObj, sceneData) {
  const sceneSection = docObj.querySelector("#scene");
  
  const imageEnclosure = docObj.querySelector("#image-enclosure");

  console.log("ss: ", sceneSection);
  const image = new Image();
  image.src = sceneData.url;
  image.alt = "scene";
  imageEnclosure.appendChild(image);
  
  return image;
}

      /**
      * sample topten when the first user gets into it
      * {
      "message": "Success",
      "id": 1,
      "topTen": [
      {
      "id": 1,
      "username": "anonymous",
      "elapsed_time": "00:00:25.148"
      }
      ]
      }
      */
async function showTopTen(e, docObj, api, sceneId, dialog) {
  
  // if e.detail is set, we can check the key inTopTen to see whether the user gets to enter their username or not
  dialog.showModal();
  
  const topTenForm = docObj.querySelector("#top-ten");

  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  const ttResponse = await fetch(`${api}/scene/${sceneId}/topten`, {
    method: "GET",
    headers: headers,
    credentials: "include",
  });
  if ((ttResponse.ok || ttResponse.status === 304) && ttResponse.body) {
    const topTen = await ttResponse.json();
    console.log(topTen);
      const paragraphEl = docObj.querySelector("#top-ten-dialog>p");
    if (topTen.topTen.length === 0) {
      
      paragraphEl.innerText = "No top scores recorded yet! Be the first!";
    } else {
      // display the list of players and their scores in the topTen.topTen array
      paragraphEl.innerText = "Top 10"
      // and highlight the current player in the list
      const currentGameId = topTen.id;
      const topTenList = docObj.createElement("ol");
      topTenList.setAttribute("id","top-ten-list")
      topTenList.classList.add("toptenlist")
      topTen.topTen.forEach(el => {
        const listEl = docObj.createElement("li")
        
        const nameListItem = docObj.createElement("div")
        if (el.id === topTen.id) {
          listEl.classList.add("shimmer");
          const inputEl = docObj.createElement("input")
          inputEl.setAttribute("type", "text");
          inputEl.setAttribute("id", "username");
          if (el.username === "anonymous") {
            inputEl.setAttribute("placeholder", "Enter your name");
          } else {
            inputEl.value = el.username;
          }
          inputEl.setAttribute("name", "username")
          const saveBtn = docObj.createElement("button");
          saveBtn.setAttribute("type", "submit");
          saveBtn.innerText = "\u2714";
          nameListItem.appendChild(inputEl)
          nameListItem.appendChild(inputEl)
          
          nameListItem.appendChild(saveBtn);
        } else {
          nameListItem.innerText = el.username;
        }
        topTenList.appendChild(nameListItem);
        const timeListItem = docObj.createElement("div");
        const len = el["elapsed_time"].length;
        timeListItem.innerText = el["elapsed_time"].slice(0, len - 4) 
        listEl.appendChild(nameListItem);
        listEl.appendChild(timeListItem);
        topTenList.appendChild(listEl);
        console.log(el)
      })
      console.log("the top ten list: ", topTenList)
      topTenForm.appendChild(topTenList);
    }
  }
}

function resolutionToggle(resolutionButton, sceneImage) {
  // toggle the resolution from 100% of screen width to its normal high-res width
  const maxWidth = getComputedStyle(sceneImage)["max-width"];
  if (maxWidth !== "none") {
    sceneImage.style.maxWidth = "none";
    resolutionButton.classList.remove("offPos");
    resolutionButton.classList.add("onPos");
  } else {
    sceneImage.style.maxWidth = "100%";
    resolutionButton.classList.add("offPos");
    resolutionButton.classList.remove("onPos");
  }
}

async function displayChoice(e, docObj, api, {sceneId, imgRef}) {
  // hide the wrong answer div in case it is currently visible
  const wrongAnswerDiv = docObj.querySelector("#wrong");
  wrongAnswerDiv.style.visibility = "hidden";
  
  const gameData = await getGameData(api);
  console.log(gameData);
  const characterData = gameData.game.scene.characters;
  
  const imgLength = Math.min(
    stripPx(getComputedStyle(imgRef).width),
    stripPx(getComputedStyle(imgRef).height)
  );
  
  const oldMenuRef = docObj.querySelector("#menu");
  const parentEl = oldMenuRef.parentElement;
  const menuRef = docObj.createElement("ul");
  menuRef.setAttribute("id", "menu");
  parentEl.replaceChild(menuRef, oldMenuRef); // have to do this to get rid of unused event listeners from previous clicks
  
  const targetWindowRef = document.querySelector("#targetting-window");
  const targetWindowSize = Math.floor((imgLength * 1.9) / 100);
  console.log({ widthOfImage: imgLength, targetWindowSize });
  targetWindowRef.style.width = makePx(targetWindowSize); // this is needed to recalculate the size based on the current scene resolution
  
  // setup the menu's contents with the character names
  menuRef.innerHTML = ""; //clear the list then add the names
  characterData.forEach((el) => {
    const listItem = docObj.createElement("li");
    listItem.innerText = el;
    menuRef.appendChild(listItem);
  });
  
  // what are the menu's height and width?
  const menuHeight = menuRef.offsetHeight;
  const menuWidth = menuRef.offsetWidth;
  
  // the apothem is the distance from the center of the square to the midpoint of the side
  const targetWindowApothem = targetWindowSize >> 1; //divide by 2
  console.log({ targetWindowApothem });
  
  // image boundary
  const imgRect = imgRef.getBoundingClientRect();
  console.log("image rect top left corner in the page: ", imgRect.x, imgRect.y);
  
  // what are the image's top left corner coordinates to orient ourselves to?
  const relY = Math.floor(Number(e.clientY) - Math.abs(imgRect.top));
  const relX = Math.floor(Number(e.clientX) - Math.abs(imgRect.left));
  
  // the viewable max width and height of the image
  const viewWidth = window.innerWidth || docObj.documentElement.clientWidth;
  const viewHeight = window.innerHeight || docObj.documentElement.clientHeight;
  
  console.log(
    "(clientX,clientY, relX, relY): ",
    e.clientX,
    e.clientY,
    relX,
    relY
  );
  console.log(
    "(viewWidth,viewHeight)",
    docObj.documentElement.clientWidth,
    docObj.documentElement.clientHeight
  );
  
  let menuLeft = relX;
  let menuTop = relY;
  
  if (e.clientX + menuWidth > viewWidth - 10) {
    //switch directions and show the menu on the left of the click
    menuLeft -= menuWidth + 15;
    console.log(`instead of X ${e.clientX} move to ${menuLeft}`);
    menuRef.setAttribute("data-left", true);
  } else {
    menuLeft += 15;
  }
  
  if (e.clientY + menuHeight > viewHeight - 10) {
    //switch directions and show the menu on the top of the click
    console.log("show above");
    menuTop -= menuHeight;
    menuRef.setAttribute("data-top", true);
  }
  
  // offset due to scrolling or other elements on the page taking space
  const xOffset = Math.abs(imgRect.x) + window.scrollX;
  const yOffset = Math.abs(imgRect.y) + window.scrollY;
  
  console.log("xOffset: ", xOffset);
  console.log("yOffset: ", yOffset);
  
  // now position the menu to the final position
  menuRef.style.left = makePx(menuLeft + xOffset);
  menuRef.style.top = makePx(menuTop + yOffset);
  menuRef.style.visibility = "visible";
  menuRef.classList.add("shimmer");
  
  // as for the targetting window, center it around the clicked position
  targetWindowRef.style.left = makePx(relX - targetWindowApothem + xOffset);
  targetWindowRef.style.top = makePx(relY - targetWindowApothem + yOffset);
  targetWindowRef.style.visibility = "visible";
  targetWindowRef.classList.add("shimmer");
  targetWindowRef.style.borderWidth = makePx(
    Math.min((0.005 * imgLength).toFixed(2), 3)
  );
  
  // add the event listener for the character menu
  const once = {
    once: true,
  };
  menuRef.addEventListener(
    "click",
    (e) => {
      menuRef.style.visibility = "hidden";
      characterChoiceHandler(
        e.target,
        docObj,
        api,
        
        (e.clientX - imgRect.x).toFixed(2),
        (e.clientY - imgRect.y).toFixed(2),
        
        { sceneId, imgRef, imgRect }
      );
    },
    once,
    true
  );
}

function makePx(str) {
  return `${str}px`;
}

function stripPx(str) {
  return Number(str.slice(0, str.length - 2));
}

async function characterChoiceHandler(target, docObj, api, x, y, { sceneId, imgRef, imgRect }) {
  console.log(
    "in characterChoiceHandler: ",
    target.innerText,
    x,
    y,
    imgRef.naturalWidth,
    imgRef.naturalHeight
  );
  
  let normalizedX = (
    (x / imgRect.width) *
    100
  ).toFixed(2);
  if (normalizedX > 100) {
    normalizedX = 100;
    console.log("how did I get more than 100%? ",x, " / ", imgRef.naturalWidth)
  }
  let normalizedY = (
    ((y / imgRect.height) *
    100)
  ).toFixed(2);
  if (normalizedY > 100) {
    normalizedY = 100;
    
    console.log(
      "how did I get more than 100%? ",
      y,
      " / ",
      imgRef.naturalHeight
    );
  }
  console.log("normalized to: ", normalizedX, normalizedY);
  const selectedCharacter = target.textContent;
  console.log("selected Character: ", target, selectedCharacter);
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  const getGameResponse = await fetch(
    `${api}/game/answer?x=${normalizedX}&y=${normalizedY}&character=${selectedCharacter}`,
    {
      method: "PUT",
      headers,
      credentials: "include",
    }
  );
  if (getGameResponse.ok && getGameResponse.body) {
    console.log("if it is the correct answer");
    const gameData = await getGameResponse.json();
    console.log(gameData);
    // start by tagging the character selected with the name
    
    const targettingWindow = docObj.querySelector("#targetting-window");
    const tagWindow = docObj.createElement("div");
    tagWindow.style.borderRadius = "50%";
    tagWindow.style.width = targettingWindow.style.width;
    tagWindow.style.aspectRatio = 1;
    tagWindow.style.top = targettingWindow.style.top;
    tagWindow.style.left = targettingWindow.style.top;
    tagWindow.innerText = selectedCharacter;
    tagWindow.classList.add("tag");

    const sceneEl = docObj.querySelector("#scene");
    sceneEl.appendChild(tagWindow);
    if (gameData.inTopTen && gameData["end_time"]) {
      console.log(
        "found all the answers! Time to check the top ten list to see if this user made it or not"
      );
      const inTopTen = gameData.inTopTen === "true";
      
      // stop listening to scene clicks
      imgRef.removeEventListener("mousedown", imageListener);
      
      const topTenResponse = await fetch(`${api}/scene/${sceneId}/topten`, {
        method: "GET",
        headers,
        credentials: "include",
      });
      if (topTenResponse.ok && topTenResponse.body) {
        // check if the user id is in the list of top ten scores and if yes, trigger the top ten dialog
        
        const topTenData = await topTenResponse.json();
        console.log(
          "did the user get into the top ten? check the id: ",
          inTopTen,
          topTenData
        );
        const showButton = docObj.querySelector("#show-top-ten");
        
        showButton.dispatchEvent(
          new Event("click")
        );
      }
    }
  } else if (getGameResponse.status === 400) {
    // this is the wrong answer or a validation error has happened.
    
    const gameData = await getGameResponse.json();
    console.log(gameData);
    if (gameData.message === "Wrong answer") {
      showWrongAnswerMsg(docObj);
    }
  }
}

function showWrongAnswerMsg(docObj) {
  const wrongAnswerDiv = docObj.querySelector("#wrong");
  const menuRef = docObj.querySelector("#menu");
  const targettingWindow = docObj.querySelector("#targetting-window");
  targettingWindow.style.anchorName = "--msg-anchor";
  wrongAnswerDiv.style.positionAnchor = "--msg-anchor";
  wrongAnswerDiv.style.position = "fixed";
  wrongAnswerDiv.style.opacity = ".85";
  wrongAnswerDiv.style.positionArea = "";
  wrongAnswerDiv.style.visibility = "visible";
  wrongAnswerDiv.style.width = "max-content";
  
  if (menuRef.getAttribute("data-top") === "true") {
    console.log("found data-top: ", stripPx(menuRef.style.top));
    //wrongAnswerDiv.style.top = makePx(stripPx(menuRef.style.top) + 60); // relocate the msg as it is only one line compared to the menu
    
    wrongAnswerDiv.style.positionArea += "top";
  } else {
    wrongAnswerDiv.style.positionArea += "bottom";
  }
  if (menuRef.getAttribute("data-left") === "true") {
    console.log("found data-left: ", stripPx(menuRef.style.left));
    // wrongAnswerDiv.style.left = makePx(stripPx(menuRef.style.left) + 50); //relocate the msg as it is shorter than the menu
    wrongAnswerDiv.style.positionArea += " left"
    
  } else {
    wrongAnswerDiv.style.positionArea += " right";
  }
}