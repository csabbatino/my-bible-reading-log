import { BIBLE_DATA, TOTAL_CHAPTERS, HEBREW_CHAPTERS, GREEK_CHAPTERS } from "./bibleData.js";

// All possible badges a user can earn
export const BADGES = {
  // Book completion badges (66 total)
  ...Object.fromEntries(
    Object.values(BIBLE_DATA.hebrew.sections)
      .flatMap((s) => s.books)
      .concat(Object.values(BIBLE_DATA.greek.sections).flatMap((s) => s.books))
      .map((book) => [
        `book_${book.id}`,
        {
          id: `book_${book.id}`,
          type: "book",
          bookId: book.id,
          label: `Finished ${book.name}`,
          emoji: "📖",
          description: `Completed all ${book.chapters} chapters of ${book.name}`,
        },
      ])
  ),

  // Section badges
  law_complete: { id: "law_complete", type: "section", label: "The Law Complete", emoji: "⚖️", description: "Finished all 5 books of the Law" },
  history_ot_complete: { id: "history_ot_complete", type: "section", label: "OT History Complete", emoji: "🏛️", description: "Finished all 12 OT History books" },
  poetry_complete: { id: "poetry_complete", type: "section", label: "Poetry & Wisdom Complete", emoji: "🎵", description: "Finished Job, Psalms, Proverbs, Ecclesiastes & Song of Solomon" },
  major_prophets_complete: { id: "major_prophets_complete", type: "section", label: "Major Prophets Complete", emoji: "📯", description: "Finished all 5 Major Prophet books" },
  minor_prophets_complete: { id: "minor_prophets_complete", type: "section", label: "Minor Prophets Complete", emoji: "🕊️", description: "Finished all 12 Minor Prophet books" },
  gospels_complete: { id: "gospels_complete", type: "section", label: "Gospels Complete", emoji: "✝️", description: "Finished Matthew, Mark, Luke & John" },
  paul_letters_complete: { id: "paul_letters_complete", type: "section", label: "Paul's Letters Complete", emoji: "✉️", description: "Finished all of Paul's letters" },
  general_letters_complete: { id: "general_letters_complete", type: "section", label: "General Letters Complete", emoji: "📜", description: "Finished all General Letters" },

  // Testament badges
  hebrew_complete: { id: "hebrew_complete", type: "testament", label: "Hebrew Scriptures Complete", emoji: "✡️", description: `Finished all ${HEBREW_CHAPTERS} chapters of the Hebrew Scriptures` },
  greek_complete: { id: "greek_complete", type: "testament", label: "Greek Scriptures Complete", emoji: "🏺", description: `Finished all ${GREEK_CHAPTERS} chapters of the Greek Scriptures` },

  // Milestone badges
  first_chapter: { id: "first_chapter", type: "milestone", label: "First Step", emoji: "👣", description: "Read your very first chapter" },
  chapters_10: { id: "chapters_10", type: "milestone", label: "10 Chapters", emoji: "🌱", description: "Read 10 chapters" },
  chapters_50: { id: "chapters_50", type: "milestone", label: "50 Chapters", emoji: "🌿", description: "Read 50 chapters" },
  chapters_100: { id: "chapters_100", type: "milestone", label: "Century Reader", emoji: "💯", description: "Read 100 chapters" },
  chapters_250: { id: "chapters_250", type: "milestone", label: "250 Chapters", emoji: "🌳", description: "Read 250 chapters" },
  chapters_500: { id: "chapters_500", type: "milestone", label: "Halfway There", emoji: "⭐", description: "Read 500 chapters — halfway through the Bible!" },
  chapters_750: { id: "chapters_750", type: "milestone", label: "750 Chapters", emoji: "🌟", description: "Read 750 chapters" },
  chapters_1000: { id: "chapters_1000", type: "milestone", label: "1,000 Chapters", emoji: "🏆", description: "Read 1,000 chapters" },
  bible_complete: { id: "bible_complete", type: "milestone", label: "Bible Complete! 🎉", emoji: "👑", description: `Read all ${TOTAL_CHAPTERS} chapters of the Bible!` },

  // Streak badges
  streak_7: { id: "streak_7", type: "streak", label: "7-Day Streak", emoji: "🔥", description: "Read for 7 days in a row" },
  streak_30: { id: "streak_30", type: "streak", label: "30-Day Streak", emoji: "🔥🔥", description: "Read for 30 days in a row" },
  streak_100: { id: "streak_100", type: "streak", label: "100-Day Streak", emoji: "🔥🔥🔥", description: "Read for 100 days in a row" },
};

// Check which badges should be newly awarded given progress and streak
export function checkNewBadges(progress, streak, previouslyEarned = []) {
  const earned = new Set(previouslyEarned);
  const newBadges = [];

  const totalRead = Object.values(progress).reduce((s, b) => s + Object.keys(b).length, 0);

  const countForBook = (bookId) => Object.keys(progress[bookId] || {}).length;
  const countForSection = (section) => section.books.reduce((s, b) => s + countForBook(b.id), 0);

  // Book badges
  for (const [testamentKey, testament] of Object.entries(BIBLE_DATA)) {
    for (const section of Object.values(testament.sections)) {
      for (const book of section.books) {
        const badgeId = `book_${book.id}`;
        if (!earned.has(badgeId) && countForBook(book.id) >= book.chapters) {
          newBadges.push(BADGES[badgeId]);
          earned.add(badgeId);
        }
      }
    }
  }

  // Section badges
  const sectionChecks = [
    ["law_complete", BIBLE_DATA.hebrew.sections.law],
    ["history_ot_complete", BIBLE_DATA.hebrew.sections.history],
    ["poetry_complete", BIBLE_DATA.hebrew.sections.poetry],
    ["major_prophets_complete", BIBLE_DATA.hebrew.sections.majorProphets],
    ["minor_prophets_complete", BIBLE_DATA.hebrew.sections.minorProphets],
    ["gospels_complete", BIBLE_DATA.greek.sections.gospels],
    ["paul_letters_complete", BIBLE_DATA.greek.sections.paulLetters],
    ["general_letters_complete", BIBLE_DATA.greek.sections.generalLetters],
  ];
  for (const [badgeId, section] of sectionChecks) {
    if (!earned.has(badgeId)) {
      const total = section.books.reduce((s, b) => s + b.chapters, 0);
      if (countForSection(section) >= total) {
        newBadges.push(BADGES[badgeId]);
        earned.add(badgeId);
      }
    }
  }

  // Testament badges
  if (!earned.has("hebrew_complete")) {
    const hebrewRead = Object.values(BIBLE_DATA.hebrew.sections).flatMap((s) => s.books).reduce((s, b) => s + countForBook(b.id), 0);
    if (hebrewRead >= HEBREW_CHAPTERS) { newBadges.push(BADGES.hebrew_complete); earned.add("hebrew_complete"); }
  }
  if (!earned.has("greek_complete")) {
    const greekRead = Object.values(BIBLE_DATA.greek.sections).flatMap((s) => s.books).reduce((s, b) => s + countForBook(b.id), 0);
    if (greekRead >= GREEK_CHAPTERS) { newBadges.push(BADGES.greek_complete); earned.add("greek_complete"); }
  }

  // Chapter milestones
  const milestones = [
    ["first_chapter", 1], ["chapters_10", 10], ["chapters_50", 50],
    ["chapters_100", 100], ["chapters_250", 250], ["chapters_500", 500],
    ["chapters_750", 750], ["chapters_1000", 1000],
  ];
  for (const [badgeId, threshold] of milestones) {
    if (!earned.has(badgeId) && totalRead >= threshold) {
      newBadges.push(BADGES[badgeId]); earned.add(badgeId);
    }
  }
  if (!earned.has("bible_complete") && totalRead >= TOTAL_CHAPTERS) {
    newBadges.push(BADGES.bible_complete); earned.add("bible_complete");
  }

  // Streak badges
  const streakMilestones = [["streak_7", 7], ["streak_30", 30], ["streak_100", 100]];
  for (const [badgeId, threshold] of streakMilestones) {
    if (!earned.has(badgeId) && streak >= threshold) {
      newBadges.push(BADGES[badgeId]); earned.add(badgeId);
    }
  }

  return newBadges;
}

// Get all earned badge IDs from progress
export function getAllEarnedBadges(progress, streak) {
  return checkNewBadges(progress, streak, []).map((b) => b.id);
}
