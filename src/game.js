export { game };

let imageListener;

async function game(docObj, sceneId) {
  const dialog = docObj.querySelector("#top-ten-dialog");
  const startButton = docObj.querySelector("#start");
  const showButton = docObj.querySelector("#show-top-ten");
  const closeButton = docObj.querySelector("dialog button");
  const resolutionButton = docObj.querySelector("#resolution");
  const gameSections = docObj.querySelectorAll(".game");
  const messageEl = docObj.querySelector("#message");
  const topTenMessageEl = docObj.querySelector("#top-ten-message");

  // get the game response and characters to setup the play
  const setupResponse = async (api, sceneId) => {
    
    const sceneRoute = `${api}/scene/${sceneId}`;

    // first check that this is not a continuation of an existing session
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    try {
      const checkResumeResponse = await fetch(`${sceneRoute}/resumeGame`, {
        method: "GET",
        headers: headers,
        credentials: "include",
      });
      let resumedGame = false;
      let completedGame = false;
      if (checkResumeResponse.ok || checkResumeResponse.status === 304) {
        const checkResume = await checkResumeResponse.json();
        resumedGame = checkResume.message === "true";
      }
      messageEl.innerText = "";
      if (resumedGame) {
        console.log("user resumes the game");
        topTenMessageEl.innerText = "Game is ongoing.";
        // call GET /game/answers to get the location of the answers the user has given so we can tag them in the scene
        const answersResponse = await fetch(`${sceneRoute}/game`, {
          method: "GET",
          headers: headers,
          credentials: "include",
        });
        if (answersResponse.ok || answersResponse.status === 304) {
          // unblur the scene & disble the start button to hide its section
          startButton.setAttribute("disabled", true);
          const sceneSection = docObj.querySelector("#scene");
          sceneSection.classList.remove("blur");
          const gameData = await answersResponse.json();
            console.log(
              "the answers I need to tag: ",
              gameData.game
            );
          // figure out where previous character tags are in the image and add them to the screen if they're in view
          if (
            gameData.game.gameAnswers &&
            gameData.game.gameAnswers.length > 0
          ) {
            
            const sceneEl = docObj.querySelector("#scene");
            const existingTags = docObj.querySelectorAll(".tag"); 
            existingTags.forEach(el => sceneEl.removeChild(el));
            gameData.game.gameAnswers.forEach((el) =>
              setupTag(
                docObj,
                el.location_x,
                el.location_y,
                el.character_name.name
              )
            );
          }
          
          if (gameData.game.elapsed_time ) {
            // change the message next to the top ten to say to click the button to see your score
            updateMessages(docObj);
            completedGame = true;

            // make all the tags visible permanently
            const tags = docObj.querySelectorAll(".tag");
            tags.forEach((el) => {
              el.style.backgroundColor = "#ffffffc2";
              el.style.color = "black";
              el.style.width = "min-content";
              el.style.maxWidth = "min-content";
            });
          }
          
        } else {
          console.log(`Failed call to GET ${sceneRoute}/game/answers`);
          throw new TypeError("Oops, we can't resume your game right now!");
        }
      } else {
        const sceneSection = docObj.querySelector(
          ".game > section:last-of-type"
        );
        sceneSection.classList.add("blur"); // we start out with a blurred image until the game is started officially
      }

      const response = await fetch(`${sceneRoute}`, {
        method: "GET",
        headers: headers,
        credentials: "include",
      });
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError("Oops, we haven't got JSON!");
      }

      if ((response.ok || response.status === 304) && response.body) {
        const sceneData = await response.json();
        console.log(sceneData);
        //const sceneId = sceneData.id;
        const secondResponse = await fetch(
          `${sceneRoute}/characters`,
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
          const h2 = `This game will be timed! Will your time earn you a place in the top ten?`;
          if (!completedGame) {
            messageEl.innerText = h1;
            topTenMessageEl.innerText = h2;
          
            // add event listener to the scene
            // but only if there is still any characters to be found so need to fetch the game to check

            imageListener = (e) =>
              displayChoice(e, docObj, api, { sceneId, imgRef: sceneImage });
            sceneImage.addEventListener("mousedown", imageListener);
          }
          // "Show the dialog" button opens the dialog modally
          showButton.addEventListener("click", (e) =>
            showTopTen(e, docObj, api, sceneId, dialog)
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
            const gameData = await getGameData(sceneRoute);
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
        } else {
          console.log(`Failed call to GET ${sceneRoute}/game/answers`);
          throw new TypeError("Oops, we can't setup the game right now!");
        }
      } else {
        console.log(response);
        displayGeneralError(docObj);
      }
    } catch (error) {
      console.log("caught an internal error");
      displayGeneralError(docObj);
      console.error(error.message);
    }
  };

  try {
    await setupResponse(API_URL, sceneId); // this value is replaced at runtime by webpack (the real value is in the webpack config files)

    const image = docObj.querySelector("#image-enclosure > img");
    console.log("done setting up");
    console.log("width, height of image: ", image.width, image.height);
    console.log("image node: ", image);
    if (image) {
      // Create a resize observer and link it to another callback
      const rObserver = new ResizeObserver(imageResizeHandler);

      rObserver.observe(image);
    }
  } catch (error) {
    console.error(error);

    displayGeneralError(docObj);
  }
}

const imageResizeHandler = (entries) => {
  for (const entry of entries) {
    if (entry.contentBoxSize) {
      console.log("size? ", entry.contentBoxSize[0]);
      const targetWindowRef = document.querySelector("#targetting-window");
      const targetWindowSize = Math.floor(
        (entry.contentBoxSize[0].inlineSize * 1.9) / 100
      );
      targetWindowRef.style.width = makePx(targetWindowSize);
    }
  }
};

export function displayGeneralError(docObj) {
  const gameElements = docObj.querySelectorAll("main *:not(:first-child)");
  gameElements.forEach(el => el.innerHTML = "")
  const messageEl = docObj.querySelector("#message");
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

async function getGameData(sceneRoute) {
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  const getGameResponse = await fetch(`${sceneRoute}/game`, {
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
  image.classList.add("anchor");
  imageEnclosure.appendChild(image);

  return image;
}

async function showTopTen(e, docObj, api, sceneId, dialog) {
  console.log("in showTopTen after receiving a click event");
  const sceneRoute = `${api}/scene/${sceneId}`
  let inTopTen = false;

  // if e.detail is set, we can check the key inTopTen to see whether the user gets to enter their username or not
  dialog.showModal();

  const topTenForm = docObj.querySelector("#top-ten");
  const playerScoreEl = docObj.querySelector("#score");

  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  const ttResponse = await fetch(`${sceneRoute}/topten`, {
    method: "GET",
    headers: headers,
    credentials: "include",
  });
  if ((ttResponse.ok || ttResponse.status === 304) && ttResponse.body) {
    const topTen = await ttResponse.json();
    
    const paragraphEl = docObj.querySelector("#top-ten-dialog>p");
    console.log("topTen route response: ",topTen);
    if (topTen.topTen.length === 0) {
      paragraphEl.innerText = "No top scores recorded yet! Be the first!";
      topTenForm.style.display = "none";
    } else {
      topTenForm.style.display = "block";

      //listen to clicks. If the click is on edit, then edit, if it is on save, then save
      topTenForm.addEventListener("click", async (e) => {
        e.preventDefault();
        const inputEl = docObj.querySelector("#username");
        const nameListItem = e.target.parentElement;
        const listEl = nameListItem.parentElement;

        if (e.target.id === "save") {
          const formData = new FormData(topTenForm);

          // do not pass formData to the body unless you want to deal with multipart forms in the api
          const urlEncoded = new URLSearchParams();
          for (const [key, value] of formData.entries()) {
            urlEncoded.append(key, value);
          }

          const response = await fetch(`${sceneRoute}/game`, {
            method: "PUT",
            body: urlEncoded,
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            credentials: "include",
          });

          if ((response.ok || response.status === 304) && response.body) {
            const data = await response.json();
            console.log(data);
            if (e.target.parentElement === nameListItem) {
              nameListItem.removeChild(e.target);
              nameListItem.removeChild(inputEl);
            }
            listEl.classList.remove("shimmer");
            nameListItem.innerText = data.game.username;
            const editBtn = docObj.createElement("button");
            editBtn.innerText = "✏️";
            editBtn.setAttribute("type", "button");
            editBtn.setAttribute("id", "edit");
            nameListItem.appendChild(editBtn);
          }
        } else if (e.target.id === "edit") {
          // everything below is duplicated except value of username, so TODO put in a function
          nameListItem.removeChild(e.target);

          const username = nameListItem.innerText;
          nameListItem.innerText = "";
          listEl.classList.add("shimmer");
          const inputEl = docObj.createElement("input");
          inputEl.setAttribute("type", "text");
          inputEl.setAttribute("id", "username");
          inputEl.setAttribute("minlength", 1);
          inputEl.setAttribute("maxlength", 25);
          inputEl.value = username;
          inputEl.setAttribute("name", "username");

          const saveBtn = docObj.createElement("button");
          saveBtn.setAttribute("id", "save");
          saveBtn.setAttribute("type", "submit");
          saveBtn.innerText = "\u2714";
          nameListItem.appendChild(inputEl);
          nameListItem.appendChild(saveBtn);
        }
      });

      // display the list of players and their scores in the topTen.topTen array
      paragraphEl.innerText = "Top 10";
      // and highlight the current player in the list
      const currentGameId = topTen.id;
      const topTenList = docObj.createElement("ol");
      topTenList.setAttribute("id", "top-ten-list");
      topTenList.classList.add("toptenlist");
      topTen.topTen.forEach((el) => {
        const listEl = docObj.createElement("li");

        const nameListItem = docObj.createElement("div");
        if (el.id === topTen.id) {
          inTopTen = true;
          listEl.classList.add("shimmer");
          const inputEl = docObj.createElement("input");
          inputEl.setAttribute("type", "text");
          inputEl.setAttribute("id", "username");
          inputEl.setAttribute("minlength", 1);
          inputEl.setAttribute("maxlength", 25);
          if (el.username === "anonymous") {
            inputEl.setAttribute("placeholder", "Enter your name");
          } else {
            inputEl.value = el.username;
          }
          inputEl.setAttribute("name", "username");

          const saveBtn = docObj.createElement("button");
          saveBtn.setAttribute("id", "save");
          saveBtn.setAttribute("type", "submit");
          saveBtn.innerText = "\u2714";
          nameListItem.appendChild(inputEl);
          nameListItem.appendChild(saveBtn);
        } else {
          nameListItem.innerText = el.username;
        }
        //topTenList.appendChild(nameListItem);
        const timeListItem = docObj.createElement("div");
        const len = el["elapsed_time"].length;
        timeListItem.innerText = el["elapsed_time"].slice(0, len - 4);
        listEl.appendChild(nameListItem);
        listEl.appendChild(timeListItem);
        topTenList.appendChild(listEl);
        console.log(el);
      });
      console.log("the top ten list: ", topTenList);
      topTenForm.innerHTML = "";
      topTenForm.appendChild(topTenList);

      const scoreMsg = docObj.createElement('h1');
      playerScoreEl.innerHTML = "";
      
      const len = topTen?.elapsed_time?.length;
      if (inTopTen && len) {
        scoreMsg.innerText =
          `Amazing, you're in the Top Ten! You found all the characters in ${topTen.elapsed_time.slice(
            0,
            len-4
          )}`;
      } else {
        if (topTen.elapsed_time) {
          scoreMsg.innerText = `Well done! You found all the characters in ${topTen.elapsed_time.slice(0, len-4)}`
        }
      }
      playerScoreEl.appendChild(scoreMsg);
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

async function displayChoice(e, docObj, api, { sceneId, imgRef }) {
  // hide the wrong answer div in case it is currently visible
  const feedbackDiv = docObj.querySelector("#feedback");
  feedbackDiv.style.visibility = "hidden";

  const gameData = await getGameData(`${api}/scene/${sceneId}`);
  console.log(gameData);
  const characterData = gameData.game.scene.characters;

  if (characterData.length === 0) {
    // this game is done, don't respond to this click
    return;
  }
  const imgLength = Math.min(
    stripPx(getComputedStyle(imgRef).width),
    stripPx(getComputedStyle(imgRef).height)
  );

  const oldMenuRef = docObj.querySelector("#menu");
  const parentEl = oldMenuRef.parentElement;
  const menuRef = docObj.createElement("ul");

  menuRef.style.positionAnchor = "--msg-anchor"; //anchor around the targetting-window
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

  if (menuRef.getAttribute("data-top") === "true") {
    menuRef.style.positionArea += "top";
  } else {
    menuRef.style.positionArea += "bottom";
  }
  if (menuRef.getAttribute("data-left") === "true") {
    menuRef.style.positionArea += " span-left";
  } else {
    menuRef.style.positionArea += " span-right";
  }
  menuRef.style.visibility = "visible";
  menuRef.classList.add("shimmer");

  // as for the targetting window, center it around the clicked position

  const normalizedX = (
    ((e.clientX - targetWindowApothem - imgRect.x) * 100) /
    imgRef.width
  ).toFixed(3);
  const normalizedY = (
    ((e.clientY - targetWindowApothem - imgRect.y) * 100) /
    imgRef.height
  ).toFixed(3);

  console.log(
    "normalizedX, normalizedY: ",
    normalizedX,
    normalizedY,
    imgRef.width,
    imgRef.height
  );
  targetWindowRef.style.left = `anchor(${normalizedX}%)`;
  targetWindowRef.style.top = `anchor(${normalizedY}%)`;
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

        normalizedX,
        normalizedY,

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

async function characterChoiceHandler(
  target,
  docObj,
  api,
  normalizedX,
  normalizedY,
  { sceneId, imgRef, imgRect }
) {
  console.log(
    "in characterChoiceHandler: ",
    target.innerText,
    normalizedX,
    normalizedY,
    imgRef.naturalWidth,
    imgRef.naturalHeight
  );
  const sceneRoute = `${api}/scene/${sceneId}`
  const selectedCharacter = target.textContent;
  console.log("selected Character: ", target, selectedCharacter);
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  try {
    showCheckingMsg(docObj);
    const getGameResponse = await fetch(
      `${sceneRoute}/game/answer?x=${normalizedX}&y=${normalizedY}&character=${selectedCharacter}`,
      {
        method: "PUT",
        headers,
        credentials: "include",
      }
    );
    if (getGameResponse.status === 201 && getGameResponse.body) {
      console.log("if it is the correct answer");
      const gameData = await getGameResponse.json();
      console.log(gameData);
      // start by tagging the character selected with the name

      setupTag(docObj, normalizedX, normalizedY, selectedCharacter);


      if (!gameData["elapsed_time"]) {
        showFeedbackMsg(docObj, false)
      } else {
        updateMessages(docObj);
        // stop listening to scene clicks
        imgRef.removeEventListener("mousedown", imageListener);

        // make all the tags visible permanently
        const tags = docObj.querySelectorAll(".tag");
        tags.forEach((el) => {
          el.style.backgroundColor = "#ffffffc2";
          el.style.color = "black";
          el.style.width = "min-content";
        });

        // show top ten dialog
        
        const showButton = docObj.querySelector("#show-top-ten");
        showButton.focus();
        showButton.scrollIntoView({
          behavior: "smooth", 
          block: "center", 
        });
        showButton.dispatchEvent(new Event("click"));
      }
    } else if (getGameResponse.status === 200) {
      // this is the wrong answer

      const gameData = await getGameResponse.json();
      console.log(gameData);
      if (gameData.message === "Wrong answer") {
        showFeedbackMsg(docObj, true);
      }
    } else {
      console.error(
        "top ten list response was not what we expected for this part of the game"
      );
      throw new Error("Couldn't fetch the top ten list.");
    }
  } catch (error) {
    console.error(error);

    displayGeneralError(docObj);
  }
}

function setupTag(docObj, x, y, character) {
  const tagWindow = docObj.createElement("div");
  tagWindow.style.top = `anchor(${y}%)`;
  tagWindow.style.left = `anchor(${x}%)`;
  tagWindow.innerText = character;
  tagWindow.classList.add("tag");
  tagWindow.setAttribute("anchor-name", `--${character}`);

  const sceneEl = docObj.querySelector("#scene");
  sceneEl.appendChild(tagWindow);
}

function showCheckingMsg(docObj) {
  
  const feedbackDiv = docObj.querySelector("#feedback");
  const menuRef = docObj.querySelector("#menu");
  feedbackDiv.style.positionAnchor = "--msg-anchor";
  feedbackDiv.style.position = "fixed";
  feedbackDiv.style.opacity = ".85";
  feedbackDiv.style.positionArea = "";
  feedbackDiv.style.visibility = "visible";
  feedbackDiv.style.width = "max-content";
  feedbackDiv.style.backgroundColor = "white";
  feedbackDiv.style.color = "black";
  feedbackDiv.innerText = "Checking..."
    if (menuRef.getAttribute("data-top") === "true") {
      console.log("found data-top: ", stripPx(menuRef.style.top));
      feedbackDiv.style.positionArea += "top";
    } else {
      feedbackDiv.style.positionArea += "bottom";
    }
    if (menuRef.getAttribute("data-left") === "true") {
      console.log("found data-left: ", stripPx(menuRef.style.left));
      feedbackDiv.style.positionArea += " left";
    } else {
      feedbackDiv.style.positionArea += " right";
    }
}
function showFeedbackMsg(docObj, wrong=true) {
  const feedbackDiv = docObj.querySelector("#feedback");
  const menuRef = docObj.querySelector("#menu");
  feedbackDiv.style.positionAnchor = "--msg-anchor";
  feedbackDiv.style.position = "fixed";
  feedbackDiv.style.opacity = ".85";
  feedbackDiv.style.positionArea = "";
  feedbackDiv.style.visibility = "visible";
  feedbackDiv.style.width = "max-content";
  feedbackDiv.style.backgroundColor = wrong ? "red" : "green";
  feedbackDiv.style.color = "white";
  feedbackDiv.innerText = wrong ? "Wrong Answer!" : "Correct!";

  if (menuRef.getAttribute("data-top") === "true") {
    console.log("found data-top: ", stripPx(menuRef.style.top));
    feedbackDiv.style.positionArea += "top";
  } else {
    feedbackDiv.style.positionArea += "bottom";
  }
  if (menuRef.getAttribute("data-left") === "true") {
    console.log("found data-left: ", stripPx(menuRef.style.left));
    feedbackDiv.style.positionArea += " left";
  } else {
    feedbackDiv.style.positionArea += " right";
  }
}

function updateMessages(docObj) {
  const topTenMessageEl = docObj.querySelector("#top-ten-message");
  const objectiveText = docObj.querySelector("#objective");
  objectiveText.innerText = "Well done! You found these characters: ";
  topTenMessageEl.innerText =
    "You've found them all! Click the Top Ten button to see your score!";
}
