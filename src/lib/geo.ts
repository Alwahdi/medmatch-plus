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
]),
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
      r("أمانة العاصمة", "Sanaa City", [["صنعاء", "Sanaa"]]),
      r("صنعاء", "Sanaa", [["صنعاء", "Sanaa"], ["صعدة", "Saada"]]),
      r("عدن", "Aden", [["عدن", "Aden"], ["كريتر", "Crater"], ["المعلا", "Al Mualla"]]),
      r("تعز", "Taiz", [["تعز", "Taiz"], ["المخا", "Mocha"]]),
      r("الحديدة", "Al Hudaydah", [["الحديدة", "Al Hudaydah"], ["باجل", "Bajil"]]),
      r("حضرموت", "Hadramout", [["المكلا", "Mukalla"], ["سيئون", "Seiyun"]]),
      r("إب", "Ibb", [["إب", "Ibb"], ["جبلة", "Jibla"]]),
      r("ذمار", "Dhamar", [["ذمار", "Dhamar"]]),
      r("مأرب", "Marib", [["مأرب", "Marib"]]),
      r("لحج", "Lahij", [["لحج", "Lahij"], ["الحوطة", "Al Houta"]]),
      r("أبين", "Abyan", [["زنجبار", "Zinjibar"]]),
      r("شبوة", "Shabwah", [["عتق", "Ataq"]]),
      r("عمران", "Amran", [["عمران", "Amran"]]),
      r("حجة", "Hajjah", [["حجة", "Hajjah"]]),
      r("المهر", "Al Mahrah", [["الغيظة", "Al Ghaydah"]]),
      r("سقطرى", "Socotra", [["حديبو", "Hadibu"]]),
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

/* ---------------------------------------------------------------------------
 * Searchable-select helpers.
 * Country values are stored in the database as the canonical Arabic names in
 * `@/lib/countries` — the single source of truth. Cities are stored as Arabic
 * names too, so the English UI shows the English label but submits Arabic.
 * ------------------------------------------------------------------------- */

import { CANONICAL_COUNTRIES, countryCodeOf, countryDisplay } from "@/lib/countries";
import { type Lang } from "@/lib/format";

export { DEFAULT_COUNTRY } from "@/lib/countries";

export type Option = { value: string; label: string; keywords?: string[] };

export function countryOptions(lang: Lang = "ar"): Option[] {
  return CANONICAL_COUNTRIES.map((c) => ({
    value: c.stored,
    label: lang === "en" ? c.en : c.ar,
    keywords: [c.stored, c.ar, c.en, c.code, ...c.aliases],
  }));
}

function countryData(stored: string | null | undefined) {
  const code = countryCodeOf(stored);
  return code ? (COUNTRIES.find((c) => c.code === code) ?? null) : null;
}


/** Cities of the chosen country. Empty when no (known) country is given. */
export function cityOptions(stored: string | null | undefined, lang: Lang = "ar"): Option[] {
  const data = countryData(stored);
  if (!data) return [];
  const seen = new Set<string>();
  const out: Option[] = [];
  for (const region of data.regions) {
    for (const city of region.cities) {
      if (seen.has(city.ar)) continue;
      seen.add(city.ar);
      out.push({
        value: city.ar,
        label: lang === "en" ? city.en : city.ar,
        keywords: [city.ar, city.en, region.ar, region.en],
      });
    }
  }
  return out.sort((a, b) => a.label.localeCompare(b.label, lang === "en" ? "en" : "ar"));
}

/** Cities of every supported country, labelled with the country name. */
export function allCityOptions(lang: Lang = "ar"): Option[] {
  const seen = new Set<string>();
  const out: Option[] = [];
  for (const country of COUNTRIES) {
    const cName = lang === "en" ? country.en : country.ar;
    for (const region of country.regions) {
      for (const city of region.cities) {
        if (seen.has(city.ar)) continue;
        seen.add(city.ar);
        out.push({
          value: city.ar,
          label: `${lang === "en" ? city.en : city.ar} — ${cName}`,
          keywords: [city.ar, city.en, region.ar, region.en, country.ar, country.en],
        });
      }
    }
  }
  return out.sort((a, b) => a.label.localeCompare(b.label, lang === "en" ? "en" : "ar"));
}

/** اسم المدينة مع دولتها: «صنعاء — اليمن». */
export function labelCityWithCountry(city: string, lang: Lang = "ar"): string {
  for (const country of COUNTRIES) {
    for (const region of country.regions) {
      for (const c of region.cities) {
        if (c.ar === city || c.en === city) {
          return `${lang === "en" ? c.en : c.ar} — ${lang === "en" ? country.en : country.ar}`;
        }
      }
    }
  }
  return city;
}

/** Cities for a filter: all countries when nothing is selected. */
export function filterCityOptions(stored: string | null | undefined, lang: Lang = "ar"): Option[] {
  const data = countryData(stored);
  return data ? cityOptions(stored, lang) : allCityOptions(lang);
}


export function employerTypeOptions(lang: Lang = "ar"): Option[] {
  return EMPLOYER_TYPES.map((t) => ({
    value: t.value,
    label: lang === "en" ? t.en : t.ar,
    keywords: [t.ar, t.en],
  }));
}

const CURRENCIES: { code: string; ar: string; en: string }[] = [
  { code: "YER", ar: "ريال يمني", en: "Yemeni Rial" },
  { code: "SAR", ar: "ريال سعودي", en: "Saudi Riyal" },
  { code: "AED", ar: "درهم إماراتي", en: "UAE Dirham" },
  { code: "USD", ar: "دولار أمريكي", en: "US Dollar" },
  { code: "EGP", ar: "جنيه مصري", en: "Egyptian Pound" },
  { code: "KWD", ar: "دينار كويتي", en: "Kuwaiti Dinar" },
  { code: "QAR", ar: "ريال قطري", en: "Qatari Riyal" },
  { code: "BHD", ar: "دينار بحريني", en: "Bahraini Dinar" },
  { code: "OMR", ar: "ريال عماني", en: "Omani Rial" },
  { code: "JOD", ar: "دينار أردني", en: "Jordanian Dinar" },
  { code: "IQD", ar: "دينار عراقي", en: "Iraqi Dinar" },
  { code: "LBP", ar: "ليرة لبنانية", en: "Lebanese Pound" },
  { code: "MAD", ar: "درهم مغربي", en: "Moroccan Dirham" },
  { code: "DZD", ar: "دينار جزائري", en: "Algerian Dinar" },
  { code: "TND", ar: "دينار تونسي", en: "Tunisian Dinar" },
];

export function currencyOptions(lang: Lang = "ar"): Option[] {
  return CURRENCIES.map((x) => ({
    value: x.code,
    label: lang === "en" ? `${x.code} — ${x.en}` : `${x.code} — ${x.ar}`,
    keywords: [x.code, x.ar, x.en],
  }));
}
