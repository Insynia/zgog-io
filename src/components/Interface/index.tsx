import { h } from "preact";
import { useState } from "preact/hooks";
import "./Interface.scss";
import { Game } from "../../game";
import { MsgType } from "../../communication";

interface Props {
  game: Game;
}

export default (props: Props) => {
  const [name, setName] = useState("");
  const [gameOn, setGameOn] = useState(false);
  const [loadingResources, setLoadingResources] = useState(true);
  const [connectionFailure, setConnectionFailure] = useState(false);

  const announcePlayer = (name: string) => {
    props.game.communicator.sendMsg(
      JSON.stringify({ type: MsgType.AnnouncePlayer, payload: { name: name } })
    );

    setGameOn(true);
  };

  props.game.onResourcesLoad = () => {
    setLoadingResources(false);
  };
  props.game.onConnectionFailure = () => {
    setConnectionFailure(true);
  };

  return (
    <div class="Interface">
      {!gameOn && (
        <div class="NewGameInterface">
          <input type="text" onChange={e => setName((e.target as HTMLInputElement).value)} />
          <button onClick={() => announcePlayer(name)}>Play</button>
        </div>
      )}
      {loadingResources && <div>Loading...</div>}
      {connectionFailure && <div class="Error">Failed to connect to the server...</div>}
    </div>
  );
};
