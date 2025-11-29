const imgRef = document.querySelector("#main");
imgRef.addEventListener("mousedown", displayChoice);
const menuRef = document.querySelector("#menu");
const targetWindowRef = document.querySelector("#targetting-window");

// what are the menu's height and width?
const menuHeight = menuRef.offsetHeight;
const menuWidth = menuRef.offsetWidth;

// the apothem is the distance from the center of the square to the midpoint of the side
const targetWindowApothem = targetWindowRef.offsetHeight >> 1; //divide by 2

console.log(" the menus width/height : ", menuWidth, menuHeight);
function displayChoice(e) {
  // image boundary
  const imgRect = imgRef.getBoundingClientRect();
  console.log("image rect: ", imgRect.x, imgRect.y);

  // what are the image's top left corner coordinates to orient ourselves to?
  const relY = Math.floor(Number(e.clientY) - Math.abs(imgRect.top));
  const relX = Math.floor(Number(e.clientX) - Math.abs(imgRect.left));

  // the viewable max width and height of the image
  const viewWidth = window.innerWidth || document.documentElement.clientWidth;
  const viewHeight =
    window.innerHeight || document.documentElement.clientHeight;

  console.log("(clientX,clientY): ", e.clientX, e.clientY, relX, relY);
  console.log(
    "(viewWidth,viewHeight)",
    document.documentElement.clientWidth,
    document.documentElement.clientHeight
  );

  let menuLeft = relX;
  let menuTop = relY;

  if (e.clientX + menuWidth > viewWidth - 10) {
    menuLeft -= menuWidth + 15;

    console.log(`instead of X ${e.clientX} move to ${menuLeft}`);
  } else {
    menuLeft += 15;
  }

  if (e.clientY + menuHeight > viewHeight - 10) {
    console.log("show above");
    menuTop -= menuHeight;
  }

  // offset due to scrolling or other elements on the page taking space
  const xOffset = Math.abs(imgRect.x) + window.scrollX;
  const yOffset = Math.abs(imgRect.y) + window.scrollY;

  // now position the menu to the final position
  menuRef.style.left = makePx(menuLeft + xOffset);
  menuRef.style.top = makePx(menuTop + yOffset);
  menuRef.style.visibility = "visible";

  // as for the targetting window, center it around the clicked position
  targetWindowRef.style.left = makePx(relX - targetWindowApothem + xOffset);
  targetWindowRef.style.top = makePx(relY - targetWindowApothem + yOffset);
  targetWindowRef.style.visibility = "visible";
}

function makePx(str) {
  return `${str}px`;
}

/**
 *
 * TODO, normalize the pixels
 * Using Ratios: Instead of storing the specific pixel x and y,
 * the position is stored as a ratio or percentage of the total
 * screen/window width and height. For example, if a click is at x=900
 * on a 1000-pixel-wide screen, the ratio is 0.9 (900/1000).
 * On a 1600-pixel-wide screen, the correct position is calculated as
 * 1600 * 0.9 = 1440 pixels.
 *
 */
