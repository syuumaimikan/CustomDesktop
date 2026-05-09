import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

export default function LayoutManager({ data, onChange }: any) {
  const scale = 0.15;
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const activeGroup = data.groups.find((g: any) => g.id === data.activeGroupId);

  useEffect(() => {
    data.groups.forEach((g: any) => {
      invoke("update_widget_geometry", { id: g.id, x: g.placement.x, y: g.placement.y, width: g.placement.w, height: g.placement.h });
    });
  }, [data.groups]);

  const addGroup = async () => {
    const id = `widget-${Date.now()}`;
    const newGroup = { id, name: `Widget ${data.groups.length + 1}`, placement: { x: 300, y: 300, w: 250, h: 150 }, shapes: [], visible: true, ghost: false };
    await invoke("create_widget_window", { id });
    onChange({ ...data, groups: [...data.groups, newGroup], activeGroupId: id });
  };

  const updatePos = (id: string, key: string, val: number) => {
    onChange({ ...data, groups: data.groups.map((g: any) => g.id === id ? { ...g, placement: { ...g.placement, [key]: val } } : g) });
  };

  return (
    <div className="workspace-main" style={{display:'flex',width:'100%',height:'100%'}}>
      <aside className="side-panel" style={{width:'240px',background:'#141721',borderRight:'1px solid #2d3142'}}>
        <div className="panel-header">ゾーン管理</div>
        <button className="node-btn" style={{margin:'10px'}} onClick={addGroup}>+ 新規ウィンドウ</button>
        {data.groups.map((g: any) => (
          <div key={g.id} className={`layer-item ${g.id===data.activeGroupId?'active':''}`} onClick={()=>onChange({...data, activeGroupId:g.id})}>
            {g.name}
            <button onClick={(e)=>{
              e.stopPropagation();
              const nextGhost = !g.ghost;
              onChange({...data, groups: data.groups.map((gr:any)=>gr.id===g.id?{...gr, ghost: nextGhost}:gr)});
              invoke("set_widget_state", { id: g.id, visible: g.visible, ghost: nextGhost });
            }}>{g.ghost?'👻':'👤'}</button>
          </div>
        ))}
        {activeGroup && (
          <div className="prop-group" style={{padding:'15px', borderTop:'1px solid #333'}}>
            {['x','y','w','h'].map(p=>(<div key={p} className="prop-item"><label>{p.toUpperCase()}</label><input type="number" value={activeGroup.placement[p]} onChange={e=>updatePos(activeGroup.id, p, +e.target.value)} style={{width:'80px'}} /></div>))}
          </div>
        )}
      </aside>
      <main className="center-canvas" style={{flex:1,background:'#080a0f',display:'flex',alignItems:'center',justifyContent:'center'}}
        onMouseMove={(e)=>{
          if(!isDragging || !data.activeGroupId) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const newX = (e.clientX - rect.left) / scale - dragOffset.x;
          const newY = (e.clientY - rect.top) / scale - dragOffset.y;
          updatePos(data.activeGroupId, 'x', newX);
          updatePos(data.activeGroupId, 'y', newY);
        }} onMouseUp={()=>setIsDragging(false)}>
        <div className="virtual-screen" style={{ width: 1920*scale, height: 1080*scale, border: '2px solid #444', position: 'relative', background:'#0b0e14' }}>
          {data.groups.map((g: any) => (
            <div key={g.id} onMouseDown={(e)=>{
              e.stopPropagation();
              onChange({...data, activeGroupId: g.id});
              setIsDragging(true);
              // dragOffsetは、マウス位置（スケール後）からウィジェット位置を引いた値
              const offsetX = ((e.clientX - (e.currentTarget.parentElement?.getBoundingClientRect().left || 0)) / scale) - g.placement.x;
              const offsetY = ((e.clientY - (e.currentTarget.parentElement?.getBoundingClientRect().top || 0)) / scale) - g.placement.y;
              setDragOffset({ x: offsetX, y: offsetY });
            }} style={{ position:'absolute', left: g.placement.x*scale, top: g.placement.y*scale, width: g.placement.w*scale, height: g.placement.h*scale, border: g.id === data.activeGroupId ? '2px solid #4a9eff' : '1px solid #444', background: g.ghost ? 'rgba(100,100,100,0.3)' : 'rgba(74,158,255,0.1)', cursor: 'grab', boxSizing: 'border-box' }}></div>
          ))}
        </div>
      </main>
    </div>
  );
}
