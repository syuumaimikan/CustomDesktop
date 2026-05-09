import { useEffect } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { emit } from "@tauri-apps/api/event";

const BaseNode = ({ title, children, color, id }: any) => {
  const { setNodes } = useReactFlow();
  const onDelete = () =>
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
  return (
    <div
      style={{
        background: "#252525",
        color: "#fff",
        padding: "12px",
        borderRadius: "8px",
        border: `2px solid ${color}`,
        minWidth: "150px",
        position: "relative",
      }}
    >
      <button
        onClick={onDelete}
        className="nodrag"
        style={{
          position: "absolute",
          top: "-10px",
          right: "-10px",
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          background: "#ff4a4a",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        ×
      </button>
      <div
        style={{
          fontSize: "10px",
          fontWeight: "bold",
          marginBottom: "8px",
          color: color,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
};

// INPUTS
export const InputSliderNode = ({ id }: any) => (
  <BaseNode title="INPUT: SLIDER" color="#4a9eff" id={id}>
    <input
      type="range"
      min="0"
      max="1"
      step="0.01"
      className="nodrag"
      style={{ width: "100%" }}
      onChange={(e) =>
        emit("node-value-change", { id, value: parseFloat(e.target.value) })
      }
    />
    <Handle type="source" position={Position.Right} />
  </BaseNode>
);

export const InputNumberNode = ({ id }: any) => (
  <BaseNode title="INPUT: NUMBER" color="#4a9eff" id={id}>
    <input
      type="number"
      defaultValue="0"
      className="nodrag"
      style={{
        width: "100%",
        background: "#111",
        color: "#fff",
        border: "1px solid #444",
        borderRadius: "4px",
      }}
      onChange={(e) =>
        emit("node-value-change", {
          id,
          value: parseFloat(e.target.value) || 0,
        })
      }
    />
    <Handle type="source" position={Position.Right} />
  </BaseNode>
);

export const InputTimeNode = ({ id }: any) => {
  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(
      () =>
        emit("node-value-change", { id, value: (Date.now() - start) / 1000 }),
      16,
    );
    return () => clearInterval(interval);
  }, [id]);
  return (
    <BaseNode title="INPUT: CLOCK" color="#4a9eff" id={id}>
      <div style={{ fontSize: "10px" }}>Time (sec)</div>
      <Handle type="source" position={Position.Right} />
    </BaseNode>
  );
};

export const InputColorNode = ({ id }: any) => (
  <BaseNode title="INPUT: COLOR" color="#4a9eff" id={id}>
    <input
      type="color"
      className="nodrag"
      style={{ width: "100%", height: "30px" }}
      onChange={(e) => emit("node-value-change", { id, value: e.target.value })}
    />
    <Handle type="source" position={Position.Right} />
  </BaseNode>
);

// MATH
export const MathAddNode = ({ id }: any) => (
  <BaseNode title="MATH: ADD (+)" color="#ff4ae2" id={id}>
    <Handle
      type="target"
      position={Position.Left}
      style={{ top: "30%" }}
      id="a"
    />
    <Handle
      type="target"
      position={Position.Left}
      style={{ top: "70%" }}
      id="b"
    />
    <div style={{ textAlign: "center", fontSize: "12px" }}>A + B</div>
    <Handle type="source" position={Position.Right} />
  </BaseNode>
);

export const MathMultNode = ({ id }: any) => (
  <BaseNode title="MATH: MULTIPLY (*)" color="#ff4ae2" id={id}>
    <Handle
      type="target"
      position={Position.Left}
      style={{ top: "30%" }}
      id="a"
    />
    <Handle
      type="target"
      position={Position.Left}
      style={{ top: "70%" }}
      id="b"
    />
    <div style={{ textAlign: "center", fontSize: "12px" }}>A × B</div>
    <Handle type="source" position={Position.Right} />
  </BaseNode>
);

export const MathSinNode = ({ id }: any) => (
  <BaseNode title="MATH: SIN" color="#ff4ae2" id={id}>
    <Handle type="target" position={Position.Left} />
    <div style={{ textAlign: "center", fontSize: "18px" }}>~</div>
    <Handle type="source" position={Position.Right} />
  </BaseNode>
);

export const MathRemapNode = ({ id }: any) => (
  <BaseNode title="MATH: REMAP" color="#ff4ae2" id={id}>
    <Handle type="target" position={Position.Left} />
    <div style={{ fontSize: "10px" }}>In: 0.0 - 1.0</div>
    <div style={{ textAlign: "center", fontSize: "12px" }}>➔</div>
    <div style={{ fontSize: "10px" }}>Out: 0 - 500</div>{" "}
    {/* 適切なレンジに調整 */}
    <Handle type="source" position={Position.Right} />
  </BaseNode>
);

// OUTPUT
export const OutputWidgetNode = ({ data, id }: any) => (
  <BaseNode title="OUTPUT: WIDGET" color="#ff4a4a" id={id}>
    <Handle type="target" position={Position.Left} />
    <div style={{ fontSize: "11px" }}>{data.label}</div>
  </BaseNode>
);
