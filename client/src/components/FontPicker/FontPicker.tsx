"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

// ─── Types & data ──────────────────────────────────────────────────────────
export type FontId =
  | "google-sans"
  | "roboto"
  | "montserrat"
  | "poppins"
  | "dm-sans"
  | "manrope"
  | "figtree"
  | "rubik"
  | "assistant"
  | "hanken-grotesk"
  | "noto-sans"
  | "onest";

interface FontOption {
  id: FontId;
  name: string;
  family: string;
  googleFontUrl: string;
}

const FONTS: FontOption[] = [
  {
    id: "google-sans",
    name: "Google Sans (Default)",
    // self-hosted, already loaded by the root layout
    family: "var(--font-sans)",
    googleFontUrl: "",
  },
  {
    id: "roboto",
    name: "Roboto",
    family: "'Roboto', sans-serif",
    googleFontUrl:
      "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&display=swap",
  },
  {
    id: "montserrat",
    name: "Montserrat",
    family: "'Montserrat', sans-serif",
    googleFontUrl:
      "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap",
  },
  {
    id: "poppins",
    name: "Poppins",
    family: "'Poppins', sans-serif",
    googleFontUrl:
      "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap",
  },
  {
    id: "dm-sans",
    name: "DM Sans",
    family: "'DM Sans', sans-serif",
    googleFontUrl:
      "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap",
  },
  {
    id: "manrope",
    name: "Manrope",
    family: "'Manrope', sans-serif",
    googleFontUrl:
      "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap",
  },
  {
    id: "figtree",
    name: "Figtree",
    family: "'Figtree', sans-serif",
    googleFontUrl:
      "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap",
  },
  {
    id: "rubik",
    name: "Rubik",
    family: "'Rubik', sans-serif",
    googleFontUrl:
      "https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&display=swap",
  },
  {
    id: "assistant",
    name: "Assistant",
    family: "'Assistant', sans-serif",
    googleFontUrl:
      "https://fonts.googleapis.com/css2?family=Assistant:wght@400;500;600;700&display=swap",
  },
  {
    id: "hanken-grotesk",
    name: "Hanken Grotesk",
    family: "'Hanken Grotesk', sans-serif",
    googleFontUrl:
      "https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&display=swap",
  },
  {
    id: "noto-sans",
    name: "Noto Sans",
    family: "'Noto Sans', sans-serif",
    googleFontUrl:
      "https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&display=swap",
  },
  {
    id: "onest",
    name: "Onest",
    family: "'Onest', sans-serif",
    googleFontUrl:
      "https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700&display=swap",
  },
];

// ─── Props ─────────────────────────────────────────────────────────────────
interface FontPickerProps {
  value?: FontId;
  onChange?: (fontId: FontId, fontFamily: string) => void;
  label?: string;
}

// ─── Component ─────────────────────────────────────────────────────────────
export default function FontPicker({
  value,
  onChange,
  label = "Font",
}: FontPickerProps) {
  const [selected, setSelected] = useState<FontId>(value ?? "google-sans");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value && value !== selected) {
      setSelected(value);
    }
  }, [value]);

  const activeFont = FONTS.find((f) => f.id === selected) || FONTS[0];

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleSelect = (font: FontOption) => {
    setSelected(font.id);
    onChange?.(font.id, font.family);
    setOpen(false);
  };

  return (
    <>
      {/* Preload all Google Fonts once */}
      {FONTS.filter((f) => f.googleFontUrl).map((f) => (
        <link key={f.id} rel="stylesheet" href={f.googleFontUrl} />
      ))}

      <div className="fp-root" ref={wrapperRef}>
        {/* Label */}
        <label className="fp-label">{label}</label>

        {/* Trigger */}
        <button
          type="button"
          className={`fp-trigger${open ? " fp-trigger--open" : ""}`}
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span
            className="fp-trigger-name"
            style={{ fontFamily: activeFont.family }}
          >
            {activeFont.name}
          </span>
          <ChevronDown
            size={14}
            className={`fp-chevron${open ? " fp-chevron--up" : ""}`}
          />
        </button>

        {/* Dropdown */}
        {open && (
          <ul className="fp-dropdown" role="listbox" aria-label="Select font">
            {FONTS.map((font) => {
              const isActive = font.id === selected;
              return (
                <li
                  key={font.id}
                  role="option"
                  aria-selected={isActive}
                  className={`fp-option${isActive ? " fp-option--active" : ""}`}
                  onClick={() => handleSelect(font)}
                >
                  <span
                    className="fp-option-name"
                    style={{ fontFamily: font.family }}
                  >
                    {font.name}
                  </span>
                  {isActive && (
                    <Check size={13} className="fp-option-check" strokeWidth={2.5} />
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* Inline preview */}
        <p className="fp-preview" style={{ fontFamily: activeFont.family }}>
          The quick brown fox jumps over the lazy dog.
        </p>
      </div>
    </>
  );
}
