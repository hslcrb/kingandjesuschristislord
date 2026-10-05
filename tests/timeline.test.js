import test from 'node:test';
import assert from 'node:assert/strict';
import { locateScene, captionAt, formatTime } from '../src/timeline.js';
const scenes = [{ duration: 24, paragraphs: ['a', 'b', 'c'] }, { duration: 30, paragraphs: ['d', 'e', 'f'] }];
test('seeking across chapter boundary changes scene with exact local time', () => {
  assert.deepEqual(locateScene(scenes, 24), { index: 1, local: 0, start: 24, ended: false });
  assert.deepEqual(locateScene(scenes, 25.5), { index: 1, local: 1.5, start: 24, ended: false });
});
test('negative and invalid times safely start; end stays on final scene', () => {
  for (const t of [-10, NaN, undefined]) assert.equal(locateScene(scenes, t).local, 0);
  assert.deepEqual(locateScene(scenes, 1000), { index: 1, local: 30, start: 24, ended: true });
});
test('captions advance at reading intervals and stay in bounds', () => {
  assert.equal(captionAt(scenes[0], 0), 0);
  assert.equal(captionAt(scenes[0], 8), 1);
  assert.equal(captionAt(scenes[0], 24), 2);
});
test('timer formats meaningful time without invalid display', () => {
  assert.equal(formatTime(901.8), '15:01');
  assert.equal(formatTime(NaN), '00:00');
});
