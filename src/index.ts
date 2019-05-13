import * as PIXI from "pixi.js";
import "./index.scss";

import { createMap, mapTileSize, TileMap } from "./map";
import { createCharacter, moveChararacter, Character, XYVec, characterSize } from "./character";

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

document.body.appendChild(app.view);
const speed = new PIXI.Text(`Speed: 0 | 0`);

app.loader
  .add("sprites", "spritesheet.json")
  .add("char", "char.png")
  .load((_loader, resources) => {
    const map = createMap(resources);
    app.stage.addChild(map.tileSprites);

    const character = createCharacter(resources);
    character.sprite.x = window.innerWidth / 2;
    character.sprite.y = window.innerHeight / 2;
    app.stage.addChild(character.sprite);
    character.sprite.on("pointermove", () => moveChararacter(character, app));

    speed.position.x = 64;
    speed.position.y = 64;

    app.stage.addChild(speed);

    window.onresize = () => {
      app.renderer.resize(window.innerWidth, window.innerHeight);
      character.sprite.x = window.innerWidth / 2;
      character.sprite.y = window.innerHeight / 2;
    };

    // Listen for frame updates
    app.ticker.add(delta => gameLoop(delta, character, map));
    //This code will run when the loader has finished loading the image
  });

function gameLoop(delta: number, character: Character, map: TileMap) {
  const mapOrigin: XYVec = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  };
  character.position.x = Math.min(
    Math.max(0, character.position.x + character.velocity.x * delta),
    map.size.x * mapTileSize
  );
  character.position.y = Math.min(
    Math.max(0, character.position.y + character.velocity.y * delta),
    map.size.y * mapTileSize
  );

  speed.text = `Speed: ${character.velocity.x} | ${character.velocity.y}`;

  map.tileSprites.x = mapOrigin.x - character.position.x;
  map.tileSprites.y = mapOrigin.y - character.position.y;
}
