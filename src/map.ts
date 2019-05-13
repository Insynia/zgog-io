import * as PIXI from "pixi.js";
import { XYVec } from "./character";
import { map } from "./rawMap";

export const mapTileSize = 64;
export type RawMap = number[][];

export enum TileType {
  Water,
  Sand,
  Grass
}

const getSpriteName = (i: number) => {
  switch (i) {
    case 0:
      return "water";
    case 1:
      return "sand";
    case 2:
      return "grass";
    default:
      return "water";
  }
};

export interface Tile {
  x: number;
  y: number;
  sprite: PIXI.Sprite;
  type: TileType;
}

export interface TileMap {
  tiles: Tile[];
  tileSprites: PIXI.ParticleContainer | PIXI.Container;
  size: XYVec;
}

const isTopRight = (map: RawMap, x: number, y: number): boolean =>
  isTop(map, x, y) && isRight(map, x, y);
const isBottomRight = (map: RawMap, x: number, y: number): boolean =>
  isBottom(map, x, y) && isRight(map, x, y);
const isBottomLeft = (map: RawMap, x: number, y: number): boolean =>
  isBottom(map, x, y) && isLeft(map, x, y);
const isTopLeft = (map: RawMap, x: number, y: number): boolean =>
  isTop(map, x, y) && isLeft(map, x, y);
const isTop = (map: RawMap, x: number, y: number): boolean => {
  const actualTileType = map[y][x];

  if (y > 0 && map[y - 1][x] !== actualTileType) {
    return true;
  }
  return false;
};
const isRight = (map: RawMap, x: number, y: number): boolean => {
  const actualTileType = map[y][x];

  if (x < map[0].length - 1 && map[y][x + 1] !== actualTileType) {
    return true;
  }
  return false;
};
const isBottom = (map: RawMap, x: number, y: number): boolean => {
  const actualTileType = map[y][x];

  if (y < map.length - 1 && map[y + 1][x] !== actualTileType) {
    return true;
  }
  return false;
};
const isLeft = (map: RawMap, x: number, y: number): boolean => {
  const actualTileType = map[y][x];

  if (x > 0 && map[y][x - 1] !== actualTileType) {
    return true;
  }
  return false;
};

const getPrefix = (map: RawMap, x: number, y: number) => {
  const actualTileType = map[y][x];

  if (isTopRight(map, x, y)) {
    return "top_right_";
  } else if (isBottomRight(map, x, y)) {
    return "bottom_right_";
  } else if (isBottomLeft(map, x, y)) {
    return "bottom_left_";
  } else if (isTopLeft(map, x, y)) {
    return "top_left_";
  } else if (isTop(map, x, y)) {
    return "top_";
  } else if (isRight(map, x, y)) {
    return "right_";
  } else if (isBottom(map, x, y)) {
    return "bottom_";
  } else if (isLeft(map, x, y)) {
    return "left_";
  } else {
    return "";
  }
};

export function createMap(resources): TileMap {
  let y = 0;
  let x = 0;

  const tileMap = {
    tileSprites: new PIXI.ParticleContainer(100 * 100),
    // tileSprites: new PIXI.Container(),
    size: { x: map.length, y: map.length },
    tiles: []
  };

  const textures = resources.sprites.textures;

  // const rects = [
  //   new PIXI.Rectangle(16, 112, 16, 16), // Water
  //   new PIXI.Rectangle(16, 16, 16, 16) // Grass
  // ];

  while (y < map.length) {
    while (x < map.length) {
      const type = map[y][x];
      // texture.frame = rects[type];
      console.log(getPrefix(map, x, y) + getSpriteName(type));
      const sprite = new PIXI.Sprite(textures[getSpriteName(type)]);

      sprite.x = x * mapTileSize;
      sprite.y = y * mapTileSize;
      sprite.height = mapTileSize;
      sprite.width = mapTileSize;

      // const debugCoords = new PIXI.Text(`${x}/${y}`, {
      //   font: "bold 12px Arial",
      //   fill: "#0f0f20",
      //   align: "center"
      // });
      // debugCoords.position.x = x * mapTileSize;
      // debugCoords.position.y = y * mapTileSize;

      tileMap.tileSprites.addChild(sprite);
      // tileMap.tileSprites.addChild(debugCoords);

      const tile: Tile = {
        x: x,
        y: y,
        type,
        sprite
      };

      tileMap.tiles.push(tile);
      x += 1;
    }
    x = 0;
    y += 1;
  }

  return tileMap;
}
