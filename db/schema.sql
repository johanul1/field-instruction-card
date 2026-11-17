-- =====================================================
-- 현장 지시 카드 — 데이터베이스 테이블 설계
-- 실행: psql "$DATABASE_URL" -f db/schema.sql
-- 앱의 data.js / localStorage 구조를 그대로 표로 옮긴 것
-- =====================================================

-- 근로자 명단
create table workers (
  id   text primary key,                          -- 예: w1
  name text not null,                             -- 예: 응우옌 반 안
  lang text not null check (lang in ('vi', 'ne', 'uz'))  -- 모국어
);

-- 현장 용어 사전
create table terms (
  word             text primary key,              -- 현장 용어 (예: 시마이)
  easy             text not null,                 -- 쉬운 한국어 (예: 마무리)
  not_followed_by  text[] not null default '{}'   -- 이 글자가 뒤에 오면 바꾸지 않음 (예: 신나게)
);

-- 시연용 지시 = 미리 번역해 둔 템플릿
create table instruction_templates (
  id            text primary key,                 -- 예: d1
  original      text not null,                    -- 반장이 평소 하는 말
  easy_ko       text not null,                    -- 다듬은 쉬운 한국어
  safety        boolean not null default false,   -- 안전 지시인지
  translations  jsonb not null                    -- {"vi": "...", "ne": "...", "uz": "..."}
);

-- 보낸 지시
create table instructions (
  id            text primary key,
  sent_at       timestamptz not null default now(),
  original      text not null,                    -- 반장이 쓴 원문
  rule_ko       text not null,                    -- 규칙으로 바꾼 쉬운 한국어
  easy_ko       text not null,                    -- 카드에 보여줄 쉬운 한국어
  safety        boolean not null default false,
  source        text not null check (source in ('template', 'ai')),
  template_id   text references instruction_templates (id),  -- AI 번역이면 비어 있음
  translations  jsonb not null                    -- 받는 사람 언어의 번역만
);

-- 근로자별 지시 카드와 응답
create table cards (
  id              text primary key,
  instruction_id  text not null references instructions (id) on delete cascade,
  worker_id       text not null references workers (id),
  lang            text not null,
  text            text not null,                  -- 모국어 번역 (크게 보여줌)
  easy_ko         text not null,                  -- 쉬운 한국어 (아래에)
  safety          boolean not null default false,
  sent_at         timestamptz not null,
  answer          text check (answer in ('understood', 'confused')),  -- 비어 있으면 미응답
  answered_at     timestamptz,
  unique (instruction_id, worker_id)              -- 한 지시에 한 사람당 카드 한 장
);

create index cards_worker_idx on cards (worker_id);

-- 행 단위 보안(RLS) 켜기: 정책을 따로 만들기 전까지는
-- Supabase의 공개 API(anon 키)로 읽거나 쓸 수 없음 → 안전한 기본값
alter table workers               enable row level security;
alter table terms                 enable row level security;
alter table instruction_templates enable row level security;
alter table instructions          enable row level security;
alter table cards                 enable row level security;
