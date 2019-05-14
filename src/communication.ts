import { RawMap, PlayerData } from "./map";

enum MsgType {
  Map = "map",
  PlayerCoords = "player_coords"
}

export const setupSocket = (
  loadMap: (map: RawMap) => void,
  updatePlayers: (coords: PlayerData[]) => void
) => {
  const socket = new WebSocket("ws://192.168.1.21:2794/");

  socket.onopen = function(event) {
    socket.send(JSON.stringify({ type: "map", payload: "gros con" }));
  };

  socket.onmessage = function(event) {
    const msg = JSON.parse(event.data);
    if (msg.type === MsgType.Map) {
      loadMap(msg.payload);
    } else if (msg.type === MsgType.PlayerCoords) {
      updatePlayers(msg.payload);
    }
  };
};
