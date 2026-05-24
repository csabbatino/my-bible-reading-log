// JW.org URL slugs for all 66 books
// Used to construct chapter links and introduction links
// Pattern: https://www.jw.org/en/library/bible/study-bible/books/[slug]/[chapter]/
// Intro:   https://www.jw.org/en/library/bible/study-bible/books/[slug]-introduction/

export const JW_SLUGS = {
  gen: "genesis",
  exo: "exodus",
  lev: "leviticus",
  num: "numbers",
  deu: "deuteronomy",
  jos: "joshua",
  jdg: "judges",
  rut: "ruth",
  "1sa": "1-samuel",
  "2sa": "2-samuel",
  "1ki": "1-kings",
  "2ki": "2-kings",
  "1ch": "1-chronicles",
  "2ch": "2-chronicles",
  ezr: "ezra",
  neh: "nehemiah",
  est: "esther",
  job: "job",
  psa: "psalms",
  pro: "proverbs",
  ecc: "ecclesiastes",
  sng: "song-of-solomon",
  isa: "isaiah",
  jer: "jeremiah",
  lam: "lamentations",
  eze: "ezekiel",
  dan: "daniel",
  hos: "hosea",
  joe: "joel",
  amo: "amos",
  oba: "obadiah",
  jon: "jonah",
  mic: "micah",
  nah: "nahum",
  hab: "habakkuk",
  zep: "zephaniah",
  hag: "haggai",
  zec: "zechariah",
  mal: "malachi",
  mat: "matthew",
  mar: "mark",
  luk: "luke",
  joh: "john",
  act: "acts",
  rom: "romans",
  "1co": "1-corinthians",
  "2co": "2-corinthians",
  gal: "galatians",
  eph: "ephesians",
  php: "philippians",
  col: "colossians",
  "1th": "1-thessalonians",
  "2th": "2-thessalonians",
  "1ti": "1-timothy",
  "2ti": "2-timothy",
  tit: "titus",
  phm: "philemon",
  heb: "hebrews",
  jas: "james",
  "1pe": "1-peter",
  "2pe": "2-peter",
  "1jo": "1-john",
  "2jo": "2-john",
  "3jo": "3-john",
  jud: "jude",
  rev: "revelation",
};

const BASE = "https://www.jw.org/en/library/bible/study-bible/books";

export function getChapterUrl(bookId, chapter) {
  const slug = JW_SLUGS[bookId];
  if (!slug) return null;
  return `${BASE}/${slug}/${chapter}/`;
}

export function getIntroUrl(bookId) {
  const slug = JW_SLUGS[bookId];
  if (!slug) return null;
  return `${BASE}/${slug}-introduction/`;
}
