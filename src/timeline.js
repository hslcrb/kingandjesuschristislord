export function locateScene(scenes, seconds) {
  const t = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  let start = 0;
  for (let index = 0; index < scenes.length; index++) {
    const duration = scenes[index].duration;
    if (t < start + duration || index === scenes.length - 1) {
      return { index, local: Math.min(duration, t - start), start, ended: t >= start + duration };
    }
    start += duration;
  }
  return { index: 0, local: 0, start: 0, ended: true };
}
export function captionAt(scene, local) {
  return Math.max(0, Math.min(scene.paragraphs.length - 1, Math.floor(local / (scene.duration / scene.paragraphs.length))));
}
export function formatTime(seconds) {
  const t = Math.floor(Math.max(0, Number.isFinite(seconds) ? seconds : 0));
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}
