import { useState, useEffect, useCallback } from "react";
import { Checkbox, ProgressBar, Button, Modal, Badge, Divider, Spinner } from "../components/UI.jsx";
import { markChapterRead, unmarkChapter, saveNote, listenToBookNotes } from "../utils/firebase.js";
import { getEarnedBadges, saveEarnedBadges, sendFamilyNotification } from "../utils/goals.js";
import { checkNewBadges, shouldNotifyFamily, getFamilyNotificationMessage } from "../data/badges.js";
import { todayStr, formatDate, pctForPsalmsBook } from "../utils/progress.js";
import { BOOK_MAP } from "../data/bibleData.js";
import { BOOK_INFO } from "../data/bookInfo.js";
import { getChapterUrl, getIntroUrl } from "../data/jwLinks.js";
import BadgeCelebration from "../components/BadgeCelebration.jsx";

function BookInfoPanel({ bookId }) {
  const info = BOOK_INFO[bookId];
  const book = BOOK_MAP[bookId];
  const introUrl = getIntroUrl(bookId);
  if (!info) return null;

  return (
    <div id="tour-book-info" style={{
      background: "var(--surface)", borderRadius: 12, padding: "12px 14px",
      border: "1px solid var(--border)", marginBottom: 12,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: "var(--accent)", letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700 }}>
          About This Book
        </div>
        {introUrl && (
          <a id="tour-intro-link" href={introUrl} target="_blank" rel="noopener noreferrer"
            style={{
              fontSize: 12, color: "var(--accent)", fontWeight: 700,
              textDecoration: "underline", textUnderlineOffset: 2,
            }}>
            Introduction to {book?.name} ↗
          </a>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "5px 10px", fontSize: 12 }}>
        {[
          ["Writer", info.writer],
          ["Written in", info.placeWritten],
          ["Completed", info.writingCompleted],
          info.timeCovered ? ["Time covered", info.timeCovered] : null,
        ].filter(Boolean).map(([label, value]) => (
          <>
            <span key={label + "l"} style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}>{label}</span>
            <span key={label + "v"} style={{ color: "var(--text)" }}>{value}</span>
          </>
        ))}
      </div>
    </div>
  );
}

function NoteEditor({ uid, bookId, chapter, initialNote, onClose, familyNotes }) {
  const [text, setText] = useState(initialNote?.text || "");
  const [isPublic, setIsPublic] = useState(initialNote?.isPublic || false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveNote(uid, bookId, chapter, text, isPublic);
      onClose();
    } catch (e) {
      alert("Error saving note: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <textarea
        value={text} onChange={(e) => setText(e.target.value)}
        placeholder="What struck you about this chapter? Any insights or reflections..."
        style={{
          width: "100%", minHeight: 120, background: "var(--bg)", border: "1px solid var(--border)",
          borderRadius: 10, padding: "10px 12px", color: "var(--text)", fontSize: 14,
          resize: "vertical", outline: "none", boxSizing: "border-box",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, marginBottom: 16 }}>
        <div onClick={() => setIsPublic(!isPublic)} style={{
          width: 36, height: 20, borderRadius: 10,
          background: isPublic ? "var(--green)" : "var(--border)",
          position: "relative", cursor: "pointer", transition: "background 0.2s",
        }}>
          <div style={{ position: "absolute", top: 2, left: isPublic ? 18 : 2, width: 16, height: 16, borderRadius: 8, background: "#fff", transition: "left 0.2s" }} />
        </div>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
          {isPublic ? "Visible to family" : "Private (only you)"}
        </span>
      </div>

      {familyNotes?.length > 0 && (
        <>
          <Divider label="Family Notes" />
          {familyNotes.map((n, i) => (
            <div key={i} style={{ background: "var(--bg)", borderRadius: 10, padding: "10px 12px", marginBottom: 8, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, color: "var(--accent)", marginBottom: 4, fontWeight: 600 }}>{n.displayName || "Family member"}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>{n.text}</div>
            </div>
          ))}
        </>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <Button onClick={onClose} variant="ghost" style={{ flex: 1 }}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
          {saving ? "Saving…" : "Save Note"}
        </Button>
      </div>
    </div>
  );
}

function ChapterRow({ bookId, chapter, isRead, dateStr, note, onToggle, onDateChange, onNoteClick }) {
  const [editingDate, setEditingDate] = useState(false);
  const chapterUrl = getChapterUrl(bookId, chapter);
  const isFirstChapter = chapter === 1;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "10px 10px",
      borderRadius: 10, marginBottom: 5,
      background: isRead ? "rgba(90,158,111,0.1)" : "var(--card)",
      border: `1px solid ${isRead ? "var(--green)" : "var(--border)"}`,
    }}>
      <Checkbox checked={isRead} onChange={onToggle} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, color: isRead ? "var(--text)" : "var(--text-muted)", fontWeight: 500 }}>
            Chapter {chapter}
          </span>
          {chapterUrl && (
            <a
              id={isFirstChapter ? "tour-read-link" : undefined}
              href={chapterUrl} target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                fontSize: 11, color: "var(--accent)", textDecoration: "none",
                fontWeight: 600, padding: "1px 6px", borderRadius: 4,
                border: "1px solid var(--accent)", opacity: 0.8,
              }}
            >
              Read ↗
            </a>
          )}
        </div>
        {isRead && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
            {editingDate ? (
              <input type="date" defaultValue={dateStr}
                onBlur={(e) => { onDateChange(e.target.value); setEditingDate(false); }}
                autoFocus
                style={{ background: "var(--bg)", border: "1px solid var(--accent)", borderRadius: 6, padding: "2px 6px", color: "var(--accent)", fontSize: 11, outline: "none" }}
              />
            ) : (
              <span onClick={() => setEditingDate(true)} style={{ fontSize: 11, color: "var(--text-muted)", cursor: "pointer" }}>
                {formatDate(dateStr)} ✏️
              </span>
            )}
          </div>
        )}
      </div>
      {isRead && (
        <div id={isFirstChapter ? "tour-notes" : undefined} onClick={onNoteClick} style={{ fontSize: 18, cursor: "pointer", opacity: note?.text ? 1 : 0.3, padding: "0 4px" }}>
          {note?.text ? (note.isPublic ? "💬" : "📝") : "📝"}
        </div>
      )}
    </div>
  );
}

export default function Chapters({ uid, bookId, progress, onNavigate, familyGroupId, familyMemberUids = [] }) {
  const book = BOOK_MAP[bookId];
  const [notes, setNotes] = useState({});
  const [noteModal, setNoteModal] = useState(null);
  const [newBadges, setNewBadges] = useState([]);

  useEffect(() => {
    if (!uid || !bookId) return;
    const unsub = listenToBookNotes(uid, bookId, setNotes);
    return unsub;
  }, [uid, bookId]);

  const bookProgress = progress[bookId] || {};

  const checkBadges = useCallback(async () => {
    try {
      const earned = await getEarnedBadges(uid);
      const { getCurrentStreak } = await import("../utils/progress.js");
      const streak = getCurrentStreak(progress);
      const fresh = checkNewBadges(progress, streak, earned);
      if (fresh.length > 0) {
        await saveEarnedBadges(uid, [...earned, ...fresh.map((b) => b.id)]);
        setNewBadges(fresh);
        // Send family notifications for qualifying badges
        if (familyGroupId) {
          const { getDoc, doc } = await import("firebase/firestore");
          const { db } = await import("../utils/firebase.js");
          const userSnap = await getDoc(doc(db, "users", uid));
          const displayName = userSnap.exists() ? userSnap.data().displayName || "A family member" : "A family member";
          for (const badge of fresh) {
            if (shouldNotifyFamily(badge)) {
              const msg = getFamilyNotificationMessage(badge, displayName);
              if (msg) await sendFamilyNotification(familyGroupId, uid, msg.title, msg.body);
            }
          }
        }
      }
    } catch (e) { console.error("Badge check failed:", e); }
  }, [uid, progress, familyGroupId]);

  useEffect(() => { if (uid && progress) checkBadges(); }, [progress]);

  const handleToggle = useCallback(async (chapter) => {
    const isRead = !!bookProgress[chapter];
    try {
      if (isRead) await unmarkChapter(uid, bookId, chapter);
      else await markChapterRead(uid, bookId, chapter, todayStr());
    } catch (e) { alert("Error updating progress: " + e.message); }
  }, [uid, bookId, bookProgress]);

  const handleDateChange = useCallback(async (chapter, newDate) => {
    if (!newDate) return;
    try { await markChapterRead(uid, bookId, chapter, newDate); }
    catch (e) { alert("Error updating date: " + e.message); }
  }, [uid, bookId]);

  const [markAllModal, setMarkAllModal] = useState(false);
  const [markAllDate, setMarkAllDate] = useState("");

  const handleMarkAll = useCallback(async () => {
    const dateToUse = markAllDate || todayStr();
    const unread = Array.from({ length: book.chapters }, (_, i) => i + 1)
      .filter((ch) => !bookProgress[ch]);
    try {
      await Promise.all(unread.map((ch) => markChapterRead(uid, bookId, ch, dateToUse)));
      setMarkAllModal(false);
      setMarkAllDate("");
    } catch (e) { alert("Error marking chapters: " + e.message); }
  }, [uid, bookId, bookProgress, markAllDate, book]);

  if (!book) return <div style={{ color: "var(--text-muted)", padding: 20 }}>Book not found</div>;

  const readCount = Object.keys(bookProgress).length;
  const pct = Math.round((readCount / book.chapters) * 100);
  const hasPsalmsBooks = book.id === "psa" && book.subBooks;

  const renderChapterList = (start, end) =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i).map((ch) => (
      <ChapterRow
        key={ch} bookId={bookId} chapter={ch}
        isRead={!!bookProgress[ch]} dateStr={bookProgress[ch]}
        note={notes[ch]}
        onToggle={() => handleToggle(ch)}
        onDateChange={(d) => handleDateChange(ch, d)}
        onNoteClick={() => setNoteModal({ chapter: ch, familyNotes: [] })}
      />
    ));

  return (
    <div style={{ paddingBottom: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {readCount} of {book.chapters} chapters read
            {pct < 100 && (
              <>
                {" · "}
                <span
                  onClick={() => { setMarkAllDate(todayStr()); setMarkAllModal(true); }}
                  style={{ color: "var(--accent)", textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: 2, cursor: "pointer" }}
                >
                  Mark all as read
                </span>
              </>
            )}
          </div>
          <Badge color={pct === 100 ? "var(--green)" : "var(--accent)"}>{pct}%</Badge>
        </div>
        <ProgressBar pct={pct} color={pct === 100 ? "var(--green)" : "var(--accent)"} height={7} />
      </div>

      <BookInfoPanel bookId={bookId} />

      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12, fontStyle: "italic" }}>
        Tap a chapter to mark as read · Tap ✏️ to edit date · Tap 📝 for notes · Tap Read ↗ to open on JW.org
      </div>

      {hasPsalmsBooks ? (
        book.subBooks.map((sub) => {
          const subPct = pctForPsalmsBook(progress, sub);
          return (
            <div key={sub.label} style={{ marginBottom: 8 }}>
              <div style={{ padding: "8px 10px", background: "var(--surface)", borderRadius: 10, border: "1px solid var(--border)", marginBottom: 5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 700 }}>
                  {sub.label} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(Ps {sub.start}–{sub.end})</span>
                </span>
                <Badge color={subPct === 100 ? "var(--green)" : "var(--hebrew)"}>{subPct}%</Badge>
              </div>
              {renderChapterList(sub.start, sub.end)}
            </div>
          );
        })
      ) : (
        renderChapterList(1, book.chapters)
      )}

      <Modal isOpen={!!noteModal} onClose={() => setNoteModal(null)} title={`Notes — ${book.name} ${noteModal?.chapter}`}>
        {noteModal && (
          <NoteEditor uid={uid} bookId={bookId} chapter={noteModal.chapter}
            initialNote={notes[noteModal.chapter]}
            onClose={() => setNoteModal(null)}
            familyNotes={noteModal.familyNotes}
          />
        )}
      </Modal>

      {newBadges.length > 0 && (
        <BadgeCelebration badges={newBadges} onDone={() => setNewBadges([])} />
      )}

      <Modal isOpen={markAllModal} onClose={() => setMarkAllModal(false)} title={`Mark all — ${book.name}`}>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.6 }}>
          When did you finish {book.name}? This date will be applied to all{" "}
          {book.chapters - readCount} unread chapter{book.chapters - readCount !== 1 ? "s" : ""}.
          Chapters you've already marked will not be changed.
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>Date read</div>
          <input
            type="date"
            value={markAllDate}
            onChange={(e) => setMarkAllDate(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, background: "var(--bg)", border: "1px solid var(--accent)", color: "var(--text)", fontSize: 14, outline: "none" }}
          />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="ghost" onClick={() => setMarkAllModal(false)} style={{ flex: 1 }}>Cancel</Button>
          <Button onClick={handleMarkAll} style={{ flex: 1 }}>Mark all</Button>
        </div>
      </Modal>
    </div>
  );
}
