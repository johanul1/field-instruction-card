// =====================================================
// make-seed.js — public/data.js 의 데이터로 db/seed.sql 을 만듦
// 실행: node db/make-seed.js
// data.js 를 고친 뒤 다시 실행하면 seed.sql 도 새로 만들어짐
// =====================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// data.js 를 읽어 그 안의 const 값들(workers, terms, demoInstructions)을 꺼냄
const dataFile = path.join(__dirname, '..', 'public', 'data.js');
const code = fs.readFileSync(dataFile, 'utf8') + '\n;({ workers, terms, demoInstructions });';
const { workers, terms, demoInstructions } = vm.runInNewContext(code);

// SQL 글자 값: 작은따옴표는 두 번 써야 함 (it's → 'it''s')
const str = (v) => "'" + String(v).replace(/'/g, "''") + "'";
const arr = (list) => "'{" + (list || []).map((s) => '"' + s.replace(/["\\]/g, '\\$&') + '"').join(',') + "}'";
const json = (obj) => str(JSON.stringify(obj)) + '::jsonb';

const lines = [];
lines.push('-- 자동 생성 파일: db/make-seed.js 가 public/data.js 로 만듦 (직접 고치지 말고 data.js 를 고친 뒤 다시 생성)');
lines.push('begin;');
lines.push('');

lines.push('-- 근로자 ' + workers.length + '명');
workers.forEach((w) => {
  lines.push(`insert into workers (id, name, lang) values (${str(w.id)}, ${str(w.name)}, ${str(w.lang)});`);
});
lines.push('');

lines.push('-- 현장 용어 ' + terms.length + '개');
terms.forEach((t) => {
  lines.push(`insert into terms (word, easy, not_followed_by) values (${str(t.word)}, ${str(t.easy)}, ${arr(t.notFollowedBy)});`);
});
lines.push('');

lines.push('-- 시연용 지시(번역 템플릿) ' + demoInstructions.length + '건');
demoInstructions.forEach((d) => {
  lines.push(
    `insert into instruction_templates (id, original, easy_ko, safety, translations) values (` +
    `${str(d.id)}, ${str(d.original)}, ${str(d.easyKo)}, ${d.safety ? 'true' : 'false'}, ${json(d.translations)});`
  );
});
lines.push('');
lines.push('commit;');

const outFile = path.join(__dirname, 'seed.sql');
fs.writeFileSync(outFile, lines.join('\n') + '\n');
console.log(`seed.sql 생성: 근로자 ${workers.length}, 용어 ${terms.length}, 템플릿 ${demoInstructions.length}`);
