import { PlayerPayload } from "./communication";
import { XYVec } from "./character";
import * as PIXI from "pixi.js";
import { Resources } from "./game";

export interface XYVec {
  x: number;
  y: number;
}

export class Character {
  id: string;
  position: XYVec;
  name: string;
  body: PIXI.Container;
  orientation: XYVec;
  velocity: XYVec;
  resources: Resources;
  lastLocalPos: { position: XYVec; orientation: XYVec };
  curPredictedPos: { position: XYVec; orientation: XYVec };
  characterSize = 1;
  characterSpeed = 0.05;

  constructor(resources: Resources, player: PlayerPayload) {
    const sprite = new PIXI.Sprite(resources.char.texture);

    const v = player.velocity || { x: 0, y: 0 };
    const o = player.orientation || { x: 0, y: 0 };
    const p = player.position || { x: 0, y: 0 };

    this.lastLocalPos = { orientation: o, position: p };
    this.curPredictedPos = { orientation: o, position: p };

    sprite.anchor.set(0.5);

    const container = new PIXI.Container();
    container.interactive = true;
    container.addChild(sprite);

    this.resources = resources;
    this.id = player.id;
    this.position = p;
    this.orientation = o;
    this.velocity = v;
    this.body = container;
  }

  update(player: PlayerPayload) {
    this.position = player.position;
    this.velocity = player.velocity;
    this.orientation = player.orientation;
    this.name = player.name;
    this.lastLocalPos = this.curPredictedPos;
  }

  move(mouse: { x: number; y: number }) {
    const mouseLeeway = 32;

    this.orientation = { y: mouse.y - window.innerHeight / 2, x: mouse.x - window.innerWidth / 2 };

    if (mouse.y > window.innerHeight / 2 + mouseLeeway) {
      this.velocity.y = this.characterSpeed * (2 - Math.max(1, window.innerHeight / 1.2 / mouse.y));
    } else if (mouse.y < window.innerHeight / 2 - mouseLeeway) {
      this.velocity.y =
        -this.characterSpeed *
        (2 - Math.max(1, window.innerHeight / 1.2 / (window.innerHeight - mouse.y)));
    } else {
      this.velocity.y = 0;
    }
    if (mouse.x > window.innerWidth / 2 + mouseLeeway) {
      this.velocity.x = this.characterSpeed * (2 - Math.max(1, window.innerWidth / 1.2 / mouse.x));
    } else if (mouse.x < window.innerWidth / 2 - mouseLeeway) {
      this.velocity.x =
        -this.characterSpeed *
        (2 - Math.max(1, window.innerWidth / 1.2 / (window.innerWidth - mouse.x)));
    } else {
      this.velocity.x = 0;
    }
  }
}

export const setSmoothedPos = (positionStart: XYVec, positionEnd: XYVec) => {};
