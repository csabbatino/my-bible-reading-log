import { useState } from "react";
import { ProgressBar, Divider, Button, Modal } from "../components/UI.jsx";
import { pctForBook, pctForSection, countReadForBook, todayStr } from "../utils/progress.js";
import { markChapterRead } from "../utils/firebase.js";
import { BIBLE_DATA, BOOK_MAP } from "../data/bibleData.js";

// Shared mark-all modal — rendered once at the Books level
function MarkAllModal({ book, uid, progress, isOpen, onClose }) {
  const [date, setDate] = useState(todayStr());
  const [saving, setSaving] = useState(false);

  if (!book) return null;

  const readCount = countReadForBook(progress, book.id);
  const unreadCount = book.chapters - readCount;

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const dateToUse = date || todayStr();
      const unread = Array.from({ length: book.chapters }, (_, i) => i + 1)
        .filter((ch) => !(progress[book.id] || {})[ch]);
      await Promise.all(unread.map((ch) => markChapterRead(uid, book.id, ch, dateToUse)));
      onClose();
    } catch (e) {
      alert("Error marking chapters: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Mark all — ${book.name}`}>
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.6 }}>
        When did you finish {book.name}? This date will be applied to all{" "}
        {unreadCount} unread chapter{unreadCount !== 1 ? "s" : ""}.
        Chapters you've already marked will not be changed.
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>Date read</div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{
            width: "100%", boxSizing: "border-box", padding: "10px 12px",
            borderRadius: 8, background: "var(--bg)",
            border: "1px solid var(--accent)", color: "var(--text)",
            fontSize: 14, outline: "none",
          }}
        />
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Button variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
        <Button onClick={handleConfirm} disabled={saving} style={{ flex: 1 }}>
          {saving ? "Saving…" : "Mark all"}
        </Button>
      </div>
    </Modal>
  );
}

function BookRow({ book, progress, onNavigate, onMarkAll }) {
  const pct = pctForBook(progress, book);
  const read = countReadForBook(progress, book.id);

  const handleBoxClick = (e) => {
    e.stopPropagation();
    if (pct < 100) onMarkAll(book);
    // If already 100% complete the box does nothing (already a checkmark)
  };

  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Clickable box — navigates to chapters if complete, opens mark-all if not */}
      <div
        onClick={handleBoxClick}
        style={{
          width: 34, height: 34, borderRadius: 9,
          background: pct === 100 ? "rgba(var(--green-rgb,90,158,111),0.2)" : "var(--surface)",
          border: `1px solid ${pct === 100 ? "var(--green)" : "var(--border)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, flexShrink: 0,
          cursor: pct < 100 ? "pointer" : "default",
        }}
      >
        {pct === 100 ? "✓" : pct > 0 ? "📖" : "○"}
      </div>

      {/* Book info — clicking navigates into chapters */}
      <div
        onClick={() => onNavigate("chapters", { bookId: book.id })}
        style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
          <span style={{ fontSize: 14, color: pct > 0 ? "var(--text)" : "var(--text-muted)", fontFamily: "'Nunito', system-ui, sans-serif" }}>
            {book.name}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap", marginLeft: 8 }}>
            {read}/{book.chapters}
            {pct < 100 && (
              <>
                {" · "}
                <span
                  onClick={(e) => { e.stopPropagation(); onMarkAll(book); }}
                  style={{ color: "var(--accent)", textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: 2, cursor: "pointer" }}
                >
                  Mark all as read
                </span>
              </>
            )}
          </span>
        </div>
        <ProgressBar pct={pct} color={pct === 100 ? "var(--green)" : "var(--accent)"} />
      </div>

      <span
        onClick={() => onNavigate("chapters", { bookId: book.id })}
        style={{ fontSize: 14, color: "var(--text-muted)", cursor: "pointer" }}
      >›</span>
    </div>
  );
}

function SectionAccordion({ sectionKey, section, progress, onNavigate, onMarkAll, testament, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const pct = pctForSection(progress, section);
  const total = section.books.reduce((s, b) => s + b.chapters, 0);
  const read = section.books.reduce((s, b) => s + countReadForBook(progress, b.id), 0);

  return (
    <div style={{ marginBottom: 4 }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
          background: "var(--surface)", borderRadius: open ? "12px 12px 0 0" : 12,
          border: "1px solid var(--border)", cursor: "pointer",
          borderBottom: open ? "none" : "1px solid var(--border)",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 13, color: "var(--text)", fontFamily: "'Nunito', system-ui, sans-serif", fontWeight: "bold" }}>
              {section.label}
            </span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{read}/{total} · {pct}%</span>
          </div>
          <ProgressBar pct={pct} color={testament === "hebrew" ? "var(--hebrew)" : "var(--greek)"} height={4} />
        </div>
        <span style={{ fontSize: 14, color: "var(--text-muted)", transform: open ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>›</span>
      </div>
      {open && (
        <div style={{ padding: "0 12px 4px", background: "var(--surface)", borderRadius: "0 0 12px 12px", border: "1px solid var(--border)", borderTop: "1px solid var(--border)" }}>
          {section.books.map((book) => (
            <BookRow
              key={book.id}
              book={book}
              progress={progress}
              onNavigate={onNavigate}
              onMarkAll={onMarkAll}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Books({ progress, onNavigate, initialTestament, uid }) {
  const [tab, setTab] = useState(initialTestament || "all");
  const [markAllBook, setMarkAllBook] = useState(null); // book object for the modal

  const tabs = [
    { id: "all", label: "All" },
    { id: "hebrew", label: "Hebrew" },
    { id: "greek", label: "Greek" },
  ];

  const testaments = tab === "all"
    ? [["hebrew", BIBLE_DATA.hebrew], ["greek", BIBLE_DATA.greek]]
    : [[tab, BIBLE_DATA[tab]]];

  return (
    <div id="tour-books-list" style={{ paddingBottom: 16 }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: "8px 0", borderRadius: 10, fontSize: 13,
              background: tab === t.id ? "var(--accent)" : "var(--surface)",
              color: tab === t.id ? "var(--bg)" : "var(--text-muted)",
              border: `1px solid ${tab === t.id ? "var(--accent)" : "var(--border)"}`,
              cursor: "pointer", fontFamily: "'Nunito', system-ui, sans-serif",
              fontWeight: tab === t.id ? "bold" : "normal",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {testaments.map(([testamentKey, testament]) => (
        <div key={testamentKey}>
          <Divider label={testament.label} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {Object.entries(testament.sections).map(([sectionKey, section], i) => (
              <SectionAccordion
                key={sectionKey}
                sectionKey={sectionKey}
                section={section}
                progress={progress}
                onNavigate={onNavigate}
                onMarkAll={(book) => setMarkAllBook(book)}
                testament={testamentKey}
                defaultOpen={i === 0 && tab !== "all"}
              />
            ))}
          </div>
        </div>
      ))}

      <MarkAllModal
        book={markAllBook}
        uid={uid}
        progress={progress}
        isOpen={!!markAllBook}
        onClose={() => setMarkAllBook(null)}
      />
    </div>
  );
}
