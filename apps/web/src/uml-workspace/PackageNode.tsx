import type { WorkspacePosition } from "./workspace-controller";
import type { UmlPackage } from "@primer-parcial/uml-domain";
import { NODE_WIDTH } from "./projection";

interface PackageNodeProps {
  readonly pkg: UmlPackage;
  readonly position: WorkspacePosition;
  readonly selected: boolean;
  readonly onSelect: () => void;
}

const PACKAGE_NODE_HEIGHT = 50;
const PACKAGE_NODE_HEADER_HEIGHT = 28;

export function PackageNode({
  pkg,
  position,
  selected,
  onSelect,
}: PackageNodeProps) {
  const className = selected
    ? "uml-workspace__node uml-workspace__node--selected"
    : "uml-workspace__node";

  return (
    <g
      class={className}
      transform={`translate(${position.x}, ${position.y})`}
      role="button"
      tabindex={0}
      aria-label={`Paquete ${pkg.name}`}
      aria-selected={selected}
      data-testid="package-node"
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
        height={PACKAGE_NODE_HEIGHT}
        rx={2}
        fill="#fffaf0"
        stroke="#213432"
        strokeWidth={1}
      />
      <rect
        x={0}
        y={0}
        width={NODE_WIDTH}
        height={PACKAGE_NODE_HEADER_HEIGHT}
        fill="#f8f2e5"
        rx={2}
      />
      <rect
        x={0}
        y={PACKAGE_NODE_HEADER_HEIGHT}
        width={NODE_WIDTH}
        height={PACKAGE_NODE_HEIGHT - PACKAGE_NODE_HEADER_HEIGHT}
        fill="#fffaf0"
      />
      <text
        class="uml-workspace__node-header"
        x={NODE_WIDTH / 2}
        y={PACKAGE_NODE_HEADER_HEIGHT / 2 + 4}
        textAnchor="middle"
        fontSize={12}
        fill="#213432"
      >
        «package» {pkg.name}
      </text>
    </g>
  );
}