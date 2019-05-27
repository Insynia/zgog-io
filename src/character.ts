import { PlayerPayload } from "./communication";
import { XYVec } from "./character";
import * as PIXI from "pixi.js";
import { Resources } from "./game";

export interface XYVec {
  x: number;
  y: number;
}

const hitAnimation = {
  duration: 300,
  elems: {
    leftHand: [
      { position: { x: 0, y: -0.05 }, orientation: { x: 0, y: 0 } },
      { position: { x: 0, y: -0.1 }, orientation: { x: 0, y: 0 } },
      { position: { x: 0.025, y: -0.1 }, orientation: { x: 0, y: 0 } },
      { position: { x: 0.05, y: -0.1 }, orientation: { x: 0, y: 0 } },
      { position: { x: 0.025, y: 0 }, orientation: { x: 0, y: 0 } },
      { position: { x: 0, y: 0 }, orientation: { x: 0, y: 0 } }
    ],
    rightHand: [
      { position: { x: -0.05, y: -0.1 }, orientation: { x: 0, y: 0 } },
      { position: { x: -0.025, y: 0 }, orientation: { x: 0, y: 0 } },
      { position: { x: 0, y: 0 }, orientation: { x: 0, y: 0 } },
      { position: { x: 0, y: -0.05 }, orientation: { x: 0, y: 0 } },
      { position: { x: 0, y: -0.1 }, orientation: { x: 0, y: 0 } },
      { position: { x: -0.025, y: -0.1 }, orientation: { x: 0, y: 0 } }
    ]
  }
};

export class Character {
  id: string;
  position: XYVec;
  name: string;
  size: number;
  body: PIXI.Container;
  orientation: XYVec;
  velocity: XYVec;
  resources: Resources;
  lastLocalPos: { position: XYVec; orientation: XYVec };
  curPredictedPos: { position: XYVec; orientation: XYVec };
  bodySize = 1;
  handSize = 0.25;
  characterSpeed = 0.05;
  leftHand: PIXI.Sprite;
  rightHand: PIXI.Sprite;
  animationProgression: number;
  hitting: boolean;

  constructor(resources: Resources, player: PlayerPayload, size: number) {
    const textures = resources.character.textures;
    const body = new PIXI.Sprite(textures.body);
    const helmet = new PIXI.Sprite(textures.helmet);
    this.leftHand = new PIXI.Sprite(textures.hand);
    this.rightHand = new PIXI.Sprite(textures.hand);

    const v = player.velocity || { x: 0, y: 0 };
    const o = player.orientation || { x: 0, y: 0 };
    const p = player.position || { x: 0, y: 0 };

    this.lastLocalPos = { orientation: o, position: p };
    this.curPredictedPos = { orientation: o, position: p };
    this.size = size;
    this.hitting = false;
    this.leftHand.anchor.set(0.5);
    this.rightHand.anchor.set(0.5);
    body.anchor.set(0.5);
    helmet.anchor.set(0.5);
    this.leftHand.height = this.handSize * size;
    this.leftHand.width = this.handSize * size;
    this.rightHand.height = this.handSize * size;
    this.rightHand.width = this.handSize * size;
    this.leftHand.x = (-size * this.bodySize) / 4;
    this.leftHand.y = (-size * this.bodySize) / 4;
    this.rightHand.x = (size * this.bodySize) / 4;
    this.rightHand.y = (-size * this.bodySize) / 4;
    body.height = this.bodySize * size;
    body.width = this.bodySize * size;
    helmet.height = this.bodySize * size;
    helmet.width = this.bodySize * size;

    const container = new PIXI.Container();
    container.interactive = true;
    container.zIndex = 2;
    container.addChild(this.leftHand);
    container.addChild(this.rightHand);
    container.addChild(body);
    if (player.name === "Doc")
      // Oh youuuu !
      container.addChild(helmet);

    this.resources = resources;
    this.id = player.id;
    this.position = p;
    this.orientation = o;
    this.velocity = v;
    this.body = container;
  }

  update(player: PlayerPayload) {
    this.position = player.position;
    this.velocity = player.velocity;
    this.orientation = player.orientation;
    this.hitting = player.hitting;
    this.name = player.name;
    this.lastLocalPos = this.curPredictedPos;
  }

  move(mouse: { x: number; y: number }) {
    const mouseLeeway = 32;

    this.orientation = { y: mouse.y - window.innerHeight / 2, x: mouse.x - window.innerWidth / 2 };

    if (mouse.y > window.innerHeight / 2 + mouseLeeway) {
      this.velocity.y = this.characterSpeed * (2 - Math.max(1, window.innerHeight / 1.2 / mouse.y));
    } else if (mouse.y < window.innerHeight / 2 - mouseLeeway) {
      this.velocity.y =
        -this.characterSpeed *
        (2 - Math.max(1, window.innerHeight / 1.2 / (window.innerHeight - mouse.y)));
    } else {
      this.velocity.y = 0;
    }
    if (mouse.x > window.innerWidth / 2 + mouseLeeway) {
      this.velocity.x = this.characterSpeed * (2 - Math.max(1, window.innerWidth / 1.2 / mouse.x));
    } else if (mouse.x < window.innerWidth / 2 - mouseLeeway) {
      this.velocity.x =
        -this.characterSpeed *
        (2 - Math.max(1, window.innerWidth / 1.2 / (window.innerWidth - mouse.x)));
    } else {
      this.velocity.x = 0;
    }
  }

  lerp(start: number, end: number, rt: number) {
    const t = Math.min(rt, 1);
    return (1 - t) * start + t * end;
  }

  timeSinceLastFrame = 0;
  currentFrame = {
    index: 0,
    leftHand: { position: { x: 0, y: 0 } },
    rightHand: { position: { x: 0, y: 0 } }
  };

  animate(elapsedMS: number) {
    const baseLeftHandX = (-this.size * this.bodySize) / 4;
    const baseLeftHandY = (-this.size * this.bodySize) / 4;
    const baseRightHandX = (this.size * this.bodySize) / 4;
    const baseRightHandY = (-this.size * this.bodySize) / 4;
    const nbAnimations = hitAnimation.elems.leftHand.length;
    this.timeSinceLastFrame += elapsedMS;
    const timeBetweenFrames = hitAnimation.duration / nbAnimations;
    console.log(this.hitting);
    if (this.hitting) {
      // Change frame
      if (this.timeSinceLastFrame > timeBetweenFrames) {
        this.currentFrame.index =
          this.currentFrame.index === nbAnimations - 1 ? 0 : this.currentFrame.index + 1;
        this.timeSinceLastFrame = 0;
      }

      this.currentFrame.leftHand.position.x = this.lerp(
        this.currentFrame.leftHand.position.x,
        hitAnimation.elems.leftHand[this.currentFrame.index].position.x,
        this.timeSinceLastFrame / timeBetweenFrames
      );
      this.currentFrame.leftHand.position.y = this.lerp(
        this.currentFrame.leftHand.position.y,
        hitAnimation.elems.leftHand[this.currentFrame.index].position.y,
        this.timeSinceLastFrame / timeBetweenFrames
      );
      this.leftHand.x = baseLeftHandX + this.currentFrame.leftHand.position.x * this.size;
      this.leftHand.y = baseLeftHandY + this.currentFrame.leftHand.position.y * this.size;

      this.currentFrame.rightHand.position.x = this.lerp(
        this.currentFrame.rightHand.position.x,
        hitAnimation.elems.rightHand[this.currentFrame.index].position.x,
        this.timeSinceLastFrame / timeBetweenFrames
      );
      this.currentFrame.rightHand.position.y = this.lerp(
        this.currentFrame.rightHand.position.y,
        hitAnimation.elems.rightHand[this.currentFrame.index].position.y,
        this.timeSinceLastFrame / timeBetweenFrames
      );
      this.rightHand.x = baseRightHandX + this.currentFrame.rightHand.position.x * this.size;
      this.rightHand.y = baseRightHandY + this.currentFrame.rightHand.position.y * this.size;
    } else if (
      this.currentFrame.leftHand.position !== { x: 0, y: 0 } ||
      this.currentFrame.rightHand.position !== { x: 0, y: 0 }
    ) {
      if (this.timeSinceLastFrame > 0) {
        this.timeSinceLastFrame = elapsedMS;
      }
      this.currentFrame.leftHand.position.x = this.lerp(
        this.currentFrame.leftHand.position.x,
        0,
        this.timeSinceLastFrame / timeBetweenFrames
      );
      this.currentFrame.leftHand.position.y = this.lerp(
        this.currentFrame.leftHand.position.y,
        0,
        this.timeSinceLastFrame / timeBetweenFrames
      );
      this.leftHand.x = baseLeftHandX + this.currentFrame.leftHand.position.x * this.size;
      this.leftHand.y = baseLeftHandY + this.currentFrame.leftHand.position.y * this.size;

      this.currentFrame.rightHand.position.x = this.lerp(
        this.currentFrame.rightHand.position.x,
        0,
        this.timeSinceLastFrame / timeBetweenFrames
      );
      this.currentFrame.rightHand.position.y = this.lerp(
        this.currentFrame.rightHand.position.y,
        0,
        this.timeSinceLastFrame / timeBetweenFrames
      );
      this.rightHand.x = baseRightHandX + this.currentFrame.rightHand.position.x * this.size;
      this.rightHand.y = baseRightHandY + this.currentFrame.rightHand.position.y * this.size;
    }
  }
}
