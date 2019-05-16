import * as PIXI from "pixi.js";
import { XYVec, Character } from "./character";
import { TilePayload, MapPayload } from "./communication";

export enum TileType {
  Water,
  Sand,
  Grass
}

export class Map {
  public mapTileSize: number;
  resources: {
    [sprite: string]: { texture: PIXI.Texture; textures: { [sprite: string]: PIXI.Texture } };
  };
  public tileMap: TileMap;

  constructor(
    payload: MapPayload,
    resources: {
      [sprite: string]: { texture: PIXI.Texture; textures: { [sprite: string]: PIXI.Texture } };
    }
  ) {
    this.resources = resources;
    this.tileMap = this.createMap(payload);
  }

  public setTileSize() {
    const maxTilesDisplayedX = 16;
    const maxTilesDisplayedY = 9;
    this.mapTileSize = Math.min(
      window.innerHeight / maxTilesDisplayedY,
      window.innerWidth / maxTilesDisplayedX
    );
  }

  public render() {
    Object.keys(this.tileMap.tiles).forEach((tileKey: string) => {
      const tile = this.tileMap.tiles[tileKey];
      this.setTileSize();

      tile.sprites.forEach(sprite => {
        sprite.x = tile.x * this.mapTileSize;
        sprite.y = tile.y * this.mapTileSize;
        sprite.height = this.mapTileSize;
        sprite.width = this.mapTileSize;
      });
    });
  }

  public createMap(rawMap: MapPayload): TileMap {
    const map = rawMap;
    this.tileMap = {
      landTileSprites: new PIXI.ParticleContainer(map.width * map.height + 1, { vertices: true }),
      objectSprites: new PIXI.ParticleContainer((map.width * map.height) / 4, { vertices: true }),
      // landTileSprites: new PIXI.Container(),
      // objectSprites: new PIXI.Container(),
      size: { x: map.width, y: map.height },
      tiles: {}
    };

    const textures = this.resources.sprites.textures;

    Object.keys(map.content).forEach(key => {
      const elems: TilePayload[] = map.content[key];
      elems.forEach(elem => {
        const sprite = new PIXI.Sprite(textures[getSpriteName(elem.type)]);

        if (elem.type < 3) {
          this.tileMap.landTileSprites.addChild(sprite);
        } else {
          this.tileMap.objectSprites.addChild(sprite);
        }

        const oldTileSummary: TileSummary = this.tileMap.tiles[`${elem.x};${elem.y}`];
        let walkable = true;
        let sprites = [sprite];
        if (oldTileSummary) {
          walkable = oldTileSummary.walkable;
          sprites = [sprite, ...oldTileSummary.sprites];
        }

        const tile: TileSummary = {
          x: elem.x,
          y: elem.y,
          type: elem.type,
          gatherable: false,
          walkable: !walkable ? false : elem.walkable,
          sprites
        };

        this.tileMap.tiles[`${elem.x};${elem.y}`] = tile;
      });
    });

    this.render();
    return this.tileMap;
  }
}

const getSpriteName = (i: number) => {
  switch (i) {
    case 0:
      return "water";
    case 1:
      return "sand";
    case 2:
      return "grass";
    case 3:
      return "tree";
    case 4:
      return "stone";
    default:
      return "concrete";
  }
};

export interface TileSummary {
  x: number;
  y: number;
  sprites: PIXI.Sprite[];
  type: TileType;
  walkable: boolean;
  gatherable: boolean;
}

export interface TileMap {
  tiles: { [coords: string]: TileSummary };
  landTileSprites: PIXI.ParticleContainer | PIXI.Container;
  objectSprites: PIXI.ParticleContainer | PIXI.Container;
  size: XYVec;
}
