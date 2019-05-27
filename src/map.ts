import * as PIXI from "pixi.js";
import { XYVec, Character } from "./character";
import { TilePayload, MapPayload, ObjectPayload, VisualPayload } from "./communication";

export enum TileType {
  Water,
  Sand,
  Grass
}

export interface TileSummary {
  x: number;
  y: number;
  sprites: PIXI.Sprite[];
  type: TileType;
  walkable: boolean;
}

export interface TileMap {
  tiles: { [coords: string]: TileSummary };
  landTileSprites: PIXI.ParticleContainer | PIXI.Container;
  objectSprites: PIXI.ParticleContainer | PIXI.Container;
  size: XYVec;
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
    this.mapTileSize = Math.max(
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

    const addObject = (elem: ObjectPayload): PIXI.Sprite => {
      const sprite = new PIXI.Sprite(textures[getObjectName(elem.type)]);
      this.tileMap.objectSprites.addChild(sprite);
      return sprite;
    };

    const addVisual = (elem: VisualPayload): PIXI.Sprite => {
      const sprite = new PIXI.Sprite(textures[getVisualName(elem.type)]);
      this.tileMap.landTileSprites.addChild(sprite);
      return sprite;
    };

    const addElem = (elem: TilePayload, sprites: PIXI.Sprite[]) => {
      const tile: TileSummary = {
        x: elem.x,
        y: elem.y,
        type: elem.type,
        walkable: elem.objects.length == 0 && !elem.visuals.map(e => e.type).includes(0),
        sprites
      };

      this.tileMap.tiles[`${elem.x};${elem.y}`] = tile;
    };

    Object.keys(map.content).forEach(key => {
      const elem: TilePayload = map.content[key];
      let sprites: PIXI.Sprite[] = [];
      sprites = sprites.concat(elem.objects.map(e => addObject(e)));
      sprites = sprites.concat(elem.visuals.map(e => addVisual(e)));
      addElem(elem, sprites);
    });

    this.render();
    return this.tileMap;
  }
}

const getVisualName = (i: number) => {
  switch (i) {
    case 0:
      return "water";
    case 1:
      return "sand";
    case 2:
      return "grass";
    case 3:
      return "concrete";
    default:
      return "concrete";
  }
};

const getObjectName = (i: number) => {
  switch (i) {
    case 0:
      return "tree";
    case 1:
      return "stone";
    default:
      return "tree";
  }
};
