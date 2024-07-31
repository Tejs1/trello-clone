import React from "react";
import { createRegistry } from "./registry";

export const BoardContext = React.createContext<
  ReturnType<typeof createRegistry> & { instanceId: symbol }
>({} as any);
