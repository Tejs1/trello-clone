import React, { useContext } from "react";
import invariant from "tiny-invariant";

import { type createRegistry } from "./registry";

export const BoardContext = React.createContext<
  ReturnType<typeof createRegistry> & { instanceId: symbol }
>({} as ReturnType<typeof createRegistry> & { instanceId: symbol });

export function useBoardContext() {
  const value = useContext(BoardContext);
  invariant(value, "cannot find BoardContext provider");
  return value;
}
