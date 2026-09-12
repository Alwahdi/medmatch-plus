export type Region = { ar: string; en: string; cities: { ar: string; en: string }[] };
export type Country = { code: string; ar: string; en: string; regions: Region[] };

const r = (ar: string, en: string, cities: [string, string][]): Region => ({
  ar,
  en,
  cities: cities.map(([a, e]) => ({ ar: a, en: e })),
});

export const COUNTRIES: Country[] = [
  {
    code: "EG",
    ar: "مصر",
    en: "Egypt",
    regions: [
      r("القاهرة", "Cairo", [
        ["مدينة نصر", "Nasr City"],
        ["المعادي", "Maadi"],
        ["مصر الجديدة", "Heliopolis"],
        ["التجمع الخامس", "Fifth Settlement"],
        ["وسط البلد", "Downtown"],
      ]),
      r("الجيزة", "Giza", [
        ["الدقي", "Dokki"],
        ["المهندسين", "Mohandessin"],
        ["6 أكتوبر", "6th of October"],
        ["الشيخ زايد", "Sheikh Zayed"],
      ]),
      r("الإسكندرية", "Alexandria", [
        ["سموحة", "Smouha"],
        ["سيدي جابر", "Sidi Gaber"],
        ["المنتزه", "Montazah"],
夏      ]),
      r("الدقهلية", "Dakahlia", [
        ["المنصورة", "Mansoura"],
        ["ميت غمر", "Mit Ghamr"],
      ]),
    ],
  },
  {
    code: "SA",
    ar: "المملكة العربية السعودية",
    en: "Saudi Arabia",
    regions: [
      r("الرياض", "Riyadh", [
        ["الرياض", "Riyadh"],
        ["الخرج", "Al Kharj"],
        ["الدوادمي", "Dawadmi"],
      ]),
      r("مكة المكرمة", "Makkah", [
        ["جدة", "Jeddah"],
        ["مكة المكرمة", "Makkah"],
        ["الطائف", "Taif"],
      ]),
      r("المنطقة الشرقية", "Eastern Province", [
        ["الدمام", "Dammam"],
        ["الخبر", "Khobar"],
        ["الأحساء", "Al Ahsa"],
        ["الجبيل", "Jubail"],
      ]),
      r("المدينة المنورة", "Madinah", [
        ["المدينة المنورة", "Madinah"],
        ["ينبع", "Yanbu"],
      ]),
      r("عسير", "Asir", [
        ["أبها", "Abha"],
        ["خميس مشيط", "Khamis Mushait"],
      ]),
    ],
  },
  {
    code: "AE",
    ar: "الإمارات العربية المتحدة",
    en: "United Arab Emirates",
    regions: [
      r("دبي", "Dubai", [
        ["دبي", "Dubai"],
        ["جبل علي", "Jebel Ali"],
      ]),
      r("أبوظبي", "Abu Dhabi", [
        ["أبوظبي", "Abu Dhabi"],
        ["العين", "Al Ain"],
      ]),
      r("الشارقة", "Sharjah", [["الشارقة", "Sharjah"]]),
      r("عجمان", "Ajman", [["عجمان", "Ajman"]]),
    ],
  },
  {
    code: "QA",
    ar: "قطر",
    en: "Qatar",
    regions: [
      r("الدوحة", "Doha", [["الدوحة", "Doha"]]),
      r("الريان", "Al Rayyan", [["الريان", "Al Rayyan"]]),
      r("الوكرة", "Al Wakrah", [["الوكرة", "Al Wakrah"]]),
    ],
  },
  {
    code: "KW",
    ar: "الكويت",
    en: "Kuwait",
    regions: [
      r("العاصمة", "Capital", [["مدينة الكويت", "Kuwait City"]]),
      r("حولي", "Hawalli", [["حولي", "Hawalli"], ["السالمية", "Salmiya"]]),
      r("الفروانية", "Farwaniya", [["الفروانية", "Farwaniya"]]),
    ],
  },
  {
    code: "OM",
    ar: "عمان",
    en: "Oman",
    regions: [
      r("مسقط", "Muscat", [["مسقط", "Muscat"], ["السيب", "Seeb"]]),
      r("ظفار", "Dhofar", [["صلالة", "Salalah"]]),
      r("الباطنة", "Al Batinah", [["صحار", "Sohar"]]),
    ],
  },
  {
    code: "BH",
    ar: "البحرين",
    en: "Bahrain",
    regions: [
      r("المنامة", "Manama", [["المنامة", "Manama"]]),
      r("المحرق", "Muharraq", [["المحرق", "Muharraq"]]),
      r("الرفاع", "Riffa", [["الرفاع", "Riffa"]]),
    ],
  },
  {
    code: "JO",
    ar: "الأردن",
    en: "Jordan",
    regions: [
      r("عمّان", "Amman", [["عمّان", "Amman"]]),
      r("إربد", "Irbid", [["إربد", "Irbid"]]),
      r("الزرقاء", "Zarqa", [["الزرقاء", "Zarqa"]]),
    ],
  },
  {
    code: "LB",
    ar: "لبنان",
    en: "Lebanon",
    regions: [
      r("بيروت", "Beirut", [["بيروت", "Beirut"]]),
      r("جبل لبنان", "Mount Lebanon", [["جونية", "Jounieh"], ["بعبدا", "Baabda"]]),
      r("الشمال", "North", [["طرابلس", "Tripoli"]]),
    ],
  },
  {
    code: "IQ",
    ar: "العراق",
    en: "Iraq",
    regions: [
      r("بغداد", "Baghdad", [["بغداد", "Baghdad"]]),
      r("البصرة", "Basra", [["البصرة", "Basra"]]),
      r("أربيل", "Erbil", [["أربيل", "Erbil"]]),
    ],
  },
  {
    code: "SY",
    ar: "سوريا",
    en: "Syria",
    regions: [
      r("دمشق", "Damascus", [["دمشق", "Damascus"]]),
      r("حلب", "Aleppo", [["حلب", "Aleppo"]]),
      r("اللاذقية", "Latakia", [["اللاذقية", "Latakia"]]),
    ],
  },
  {
    code: "PS",
    ar: "فلسطين",
    en: "Palestine",
    regions: [
      r("رام الله", "Ramallah", [["رام الله", "Ramallah"]]),
      r("غزة", "Gaza", [["غزة", "Gaza"]]),
      r("نابلس", "Nablus", [["نابلس", "Nablus"]]),
    ],
  },
  {
    code: "SD",
    ar: "السودان",
    en: "Sudan",
    regions: [
      r("الخرطوم", "Khartoum", [["الخرطوم", "Khartoum"], ["أم درمان", "Omdurman"]]),
      r("بورتسودان", "Port Sudan", [["بورتسودان", "Port Sudan"]]),
    ],
  },
  {
    code: "LY",
    ar: "ليبيا",
    en: "Libya",
    regions: [
      r("طرابلس", "Tripoli", [["طرابلس", "Tripoli"]]),
      r("بنغازي", "Benghazi", [["بنغازي", "Benghazi"]]),
    ],
  },
  {
    code: "TN",
    ar: "تونس",
    en: "Tunisia",
    regions: [
      r("تونس", "Tunis", [["تونس", "Tunis"]]),
      r("صفاقس", "Sfax", [["صفاقس", "Sfax"]]),
      r("سوسة", "Sousse", [["سوسة", "Sousse"]]),
    ],
  },
  {
    code: "DZ",
    ar: "الجزائر",
    en: "Algeria",
    regions: [
      r("الجزائر", "Algiers", [["الجزائر", "Algiers"]]),
      r("وهران", "Oran", [["وهران", "Oran"]]),
      r("قسنطينة", "Constantine", [["قسنطينة", "Constantine"]]),
    ],
  },
  {
    code: "MA",
    ar: "المغرب",
    en: "Morocco",
    regions: [
      r("الدار البيضاء", "Casablanca", [["الدار البيضاء", "Casablanca"]]),
      r("الرباط", "Rabat", [["الرباط", "Rabat"]]),
      r("مراكش", "Marrakesh", [["مراكش", "Marrakesh"]]),
    ],
  },
  {
    code: "YE",
    ar: "اليمن",
    en: "Yemen",
    regions: [
      r("صنعاء", "Sanaa", [["صنعاء", "Sanaa"]]),
      r("عدن", "Aden", [["عدن", "Aden"]]),
      r("تعز", "Taiz", [["تعز", "Taiz"]]),
    ],
  },
];

export const EMPLOYER_TYPES: { value: string; ar: string; en: string }[] = [
  { value: "hospital", ar: "مستشفى", en: "Hospital" },
  { value: "clinic", ar: "عيادة", en: "Clinic" },
  { value: "lab", ar: "معمل", en: "Lab" },
  { value: "pharmacy", ar: "صيدلية", en: "Pharmacy" },
  { value: "recruitment_company", ar: "شركة توظيف", en: "Recruitment company" },
  { value: "recruitment_agency", ar: "وكالة توظيف", en: "Recruitment agency" },
  { value: "freelance_recruiter", ar: "موظف توظيف مستقل", en: "Freelance recruiter" },
  { value: "hr_officer", ar: "مسؤول توظيف", en: "HR officer" },
];
