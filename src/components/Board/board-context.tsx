import React, { useContext } from "react";
import invariant from "tiny-invariant";

import { createRegistry } from "./registry";

export const BoardContext = React.createContext<
  ReturnType<typeof createRegistry> & { instanceId: symbol }
>({} as any);

export function useBoardContext() {
  const value = useContext(BoardContext);
  invariant(value, "cannot find BoardContext provider");
  return value;
}
