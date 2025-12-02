export { landingPage };

function landingPage(docObj) {
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
        console.log("user resumes the game")
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
          
          // add event listeners to the buttons
          // "Show the dialog" button opens the dialog modally
          showButton.addEventListener("click", () =>
            showTopTen(docObj, api, sceneId, dialog)
        );
        
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
        console.log(docObj.cookie)
        // and removes the unnecessary text areas from the page for game mode
        startButton.setAttribute("disabled", true)
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

setupresponse(API_URL); // this value is replaced at runtime by webpack (the real value is in the webpack config files)
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
  const sceneSection = docObj.querySelector(".game > section:last-of-type");
  console.log("ss: ", sceneSection);
  const image = new Image();
  image.src = sceneData.url;
  image.alt = "scene";
  sceneSection.appendChild(image);
  
  return image;
}

async function showTopTen(docObj, api, sceneId, dialog) {
  dialog.showModal();
  
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
    if (topTen.topTen.length === 0) {
      const paragraphEl = docObj.querySelector("#top-ten-dialog>p");
      paragraphEl.innerText = "No top scores recorded yet! Be the first!";
    } else {
      // display the list of players and their scores in the topTen.topTen array
      
      // and highlight the current player in the list
      const currentGameId = topTen.id;
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
    sceneImage.style.maxWidth = "calc(100% - 2rem)";
    resolutionButton.classList.add("offPos");
    resolutionButton.classList.remove("onPos");
  }
}

