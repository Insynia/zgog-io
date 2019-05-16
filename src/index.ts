import * as PIXI from "pixi.js";
import "./index.scss";

import { Map } from "./map";
import { Character, XYVec } from "./character";
import { Communicator, PlayerPayload } from "./communication";
import { setupInterface } from "./interface";
import { Game } from "./game";

let app = new PIXI.Application({
  width: window.innerWidth,
  height: window.innerHeight,
  antialias: true,
  transparent: false,
  resolution: 1,
  backgroundColor: 0x456dbc
});

app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block";
app.renderer.autoResize = true;
app.renderer.resize(window.innerWidth, window.innerHeight);

const game = new Game(app);
setupInterface(game);

document.body.appendChild(app.view);
const speed = new PIXI.Text(`Speed: 0 | 0`);

let timer = 0;
