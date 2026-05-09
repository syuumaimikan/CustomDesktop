import { useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  Controls,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type Connection,
} from "@xyflow/react";
import { listen, emit } from "@tauri-apps/api/event";
import * as Nodes from "../CustomNodes";
import "@xyflow/react/dist/style.css";

// 型定義の修正
interface CustomNodeData extends Record<string, unknown> {
  label: string;
  property: string;
}
type AppNode = Node<CustomNodeData>;

const nodeTypes = {
  slider: Nodes.InputSliderNode,
  number: Nodes.InputNumberNode,
  time: Nodes.InputTimeNode,
  color: Nodes.InputColorNode,
  add: Nodes.MathAddNode,
  mult: Nodes.MathMultNode,
  sin: Nodes.MathSinNode,
  remap: Nodes.MathRemapNode,
  output: Nodes.OutputWidgetNode,
};

function FlowEditor({
  nodes,
  onNodesChange,
  edges,
  setEdges,
  onEdgesChange,
}: any) {
  const nodeValues = useRef<Record<string, any>>({});

  useEffect(() => {
    const unlisten = listen("node-value-change", (event: any) => {
      const { id, value } = event.payload;
      nodeValues.current[id] = value;

      edges.forEach((edge: Edge) => {
        if (edge.source === id) {
          const targetNode = nodes.find((n: AppNode) => n.id === edge.target);
          if (!targetNode) return;

          let result = value;
          if (targetNode.type === "add" || targetNode.type === "mult") {
            const inputEdges = edges.filter(
              (e: Edge) => e.target === targetNode.id,
            );
            const valA =
              nodeValues.current[
                inputEdges.find((e: Edge) => e.targetHandle === "a")?.source ||
                  ""
              ] || 0;
            const valB =
              nodeValues.current[
                inputEdges.find((e: Edge) => e.targetHandle === "b")?.source ||
                  ""
              ] || 0;
            result =
              targetNode.type === "add"
                ? parseFloat(valA) + parseFloat(valB)
                : parseFloat(valA) * parseFloat(valB);
          } else if (targetNode.type === "sin") {
            result = Math.sin(value);
          }

          nodeValues.current[targetNode.id] = result;
          if (targetNode.type === "output") {
            emit("widget-update", {
              type: targetNode.data.property,
              value: result,
            });
          } else {
            emit("node-value-change", { id: targetNode.id, value: result });
          }
        }
      });
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, [edges, nodes]);

  const onEdgeDoubleClick = useCallback(
    (_e: React.MouseEvent, edge: Edge) => {
      setEdges((eds: Edge[]) => eds.filter((e) => e.id !== edge.id));
    },
    [setEdges],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={(p: Connection) => setEdges((eds: Edge[]) => addEdge(p, eds))}
      onEdgeDoubleClick={onEdgeDoubleClick}
      defaultEdgeOptions={{ type: "step" }}
      fitView
    >
      <Background color="#333" gap={20} />
      <Controls />
    </ReactFlow>
  );
}

export default function NodeEditor({ data, onChange }: any) {
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>(
    data.nodes || [],
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(
    data.edges || [],
  );

  useEffect(() => {
    onChange({ ...data, nodes, edges });
  }, [nodes, edges]);

  return (
    <ReactFlowProvider>
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        <NodeSelector setNodes={setNodes} />
        <FlowEditor
          nodes={nodes}
          onNodesChange={onNodesChange}
          edges={edges}
          setEdges={setEdges}
          onEdgesChange={onEdgesChange}
        />
      </div>
    </ReactFlowProvider>
  );
}

// 別コンポーネントに分けることで useReactFlow を安全に使う
function NodeSelector({ setNodes }: any) {
  const { screenToFlowPosition } = useReactFlow();

  const addNode = (type: string, label: string, property: string = "x") => {
    const position = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    const newNode: AppNode = {
      id: `${type}-${Date.now()}`,
      type: type as any,
      position,
      data: { label, property },
    };
    setNodes((nds: AppNode[]) => nds.concat(newNode));
  };

  return (
    <aside className="node-selector">
      <div className="sidebar-category">INPUT</div>
      <button className="node-btn" onClick={() => addNode("slider", "Slider")}>
        + Slider
      </button>
      <button className="node-btn" onClick={() => addNode("time", "Clock")}>
        + Clock
      </button>
      <div className="sidebar-category">MATH</div>
      <button className="node-btn" onClick={() => addNode("sin", "Sin Wave")}>
        + Sin Wave
      </button>
      <div className="sidebar-category">OUTPUT</div>
      <button
        className="node-btn"
        onClick={() => addNode("output", "X Pos", "x")}
      >
        + X Pos
      </button>
      <button
        className="node-btn"
        onClick={() => addNode("output", "Opacity", "opacity")}
      >
        + Opacity
      </button>
    </aside>
  );
}
