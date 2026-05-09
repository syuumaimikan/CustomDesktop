import { useState } from 'react';

export default function Timeline() {
  const [keyframes, setKeyframes] = useState([{ time: 0, value: 1 }, { time: 2, value: 1.5 }]);

  return (
    <div className="timeline-container">
      <div style={{ padding: '5px 15px', background: '#333', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
        <span>Timeline: Widget Scale</span>
        <button onClick={() => setKeyframes([...keyframes, { time: keyframes.length, value: 1 }])}>+ Key</button>
      </div>
      <div style={{ flexGrow: 1, padding: '10px', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
        {keyframes.map((kp, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ height: `${kp.value * 50}px`, width: '20px', background: '#ffd700' }}></div>
            <div style={{ fontSize: '9px' }}>{kp.time}s</div>
          </div>
        ))}
      </div>
    </div>
  );
}