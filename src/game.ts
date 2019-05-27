import * as PIXI from "pixi.js";
import { Map } from "./map";
import { Communicator, setupSocket, MsgType, MapPayload, PlayerPayload } from "./communication";
import { Character, XYVec } from "./character";

export interface Resources {
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
  lastTick: number = new Date().getTime();
  beforeLastTick: number = new Date().getTime();

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
            if (!this.players[player.id]) {
              const char = new Character(this.resources, player, this.map.mapTileSize);
              this.app.stage.addChild(char.body);

              this.players[player.id] = char;
            } else {
              this.players[player.id].update(player);
            }
          });
          this.posElapsed = this.app.ticker.elapsedMS;
          this.beforeLastTick = this.lastTick;
          this.lastTick = new Date().getTime();
        });
        this.communicator.on(MsgType.ReceivePlayer, (player: PlayerPayload) => {
          this.player = new Character(this.resources, player, this.map.mapTileSize);
          // DEBUG
          // this.player.body.tint = 0x70fab0;
          this.player.body.alpha = 0.0;
          //
          this.renderPlayer();
          this.app.stage.addChild(this.player.body);
          this.player.body.on("pointermove", () =>
            this.player.move(this.app.renderer.plugins.interaction.mouse.global)
          );

          this.app.ticker.add(delta => this.renderLocalMovement(delta));
          this.app.ticker.add(delta => this.renderPlayers(delta));
          this.app.ticker.add(delta =>
            Object.keys(this.players).forEach((pKey: string) =>
              this.players[pKey].animate(this.app.ticker.elapsedMS)
            )
          );

          document.addEventListener("pointerdown", () => {
            this.player.hitting = true;
          });

          document.addEventListener("pointerup", () => {
            this.player.hitting = false;
            this.player.resetAnimation();
          });
        });
      })
      .catch(err => {
        this.onConnectionFailure && this.onConnectionFailure();
      });
  }

  renderPlayer() {
    this.player.body.x = window.innerWidth / 2;
    this.player.body.y = window.innerHeight / 2;
    this.player.body.height = characterSize * this.map.mapTileSize;
    this.player.body.width = characterSize * this.map.mapTileSize;
  }

  resizeGame() {
    this.app.renderer.resize(window.innerWidth, window.innerHeight);
    this.map.render();
    this.renderPlayer();
    Object.keys(this.players).forEach(key => {
      const p = this.players[key];
      p.body.height = characterSize * this.map.mapTileSize;
      p.body.width = characterSize * this.map.mapTileSize;
    });
  }

  async loadResources() {
    return new Promise((resolve, reject) => {
      this.app.loader
        .add("sprites", "spritesheet.json")
        .add("character", "character.json")
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
    const mapTileSize = this.map.mapTileSize;
    const lag = (this.lastTick - this.beforeLastTick) * 3;

    const mapOrigin: XYVec = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    };

    Object.keys(this.players).forEach(id => {
      const p = this.players[id];

      const x = this.lerp(p.lastLocalPos.position.x, p.position.x, this.posElapsed / lag);
      const y = this.lerp(p.lastLocalPos.position.y, p.position.y, this.posElapsed / lag);

      p.body.x = mapOrigin.x + (x - this.player.position.x) * mapTileSize;
      p.body.y = mapOrigin.y + (y - this.player.position.y) * mapTileSize;

      const rx = this.lerp(
        p.lastLocalPos.orientation.x,
        p.orientation.x,
        this.posElapsed / (this.lastTick - this.beforeLastTick)
      );
      const ry = this.lerp(
        p.lastLocalPos.orientation.y,
        p.orientation.y,
        this.posElapsed / (this.lastTick - this.beforeLastTick)
      );

      p.curPredictedPos = { position: { x, y }, orientation: { x: rx, y: ry } };
      p.body.rotation = Math.atan2(ry, rx) + 1.57;
    });
    this.posElapsed += this.app.ticker.elapsedMS;
  }

  timerDelay = 0;

  renderLocalMovement(delta: number) {
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

    const nextTileX = this.map.tileMap.tiles[
      `${Math.floor(newCharPos.x)};${Math.floor(this.player.position.y)}`
    ];
    const nextTileY = this.map.tileMap.tiles[
      `${Math.floor(this.player.position.x)};${Math.floor(newCharPos.y)}`
    ];
    if (nextTileY && nextTileX && nextTileY.walkable && nextTileX.walkable) {
      this.player.position.x = newCharPos.x;
      this.player.position.y = newCharPos.y;
    } else if (nextTileY && nextTileY.walkable) {
      this.player.position.y = newCharPos.y;
    } else if (nextTileX && nextTileX.walkable) {
      this.player.position.x = newCharPos.x;
    }

    this.map.tileMap.landTileSprites.x = mapOrigin.x - this.player.position.x * mapTileSize;
    this.map.tileMap.landTileSprites.y = mapOrigin.y - this.player.position.y * mapTileSize;
    this.map.tileMap.objectSprites.x = mapOrigin.x - this.player.position.x * mapTileSize;
    this.map.tileMap.objectSprites.y = mapOrigin.y - this.player.position.y * mapTileSize;

    if (this.timerDelay >= 3) {
      // * 16 ms * 3
      try {
        this.communicator.sendMsg(
          JSON.stringify({
            type: MsgType.UpdateCoords,
            payload: {
              position: this.player.position,
              orientation: this.player.orientation,
              velocity: this.player.velocity,
              hitting: this.player.hitting
            }
          })
        );
      } catch (_) {
        this.onConnectionFailure && this.onConnectionFailure();
      }
      this.timerDelay = 0;
    } else {
      this.timerDelay += delta;
    }
  }
}
