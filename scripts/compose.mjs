// Original score: a D–F–A–E leitmotif travels from D minor to D major.
// Piano-like modal partials, bowed pads, bass, bells and restrained orchestral hits.
// No samples or third-party melodies. Rendering is deterministic and reproducible.
import { scenes, totalDuration } from '../src/story.js';
import { mkdirSync, openSync, writeSync, closeSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
mkdirSync('public/audio', { recursive: true });
mkdirSync('artifacts/audio', { recursive: true });
const SR = 32000, TAU = Math.PI * 2;
const freq = midi => 440 * Math.pow(2, (midi - 69) / 12);
let seed = 7001;
const rnd = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646;
const header = Buffer.alloc(44);
const bytes = totalDuration * SR * 4;
header.write('RIFF'); header.writeUInt32LE(bytes + 36, 4); header.write('WAVEfmt ', 8); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(2, 22); header.writeUInt32LE(SR, 24); header.writeUInt32LE(SR * 4, 28); header.writeUInt16LE(4, 32); header.writeUInt16LE(16, 34); header.write('data', 36); header.writeUInt32LE(bytes, 40);
const file = openSync('artifacts/audio/score.wav', 'w'); writeSync(file, header);
const motifs = [[74,77,81,76,74,72,69,74], [69,74,77,81,79,77,76,74], [74,78,81,86,85,81,78,76]];
const minor = [[50,57,62,65,69], [46,53,58,62,65], [53,60,65,69,72], [48,55,60,64,67]];
const major = [[50,57,62,66,69], [45,52,57,61,64], [47,54,59,62,66], [43,50,55,59,62]];
const credits = [];

for (const scene of scenes) {
  const n = scene.duration * SR;
  const left = new Float32Array(n), right = new Float32Array(n);
  const joyous = ['creation','resurrection','ascension','new','invitation'].includes(scene.id);
  const dark = ['fall','flood','babel','divided','exile','gethsemane','cross','silence','judgment'].includes(scene.id);
  const quiet = ['before','wisdom','silence','lost','invitation'].includes(scene.id);
  const chords = joyous ? major : minor;
  const bar = scene.duration / 4;
  const level = scene.id === 'cross' ? .7 : scene.id === 'silence' ? .32 : quiet ? .55 : 1;
  const mix = (i, value, pan) => { if (i >= 0 && i < n) { left[i] += value * Math.sqrt((1 - pan) / 2); right[i] += value * Math.sqrt((1 + pan) / 2); } };
  function note(midi, start, duration, amp, pan = 0, kind = 'piano') {
    const f = freq(midi), offset = Math.round(start * SR), len = Math.min(Math.round(duration * SR), n - offset);
    if (len <= 0) return;
    const angular = TAU * f / SR;
    for (let j = 0; j < len; j++) {
      const t = j / SR, phase = j * angular;
      let value;
      if (kind === 'pad') {
        const envelope = Math.min(1, t / 1.6) * Math.min(1, (duration - t) / 2.0);
        value = (Math.sin(phase + Math.sin(t * 4.7) * .09) + .24 * Math.sin(phase * 2.002) + .12 * Math.sin(phase * 3.001) + .08 * Math.sin(phase * .998)) * envelope * .6;
      } else if (kind === 'bell') {
        value = (Math.sin(phase) * Math.exp(-t * .45) + .4 * Math.sin(phase * 2.76) * Math.exp(-t * 1.4) + .16 * Math.sin(phase * 5.4) * Math.exp(-t * 3)) * Math.min(1, t / .01);
      } else {
        value = (Math.sin(phase) * Math.exp(-t * .7) + .38 * Math.sin(phase * 2.001) * Math.exp(-t * 1.4) + .16 * Math.sin(phase * 3.003) * Math.exp(-t * 2.5)) * Math.min(1, t / .008);
      }
      mix(offset + j, value * amp * level * Math.min(1, (len - j) / (SR * .1)), pan);
    }
  }
  function hit(at, amp) {
    const offset = Math.round(at * SR);
    for (let j = 0; j < SR * 2.3; j++) {
      const t = j / SR;
      const v = Math.sin(TAU * (43 * t + 30 * .06 * (1 - Math.exp(-t / .06)))) * Math.exp(-t * 3) + (rnd() * 2 - 1) * Math.exp(-t * 22) * .25;
      mix(offset + j, v * amp * level, 0);
    }
  }
  for (let barIndex = 0; barIndex < 4; barIndex++) {
    const chord = chords[(barIndex + (scene.index % 3)) % 4];
    const at = barIndex * bar;
    chord.slice(1).forEach((pitch, j) => note(pitch, Math.max(0, at - .8), bar + 1.6, .035, (j - 1.5) / 2.8, 'pad'));
    note(chord[0] - 12, at, bar + .4, .085, 0, 'pad');
    const pattern = dark ? [0,2,1,3,2,1] : [0,1,2,3,2,1,3,2];
    pattern.forEach((p, j) => note(chord[p + 1], at + j * bar / pattern.length, Math.min(4, bar), quiet ? .04 : .054, (j % 3 - 1) * .4));
    if (!quiet && scene.id !== 'cross') hit(at, dark ? .09 : .06);
    if (joyous) { note(chord[3] + 12, at + bar * .65, 5, .032, .5, 'bell'); }
  }
  const motif = joyous ? motifs[2] : motifs[scene.act % 2];
  const spacing = scene.duration / (quiet ? 10 : 12);
  motif.forEach((midi, j) => note(midi + (dark ? -12 : 0), scene.duration * .12 + j * spacing, 4.4, .075, -.16 + .04 * j));
  if (scene.id === 'cross') {
    // Leave space after "It is finished"; the return of the theme belongs to dawn.
    for (let i = Math.floor(n * .76); i < n; i++) { const fade = Math.max(0, 1 - (i / n - .76) / .1); left[i] *= fade; right[i] *= fade; }
  }
  // A stereo room: alternating taps, never fed back indefinitely.
  const dl = Math.round(SR * .173), dr = Math.round(SR * .237), dl2 = Math.round(SR * .419);
  const dryL = new Float32Array(left), dryR = new Float32Array(right);
  for (let i = 0; i < n; i++) {
    if (i >= dl) { left[i] += dryR[i - dl] * .23; right[i] += dryL[i - dl] * .13; }
    if (i >= dr) { right[i] += dryL[i - dr] * .23; left[i] += dryR[i - dr] * .13; }
    if (i >= dl2) { left[i] += dryL[i - dl2] * .14; right[i] += dryR[i - dl2] * .14; }
  }
  const pcm = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    const fade = Math.min(1, i / SR / 1.1, (n - i) / SR / 1.6);
    pcm.writeInt16LE(Math.round(Math.tanh(left[i] * 1.6) * fade * 30000), i * 4);
    pcm.writeInt16LE(Math.round(Math.tanh(right[i] * 1.6) * fade * 30000), i * 4 + 2);
  }
  writeSync(file, pcm);
  credits.push({ scene: scene.id, duration: scene.duration, key: joyous ? 'D major' : 'D minor', motif: joyous ? 'Homecoming' : dark ? 'Lament' : 'Promise' });
  console.log(`Score ${scene.index + 1}/38: ${scene.id} / ${scene.duration}s`);
}
closeSync(file);
const encode = spawnSync('ffmpeg', ['-y','-v','error','-i','artifacts/audio/score.wav','-af','alimiter=limit=0.85:level=false','-ar','44100','-codec:a','libmp3lame','-b:a','192k','public/audio/score.mp3'], { stdio: 'inherit' });
if (encode.status !== 0) process.exit(encode.status || 1);
writeFileSync('public/audio/composition.json', JSON.stringify({ title: '끝까지 사랑하시니 — Original Motion Picture Suite', author: 'Original procedural composition created for this project', duration: totalDuration, cues: credits }, null, 2));
console.log(`SCORE READY: ${totalDuration}s`);
