import { scenes, acts, totalDuration } from '../src/story.js';
import { writeFileSync, mkdirSync } from 'node:fs';
mkdirSync('public', { recursive: true });
writeFileSync('public/story.json', JSON.stringify({ scenes, acts, totalDuration }, null, 2));
writeFileSync('public/대본.txt', '끝까지 사랑하시니\n성경 전체를 따라가는 구원사의 여정\n\n본 대본은 성경을 바탕으로 쓴 창작 요약과 묵상입니다. 직접 인용은 별도로 표시합니다.\n\n' + scenes.map(s => `${String(s.index + 1).padStart(2, '0')} · ${s.title.replace('\n', ' ')}\n${s.reference}\n\n${s.paragraphs.join('\n\n')}\n\n해설: ${s.note}\n본문: ${s.url}`).join('\n\n──────────\n\n'));
console.log(`${scenes.length} scenes / ${totalDuration} seconds exported.`);
