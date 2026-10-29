/**
 * One-shot expander: craft stages.json uiCopy/lines/titles + oct-daily-quiz 15-lang fields.
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const LANGS = [
  "en",
  "ko",
  "zh-Hans",
  "ja",
  "es",
  "hi",
  "de",
  "vi",
  "pt-BR",
  "id",
  "fr",
  "ar",
  "tr",
  "it",
  "pl",
];

/** @type {Record<string, Record<string, string>>} */
const QUIZ_Q = {
  q1: {
    en: "What culture / holiday are we learning about today?",
    ko: "오늘 배우는 문화/기념일은 무엇인가요?",
    "zh-Hans": "今天我们要学习什么文化/节日？",
    ja: "今日学ぶ文化・祝日は何ですか？",
    es: "¿Qué cultura o festividad aprendemos hoy?",
    hi: "आज हम किस संस्कृति/त्योहार के बारे में सीख रहे हैं?",
    de: "Welche Kultur bzw. welchen Feiertag lernen wir heute?",
    vi: "Hôm nay chúng ta học về văn hóa / ngày lễ nào?",
    "pt-BR": "Qual cultura ou feriado estamos aprendendo hoje?",
    id: "Budaya / hari raya apa yang kita pelajari hari ini?",
    fr: "Quelle culture ou fête apprenons-nous aujourd’hui ?",
    ar: "ما الثقافة أو العيد الذي نتعلمه اليوم؟",
    tr: "Bugün hangi kültürü / bayramı öğreniyoruz?",
    it: "Quale cultura o festa stiamo imparando oggi?",
    pl: "Jakiej kultury lub święta uczymy się dziś?",
  },
  q2: {
    en: "What date is Halloween?",
    ko: "할로윈은 몇 월 며칠인가요?",
    "zh-Hans": "万圣节是哪一天？",
    ja: "ハロウィンはいつですか？",
    es: "¿Qué fecha es Halloween?",
    hi: "हैलोवीन किस तारीख को है?",
    de: "Welches Datum hat Halloween?",
    vi: "Halloween vào ngày nào?",
    "pt-BR": "Qual é a data do Halloween?",
    id: "Tanggal berapa Halloween?",
    fr: "Quelle est la date d’Halloween ?",
    ar: "في أي تاريخ يكون الهالوين؟",
    tr: "Cadılar Bayramı hangi tarihte?",
    it: "Qual è la data di Halloween?",
    pl: "Którego jest Halloween?",
  },
  q3: {
    en: "What do kids say on Halloween when they knock on doors?",
    ko: "할로윈에 아이들이 문을 두드리며 뭐라고 하나요?",
    "zh-Hans": "万圣节孩子们敲门时会说什么？",
    ja: "ハロウィンに子どもがドアをノックするとき何と言いますか？",
    es: "¿Qué dicen los niños cuando tocan a la puerta en Halloween?",
    hi: "हैलोवीन पर बच्चे दरवाजा खटखटाने पर क्या कहते हैं?",
    de: "Was sagen Kinder an Halloween, wenn sie anklopfen?",
    vi: "Trẻ em nói gì khi gõ cửa vào Halloween?",
    "pt-BR": "O que as crianças dizem ao bater na porta no Halloween?",
    id: "Apa kata anak-anak saat mengetuk pintu di Halloween?",
    fr: "Que disent les enfants quand ils frappent à la porte à Halloween ?",
    ar: "ماذا يقول الأطفال عندما يطرقون الباب في الهالوين؟",
    tr: "Cadılar Bayramı’nda kapıyı çaldıklarında çocuklar ne der?",
    it: "Cosa dicono i bambini quando bussano a Halloween?",
    pl: "Co mówią dzieci, pukając do drzwi w Halloween?",
  },
  q4: {
    en: "What vegetable do kids carve for Halloween?",
    ko: "할로윈에 아이들이 조각하는 채소는?",
    "zh-Hans": "万圣节孩子们雕刻什么蔬菜？",
    ja: "ハロウィンに子どもが彫る野菜は何ですか？",
    es: "¿Qué verdura tallan los niños para Halloween?",
    hi: "हैलोवीन के लिए बच्चे कौन सी सब्ज़ी तराशते हैं?",
    de: "Welches Gemüse schnitzen Kinder zu Halloween?",
    vi: "Trẻ em khắc loại rau củ nào cho Halloween?",
    "pt-BR": "Qual vegetal as crianças esculpem no Halloween?",
    id: "Sayuran apa yang diukir anak-anak untuk Halloween?",
    fr: "Quel légume les enfants sculptent-ils pour Halloween ?",
    ar: "ما الخضار الذي ينحته الأطفال للهالوين؟",
    tr: "Cadılar Bayramı için çocuklar hangi sebgeyi oyuyor?",
    it: "Quale verdura scolpiscono i bambini per Halloween?",
    pl: "Jakie warzywo dzieci rzeźbią na Halloween?",
  },
  q5: {
    en: "What are two classic Halloween colors?",
    ko: "할로윈의 대표 색깔 두 가지는?",
    "zh-Hans": "万圣节两种经典颜色是什么？",
    ja: "ハロウィンの代表的な2色は何ですか？",
    es: "¿Cuáles son dos colores clásicos de Halloween?",
    hi: "हैलोवीन के दो क्लासिक रंग कौन से हैं?",
    de: "Welche zwei klassischen Halloween-Farben gibt es?",
    vi: "Hai màu kinh điển của Halloween là gì?",
    "pt-BR": "Quais são duas cores clássicas do Halloween?",
    id: "Apa dua warna klasik Halloween?",
    fr: "Quelles sont deux couleurs classiques d’Halloween ?",
    ar: "ما لونا الهالوين الكلاسيكيان؟",
    tr: "Cadılar Bayramının iki klasik rengi nedir?",
    it: "Quali sono due colori classici di Halloween?",
    pl: "Jakie są dwa klasyczne kolory Halloween?",
  },
};

const EXPLAIN_MAPS = {
  q1: {
    en: "This month's theme is Halloween.",
    ko: "이번 달 주제는 할로윈입니다.",
    "zh-Hans": "本月的主题是万圣节。",
    ja: "今月のテーマはハロウィンです。",
    es: "El tema de este mes es Halloween.",
    de: "Das Monatsthema ist Halloween.",
    fr: "Le thème de ce mois est Halloween.",
    it: "Il tema di questo mese è Halloween.",
    pl: "Motywem tego miesiąca jest Halloween.",
    vi: "Chủ đề tháng này là Halloween.",
    "pt-BR": "O tema deste mês é Halloween.",
    id: "Tema bulan ini adalah Halloween.",
    hi: "इस महीने का विषय हैलोवीन है।",
    ar: "موضوع هذا الشهر هو الهالوين.",
    tr: "Bu ayın konusu Cadılar Bayramı.",
  },
  q2: {
    en: "Halloween is October 31 — the day before November 1st.",
    ko: "할로윈은 10월 31일, 즉 11월 1일 전날입니다.",
    "zh-Hans": "万圣节是10月31日，即11月1日的前一天。",
    ja: "ハロウィンは10月31日、11月1日の前日です。",
    es: "Halloween es el 31 de octubre, el día antes del 1 de noviembre.",
    de: "Halloween ist der 31. Oktober — der Tag vor dem 1. November.",
    fr: "Halloween, c’est le 31 octobre — la veille du 1er novembre.",
    it: "Halloween è il 31 ottobre — il giorno prima del 1° novembre.",
    pl: "Halloween to 31 października — dzień przed 1 listopada.",
    vi: "Halloween là ngày 31 tháng 10 — ngày trước 1 tháng 11.",
    "pt-BR": "Halloween é 31 de outubro — o dia antes de 1º de novembro.",
    id: "Halloween jatuh pada 31 Oktober — sehari sebelum 1 November.",
    hi: "हैलोवीन 31 अक्टूबर को है — 1 नवंबर से एक दिन पहले।",
    ar: "الهالوين في 31 أكتوبر — اليوم السابق لـ 1 نوفمبر.",
    tr: "Cadılar Bayramı 31 Ekim’dir — 1 Kasım’dan bir gün önce.",
  },
  q3: {
    en: "Kids say “Trick or treat!” to ask for candy.",
    ko: "아이들은 사탕을 받으려고 “Trick or treat!”라고 합니다.",
    "zh-Hans": "孩子们说“Trick or treat!”来要糖果。",
    ja: "子どもは「Trick or treat!」と言ってお菓子をもらいます。",
    es: "Los niños dicen «Trick or treat!» para pedir dulces.",
    de: "Kinder sagen „Trick or treat!“, um Süßigkeiten zu bekommen.",
    fr: "Les enfants disent « Trick or treat ! » pour demander des bonbons.",
    it: "I bambini dicono « Trick or treat! » per chiedere dolci.",
    pl: "Dzieci mówią „Trick or treat!”, by dostać cukierki.",
    vi: "Trẻ em nói “Trick or treat!” để xin kẹo.",
    "pt-BR": "As crianças dizem “Trick or treat!” para pedir doces.",
    id: "Anak-anak berkata “Trick or treat!” untuk minta permen.",
    hi: "बच्चे मिठाई माँगने के लिए “Trick or treat!” कहते हैं।",
    ar: "يقول الأطفال «Trick or treat!» لطلب الحلوى.",
    tr: "Çocuklar şeker istemek için “Trick or treat!” der.",
  },
  q4: {
    en: "Kids carve pumpkins into jack-o’-lanterns to scare ghosts.",
    ko: "아이들은 유령을 겁주려고 호박을 잭오랜턴으로 조각합니다.",
    "zh-Hans": "孩子们把南瓜刻成杰克灯来吓鬼。",
    ja: "子どもは幽霊を怖がらせるためにかぼちゃをジャック・オ・ランタンに彫ります。",
    es: "Los niños tallan calabazas en linternas de Jack para asustar fantasmas.",
    de: "Kinder schnitzen Kürbisse zu Jack-o’-lanterns, um Geister zu erschrecken.",
    fr: "Les enfants sculptent des citrouilles en lanternes pour effrayer les fantômes.",
    it: "I bambini scolpiscono zucche a jack-o’-lantern per spaventare i fantasmi.",
    pl: "Dzieci rzeźbią dynie w lampiony, by straszyć duchy.",
    vi: "Trẻ em khắc bí ngô thành đèn lồng để dọa ma.",
    "pt-BR": "As crianças esculpem abóboras em lanternas para assustar fantasmas.",
    id: "Anak-anak mengukir labu menjadi jack-o’-lantern untuk menakuti hantu.",
    hi: "बच्चे भूतों को डराने के लिए कद्दू को जैक-ओ’-लैंtern में तराशते हैं।",
    ar: "ينحت الأطفال اليقطين على شكل فوانيس لإخافة الأشباح.",
    tr: "Çocuklar hayaletleri korkutmak için balkabaklarını fener yapar.",
  },
  q5: {
    en: "Halloween’s classic colors are orange and black.",
    ko: "할로윈의 대표 색깔은 주황과 검정입니다.",
    "zh-Hans": "万圣节的经典颜色是橙色和黑色。",
    ja: "ハロウィンの定番色はオレンジと黒です。",
    es: "Los colores clásicos de Halloween son naranja y negro.",
    de: "Die klassischen Halloween-Farben sind Orange und Schwarz.",
    fr: "Les couleurs classiques d’Halloween sont l’orange et le noir.",
    it: "I colori classici di Halloween sono arancione e nero.",
    pl: "Klasyczne kolory Halloween to pomarańcz i czerń.",
    vi: "Màu kinh điển của Halloween là cam và đen.",
    "pt-BR": "As cores clássicas do Halloween são laranja e preto.",
    id: "Warna klasik Halloween adalah oranye dan hitam.",
    hi: "हैलोवीन के क्लासिक रंग नारंगी और काला हैं।",
    ar: "ألوان الهالوين الكلاسيكية هي البرتقالي والأسود.",
    tr: "Cadılar Bayramının klasik renkleri turuncu ve siyahtır.",
  },
};

/** Per-question choice glosses [choice0..3] */
const CHOICE_TABLES = {
  q1: [
    {
      en: "Halloween",
      ko: "할로윈",
      "zh-Hans": "万圣节",
      ja: "ハロウィン",
      es: "Halloween",
      de: "Halloween",
      fr: "Halloween",
      it: "Halloween",
      pl: "Halloween",
      vi: "Halloween",
      "pt-BR": "Halloween",
      id: "Halloween",
      hi: "हैलोवीन",
      ar: "الهالوين",
      tr: "Cadılar Bayramı",
    },
    {
      en: "Christmas",
      ko: "크리스마스",
      "zh-Hans": "圣诞节",
      ja: "クリスマス",
      es: "Navidad",
      de: "Weihnachten",
      fr: "Noël",
      it: "Natale",
      pl: "Boże Narodzenie",
      vi: "Giáng sinh",
      "pt-BR": "Natal",
      id: "Natal",
      hi: "क्रिसमस",
      ar: "عيد الميلاد",
      tr: "Noel",
    },
    {
      en: "Easter",
      ko: "부활절",
      "zh-Hans": "复活节",
      ja: "イースター",
      es: "Pascua",
      de: "Ostern",
      fr: "Pâques",
      it: "Pasqua",
      pl: "Wielkanoc",
      vi: "Phục sinh",
      "pt-BR": "Páscoa",
      id: "Paskah",
      hi: "ईस्टर",
      ar: "عيد الفصح",
      tr: "Paskalya",
    },
    {
      en: "Valentine's Day",
      ko: "발렌타인데이",
      "zh-Hans": "情人节",
      ja: "バレンタインデー",
      es: "San Valentín",
      de: "Valentinstag",
      fr: "Saint-Valentin",
      it: "San Valentino",
      pl: "Walentynki",
      vi: "Valentine",
      "pt-BR": "Dia dos Namorados",
      id: "Valentine",
      hi: "वैलेंटाइन",
      ar: "عيد الحب",
      tr: "Sevgililer Günü",
    },
  ],
  q2: [
    {
      en: "October 31",
      ko: "10월 31일",
      "zh-Hans": "10月31日",
      ja: "10月31日",
      es: "31 de octubre",
      de: "31. Oktober",
      fr: "31 octobre",
      it: "31 ottobre",
      pl: "31 października",
      vi: "31 tháng 10",
      "pt-BR": "31 de outubro",
      id: "31 Oktober",
      hi: "31 अक्टूबर",
      ar: "31 أكتوبر",
      tr: "31 Ekim",
    },
    {
      en: "November 1",
      ko: "11월 1일",
      "zh-Hans": "11月1日",
      ja: "11月1日",
      es: "1 de noviembre",
      de: "1. November",
      fr: "1er novembre",
      it: "1° novembre",
      pl: "1 listopada",
      vi: "1 tháng 11",
      "pt-BR": "1º de novembro",
      id: "1 November",
      hi: "1 नवंबर",
      ar: "1 نوفمبر",
      tr: "1 Kasım",
    },
    {
      en: "October 1",
      ko: "10월 1일",
      "zh-Hans": "10月1日",
      ja: "10月1日",
      es: "1 de octubre",
      de: "1. Oktober",
      fr: "1er octobre",
      it: "1° ottobre",
      pl: "1 października",
      vi: "1 tháng 10",
      "pt-BR": "1º de outubro",
      id: "1 Oktober",
      hi: "1 अक्टूबर",
      ar: "1 أكتوبر",
      tr: "1 Ekim",
    },
    {
      en: "December 25",
      ko: "12월 25일",
      "zh-Hans": "12月25日",
      ja: "12月25日",
      es: "25 de diciembre",
      de: "25. Dezember",
      fr: "25 décembre",
      it: "25 dicembre",
      pl: "25 grudnia",
      vi: "25 tháng 12",
      "pt-BR": "25 de dezembro",
      id: "25 Desember",
      hi: "25 दिसंबर",
      ar: "25 ديسمبر",
      tr: "25 Aralık",
    },
  ],
  q3: [
    {
      en: "Trick or treat!",
      ko: "Trick or treat!",
      "zh-Hans": "Trick or treat!",
      ja: "Trick or treat!",
      es: "¡Trick or treat!",
      de: "Trick or treat!",
      fr: "Trick or treat !",
      it: "Trick or treat!",
      pl: "Trick or treat!",
      vi: "Trick or treat!",
      "pt-BR": "Trick or treat!",
      id: "Trick or treat!",
      hi: "Trick or treat!",
      ar: "Trick or treat!",
      tr: "Trick or treat!",
    },
    {
      en: "Merry Christmas!",
      ko: "Merry Christmas!",
      "zh-Hans": "圣诞快乐！",
      ja: "メリークリスマス！",
      es: "¡Feliz Navidad!",
      de: "Frohe Weihnachten!",
      fr: "Joyeux Noël !",
      it: "Buon Natale!",
      pl: "Wesołych Świąt!",
      vi: "Giáng sinh vui vẻ!",
      "pt-BR": "Feliz Natal!",
      id: "Selamat Natal!",
      hi: "मेरी क्रिसमस!",
      ar: "عيد ميلاد مجيد!",
      tr: "Mutlu Noeller!",
    },
    {
      en: "Happy birthday!",
      ko: "Happy birthday!",
      "zh-Hans": "生日快乐！",
      ja: "お誕生日おめでとう！",
      es: "¡Feliz cumpleaños!",
      de: "Alles Gute zum Geburtstag!",
      fr: "Joyeux anniversaire !",
      it: "Buon compleanno!",
      pl: "Wszystkiego najlepszego!",
      vi: "Chúc mừng sinh nhật!",
      "pt-BR": "Feliz aniversário!",
      id: "Selamat ulang tahun!",
      hi: "जन्मदिन मुबारक!",
      ar: "عيد ميلاد سعيد!",
      tr: "Doğum günün kutlu olsun!",
    },
    {
      en: "Good morning!",
      ko: "Good morning!",
      "zh-Hans": "早上好！",
      ja: "おはよう！",
      es: "¡Buenos días!",
      de: "Guten Morgen!",
      fr: "Bonjour !",
      it: "Buongiorno!",
      pl: "Dzień dobry!",
      vi: "Chào buổi sáng!",
      "pt-BR": "Bom dia!",
      id: "Selamat pagi!",
      hi: "सुप्रभात!",
      ar: "صباح الخير!",
      tr: "Günaydın!",
    },
  ],
  q4: [
    {
      en: "Pumpkin",
      ko: "호박",
      "zh-Hans": "南瓜",
      ja: "かぼちゃ",
      es: "Calabaza",
      de: "Kürbis",
      fr: "Citrouille",
      it: "Zucca",
      pl: "Dynia",
      vi: "Bí ngô",
      "pt-BR": "Abóbora",
      id: "Labu",
      hi: "कद्दू",
      ar: "يقطين",
      tr: "Balkabağı",
    },
    {
      en: "Carrot",
      ko: "당근",
      "zh-Hans": "胡萝卜",
      ja: "にんじん",
      es: "Zanahoria",
      de: "Karotte",
      fr: "Carotte",
      it: "Carota",
      pl: "Marchew",
      vi: "Cà rốt",
      "pt-BR": "Cenoura",
      id: "Wortel",
      hi: "गाजर",
      ar: "جزر",
      tr: "Havuç",
    },
    {
      en: "Potato",
      ko: "감자",
      "zh-Hans": "土豆",
      ja: "じゃがいも",
      es: "Patata",
      de: "Kartoffel",
      fr: "Pomme de terre",
      it: "Patata",
      pl: "Ziemniak",
      vi: "Khoai tây",
      "pt-BR": "Batata",
      id: "Kentang",
      hi: "आलू",
      ar: "بطاطا",
      tr: "Patates",
    },
    {
      en: "Tomato",
      ko: "토마토",
      "zh-Hans": "番茄",
      ja: "トマト",
      es: "Tomate",
      de: "Tomate",
      fr: "Tomate",
      it: "Pomodoro",
      pl: "Pomidor",
      vi: "Cà chua",
      "pt-BR": "Tomate",
      id: "Tomat",
      hi: "टमाटर",
      ar: "طماطم",
      tr: "Domates",
    },
  ],
  q5: [
    {
      en: "Orange and black",
      ko: "주황과 검정",
      "zh-Hans": "橙色和黑色",
      ja: "オレンジと黒",
      es: "Naranja y negro",
      de: "Orange und Schwarz",
      fr: "Orange et noir",
      it: "Arancione e nero",
      pl: "Pomarańcz i czerń",
      vi: "Cam và đen",
      "pt-BR": "Laranja e preto",
      id: "Oranye dan hitam",
      hi: "नारंगी और काला",
      ar: "برتقالي وأسود",
      tr: "Turuncu ve siyah",
    },
    {
      en: "Red and green",
      ko: "빨강과 초록",
      "zh-Hans": "红色和绿色",
      ja: "赤と緑",
      es: "Rojo y verde",
      de: "Rot und Grün",
      fr: "Rouge et vert",
      it: "Rosso e verde",
      pl: "Czerwień i zieleń",
      vi: "Đỏ và xanh lá",
      "pt-BR": "Vermelho e verde",
      id: "Merah dan hijau",
      hi: "लाल और हरा",
      ar: "أحمر وأخضر",
      tr: "Kırmızı ve yeşil",
    },
    {
      en: "Blue and white",
      ko: "파랑과 흰색",
      "zh-Hans": "蓝色和白色",
      ja: "青と白",
      es: "Azul y blanco",
      de: "Blau und Weiß",
      fr: "Bleu et blanc",
      it: "Blu e bianco",
      pl: "Niebieski i biały",
      vi: "Xanh dương và trắng",
      "pt-BR": "Azul e branco",
      id: "Biru dan putih",
      hi: "नीला और सफेद",
      ar: "أزرق وأبيض",
      tr: "Mavi ve beyaz",
    },
    {
      en: "Pink and purple",
      ko: "분홍과 보라",
      "zh-Hans": "粉色和紫色",
      ja: "ピンクと紫",
      es: "Rosa y morado",
      de: "Rosa und Lila",
      fr: "Rose et violet",
      it: "Rosa e viola",
      pl: "Róż i fiolet",
      vi: "Hồng và tím",
      "pt-BR": "Rosa e roxo",
      id: "Merah muda dan ungu",
      hi: "गुलाबी और बैंगनी",
      ar: "وردي وبنفسجي",
      tr: "Pembe ve mor",
    },
  ],
};

function expandBlock(base, table) {
  const out = { ...base };
  for (const lang of LANGS) {
    if (table[lang] != null) out[lang] = table[lang];
    else if (!out[lang] && out.en) out[lang] = out.en;
  }
  return out;
}

function applyChoiceTable(choice, tableRow) {
  if (!tableRow) return;
  for (const lang of LANGS) {
    if (tableRow[lang] != null) choice[lang] = tableRow[lang];
    else if (!choice[lang] && choice.en) choice[lang] = choice.en;
  }
}

function expandQuiz() {
  const quizPath = path.join(ROOT, "data/oct-daily-quiz.json");
  const quiz = JSON.parse(fs.readFileSync(quizPath, "utf8"));
  quiz.languageToggleIfNotPerfect = false;
  for (const q of quiz.questions) {
    const qmap = QUIZ_Q[q.id];
    if (qmap) {
      for (const lang of LANGS) {
        if (qmap[lang]) q[lang] = qmap[lang];
      }
    }
    if (q.explain) {
      const em = EXPLAIN_MAPS[q.id];
      if (em) {
        for (const lang of LANGS) {
          if (em[lang]) q.explain[lang] = em[lang];
          else if (!q.explain[lang] && q.explain.en) q.explain[lang] = q.explain.en;
        }
      } else {
        for (const lang of LANGS) {
          if (!q.explain[lang] && q.explain.en) q.explain[lang] = q.explain.en;
        }
      }
    }
    const table = CHOICE_TABLES[q.id];
    q.choices.forEach((c, i) => {
      applyChoiceTable(c, table?.[i]);
      for (const lang of LANGS) {
        if (!c[lang] && c.en) c[lang] = c.en;
      }
    });
  }
  fs.writeFileSync(quizPath, JSON.stringify(quiz, null, 2) + "\n");
}

function expandLinesBlock(lines) {
  if (!lines?.en) return lines;
  const out = { ...lines };
  for (const lang of LANGS) {
    if (!out[lang]) out[lang] = lang === "ko" && out.ko ? out.ko : [...out.en];
  }
  return out;
}

function expandCraft() {
  const p = path.join(ROOT, "craft/october/stages.json");
  const spec = JSON.parse(fs.readFileSync(p, "utf8"));
  spec.languages = {
    ui: LANGS,
    default: "en",
    listeningPrimary: "en",
    storageKey: "culture-class-lang",
  };
  const enCopy = spec.uiCopy.en;
  for (const lang of LANGS) {
    if (!spec.uiCopy[lang]) spec.uiCopy[lang] = lang === "ko" && spec.uiCopy.ko ? spec.uiCopy.ko : { ...enCopy };
  }
  for (const stage of spec.stages) {
    if (stage.titleKo) {
      stage.titles = expandBlock({ en: stage.title, ko: stage.titleKo }, {});
      delete stage.titleKo;
    } else if (!stage.titles) {
      stage.titles = { en: stage.title };
      for (const lang of LANGS) stage.titles[lang] = stage.title;
    }
    if (stage.lines) stage.lines = expandLinesBlock(stage.lines);
  }
  for (const tr of spec.transitions || []) {
    if (tr.caption && tr.caption.en != null) {
      const capBlock = expandBlock(
        { en: tr.caption.en, ko: tr.caption.ko || tr.caption.en },
        {}
      );
      tr.caption = capBlock;
    }
  }
  fs.writeFileSync(p, JSON.stringify(spec, null, 2) + "\n");
}

function expandFaces() {
  const p = path.join(ROOT, "craft/october/assets/faces.json");
  const faces = JSON.parse(fs.readFileSync(p, "utf8"));
  for (const face of faces) {
    if (!face.label) continue;
    for (const lang of LANGS) {
      if (!face.label[lang]) face.label[lang] = lang === "ko" && face.label.ko ? face.label.ko : face.label.en;
    }
  }
  fs.writeFileSync(p, JSON.stringify(faces, null, 2) + "\n");
}

expandQuiz();
expandCraft();
expandFaces();
console.log("Expanded quiz, craft stages, faces for 15 languages.");
