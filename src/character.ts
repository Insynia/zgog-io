import { mapTileSize } from "./map";
import * as PIXI from "pixi.js";

export const characterSize = 96;
export const characterSpeed = 5;

export interface XYVec {
  x: number;
  y: number;
}

export interface Character {
  position: XYVec;
  sprite: PIXI.Sprite;
  velocity: XYVec;
}

export function createCharacter(resources): Character {
  const sprite = new PIXI.Sprite(resources.char.texture);
  sprite.interactive = true;

  const bounds = sprite.getBounds();
  // sprite.pivot.x = sprite.width / 2;
  // sprite.pivot.y = sprite.height / 2;
  sprite.anchor.set(0.5);

  sprite.width = characterSize;
  sprite.height = characterSize;

  let char: Character = {
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    sprite
  };
  return char;
}

export function moveChararacter(char: Character, app) {
  const mouseLeeway = mapTileSize / 2;
  const mouseX = app.renderer.plugins.interaction.mouse.global.x;
  const mouseY = app.renderer.plugins.interaction.mouse.global.y;

  const orientation = Math.atan2(mouseY - window.innerHeight / 2, mouseX - window.innerWidth / 2);
  char.sprite.rotation = orientation + 1.57; // (1.57 = 90deg)

  if (mouseY > app.renderer.height / 2 + mouseLeeway) {
    char.velocity.y = characterSpeed * (2 - Math.max(1, app.renderer.height / 1.2 / mouseY));
  } else if (mouseY < app.renderer.height / 2 - mouseLeeway && char.position.y > 0) {
    char.velocity.y =
      -characterSpeed *
      (2 - Math.max(1, app.renderer.height / 1.2 / (app.renderer.height - mouseY)));
  } else {
    char.velocity.y = 0;
  }
  if (mouseX > app.renderer.width / 2 + mouseLeeway) {
    char.velocity.x = characterSpeed * (2 - Math.max(1, app.renderer.width / 1.2 / mouseX));
  } else if (mouseX < app.renderer.width / 2 - mouseLeeway && char.position.x > 0) {
    char.velocity.x =
      -characterSpeed * (2 - Math.max(1, app.renderer.width / 1.2 / (app.renderer.width - mouseX)));
  } else {
    char.velocity.x = 0;
  }
}
