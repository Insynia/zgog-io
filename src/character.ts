import * as PIXI from "pixi.js";

export const characterSize = 1;
export const characterSpeed = 0.05;

export interface XYVec {
  x: number;
  y: number;
}

export interface Character {
  position: XYVec;
  sprite: PIXI.Sprite;
  velocity: XYVec;
}

export function createCharacter(
  resources: { [sprite: string]: { texture: PIXI.Texture } },
  x = 0,
  y = 0
): PIXI.Sprite {
  const sprite = new PIXI.Sprite(resources.char.texture);
  sprite.interactive = true;

  sprite.anchor.set(0.5);
  return sprite;
}

export function createHero(resources: { [sprite: string]: { texture: PIXI.Texture } }): Character {
  let char: Character = {
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    sprite: createCharacter(resources)
  };
  return char;
}

export function moveChararacter(char: Character, app: PIXI.Application) {
  const mouseLeeway = 32;
  const mouseX = app.renderer.plugins.interaction.mouse.global.x;
  const mouseY = app.renderer.plugins.interaction.mouse.global.y;

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
