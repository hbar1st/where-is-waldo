export { landingPage };

function landingPage(docObj) {

  const dialog = docObj.querySelector("#top-ten-dialog");
  const startButton = docObj.querySelector("#start");
  const showButton = docObj.querySelector("#show-top-ten");
  const closeButton = docObj.querySelector("dialog button");
  const sceneDiv = docObj.querySelector("#scene");
  const gameSections = docObj.querySelectorAll(".game");
  const messageEl = docObj.querySelector("#message");
  const topTenMessageEl = docObj.querySelector("#top-ten-message");
  const charactersList = docObj.querySelector("#characters");

  // get the game response and characters to setup the play
  const setupresponse = async (api) => {
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    try {
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
          console.log(characterData);
          // prepare the scene image for display
          const image = new Image();
          image.src = sceneData.url;
          image.alt = "scene";
          image.classList = "blur"; // we start out with a blurred image until the game is started officially
          sceneDiv.appendChild(image);

          let sceneCharacters = "";
          // display the characters
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
          // prepare statement on the scene characters
          //const sceneCharacters = characterData.characters.reduce((acc, el, i, arr) => i < arr.length - 1 ? acc += ", " + el : acc += " and " + el)
          const h1 = `Let's find ${sceneCharacters}!`;
          const h2 = `This game will be timed! Will your time earn you a place in the top ten ?`;
          messageEl.innerText = h1;
          topTenMessageEl.innerText = h2;

          // add event listeners to the buttons
          // "Show the dialog" button opens the dialog modally
          showButton.addEventListener("click", () => {
            dialog.showModal();
          });

          // "Close" button closes the dialog
          closeButton.addEventListener("click", () => {
            dialog.close();
          });

          startButton.addEventListener("click", () => {
            // starts the game
            // and removes the unnecessary text areas from the page for game mode
            // and unblurs the scene
          })
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
