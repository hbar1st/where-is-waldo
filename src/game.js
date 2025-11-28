export { landingPage };

function landingPage(docObj) {
  const WALDO_API = "https://where-is-waldo-api-vczk.onrender.com";

  const dialog = document.querySelector("#top-ten-dialog");
  const showButton = document.querySelector("#show-top-ten");
  const closeButton = document.querySelector("dialog button");
  const sceneDiv = document.querySelector("#scene");
  const gameSections = document.querySelectorAll(".game");
  const messageEl = document.querySelector("#message");

  // "Show the dialog" button opens the dialog modally
  showButton.addEventListener("click", () => {
    dialog.showModal();
  });

  // "Close" button closes the dialog
  closeButton.addEventListener("click", () => {
    dialog.close();
  });

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
        if ((secondResponse.ok || secondResponse.status === 304) && secondResponse.body) {
          const image = new Image();
          image.src = sceneData.url;
          image.alt = "scene";
          sceneDiv.appendChild(image);

          const characterData = await secondResponse.json();
          console.log(characterData);
          const sceneCharacters = characterData.characters.reduce((acc, el, i, arr) => i < arr.length - 1 ? acc += ", " + el : acc += " and " + el)
          const h1 = `Let's find ${sceneCharacters}! This game will be timed. Will your time earn you a place in the top ten?`;
          messageEl.innerText = h1;
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

  //setupresponse(WALDO_API);
  setupresponse("http://localhost:3000");
}

function displayGeneralError(messageEl) {
  messageEl.innerHTML =
    "<h1>Sorry, something went wrong. We weren't able to setup a game for you to play. Please try again later.";
}
