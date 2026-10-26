// How the player's name is written and said around the world. Only names listed here
// get the non-Latin scripts (transliteration can't be done reliably by a program); any
// other name still gets the friendly greetings in languages that use the Latin alphabet.
// Several of these are sound-alike spellings: there is often more than one correct way.

const ANANYAA = {
  meaning: 'Ananya is a Sanskrit name that means "unique": one of a kind!',
  forms: {
    IN: [
      { lang: 'Hindi', script: 'अनन्या', tts: 'hi-IN', say: 'uh-nun-yaa' },
      { lang: 'Tamil', script: 'அனன்யா', tts: 'ta-IN', say: 'uh-nun-yaa' },
      { lang: 'Telugu', script: 'అనన్య', tts: 'te-IN', say: 'uh-nun-ya' },
      { lang: 'Kannada', script: 'ಅನನ್ಯ', tts: 'kn-IN', say: 'uh-nun-ya' },
      { lang: 'Bengali', script: 'অনন্যা', tts: 'bn-IN', say: 'o-non-naa' },
    ],
    KR: [{ lang: 'Korean', script: '아난야', tts: 'ko-KR', say: 'ah-nan-ya', note: 'Korean letters are put together in blocks: 아 + 난 + 야.' }],
    TW: [{ lang: 'Chinese (Taiwan)', script: '阿南雅', tts: 'zh-TW', say: 'Ā-nán-yǎ', note: 'Chinese writes names with characters that sound alike. 雅 (yǎ) means "elegant"!' }],
    SG: [
      { lang: 'English and Malay', script: 'Ananyaa', tts: 'en-GB' },
      { lang: 'Mandarin', script: '阿南雅', tts: 'zh-CN', say: 'Ā-nán-yǎ' },
      { lang: 'Tamil', script: 'அனன்யா', tts: 'ta-IN', say: 'uh-nun-yaa' },
    ],
    BALI: [{ lang: 'Indonesian', script: 'Ananyaa', tts: 'id-ID', greet: 'Om Swastiastu, Ananyaa!' }],
    JP: [{ lang: 'Japanese', script: 'アナニャ', tts: 'ja-JP', say: 'a-na-nya', note: 'Japanese writes names from other countries in katakana letters.' }],
    TH: [{ lang: 'Thai', script: 'อนัญญา', tts: 'th-TH', say: 'a-nan-yaa', note: 'Ananya is a real Thai name too!' }],
    AE: [{ lang: 'Arabic', script: 'أنانيا', tts: 'ar-AE', say: 'a-naa-nee-yaa', note: 'Arabic is written from right to left!' }],
    EG: [{ lang: 'Arabic', script: 'أنانيا', tts: 'ar-EG', say: 'a-naa-nee-yaa', note: 'Arabic is written from right to left!' }],
  },
};

const BOOK = { ananyaa: ANANYAA, ananya: ANANYAA };

// Greetings with the name, for languages written in the Latin alphabet.
const GREET = {
  US: { lang: 'English', text: n => `Hi there, ${n}!`, tts: 'en-US' },
  UK: { lang: 'English', text: n => `Hiya, ${n}!`, tts: 'en-GB' },
  AU: { lang: 'English', text: n => `G'day, ${n}!`, tts: 'en-AU' },
  ES: { lang: 'Spanish', text: n => `¡Hola, ${n}!`, tts: 'es-ES' },
  FR: { lang: 'French', text: n => `Bonjour, ${n} !`, tts: 'fr-FR' },
  BR: { lang: 'Portuguese', text: n => `Olá, ${n}!`, tts: 'pt-BR' },
  BALI: { lang: 'Indonesian', text: n => `Om Swastiastu, ${n}!`, tts: 'id-ID' },
  SG: { lang: 'Malay', text: n => `Selamat pagi, ${n}!`, tts: 'ms-MY' },
};

const key = name => String(name || '').trim().toLowerCase().replace(/[^a-z]/g, '');

export const nameBook = name => BOOK[key(name)] || null;

// Everything to show for one destination: script forms (if known) plus a greeting.
export function nameFor(name, countryId) {
  const book = nameBook(name);
  const forms = (book && book.forms[countryId]) || [];
  const g = GREET[countryId];
  const display = String(name || '').trim();
  return {
    forms,
    greeting: g && display ? { lang: g.lang, text: g.text(display), tts: g.tts } : null,
  };
}

export const NAME_COUNTRIES = ['IN', 'KR', 'TW', 'SG', 'BALI', 'JP', 'TH', 'AE', 'EG', 'US', 'UK', 'ES', 'FR', 'BR', 'AU'];
