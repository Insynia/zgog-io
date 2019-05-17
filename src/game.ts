import * as PIXI from "pixi.js";
import { Map } from "./map";
import { Communicator, setupSocket, MsgType, MapPayload, PlayerPayload } from "./communication";
import { createCharacter, Character, XYVec, moveChararacter } from "./character";

interface Resources {
  [sprite: string]: { texture: PIXI.Texture; textures: { [sprite: string]: PIXI.Texture } };
}

const characterSize = 1;

export class Game {
  map?: Map;
  app: PIXI.Application;
  resources?: Resources;
  communicator?: Communicator;
  player?: Character;
  players: { [id: string]: Character };
  onResourcesLoad: () => void;
  onConnectionFailure: () => void;
  lastPos: { [id: string]: { ts: number; position: XYVec; orientation: XYVec } } = {};
  lastPosSentAt: number = new Date().getTime();
  lastPosSentAtN1: number = new Date().getTime();
  curPredictedPos: { [id: string]: XYVec } = {};
  predictedPos: { [id: string]: XYVec } = {};

  posElapsed = 0;

  constructor(app: PIXI.Application) {
    this.app = app;
    this.players = {};
    this.loadGame();
  }

  async loadGame() {
    await this.loadResources();
    setupSocket()
      .then(communicator => {
        this.communicator = communicator;

        this.communicator.on(MsgType.Map, (data: MapPayload) => {
          this.map = new Map(data, this.resources);

          this.app.ticker.add(delta => this.loop(delta));
          this.app.ticker.add(delta => this.renderPlayers(delta));

          this.app.stage.addChild(this.map.tileMap.landTileSprites);
          this.app.stage.addChild(this.map.tileMap.objectSprites);
          window.onresize = () => this.resizeGame();
          this.map.render();
        });
        this.communicator.on(MsgType.AllPlayers, (players: PlayerPayload[]) => {
          if (!this.map) {
            return;
          }
          players.forEach(player => {
            const p = this.players[player.id];
            if (!this.players[player.id]) {
              const char = createCharacter(
                this.resources,
                player.id,
                player.position,
                player.orientation,
                player.velocity
              );
              char.sprite.height = characterSize * this.map.mapTileSize;
              char.sprite.width = characterSize * this.map.mapTileSize;
              this.app.stage.addChild(char.sprite);

              this.players[player.id] = char;
              this.curPredictedPos[player.id] = char.position;
              this.predictedPos[player.id] = char.position;
              this.lastPos[player.id] = {
                ts: char.updatedAt,
                position: char.position,
                orientation: char.orientation
              };
            } else {
              this.predictedPos[player.id] = this.curPredictedPos[player.id];
              this.lastPos[player.id] = {
                ts: p.updatedAt,
                position: this.curPredictedPos[player.id],
                orientation: p.orientation
              };
              p.updatedAt = new Date().getTime();
              this.players[player.id] = { ...p, ...player };
            }
          });
          this.posElapsed = this.app.ticker.elapsedMS;
          this.lastPosSentAtN1 = this.lastPosSentAt;
          this.lastPosSentAt = new Date().getTime();
        });
        this.communicator.on(MsgType.ReceivePlayer, (player: PlayerPayload) => {
          this.player = createCharacter(
            this.resources,
            player.id,
            player.position,
            player.orientation,
            player.velocity
          );
          // DEBUG
          this.player.sprite.tint = 0x70fab0;
          this.player.sprite.alpha = 0.5;
          //
          this.renderPlayer();
          this.app.stage.addChild(this.player.sprite);
          this.player.sprite.on("pointermove", () => moveChararacter(this.player, this.app));
        });
      })
      .catch(err => {
        this.onConnectionFailure && this.onConnectionFailure();
      });
  }

  renderPlayer() {
    this.player.sprite.x = window.innerWidth / 2;
    this.player.sprite.y = window.innerHeight / 2;
    this.player.sprite.height = characterSize * this.map.mapTileSize;
    this.player.sprite.width = characterSize * this.map.mapTileSize;
  }

  resizeGame() {
    this.app.renderer.resize(window.innerWidth, window.innerHeight);
    this.map.render();
    this.renderPlayer();
    Object.keys(this.players).forEach(key => {
      const p = this.players[key];
      p.sprite.height = characterSize * this.map.mapTileSize;
      p.sprite.width = characterSize * this.map.mapTileSize;
    });
  }

  async loadResources() {
    return new Promise((resolve, reject) => {
      this.app.loader
        .add("sprites", "spritesheet.json")
        .add("char", "char.png")
        .load((_loader: any, resources: Resources) => {
          this.resources = resources;
          this.onResourcesLoad && this.onResourcesLoad();
          resolve(this);
        });
    });
  }

  lerp(start: number, end: number, rt: number) {
    const t = Math.min(rt, 1);
    return (1 - t) * start + t * end;
  }

  renderPlayers(delta: number) {
    if (!this.player) {
      return;
    }
    const mapTileSize = this.map.mapTileSize;
    const lag = (this.lastPosSentAt - this.lastPosSentAtN1) * 3;

    const mapOrigin: XYVec = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    };

    Object.keys(this.players).forEach(id => {
      const p = this.players[id];
      console.log(
        "fromPos",
        this.predictedPos[id].y,
        "toPos",
        p.position.y,
        "lerp",
        this.lerp(this.predictedPos[id].y, p.position.y, this.posElapsed / lag),
        "delta",
        this.posElapsed / lag
      );

      let x;
      let y;
      if (this.posElapsed <= lag) {
        x = this.lerp(this.predictedPos[id].x, p.position.x, this.posElapsed / lag);
        y = this.lerp(this.predictedPos[id].y, p.position.y, this.posElapsed / lag);
      } else {
        x = p.position.x;
        y = p.position.y;
      }
      this.curPredictedPos[id] = { x, y };

      p.sprite.x = mapOrigin.x + (x - this.player.position.x) * mapTileSize;
      p.sprite.y = mapOrigin.y + (y - this.player.position.y) * mapTileSize;

      const rx = this.lerp(
        this.lastPos[id].orientation.x,
        p.orientation.x,
        this.posElapsed / (this.lastPosSentAt - this.lastPosSentAtN1)
      );
      const ry = this.lerp(
        this.lastPos[id].orientation.y,
        p.orientation.y,
        this.posElapsed / (this.lastPosSentAt - this.lastPosSentAtN1)
      );

      p.sprite.rotation = Math.atan2(ry, rx) + 1.57;
    });
    this.posElapsed += this.app.ticker.elapsedMS;
  }

  timerDelay = 0;

  loop(delta: number) {
    if (!this.player) {
      return;
    }

    const mapTileSize = this.map.mapTileSize;

    const mapOrigin: XYVec = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    };
    const newCharPos = {
      x: Math.min(
        Math.max(0, this.player.position.x + this.player.velocity.x * delta),
        this.map.tileMap.size.x
      ),
      y: Math.min(
        Math.max(0, this.player.position.y + this.player.velocity.y * delta),
        this.map.tileMap.size.y
      )
    };

    const nextTile = this.map.tileMap.tiles[
      `${Math.floor(newCharPos.x)};${Math.floor(newCharPos.y)}`
    ];
    if (nextTile && nextTile.walkable) {
      this.player.position.x = newCharPos.x;
      this.player.position.y = newCharPos.y;
      // speed.text = `Speed: ${this.player.velocity.x} | ${this.player.velocity.y}`;
    } else {
      // speed.text = `Speed: ${this.player.velocity.x} | ${this.player.velocity.y} (Stucked)`;
    }

    this.map.tileMap.landTileSprites.x = mapOrigin.x - this.player.position.x * mapTileSize;
    this.map.tileMap.landTileSprites.y = mapOrigin.y - this.player.position.y * mapTileSize;
    this.map.tileMap.objectSprites.x = mapOrigin.x - this.player.position.x * mapTileSize;
    this.map.tileMap.objectSprites.y = mapOrigin.y - this.player.position.y * mapTileSize;

    if (this.timerDelay >= 3 /* && coords have changed */) {
      // * 16 ms * 3
      this.communicator.sendMsg(
        JSON.stringify({
          type: MsgType.UpdateCoords,
          payload: {
            position: this.player.position,
            orientation: this.player.orientation,
            velocity: this.player.velocity
          }
        })
      );
      this.timerDelay = 0;
    } else {
      this.timerDelay += delta;
    }
  }
}
