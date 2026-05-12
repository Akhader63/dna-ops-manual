import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Filter,
  Download,
  Printer,
  FileText,
  Shield,
  Map,
  ChevronDown,
  X,
  CheckCircle2,
  CircleDot,
  Landmark,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  DATA TYPES                                                         */
/* ------------------------------------------------------------------ */

type ViewMode = "full" | "module" | "role";
type NodeType = "start" | "module" | "transaction" | "approval" | "document" | "decision" | "end";
type ConnStyle = "solid" | "dashed" | "dotted";

interface RoadmapNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  label: string;
  moduleId?: string;
  color?: string;
  role?: string;
  roleColor?: string;
  code?: string;
  useCaseCount?: number;
  approvalRequired?: boolean;
  description?: string;
  decisionLabel?: string;
  approvalLevel?: string;
}

interface Connection {
  from: string;
  to: string;
  style: ConnStyle;
  label?: string;
}

/* ------------------------------------------------------------------ */
/*  CONSTANTS                                                          */
/* ------------------------------------------------------------------ */

const MODULE_COLORS: Record<string, string> = {
  fin: "#059669",
  inv: "#D97706",
  pur: "#F3350C",
  sal: "#3B82F6",
};

const MODULE_ICONS: Record<string, React.ReactNode> = {
  fin: <Landmark className="size-4" />,
  inv: <Package className="size-4" />,
  pur: <ShoppingCart className="size-4" />,
  sal: <Users className="size-4" />,
};

const ROLE_COLORS: Record<string, string> = {
  Accountant: "#2563EB",
  "Finance Manager": "#059669",
  Storekeeper: "#434343",
  "Operations Manager": "#885FF2",
  "Purchase Officer": "#D97706",
  "Department Head": "#7C3AED",
};

const CANVAS_W = 2200;
const CANVAS_H = 1400;

/* ------------------------------------------------------------------ */
/*  EMPTY DATA                                                        */
/* ------------------------------------------------------------------ */

const nodesData: RoadmapNode[] = [];

const connectionsData: Connection[] = [];

/* ------------------------------------------------------------------ */
/*  HELPER: Build node lookup map                                      */
/* ------------------------------------------------------------------ */

function useNodeMap(nodes: RoadmapNode[]) {
  return useMemo(() => {
    const map: Record<string, RoadmapNode> = {};
    nodes.forEach((n) => (map[n.id] = n));
    return map;
  }, [nodes]);
}

/* ------------------------------------------------------------------ */
/*  SVG CONNECTIONS                                                    */
/* ------------------------------------------------------------------ */

function svgPos(n: RoadmapNode): { cx: number; cy: number } {
  switch (n.type) {
    case "start":
    case "end":
      return { cx: n.x + 60, cy: n.y + 24 };
    case "module":
      return { cx: n.x + 100, cy: n.y + 20 };
    case "transaction":
      return { cx: n.x + 120, cy: n.y + 50 };
    case "approval":
      return { cx: n.x + 40, cy: n.y + 40 };
    case "document":
      return { cx: n.x + 80, cy: n.y + 24 };
    case "decision":
      return { cx: n.x + 50, cy: n.y + 50 };
    default:
      return { cx: n.x, cy: n.y };
  }
}

function nodeWidth(n: RoadmapNode): number {
  switch (n.type) {
    case "start":
    case "end":
      return 120;
    case "module":
      return 200;
    case "transaction":
      return 240;
    case "approval":
      return 80;
    case "document":
      return 160;
    case "decision":
      return 100;
    default:
      return 100;
  }
}


function edgePoint(
  n: RoadmapNode,
  side: "left" | "right"
): { x: number; y: number } {
  const { cx, cy } = svgPos(n);
  const w = nodeWidth(n);
  if (side === "left") return { x: cx - w / 2, y: cy };
  return { x: cx + w / 2, y: cy };
}

/* ------------------------------------------------------------------ */
/*  NODE RENDERERS                                                     */
/* ------------------------------------------------------------------ */

function StartEndNode({
  node,
  dim,
  onClick,
}: {
  node: RoadmapNode;
  dim: boolean;
  onClick?: () => void;
}) {
  const isEnd = node.type === "end";
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: dim ? 0.4 : 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
      onClick={onClick}
      className={cn(
        "absolute flex items-center justify-center select-none cursor-pointer transition-opacity duration-200",
        isEnd && "border-[3px] border-dna-pomegranate"
      )}
      style={{
        left: node.x,
        top: node.y,
        width: 120,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#000",
        color: "#fff",
        zIndex: 10,
      }}
    >
      <span className="text-sm font-semibold">{node.label}</span>
    </motion.div>
  );
}

function ModuleNode({
  node,
  dim,
}: {
  node: RoadmapNode;
  dim: boolean;
}) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: dim ? 0.4 : 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
      className="absolute flex items-center justify-center gap-2 select-none"
      style={{
        left: node.x,
        top: node.y,
        width: 200,
        height: 40,
        borderRadius: 8,
        backgroundColor: node.color || "#333",
        color: "#fff",
        zIndex: 10,
      }}
    >
      <span style={{ color: "#fff" }}>{node.moduleId ? MODULE_ICONS[node.moduleId] : null}</span>
      <span className="text-[13px] font-semibold">{node.label}</span>
    </motion.div>
  );
}

function TransactionNode({
  node,
  dim,
  glow,
  onHover,
  onLeave,
  onClick,
}: {
  node: RoadmapNode;
  dim: boolean;
  glow: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  const modColor = node.color || "#C7C7C7";
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: dim ? 0.4 : 1,
            }}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
            onClick={onClick}
            className={cn(
              "absolute cursor-pointer select-none bg-white transition-all duration-200",
              glow && "ring-2 ring-offset-2"
            )}
            style={{
              left: node.x,
              top: node.y,
              width: 240,
              minHeight: 100,
              borderRadius: 10,
              border: `2px solid ${modColor}4D`,
              padding: 16,
              boxShadow: glow
                ? `0 4px 20px ${modColor}40, 0 2px 8px rgba(0,0,0,0.08)`
                : "0 1px 3px rgba(0,0,0,0.08)",
              zIndex: 20,
              ...(glow ? { ringColor: modColor } : {}),
            }}
          >
            {/* Transaction Code */}
            <div className="font-mono text-[11px]" style={{ color: "#C7C7C7" }}>
              {node.code}
            </div>

            {/* Transaction Name */}
            <div className="mt-1 text-[13px] font-semibold text-black leading-tight">
              {node.label}
            </div>

            {/* Role & Meta Row */}
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {node.role && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
                  style={{ backgroundColor: node.roleColor || "#999" }}
                >
                  {node.role}
                </span>
              )}
              {typeof node.useCaseCount === "number" && (
                <span className="text-[11px] text-[#434343]">
                  {node.useCaseCount} use cases
                </span>
              )}
              {node.approvalRequired && (
                <Shield className="size-4 text-amber-500 ml-auto" />
              )}
            </div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[260px] bg-black text-white border-none">
          <div className="space-y-1">
            <p className="font-semibold text-sm">{node.label}</p>
            <p className="text-xs text-white/70">{node.description}</p>
            <div className="flex items-center gap-2 pt-1">
              {node.role && (
                <Badge
                  className="text-[10px] text-white border-0"
                  style={{ backgroundColor: node.roleColor }}
                >
                  {node.role}
                </Badge>
              )}
              <span className="text-[10px] text-white/60">
                {node.useCaseCount} use cases
              </span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ApprovalNode({
  node,
  dim,
  onClick,
}: {
  node: RoadmapNode;
  dim: boolean;
  onClick: () => void;
}) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: dim ? 0.4 : 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.5 }}
      onClick={onClick}
      className="absolute flex items-center justify-center cursor-pointer select-none"
      style={{
        left: node.x,
        top: node.y,
        width: 80,
        height: 80,
        zIndex: 15,
        filter: dim ? undefined : "drop-shadow(0 2px 8px rgba(243,53,12,0.2))",
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: 56,
          height: 56,
          backgroundColor: "#F3350C",
          transform: "rotate(45deg)",
          borderRadius: 4,
        }}
      >
        <span
          className="text-sm font-bold text-white"
          style={{ transform: "rotate(-45deg)" }}
        >
          {node.approvalLevel || node.label}
        </span>
      </div>
    </motion.div>
  );
}

function DocumentNode({
  node,
  dim,
}: {
  node: RoadmapNode;
  dim: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: dim ? 0.4 : 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.4 }}
      className="absolute flex items-center gap-2 select-none bg-[#F0EFEA] border border-[#DDDDDD]"
      style={{
        left: node.x,
        top: node.y,
        width: 160,
        height: 48,
        borderRadius: 8,
        padding: "0 12px",
        zIndex: 10,
      }}
    >
      <FileText className="size-[14px] text-dna-silver shrink-0" />
      <span className="text-xs font-medium text-[#434343] truncate">{node.label}</span>
    </motion.div>
  );
}

function DecisionNode({
  node,
  dim,
}: {
  node: RoadmapNode;
  dim: boolean;
}) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: dim ? 0.4 : 1 }}
      transition={{ duration: 0.3, delay: 0.35 }}
      className="absolute flex items-center justify-center select-none"
      style={{
        left: node.x,
        top: node.y,
        width: 100,
        height: 100,
        zIndex: 12,
      }}
    >
      <div
        className="flex items-center justify-center bg-white border-2 border-amber-600"
        style={{
          width: 70,
          height: 70,
          transform: "rotate(45deg)",
          borderRadius: 4,
          borderColor: "#D97706",
        }}
      >
        <span
          className="text-[11px] font-medium text-center leading-tight"
          style={{ transform: "rotate(-45deg)", color: "#D97706" }}
        >
          {node.decisionLabel || node.label}
        </span>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  CONNECTION LINES (SVG)                                             */
/* ------------------------------------------------------------------ */

function buildPath(
  from: RoadmapNode,
  to: RoadmapNode
): string {
  const s = edgePoint(from, "right");
  const e = edgePoint(to, "left");
  const dx = e.x - s.x;
  const cp1x = s.x + dx * 0.5;
  const cp1y = s.y;
  const cp2x = e.x - dx * 0.5;
  const cp2y = e.y;
  return `M ${s.x} ${s.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${e.x} ${e.y}`;
}

function ConnectionsSvg({
  connections,
  nodeMap,
  highlightedNode,
  roleFilter,
}: {
  connections: Connection[];
  nodeMap: Record<string, RoadmapNode>;
  highlightedNode: string | null;
  roleFilter: string | null;
}) {
  const paths = useMemo(() => {
    return connections
      .map((conn, i) => {
        const fromNode = nodeMap[conn.from];
        const toNode = nodeMap[conn.to];
        if (!fromNode || !toNode) return null;

        const isHighlighted =
          highlightedNode === conn.from || highlightedNode === conn.to;

        // Role filter: only show connections involving selected role
        const roleRelevant =
          !roleFilter ||
          fromNode.role === roleFilter ||
          toNode.role === roleFilter;

        const shouldDim = roleFilter && !roleRelevant;

        const d = buildPath(fromNode, toNode);
        const strokeColor =
          conn.style === "dashed" ? "#F3350C" : isHighlighted ? "#000" : "#C7C7C7";
        const strokeWidth = isHighlighted ? 3 : 2;
        const dashArray =
          conn.style === "dashed"
            ? "8 4"
            : conn.style === "dotted"
              ? "3 3"
              : "none";

        return (
          <g key={i} opacity={shouldDim ? 0.15 : isHighlighted ? 1 : 0.7}>
            <path
              d={d}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
              style={{
                transition: "all 0.2s ease",
              }}
              markerEnd={`url(#arrow-${conn.style})`}
            />
            {conn.label && (
              <text
                x={(edgePoint(fromNode, "right").x + edgePoint(toNode, "left").x) / 2}
                y={(edgePoint(fromNode, "right").y + edgePoint(toNode, "left").y) / 2 - 6}
                textAnchor="middle"
                fill={conn.style === "dotted" ? "#D97706" : "#434343"}
                fontSize={10}
                fontWeight={500}
              >
                {conn.label}
              </text>
            )}
          </g>
        );
      })
      .filter(Boolean);
  }, [connections, nodeMap, highlightedNode, roleFilter]);

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={CANVAS_W}
      height={CANVAS_H}
      style={{ zIndex: 5 }}
    >
      <defs>
        <marker
          id="arrow-solid"
          viewBox="0 0 10 7"
          refX="9"
          refY="3.5"
          markerWidth="8"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 3.5 L 0 7 z" fill="#C7C7C7" />
        </marker>
        <marker
          id="arrow-dashed"
          viewBox="0 0 10 7"
          refX="9"
          refY="3.5"
          markerWidth="8"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 3.5 L 0 7 z" fill="#F3350C" />
        </marker>
        <marker
          id="arrow-dotted"
          viewBox="0 0 10 7"
          refX="9"
          refY="3.5"
          markerWidth="8"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 3.5 L 0 7 z" fill="#D97706" />
        </marker>
      </defs>
      {paths}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN COMPONENT                                                     */
/* ------------------------------------------------------------------ */

export default function RoadmapGenerator() {
  const [zoom, setZoom] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("full");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<RoadmapNode | null>(null);
  const [selectedApproval, setSelectedApproval] = useState<RoadmapNode | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("png");
  const [exportLegend, setExportLegend] = useState(true);
  const [exportRoleColors, setExportRoleColors] = useState(true);
  const [exportPaper, setExportPaper] = useState("A4");
  const [exportOrientation, setExportOrientation] = useState("landscape");
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [scrollStart, setScrollStart] = useState({ left: 0, top: 0 });

  const viewportRef = useRef<HTMLDivElement>(null);
  const nodeMap = useNodeMap(nodesData);

  /* -- Zoom helpers -- */
  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(2.0, Math.round((z + 0.1) * 10) / 10));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(0.25, Math.round((z - 0.1) * 10) / 10));
  }, []);

  const handleFitToScreen = useCallback(() => {
    if (!viewportRef.current) return;
    const vw = viewportRef.current.clientWidth;
    const vh = viewportRef.current.clientHeight;
    const scaleX = (vw - 80) / CANVAS_W;
    const scaleY = (vh - 80) / CANVAS_H;
    setZoom(Math.max(0.25, Math.min(1, Math.floor(Math.min(scaleX, scaleY) * 10) / 10)));
  }, []);

  /* -- Pan handlers -- */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      if ((e.target as HTMLElement).closest("[data-node]")) return;
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      if (viewportRef.current) {
        setScrollStart({
          left: viewportRef.current.scrollLeft,
          top: viewportRef.current.scrollTop,
        });
      }
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning || !viewportRef.current) return;
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      viewportRef.current.scrollLeft = scrollStart.left - dx;
      viewportRef.current.scrollTop = scrollStart.top - dy;
    },
    [isPanning, panStart, scrollStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  /* -- Node visibility -- */
  const isNodeVisible = useCallback(
    (node: RoadmapNode): boolean => {
      if (viewMode === "full") return true;
      if (viewMode === "module" && node.moduleId) return true;
      if (viewMode === "role" && node.role) return true;
      if (["start", "end", "module"].includes(node.type)) return true;
      return false;
    },
    [viewMode]
  );

  const isNodeDimmed = useCallback(
    (node: RoadmapNode): boolean => {
      if (!roleFilter) return false;
      return node.role !== roleFilter;
    },
    [roleFilter]
  );

  const isNodeGlowing = useCallback(
    (node: RoadmapNode): boolean => {
      if (!roleFilter) return false;
      return node.role === roleFilter;
    },
    [roleFilter]
  );

  /* -- Wheel zoom -- */
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom((z) => {
          const next = e.deltaY < 0 ? z + 0.05 : z - 0.05;
          return Math.max(0.25, Math.min(2.0, Math.round(next * 100) / 100));
        });
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  /* -- Derived filtered nodes -- */
  const visibleNodes = useMemo(
    () => nodesData.filter((n) => isNodeVisible(n)),
    [isNodeVisible]
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col h-screen" style={{ backgroundColor: "#F8F7F3" }}>
        {/* ===== CANVAS TOOLBAR ===== */}
        <div
          className="flex items-center justify-between px-4 border-b bg-white shrink-0"
          style={{ height: 56 }}
        >
          {/* Left: Zoom + View Mode */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border rounded-md px-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleZoomOut}
                className="size-7"
              >
                <ZoomOut className="size-4" />
              </Button>
              <span className="text-xs font-medium w-10 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleZoomIn}
                className="size-7"
              >
                <ZoomIn className="size-4" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleFitToScreen}
              className="h-7 gap-1 text-xs"
            >
              <Maximize className="size-3.5" />
              Fit
            </Button>

            <div className="h-5 w-px bg-[#DDDDDD] mx-1" />

            {/* View mode segmented control */}
            <div
              className="flex items-center rounded-md p-0.5 gap-0.5"
              style={{ backgroundColor: "#F0EFEA" }}
            >
              {(["full", "module", "role"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "px-2.5 py-1 rounded text-xs font-medium transition-all duration-150",
                    viewMode === mode
                      ? "bg-white shadow-sm text-black"
                      : "text-[#434343] hover:text-black"
                  )}
                >
                  {mode === "full"
                    ? "Full Flow"
                    : mode === "module"
                      ? "By Module"
                      : "By Role"}
                </button>
              ))}
            </div>
          </div>

          {/* Center: Client / Manual info */}
          <div className="flex flex-col items-center">
            <span className="text-sm font-semibold text-black">
              No client selected
            </span>
            <span className="text-xs text-[#434343]">
              Operations Manual — FY2025
            </span>
          </div>

          {/* Right: Filters + Export */}
          <div className="flex items-center gap-2">
            {/* Role Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                >
                  <Filter className="size-3.5" />
                  {roleFilter || "Filter by Role"}
                  <ChevronDown className="size-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Select Role</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setRoleFilter(null)}>
                  <span className={cn(!roleFilter && "font-semibold")}>All Roles</span>
                </DropdownMenuItem>
                {Object.entries(ROLE_COLORS).map(([role, color]) => (
                  <DropdownMenuItem
                    key={role}
                    onClick={() => setRoleFilter(role)}
                  >
                    <span
                      className="inline-block size-2.5 rounded-full mr-2"
                      style={{ backgroundColor: color }}
                    />
                    <span className={cn(roleFilter === role && "font-semibold")}>
                      {role}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                >
                  <Download className="size-3.5" />
                  Export
                  <ChevronDown className="size-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { setExportFormat("png"); setExportOpen(true); }}>
                  Export as PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setExportFormat("pdf"); setExportOpen(true); }}>
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setExportFormat("svg"); setExportOpen(true); }}>
                  Export as SVG
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => window.print()}
            >
              <Printer className="size-3.5" />
              Print
            </Button>
          </div>
        </div>

        {/* ===== CANVAS AREA ===== */}
        <div
          ref={viewportRef}
          className="flex-1 overflow-auto relative"
          style={{
            cursor: isPanning ? "grabbing" : "grab",
            backgroundColor: "#F8F7F3",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="relative origin-top-left"
            style={{
              width: CANVAS_W,
              height: CANVAS_H,
              transform: `scale(${zoom})`,
              transformOrigin: "0 0",
              backgroundImage:
                "radial-gradient(circle, #E3E3E3 1.2px, transparent 1.2px)",
              backgroundSize: "24px 24px",
            }}
          >
            {/* SVG Connections Layer */}
            <ConnectionsSvg
              connections={connectionsData}
              nodeMap={nodeMap}
              highlightedNode={hoveredNode}
              roleFilter={roleFilter}
            />

            {/* Nodes Layer */}
            <AnimatePresence>
              {visibleNodes.map((node) => {
                const dim = isNodeDimmed(node);
                const glow = isNodeGlowing(node);
                const key = node.id;

                switch (node.type) {
                  case "start":
                  case "end":
                    return (
                      <StartEndNode
                        key={key}
                        node={node}
                        dim={dim}
                      />
                    );
                  case "module":
                    return (
                      <ModuleNode
                        key={key}
                        node={node}
                        dim={dim}
                      />
                    );
                  case "transaction":
                    return (
                      <TransactionNode
                        key={key}
                        node={node}
                        dim={dim}
                        glow={glow}
                        onHover={() => setHoveredNode(node.id)}
                        onLeave={() => setHoveredNode(null)}
                        onClick={() => setSelectedTx(node)}
                      />
                    );
                  case "approval":
                    return (
                      <ApprovalNode
                        key={key}
                        node={node}
                        dim={dim}
                        onClick={() => setSelectedApproval(node)}
                      />
                    );
                  case "document":
                    return (
                      <DocumentNode
                        key={key}
                        node={node}
                        dim={dim}
                      />
                    );
                  case "decision":
                    return (
                      <DecisionNode
                        key={key}
                        node={node}
                        dim={dim}
                      />
                    );
                  default:
                    return null;
                }
              })}
            </AnimatePresence>

            {/* Legend (bottom-left) */}
            <div
              className="absolute bg-white/90 backdrop-blur-sm border rounded-lg p-3 space-y-2"
              style={{ left: 20, bottom: 20, zIndex: 30, minWidth: 160 }}
            >
              <p className="text-[11px] font-semibold text-[#434343] uppercase tracking-wide">
                Legend
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-1.5 bg-[#C7C7C7] rounded" />
                  <span className="text-[10px] text-[#434343]">Process Flow</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-1.5 rounded"
                    style={{
                      background: "repeating-linear-gradient(90deg, #F3350C, #F3350C 4px, transparent 4px, transparent 8px)",
                    }}
                  />
                  <span className="text-[10px] text-[#434343]">Approval Path</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-1.5 rounded border-b-2 border-dotted"
                    style={{ borderColor: "#D97706" }}
                  />
                  <span className="text-[10px] text-[#434343]">Conditional</span>
                </div>
              </div>
              <div className="border-t pt-1.5 mt-1 space-y-1">
                <p className="text-[10px] font-semibold text-[#434343]">Modules</p>
                {Object.entries(MODULE_COLORS).map(([key, color]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span
                      className="inline-block size-2.5 rounded-sm"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[10px] text-[#434343]">
                      {key === "fin"
                        ? "Financial"
                        : key === "inv"
                          ? "Inventory"
                          : key === "pur"
                            ? "Purchase"
                            : "Sales"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Role legend (bottom-right) */}
            {roleFilter && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute bg-white/90 backdrop-blur-sm border rounded-lg p-3"
                style={{ right: 20, bottom: 20, zIndex: 30 }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block size-3 rounded-full"
                    style={{ backgroundColor: ROLE_COLORS[roleFilter] || "#999" }}
                  />
                  <span className="text-xs font-medium">{roleFilter}</span>
                  <button
                    onClick={() => setRoleFilter(null)}
                    className="ml-2 text-[#C7C7C7] hover:text-black"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* ===== TRANSACTION DETAIL SHEET ===== */}
        <Sheet open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            {selectedTx && (
              <>
                <SheetHeader>
                  <div className="flex items-center gap-2">
                    {selectedTx.code && (
                      <span
                        className="font-mono text-xs px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: `${selectedTx.color}15`,
                          color: selectedTx.color,
                        }}
                      >
                        {selectedTx.code}
                      </span>
                    )}
                  </div>
                  <SheetTitle className="text-lg">{selectedTx.label}</SheetTitle>
                  <SheetDescription>{selectedTx.description}</SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                  {/* Role */}
                  <div>
                    <Label className="text-xs text-[#434343]">Assigned Role</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: selectedTx.roleColor || "#999" }}
                      >
                        {selectedTx.role}
                      </span>
                    </div>
                  </div>

                  {/* Module */}
                  <div>
                    <Label className="text-xs text-[#434343]">Module</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className="inline-block size-3 rounded-sm"
                        style={{ backgroundColor: selectedTx.color }}
                      />
                      <span className="text-sm">
                        {selectedTx.moduleId === "fin"
                          ? "Financial Management"
                          : selectedTx.moduleId === "inv"
                            ? "Inventory & Warehouse"
                            : selectedTx.moduleId === "pur"
                              ? "Purchase & Procurement"
                              : "Sales & CRM"}
                      </span>
                    </div>
                  </div>

                  {/* Approval */}
                  <div>
                    <Label className="text-xs text-[#434343]">Approval Required</Label>
                    <div className="mt-1 flex items-center gap-2">
                      {selectedTx.approvalRequired ? (
                        <>
                          <Shield className="size-4 text-amber-500" />
                          <span className="text-sm">Yes — Approval Gate</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="size-4 text-emerald-500" />
                          <span className="text-sm">No approval required</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Use Cases */}
                  <div>
                    <Label className="text-xs text-[#434343]">Use Cases</Label>
                    <div className="mt-2 space-y-2">
                      {Array.from({ length: selectedTx.useCaseCount || 0 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 p-2 rounded-md bg-[#F8F7F3] border"
                        >
                          <CircleDot className="size-3.5 text-[#C7C7C7]" />
                          <span className="text-xs">
                            {selectedTx.code}-UC{i + 1}: {selectedTx.label} — Scenario{" "}
                            {i + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <Label className="text-xs text-[#434343]">Description</Label>
                    <p className="mt-1 text-sm text-[#434343] leading-relaxed">
                      {selectedTx.description}
                    </p>
                  </div>
                </div>

                <SheetFooter className="mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedTx(null)}
                  >
                    Close
                  </Button>
                </SheetFooter>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* ===== APPROVAL CONFIG PANEL ===== */}
        <Sheet
          open={!!selectedApproval}
          onOpenChange={() => setSelectedApproval(null)}
        >
          <SheetContent className="w-full sm:max-w-sm" side="right">
            {selectedApproval && (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Shield className="size-5 text-[#F3350C]" />
                    Approval Gate {selectedApproval.approvalLevel}
                  </SheetTitle>
                  <SheetDescription>
                    Configure approval settings for this gate.
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-5">
                  <div>
                    <Label className="text-xs text-[#434343]">Approval Level</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge
                        className="text-white border-0"
                        style={{ backgroundColor: "#F3350C" }}
                      >
                        {selectedApproval.approvalLevel} Approval
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-[#434343]">Approver Role</Label>
                    <select className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                      <option>Finance Manager</option>
                      <option>Department Head</option>
                      <option>Operations Manager</option>
                      <option>Purchase Officer</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs text-[#434343]">Threshold Amount</Label>
                    <input
                      type="text"
                      defaultValue="$10,000"
                      className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox id="escalation" defaultChecked />
                    <Label htmlFor="escalation" className="text-sm">
                      Enable escalation
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox id="notify" defaultChecked />
                    <Label htmlFor="notify" className="text-sm">
                      Email notification
                    </Label>
                  </div>

                  <div>
                    <Label className="text-xs text-[#434343]">SLA (hours)</Label>
                    <input
                      type="number"
                      defaultValue={24}
                      className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    />
                  </div>
                </div>

                <SheetFooter className="mt-6 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedApproval(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => setSelectedApproval(null)}
                    className="text-white"
                    style={{ backgroundColor: "#F3350C" }}
                  >
                    Save Configuration
                  </Button>
                </SheetFooter>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* ===== EXPORT MODAL ===== */}
        <Dialog open={exportOpen} onOpenChange={setExportOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Export Roadmap</DialogTitle>
              <DialogDescription>
                Choose your export format and options below.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-2">
              {/* Format */}
              <div>
                <Label className="text-sm font-medium">Format</Label>
                <RadioGroup
                  value={exportFormat}
                  onValueChange={setExportFormat}
                  className="flex gap-4 mt-2"
                >
                  {["png", "pdf", "svg"].map((fmt) => (
                    <div key={fmt} className="flex items-center space-x-2">
                      <RadioGroupItem value={fmt} id={`fmt-${fmt}`} />
                      <Label htmlFor={`fmt-${fmt}`} className="text-sm uppercase font-medium">
                        {fmt}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Options</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="legend"
                    checked={exportLegend}
                    onCheckedChange={(c) => setExportLegend(!!c)}
                  />
                  <Label htmlFor="legend" className="text-sm">
                    Include legend
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="roleColors"
                    checked={exportRoleColors}
                    onCheckedChange={(c) => setExportRoleColors(!!c)}
                  />
                  <Label htmlFor="roleColors" className="text-sm">
                    Include role colors
                  </Label>
                </div>
              </div>

              {/* Paper */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Paper Size</Label>
                  <select
                    value={exportPaper}
                    onChange={(e) => setExportPaper(e.target.value)}
                    className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  >
                    <option>A4</option>
                    <option>Letter</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Orientation</Label>
                  <select
                    value={exportOrientation}
                    onChange={(e) => setExportOrientation(e.target.value)}
                    className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="landscape">Landscape</option>
                    <option value="portrait">Portrait</option>
                  </select>
                </div>
              </div>

              {/* Preview area */}
              <div>
                <Label className="text-sm font-medium">Preview</Label>
                <div
                  className="mt-2 border rounded-lg bg-[#F8F7F3] flex items-center justify-center"
                  style={{
                    height: 160,
                    backgroundImage:
                      "radial-gradient(circle, #E3E3E3 1px, transparent 1px)",
                    backgroundSize: "12px 12px",
                  }}
                >
                  <div className="text-center text-[#C7C7C7]">
                    <Map className="size-8 mx-auto mb-2" />
                    <p className="text-xs">Roadmap preview will appear here</p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setExportOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setExportOpen(false);
                }}
                className="text-white"
                style={{ backgroundColor: "#F3350C" }}
              >
                <Download className="size-4 mr-1" />
                Export {exportFormat.toUpperCase()}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
