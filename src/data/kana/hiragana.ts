/**
 * Dataset Hiragana. Konten murni — jangan diubah saat user belajar.
 * Format baris: [character, romaji, example?, exampleReading?, exampleMeaning?]
 */
import type { KanaCard, KanaGroup } from "./types.js";

type Row = [string, string, string?, string?, string?];

const BASIC: Row[] = [
  ["あ", "a", "あめ", "ame", "hujan"],
  ["い", "i", "いぬ", "inu", "anjing"],
  ["う", "u", "うみ", "umi", "laut"],
  ["え", "e", "えき", "eki", "stasiun"],
  ["お", "o", "おかね", "okane", "uang"],
  ["か", "ka", "かぜ", "kaze", "angin"],
  ["き", "ki", "きのこ", "kinoko", "jamur"],
  ["く", "ku", "くも", "kumo", "awan"],
  ["け", "ke", "けーき", "keeki", "kue"],
  ["こ", "ko", "ここ", "koko", "sini"],
  ["さ", "sa", "さくら", "sakura", "bunga sakura"],
  ["し", "shi", "しか", "shika", "rusa"],
  ["す", "su", "すし", "sushi", "sushi"],
  ["せ", "se", "せんせい", "sensei", "guru"],
  ["そ", "so", "そら", "sora", "langit"],
  ["た", "ta", "たべもの", "tabemono", "makanan"],
  ["ち", "chi", "ちず", "chizu", "peta"],
  ["つ", "tsu", "つき", "tsuki", "bulan"],
  ["て", "te", "てがみ", "tegami", "surat"],
  ["と", "to", "とり", "tori", "burung"],
  ["な", "na", "なつ", "natsu", "musim panas"],
  ["に", "ni", "にほん", "nihon", "Jepang"],
  ["ぬ", "nu", "ぬの", "nuno", "kain"],
  ["ね", "ne", "ねこ", "neko", "kucing"],
  ["の", "no", "のみもの", "nomimono", "minuman"],
  ["は", "ha", "はな", "hana", "bunga"],
  ["ひ", "hi", "ひる", "hiru", "siang hari"],
  ["ふ", "fu", "ふね", "fune", "kapal"],
  ["へ", "he", "へや", "heya", "kamar"],
  ["ほ", "ho", "ほん", "hon", "buku"],
  ["ま", "ma", "まち", "machi", "kota"],
  ["み", "mi", "みず", "mizu", "air"],
  ["む", "mu", "むし", "mushi", "serangga"],
  ["め", "me", "めがね", "megane", "kacamata"],
  ["も", "mo", "もも", "momo", "buah persik"],
  ["や", "ya", "やま", "yama", "gunung"],
  ["ゆ", "yu", "ゆき", "yuki", "salju"],
  ["よ", "yo", "よる", "yoru", "malam"],
  ["ら", "ra", "らくだ", "rakuda", "unta"],
  ["り", "ri", "りんご", "ringo", "apel"],
  ["る", "ru", "さる", "saru", "monyet"],
  ["れ", "re", "これ", "kore", "ini"],
  ["ろ", "ro", "いろ", "iro", "warna"],
  ["わ", "wa", "わたし", "watashi", "saya"],
  ["を", "wo", "ほんをよむ", "hon wo yomu", "membaca buku"],
  ["ん", "n", "じかん", "jikan", "waktu"],
];

const DAKUTEN: Row[] = [
  ["が", "ga"], ["ぎ", "gi"], ["ぐ", "gu"], ["げ", "ge"], ["ご", "go"],
  ["ざ", "za"], ["じ", "ji"], ["ず", "zu"], ["ぜ", "ze"], ["ぞ", "zo"],
  ["だ", "da"], ["ぢ", "ji"], ["づ", "zu"], ["で", "de"], ["ど", "do"],
  ["ば", "ba"], ["び", "bi"], ["ぶ", "bu"], ["べ", "be"], ["ぼ", "bo"],
];

const HANDAKUTEN: Row[] = [
  ["ぱ", "pa"], ["ぴ", "pi"], ["ぷ", "pu"], ["ぺ", "pe"], ["ぽ", "po"],
];

const COMBINATION: Row[] = [
  ["きゃ", "kya"], ["きゅ", "kyu"], ["きょ", "kyo"],
  ["しゃ", "sha"], ["しゅ", "shu"], ["しょ", "sho"],
  ["ちゃ", "cha"], ["ちゅ", "chu"], ["ちょ", "cho"],
  ["にゃ", "nya"], ["にゅ", "nyu"], ["にょ", "nyo"],
  ["ひゃ", "hya"], ["ひゅ", "hyu"], ["ひょ", "hyo"],
  ["みゃ", "mya"], ["みゅ", "myu"], ["みょ", "myo"],
  ["りゃ", "rya"], ["りゅ", "ryu"], ["りょ", "ryo"],
  ["ぎゃ", "gya"], ["ぎゅ", "gyu"], ["ぎょ", "gyo"],
  ["じゃ", "ja"], ["じゅ", "ju"], ["じょ", "jo"],
  ["びゃ", "bya"], ["びゅ", "byu"], ["びょ", "byo"],
  ["ぴゃ", "pya"], ["ぴゅ", "pyu"], ["ぴょ", "pyo"],
];

const SMALL: Row[] = [
  ["ぁ", "a"], ["ぃ", "i"], ["ぅ", "u"], ["ぇ", "e"], ["ぉ", "o"],
  ["ゃ", "ya"], ["ゅ", "yu"], ["ょ", "yo"],
];

function build(rows: Row[], group: KanaGroup): KanaCard[] {
  return rows.map(([character, romaji, example, exampleReading, exampleMeaning], i) => ({
    id: `hiragana-${group}-${String(i + 1).padStart(2, "0")}`,
    type: "kana",
    script: "hiragana",
    group,
    character,
    romaji,
    ...(example ? { example, exampleReading, exampleMeaning } : {}),
  }));
}

export const HIRAGANA_BASIC = build(BASIC, "basic");
export const HIRAGANA_DAKUTEN = build(DAKUTEN, "dakuten");
export const HIRAGANA_HANDAKUTEN = build(HANDAKUTEN, "handakuten");
export const HIRAGANA_COMBINATION = build(COMBINATION, "combination");
export const HIRAGANA_SMALL = build(SMALL, "small");

// っ ditambahkan manual karena romaji-nya bukan bacaan biasa (lihat §5 brief)
HIRAGANA_SMALL.push({
  id: "hiragana-small-09",
  type: "kana",
  script: "hiragana",
  group: "small",
  character: "っ",
  romaji: "",
  note: "tsu kecil · penanda konsonan ganda",
});

export const HIRAGANA_ALL: KanaCard[] = [
  ...HIRAGANA_BASIC,
  ...HIRAGANA_DAKUTEN,
  ...HIRAGANA_HANDAKUTEN,
  ...HIRAGANA_COMBINATION,
  ...HIRAGANA_SMALL,
];
