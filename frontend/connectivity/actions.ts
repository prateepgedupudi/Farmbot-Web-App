import { Actions } from "../constants";
import { Edge, EdgeStatus } from "./interfaces";
import { ReduxAction } from "../redux/interfaces";

type NetChange = ReduxAction<EdgeStatus>;

const change = (state: "up" | "down") =>
  (name: Edge, at = (new Date()).getTime(), why: string): NetChange => {
    return {
      type: Actions.NETWORK_EDGE_CHANGE,
      payload: { name, status: { state, at }, why }
    };
  };

export const networkUp = change("up");

export let networkDown = change("down");
