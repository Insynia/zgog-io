import * as PIXI from "pixi.js";
import "./index.scss";

import { Map, TileMap, RawMap, PlayerData } from "./map";
import {
  createCharacter,
  moveChararacter,
  Character,
  XYVec,
  characterSize,
  createHero
} from "./character";
import { setupSocket } from "./communication";

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
const players: { [name: string]: PlayerData } = {};

app.loader
  .add("sprites", "spritesheet.json")
  .add("char", "char.png")
  .load((_loader, resources) => {
    const character = createHero(resources);
    character.sprite.x = window.innerWidth / 2;
    character.sprite.y = window.innerHeight / 2;
    character.sprite.on("pointermove", () => moveChararacter(character, app));

    speed.position.x = 64;
    speed.position.y = 64;

    app.stage.addChild(speed);

    // Listen for frame updates
    setupSocket(
      (rawMap: RawMap) => {
        const map = new Map(rawMap, resources);
        app.ticker.add(delta => gameLoop(delta, character, map));

        app.stage.addChild(map.tileMap.landTileSprites);
        app.stage.addChild(map.tileMap.objectSprites);
        app.stage.addChild(character.sprite);
        window.onresize = () => {
          app.renderer.resize(window.innerWidth, window.innerHeight);
          map.render();
          character.sprite.height = characterSize * map.mapTileSize;
          character.sprite.width = characterSize * map.mapTileSize;
          Object.keys(players).forEach(key => {
            const p = players[key];
            p.sprite.height = characterSize * map.mapTileSize;
            p.sprite.width = characterSize * map.mapTileSize;
          });
        };
      },
      (datas: PlayerData[]) => {
        datas.forEach(data => {
          const p = players[data.name];
          if (!players[data.name]) {
            const sprite = createCharacter(resources);
            app.stage.addChild(sprite);
            players[data.name] = { sprite, ...data };
          } else {
            players[data.name] = { ...p, ...data };
          }
        });
      }
    );

    //This code will run when the loader has finished loading the image
  });

function gameLoop(delta: number, character: Character, map: Map) {
  const mapTileSize = map.mapTileSize;

  const mapOrigin: XYVec = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  };
  const newCharPos = {
    x: Math.min(
      Math.max(0, character.position.x + character.velocity.x * delta),
      map.tileMap.size.x
    ),
    y: Math.min(
      Math.max(0, character.position.y + character.velocity.y * delta),
      map.tileMap.size.y
    )
  };

  const nextTile = map.tileMap.tiles[`${Math.floor(newCharPos.x)};${Math.floor(newCharPos.y)}`];
  if (nextTile && nextTile.walkable) {
    character.position.x = newCharPos.x;
    character.position.y = newCharPos.y;
    speed.text = `Speed: ${character.velocity.x} | ${character.velocity.y}`;
  } else {
    speed.text = `Speed: ${character.velocity.x} | ${character.velocity.y} (Stucked)`;
  }

  map.tileMap.landTileSprites.x = mapOrigin.x - character.position.x * mapTileSize;
  map.tileMap.landTileSprites.y = mapOrigin.y - character.position.y * mapTileSize;
  map.tileMap.objectSprites.x = mapOrigin.x - character.position.x * mapTileSize;
  map.tileMap.objectSprites.y = mapOrigin.y - character.position.y * mapTileSize;
  Object.keys(players).forEach(name => {
    players[name].sprite.x =
      mapOrigin.x + players[name].x * mapTileSize - character.position.x * mapTileSize;
    players[name].sprite.y =
      mapOrigin.y + players[name].y * mapTileSize - character.position.y * mapTileSize;
  });
}
