// =====================================================
// app.js — 앱의 모든 동작을 담는 파일
// =====================================================


// =====================================================
// 로그인 상태 (시연용)
// 반장(관리자)과 근로자가 따로 들어갑니다.
// sessionStorage에 저장 → 브라우저 탭마다 따로 로그인됨
// (한 탭은 반장, 다른 탭은 근로자로 동시에 시연 가능. 탭을 닫으면 로그아웃)
// ※ 서버가 없으므로 진짜 보안은 아닙니다. 화면을 역할별로 나누는 용도예요.
// =====================================================

const KEY_SESSION = 'fieldcard.session';

// 역할별로 볼 수 있는 화면 (첫 번째가 로그인 직후 화면)
const ROLE_SCREENS = {
  admin: ['write', 'board', 'dict'],
  worker: ['card'],
};

// 저장된 로그인 불러오기. 모양이 이상하거나 없는 근로자면 로그인 안 한 것으로
function loadSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(KEY_SESSION));
    if (session && session.role === 'admin') return { role: 'admin' };
    if (session && session.role === 'worker' &&
        workers.some(function (w) { return w.id === session.workerId; })) {
      return { role: 'worker', workerId: session.workerId };
    }
  } catch (e) {
    // 저장소를 못 쓰거나 깨져 있으면 로그인 안 한 상태
  }
  return null;
}

// 로그인 저장 (null이면 로그아웃). 저장이 막혀 있어도 이 탭에서는 로그인 유지
function saveSession(session) {
  currentSession = session;
  try {
    if (session) sessionStorage.setItem(KEY_SESSION, JSON.stringify(session));
    else sessionStorage.removeItem(KEY_SESSION);
  } catch (e) {
    // 시크릿 창 등: 새로고침하면 다시 로그인해야 함
  }
}

let currentSession = loadSession();


// =====================================================
// 1단계: 화면 전환
// 주소 끝(#write, #card, #board, #dict)을 보고 맞는 화면만 보여줍니다.
// 로그인 안 했으면 로그인 화면, 역할에 없는 화면이면 그 역할의 첫 화면
// =====================================================

function showScreen() {
  let name = location.hash.replace('#', '');

  if (!currentSession) {
    name = 'login';
  } else {
    const allowed = ROLE_SCREENS[currentSession.role];
    if (!allowed.includes(name)) {
      name = allowed[0];
      // 주소도 맞춰 둠 (근로자가 #board를 쳐도 #card로)
      history.replaceState(null, '', '#' + name);
    }
  }

  // 모든 화면을 숨기고, 선택한 화면만 보이기
  document.querySelectorAll('.screen').forEach(function (screen) {
    screen.classList.toggle('active', screen.id === 'screen-' + name);
  });

  // 탭도 선택한 것만 강조
  document.querySelectorAll('.tab').forEach(function (tab) {
    tab.classList.toggle('active', tab.getAttribute('href') === '#' + name);
  });
}

window.addEventListener('hashchange', showScreen);
showScreen();


// =====================================================
// 도우미 함수
// =====================================================

// 사용자가 입력한 글자를 화면에 안전하게 넣기 위한 변환
// (입력에 < > 같은 글자가 있어도 HTML로 해석되지 않게)
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 단어의 마지막 글자에 받침이 있는지 (예: '구멍' → true, '사포' → false)
function hasBatchim(word) {
  const code = word.charCodeAt(word.length - 1) - 0xAC00;
  if (code < 0 || code > 11171) return false; // 한글이 아니면 받침 없음으로 처리
  return code % 28 !== 0;
}

// ----- 브라우저 저장소(localStorage) -----
// 이름 앞에 'fieldcard.'를 붙여서 같은 주소(Live Server)에서 연 다른 과제와 섞이지 않게 함
const KEY_SENT = 'fieldcard.sentInstructions';   // 보낸 지시 목록
const KEY_CARDS = 'fieldcard.cards';             // 근로자별 카드 (응답도 카드 안에 저장)
const KEY_WORKER = 'fieldcard.currentWorker';    // 근로자 화면에서 마지막으로 고른 사람
const KEY_TERMS = 'fieldcard.terms';             // 용어 사전 (사전 화면에서 고친 내용)
const KEY_SEEDED = 'fieldcard.demoSeeded';       // 예시 지시 3건을 이미 넣었는지

// ----- AI 연결 설정 -----
// Supabase에 배포한 AI 중계 함수 주소를 따옴표 안에 붙여넣으세요.
// 예: 'https://abcdefgh.supabase.co/functions/v1/translate'
// 비워 두면 AI 없이 템플릿만 씁니다.
// ※ 이 주소는 비밀이 아니에요. API 키는 절대 여기에 적지 마세요 (키는 Supabase Secrets에만).
const AI_URL = '';

// 저장된 값 불러오기. 없거나 깨져 있으면 fallback(기본값)을 돌려줌
function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const value = JSON.parse(raw);
    // 목록(배열)이어야 하는데 다른 모양이면 깨진 것 → 기본값
    if (Array.isArray(fallback) && !Array.isArray(value)) return fallback;
    // 목록 안에 깨진 항목(null 등)이 섞여 있으면 빼고 사용
    if (Array.isArray(value)) {
      return value.filter(function (item) { return item && typeof item === 'object'; });
    }
    return value;
  } catch (e) {
    return fallback;
  }
}

// 값 저장하기 (객체·배열을 글자로 바꿔서 저장). 성공하면 true
// 시크릿 창이거나 저장 공간이 꽉 차면 저장이 실패할 수 있어서, 앱이 멈추지 않고 한 번만 알려줌
let storageWarned = false;
function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    if (!storageWarned) {
      storageWarned = true;
      alert('브라우저에 저장할 수 없어요. 시크릿 창이거나 저장 공간이 꽉 찼을 수 있어요. 일반 창에서 열어 주세요.');
    }
    return false;
  }
}

// 값 지우기
function removeData(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    // 저장소를 못 쓰는 브라우저면 지울 것도 없음
  }
}

// 겹치지 않는 번호 만들기 (같은 순간에 여러 건을 만들어도 겹치지 않게)
function makeId() {
  return 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// '2026-11-10T05:30:00Z' → '11. 10. 오후 02:30'
function formatTime(iso) {
  return new Date(iso).toLocaleString('ko-KR', {
    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// 마지막 받침이 'ㄹ'인지 (ㄹ 받침 뒤에는 '으로'가 아니라 '로')
function endsWithRieul(word) {
  const code = word.charCodeAt(word.length - 1) - 0xAC00;
  return code >= 0 && code <= 11171 && code % 28 === 8;
}


// =====================================================
// 3단계: 현장 용어 → 쉬운 한국어 (규칙)
// =====================================================

// 조사 짝: [받침 없을 때, 받침 있을 때]
const particlePairs = [
  ['가', '이'],
  ['는', '은'],
  ['를', '을'],
  ['와', '과'],
  ['로', '으로'],
];

// 바꾼 단어에 맞게 조사를 고침 (예: '빵꾸가' → '구멍이')
function fixParticle(newWord, particle) {
  if (!particle) return '';
  for (const pair of particlePairs) {
    if (particle === pair[0] || particle === pair[1]) {
      if (pair[0] === '로' && endsWithRieul(newWord)) return '로';
      return hasBatchim(newWord) ? pair[1] : pair[0];
    }
  }
  return particle;
}

// data.js의 처음 사전(30개) 복사본 (원본이 바뀌지 않게 복사해서 씀)
function defaultDictionary() {
  return JSON.parse(JSON.stringify(terms));
}

// 지금 쓸 사전: 사전 화면에서 고친 게 있으면 그것, 없으면 처음 사전
// 용어나 쉬운 말이 비어 있는 깨진 항목은 빼고 씀
function loadDictionary() {
  const saved = loadData(KEY_TERMS, null);
  const list = Array.isArray(saved) ? saved : defaultDictionary();
  return list.filter(function (t) {
    return typeof t.word === 'string' && t.word.trim() &&
           typeof t.easy === 'string' && t.easy.trim();
  });
}

let dictionary = loadDictionary();
let sortedTerms = [];
let termPattern = null;

// 정규식에서 특별한 뜻이 있는 글자(. * ? 등)를 일반 글자로 바꿈
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 사전이 바뀔 때마다 찾기 패턴을 다시 만듦
function rebuildDictionary() {
  // 긴 단어부터 찾도록 정렬 (짧은 단어가 긴 단어 일부를 먼저 잡아먹지 않게)
  sortedTerms = dictionary.slice().sort(function (a, b) {
    return b.word.length - a.word.length;
  });

  if (sortedTerms.length === 0) {
    termPattern = null; // 사전이 비면 아무것도 바꾸지 않음
    return;
  }

  // 사전의 모든 단어 + 바로 뒤에 붙은 조사를 한 번에 찾는 패턴
  termPattern = new RegExp(
    '(' + sortedTerms.map(function (t) { return escapeRegex(t.word); }).join('|') + ')' +
    '(으로|가|이|는|은|를|을|와|과|로)?',
    'g'
  );
}
rebuildDictionary();

// 문장을 조각으로 나눔: 그대로 둘 부분(plain) / 바꾼 단어(term)
function convertText(text) {
  if (!termPattern) return [{ type: 'plain', text: text }];

  const pieces = [];
  let lastEnd = 0;
  let match;

  termPattern.lastIndex = 0;
  while ((match = termPattern.exec(text)) !== null) {
    const word = match[1];
    const particle = match[2] || '';
    const term = sortedTerms.find(function (t) { return t.word === word; });

    // 예외: '신나게'처럼 다른 뜻으로 쓰인 경우는 건너뜀
    const after = text.slice(match.index + word.length);
    const isException = (term.notFollowedBy || []).some(function (s) {
      return after.startsWith(s);
    });
    if (isException) continue;

    // '이' 바로 뒤에 한글이 이어지면 조사가 아니라 '~이야/~이니까/~이랑'의 '이'
    // → 받침 없는 말 뒤에서는 빼야 자연스러움 (잔업이야 → 연장 근무야)
    let particleTo = fixParticle(term.easy, particle);
    const nextChar = text.charAt(match.index + match[0].length);
    if (particle === '이' && /[가-힣]/.test(nextChar)) {
      particleTo = hasBatchim(term.easy) ? '이' : '';
    }

    pieces.push({ type: 'plain', text: text.slice(lastEnd, match.index) });
    pieces.push({
      type: 'term',
      from: word,
      to: term.easy,
      particleFrom: particle,
      particleTo: particleTo,
    });
    lastEnd = match.index + match[0].length;
  }
  pieces.push({ type: 'plain', text: text.slice(lastEnd) });
  return pieces;
}

// 조각들을 다시 이어서 쉬운 한국어 문장으로
function piecesToEasyText(pieces) {
  return pieces.map(function (p) {
    return p.type === 'plain' ? p.text : p.to + p.particleTo;
  }).join('');
}

// 조각들을 화면용 HTML로 (바뀐 단어는 <mark>로 노란색 표시)
// side: 'from'이면 원문, 'to'면 쉬운 한국어
function piecesToHtml(pieces, side) {
  return pieces.map(function (p) {
    if (p.type === 'plain') return escapeHtml(p.text);
    // 사전 단어는 사용자가 입력한 값이므로 화면에 넣기 전에 안전하게 변환
    if (side === 'from') return '<mark>' + escapeHtml(p.from) + '</mark>' + escapeHtml(p.particleFrom);
    return '<mark>' + escapeHtml(p.to) + '</mark>' + escapeHtml(p.particleTo);
  }).join('');
}


// =====================================================
// 4단계: 가장 비슷한 템플릿 찾기 (규칙)
// 두 문장을 두 글자씩 잘라 겹치는 조각이 얼마나 많은지로 비슷함을 계산
// =====================================================

function toBigrams(text) {
  const clean = text.replace(/[^가-힣a-zA-Z0-9]/g, ''); // 공백·문장부호 제거
  const list = [];
  for (let i = 0; i < clean.length - 1; i++) {
    list.push(clean.slice(i, i + 2));
  }
  return list;
}

// 0(전혀 다름) ~ 1(똑같음)
function similarity(a, b) {
  const listA = toBigrams(a);
  const listB = toBigrams(b);
  if (listA.length === 0 || listB.length === 0) return 0;

  const remaining = listB.slice();
  let common = 0;
  listA.forEach(function (bg) {
    const i = remaining.indexOf(bg);
    if (i !== -1) {
      common++;
      remaining.splice(i, 1);
    }
  });
  return (2 * common) / (listA.length + listB.length);
}

// 문장 속 숫자만 뽑기 (예: '오늘 5시, 3개' → '5,3')
function getNumbers(text) {
  return (text.match(/\d+/g) || []).join(',');
}

// 쉬운 한국어 문장과 가장 비슷한 템플릿과 점수
function findBestTemplate(easyText) {
  let best = null;
  let bestScore = 0;
  demoInstructions.forEach(function (tpl) {
    // 숫자(시간·개수)가 다르면 번역이 틀리므로 이 템플릿은 쓰지 않음
    if (getNumbers(easyText) !== getNumbers(tpl.original)) return;

    // 템플릿 원문도 같은 규칙으로 바꾼 뒤 비교, 다듬은 문장과도 비교해 높은 쪽 사용
    const tplEasy = piecesToEasyText(convertText(tpl.original));
    const score = Math.max(similarity(easyText, tplEasy), similarity(easyText, tpl.easyKo));
    if (score > bestScore) {
      best = tpl;
      bestScore = score;
    }
  });
  return { template: best, score: bestScore };
}

const GOOD_MATCH = 0.6; // 60% 이상 비슷하면 믿을 만한 템플릿으로 봄


// =====================================================
// 지시 작성 화면
// =====================================================

const demoSelect = document.getElementById('demo-select');
const inputText = document.getElementById('input-text');
const recipientList = document.getElementById('recipient-list');
const errorText = document.getElementById('write-error');

// 시연 지시 10건을 선택 목록에 넣기
demoInstructions.forEach(function (tpl, i) {
  const option = document.createElement('option');
  option.value = tpl.id;
  option.textContent = (i + 1) + '. ' + (tpl.safety ? '⚠️ ' : '') + tpl.original;
  demoSelect.appendChild(option);
});

// 시연 지시를 고르면 입력창과 지시 종류를 채움
demoSelect.addEventListener('change', function () {
  const tpl = demoInstructions.find(function (t) { return t.id === demoSelect.value; });
  if (!tpl) return;
  inputText.value = tpl.original;
  document.querySelector('input[name="kind"][value="' + (tpl.safety ? 'safety' : 'normal') + '"]').checked = true;
  clearResult();
});

// 받는 사람 체크박스 만들기 (처음엔 모두 선택)
workers.forEach(function (w) {
  const lang = languages[w.lang];
  const label = document.createElement('label');
  label.className = 'recipient';
  label.innerHTML =
    '<input type="checkbox" value="' + w.id + '" checked> ' +
    lang.flag + ' ' + escapeHtml(w.name) + ' <span class="lang-tag">' + lang.name + '</span>';
  recipientList.appendChild(label);
});

// 전체 선택 / 해제
document.getElementById('toggle-all').addEventListener('click', function () {
  const boxes = recipientList.querySelectorAll('input');
  const allChecked = Array.from(boxes).every(function (b) { return b.checked; });
  boxes.forEach(function (b) { b.checked = !allChecked; });
  clearResult();
});

// 체크된 근로자 목록
function getSelectedWorkers() {
  const checkedIds = Array.from(recipientList.querySelectorAll('input:checked')).map(function (b) {
    return b.value;
  });
  return workers.filter(function (w) { return checkedIds.includes(w.id); });
}

// [변환하기]
document.getElementById('convert-btn').addEventListener('click', function () {
  const text = inputText.value.trim();
  const isSafety = document.querySelector('input[name="kind"]:checked').value === 'safety';
  const selected = getSelectedWorkers();

  // 입력 확인
  errorText.textContent = '';
  sendMessage.textContent = '';
  if (!text) {
    errorText.textContent = '작업 지시를 입력해 주세요.';
    return;
  }
  if (selected.length === 0) {
    errorText.textContent = '받는 사람을 한 명 이상 선택해 주세요.';
    return;
  }

  // ① 용어 치환
  const pieces = convertText(text);
  const easyText = piecesToEasyText(pieces);
  showChangedWords(pieces);
  document.getElementById('original-view').innerHTML = piecesToHtml(pieces, 'from');
  document.getElementById('easy-view').innerHTML = piecesToHtml(pieces, 'to');

  // ② 템플릿 찾기 + 번역 미리보기
  clearAi();
  const best = findBestTemplate(easyText);
  showTemplateInfo(best, isSafety);

  if (best.score >= GOOD_MATCH) {
    // 템플릿이 있으면: 받는 사람 언어의 번역만 골라 바로 미리보기
    const translations = {};
    getLangCodes(selected).forEach(function (code) {
      translations[code] = best.template.translations[code];
    });
    lastResult = {
      source: 'template',
      original: text,
      ruleKo: easyText,
      safety: isSafety,
      workers: selected,
      easyKo: best.template.easyKo,
      translations: translations,
      templateId: best.template.id,
    };
    showPreview(lastResult);
  } else {
    // 템플릿이 없으면: AI에게 맡길 준비 (반장이 버튼을 눌러야 AI 호출)
    document.getElementById('preview-list').innerHTML = '';
    lastResult = null;
    pendingAi = {
      original: text,
      ruleKo: easyText,
      changes: getChanges(pieces),
      safety: isSafety,
      workers: selected,
    };
    showAiOffer();
  }

  updateSendButton();
  document.getElementById('result').hidden = false;
});

// 받는 사람들의 언어 코드 (중복 없이, 예: ['vi', 'ne'])
function getLangCodes(selected) {
  const codes = [];
  selected.forEach(function (w) {
    if (!codes.includes(w.lang)) codes.push(w.lang);
  });
  return codes;
}

// 바뀐 단어 목록 (같은 단어는 한 번만, 예: [{from: '시마이', to: '마무리'}])
function getChanges(pieces) {
  const list = [];
  pieces.forEach(function (p) {
    if (p.type === 'term' && !list.some(function (c) { return c.from === p.from; })) {
      list.push({ from: p.from, to: p.to });
    }
  });
  return list;
}

// 바뀐 단어 목록 (같은 단어는 한 번만)
function showChangedWords(pieces) {
  const box = document.getElementById('changed-words');
  const seen = [];
  const chips = [];
  pieces.forEach(function (p) {
    if (p.type === 'term' && !seen.includes(p.from)) {
      seen.push(p.from);
      chips.push('<span class="chip"><mark>' + escapeHtml(p.from) + '</mark> → <mark>' + escapeHtml(p.to) + '</mark></span>');
    }
  });
  box.innerHTML = chips.length
    ? chips.join('')
    : '<p class="hint">사전에 있는 현장 용어가 없어요. 원문 그대로 사용합니다.</p>';
}

// 어떤 템플릿을 썼는지, 얼마나 비슷한지 안내
function showTemplateInfo(best, isSafety) {
  const info = document.getElementById('template-info');

  // 비슷한 템플릿이 없으면 번역하지 않음
  // ("손 넣어도 돼"에 "손 넣지 마세요" 번역이 붙는 것처럼 뜻이 반대로 갈 수 있어서)
  if (best.score < GOOD_MATCH) {
    let html = '<span class="warn">⚠️ 맞는 번역 템플릿이 없어요.</span>';
    if (best.template) {
      html += '<br><span class="score">가장 가까운 템플릿: ' + escapeHtml(best.template.easyKo) +
        ' (비슷함 ' + Math.round(best.score * 100) + '%)</span>';
    }
    info.innerHTML = html;
    return;
  }

  let html =
    '사용한 템플릿: <strong>' + escapeHtml(best.template.easyKo) + '</strong> ' +
    '<span class="score">비슷함 ' + Math.round(best.score * 100) + '%</span>';

  if (best.template.safety && !isSafety) {
    html += '<br><span class="warn">⚠️ 이 템플릿은 안전 지시예요. 지시 종류를 "안전 지시"로 바꿔야 하는지 확인하세요.</span>';
  }
  info.innerHTML = html;
}

// 받는 사람의 언어별로 미리보기 카드 (같은 언어는 한 장으로 묶음)
// result: 템플릿 결과든 AI 결과든 같은 모양 { easyKo, translations, workers, safety, source, backKo? }
function showPreview(result) {
  const box = document.getElementById('preview-list');
  const isAi = result.source === 'ai';

  box.innerHTML = getLangCodes(result.workers).map(function (code) {
    const lang = languages[code];
    const names = result.workers
      .filter(function (w) { return w.lang === code; })
      .map(function (w) { return escapeHtml(w.name); })
      .join(', ');

    return (
      '<div class="preview-card' + (result.safety ? ' safety' : '') + '">' +
        (result.safety ? '<div class="safety-label">' + lang.safetyLabel + '</div>' : '') +
        '<div class="preview-head">' + lang.flag + ' ' + lang.name + ' (' + lang.native + ')' +
          (isAi ? ' <span class="ai-badge">🤖 AI 번역</span>' : '') +
          '<span class="preview-names">' + names + '</span></div>' +
        '<p class="preview-text">' + escapeHtml(result.translations[code]) + '</p>' +
        // AI 번역은 반장이 확인할 수 있게 "다시 한국어로 옮긴 뜻"을 함께 보여줌
        (isAi ? '<p class="preview-back">🔁 한국어로 되옮기면: ' + escapeHtml(result.backKo[code]) + '</p>' : '') +
        '<p class="preview-ko">' + escapeHtml(result.easyKo) + '</p>' +
      '</div>'
    );
  }).join('');
}


// =====================================================
// 9단계: 템플릿에 없는 지시는 AI로 다듬고 번역
// 브라우저는 API 키 없이 Supabase 중계 함수(AI_URL)만 부름
// =====================================================

const aiBox = document.getElementById('ai-box');
const aiConfirmRow = document.getElementById('ai-confirm-row');
const aiConfirm = document.getElementById('ai-confirm');

let pendingAi = null;  // AI에게 보낼 내용 (템플릿이 없을 때만)
let aiRequestNo = 0;   // 요청 번호: 기다리는 사이 입력을 바꾸면 늦게 온 옛 답은 버림

// AI 관련 화면과 상태를 모두 초기화
function clearAi() {
  pendingAi = null;
  aiRequestNo++;
  aiBox.hidden = true;
  aiBox.innerHTML = '';
  aiConfirm.checked = false;
  aiConfirmRow.hidden = true;
}

// 템플릿이 없을 때 AI 버튼 보여주기
function showAiOffer() {
  aiBox.hidden = false;
  if (!AI_URL) {
    aiBox.innerHTML =
      '<p class="hint">AI가 연결되지 않아 번역할 수 없어요. 시연 지시와 비슷하게 바꿔 쓰거나 직접 설명해 주세요.</p>';
    return;
  }
  aiBox.innerHTML =
    '<button type="button" id="ai-btn" class="main-btn ai-btn">🤖 AI로 다듬고 번역하기</button>' +
    '<p class="hint">AI 결과는 바로 보내지 않아요. 미리보기에서 확인한 뒤 보낼 수 있어요.</p>';
}

// AI 버튼 클릭 (버튼이 새로 그려지므로 상자 전체에서 받음)
aiBox.addEventListener('click', function (event) {
  if (event.target.closest('#ai-btn')) requestAi();
});

// AI 답이 약속한 모양인지 검사 (받는 사람 언어가 모두 있어야 함)
function isValidAiResult(data, langCodes) {
  if (!data || typeof data.easyKo !== 'string' || !data.easyKo.trim()) return false;
  if (!data.translations || typeof data.translations !== 'object') return false;
  return langCodes.every(function (code) {
    const t = data.translations[code];
    return t && typeof t.text === 'string' && t.text.trim() && typeof t.backKo === 'string';
  });
}

async function requestAi() {
  if (!pendingAi) return;
  const request = pendingAi;
  const myNo = ++aiRequestNo;
  const langCodes = getLangCodes(request.workers);

  aiBox.innerHTML = '<p class="ai-loading">🤖 AI가 다듬고 번역하는 중이에요… (보통 10~30초)</p>';

  // 60초가 지나도 답이 없으면 포기
  const controller = new AbortController();
  const timer = setTimeout(function () { controller.abort(); }, 60000);

  try {
    const response = await fetch(AI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        original: request.original,
        ruleKo: request.ruleKo,
        changes: request.changes,
        safety: request.safety,
        langs: langCodes,
      }),
      signal: controller.signal,
    });

    const data = await response.json().catch(function () { return {}; });
    if (myNo !== aiRequestNo) return; // 기다리는 사이 입력이 바뀜 → 이 답은 버림

    if (!response.ok) throw new Error(data.error || 'AI 서버 오류 (' + response.status + ')');
    if (!isValidAiResult(data, langCodes)) throw new Error('AI 답의 모양이 맞지 않아요.');

    // 템플릿 결과와 같은 모양으로 정리
    const translations = {};
    const backKo = {};
    langCodes.forEach(function (code) {
      translations[code] = data.translations[code].text.trim();
      backKo[code] = data.translations[code].backKo.trim();
    });
    lastResult = {
      source: 'ai',
      original: request.original,
      ruleKo: request.ruleKo,
      safety: request.safety,
      workers: request.workers,
      easyKo: data.easyKo.trim(),
      translations: translations,
      backKo: backKo,
      templateId: null,
    };

    showAiResultInfo(data, request.safety);
    showPreview(lastResult);
    updateSendButton();
  } catch (error) {
    if (myNo !== aiRequestNo) return;
    const message = error.name === 'AbortError'
      ? 'AI 답이 너무 늦어요.'
      // 연결 실패 문구는 브라우저마다 달라서(Failed to fetch / Load failed …) 오류 종류로 구분
      : (error instanceof TypeError ? 'AI 서버에 연결하지 못했어요. 인터넷과 AI_URL 주소를 확인해 주세요.' : error.message);
    aiBox.innerHTML =
      '<p class="error">⚠️ ' + escapeHtml(message) + '</p>' +
      '<button type="button" id="ai-btn" class="small-btn">다시 시도</button>' +
      '<p class="hint">AI를 쓸 수 없으면 시연 지시(템플릿)와 비슷하게 바꿔 쓰거나 직접 설명해 주세요.</p>';
  } finally {
    clearTimeout(timer); // 성공하든 실패하든 60초 타이머 정리
  }
}

// AI 결과 위에 보여줄 안내 (다듬은 문장, 주의할 점)
function showAiResultInfo(data, isSafety) {
  let html =
    '<div class="ai-result">' +
      '<div class="compare-title">🤖 AI가 다듬은 쉬운 한국어</div>' +
      '<p class="ai-easy">' + escapeHtml(data.easyKo) + '</p>';

  if (typeof data.notes === 'string' && data.notes.trim()) {
    html += '<p class="warn">💬 AI 메모: ' + escapeHtml(data.notes.trim()) + '</p>';
  }
  if (data.looksSafety === true && !isSafety) {
    html += '<p class="warn">⚠️ AI가 보기에 안전 관련 지시예요. 지시 종류를 "안전 지시"로 바꿔야 하는지 확인하세요.</p>';
  }
  html +=
      '<p class="hint">아래 각 언어의 "한국어로 되옮기면"이 원래 지시와 뜻이 같은지 확인한 뒤, 맨 아래 확인란을 체크해야 보낼 수 있어요.</p>' +
    '</div>';
  aiBox.innerHTML = html;
}

// 보내기 버튼 상태: 결과가 없으면 숨김, AI 결과는 확인란을 체크해야 켜짐
function updateSendButton() {
  sendBtn.hidden = !lastResult;
  const needsConfirm = !!lastResult && lastResult.source === 'ai';
  aiConfirmRow.hidden = !needsConfirm;
  sendBtn.disabled = needsConfirm && !aiConfirm.checked;
}
aiConfirm.addEventListener('change', updateSendButton);


// =====================================================
// 5단계: 보내기 + 저장
// =====================================================

const sendBtn = document.getElementById('send-btn');
const sendMessage = document.getElementById('send-message');

// 마지막으로 [변환하기]한 결과. 번역이 없거나 입력을 고치면 null
let lastResult = null;

// 입력을 고치면 이전 변환 결과는 맞지 않으므로 숨김 → 다시 [변환하기]를 눌러야 보낼 수 있음
function clearResult() {
  lastResult = null;
  clearAi(); // AI를 기다리는 중이었다면 그 답도 버림
  document.getElementById('result').hidden = true;
}
inputText.addEventListener('input', clearResult);
recipientList.addEventListener('change', clearResult);
document.querySelectorAll('input[name="kind"]').forEach(function (radio) {
  radio.addEventListener('change', clearResult);
});

// [보내기]
sendBtn.addEventListener('click', function () {
  if (!lastResult) return;
  // AI 번역은 반장이 확인란을 체크해야만 보낼 수 있음 (버튼이 꺼져 있어도 한 번 더 막음)
  if (lastResult.source === 'ai' && !aiConfirm.checked) return;

  const instruction = saveInstruction(lastResult);
  if (!instruction) {
    errorText.textContent = '저장하지 못해서 보내지 못했어요. 일반 브라우저 창에서 다시 해 주세요.';
    return;
  }

  // 화면 정리: 같은 지시를 두 번 보내지 않도록 입력창과 결과를 비움
  sendMessage.textContent =
    '✅ ' + instruction.recipients.length + '명에게 보냈어요 (' +
    Object.keys(instruction.translations).length + '개 언어). 근로자 카드 탭에서 확인할 수 있어요.';
  inputText.value = '';
  demoSelect.value = '';
  clearResult();
  refreshAll();
});

// 지시 한 건과 받는 사람별 카드를 저장. 성공하면 저장한 지시, 실패하면 null
// result: 템플릿 결과든 AI 결과든 같은 모양 { original, ruleKo, easyKo, safety, source, templateId, workers, translations }
// sentAt: 보낸 시각 (비우면 지금. 예시 데이터는 과거 시각을 넣음)
function saveInstruction(result, sentAt) {
  // 번역 문장을 그대로 복사해 두므로, 나중에 data.js를 고쳐도 이미 보낸 카드는 바뀌지 않음
  const instruction = {
    id: makeId(),
    sentAt: sentAt || new Date().toISOString(),
    original: result.original,          // 반장이 쓴 원문
    ruleKo: result.ruleKo,              // 규칙으로 바꾼 쉬운 한국어
    easyKo: result.easyKo,              // 다듬은 쉬운 한국어 (카드에 표시)
    safety: result.safety,
    source: result.source,              // 'template'(미리 번역) 또는 'ai'
    templateId: result.templateId,      // AI 번역이면 null
    recipients: result.workers.map(function (w) { return w.id; }),
    translations: result.translations,  // 받는 사람 언어의 번역만
  };

  const list = loadData(KEY_SENT, []);
  list.unshift(instruction); // 최신이 맨 위

  // 받는 사람마다 카드 한 장씩 (그 사람의 언어 번역만 담음)
  const cards = loadData(KEY_CARDS, []);
  result.workers.forEach(function (w) {
    cards.unshift({
      id: instruction.id + '_' + w.id,
      instructionId: instruction.id,
      workerId: w.id,
      lang: w.lang,
      text: result.translations[w.lang], // 모국어 (크게)
      easyKo: instruction.easyKo,        // 쉬운 한국어 (아래)
      safety: instruction.safety,
      sentAt: instruction.sentAt,
      answer: null,                      // 'understood'(이해했어요) / 'confused'(모르겠어요) / null(아직)
      answeredAt: null,
    });
  });

  // 카드를 먼저 저장: 지시만 저장되고 카드가 없는 어긋난 상태를 피함
  if (!saveData(KEY_CARDS, cards)) return null;
  if (!saveData(KEY_SENT, list)) return null;
  return instruction;
}

// 보낸 지시 목록 그리기
function renderSentList() {
  const list = loadData(KEY_SENT, []);
  const box = document.getElementById('sent-list');
  document.getElementById('sent-count').textContent = list.length;

  if (list.length === 0) {
    box.innerHTML = '<p class="hint">아직 보낸 지시가 없어요.</p>';
    return;
  }

  box.innerHTML = list.map(function (item) {
    return (
      '<div class="sent-item' + (item.safety ? ' safety' : '') + '">' +
        '<div class="sent-meta">' +
          formatTime(item.sentAt) + ' · ' + item.recipients.length + '명' +
          (item.safety ? ' · <strong>⚠️ 안전</strong>' : '') +
          (item.source === 'ai' ? ' · 🤖 AI 번역' : '') +
        '</div>' +
        '<div>' + escapeHtml(item.easyKo) + '</div>' +
        '<div class="sent-original">원문: ' + escapeHtml(item.original) + '</div>' +
      '</div>'
    );
  }).join('');
}

// 모두 지우기 (보낸 지시 + 응답)
document.getElementById('clear-btn').addEventListener('click', function () {
  if (!confirm('보낸 지시와 근로자 응답을 모두 지울까요? 되돌릴 수 없어요.')) return;
  removeData(KEY_SENT);
  removeData(KEY_CARDS);
  sendMessage.textContent = '';
  refreshAll();
});

// (처음 화면 그리기는 파일 맨 아래 refreshAll()에서 한 번에 함)


// =====================================================
// 6단계: 근로자 카드 화면
// =====================================================

const workerSelect = document.getElementById('worker-select');
const cardList = document.getElementById('card-list');

// 근로자 선택 목록 채우기
workers.forEach(function (w) {
  const lang = languages[w.lang];
  const option = document.createElement('option');
  option.value = w.id;
  option.textContent = lang.flag + ' ' + w.name + ' (' + lang.native + ')';
  workerSelect.appendChild(option);
});

// 지난번에 고른 근로자를 기억해 두었다가 다시 선택
const savedWorker = loadData(KEY_WORKER, null);
if (workers.some(function (w) { return w.id === savedWorker; })) {
  workerSelect.value = savedWorker;
}

workerSelect.addEventListener('change', function () {
  saveData(KEY_WORKER, workerSelect.value);
  renderCards();
});

// 고른 근로자의 카드 그리기
function renderCards() {
  const worker = workers.find(function (w) { return w.id === workerSelect.value; });
  const lang = languages[worker.lang];
  const myCards = loadData(KEY_CARDS, []).filter(function (c) {
    return c.workerId === worker.id;
  });

  // 맨 위 요약: 받은 카드 수, 아직 응답 안 한 수
  const waiting = myCards.filter(function (c) { return !c.answer; }).length;
  document.getElementById('card-summary').textContent = myCards.length === 0
    ? '아직 받은 지시가 없어요.'
    : '받은 지시 ' + myCards.length + '건 · 응답 안 함 ' + waiting + '건';

  cardList.innerHTML = myCards.map(function (card) {
    // 응답 상태 문구
    let status = '';
    if (card.answer === 'understood') status = '✅ 이해했어요 · ' + formatTime(card.answeredAt);
    if (card.answer === 'confused') status = '❓ 모르겠어요 · ' + formatTime(card.answeredAt) + ' — 반장님이 다시 설명해 줄 거예요';

    return (
      '<article class="work-card' + (card.safety ? ' safety' : '') + '">' +
        (card.safety ? '<div class="work-card-warning">' + lang.safetyLabel + '</div>' : '') +
        '<p class="work-card-native">' + escapeHtml(card.text) + '</p>' +
        '<p class="work-card-ko">' + escapeHtml(card.easyKo) + '</p>' +
        '<div class="work-card-time">' + formatTime(card.sentAt) + '</div>' +

        // 큰 버튼 두 개 (모국어 + 한국어). 이미 고른 쪽은 진하게 표시. 다시 눌러 바꿀 수 있음
        '<div class="answer-row">' +
          '<button type="button" class="answer-btn understood' + (card.answer === 'understood' ? ' chosen' : '') + '"' +
            ' data-card="' + card.id + '" data-answer="understood">' +
            '✅ ' + lang.understood + '<small>이해했어요</small></button>' +
          '<button type="button" class="answer-btn confused' + (card.answer === 'confused' ? ' chosen' : '') + '"' +
            ' data-card="' + card.id + '" data-answer="confused">' +
            '❓ ' + lang.confused + '<small>모르겠어요</small></button>' +
        '</div>' +
        (status ? '<p class="answer-status">' + status + '</p>' : '') +
      '</article>'
    );
  }).join('');
}

// 버튼을 누르면 그 카드에 응답을 저장
// (카드마다 버튼을 따로 연결하지 않고, 목록 전체에서 한 번에 받음)
cardList.addEventListener('click', function (event) {
  const button = event.target.closest('.answer-btn');
  if (!button) return;

  const cards = loadData(KEY_CARDS, []);
  const card = cards.find(function (c) { return c.id === button.dataset.card; });
  if (!card) return;

  card.answer = button.dataset.answer;
  card.answeredAt = new Date().toISOString();
  saveData(KEY_CARDS, cards);
  renderCards();
});



// =====================================================
// 7단계: 반장 확인판
// =====================================================

const boardList = document.getElementById('board-list');
let openInstructionId = null; // 지금 펼쳐 놓은 지시 (null이면 모두 접힘)

// 상태별 표시: 표 순서도 이 순서 (모르겠음 → 미확인 → 이해)
const statusInfo = {
  confused:   { order: 0, label: '? 모르겠음', className: 'status-confused' },
  waiting:    { order: 1, label: '– 미확인',   className: 'status-waiting' },
  understood: { order: 2, label: '✓ 이해',     className: 'status-understood' },
};

// 카드의 응답 상태 이름. 모르는 값이 저장돼 있어도 '미확인'으로 처리해 멈추지 않게
function statusKey(card) {
  return statusInfo[card.answer] ? card.answer : 'waiting';
}

function renderBoard() {
  const list = loadData(KEY_SENT, []);
  const allCards = loadData(KEY_CARDS, []);

  if (list.length === 0) {
    boardList.innerHTML = '<p class="hint">아직 보낸 지시가 없어요. 지시 작성 탭에서 보내 주세요.</p>';
    return;
  }

  boardList.innerHTML = list.map(function (item) {
    const cards = allCards.filter(function (c) { return c.instructionId === item.id; });

    // 상태별 인원 세기 (규칙)
    const count = { understood: 0, confused: 0, waiting: 0 };
    cards.forEach(function (c) { count[statusKey(c)]++; });
    const rate = cards.length ? Math.round((count.understood / cards.length) * 100) : 0;
    const isOpen = item.id === openInstructionId;

    return (
      '<div class="board-item' + (item.safety ? ' safety' : '') + (count.confused ? ' has-confused' : '') + '">' +
        // 누르면 펼치기/접기
        '<button type="button" class="board-head" data-id="' + item.id + '">' +
          '<div class="sent-meta">' +
            formatTime(item.sentAt) +
            (item.safety ? ' · <strong>⚠️ 안전</strong>' : '') +
            (item.source === 'ai' ? ' · 🤖 AI 번역' : '') +
            '<span class="board-toggle">' + (isOpen ? '▲ 접기' : '▼ 보기') + '</span>' +
          '</div>' +
          '<div class="board-text">' + escapeHtml(item.easyKo) + '</div>' +
          '<div class="board-count">' +
            '<span class="status-understood">✓ ' + count.understood + '</span>' +
            '<span class="status-confused">? ' + count.confused + '</span>' +
            '<span class="status-waiting">– ' + count.waiting + '</span>' +
            '<span class="board-rate">이해율 ' + rate + '%</span>' +
          '</div>' +
          (count.confused
            ? '<div class="board-alert">❗ ' + count.confused + '명이 모르겠다고 했어요. 다시 설명해 주세요.</div>'
            : '') +
        '</button>' +
        (isOpen ? renderStatusTable(cards) : '') +
      '</div>'
    );
  }).join('');
}

// 근로자별 상태 표 (모르겠음이 맨 위)
function renderStatusTable(cards) {
  const workerOrder = workers.map(function (w) { return w.id; });
  const rows = cards.slice().sort(function (a, b) {
    const byStatus = statusInfo[statusKey(a)].order - statusInfo[statusKey(b)].order;
    if (byStatus !== 0) return byStatus;
    // 같은 상태끼리는 근로자 명단 순서대로
    return workerOrder.indexOf(a.workerId) - workerOrder.indexOf(b.workerId);
  });

  return (
    '<table class="status-table">' +
      '<thead><tr><th>상태</th><th>이름</th><th>언어</th><th>응답 시각</th></tr></thead>' +
      '<tbody>' +
      rows.map(function (c) {
        const info = statusInfo[statusKey(c)];
        const worker = workers.find(function (w) { return w.id === c.workerId; });
        const lang = languages[c.lang];
        return (
          '<tr class="row-' + statusKey(c) + '">' +
            '<td class="' + info.className + '">' + info.label + '</td>' +
            '<td>' + escapeHtml(worker ? worker.name : c.workerId) + '</td>' +
            '<td>' + (lang ? lang.flag + ' ' + lang.name : escapeHtml(String(c.lang))) + '</td>' +
            '<td>' + (c.answeredAt ? formatTime(c.answeredAt) : '') + '</td>' +
          '</tr>'
        );
      }).join('') +
      '</tbody>' +
    '</table>'
  );
}

// 지시를 누르면 펼치기 / 다시 누르면 접기
boardList.addEventListener('click', function (event) {
  const head = event.target.closest('.board-head');
  if (!head) return;
  openInstructionId = (openInstructionId === head.dataset.id) ? null : head.dataset.id;
  renderBoard();
});


// =====================================================
// 용어 사전 화면 (추가 · 수정 · 삭제)
// =====================================================

const dictWord = document.getElementById('dict-word');
const dictEasy = document.getElementById('dict-easy');
const dictSaveBtn = document.getElementById('dict-save');
const dictCancelBtn = document.getElementById('dict-cancel');
const dictError = document.getElementById('dict-error');
const dictSearch = document.getElementById('dict-search');
const dictBody = document.getElementById('dict-body');
let editingWord = null; // 수정 중인 용어 (null이면 새로 추가하는 중)

// 사전을 저장하고, 변환 규칙과 화면에 바로 반영
function saveDictionary() {
  saveData(KEY_TERMS, dictionary);
  rebuildDictionary();
  clearResult(); // 지시 작성 화면의 이전 변환 결과는 옛 사전 기준이므로 숨김
  renderDictionary();
}

function renderDictionary() {
  document.getElementById('dict-count').textContent = dictionary.length;
  const keyword = dictSearch.value.trim();

  // 가나다순, 검색어가 있으면 용어나 쉬운 말에 들어 있는 것만
  const rows = dictionary
    .filter(function (t) {
      return !keyword || t.word.includes(keyword) || t.easy.includes(keyword);
    })
    .sort(function (a, b) { return a.word.localeCompare(b.word, 'ko'); });

  if (rows.length === 0) {
    dictBody.innerHTML = '<tr><td colspan="3" class="hint">' +
      (keyword ? '찾는 용어가 없어요.' : '사전이 비어 있어요.') + '</td></tr>';
    return;
  }

  dictBody.innerHTML = rows.map(function (t) {
    const word = escapeHtml(t.word);
    return (
      '<tr' + (t.word === editingWord ? ' class="editing"' : '') + '>' +
        '<td><strong>' + word + '</strong></td>' +
        '<td>' + escapeHtml(t.easy) + '</td>' +
        '<td class="dict-buttons">' +
          '<button type="button" class="small-btn" data-action="edit" data-word="' + word + '">수정</button>' +
          '<button type="button" class="small-btn danger" data-action="delete" data-word="' + word + '">삭제</button>' +
        '</td>' +
      '</tr>'
    );
  }).join('');
}

// 입력칸을 비우고 '추가' 상태로 되돌림
function resetDictForm() {
  editingWord = null;
  dictWord.value = '';
  dictEasy.value = '';
  dictError.textContent = '';
  dictSaveBtn.textContent = '추가하기';
  dictCancelBtn.hidden = true;
}

// [추가하기] / [수정 저장]
dictSaveBtn.addEventListener('click', function () {
  const word = dictWord.value.trim();
  const easy = dictEasy.value.trim();

  // 입력 확인 (규칙)
  if (!word || !easy) {
    dictError.textContent = '현장 용어와 쉬운 한국어를 모두 입력해 주세요.';
    return;
  }
  if (word === easy) {
    dictError.textContent = '현장 용어와 쉬운 한국어가 같아요.';
    return;
  }
  const duplicate = dictionary.some(function (t) {
    return t.word === word && t.word !== editingWord;
  });
  if (duplicate) {
    dictError.textContent = '"' + word + '"은(는) 이미 사전에 있어요. 목록에서 [수정]을 눌러 주세요.';
    return;
  }

  if (editingWord) {
    const term = dictionary.find(function (t) { return t.word === editingWord; });
    // 용어 자체를 바꾸면 '신나게' 같은 예외 규칙은 더 이상 맞지 않으므로 지움
    if (term.word !== word) delete term.notFollowedBy;
    term.word = word;
    term.easy = easy;
  } else {
    dictionary.push({ word: word, easy: easy });
  }

  resetDictForm();
  saveDictionary();
});

dictCancelBtn.addEventListener('click', function () {
  resetDictForm();
  renderDictionary();
});

// 표의 [수정] [삭제]
dictBody.addEventListener('click', function (event) {
  const button = event.target.closest('button');
  if (!button) return;
  const word = button.dataset.word;

  if (button.dataset.action === 'edit') {
    const term = dictionary.find(function (t) { return t.word === word; });
    editingWord = word;
    dictWord.value = term.word;
    dictEasy.value = term.easy;
    dictError.textContent = '';
    dictSaveBtn.textContent = '수정 저장';
    dictCancelBtn.hidden = false;
    renderDictionary();
    dictWord.scrollIntoView({ behavior: 'smooth', block: 'center' });
    dictWord.focus();
  }

  if (button.dataset.action === 'delete') {
    if (!confirm('"' + word + '"을(를) 사전에서 지울까요?')) return;
    dictionary = dictionary.filter(function (t) { return t.word !== word; });
    if (editingWord === word) resetDictForm();
    saveDictionary();
  }
});

dictSearch.addEventListener('input', renderDictionary);

// 처음 사전(data.js의 30개)으로 되돌리기
document.getElementById('dict-reset').addEventListener('click', function () {
  if (!confirm('추가·수정·삭제한 내용을 모두 버리고 처음 사전 30개로 되돌릴까요?')) return;
  dictionary = defaultDictionary();
  resetDictForm();
  saveDictionary();
});


// =====================================================
// 모든 화면 새로 그리기
// =====================================================

function refreshAll() {
  renderSentList();
  renderCards();
  renderBoard();
  renderDictionary();
}

// 탭을 옮길 때마다 새로 그림 (방금 보낸 지시나 응답이 바로 보이게)
window.addEventListener('hashchange', refreshAll);

// 같은 브라우저의 다른 탭에서 보내거나 응답하거나 사전을 고치면 이 탭도 자동으로 반영
window.addEventListener('storage', function (event) {
  // key가 null이면 저장소 전체가 지워진 것
  if (event.key === KEY_TERMS || event.key === null) {
    dictionary = loadDictionary();
    rebuildDictionary();
  }
  refreshAll();
});


// =====================================================
// 발표 시연용: 예시 데이터와 [초기화]
// =====================================================

// data.js의 예시 지시(demoSeed)를 '이미 보낸 지시'로 저장하고 응답도 채워 넣음
function seedDemoData() {
  const now = Date.now();

  demoSeed.forEach(function (seed) {
    const tpl = demoInstructions.find(function (t) { return t.id === seed.templateId; });
    if (!tpl) return;

    const translations = {};
    getLangCodes(workers).forEach(function (code) {
      translations[code] = tpl.translations[code];
    });

    const sentAtMs = now - seed.minutesAgo * 60000;
    const instruction = saveInstruction({
      source: 'template',
      original: tpl.original,
      ruleKo: piecesToEasyText(convertText(tpl.original)),
      easyKo: tpl.easyKo,
      safety: tpl.safety,
      templateId: tpl.id,
      workers: workers,          // 예시는 8명 모두에게 보낸 것으로
      translations: translations,
    }, new Date(sentAtMs).toISOString());
    if (!instruction) return;

    // 응답 채우기: 보낸 뒤 몇 분 사이에 한 사람씩 응답한 것처럼 시각을 다르게
    const cards = loadData(KEY_CARDS, []);
    let order = 0;
    cards.forEach(function (card) {
      const answer = card.instructionId === instruction.id ? seed.answers[card.workerId] : null;
      if (!answer) return;
      order++;
      card.answer = answer;
      card.answeredAt = new Date(sentAtMs + (2 + order) * 60000).toISOString();
    });
    saveData(KEY_CARDS, cards);
  });

  saveData(KEY_SEEDED, true);
}

// [초기화]: 시연을 처음 상태로 (보낸 지시·응답·사전 수정 → 지우고 예시 3건 다시 넣기)
document.getElementById('reset-btn').addEventListener('click', function () {
  const ok = confirm(
    '발표 시연 처음 상태로 되돌릴까요?\n' +
    '보낸 지시, 근로자 응답, 사전 수정 내용이 모두 지워지고 예시 지시 3건이 다시 들어가요.'
  );
  if (!ok) return;

  // 저장된 데이터 지우기 (이 앱의 것만. 같은 주소의 다른 과제 데이터는 건드리지 않음)
  [KEY_SENT, KEY_CARDS, KEY_TERMS, KEY_WORKER, KEY_SEEDED].forEach(removeData);

  // 사전과 예시 데이터를 처음대로
  dictionary = defaultDictionary();
  rebuildDictionary();
  seedDemoData();

  // 화면에 남아 있는 입력도 처음대로
  inputText.value = '';
  demoSelect.value = '';
  errorText.textContent = '';
  sendMessage.textContent = '';
  document.querySelector('input[name="kind"][value="normal"]').checked = true;
  recipientList.querySelectorAll('input').forEach(function (box) { box.checked = true; });
  clearResult();
  resetDictForm();
  dictSearch.value = '';
  openInstructionId = null;
  workerSelect.value = workers[0].id;

  refreshAll();
  location.hash = '#write'; // 지시 작성 화면에서 시작
});

// 처음 열었을 때: 예시 데이터를 넣은 적이 없고 보낸 지시도 없으면 예시 3건을 넣음
// (이미 쓰던 데이터가 있으면 덮어쓰지 않음 → 처음 상태가 필요하면 [초기화])
if (!loadData(KEY_SEEDED, false) && loadData(KEY_SENT, []).length === 0) {
  seedDemoData();
}


// =====================================================
// 로그인 화면 (반장 / 근로자)
// =====================================================

const adminPin = document.getElementById('admin-pin');
const loginError = document.getElementById('login-error');
const workerLoginList = document.getElementById('worker-login-list');

// 근로자 이름 버튼 만들기 (글을 잘 못 읽어도 찾기 쉽게 국기 + 큰 이름)
workerLoginList.innerHTML = workers.map(function (w) {
  const lang = languages[w.lang];
  return (
    '<button type="button" class="worker-login-btn" data-worker="' + w.id + '">' +
      '<span class="worker-login-flag">' + lang.flag + '</span> ' + escapeHtml(w.name) +
      '<small>' + lang.native + '</small>' +
    '</button>'
  );
}).join('');

// 로그인 상태에 맞게 화면 꾸미기 (머리글의 이름, 반장 전용 버튼, 근로자 카드)
function applySession() {
  document.body.classList.toggle('role-admin', !!currentSession && currentSession.role === 'admin');
  document.body.classList.toggle('role-worker', !!currentSession && currentSession.role === 'worker');
  document.body.classList.toggle('logged-out', !currentSession);

  const userLabel = document.getElementById('user-label');
  const greeting = document.getElementById('card-greeting');

  if (currentSession && currentSession.role === 'worker') {
    const worker = workers.find(function (w) { return w.id === currentSession.workerId; });
    const lang = languages[worker.lang];
    userLabel.textContent = lang.flag + ' ' + worker.name;
    greeting.textContent = lang.flag + ' ' + worker.name;
    workerSelect.value = worker.id; // 카드 화면은 로그인한 근로자의 카드만
  } else if (currentSession && currentSession.role === 'admin') {
    userLabel.textContent = '👷 반장';
    greeting.textContent = '';
  } else {
    userLabel.textContent = '';
    greeting.textContent = '';
  }

  showScreen();
  refreshAll();
}

function loginAsAdmin() {
  if (adminPin.value.trim() !== ADMIN_PIN) {
    loginError.textContent = '비밀번호가 맞지 않아요.';
    adminPin.select();
    return;
  }
  loginError.textContent = '';
  adminPin.value = '';
  saveSession({ role: 'admin' });
  history.replaceState(null, '', '#write');
  applySession();
}

document.getElementById('admin-login-btn').addEventListener('click', loginAsAdmin);
adminPin.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') loginAsAdmin(); // 비밀번호 치고 Enter로도 들어가기
});

workerLoginList.addEventListener('click', function (event) {
  const button = event.target.closest('.worker-login-btn');
  if (!button) return;
  saveSession({ role: 'worker', workerId: button.dataset.worker });
  history.replaceState(null, '', '#card');
  applySession();
});

// 로그아웃: 이 탭의 로그인만 지움 (다른 탭의 로그인과 저장된 지시·응답은 그대로)
document.getElementById('logout-btn').addEventListener('click', function () {
  clearResult();               // 반장이 쓰던 변환 결과가 다음 사람에게 남지 않게
  inputText.value = '';
  demoSelect.value = '';
  sendMessage.textContent = '';
  errorText.textContent = '';
  openInstructionId = null;
  saveSession(null);
  history.replaceState(null, '', location.pathname);
  applySession();
});

applySession(); // 처음 화면 그리기 (로그인 안 했으면 로그인 화면)
