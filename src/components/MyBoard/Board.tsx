import React from "react";
import { useEffect } from "react";
import { autoScrollWindowForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { createRegistry } from "./registry";

const BoardContext = React.createContext<
  ReturnType<typeof createRegistry> & { instanceId: symbol }
>({} as any);

export const Board: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { instanceId } = React.useContext(BoardContext);

  useEffect(() => {
    return autoScrollWindowForElements({
      canScroll: ({ source }) => source.data.instanceId === instanceId,
    });
  }, [instanceId]);

  return <div className="flex space-x-4 overflow-x-auto p-4">{children}</div>;
};
