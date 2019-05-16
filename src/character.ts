import { XYVec } from "./character";
import * as PIXI from "pixi.js";

export const characterSize = 1;
export const characterSpeed = 0.05;

export interface XYVec {
  x: number;
  y: number;
}

export interface Character {
  id: string;
  updatedAt: number;
  position: XYVec;
  sprite: PIXI.Sprite;
  orientation: XYVec;
  velocity: XYVec;
}

export function createCharacter(
  resources: { [sprite: string]: { texture: PIXI.Texture } },
  id: string,
  position: XYVec,
  orientation: XYVec,
  velocity: XYVec
): Character {
  const sprite = new PIXI.Sprite(resources.char.texture);
  sprite.interactive = true;

  const v = velocity || { x: 0, y: 0 };
  const o = orientation || { x: 0, y: 0 };
  const p = position || { x: 0, y: 0 };

  sprite.anchor.set(0.5);
  let char: Character = {
    id,
    updatedAt: new Date().getTime(),
    position: p,
    orientation: o,
    velocity: v,
    sprite
  };
  return char;
}

export function moveChararacter(char: Character, app: PIXI.Application) {
  const mouseLeeway = 32;
  const mouseX = app.renderer.plugins.interaction.mouse.global.x;
  const mouseY = app.renderer.plugins.interaction.mouse.global.y;

  char.orientation = { y: mouseY - window.innerHeight / 2, x: mouseX - window.innerWidth / 2 };

  const orientation = Math.atan2(mouseY - window.innerHeight / 2, mouseX - window.innerWidth / 2);
  char.sprite.rotation = orientation + 1.57; // (1.57 = 90deg)

  if (mouseY > app.renderer.height / 2 + mouseLeeway) {
    char.velocity.y = characterSpeed * (2 - Math.max(1, app.renderer.height / 1.2 / mouseY));
  } else if (mouseY < app.renderer.height / 2 - mouseLeeway) {
    char.velocity.y =
      -characterSpeed *
      (2 - Math.max(1, app.renderer.height / 1.2 / (app.renderer.height - mouseY)));
  } else {
    char.velocity.y = 0;
  }
  if (mouseX > app.renderer.width / 2 + mouseLeeway) {
    char.velocity.x = characterSpeed * (2 - Math.max(1, app.renderer.width / 1.2 / mouseX));
  } else if (mouseX < app.renderer.width / 2 - mouseLeeway) {
    char.velocity.x =
      -characterSpeed * (2 - Math.max(1, app.renderer.width / 1.2 / (app.renderer.width - mouseX)));
  } else {
    char.velocity.x = 0;
  }
}

export const setSmoothedPos = (positionStart: XYVec, positionEnd: XYVec) => {};
