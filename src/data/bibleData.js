export const BIBLE_DATA = {
  hebrew: {
    label: "Hebrew Scriptures",
    color: "var(--hebrew)",
    sections: {
      law: {
        label: "The Law",
        books: [
          { id: "gen", name: "Genesis", chapters: 50 },
          { id: "exo", name: "Exodus", chapters: 40 },
          { id: "lev", name: "Leviticus", chapters: 27 },
          { id: "num", name: "Numbers", chapters: 36 },
          { id: "deu", name: "Deuteronomy", chapters: 34 },
        ],
      },
      promisedLand: {
        label: "Israel Enters the Promised Land",
        books: [
          { id: "jos", name: "Joshua", chapters: 24 },
          { id: "jdg", name: "Judges", chapters: 21 },
          { id: "rut", name: "Ruth", chapters: 4 },
        ],
      },
      kings: {
        label: "When the Kings Ruled Israel",
        books: [
          { id: "1sa", name: "1 Samuel", chapters: 31 },
          { id: "2sa", name: "2 Samuel", chapters: 24 },
          { id: "1ki", name: "1 Kings", chapters: 22 },
          { id: "2ki", name: "2 Kings", chapters: 25 },
          { id: "1ch", name: "1 Chronicles", chapters: 29 },
          { id: "2ch", name: "2 Chronicles", chapters: 36 },
        ],
      },
      exile: {
        label: "The Jews Return from Exile",
        books: [
          { id: "ezr", name: "Ezra", chapters: 10 },
          { id: "neh", name: "Nehemiah", chapters: 13 },
          { id: "est", name: "Esther", chapters: 10 },
        ],
      },
      poetry: {
        label: "Poetry & Wisdom",
        books: [
          { id: "job", name: "Job", chapters: 42 },
          {
            id: "psa", name: "Psalms", chapters: 150,
            subBooks: [
              { label: "Book I", start: 1, end: 41 },
              { label: "Book II", start: 42, end: 72 },
              { label: "Book III", start: 73, end: 89 },
              { label: "Book IV", start: 90, end: 106 },
              { label: "Book V", start: 107, end: 150 },
            ],
          },
          { id: "pro", name: "Proverbs", chapters: 31 },
          { id: "ecc", name: "Ecclesiastes", chapters: 12 },
          { id: "sng", name: "Song of Solomon", chapters: 8 },
        ],
      },
      majorProphets: {
        label: "Major Prophets",
        books: [
          { id: "isa", name: "Isaiah", chapters: 66 },
          { id: "jer", name: "Jeremiah", chapters: 52 },
          { id: "lam", name: "Lamentations", chapters: 5 },
          { id: "eze", name: "Ezekiel", chapters: 48 },
          { id: "dan", name: "Daniel", chapters: 12 },
        ],
      },
      minorProphets: {
        label: "Minor Prophets",
        books: [
          { id: "hos", name: "Hosea", chapters: 14 },
          { id: "joe", name: "Joel", chapters: 3 },
          { id: "amo", name: "Amos", chapters: 9 },
          { id: "oba", name: "Obadiah", chapters: 1 },
          { id: "jon", name: "Jonah", chapters: 4 },
          { id: "mic", name: "Micah", chapters: 7 },
          { id: "nah", name: "Nahum", chapters: 3 },
          { id: "hab", name: "Habakkuk", chapters: 3 },
          { id: "zep", name: "Zephaniah", chapters: 3 },
          { id: "hag", name: "Haggai", chapters: 2 },
          { id: "zec", name: "Zechariah", chapters: 14 },
          { id: "mal", name: "Malachi", chapters: 4 },
        ],
      },
    },
  },
  greek: {
    label: "Greek Scriptures",
    color: "var(--greek)",
    sections: {
      gospels: {
        label: "The Gospels",
        books: [
          { id: "mat", name: "Matthew", chapters: 28 },
          { id: "mar", name: "Mark", chapters: 16 },
          { id: "luk", name: "Luke", chapters: 24 },
          { id: "joh", name: "John", chapters: 21 },
        ],
      },
      earlyCongregation: {
        label: "Early Christian Congregation",
        books: [
          { id: "act", name: "Acts", chapters: 28 },
        ],
      },
      paulLetters: {
        label: "Paul's Letters",
        books: [
          { id: "rom", name: "Romans", chapters: 16 },
          { id: "1co", name: "1 Corinthians", chapters: 16 },
          { id: "2co", name: "2 Corinthians", chapters: 13 },
          { id: "gal", name: "Galatians", chapters: 6 },
          { id: "eph", name: "Ephesians", chapters: 6 },
          { id: "php", name: "Philippians", chapters: 4 },
          { id: "col", name: "Colossians", chapters: 4 },
          { id: "1th", name: "1 Thessalonians", chapters: 5 },
          { id: "2th", name: "2 Thessalonians", chapters: 3 },
          { id: "1ti", name: "1 Timothy", chapters: 6 },
          { id: "2ti", name: "2 Timothy", chapters: 4 },
          { id: "tit", name: "Titus", chapters: 3 },
          { id: "phm", name: "Philemon", chapters: 1 },
          { id: "heb", name: "Hebrews", chapters: 13 },
        ],
      },
      generalLetters: {
        label: "Writings of Other Apostles & Disciples",
        books: [
          { id: "jas", name: "James", chapters: 5 },
          { id: "1pe", name: "1 Peter", chapters: 5 },
          { id: "2pe", name: "2 Peter", chapters: 3 },
          { id: "1jo", name: "1 John", chapters: 5 },
          { id: "2jo", name: "2 John", chapters: 1 },
          { id: "3jo", name: "3 John", chapters: 1 },
          { id: "jud", name: "Jude", chapters: 1 },
        ],
      },
      prophecyNT: {
        label: "Prophecy",
        books: [
          { id: "rev", name: "Revelation", chapters: 22 },
        ],
      },
    },
  },
};

export const ALL_BOOKS = [];
export const BOOK_MAP = {};

const processTestament = (testament) => {
  Object.values(testament.sections).forEach((section) => {
    section.books.forEach((book) => {
      ALL_BOOKS.push(book);
      BOOK_MAP[book.id] = book;
    });
  });
};

processTestament(BIBLE_DATA.hebrew);
processTestament(BIBLE_DATA.greek);

export const TOTAL_CHAPTERS = ALL_BOOKS.reduce((sum, b) => sum + b.chapters, 0);

export const HEBREW_CHAPTERS = Object.values(BIBLE_DATA.hebrew.sections)
  .flatMap((s) => s.books)
  .reduce((sum, b) => sum + b.chapters, 0);

export const GREEK_CHAPTERS = Object.values(BIBLE_DATA.greek.sections)
  .flatMap((s) => s.books)
  .reduce((sum, b) => sum + b.chapters, 0);

export function getBookTestament(bookId) {
  for (const [testament, data] of Object.entries(BIBLE_DATA)) {
    for (const section of Object.values(data.sections)) {
      if (section.books.find((b) => b.id === bookId)) return testament;
    }
  }
  return null;
}

export function getBookSection(bookId) {
  for (const [testament, data] of Object.entries(BIBLE_DATA)) {
    for (const [sectionKey, section] of Object.entries(data.sections)) {
      if (section.books.find((b) => b.id === bookId))
        return { sectionKey, section, testament };
    }
  }
  return null;
}
