import { useState } from "react";
import { ProgressBar, Divider, Card, Badge } from "../components/UI.jsx";
import { pctForBook, pctForSection, countReadForBook, pctForPsalmsBook } from "../utils/progress.js";
import { BIBLE_DATA } from "../data/bibleData.js";

function BookRow({ book, progress, onClick }) {
  const pct = pctForBook(progress, book);
  const read = countReadForBook(progress, book.id);
  return (
    <div
      onClick={() => onClick(book.id)}
      style={{
        display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
        borderBottom: "1px solid var(--border)", cursor: "pointer",
      }}
    >
      <div style={{
        width: 34, height: 34, borderRadius: 9,
        background: pct === 100 ? "rgba(var(--green-rgb,90,158,111),0.2)" : "var(--surface)",
        border: `1px solid ${pct === 100 ? "var(--green)" : "var(--border)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16, flexShrink: 0,
      }}>
        {pct === 100 ? "✓" : pct > 0 ? "📖" : "○"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 14, color: pct > 0 ? "var(--text)" : "var(--text-muted)", fontFamily: "'Nunito', system-ui, sans-serif" }}>
            {book.name}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{read}/{book.chapters}</span>
        </div>
        <ProgressBar pct={pct} color={pct === 100 ? "var(--green)" : "var(--accent)"} />
      </div>
      <span style={{ fontSize: 14, color: "var(--text-muted)" }}>›</span>
    </div>
  );
}

function SectionAccordion({ sectionKey, section, progress, onBookClick, testament, defaultOpen }) {
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
            <BookRow key={book.id} book={book} progress={progress} onClick={onBookClick} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Books({ progress, onNavigate, initialTestament }) {
  const [tab, setTab] = useState(initialTestament || "all");

  const tabs = [
    { id: "all", label: "All" },
    { id: "hebrew", label: "Hebrew" },
    { id: "greek", label: "Greek" },
  ];

  const testaments = tab === "all"
    ? [["hebrew", BIBLE_DATA.hebrew], ["greek", BIBLE_DATA.greek]]
    : [[tab, BIBLE_DATA[tab]]];

  return (
    <div style={{ paddingBottom: 16 }}>
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
              cursor: "pointer", fontFamily: "'Nunito', system-ui, sans-serif", fontWeight: tab === t.id ? "bold" : "normal",
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
                onBookClick={(bookId) => onNavigate("chapters", { bookId })}
                testament={testamentKey}
                defaultOpen={i === 0 && tab !== "all"}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
