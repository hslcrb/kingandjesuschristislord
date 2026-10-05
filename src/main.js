import '@fontsource-variable/noto-serif-kr';
import '@fontsource-variable/noto-sans-kr';
import './style.css';
import { scenes, acts, totalDuration, sceneStarts } from './story.js';
import { books } from './books.js';
import { FilmWorld } from './world.js';
import { Soundtrack } from './audio.js';
import { locateScene, captionAt, formatTime } from './timeline.js';

const icon = (name) => {
  const paths = {
    play: '<path d="m9 5 11 7-11 7Z"/>', pause: '<path d="M8 5v14M16 5v14"/>', next: '<path d="m5 5 10 7-10 7ZM19 5v14"/>', previous: '<path d="m19 5-10 7 10 7ZM5 5v14"/>',
    sound: '<path d="M11 5 6 9H3v6h3l5 4ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>', mute: '<path d="M11 5 6 9H3v6h3l5 4ZM16 9l5 6M21 9l-5 6"/>',
    full: '<path d="M9 3H3v6M15 3h6v6M3 15v6h6M21 15v6h-6"/>', close: '<path d="m6 6 12 12M18 6 6 18"/>', chapters: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.1M3 12h.1M3 18h.1"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>', book: '<path d="M12 5v16M3 3c4 0 6 1 9 3 3-2 5-3 9-3v15c-4 0-6 1-9 3-3-2-5-3-9-3Z"/>',
    cc: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M10 9H6v6h4M18 9h-4v6h4"/>', back: '<path d="M20 12H4m6-6-6 6 6 6"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.play}</svg>`;
};
const safe = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const label = s => s.title.replace('\n', ' ');
document.querySelector('#app').innerHTML = `
  <canvas id="world" aria-label="성경 구원사를 상징하는 입체 장면"></canvas>
  <div class="vignette" aria-hidden="true"></div><div class="grain" aria-hidden="true"></div><div id="curtain" aria-hidden="true"></div>
  <header class="masthead">
    <button class="brand" id="home" aria-label="작품 첫 화면"><img src="/mark.svg" alt=""/><span>끝까지 사랑하시니<small>A STORY OF REDEMPTION</small></span></button>
    <nav aria-label="작품 자료"><button id="about-open">작품 안내</button><button id="chapters-open">38개의 장면 ${icon('chapters')}</button></nav>
  </header>
  <main>
    <section id="hero" aria-labelledby="film-name">
      <div class="eyebrow"><span class="gold-dash"></span> FROM GENESIS TO ETERNITY</div>
      <h1 id="film-name">끝까지<br/><em>사랑하시니</em><span class="title-dot">.</span></h1>
      <p class="hero-line">처음의 빛에서, 영원의 품까지.</p>
      <p class="hero-description">우리가 사랑을 잊었을 때에도<br/>그 사랑은, 끝나지 않았습니다.</p>
      <div class="hero-actions"><button id="start" class="primary"><span class="play-circle">${icon('play')}</span>영화 감상하기 <span class="button-time">${formatTime(totalDuration)}</span></button><button id="explore" class="text-button">장면 둘러보기 ${icon('arrow')}</button></div>
      <p class="viewing-note"><span class="audio-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span> 한국어 내레이션 · 오리지널 스코어 · 헤드폰 권장</p>
    </section>
    <div class="hero-aside" aria-hidden="true"><span>α</span><i></i><span>ω</span></div>
    <section id="film" hidden aria-label="영화 감상">
      <div class="scene-heading"><span id="act-number">I</span><span id="act-title"></span><span id="chapter-number"></span></div>
      <div class="story-frame"><p id="scene-subtitle" class="eyebrow"></p><h2 id="scene-title"></h2><div class="story-rule"></div></div>
      <div class="caption-wrap"><p id="caption"></p><button id="reference" title="이 장면의 성경 본문과 해설"></button></div>
    </section>
    <section id="endcard" hidden aria-labelledby="end-title"><span class="eyebrow">THE STORY CONTINUES IN YOU</span><h2 id="end-title">오늘,<br/>그 사랑 안으로.</h2><p>요한복음부터 천천히 읽어 보세요.<br/>함께 믿고 배울 공동체에서, 다음 걸음을 시작하세요.</p><div class="end-actions"><button id="replay" class="primary">처음부터 다시 ${icon('play')}</button><button id="end-read" class="text-button">성경과 함께 더 읽기 ${icon('book')}</button></div></section>
  </main>
  <footer id="opening-footer"><div class="footer-meta"><span>하나의 사랑. <b>다섯 번의 여정.</b></span><span>38 SCENES <i> / </i> ${formatTime(totalDuration)}</span></div><div class="act-navigation">${acts.map((a,i) => `<button data-act="${i}"><span>${a.numeral}</span><strong>${a.title}</strong><small>${a.english}</small><i></i></button>`).join('')}</div></footer>
  <section id="transport" hidden aria-label="재생 컨트롤">
    <div class="timeline-wrap"><div id="chapter-ticks" aria-hidden="true">${scenes.map((s,i)=>`<span style="left:${sceneStarts[i]/totalDuration*100}%"></span>`).join('')}</div><input id="timeline" type="range" min="0" max="${totalDuration}" step="0.1" value="0" aria-label="영화 재생 위치"/><span id="seek-time"></span></div>
    <div class="transport-row"><div class="left-controls"><button id="previous" class="icon-button" aria-label="이전 장면">${icon('previous')}</button><button id="play" class="icon-button main-play" aria-label="일시정지">${icon('pause')}</button><button id="next" class="icon-button" aria-label="다음 장면">${icon('next')}</button><span class="time-display"><span id="elapsed">00:00</span><i>/</i>${formatTime(totalDuration)}</span></div><button class="now-playing" id="current-chapter"><span id="current-name"></span>${icon('chapters')}</button><div class="right-controls"><button id="mute" class="icon-button" aria-label="소리 끄기">${icon('sound')}</button><input id="volume" type="range" min="0" max="1" step="0.05" value="0.8" aria-label="음량"/><button id="captions" class="icon-button active" aria-label="자막 끄기" aria-pressed="true">${icon('cc')}</button><button id="fullscreen" class="icon-button" aria-label="전체 화면">${icon('full')}</button></div></div>
  </section>
  <dialog id="library" aria-labelledby="library-title"><div class="dialog-top"><div><p class="eyebrow">THE STORY & THE SCRIPTURES</p><h2 id="library-title">이야기 곁에서</h2></div><button id="close-library" class="icon-button" aria-label="자료 닫기">${icon('close')}</button></div><nav class="tabs" aria-label="자료 종류"><button data-tab="chapters" class="selected">장면 탐색 <span>38</span></button><button data-tab="books">성경 66권</button><button data-tab="script">대본과 본문</button><button data-tab="about">작품 안내</button></nav><div id="library-content"></div></dialog>
  <div id="toast" role="status"></div>
  <p id="render-status" hidden>이 기기에서는 입체 장면을 표시할 수 없어 배경과 자막으로 재생합니다.</p>
`;

const $ = selector => document.querySelector(selector);
const state = { started: false, playing: false, time: 0, index: -1, caption: -1, captions: true, ended: false, reduced: matchMedia('(prefers-reduced-motion: reduce)').matches, tab: 'chapters', lastFrame: 0 };
let toastTimer;
let playRequest = 0;
function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 6000); }
const sound = new Soundtrack(toast);
const world = new FilmWorld($('#world'), () => { $('#render-status').hidden = false; document.body.classList.add('no-webgl'); });
world.reduced = state.reduced;
world.setScene('cosmos');
document.body.classList.toggle('reduced-motion', state.reduced);

function titleMarkup(text) {
  return text.split('\n').map((line, row) => `<span class="title-line${line.length > 9 ? ' long' : ''}">${[...line].map((char, i) => `<span style="--delay:${(i + row * 5) * .055}s">${char === ' ' ? '&nbsp;' : safe(char)}</span>`).join('')}</span>`).join('');
}
function displayScene(index, local) {
  const scene = scenes[index];
  if (state.index !== index) {
    state.index = index; state.caption = -1;
    world.setScene(scene.visual);
    $('#act-number').textContent = acts[scene.act].numeral;
    $('#act-title').textContent = acts[scene.act].title;
    $('#chapter-number').textContent = `${String(index + 1).padStart(2,'0')} / 38`;
    $('#scene-subtitle').textContent = scene.subtitle;
    $('#scene-title').innerHTML = titleMarkup(scene.title);
    $('#reference').textContent = scene.reference;
    $('#current-name').textContent = `${String(index + 1).padStart(2,'0')}  ${label(scene)}`;
    $('#previous').disabled = index === 0;
    $('#next').disabled = index === scenes.length - 1;
    document.body.dataset.scene = scene.id;
  }
  const caption = captionAt(scene, local);
  if (state.caption !== caption) {
    state.caption = caption;
    const el = $('#caption'); el.textContent = scene.paragraphs[caption];
    el.classList.remove('caption-enter'); void el.offsetWidth; el.classList.add('caption-enter');
  }
  const fade = Math.min(1, local / 1.1, (scene.duration - local) / .9);
  $('#film').style.opacity = state.reduced ? 1 : Math.max(.05, fade);
  $('#curtain').style.opacity = state.reduced ? 0 : Math.max(0, (1 - fade) * .85);
}

function updateControls() {
  $('#play').innerHTML = icon(state.playing ? 'pause' : 'play');
  $('#play').setAttribute('aria-label', state.playing ? '일시정지' : '재생');
  document.body.classList.toggle('playing', state.playing);
}
async function play() {
  if (!state.started) begin(0);
  if (state.ended) seek(0);
  const request = ++playRequest;
  state.playing = true; state.lastFrame = performance.now(); updateControls();
  const ok = await sound.play(state.time);
  if (!ok && state.playing && request === playRequest) toast('일부 소리를 재생하지 못했습니다. 소리 버튼과 기기의 음량을 확인해 주세요.');
}
function pause() { playRequest++; state.playing = false; sound.pause(); updateControls(); }
function begin(index = 0) {
  state.started = true; state.ended = false;
  document.body.classList.add('watching');
  $('#hero').hidden = true; $('#opening-footer').hidden = true; $('.hero-aside').hidden = true;
  $('#film').hidden = false; $('#transport').hidden = false; $('#endcard').hidden = true;
  seek(sceneStarts[index]);
}
function seek(value) {
  state.time = Math.max(0, Math.min(totalDuration, Number(value) || 0));
  const location = locateScene(scenes, state.time);
  state.ended = false; $('#endcard').hidden = true; $('#film').hidden = !state.started;
  sound.seek(state.time); displayScene(location.index, location.local);
  $('#timeline').value = state.time; $('#elapsed').textContent = formatTime(state.time);
  $('#timeline').style.setProperty('--progress', `${state.time / totalDuration * 100}%`);
}
async function go(index) {
  if ($('#library').open) $('#library').close();
  begin(index); await play();
}
function finish() {
  pause(); state.ended = true; $('#film').hidden = true; $('#endcard').hidden = false; $('#curtain').style.opacity = 0;
}
function showHome() {
  pause(); state.started = false; state.ended = false; state.index = -1; state.time = 0;
  document.body.classList.remove('watching'); $('#hero').hidden = false; $('#opening-footer').hidden = false; $('.hero-aside').hidden = false;
  $('#film').hidden = true; $('#transport').hidden = true; $('#endcard').hidden = true; $('#curtain').style.opacity = 0; world.setScene('cosmos');
}
function openLibrary(tab = 'chapters') {
  pause(); state.tab = tab; renderLibrary();
  if (!$('#library').open) $('#library').showModal();
}
function renderLibrary() {
  document.querySelectorAll('[data-tab]').forEach(b => { b.classList.toggle('selected', b.dataset.tab === state.tab); b.setAttribute('aria-current', b.dataset.tab === state.tab ? 'page' : 'false'); });
  const container = $('#library-content');
  if (state.tab === 'chapters') {
    container.innerHTML = `<p class="panel-intro">머물고 싶은 장면에서 시작하세요. 선택한 장면부터 영화가 이어집니다.</p>${acts.map((act, a) => `<section class="chapter-group"><h3><span>${act.numeral}</span>${act.title}<small>${act.subtitle}</small></h3><div class="chapter-grid">${scenes.filter(s=>s.act===a).map(s => `<button class="chapter-card ${s.index === state.index ? 'current' : ''}" data-scene="${s.index}"><span class="chapter-art art-${s.visual}" aria-hidden="true"><i></i><b>${String(s.index + 1).padStart(2,'0')}</b></span><span class="card-text"><strong>${label(s)}</strong><small>${s.subtitle}</small><em>${formatTime(sceneStarts[s.index])} ${icon('play')}</em></span></button>`).join('')}</div></section>`).join('')}`;
  } else if (state.tab === 'books') {
    container.innerHTML = `<div class="book-intro"><p class="panel-intro">66권, 하나의 구원 이야기.<br/>각 책의 핵심과 영화 속 연결 장면을 찾아보세요.</p><input id="book-search" type="search" placeholder="성경 이름 검색" aria-label="성경 이름 검색"/></div><div id="book-list"></div>`;
    renderBooks(''); $('#book-search').addEventListener('input', e => renderBooks(e.target.value));
  } else if (state.tab === 'script') {
    const scene = scenes[Math.max(0, state.index)];
    container.innerHTML = `<div class="script-layout"><aside><label for="script-scene">장면 선택</label><select id="script-scene">${scenes.map(s=>`<option value="${s.index}" ${scene.index === s.index?'selected':''}>${String(s.index+1).padStart(2,'0')} · ${label(s)}</option>`).join('')}</select><a class="download-link" href="/대본.txt" download>전체 대본 내려받기 ↓</a><p>화면과 내레이션은 성경을 바탕으로 쓴 창작 요약·묵상입니다. 본문 자체와 구별해 읽어 주세요.</p></aside><article id="script-text">${scriptMarkup(scene)}</article></div>`;
    $('#script-scene').addEventListener('change', e => { $('#script-text').innerHTML = scriptMarkup(scenes[Number(e.target.value)]); });
  } else {
    container.innerHTML = `<article class="about-copy"><span class="eyebrow">LOVED TO THE END</span><h3>사랑이 시작했고,<br/>사랑이 완성하는 이야기.</h3><p>「끝까지 사랑하시니」는 창세기의 첫 빛에서 요한계시록의 새 창조까지 이어지는 한국어 구원사 시네마입니다. 사람이 죄로 무너진 자리에서도 사람을 찾으시는 하나님, 예수 그리스도의 십자가와 부활, 성령 안의 새 삶과 영원한 소망을 담았습니다.</p><dl class="credits"><div><dt>구성</dt><dd>5막 · 38장면 · ${formatTime(totalDuration)}</dd></div><div><dt>시각</dt><dd>실시간 3D · 모션그래픽 · 키네틱 타이포그래피</dd></div><div><dt>음악</dt><dd>작품을 위해 직접 구성한 오리지널 합성 스코어</dd></div><div><dt>목소리</dt><dd>한국어 합성 내레이션 · Microsoft Hyunsu</dd></div></dl><h4>감상을 위한 설정</h4><div class="settings"><label><input id="voice-toggle" type="checkbox" ${sound.narration?'checked':''}/>한국어 내레이션</label><label><input id="motion-toggle" type="checkbox" ${state.reduced?'checked':''}/>움직임 줄이기</label></div><p class="shortcuts">Space 재생/정지 · ← → 10초 이동 · M 소리 · F 전체화면 · C 자막</p><h4>성경과 이 작품</h4><p>개신교 정경 66권의 큰 흐름을 그리스도 중심으로 연결한 요약 작품입니다. 성경의 모든 절이나 개별 사건을 빠짐없이 재현한 전집은 아닙니다. 각 장면의 본문과 해설, 66권 지도를 함께 읽을 수 있습니다.</p><p>종말 장면은 요한계시록 19–22장의 서술 순서를 따릅니다. 천년왕국과 재림 사건의 시간 관계에는 기독교 전통 안의 해석 차이가 있습니다. 시각 장면은 예술적 상징이며, 마지막 기도는 응답을 돕는 예시입니다.</p><p>끝부분은 요한계시록이 말하는 새 하늘과 새 땅, 하나님의 거하심, 생명수와 생명나무를 다룹니다. 복음의 초청을 마음에 새겼다면 요한복음을 읽고, 신뢰할 수 있는 지역 교회에서 함께 배우고 질문해 보세요.</p><div class="resource-links"><a href="/대본.txt" download>전체 대본 ↓</a><a href="/audio/score.mp3" download>오리지널 음악 ↓</a><a href="/audio/narration.mp3" download>한국어 내레이션 ↓</a></div></article>`;
    $('#voice-toggle').addEventListener('change', e=>{sound.narration=e.target.checked; sound.levels();});
    $('#motion-toggle').addEventListener('change', e=>{state.reduced=e.target.checked;world.reduced=state.reduced;document.body.classList.toggle('reduced-motion',state.reduced);});
  }
  container.scrollTop = 0;
}
function scriptMarkup(s) {
  return `<span class="eyebrow">${String(s.index+1).padStart(2,'0')} / ${acts[s.act].english}</span><h3>${s.title.replace('\n','<br/>')}</h3><p class="script-reference">${s.reference}</p>${s.paragraphs.map(p=>`<p>${p}</p>`).join('')}<div class="study-note"><h4>본문과 함께 읽기</h4><p>${s.note}</p><a href="${s.url}" target="_blank" rel="noopener noreferrer">성경 본문 열기 ↗</a><button data-scene="${s.index}">이 장면 감상 ${icon('play')}</button></div>`;
}
function renderBooks(query) {
  const filtered = books.filter(b=>b.name.includes(query.trim()));
  $('#book-list').innerHTML = filtered.length ? ['구약','신약'].map(testament=>{ const list=filtered.filter(b=>b.testament===testament); return list.length?`<section class="book-group"><h3>${testament}<span>${testament==='구약'?'OLD TESTAMENT · 39':'NEW TESTAMENT · 27'}</span></h3>${list.map(b=>`<details><summary><span>${String(b.index+1).padStart(2,'0')}</span>${b.name}<i>+</i></summary><div><p>${b.summary}</p><button data-scene="${scenes.findIndex(s=>s.id===b.scene)}">연결된 장면 감상 ${icon('arrow')}</button></div></details>`).join('')}</section>`:'';}).join('') : '<p class="panel-intro">찾는 성경 이름이 없습니다. 이름을 다시 입력해 주세요.</p>';
}

$('#start').addEventListener('click', ()=>{begin();play();});
$('#explore').addEventListener('click', ()=>openLibrary());
$('#chapters-open').addEventListener('click', ()=>openLibrary());
$('#about-open').addEventListener('click', ()=>openLibrary('about'));
$('#home').addEventListener('click', showHome);
$('#close-library').addEventListener('click', ()=>$('#library').close());
$('#library').addEventListener('click', e=>{if(e.target===$('#library')) $('#library').close();});
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{state.tab=b.dataset.tab;renderLibrary();}));
$('#library-content').addEventListener('click', e=>{const b=e.target.closest('button[data-scene]');if(b&&$('#library-content').contains(b))go(Number(b.dataset.scene));});
document.querySelectorAll('[data-act]').forEach(b=>b.addEventListener('click',()=>go(scenes.findIndex(s=>s.act===Number(b.dataset.act)))));
$('#play').addEventListener('click',()=>state.playing?pause():play());
$('#previous').addEventListener('click',()=>seek(sceneStarts[Math.max(0,state.index-1)]));
$('#next').addEventListener('click',()=>seek(sceneStarts[Math.min(scenes.length-1,state.index+1)]));
$('#timeline').addEventListener('input', e=>seek(Number(e.target.value)));
$('#timeline').addEventListener('pointermove', e=>{const rect=e.target.getBoundingClientRect();const fraction=Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width));$('#seek-time').textContent=formatTime(fraction*totalDuration);$('#seek-time').style.left=`${fraction*100}%`;});
$('#volume').addEventListener('input',e=>{sound.volume=Number(e.target.value);sound.levels();});
function toggleMute(){sound.muted=!sound.muted;sound.levels();$('#mute').innerHTML=icon(sound.muted?'mute':'sound');$('#mute').setAttribute('aria-label',sound.muted?'소리 켜기':'소리 끄기');}
$('#mute').addEventListener('click',toggleMute);
function toggleCaptions(){state.captions=!state.captions;$('.caption-wrap').classList.toggle('disabled',!state.captions);$('#captions').classList.toggle('active',state.captions);$('#captions').setAttribute('aria-pressed',String(state.captions));$('#captions').setAttribute('aria-label',state.captions?'자막 끄기':'자막 켜기');}
$('#captions').addEventListener('click',toggleCaptions);
async function fullScreen(){try {if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('이 브라우저에서는 전체 화면을 사용할 수 없습니다.');}}
$('#fullscreen').addEventListener('click',fullScreen);
$('#current-chapter').addEventListener('click',()=>openLibrary());
$('#reference').addEventListener('click',()=>openLibrary('script'));
$('#replay').addEventListener('click',()=>{begin();play();});
$('#end-read').addEventListener('click',()=>openLibrary('books'));
document.addEventListener('keydown',e=>{
  if($('#library').open || ['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName))return;
  if(e.code==='Space' && document.activeElement.tagName !== 'BUTTON'){e.preventDefault();state.playing?pause():play();}
  if(e.key==='ArrowRight'&&state.started){e.preventDefault();seek(state.time+10);}
  if(e.key==='ArrowLeft'&&state.started){e.preventDefault();seek(state.time-10);}
  if(e.key.toLowerCase()==='m')toggleMute();
  if(e.key.toLowerCase()==='f')fullScreen();
  if(e.key.toLowerCase()==='c')toggleCaptions();
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.playing){pause();toast('창을 벗어나 일시정지했습니다. 재생 버튼으로 이어 보세요.');}});

let lastSync = 0;
function frame(now) {
  requestAnimationFrame(frame);
  if(state.playing) {
    state.time=Math.min(totalDuration,sound.position(state.time+Math.max(0,(now-state.lastFrame)/1000)));
    if(state.time>=totalDuration)finish();
  }
  state.lastFrame=now;
  const location=locateScene(scenes,state.time);
  if(state.started&&!state.ended) {
    displayScene(location.index,location.local);
    $('#timeline').value=state.time;$('#timeline').style.setProperty('--progress',`${state.time/totalDuration*100}%`);
    $('#elapsed').textContent=formatTime(state.time);
    $('#timeline').setAttribute('aria-valuetext',`${formatTime(state.time)}, ${label(scenes[location.index])}`);
  }
  if(state.playing&&now-lastSync>1200){sound.sync(state.time);lastSync=now;}
  world.render(state.started?state.time:now/1000,location.local/scenes[location.index].duration,!state.started);
}
requestAnimationFrame(frame);
