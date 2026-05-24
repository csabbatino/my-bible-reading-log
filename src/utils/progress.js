import { BIBLE_DATA, TOTAL_CHAPTERS, HEBREW_CHAPTERS, GREEK_CHAPTERS, ALL_BOOKS } from "../data/bibleData.js";

export function countReadChapters(progress) {
  let total = 0;
  for (const bookProgress of Object.values(progress)) {
    total += Object.keys(bookProgress).length;
  }
  return total;
}

export function countReadForBook(progress, bookId) {
  return Object.keys(progress[bookId] || {}).length;
}

export function pctForBook(progress, book) {
  const read = countReadForBook(progress, book.id);
  return book.chapters > 0 ? Math.round((read / book.chapters) * 100) : 0;
}

export function pctForSection(progress, section) {
  const total = section.books.reduce((s, b) => s + b.chapters, 0);
  const read = section.books.reduce((s, b) => s + countReadForBook(progress, b.id), 0);
  return total > 0 ? Math.round((read / total) * 100) : 0;
}

export function overallPct(progress) {
  return Math.round((countReadChapters(progress) / TOTAL_CHAPTERS) * 100);
}

export function hebrewPct(progress) {
  const read = Object.values(BIBLE_DATA.hebrew.sections)
    .flatMap((s) => s.books)
    .reduce((s, b) => s + countReadForBook(progress, b.id), 0);
  return Math.round((read / HEBREW_CHAPTERS) * 100);
}

export function greekPct(progress) {
  const read = Object.values(BIBLE_DATA.greek.sections)
    .flatMap((s) => s.books)
    .reduce((s, b) => s + countReadForBook(progress, b.id), 0);
  return Math.round((read / GREEK_CHAPTERS) * 100);
}

export function getCurrentStreak(progress) {
  const readDates = new Set();
  for (const bookProgress of Object.values(progress)) {
    for (const dateStr of Object.values(bookProgress)) {
      if (dateStr) readDates.add(dateStr);
    }
  }
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    if (readDates.has(dateStr)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

export function calculateLongestStreak(progress) {
  // Build sorted list of all unique read dates
  const readDates = new Set();
  for (const bookProgress of Object.values(progress)) {
    for (const dateStr of Object.values(bookProgress)) {
      if (dateStr) readDates.add(dateStr);
    }
  }
  if (readDates.size === 0) return 0;

  const sorted = Array.from(readDates).sort();
  let longest = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
}

export function getRecentActivity(progress, limit = 10) {
  const items = [];
  for (const [bookId, chapters] of Object.entries(progress)) {
    for (const [chapter, dateStr] of Object.entries(chapters)) {
      if (dateStr) items.push({ bookId, chapter: parseInt(chapter), dateStr });
    }
  }
  items.sort((a, b) => new Date(b.dateStr) - new Date(a.dateStr));
  return items.slice(0, limit);
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (dateStr === today.toISOString().split("T")[0]) return "Today";
  if (dateStr === yesterday.toISOString().split("T")[0]) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export function pctForPsalmsBook(progress, subBook) {
  const chapters = progress["psa"] || {};
  let read = 0;
  for (let ch = subBook.start; ch <= subBook.end; ch++) {
    if (chapters[ch]) read++;
  }
  return Math.round((read / (subBook.end - subBook.start + 1)) * 100);
}

export function getSevenDayPace(progress) {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  const fromStr = sevenDaysAgo.toISOString().split("T")[0];
  const toStr = today.toISOString().split("T")[0];
  let count = 0;
  for (const bookProgress of Object.values(progress)) {
    for (const dateStr of Object.values(bookProgress)) {
      if (dateStr >= fromStr && dateStr <= toStr) count++;
    }
  }
  return Math.round((count / 7) * 10) / 10;
}
