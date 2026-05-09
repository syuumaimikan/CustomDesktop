export interface Keyframe {
  time: number;
  value: number;
}

export function evaluate(keys: Keyframe[], currentTime: number): number {
  if (!keys || keys.length === 0) return 0;
  const sorted = [...keys].sort((a, b) => a.time - b.time);

  if (currentTime <= sorted[0].time) return sorted[0].value;
  if (currentTime >= sorted[sorted.length - 1].time)
    return sorted[sorted.length - 1].value;

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (currentTime >= a.time && currentTime <= b.time) {
      const t = (currentTime - a.time) / (b.time - a.time);
      // 線形補間
      return a.value + (b.value - a.value) * t;
    }
  }
  return sorted[0].value;
}
