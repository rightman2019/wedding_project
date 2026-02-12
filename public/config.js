// ここだけ編集すれば、全ページに反映されます（UTF-8）
window.WEDDING_SITE = {
  couple: {
    groom: "髙橋 右京",
    bride: "柏田 星南"
  },

  // 表示用（例: "2026.10.18"）
  dateLabel: "2026.02.28",
  dayLabel: "（土）",

  message: "当日は皆さまにお会いできることを楽しみにしております。",

  // 今回の式次第（挙式は親族のみ）
  event: {
    open: "16:15",
    start: "16:45",
    end: "19:00",
    note: "※挙式は親族のみで執り行います。予めご了承ください。"
  },

  venue: {
    name: "THE KAWABUN NAGOYA",
    address: "〒460-0002 愛知県名古屋市中区丸の内2丁目12-30",
    access: "アクセス詳細は公式サイトをご参照ください。",
    websiteUrl: "https://www.thekawabunnagoya.com/thekawabunnagoya/",
    mapUrl: "https://maps.app.goo.gl/qGjCkNe9DNKxLFZF6"
  },

  // 「招待状サイト」へのリンク（出欠回答・詳細はこちら）
  rsvp: {
    url: "https://ukyo-seina.weddingday.jp",
    deadlineLabel: "招待状サイトをご確認ください",
    note: "※詳細・出欠回答は招待状サイトをご確認ください。"
  },

  // 表示される場合があります（不要なら空文字でOK）
  dressCode: "インフォーマル〜セミフォーマル\n（ダークスーツ／ワンピース等）",
  gifts: "",

  // 連絡先（必要に応じて変更してください）
  contact: {
    name: "髙橋",
    email: "ukyotakahashi2019@gmail.com"
  },

  // フッターのコピーライト表記
  copyright: "Rightman",

  // 当日の大まかな流れ（必要に応じて追加してください）
  schedule: [
    { time: "16:15", title: "受付", note: "" },
    { time: "16:45", title: "開宴", note: "" },
    { time: "19:00", title: "終了（予定）", note: "" }
  ],

  faqs: [
    { q: "服装の指定はありますか？", a: "インフォーマル〜セミフォーマルを目安に、ダークスーツ／ワンピース等でお越しください。タキシード・和装などでも問題ありません。" },
    { q: "式の終了時刻は何時ですか？", a: "19:00 終了予定です。" },
    { q: "出欠回答は必要ですか？", a: "受付は終了しております。恐れ入りますが、出欠回答は不要です。" },
    { q: "挙式はありますか？", a: "挙式は親族のみで執り行います。予めご了承ください。" }
  ],

  // 席次表（/seating）
  // ※各卓の "seats" に名前を入れるだけで反映されます（最大8名）
  seating: {
    note: "※お席は係の者がご案内します。",
    headTableLabel: "高砂",

    // 上部のカテゴリ（ボタン）→ 押すと該当セクションへスクロール
    categories: [
      { id: "groom-lab", label: "新郎の研究室の友人", side: "groom", tables: ["A"] },
      { id: "bride-uni", label: "新婦の大学の友人", side: "bride", tables: ["B"] },
      { id: "bride-uni", label: "新婦の大学の友人", side: "bride", tables: ["D"] },
      { id: "groom-math", label: "新郎の高校の友人[理数科]", side: "groom", tables: ["C"] },
      { id: "groom-high", label: "新郎の高校の友人[普通科]", side: "groom", tables: ["X"] },
      { id: "groom-univ", label: "新郎の大学の友人", side: "groom", tables: ["X"] }
    ],

    // 卓データ（最大8名）。6名の卓なら6個だけでもOKです。
    tables: {
      A: { label: "TABLE A", seats: [
        "長屋 知里", 
        "大野 智生", 
        "大梅 倖輝", 
        "大野 結衣",
        "桑原 真一", 
        "櫻井 薫", 
        "野田 拓",        
        "五十川 祐一郎"
      ] },

      B: { label: "TABLE B", seats: [
        "西谷 志織", 
        "和久 茉厘那", 
        "大岡 左枝", 
        "大森 波奈", 
        "植松 佳保里", 
        "澁谷 美紀"
      ] },

      C: { label: "TABLE C", seats: [
        "舘 美里", 
        "渡邉 芙優果", 
        "永田	愛友実", 
        "中村	月泉", 
        "兒玉	真生子", 
        "福田 美友",
        "田島 佑菜",
        "矢ヶ崎 亜美"
      ] },

      D: { label: "TABLE D", seats: [
        "尾関 香織", 
        "金生 真綾", 
        "丸山明日香", 
        "濱汐音",
        "岡田 美都"
      ] },

      E: { label: "TABLE E", seats: [
        "寒川 由夏", 
        "田島らい華", 
        "木下 佳奈", 
        "高原 虎太郎", 
        "山下 斐央", 
        "坂上 夏海"
      ] },

      F: { label: "TABLE F", seats: [
        "渡部 修平", 
        "森田 健介", 
        "山田 真平", 
        "山田 泰地", 
        "清水 良広", 
        "酒井 拓実", 
        "下野 凌也", 
        "古川 博也"
      ] },

      X: { label: "TABLE X", seats: [
        "田端 亮", 
        "上田 裕己", 
        "三輪 圭司",
        "長澤 真輝",
        "安藤 春希",
        "落合 悠人",
        "濱中 康平", 
        "青柳 建志"
      ] }
      
    }
  }
};

// 互換性のため：links.tetris が無い場合だけデフォルトを補完（ユーザー入力は上書きしない）
(function(){
  try{
    const s = window.WEDDING_SITE = window.WEDDING_SITE || {};
    s.links = s.links || {};
    if (!s.links.tetris) s.links.tetris = "https://tetris-6r8.pages.dev/";
  }catch(e){}
})();
