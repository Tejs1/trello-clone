import React, { useEffect, useContext } from "react";
import { autoScrollWindowForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { createRegistry } from "./registry";
import { BoardContext } from "./board-context";

export const Board: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { instanceId } = useContext(BoardContext);

  useEffect(() => {
    const cleanup = autoScrollWindowForElements({
      canScroll: ({ source }) => source.data.instanceId === instanceId,
    });

    return cleanup;
  }, [instanceId]);

  return <div className="flex space-x-4 overflow-x-auto p-4">{children}</div>;
};
