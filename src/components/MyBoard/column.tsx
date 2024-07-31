import React, {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createPortal } from "react-dom";
import invariant from "tiny-invariant";

import { IconButton } from "@atlaskit/button/new";
import DropdownMenu, {
  type CustomTriggerProps,
  DropdownItem,
  DropdownItemGroup,
} from "@atlaskit/dropdown-menu";
// eslint-disable-next-line @atlaskit/design-system/no-banned-imports
import mergeRefs from "@atlaskit/ds-lib/merge-refs";
import Heading from "@atlaskit/heading";
// This is the smaller MoreIcon soon to be more easily accessible with the
// ongoing icon project
import MoreIcon from "@atlaskit/icon/glyph/editor/more";
import { easeInOut } from "@atlaskit/motion/curves";
import { mediumDurationMs } from "@atlaskit/motion/durations";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import {
  attachClosestEdge,
  type Edge,
  extractClosestEdge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { DropIndicator } from "@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { centerUnderPointer } from "@atlaskit/pragmatic-drag-and-drop/element/center-under-pointer";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { Box, Flex, Inline, Stack, xcss } from "@atlaskit/primitives";
import { token } from "@atlaskit/tokens";

import { type ColumnType } from "../data/people";

import { BoardContext, useBoardContext } from "./board-context";

import {
  ColumnContext,
  type ColumnContextProps,
  useColumnContext,
} from "./column-context";
import { TaskCard } from "./card";
import { Status, Task } from "@/store";

const columnStyles = xcss({
  width: "250px",
  backgroundColor: "elevation.surface.sunken",
  borderRadius: "border.radius.300",
  transition: `background ${mediumDurationMs}ms ${easeInOut}`,
  position: "relative",
  /**
   * TODO: figure out hover color.
   * There is no `elevation.surface.sunken.hovered` token,
   * so leaving this for now.
   */
});

const stackStyles = xcss({
  // allow the container to be shrunk by a parent height
  // https://www.joshwcomeau.com/css/interactive-guide-to-flexbox/#the-minimum-size-gotcha-11
  minHeight: "0",

  // ensure our card list grows to be all the available space
  // so that users can easily drop on en empty list
  flexGrow: 1,
});

const scrollContainerStyles = xcss({
  height: "100%",
  overflowY: "auto",
});

const cardListStyles = xcss({
  boxSizing: "border-box",
  minHeight: "100%",
  padding: "space.100",
  gap: "space.100",
});

const columnHeaderStyles = xcss({
  paddingInlineStart: "space.200",
  paddingInlineEnd: "space.200",
  paddingBlockStart: "space.100",
  color: "color.text.subtlest",
  userSelect: "none",
});

/**
 * Note: not making `'is-dragging'` a `State` as it is
 * a _parallel_ state to `'is-column-over'`.
 *
 * Our board allows you to be over the column that is currently dragging
 */
type State =
  | { type: "idle" }
  | { type: "is-card-over" }
  | { type: "is-column-over"; closestEdge: Edge | null }
  | { type: "generate-safari-column-preview"; container: HTMLElement }
  | { type: "generate-column-preview" };

// preventing re-renders with stable state objects
const idle: State = { type: "idle" };
const isCardOver: State = { type: "is-card-over" };

const stateStyles: {
  [key in State["type"]]: ReturnType<typeof xcss> | undefined;
} = {
  idle: xcss({
    cursor: "grab",
  }),
  "is-card-over": xcss({
    backgroundColor: "color.background.selected.hovered",
  }),
  "is-column-over": undefined,
  /**
   * **Browser bug workaround**
   *
   * _Problem_
   * When generating a drag preview for an element
   * that has an inner scroll container, the preview can include content
   * vertically before or after the element
   *
   * _Fix_
   * We make the column a new stacking context when the preview is being generated.
   * We are not making a new stacking context at all times, as this _can_ mess up
   * other layering components inside of your card
   *
   * _Fix: Safari_
   * We have not found a great workaround yet. So for now we are just rendering
   * a custom drag preview
   */
  "generate-column-preview": xcss({
    isolation: "isolate",
  }),
  "generate-safari-column-preview": undefined,
};

const isDraggingStyles = xcss({
  opacity: 0.4,
});

export const Column: React.FC<{ status: Status; tasks: Task[] }> = ({
  status,
  tasks,
}) => {
  const { registerColumn, instanceId } = useContext(BoardContext);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const unregister = registerColumn({
        columnId: status,
        entry: { element: ref.current },
      });

      const cleanup = combine(
        draggable({
          element: ref.current,
          dragHandle: ref.current.querySelector("h2")!,
          getInitialData: () => ({
            type: "column",
            columnId: status,
            instanceId,
          }),
        }),
        dropTargetForElements({
          element: ref.current,
          getIsSticky: () => true,
          getData: () => ({
            type: "column",
            columnId: status,
            instanceId,
          }),
        }),
      );

      return () => {
        unregister();
        cleanup();
      };
    }
  }, [status, registerColumn, instanceId]);

  return (
    <div ref={ref} className="w-64 rounded-lg bg-gray-100 p-4">
      <h2 className="mb-4 font-bold">{status.replace("_", " ")}</h2>
      {tasks.map((task, index) => (
        <TaskCard key={task.id} task={task} index={index} />
      ))}
    </div>
  );
};

const safariPreviewStyles = xcss({
  width: "250px",
  backgroundColor: "elevation.surface.sunken",
  borderRadius: "border.radius",
  padding: "space.200",
});

function SafariColumnPreview({ column }: { column: ColumnType }) {
  return (
    <Box xcss={[columnHeaderStyles, safariPreviewStyles]}>
      <Heading size="xxsmall" as="span">
        {column.title}
      </Heading>
    </Box>
  );
}

function ActionMenu() {
  return (
    <DropdownMenu trigger={DropdownMenuTrigger}>
      <ActionMenuItems />
    </DropdownMenu>
  );
}

function ActionMenuItems() {
  const { columnId } = useColumnContext();
  const { getColumns, reorderColumn } = useBoardContext();

  const columns = getColumns();
  const startIndex = columns.findIndex(
    (column: { columnId: string }) => column.columnId === columnId,
  );

  const moveLeft = useCallback(() => {
    reorderColumn({
      startIndex,
      finishIndex: startIndex - 1,
    });
  }, [reorderColumn, startIndex]);

  const moveRight = useCallback(() => {
    reorderColumn({
      startIndex,
      finishIndex: startIndex + 1,
    });
  }, [reorderColumn, startIndex]);

  const isMoveLeftDisabled = startIndex === 0;
  const isMoveRightDisabled = startIndex === columns.length - 1;

  return (
    <DropdownItemGroup>
      <DropdownItem onClick={moveLeft} isDisabled={isMoveLeftDisabled}>
        Move left
      </DropdownItem>
      <DropdownItem onClick={moveRight} isDisabled={isMoveRightDisabled}>
        Move right
      </DropdownItem>
    </DropdownItemGroup>
  );
}

function DropdownMenuTrigger({
  triggerRef,
  ...triggerProps
}: CustomTriggerProps) {
  return (
    <IconButton
      ref={mergeRefs([triggerRef])}
      appearance="subtle"
      label="Actions"
      spacing="compact"
      icon={MoreIcon}
      {...triggerProps}
    />
  );
}
