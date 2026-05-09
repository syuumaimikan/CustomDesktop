import { useState, useEffect, useRef } from "react";
import { evaluate } from "../utils/interpolation";
import { emit } from "@tauri-apps/api/event";

export default function WidgetCreator({ data, onChange }: any) {
  const activeGroup = data.groups?.find((g: any) => g.id === data.activeGroupId) || null;
  const shapes = activeGroup?.shapes || [];
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const timelineRef = useRef<HTMLDivElement>(null);
  const selectedShape = shapes.find((s: any) => s.id === selectedId);

  useEffect(() => {
    if (!isPlaying) return;
    let last = performance.now();
    const frame = (now: number) => {
      setCurrentTime(prev => (prev + (now - last) / 1000) % 10);
      last = now;
      if (isPlaying) requestAnimationFrame(frame);
    };
    const id = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(id);
  }, [isPlaying]);

  useEffect(() => {
    const renderMap: Record<string, any> = {};
    data.groups.forEach((g: any) => {
      renderMap[g.id] = g.shapes.map((s: any) => ({
        id: s.id, type: s.type, color: s.color,
        x: evaluate(s.tracks.x, currentTime), y: evaluate(s.tracks.y, currentTime),
        w: evaluate(s.tracks.w, currentTime), h: evaluate(s.tracks.h, currentTime),
        opacity: evaluate(s.tracks.opacity, currentTime), rotation: evaluate(s.tracks.rotation, currentTime),
      }));
    });
    emit("shapes-render-all", renderMap);
  }, [currentTime, data.groups]);

  const updateProp = (shapeId: string, prop: string, val: number) => {
    const newGroups = data.groups.map((g: any) => {
      if (g.id !== data.activeGroupId) return g;
      const newShapes = g.shapes.map((s: any) => {
        if (s.id !== shapeId) return s;
        const track = [...(s.tracks[prop] || [])];
        const idx = track.findIndex(k => Math.abs(k.time - currentTime) < 0.05);
        if (idx >= 0) track[idx].value = val;
        else { track.push({ time: currentTime, value: val }); track.sort((a,b)=>a.time-b.time); }
        return { ...s, tracks: { ...s.tracks, [prop]: track } };
      });
      return { ...g, shapes: newShapes };
    });
    onChange({ ...data, groups: newGroups });
  };

  const addShape = (type: 'rect' | 'circle') => {
    if (!data.activeGroupId) return;
    const id = `shape-${Date.now()}`;
    const newShape = { id, type, name: `${type}-${shapes.length+1}`, color:'#ffffff', tracks:{ x:[{time:0,value:50}], y:[{time:0,value:50}], w:[{time:0,value:100}], h:[{time:0,value:100}], opacity:[{time:0,value:1}], rotation:[{time:0,value:0}] } };
    onChange({...data, groups: data.groups.map((g:any)=>g.id===data.activeGroupId?{...g, shapes:[...g.shapes, newShape]}:g)});
    setSelectedId(id);
  };

  if (!activeGroup) return <div style={{padding:'40px', color:'#666'}}>Layoutタブでウィジェットを選択してください</div>;

  return (
    <div className="creator-layout" style={{display:'flex',flexDirection:'column',height:'100%',width:'100%'}}>
      <div className="workspace-main" style={{display:'flex',flex:1,overflow:'hidden'}}>
        <aside className="side-panel" style={{width:'240px',background:'#141721',borderRight:'1px solid #2d3142'}}>
          <div className="panel-header">レイヤー: {activeGroup.name}</div>
          <div style={{padding:'10px',display:'flex',gap:'5px'}}>
            <button className="node-btn" onClick={()=>addShape('rect')}>+ 矩形</button>
            <button className="node-btn" onClick={()=>addShape('circle')}>+ 円</button>
          </div>
          {shapes.map((s:any)=>(<div key={s.id} className={`layer-item ${s.id===selectedId?'active':''}`} onClick={()=>setSelectedId(s.id)}>{s.name}</div>))}
        </aside>
        <main className="center-canvas" style={{flex:1,background:'#080a0f',position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}
          onMouseMove={(e)=>{
            if(!isDragging || !selectedId) return;
            const rect = e.currentTarget.getBoundingClientRect();
            updateProp(selectedId,'x', (e.clientX-rect.left)-dragOffset.x);
            updateProp(selectedId,'y', (e.clientY-rect.top)-dragOffset.y);
          }} onMouseUp={()=>setIsDragging(false)}>
          <div className="canvas-view" style={{width:activeGroup.placement.w, height:activeGroup.placement.h, background:'#1a1d2b', position:'relative', overflow:'hidden'}}>
            {shapes.map((s:any)=>(
              <div key={s.id} onMouseDown={(e)=>{
                e.stopPropagation();
                setSelectedId(s.id);
                setIsDragging(true);
                const rect = e.currentTarget.parentElement!.getBoundingClientRect();
                const shapeX = evaluate(s.tracks.x, currentTime);
                const shapeY = evaluate(s.tracks.y, currentTime);
                setDragOffset({ x: (e.clientX-rect.left)-shapeX, y: (e.clientY-rect.top)-shapeY });
              }} style={{position:'absolute', left:evaluate(s.tracks.x,currentTime), top:evaluate(s.tracks.y,currentTime), width:evaluate(s.tracks.w,currentTime), height:evaluate(s.tracks.h,currentTime), backgroundColor:s.color, opacity:evaluate(s.tracks.opacity,currentTime), transform:`rotate(${evaluate(s.tracks.rotation,currentTime)}deg)`, borderRadius: s.type==='circle'?'50%':'0px', cursor:'grab' }}></div>
            ))}
          </div>
        </main>
        <aside className="side-panel" style={{width:'260px',background:'#141721',borderLeft:'1px solid #2d3142'}}>
           <div className="panel-header">プロパティ</div>
           {selectedShape && (
             <div className="prop-group" style={{padding:'15px'}}>
               {['x','y','w','h','rotation','opacity'].map(p => (
                 <div key={p} className="prop-item">
                   <label>{p.toUpperCase()}</label>
                   <div style={{display:'flex',gap:'5px'}}>
                     <input type="range" min={p==='rotation'?0:0} max={p==='rotation'?360:(p==='opacity'?1:800)} step={p==='opacity'?0.01:1} value={evaluate(selectedShape.tracks[p],currentTime)} onChange={(e)=>updateProp(selectedId!,p,+e.target.value)} />
                     <input type="number" value={evaluate(selectedShape.tracks[p],currentTime).toFixed(p==='opacity'?2:0)} onChange={(e)=>updateProp(selectedId!,p,+e.target.value)} style={{width:'60px'}} />
                   </div>
                 </div>
               ))}
               <input type="color" value={selectedShape.color} onChange={(e)=>onChange({...data, groups: data.groups.map((g:any)=>g.id===data.activeGroupId?{...g, shapes: g.shapes.map((sh:any)=>sh.id===selectedId?{...sh, color:e.target.value}:sh)}:g)})} />
             </div>
           )}
        </aside>
      </div>
      <footer className="timeline-panel" style={{height:'150px',background:'#1a1d2b',borderTop:'2px solid #2d3142', display:'flex', flexDirection:'column'}}>
        <div className="timeline-header" style={{display:'flex', gap:'10px', padding:'5px 10px'}}>
          <button className="node-btn" onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}>{isPlaying ? "⏸ PAUSE" : "▶ PLAY"}</button>
          <span style={{fontSize:'12px', color:'#4a9eff'}}>{currentTime.toFixed(3)}s</span>
        </div>
        <div className="timeline-content" ref={timelineRef} style={{position:'relative', flex:1, cursor:'ew-resize'}} onClick={(e)=>setCurrentTime((e.nativeEvent.offsetX)/100)}>
          <div className="playhead" style={{left:currentTime*100, position:'absolute', top:0, bottom:0, width:'2px', background:'red', zIndex:10}} />
          {shapes.map((s:any)=>(<div key={s.id} style={{height:'20px',borderBottom:'1px solid #222',position:'relative'}}>{Object.values(s.tracks).flatMap((t:any)=>t).map((k:any,i)=>(<div key={i} style={{position:'absolute', left:k.time*100, bottom:'2px', width:'4px', height:'4px', backgroundColor:'#4a9eff', borderRadius:'50%'}} title={`${k.time.toFixed(2)}s: ${k.value}`} />))}</div>))}
        </div>
      </footer>
    </div>
  );
}
