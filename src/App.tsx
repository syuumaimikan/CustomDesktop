import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import WidgetCreator from "./tabs/WidgetCreator";
import LayoutManager from "./tabs/LayoutManager";
import NodeEditor from "./tabs/NodeEditor";
import "./App.css";

function App() {
  const windowLabel = getCurrentWindow().label;
  const [appData, setAppData] = useState({ groups: [], activeGroupId: null, nodes: [], edges: [] });

  if (windowLabel.startsWith("widget-")) {
    const [shapes, setShapes] = useState([]);
    useEffect(() => {
      const un = listen("shapes-render-all", (e: any) => { if (e.payload[windowLabel]) setShapes(e.payload[windowLabel]); });
      return () => { un.then(f => f()); };
    }, [windowLabel]);
    return (
      <div className="widget-root" style={{ width: '100%', height: '100%', position:'relative' }}>
        {shapes.map((s: any) => (
          <div key={s.id} style={{ position:'absolute', left: s.x, top: s.y, width: s.w, height: s.h, backgroundColor: s.color, opacity: s.opacity, transform: `translate(-50%, -50%) rotate(${s.rotation}deg)`, borderRadius: s.type === 'circle' ? '50%' : '4px' }} />
        ))}
      </div>
    );
  }

  if (windowLabel === "main") {
    const [tab, setTab] = useState("layout");
    return (
      <div className="editor-root" style={{display:'flex',flexDirection:'column',height:'100vh',background:'#0b0e14'}}>
        <header className="editor-header">
          <div style={{color:'#4a9eff',fontWeight:'bold'}}>DesktopForge Hub</div>
          <nav className="tab-nav">
            {['creator','layout','nodes'].map(t=>(<button key={t} className={`tab-btn ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{t.toUpperCase()}</button>))}
          </nav>
        </header>
        <div style={{flex:1,overflow:'hidden'}}>
          {tab==='creator' && <WidgetCreator data={appData} onChange={setAppData} />}
          {tab==='layout' && <LayoutManager data={appData} onChange={setAppData} />}
          {tab==='nodes' && <NodeEditor data={appData} onChange={setAppData} />}
        </div>
      </div>
    );
  }
  return null;
}
export default App;