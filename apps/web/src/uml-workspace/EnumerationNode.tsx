import type { WorkspacePosition } from "./workspace-controller";
import type { UmlEnumeration } from "@primer-parcial/uml-domain";
import { NODE_WIDTH } from "./projection";

interface EnumerationNodeProps {
  readonly enumeration: UmlEnumeration;
  readonly position: WorkspacePosition;
  readonly selected: boolean;
  readonly onSelect: () => void;
}

export const ENUM_NODE_HEADER_HEIGHT = 28;
export const ENUM_NODE_MEMBER_HEIGHT = 16;
const ENUM_NODE_HEIGHT = 70;
const MAX_LITERALS = 3;

export function EnumerationNode({
  enumeration,
  position,
  selected,
  onSelect,
}: EnumerationNodeProps) {
  const visibleLiterals = enumeration.literals.slice(0, MAX_LITERALS);
  const className = selected
    ? "uml-workspace__node uml-workspace__node--selected"
    : "uml-workspace__node";

  return (
    <g
      class={className}
      transform={`translate(${position.x}, ${position.y})`}
      role="button"
      tabindex={0}
      aria-label={`Enumeración ${enumeration.name}`}
      aria-selected={selected}
      data-testid="enumeration-node"
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
        height={ENUM_NODE_HEIGHT}
        rx={2}
        fill="#fffaf0"
        stroke="#213432"
        strokeWidth={1}
      />
      <rect
        x={0}
        y={0}
        width={NODE_WIDTH}
        height={ENUM_NODE_HEADER_HEIGHT}
        fill="#f8f2e5"
        rx={2}
      />
      <rect
        x={0}
        y={ENUM_NODE_HEADER_HEIGHT}
        width={NODE_WIDTH}
        height={ENUM_NODE_HEIGHT - ENUM_NODE_HEADER_HEIGHT}
        fill="#fffaf0"
      />
      <text
        class="uml-workspace__node-header"
        x={NODE_WIDTH / 2}
        y={ENUM_NODE_HEADER_HEIGHT / 2 + 4}
        textAnchor="middle"
        fontSize={12}
        fill="#213432"
      >
        «enumeration» {enumeration.name}
      </text>
      <line
        x1={0}
        y1={ENUM_NODE_HEADER_HEIGHT}
        x2={NODE_WIDTH}
        y2={ENUM_NODE_HEADER_HEIGHT}
        stroke="#8b978e"
        strokeWidth={1}
      />
      {visibleLiterals.map((literal, index) => (
        <text
          key={literal.id}
          class="uml-workspace__member-item"
          x={8}
          y={ENUM_NODE_HEADER_HEIGHT + ENUM_NODE_MEMBER_HEIGHT * (index + 1)}
          fontSize={11}
          fill="#213432"
        >
          {literal.name}
        </text>
      ))}
      {enumeration.literals.length > MAX_LITERALS && (
        <text
          class="uml-workspace__member-item"
          x={8}
          y={ENUM_NODE_HEADER_HEIGHT + ENUM_NODE_MEMBER_HEIGHT * (MAX_LITERALS + 1) - 4}
          fontSize={11}
          fill="#52645d"
          fontStyle="italic"
        >
          +{enumeration.literals.length - MAX_LITERALS} más
        </text>
      )}
    </g>
  );
}