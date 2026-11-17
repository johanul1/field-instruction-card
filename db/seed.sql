-- 자동 생성 파일: db/make-seed.js 가 public/data.js 로 만듦 (직접 고치지 말고 data.js 를 고친 뒤 다시 생성)
begin;

-- 근로자 8명
insert into workers (id, name, lang) values ('w1', '응우옌 반 안', 'vi');
insert into workers (id, name, lang) values ('w2', '쩐 티 마이', 'vi');
insert into workers (id, name, lang) values ('w3', '레 꽝 훙', 'vi');
insert into workers (id, name, lang) values ('w4', '람 바하두르', 'ne');
insert into workers (id, name, lang) values ('w5', '비샬 타파', 'ne');
insert into workers (id, name, lang) values ('w6', '수닐 라이', 'ne');
insert into workers (id, name, lang) values ('w7', '아지즈 카리모프', 'uz');
insert into workers (id, name, lang) values ('w8', '디요라 유수포바', 'uz');

-- 현장 용어 30개
insert into terms (word, easy, not_followed_by) values ('시마이', '마무리', '{}');
insert into terms (word, easy, not_followed_by) values ('단도리', '준비', '{}');
insert into terms (word, easy, not_followed_by) values ('나라시', '평평하게 다듬기', '{}');
insert into terms (word, easy, not_followed_by) values ('오사마리', '뒷정리', '{}');
insert into terms (word, easy, not_followed_by) values ('기리까이', '교체', '{}');
insert into terms (word, easy, not_followed_by) values ('빠꾸', '후진', '{}');
insert into terms (word, easy, not_followed_by) values ('기스', '흠집', '{}');
insert into terms (word, easy, not_followed_by) values ('빵꾸', '구멍', '{}');
insert into terms (word, easy, not_followed_by) values ('뻬빠', '사포', '{}');
insert into terms (word, easy, not_followed_by) values ('신나', '희석제', '{"게","서"}');
insert into terms (word, easy, not_followed_by) values ('기레빠시', '자투리', '{}');
insert into terms (word, easy, not_followed_by) values ('데나오시', '재작업', '{}');
insert into terms (word, easy, not_followed_by) values ('니빠', '니퍼', '{}');
insert into terms (word, easy, not_followed_by) values ('곰방', '짐 나르기', '{}');
insert into terms (word, easy, not_followed_by) values ('구루마', '손수레', '{}');
insert into terms (word, easy, not_followed_by) values ('빠레트', '팔레트', '{}');
insert into terms (word, easy, not_followed_by) values ('빠루', '쇠지렛대', '{}');
insert into terms (word, easy, not_followed_by) values ('반생', '철사', '{}');
insert into terms (word, easy, not_followed_by) values ('와꾸', '틀', '{}');
insert into terms (word, easy, not_followed_by) values ('우라', '뒷면', '{}');
insert into terms (word, easy, not_followed_by) values ('오모테', '앞면', '{}');
insert into terms (word, easy, not_followed_by) values ('이빠이', '가득', '{}');
insert into terms (word, easy, not_followed_by) values ('잔업', '연장 근무', '{}');
insert into terms (word, easy, not_followed_by) values ('데마찌', '대기', '{}');
insert into terms (word, easy, not_followed_by) values ('오야지', '반장님', '{}');
insert into terms (word, easy, not_followed_by) values ('함바', '구내식당', '{}');
insert into terms (word, easy, not_followed_by) values ('후앙', '환풍기', '{}');
insert into terms (word, easy, not_followed_by) values ('나라비', '줄 맞춰 놓기', '{}');
insert into terms (word, easy, not_followed_by) values ('다데', '세로', '{}');
insert into terms (word, easy, not_followed_by) values ('요꼬', '가로', '{}');

-- 시연용 지시(번역 템플릿) 10건
insert into instruction_templates (id, original, easy_ko, safety, translations) values ('d1', '프레스 기계 단도리 끝나기 전에 손 넣지 마.', '프레스 기계 준비가 끝나기 전에 손을 넣지 마세요.', true, '{"vi":"Không được đưa tay vào máy dập trước khi chuẩn bị xong.","ne":"प्रेस मेसिनको तयारी नसकिँदासम्म हात नछिराउनुहोस्।","uz":"Press mashinasi tayyor bo''lmaguncha qo''lingizni ichiga tiqmang."}'::jsonb);
insert into instruction_templates (id, original, easy_ko, safety, translations) values ('d2', '오늘 5시에 시마이하고 오사마리 해.', '오늘 5시에 작업을 마무리하고 뒷정리를 하세요.', false, '{"vi":"Hôm nay kết thúc công việc lúc 5 giờ rồi dọn dẹp chỗ làm.","ne":"आज ५ बजे काम सक्नुहोस् र त्यसपछि ठाउँ सफा गर्नुहोस्।","uz":"Bugun soat 5 da ishni tugating va keyin joyni yig''ishtiring."}'::jsonb);
insert into instruction_templates (id, original, easy_ko, safety, translations) values ('d3', '신나 쓸 때 후앙 꼭 틀어.', '희석제(신나)를 쓸 때는 환풍기를 꼭 켜세요.', true, '{"vi":"Khi dùng dung môi pha loãng (thinner), nhất định phải bật quạt thông gió.","ne":"थिनर प्रयोग गर्दा भेन्टिलेसन पंखा अनिवार्य रूपमा चलाउनुहोस्।","uz":"Erituvchi (tiner) ishlatganda ventilyatorni albatta yoqing."}'::jsonb);
insert into instruction_templates (id, original, easy_ko, safety, translations) values ('d4', '기스 난 제품은 빠레트 따로 빼놔.', '흠집 난 제품은 다른 팔레트에 따로 놓으세요.', false, '{"vi":"Sản phẩm bị trầy xước hãy để riêng trên một pallet khác.","ne":"खोस्रिएको सामानलाई छुट्टै प्यालेटमा राख्नुहोस्।","uz":"Tirnalgan mahsulotlarni alohida paletga qo''ying."}'::jsonb);
insert into instruction_templates (id, original, easy_ko, safety, translations) values ('d5', '지게차 빠꾸할 때 뒤에 서 있지 마.', '지게차가 후진할 때 뒤에 서 있지 마세요.', true, '{"vi":"Không được đứng phía sau khi xe nâng đang lùi.","ne":"फोर्कलिफ्ट पछाडि सर्दा त्यसको पछाडि नउभिनुहोस्।","uz":"Forklift orqaga yurayotganda uning orqasida turmang."}'::jsonb);
insert into instruction_templates (id, original, easy_ko, safety, translations) values ('d6', '라인 멈췄으니까 뻬빠로 와꾸 나라시 해.', '라인이 멈췄으니 사포로 틀을 평평하게 다듬으세요.', false, '{"vi":"Dây chuyền đã dừng, hãy dùng giấy nhám chà phẳng khuôn.","ne":"लाइन रोकिएको छ, स्यान्डपेपरले फ्रेमलाई समतल पार्नुहोस्।","uz":"Liniya to''xtadi, jilvir qog''oz bilan qolipni tekislang."}'::jsonb);
insert into instruction_templates (id, original, easy_ko, safety, translations) values ('d7', '잔업 있으니까 함바 가서 밥 먹고 와.', '연장 근무가 있으니 구내식당에서 밥을 먹고 오세요.', false, '{"vi":"Hôm nay có làm thêm giờ, hãy ăn cơm ở nhà ăn công ty rồi quay lại.","ne":"आज ओभरटाइम छ, क्यान्टिनमा खाना खाएर आउनुहोस्।","uz":"Qo''shimcha ish bor, oshxonada ovqatlanib keling."}'::jsonb);
insert into instruction_templates (id, original, easy_ko, safety, translations) values ('d8', '빠루 쓸 때 장갑 끼고, 반생 기레빠시 바닥에 버리지 마.', '쇠지렛대를 쓸 때는 장갑을 끼고, 철사 자투리를 바닥에 버리지 마세요.', true, '{"vi":"Khi dùng xà beng phải đeo găng tay, và không được vứt mẩu dây thép thừa xuống sàn.","ne":"क्रोबार प्रयोग गर्दा पन्जा लगाउनुहोस्, र तारका टुक्राहरू भुइँमा नफाल्नुहोस्।","uz":"Lom ishlatganda qo''lqop kiying va sim qoldiqlarini yerga tashlamang."}'::jsonb);
insert into instruction_templates (id, original, easy_ko, safety, translations) values ('d9', '불량 나온 거 데나오시하고 우라 오모테 다 확인해.', '불량품은 다시 작업하고 앞면과 뒷면을 모두 확인하세요.', false, '{"vi":"Hãy làm lại sản phẩm lỗi và kiểm tra cả mặt trước lẫn mặt sau.","ne":"खराब सामान फेरि बनाउनुहोस् र अगाडि र पछाडि दुवै भाग जाँच गर्नुहोस्।","uz":"Nuqsonli mahsulotni qayta ishlang va old hamda orqa tomonini tekshiring."}'::jsonb);
insert into instruction_templates (id, original, easy_ko, safety, translations) values ('d10', '칼날 기리까이할 때 전원 꼭 내리고 해.', '칼날을 교체할 때는 반드시 전원을 끄세요.', true, '{"vi":"Khi thay lưỡi dao, nhất định phải tắt nguồn điện.","ne":"ब्लेड फेर्दा अनिवार्य रूपमा बिजुली बन्द गर्नुहोस्।","uz":"Pichoqni almashtirganda albatta tokni o''chiring."}'::jsonb);

commit;
