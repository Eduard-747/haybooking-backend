/**
 * Utility for language detection, Unicode normalization, and cross-script transliteration
 * between English (Latin), Armenian (Armenian script), and Russian (Cyrillic script).
 */

export type SupportedLanguage = 'en' | 'hy' | 'ru' | 'unknown';

export interface TransliterationResult {
  query: string;
  normalizedQuery: string;
  primaryLang: SupportedLanguage;
  variants: string[];
}

/**
 * Detect script language of query string
 */
export function detectLanguage(input: string): SupportedLanguage {
  if (!input) return 'unknown';

  const armenianCount = (input.match(/[\u0530-\u058F]/g) || []).length;
  const cyrillicCount = (input.match(/[\u0400-\u04FF]/g) || []).length;
  const latinCount = (input.match(/[a-zA-Z]/g) || []).length;

  if (armenianCount > cyrillicCount && armenianCount > latinCount) {
    return 'hy';
  }
  if (cyrillicCount > armenianCount && cyrillicCount > latinCount) {
    return 'ru';
  }
  if (latinCount > 0) {
    return 'en';
  }

  return 'unknown';
}

/**
 * Normalize search string (Unicode NFC, lower case, trimmed)
 */
export function normalizeQuery(input: string): string {
  if (!input) return '';
  return input
    .normalize('NFC')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

// Digraph and Multi-char Mappings
const LATIN_TO_ARMENIAN_MULTI: [RegExp, string][] = [
  [/yev/g, 'և'],
  [/ev/g, 'և'],
  [/shch/g, 'շ'],
  [/sh/g, 'շ'],
  [/ch/g, 'ճ'],
  [/zh/g, 'ժ'],
  [/kh/g, 'խ'],
  [/ts/g, 'ց'],
  [/dz/g, 'ձ'],
  [/gh/g, 'ղ'],
  [/ph/g, 'փ'],
  [/th/g, 'թ'],
  [/vo/g, 'ո'],
  [/ye/g, 'ե'],
  [/yo/g, 'եո'],
  [/yu/g, 'յու'],
  [/ya/g, 'յա'],
  [/oo/g, 'ու'],
  [/ou/g, 'ու'],
];

const LATIN_TO_CYRILLIC_MULTI: [RegExp, string][] = [
  [/yev/g, 'ев'],
  [/shch/g, 'щ'],
  [/sh/g, 'ш'],
  [/ch/g, 'ч'],
  [/zh/g, 'ж'],
  [/kh/g, 'х'],
  [/ts/g, 'ц'],
  [/dz/g, 'дз'],
  [/gh/g, 'г'],
  [/ph/g, 'ф'],
  [/th/g, 'т'],
  [/vo/g, 'во'],
  [/ye/g, 'е'],
  [/yo/g, 'ё'],
  [/yu/g, 'ю'],
  [/ya/g, 'я'],
  [/oo/g, 'у'],
  [/ou/g, 'у'],
];

const ARMENIAN_TO_LATIN_MULTI: [RegExp, string][] = [
  [/ու/g, 'u'],
  [/եո/g, 'yo'],
  [/յու/g, 'yu'],
  [/յա/g, 'ya'],
  [/և/g, 'ev'],
];

const ARMENIAN_TO_CYRILLIC_MULTI: [RegExp, string][] = [
  [/ու/g, 'у'],
  [/եո/g, 'ё'],
  [/յու/g, 'ю'],
  [/յա/g, 'я'],
  [/և/g, 'ев'],
];

const CYRILLIC_TO_LATIN_MULTI: [RegExp, string][] = [
  [/дз/g, 'dz'],
  [/дж/g, 'j'],
  [/кс/g, 'x'],
  [/щ/g, 'shch'],
  [/ш/g, 'sh'],
  [/ч/g, 'ch'],
  [/ж/g, 'zh'],
  [/х/g, 'kh'],
  [/ц/g, 'ts'],
  [/ю/g, 'yu'],
  [/я/g, 'ya'],
  [/ё/g, 'yo'],
  [/ев/g, 'yev'],
];

const CYRILLIC_TO_ARMENIAN_MULTI: [RegExp, string][] = [
  [/дз/g, 'ձ'],
  [/дж/g, 'ջ'],
  [/кс/g, 'քս'],
  [/щ/g, 'շ'],
  [/ш/g, 'շ'],
  [/ч/g, 'ճ'],
  [/ж/g, 'ժ'],
  [/х/g, 'խ'],
  [/ц/g, 'ց'],
  [/ю/g, 'յու'],
  [/я/g, 'յա'],
  [/ё/g, 'եո'],
  [/ев/g, 'և'],
];

// Single Character Maps
const LATIN_TO_ARMENIAN_SINGLE: Record<string, string> = {
  a: 'ա', b: 'բ', c: 'կ', d: 'դ', e: 'ե', f: 'ֆ', g: 'գ', h: 'հ',
  i: 'ի', j: 'ջ', k: 'ք', l: 'լ', m: 'մ', n: 'ն', o: 'ո', p: 'պ',
  q: 'ք', r: 'ր', s: 'ս', t: 'տ', u: 'ու', v: 'վ', w: 'վ', x: 'խ',
  y: 'յ', z: 'զ',
};

const LATIN_TO_CYRILLIC_SINGLE: Record<string, string> = {
  a: 'а', b: 'б', c: 'к', d: 'д', e: 'е', f: 'ф', g: 'г', h: 'х',
  i: 'и', j: 'й', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п',
  q: 'к', r: 'р', s: 'с', t: 'т', u: 'у', v: 'в', w: 'в', x: 'кс',
  y: 'ы', z: 'з',
};

const ARMENIAN_TO_LATIN_SINGLE: Record<string, string> = {
  ա: 'a', բ: 'b', գ: 'g', դ: 'd', ե: 'e', զ: 'z', է: 'e', ը: 'y',
  թ: 't', ժ: 'zh', ի: 'i', լ: 'l', խ: 'kh', ծ: 'ts', կ: 'k', հ: 'h',
  ձ: 'dz', ղ: 'gh', ճ: 'ch', մ: 'm', յ: 'y', ն: 'n', շ: 'sh', ո: 'o',
  չ: 'ch', պ: 'p', ջ: 'j', ռ: 'r', ս: 's', վ: 'v', տ: 't', ր: 'r',
  ց: 'ts', փ: 'p', ք: 'k', օ: 'o', ֆ: 'f', ւ: 'u', և: 'ev',
};

const ARMENIAN_TO_CYRILLIC_SINGLE: Record<string, string> = {
  ա: 'а', բ: 'б', գ: 'г', դ: 'д', ե: 'е', զ: 'з', է: 'э', ը: 'ы',
  թ: 'т', ժ: 'ж', ի: 'и', լ: 'л', խ: 'х', ծ: 'ц', կ: 'к', հ: 'х',
  ձ: 'дз', ղ: 'г', ճ: 'ч', մ: 'м', յ: 'й', ն: 'н', շ: 'ш', ո: 'о',
  չ: 'ч', պ: 'п', ջ: 'дж', ռ: 'р', ս: 'с', վ: 'в', տ: 'т', ր: 'р',
  ց: 'ц', փ: 'п', ք: 'к', օ: 'о', ֆ: 'ф', ւ: 'у', և: 'ев',
};

const CYRILLIC_TO_LATIN_SINGLE: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', з: 'z', и: 'i',
  й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', ы: 'y', э: 'e', ь: '', ъ: '',
};

const CYRILLIC_TO_ARMENIAN_SINGLE: Record<string, string> = {
  а: 'ա', б: 'բ', в: 'վ', г: 'գ', д: 'դ', е: 'ե', з: 'զ', и: 'ի',
  й: 'յ', к: 'կ', л: 'լ', м: 'մ', н: 'ն', о: 'ո', п: 'պ', р: 'ր',
  с: 'ս', т: 'տ', у: 'ու', ф: 'ֆ', ы: 'ը', э: 'է', ь: '', ъ: '',
};

/**
 * Transliterate a string from one script to another
 */
export function transliterate(text: string, fromLang: SupportedLanguage, toLang: SupportedLanguage): string {
  if (!text || fromLang === toLang) return text;
  const norm = normalizeQuery(text);

  let res = norm;

  if (fromLang === 'en') {
    if (toLang === 'hy') {
      for (const [pattern, repl] of LATIN_TO_ARMENIAN_MULTI) {
        res = res.replace(pattern, repl);
      }
      res = res.split('').map((char) => LATIN_TO_ARMENIAN_SINGLE[char] || char).join('');
    } else if (toLang === 'ru') {
      for (const [pattern, repl] of LATIN_TO_CYRILLIC_MULTI) {
        res = res.replace(pattern, repl);
      }
      res = res.split('').map((char) => LATIN_TO_CYRILLIC_SINGLE[char] || char).join('');
    }
  } else if (fromLang === 'hy') {
    if (toLang === 'en') {
      for (const [pattern, repl] of ARMENIAN_TO_LATIN_MULTI) {
        res = res.replace(pattern, repl);
      }
      res = res.split('').map((char) => ARMENIAN_TO_LATIN_SINGLE[char] || char).join('');
    } else if (toLang === 'ru') {
      for (const [pattern, repl] of ARMENIAN_TO_CYRILLIC_MULTI) {
        res = res.replace(pattern, repl);
      }
      res = res.split('').map((char) => ARMENIAN_TO_CYRILLIC_SINGLE[char] || char).join('');
    }
  } else if (fromLang === 'ru') {
    if (toLang === 'en') {
      for (const [pattern, repl] of CYRILLIC_TO_LATIN_MULTI) {
        res = res.replace(pattern, repl);
      }
      res = res.split('').map((char) => CYRILLIC_TO_LATIN_SINGLE[char] || char).join('');
    } else if (toLang === 'hy') {
      for (const [pattern, repl] of CYRILLIC_TO_ARMENIAN_MULTI) {
        res = res.replace(pattern, repl);
      }
      res = res.split('').map((char) => CYRILLIC_TO_ARMENIAN_SINGLE[char] || char).join('');
    }
  }

  return res;
}

export interface DictionaryGroup {
  en: string[];
  hy: string[];
  ru: string[];
}

export const CROSS_LINGUAL_DICTIONARY: DictionaryGroup[] = [
  // Hair & Barber
  {
    en: ['haircut', 'hair', 'barber', 'hairdresser', 'hairstyling', 'trim', 'cut', 'shave'],
    hy: ['վարսահարդարում', 'կտրվածք', 'վարսավիր', 'մազեր', 'մազերի', 'սանրվածք', 'սափրում'],
    ru: ['стрижка', 'парикмахер', 'прическа', 'волосы', 'волос', 'укладка', 'бритье'],
  },
  // Nails & Manicure
  {
    en: ['manicure', 'pedicure', 'nails', 'nail', 'nailart'],
    hy: ['մատնահարդարում', 'ոտնահարդարում', 'եղունգներ', 'եղունգ'],
    ru: ['маникюр', 'педикюр', 'ногти', 'ноготок', 'ноготь'],
  },
  // Makeup & Lash
  {
    en: ['makeup', 'visage', 'cosmetics', 'eyelash', 'lashes', 'brows'],
    hy: ['դիմահարդարում', 'վիզաժ', 'կոսմետիկա', 'թարթիչներ', 'հոնքեր'],
    ru: ['макияж', 'визаж', 'косметика', 'ресницы', 'брови'],
  },
  // Massage & Spa
  {
    en: ['massage', 'spa', 'relax', 'sauna', 'wellness'],
    hy: ['մերսում', 'սպա', 'հանգիստ', 'սաունա', 'առողջարան'],
    ru: ['массаж', 'спа', 'релакс', 'сауна', 'велнес'],
  },
  // Salon & Beauty
  {
    en: ['salon', 'beauty', 'aesthetic'],
    hy: ['սալոն', 'գեղեցկություն', 'էսթետիկ'],
    ru: ['салон', 'красота', 'эстетика'],
  },
  // Epilation & Laser
  {
    en: ['epilation', 'depilation', 'laser', 'hair removal'],
    hy: ['էպիլյացիա', 'լազերային', 'մազահեռացում', 'դեպիլյացիա'],
    ru: ['эпиляция', 'депиляция', 'лазер', 'удаление волос'],
  },
  // Dental & Dentist
  {
    en: ['dental', 'dentist', 'teeth', 'tooth', 'orthodontics', 'stomatology'],
    hy: ['ատամնաբույժ', 'ստոմատոլոգիա', 'ատամներ', 'ատամնաբուժարան', 'օրթոդոնտիա'],
    ru: ['стоматология', 'стоматолог', 'зубы', 'зуб', 'ортодонтия', 'дент'],
  },
  // Doctor & Medicine
  {
    en: ['doctor', 'medical', 'clinic', 'medicine', 'health', 'physician'],
    hy: ['բժիշկ', 'բժշկական', 'կլինիկա', 'առողջություն', 'բուժօգնություն'],
    ru: ['врач', 'доктор', 'медицинский', 'клиника', 'здоровье', 'медицина'],
  },
  // Therapy
  {
    en: ['therapy', 'physiotherapy', 'rehabilitation'],
    hy: ['թերապիա', 'ֆիզիոթերապիա', 'վերականգնում'],
    ru: ['терапия', 'физиотерапия', 'реабилитация'],
  },
  // Fitness & Gym
  {
    en: ['fitness', 'gym', 'workout', 'sport', 'training', 'exercise'],
    hy: ['ֆիթնես', 'մարզասրահ', 'մարզում', 'սպորտ', 'դահլիճ'],
    ru: ['фитнес', 'спортзал', 'тренировка', 'спорт', 'зал'],
  },
  // Yoga & Pilates
  {
    en: ['yoga', 'pilates', 'stretching'],
    hy: ['յոգա', 'պիլատես', 'ձգումներ'],
    ru: ['йога', 'пилатес', 'растяжка'],
  },
  // Pool & Swimming
  {
    en: ['pool', 'swimming', 'aqua'],
    hy: ['լողավազան', 'լող', 'ակվա'],
    ru: ['бассейн', 'плавание', 'аква'],
  },
  // Restaurant & Dining
  {
    en: ['restaurant', 'dining', 'food', 'cafe', 'bistro', 'kitchen'],
    hy: ['ռեստորան', 'սրճարան', 'սնունդ', 'ուտելիք', 'խոհանոց'],
    ru: ['ресторан', 'кафе', 'еда', 'кухня', 'бистро'],
  },
  // Menu & Dish
  {
    en: ['menu', 'dish', 'meal', 'drink'],
    hy: ['ճաշացանկ', 'մենյու', 'կերակուր', 'ըմպելիք'],
    ru: ['меню', 'блюдо', 'напиток', 'трапеза'],
  },
  // Auto & Car Wash
  {
    en: ['auto', 'car', 'car wash', 'mechanic', 'repair', 'detailing'],
    hy: ['ավտո', 'մեքենա', 'ավտոլվացում', 'վերանորոգում', 'դեթեյլինգ'],
    ru: ['авто', 'машина', 'автомойка', 'автосервис', 'ремонт', 'детейлинг'],
  },
  // Pet & Animals
  {
    en: ['pet', 'dog', 'cat', 'vet', 'veterinary', 'animal'],
    hy: ['կենդանիներ', 'շուն', 'կատու', 'անասնաբույժ', 'խնամք'],
    ru: ['питомцы', 'собака', 'кошка', 'ветеринар', 'животные'],
  },
  // Hotel & Booking
  {
    en: ['hotel', 'booking', 'room', 'reservation'],
    hy: ['հյուրանոց', 'ամրագրում', 'սենյակ'],
    ru: ['отель', 'гостиница', 'бронирование', 'номер'],
  },
];

/**
 * Generate all cross-script query variants and semantic translations for searching
 */
export function generateQueryVariants(query: string): TransliterationResult {
  const normalizedQuery = normalizeQuery(query);
  if (!normalizedQuery) {
    return {
      query,
      normalizedQuery: '',
      primaryLang: 'unknown',
      variants: [],
    };
  }

  const primaryLang = detectLanguage(normalizedQuery);
  const variantsSet = new Set<string>();
  variantsSet.add(normalizedQuery);

  if (primaryLang === 'en') {
    variantsSet.add(transliterate(normalizedQuery, 'en', 'hy'));
    variantsSet.add(transliterate(normalizedQuery, 'en', 'ru'));
  } else if (primaryLang === 'hy') {
    const latinVer = transliterate(normalizedQuery, 'hy', 'en');
    variantsSet.add(latinVer);
    variantsSet.add(transliterate(normalizedQuery, 'hy', 'ru'));
    variantsSet.add(transliterate(latinVer, 'en', 'ru'));
  } else if (primaryLang === 'ru') {
    const latinVer = transliterate(normalizedQuery, 'ru', 'en');
    variantsSet.add(latinVer);
    variantsSet.add(transliterate(normalizedQuery, 'ru', 'hy'));
    variantsSet.add(transliterate(latinVer, 'en', 'hy'));
  } else {
    variantsSet.add(transliterate(normalizedQuery, 'en', 'hy'));
    variantsSet.add(transliterate(normalizedQuery, 'en', 'ru'));
    variantsSet.add(transliterate(normalizedQuery, 'hy', 'en'));
    variantsSet.add(transliterate(normalizedQuery, 'ru', 'en'));
  }

  // Semantic Cross-Lingual Translation Lookup
  const currentVariants = Array.from(variantsSet);
  for (const group of CROSS_LINGUAL_DICTIONARY) {
    const allGroupWords = [...group.en, ...group.hy, ...group.ru];
    const isMatch = currentVariants.some((v) =>
      allGroupWords.some((word) => word.includes(v) || v.includes(word))
    );

    if (isMatch) {
      allGroupWords.forEach((word) => variantsSet.add(word));
    }
  }

  return {
    query,
    normalizedQuery,
    primaryLang,
    variants: Array.from(variantsSet).filter(Boolean),
  };
}

/**
 * Escape special regex characters safely
 */
export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
