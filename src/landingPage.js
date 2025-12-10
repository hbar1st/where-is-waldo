import "./styles.css";
import { game, displayGeneralError } from "./game.js";

export async function landingPage(docObj, api) {
  try {
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    // grab a list of all the scenes and their image urls
    const response = await fetch(`${api}/scene`, {
      method: "GET",
      headers: headers,
      credentials: "include",
    });
    if ((response.ok || response.status === 304) && response.body) {
      const sceneData = await response.json();
      console.log(sceneData);
      const levelsArea = docObj.querySelector(".levels");
      const listEl = docObj.createElement("ul");
      sceneData.scenes.forEach((el) => {
        const itemEl = docObj.createElement("li");
        itemEl.setAttribute("data-scene-id", el.id);
        const figure = docObj.createElement("figure");
        figure.setAttribute("data-scene-id", el.id);
        const imgEl = docObj.createElement("img");
        imgEl.setAttribute("src", el.url);
        imgEl.setAttribute("alt", `scene number ${el.id}`);
        figure.appendChild(imgEl);
        const caption = docObj.createElement("figcaption");
        caption.innerText = `level ${el.level}`;
        figure.appendChild(caption);
        itemEl.appendChild(figure);
        listEl.appendChild(itemEl);
      });

      levelsArea.appendChild(listEl);
      listEl.addEventListener("click", (e) => {
        const sceneId =
          e.target.getAttribute("data-sceneId") ??
          e.target.parentElement.getAttribute("data-scene-id");

        // clear up the elements that don't belong
        const introEl = docObj.querySelector(".intro");
        introEl.classList.add("align-right");
        const gameElements = docObj.querySelectorAll(".intro > *");
        gameElements.forEach((el) => (el.innerText = ""));
        const introSection = docObj.querySelector(".intro > h2")
        const goBackLink = docObj.createElement("a");
        goBackLink.setAttribute("onClick", "window.location.reload(true);")
        goBackLink.setAttribute("href", "")
        goBackLink.innerText = "< Choose another level"
        introSection.appendChild(goBackLink)
        game(docObj, sceneId);
      });
      const messageEl = docObj.querySelector("#message");
      messageEl.innerText = "";
    } else {
      console.error(response);
      displayGeneralError(docObj);
    }
  } catch (error) {
    console.log("caught an internal error");
    displayGeneralError(docObj);
    console.error(error);
  }
}
