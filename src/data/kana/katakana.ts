/**
 * Dataset Katakana. Konten murni — jangan diubah saat user belajar.
 * Format baris: [character, romaji, example?, exampleReading?, exampleMeaning?]
 */
import type { KanaCard, KanaGroup } from "./types.js";

type Row = [string, string, string?, string?, string?];

const BASIC: Row[] = [
  ["ア", "a", "アニメ", "anime", "anime"],
  ["イ", "i", "イメージ", "imeeji", "citra/gambaran"],
  ["ウ", "u", "ウェブ", "webu", "web"],
  ["エ", "e", "エレベーター", "erebeetaa", "lift"],
  ["オ", "o", "オレンジ", "orenji", "jeruk"],
  ["カ", "ka", "カメラ", "kamera", "kamera"],
  ["キ", "ki", "キーボード", "kiiboodo", "keyboard"],
  ["ク", "ku", "クラス", "kurasu", "kelas"],
  ["ケ", "ke", "ケーキ", "keeki", "kue"],
  ["コ", "ko", "コーヒー", "koohii", "kopi"],
  ["サ", "sa", "サッカー", "sakkaa", "sepak bola"],
  ["シ", "shi", "シャツ", "shatsu", "kemeja"],
  ["ス", "su", "スーパー", "suupaa", "supermarket"],
  ["セ", "se", "セーター", "seetaa", "sweater"],
  ["ソ", "so", "ソファ", "sofaa", "sofa"],
  ["タ", "ta", "タクシー", "takushii", "taksi"],
  ["チ", "chi", "チーズ", "chiizu", "keju"],
  ["ツ", "tsu", "ツアー", "tsuaa", "tur"],
  ["テ", "te", "テーブル", "teeburu", "meja"],
  ["ト", "to", "トイレ", "toire", "toilet"],
  ["ナ", "na", "ナイフ", "naifu", "pisau"],
  ["ニ", "ni", "ニュース", "nyuusu", "berita"],
  ["ヌ", "nu", "ヌードル", "nuudoru", "mi"],
  ["ネ", "ne", "ネクタイ", "nekutai", "dasi"],
  ["ノ", "no", "ノート", "nooto", "buku catatan"],
  ["ハ", "ha", "ハンバーガー", "hanbaagaa", "hamburger"],
  ["ヒ", "hi", "ヒーター", "hiitaa", "pemanas"],
  ["フ", "fu", "フランス", "furansu", "Prancis"],
  ["ヘ", "he", "ヘリコプター", "herikoputaa", "helikopter"],
  ["ホ", "ho", "ホテル", "hoteru", "hotel"],
  ["マ", "ma", "マスク", "masuku", "masker"],
  ["ミ", "mi", "ミルク", "miruku", "susu"],
  ["ム", "mu", "ムービー", "muubii", "film"],
  ["メ", "me", "メール", "meeru", "email"],
  ["モ", "mo", "モデル", "moderu", "model"],
  ["ヤ", "ya", "ヤフー", "yafuu", "Yahoo"],
  ["ユ", "yu", "ユーチューブ", "yuuchuubu", "YouTube"],
  ["ヨ", "yo", "ヨーロッパ", "yooroopaa", "Eropa"],
  ["ラ", "ra", "ラジオ", "rajio", "radio"],
  ["リ", "ri", "リモコン", "rimokon", "remote"],
  ["ル", "ru", "ルール", "ruuru", "aturan"],
  ["レ", "re", "レストラン", "resutoran", "restoran"],
  ["ロ", "ro", "ロボット", "robotto", "robot"],
  ["ワ", "wa", "ワイン", "wain", "anggur (wine)"],
  ["ヲ", "wo"],
  ["ン", "n", "ペン", "pen", "pulpen"],
];

const DAKUTEN: Row[] = [
  ["ガ", "ga"], ["ギ", "gi"], ["グ", "gu"], ["ゲ", "ge"], ["ゴ", "go"],
  ["ザ", "za"], ["ジ", "ji"], ["ズ", "zu"], ["ゼ", "ze"], ["ゾ", "zo"],
  ["ダ", "da"], ["ヂ", "ji"], ["ヅ", "zu"], ["デ", "de"], ["ド", "do"],
  ["バ", "ba"], ["ビ", "bi"], ["ブ", "bu"], ["ベ", "be"], ["ボ", "bo"],
];

const HANDAKUTEN: Row[] = [
  ["パ", "pa"], ["ピ", "pi"], ["プ", "pu"], ["ペ", "pe"], ["ポ", "po"],
];

const COMBINATION: Row[] = [
  ["キャ", "kya"], ["キュ", "kyu"], ["キョ", "kyo"],
  ["シャ", "sha"], ["シュ", "shu"], ["ショ", "sho"],
  ["チャ", "cha"], ["チュ", "chu"], ["チョ", "cho"],
  ["ニャ", "nya"], ["ニュ", "nyu"], ["ニョ", "nyo"],
  ["ヒャ", "hya"], ["ヒュ", "hyu"], ["ヒョ", "hyo"],
  ["ミャ", "mya"], ["ミュ", "myu"], ["ミョ", "myo"],
  ["リャ", "rya"], ["リュ", "ryu"], ["リョ", "ryo"],
  ["ギャ", "gya"], ["ギュ", "gyu"], ["ギョ", "gyo"],
  ["ジャ", "ja"], ["ジュ", "ju"], ["ジョ", "jo"],
  ["ビャ", "bya"], ["ビュ", "byu"], ["ビョ", "byo"],
  ["ピャ", "pya"], ["ピュ", "pyu"], ["ピョ", "pyo"],
];

const SMALL: Row[] = [
  ["ァ", "a"], ["ィ", "i"], ["ゥ", "u"], ["ェ", "e"], ["ォ", "o"],
  ["ャ", "ya"], ["ュ", "yu"], ["ョ", "yo"],
];

function build(rows: Row[], group: KanaGroup): KanaCard[] {
  return rows.map(([character, romaji, example, exampleReading, exampleMeaning], i) => ({
    id: `katakana-${group}-${String(i + 1).padStart(2, "0")}`,
    type: "kana",
    script: "katakana",
    group,
    character,
    romaji,
    ...(example ? { example, exampleReading, exampleMeaning } : {}),
  }));
}

export const KATAKANA_BASIC = build(BASIC, "basic");
export const KATAKANA_DAKUTEN = build(DAKUTEN, "dakuten");
export const KATAKANA_HANDAKUTEN = build(HANDAKUTEN, "handakuten");
export const KATAKANA_COMBINATION = build(COMBINATION, "combination");
export const KATAKANA_SMALL = build(SMALL, "small");

// ッ ditambahkan manual karena romaji-nya bukan bacaan biasa (lihat §5 brief)
KATAKANA_SMALL.push({
  id: "katakana-small-09",
  type: "kana",
  script: "katakana",
  group: "small",
  character: "ッ",
  romaji: "",
  note: "tsu kecil · penanda konsonan ganda",
});

export const KATAKANA_ALL: KanaCard[] = [
  ...KATAKANA_BASIC,
  ...KATAKANA_DAKUTEN,
  ...KATAKANA_HANDAKUTEN,
  ...KATAKANA_COMBINATION,
  ...KATAKANA_SMALL,
];
