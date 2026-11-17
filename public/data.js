// =====================================================
// data.js — 바뀌지 않는 데이터만 모아두는 파일
// 용어나 번역을 고칠 때는 이 파일만 열면 됩니다.
// =====================================================

// ----- 언어 정보 -----
// safetyLabel: 안전 지시 카드 맨 위에 붙는 경고 문구 (근로자 모국어)
// understood / confused: 근로자 카드의 [이해했어요] [모르겠어요] 버튼 모국어 문구
const languages = {
  vi: {
    name: '베트남어', native: 'Tiếng Việt', flag: '🇻🇳',
    safetyLabel: '⚠️ AN TOÀN – Bắt buộc tuân thủ',
    understood: 'Tôi hiểu', confused: 'Tôi không hiểu',
  },
  ne: {
    name: '네팔어', native: 'नेपाली', flag: '🇳🇵',
    safetyLabel: '⚠️ सुरक्षा – अनिवार्य पालना गर्नुहोस्',
    understood: 'बुझेँ', confused: 'बुझिनँ',
  },
  uz: {
    name: '우즈베크어', native: "O'zbekcha", flag: '🇺🇿',
    safetyLabel: '⚠️ XAVFSIZLIK – albatta bajaring',
    understood: 'Tushundim', confused: 'Tushunmadim',
  },
};

// ----- 현장 용어 사전 (30개) -----
// word: 현장에서 쓰는 말 / easy: 쉬운 한국어
// notFollowedBy: 이 글자가 바로 뒤에 오면 바꾸지 않음 (예: "신나게"는 희석제가 아님)
const terms = [
  { word: '시마이',   easy: '마무리' },
  { word: '단도리',   easy: '준비' },
  { word: '나라시',   easy: '평평하게 다듬기' },
  { word: '오사마리', easy: '뒷정리' },
  { word: '기리까이', easy: '교체' },
  { word: '빠꾸',     easy: '후진' },
  { word: '기스',     easy: '흠집' },
  { word: '빵꾸',     easy: '구멍' },
  { word: '뻬빠',     easy: '사포' },
  { word: '신나',     easy: '희석제', notFollowedBy: ['게', '서'] },
  { word: '기레빠시', easy: '자투리' },
  { word: '데나오시', easy: '재작업' },
  { word: '니빠',     easy: '니퍼' },
  { word: '곰방',     easy: '짐 나르기' },
  { word: '구루마',   easy: '손수레' },
  { word: '빠레트',   easy: '팔레트' },
  { word: '빠루',     easy: '쇠지렛대' },
  { word: '반생',     easy: '철사' },
  { word: '와꾸',     easy: '틀' },
  { word: '우라',     easy: '뒷면' },
  { word: '오모테',   easy: '앞면' },
  { word: '이빠이',   easy: '가득' },
  { word: '잔업',     easy: '연장 근무' },
  { word: '데마찌',   easy: '대기' },
  { word: '오야지',   easy: '반장님' },
  { word: '함바',     easy: '구내식당' },
  { word: '후앙',     easy: '환풍기' },
  { word: '나라비',   easy: '줄 맞춰 놓기' },
  { word: '다데',     easy: '세로' },
  { word: '요꼬',     easy: '가로' },
];

// ----- 반장(관리자) 로그인 비밀번호 -----
// ※ 시연용입니다. 이 파일은 누구나 브라우저에서 열어 볼 수 있으므로 진짜 비밀번호를 쓰지 마세요.
const ADMIN_PIN = '1234';

// ----- 가상 근로자 명단 (8명) -----
const workers = [
  { id: 'w1', name: '응우옌 반 안', lang: 'vi' },
  { id: 'w2', name: '쩐 티 마이',   lang: 'vi' },
  { id: 'w3', name: '레 꽝 훙',     lang: 'vi' },
  { id: 'w4', name: '람 바하두르',  lang: 'ne' },
  { id: 'w5', name: '비샬 타파',    lang: 'ne' },
  { id: 'w6', name: '수닐 라이',    lang: 'ne' },
  { id: 'w7', name: '아지즈 카리모프', lang: 'uz' },
  { id: 'w8', name: '디요라 유수포바', lang: 'uz' },
];

// ----- 발표 시연용 예시 지시 3건 -----
// 처음 열거나 [초기화]를 누르면 '이미 보낸 지시'로 들어가 있음 (8명 모두에게 보낸 것으로)
// templateId: 아래 시연용 지시 중 어느 것인지 / minutesAgo: 몇 분 전에 보냈는지
// answers: 근로자별 응답 ('understood' 이해했어요 / 'confused' 모르겠어요 / 없으면 미응답)
const demoSeed = [
  {
    templateId: 'd2', minutesAgo: 95,   // 일반: 5시 마무리 → 거의 다 이해
    answers: { w1: 'understood', w2: 'understood', w3: 'understood', w4: 'understood',
               w5: 'understood', w6: 'understood', w7: 'understood' },
  },
  {
    templateId: 'd5', minutesAgo: 50,   // 안전: 지게차 후진 → 2명이 모르겠음 (확인판에서 빨갛게)
    answers: { w1: 'understood', w2: 'understood', w4: 'confused', w5: 'understood',
               w7: 'understood', w8: 'confused' },
  },
  {
    templateId: 'd3', minutesAgo: 10,   // 안전: 신나·환풍기 → 방금 보내서 아직 응답 중
    answers: { w1: 'understood', w4: 'understood' },
  },
];

// ----- 시연용 지시 10건 = 번역 템플릿 -----
// original: 반장이 평소 하는 말 / easyKo: 다듬은 쉬운 한국어
// safety: 안전 지시면 true / translations: 미리 번역해 둔 문장
const demoInstructions = [
  {
    id: 'd1', safety: true,
    original: '프레스 기계 단도리 끝나기 전에 손 넣지 마.',
    easyKo: '프레스 기계 준비가 끝나기 전에 손을 넣지 마세요.',
    translations: {
      vi: 'Không được đưa tay vào máy dập trước khi chuẩn bị xong.',
      ne: 'प्रेस मेसिनको तयारी नसकिँदासम्म हात नछिराउनुहोस्।',
      uz: "Press mashinasi tayyor bo'lmaguncha qo'lingizni ichiga tiqmang.",
    },
  },
  {
    id: 'd2', safety: false,
    original: '오늘 5시에 시마이하고 오사마리 해.',
    easyKo: '오늘 5시에 작업을 마무리하고 뒷정리를 하세요.',
    translations: {
      vi: 'Hôm nay kết thúc công việc lúc 5 giờ rồi dọn dẹp chỗ làm.',
      ne: 'आज ५ बजे काम सक्नुहोस् र त्यसपछि ठाउँ सफा गर्नुहोस्।',
      uz: "Bugun soat 5 da ishni tugating va keyin joyni yig'ishtiring.",
    },
  },
  {
    id: 'd3', safety: true,
    original: '신나 쓸 때 후앙 꼭 틀어.',
    easyKo: '희석제(신나)를 쓸 때는 환풍기를 꼭 켜세요.',
    translations: {
      vi: 'Khi dùng dung môi pha loãng (thinner), nhất định phải bật quạt thông gió.',
      ne: 'थिनर प्रयोग गर्दा भेन्टिलेसन पंखा अनिवार्य रूपमा चलाउनुहोस्।',
      uz: 'Erituvchi (tiner) ishlatganda ventilyatorni albatta yoqing.',
    },
  },
  {
    id: 'd4', safety: false,
    original: '기스 난 제품은 빠레트 따로 빼놔.',
    easyKo: '흠집 난 제품은 다른 팔레트에 따로 놓으세요.',
    translations: {
      vi: 'Sản phẩm bị trầy xước hãy để riêng trên một pallet khác.',
      ne: 'खोस्रिएको सामानलाई छुट्टै प्यालेटमा राख्नुहोस्।',
      uz: "Tirnalgan mahsulotlarni alohida paletga qo'ying.",
    },
  },
  {
    id: 'd5', safety: true,
    original: '지게차 빠꾸할 때 뒤에 서 있지 마.',
    easyKo: '지게차가 후진할 때 뒤에 서 있지 마세요.',
    translations: {
      vi: 'Không được đứng phía sau khi xe nâng đang lùi.',
      ne: 'फोर्कलिफ्ट पछाडि सर्दा त्यसको पछाडि नउभिनुहोस्।',
      uz: 'Forklift orqaga yurayotganda uning orqasida turmang.',
    },
  },
  {
    id: 'd6', safety: false,
    original: '라인 멈췄으니까 뻬빠로 와꾸 나라시 해.',
    easyKo: '라인이 멈췄으니 사포로 틀을 평평하게 다듬으세요.',
    translations: {
      vi: 'Dây chuyền đã dừng, hãy dùng giấy nhám chà phẳng khuôn.',
      ne: 'लाइन रोकिएको छ, स्यान्डपेपरले फ्रेमलाई समतल पार्नुहोस्।',
      uz: "Liniya to'xtadi, jilvir qog'oz bilan qolipni tekislang.",
    },
  },
  {
    id: 'd7', safety: false,
    original: '잔업 있으니까 함바 가서 밥 먹고 와.',
    easyKo: '연장 근무가 있으니 구내식당에서 밥을 먹고 오세요.',
    translations: {
      vi: 'Hôm nay có làm thêm giờ, hãy ăn cơm ở nhà ăn công ty rồi quay lại.',
      ne: 'आज ओभरटाइम छ, क्यान्टिनमा खाना खाएर आउनुहोस्।',
      uz: "Qo'shimcha ish bor, oshxonada ovqatlanib keling.",
    },
  },
  {
    id: 'd8', safety: true,
    original: '빠루 쓸 때 장갑 끼고, 반생 기레빠시 바닥에 버리지 마.',
    easyKo: '쇠지렛대를 쓸 때는 장갑을 끼고, 철사 자투리를 바닥에 버리지 마세요.',
    translations: {
      vi: 'Khi dùng xà beng phải đeo găng tay, và không được vứt mẩu dây thép thừa xuống sàn.',
      ne: 'क्रोबार प्रयोग गर्दा पन्जा लगाउनुहोस्, र तारका टुक्राहरू भुइँमा नफाल्नुहोस्।',
      uz: "Lom ishlatganda qo'lqop kiying va sim qoldiqlarini yerga tashlamang.",
    },
  },
  {
    id: 'd9', safety: false,
    original: '불량 나온 거 데나오시하고 우라 오모테 다 확인해.',
    easyKo: '불량품은 다시 작업하고 앞면과 뒷면을 모두 확인하세요.',
    translations: {
      vi: 'Hãy làm lại sản phẩm lỗi và kiểm tra cả mặt trước lẫn mặt sau.',
      ne: 'खराब सामान फेरि बनाउनुहोस् र अगाडि र पछाडि दुवै भाग जाँच गर्नुहोस्।',
      uz: "Nuqsonli mahsulotni qayta ishlang va old hamda orqa tomonini tekshiring.",
    },
  },
  {
    id: 'd10', safety: true,
    original: '칼날 기리까이할 때 전원 꼭 내리고 해.',
    easyKo: '칼날을 교체할 때는 반드시 전원을 끄세요.',
    translations: {
      vi: 'Khi thay lưỡi dao, nhất định phải tắt nguồn điện.',
      ne: 'ब्लेड फेर्दा अनिवार्य रूपमा बिजुली बन्द गर्नुहोस्।',
      uz: "Pichoqni almashtirganda albatta tokni o'chiring.",
    },
  },
];
