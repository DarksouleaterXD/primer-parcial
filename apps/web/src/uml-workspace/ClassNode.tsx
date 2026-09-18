import type { WorkspacePosition } from "./workspace-controller";
import type { UmlClass } from "@primer-parcial/uml-domain";
import { NODE_WIDTH } from "./projection";

interface ClassNodeProps {
  readonly cls: UmlClass;
  readonly position: WorkspacePosition;
  readonly selected: boolean;
  readonly onSelect: () => void;
}

export const CLASS_NODE_HEADER_HEIGHT = 28;
export const CLASS_NODE_MEMBER_HEIGHT = 16;
const CLASS_NODE_HEIGHT = 90;
const MAX_ATTRIBUTES = 4;
const MAX_OPERATIONS = 3;

export function ClassNode({
  cls,
  position,
  selected,
  onSelect,
}: ClassNodeProps) {
  const visibleAttributes = cls.attributes.slice(0, MAX_ATTRIBUTES);
  const visibleOperations = cls.operations.slice(0, MAX_OPERATIONS);
  const separatorY =
    CLASS_NODE_HEADER_HEIGHT + CLASS_NODE_MEMBER_HEIGHT * (MAX_ATTRIBUTES + 1) + 8;
  const className = selected
    ? "uml-workspace__node uml-workspace__node--selected"
    : "uml-workspace__node";

  return (
    <g
      class={className}
      transform={`translate(${position.x}, ${position.y})`}
      role="button"
      tabindex={0}
      aria-label={`Clase ${cls.name}`}
      aria-selected={selected}
      data-testid="class-node"
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <rect
        class="uml-workspace__node-card"
        width={NODE_WIDTH}
        height={CLASS_NODE_HEIGHT}
        rx={2}
        fill="#fffaf0"
        stroke="#213432"
        strokeWidth={1}
      />
      <rect
        x={0}
        y={0}
        width={NODE_WIDTH}
        height={CLASS_NODE_HEADER_HEIGHT}
        fill="#f8f2e5"
        rx={2}
      />
      <rect
        x={0}
        y={CLASS_NODE_HEADER_HEIGHT}
        width={NODE_WIDTH}
        height={CLASS_NODE_HEIGHT - CLASS_NODE_HEADER_HEIGHT}
        fill="#fffaf0"
      />
      <text
        class="uml-workspace__node-header"
        x={NODE_WIDTH / 2}
        y={CLASS_NODE_HEADER_HEIGHT / 2 + 4}
        textAnchor="middle"
        fontSize={12}
        fill="#213432"
      >
        {cls.name}
      </text>
      <line
        x1={0}
        y1={CLASS_NODE_HEADER_HEIGHT}
        x2={NODE_WIDTH}
        y2={CLASS_NODE_HEADER_HEIGHT}
        stroke="#8b978e"
        strokeWidth={1}
      />
      {visibleAttributes.map((attr, index) => (
        <text
          key={attr.id}
          class="uml-workspace__member-item"
          x={8}
          y={CLASS_NODE_HEADER_HEIGHT + CLASS_NODE_MEMBER_HEIGHT * (index + 1)}
          fontSize={11}
          fill="#213432"
        >
          {attr.name}
        </text>
      ))}
      {cls.attributes.length > MAX_ATTRIBUTES && (
        <text
          class="uml-workspace__member-item"
          x={8}
          y={CLASS_NODE_HEADER_HEIGHT + CLASS_NODE_MEMBER_HEIGHT * (MAX_ATTRIBUTES + 1)}
          fontSize={11}
          fill="#52645d"
          fontStyle="italic"
        >
          +{cls.attributes.length - MAX_ATTRIBUTES} más
        </text>
      )}
      {cls.operations.length > 0 && (
        <line
          x1={0}
          y1={separatorY}
          x2={NODE_WIDTH}
          y2={separatorY}
          stroke="#8b978e"
          strokeWidth={1}
        />
      )}
      {visibleOperations.map((op, index) => (
        <text
          key={op.id}
          class="uml-workspace__member-item"
          x={8}
          y={separatorY + CLASS_NODE_MEMBER_HEIGHT * (index + 1)}
          fontSize={11}
          fill="#213432"
        >
          {op.name}()
        </text>
      ))}
    </g>
  );
}