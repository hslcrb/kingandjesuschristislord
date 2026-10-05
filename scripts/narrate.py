"""Generate original Korean narration, with silence aligned to every caption beat.
The text is our own adaptation. Microsoft Edge TTS is a synthetic voice service.
Re-running keeps successfully generated clips. No user recordings are transmitted.
"""
import asyncio, json, math, pathlib, subprocess, wave
import edge_tts

ROOT = pathlib.Path(__file__).resolve().parent.parent
CLIPS = ROOT / 'artifacts' / 'narration'
AUDIO = ROOT / 'public' / 'audio'
WORK = ROOT / 'artifacts' / 'audio'
CLIPS.mkdir(parents=True, exist_ok=True)
AUDIO.mkdir(parents=True, exist_ok=True)
WORK.mkdir(parents=True, exist_ok=True)
story = json.loads((ROOT / 'public' / 'story.json').read_text(encoding='utf-8'))
semaphore = asyncio.Semaphore(3)

async def speak(scene, j, text):
    path = CLIPS / f'{scene["index"]:02d}-{j}.mp3'
    if path.exists() and path.stat().st_size > 1000:
        return
    async with semaphore:
        for attempt in range(3):
            try:
                await edge_tts.Communicate(text, 'ko-KR-HyunsuNeural', rate='-5%', pitch='-2Hz').save(str(path))
                print(f'Voice {scene["index"]+1:02d}/38 paragraph {j+1}/3', flush=True)
                return
            except Exception as error:
                if attempt == 2: raise
                print(f'Retry voice {scene["index"]}:{j}: {type(error).__name__}', flush=True)
                await asyncio.sleep(2)

async def main():
    await asyncio.gather(*(speak(scene, j, paragraph) for scene in story['scenes'] for j, paragraph in enumerate(scene['paragraphs'])))

asyncio.run(main())
rate = 44100
timings = {}
with wave.open(str(WORK / 'narration.wav'), 'wb') as out:
    out.setnchannels(1); out.setsampwidth(2); out.setframerate(rate)
    for scene in story['scenes']:
        clips = []
        for j in range(3):
            pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(CLIPS / f'{scene["index"]:02d}-{j}.mp3'), '-f', 's16le', '-ac', '1', '-ar', str(rate), '-'], check=True, capture_output=True).stdout
            clips.append(pcm)
        beat = max(scene['duration'] / 3, max(len(p) / 2 / rate for p in clips) + 2.0)
        duration = math.ceil(beat * 3)
        timings[scene['id']] = duration
        beat_frames = round(duration * rate / 3)
        for pcm in clips:
            lead = int(rate * 1.05)
            tail = beat_frames - lead - len(pcm) // 2
            assert tail >= 0
            out.writeframes(bytes(lead * 2) + pcm + bytes(tail * 2))
        print(f'Aligned {scene["id"]}: {duration}s', flush=True)
(ROOT / 'src' / 'timings.json').write_text(json.dumps(timings, indent=2), encoding='utf-8')
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(WORK / 'narration.wav'), '-af', 'alimiter=limit=0.85:level=false', '-ar', '44100', '-codec:a', 'libmp3lame', '-b:a', '160k', str(AUDIO / 'narration.mp3')], check=True)
print(f'NARRATION READY: {sum(timings.values())} seconds', flush=True)
