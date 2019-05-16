import { h, render } from "preact";
import * as PIXI from "pixi.js";
import Interface from "./components/Interface";
import { Game } from "./game";

export const setupInterface = (game: Game) => {
  const mountNode = document.createElement("div");
  mountNode.id = "ZgogRoot";
  mountNode.className = "ZgogRoot"; // Used in CSS

  document.body.insertBefore(mountNode, document.body.childNodes[0]);
  render(<Interface game={game} />, mountNode);
};
