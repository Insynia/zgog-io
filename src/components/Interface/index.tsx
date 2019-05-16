import { h } from "preact";
import { useState } from "preact/hooks";
import "./Interface.scss";
import { Game } from "../../game";

interface Props {
  game: Game;
}

export default (props: Props) => {
  const [name, setName] = useState("");
  const [loadingResources, setLoadingResources] = useState(true);
  const [connectionFailure, setConnectionFailure] = useState(false);

  props.game.onResourcesLoad = () => {
    setLoadingResources(false);
  };
  props.game.onConnectionFailure = () => {
    setConnectionFailure(true);
  };

  return (
    <div class="Interface">
      <div class="NewGameInterface">
        <input type="text" onChange={e => setName((e.target as HTMLInputElement).value)} />
        <button onClick={() => console.log(name)}>Play</button>
      </div>
      {loadingResources && <div>Loading...</div>}
      {connectionFailure && <div>Failed to connect to the server...</div>}
    </div>
  );
};
