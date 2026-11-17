// =====================================================
// supabase-translate.ts — AI 번역 "중계" 함수 (Supabase Edge Function)
//
// ※ 이 파일은 웹앱(index.html)이 읽지 않습니다.
//   Supabase 대시보드 > Edge Functions 에 그대로 붙여넣어 배포하는 용도입니다.
//
// 하는 일: 브라우저 → (이 함수) → Claude API → (이 함수) → 브라우저
// API 키는 이 파일에 적지 않습니다. Supabase Secrets 에 넣은
// ANTHROPIC_API_KEY 를 서버 안에서만 읽으므로 브라우저에는 절대 보이지 않습니다.
// =====================================================

import Anthropic from "npm:@anthropic-ai/sdk";

// 이 주소에서 연 웹앱만 이 함수를 쓸 수 있음 (VS Code Live Server 기본 주소)
// 나중에 웹앱을 다른 주소에 올리면 그 주소를 여기에 추가하세요.
const ALLOWED_ORIGINS = ["http://127.0.0.1:5500", "http://localhost:5500"];

// 번역할 수 있는 언어 (웹앱 data.js 의 언어 코드와 같아야 함)
const LANG_NAMES: Record<string, string> = {
  vi: "Vietnamese",
  ne: "Nepali",
  uz: "Uzbek (Latin script)",
};

const MAX_TEXT_LENGTH = 300; // 지시 한 건의 최대 글자 수 (너무 긴 요청으로 비용이 새지 않게)

const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });

// AI에게 주는 역할과 규칙
const SYSTEM_PROMPT = `당신은 한국 제조 공장의 작업 지시를 외국인 근로자가 이해할 수 있게 옮기는 도우미입니다.
받는 사람은 베트남·네팔·우즈베키스탄 출신 근로자로, 한국어와 긴 글 읽기에 익숙하지 않을 수 있습니다.
반장은 근로자의 모국어를 읽지 못하므로, 당신의 결과를 "한국어 되옮김"으로 확인한 뒤 보냅니다.

할 일:
1. easyKo: 원문을 쉬운 한국어 한두 문장으로 다듬습니다. 짧은 문장, "~하세요" 존댓말, 현장 은어나 일본어식 용어 없이 씁니다.
2. translations.<언어>.text: easyKo 를 그 언어로 번역합니다. 단어를 하나씩 옮기기보다, 공장 현장에서 쓰는 쉬운 일상어로 뜻이 정확히 전달되게 씁니다.
3. translations.<언어>.backKo: 방금 쓴 번역문을 다시 한국어로 그대로(직역으로) 옮깁니다. 반장이 번역이 맞는지 확인하는 용도이므로 매끄럽게 고치지 말고 번역문에 실제로 적힌 뜻을 씁니다.
4. looksSafety: 지시가 부상·사고·기계·전기·화학물질·보호구 등 안전과 관련 있으면 true, 아니면 false.
5. notes: 원문이 애매해서 뜻을 추측했거나 확신이 낮은 부분이 있으면 반장에게 한국어로 짧게 알려 줍니다. 없으면 빈 문자열.

반드시 지킬 것:
- 원문에 없는 내용을 더하거나 원문 내용을 빼지 않습니다.
- 금지("~하지 마")와 허용("~해도 돼")을 절대 뒤바꾸지 않습니다.
- 숫자, 시간, 수량, 기계·장비 이름은 그대로 둡니다.
- "바뀐 단어"로 주어진 현장 용어 풀이를 따릅니다.
- 원문이 작업 지시가 아닌 것 같으면 그대로 옮기되 notes 에 그 사실을 적습니다.`;

// 브라우저가 다른 주소(Live Server)에서 이 함수를 부를 수 있게 허용하는 헤더
function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Vary": "Origin",
  };
}

function reply(origin: string, status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json; charset=utf-8" },
  });
}

// AI 답의 모양: 받는 사람 언어만 번역하도록 요청마다 만듦
function buildSchema(langs: string[]) {
  const translationProps: Record<string, unknown> = {};
  for (const lang of langs) {
    translationProps[lang] = {
      type: "object",
      properties: { text: { type: "string" }, backKo: { type: "string" } },
      required: ["text", "backKo"],
      additionalProperties: false,
    };
  }
  return {
    type: "object",
    properties: {
      easyKo: { type: "string" },
      looksSafety: { type: "boolean" },
      translations: {
        type: "object",
        properties: translationProps,
        required: langs,
        additionalProperties: false,
      },
      notes: { type: "string" },
    },
    required: ["easyKo", "looksSafety", "translations", "notes"],
    additionalProperties: false,
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin") || "";

  // 브라우저의 사전 확인 요청 (CORS)
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(origin) });
  if (req.method !== "POST") return reply(origin, 405, { error: "POST 요청만 받아요." });
  if (!ALLOWED_ORIGINS.includes(origin)) {
    return reply(origin, 403, { error: "허용되지 않은 주소에서 온 요청이에요." });
  }

  // ----- 들어온 값 검사 (규칙) -----
  let input;
  try {
    input = await req.json();
  } catch {
    return reply(origin, 400, { error: "요청 형식이 잘못됐어요." });
  }
  // JSON이어도 null·숫자·배열이면 아래에서 input.original 을 읽다가 멈추므로 먼저 막음
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return reply(origin, 400, { error: "요청 형식이 잘못됐어요." });
  }

  const original = typeof input.original === "string" ? input.original.trim() : "";
  const ruleKo = typeof input.ruleKo === "string" ? input.ruleKo.trim() : original;
  const safety = input.safety === true;
  const langs = Array.isArray(input.langs)
    ? [...new Set(input.langs.filter((l: unknown) => typeof l === "string" && l in LANG_NAMES))] as string[]
    : [];
  const changes = Array.isArray(input.changes)
    ? input.changes
        .filter((c: { from?: unknown; to?: unknown }) => typeof c?.from === "string" && typeof c?.to === "string")
        .slice(0, 30)
    : [];

  if (!original) return reply(origin, 400, { error: "지시 내용이 비어 있어요." });
  if (original.length > MAX_TEXT_LENGTH || ruleKo.length > MAX_TEXT_LENGTH) {
    return reply(origin, 400, { error: `지시는 ${MAX_TEXT_LENGTH}자 이하로 써 주세요.` });
  }
  if (langs.length === 0) return reply(origin, 400, { error: "번역할 언어가 없어요." });

  const userText = [
    `원문: ${original}`,
    `규칙으로 바꾼 쉬운 한국어: ${ruleKo}`,
    `바뀐 단어: ${changes.length ? changes.map((c: { from: string; to: string }) => `${c.from} → ${c.to}`).join(", ") : "없음"}`,
    `반장이 고른 지시 종류: ${safety ? "안전 지시" : "일반 지시"}`,
    `번역할 언어: ${langs.map((l) => `${l} (${LANG_NAMES[l]})`).join(", ")}`,
  ].join("\n");

  // ----- Claude 호출 -----
  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 4000, // 짧은 지시 번역이라 충분. 비용 상한 역할도 함
      // 안전 분류기가 요청을 거절하면 Anthropic이 권장하는 다른 모델로 자동 재시도
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: buildSchema(langs) }, // 정해진 JSON 모양으로만 답하게
      },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userText }],
    });

    if (response.stop_reason === "refusal") {
      return reply(origin, 422, { error: "AI가 이 지시를 처리하지 않았어요. 직접 설명해 주세요." });
    }
    if (response.stop_reason === "max_tokens") {
      return reply(origin, 502, { error: "AI 답이 중간에 끊겼어요. 지시를 짧게 나눠 주세요." });
    }

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return reply(origin, 502, { error: "AI 답이 비어 있어요." });
    }
    return reply(origin, 200, JSON.parse(textBlock.text));
  } catch (error) {
    // 자세한 오류는 Supabase 로그에만 남기고, 브라우저에는 짧은 안내만 보냄
    console.error(error);
    if (error instanceof Anthropic.AuthenticationError) {
      return reply(origin, 500, { error: "서버의 API 키 설정을 확인해 주세요." });
    }
    if (error instanceof Anthropic.RateLimitError) {
      return reply(origin, 429, { error: "AI 요청이 많아요. 잠시 뒤 다시 눌러 주세요." });
    }
    if (error instanceof Anthropic.APIError) {
      return reply(origin, 502, { error: `AI 서버 오류예요 (${error.status}). 잠시 뒤 다시 해 주세요.` });
    }
    if (error instanceof SyntaxError) {
      return reply(origin, 502, { error: "AI 답을 읽지 못했어요. 다시 눌러 주세요." });
    }
    return reply(origin, 500, { error: "알 수 없는 오류가 났어요." });
  }
});
