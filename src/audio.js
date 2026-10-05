export class Soundtrack {
  constructor(onError) {
    this.music = new Audio('/audio/score.mp3');
    this.voice = new Audio('/audio/narration.mp3');
    this.music.id = 'score-track'; this.voice.id = 'narration-track';
    this.music.hidden = true; this.voice.hidden = true;
    document.body.append(this.music, this.voice);
    this.music.preload = 'auto'; this.voice.preload = 'auto';
    this.volume = .8; this.muted = false; this.narration = true;
    this.clock = null; this.playing = false; this.request = 0; this.held = null;
    this.music.addEventListener('error', () => onError('음악을 불러오지 못했습니다. 재생을 다시 시도해 주세요.'));
    this.voice.addEventListener('error', () => onError('내레이션을 불러오지 못했습니다. 자막으로 감상할 수 있습니다.'));
    this.levels();
  }
  levels() {
    this.music.volume = this.muted ? 0 : this.volume * (this.narration ? .38 : .85);
    this.voice.volume = this.muted || !this.narration ? 0 : this.volume;
  }
  async play(time) {
    const request = ++this.request;
    this.playing = true;
    this.clock = this.narration && !this.voice.error ? this.voice : this.music.error ? this.voice : this.music;
    this.seek(time);
    const results = await Promise.allSettled([this.music.play(), this.voice.play()]);
    if (request !== this.request) return true;
    this.clock = this.narration && results[1].status === 'fulfilled' ? this.voice : results[0].status === 'fulfilled' ? this.music : results[1].status === 'fulfilled' ? this.voice : null;
    return results.every(r => r.status === 'fulfilled' || r.reason?.name === 'AbortError');
  }
  pause() { this.playing = false; this.request++; this.music.pause(); this.voice.pause(); this.held = null; }
  seek(time) {
    for (const audio of [this.music, this.voice]) {
      if (Number.isFinite(time)) audio.currentTime = Math.max(0, time);
    }
  }
  position(fallback) {
    if (this.clock?.error) this.clock = [this.voice, this.music].find(a => !a.error && !a.paused) || null;
    return this.clock && Number.isFinite(this.clock.currentTime) ? this.clock.currentTime : fallback;
  }
  sync(time) {
    if (!this.playing || !this.clock) return;
    const other = this.clock === this.voice ? this.music : this.voice;
    if (this.clock.readyState < 3 && !this.clock.ended) {
      if (!other.paused) { other.pause(); this.held = other; }
      return;
    }
    if (this.held) {
      const held = this.held; this.held = null;
      held.currentTime = time; held.play().catch(() => {});
    } else if (!other.paused && Math.abs(other.currentTime - time) > .3) other.currentTime = time;
  }
}
