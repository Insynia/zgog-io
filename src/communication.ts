import { XYVec } from "./character";
export enum MsgType {
  AnnouncePlayer = "new_player",
  ReceivePlayer = "hero",
  Map = "map",
  PlayerUpdated = "player_updated",
  UpdateCoords = "player_coords"
}

// Payloads
export interface PlayerPayload {
  name: string;
  id: string;
  position: XYVec;
  orientation: XYVec;
  velocity: XYVec;
}

export interface TilePayload {
  x: number;
  y: number;
  type: number;
  index: number;
  walkable: boolean;
}

export interface MapPayload {
  width: number;
  height: number;
  content: { [coords: string]: TilePayload[] };
}

export const setupSocket = async (): Promise<Communicator> => {
  const communicator = new Communicator("ws://localhost:2794/");
  await communicator.connect();
  return communicator;
};

export class Communicator {
  url: string;
  socket: WebSocket;
  handlers: { type: MsgType; handler: (data: any) => void }[];

  constructor(uri: string) {
    this.socket = new WebSocket(uri);
    this.handlers = [];
    this.socket.onmessage = event => {
      const msg = JSON.parse(event.data);

      this.handlers.forEach(h => {
        if (msg.type === h.type) {
          h.handler(msg.payload);
        }
      });
    };
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.socket.onopen = function() {
        resolve(this);
      };
      this.socket.onerror = function(err: any) {
        reject(err);
      };
    });
  }

  on(msg: MsgType, fn: any) {
    this.handlers.push({ type: msg, handler: fn });
  }

  sendMsg(msg: string | ArrayBuffer | Blob | ArrayBufferView) {
    this.socket.send(msg);
  }
}
