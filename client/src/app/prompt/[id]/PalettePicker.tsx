"use client";

import React, { useState, useEffect } from "react";
import { Shuffle, Check, Wand2 } from "lucide-react";
import api from "@/lib/auth";

type MoodFilter = "all" | "energetic" | "cinematic" | "corporate" | "chill";
type MoodType = "energetic" | "cinematic" | "corporate" | "chill";

interface PaletteSwatch {
  bg1: string;
  bg2: string;
  bg3: string;
  bgCta: string;
  accent: string;
}

export interface Palette {
  id: string;
  name: string;
  mood: MoodType;
  swatches: PaletteSwatch;
  textSamples: { onBg1: string; onCta: string };
}

interface PalettePickerProps {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

const MOODS: { value: MoodFilter; label: string }[] = [
  { value: "all",       label: "All"       },
  { value: "energetic", label: "Energetic" },
  { value: "cinematic", label: "Cinematic" },
  { value: "corporate", label: "Corporate" },
  { value: "chill",     label: "Chill"     },
];

const MOOD_STYLES: Record<string, { dot: string; text: string; bg: string }> = {
  energetic: { dot: "#fb923c", text: "#fb923c", bg: "rgba(251,146,60,0.1)"  },
  cinematic: { dot: "#22d3ee", text: "#22d3ee", bg: "rgba(34,211,238,0.1)"  },
  corporate: { dot: "#60a5fa", text: "#60a5fa", bg: "rgba(96,165,250,0.1)"  },
  chill:     { dot: "#34d399", text: "#34d399", bg: "rgba(52,211,153,0.1)"  },
};

// ── Palette Row Card (horizontal layout — fits narrow sidebar perfectly) ──────
const PaletteCard: React.FC<{
  palette: Palette;
  isSelected: boolean;
  onClick: () => void;
}> = ({ palette, isSelected, onClick }) => {
  const { swatches, textSamples } = palette;
  const moodStyle = MOOD_STYLES[palette.mood] ?? { dot: "#888", text: "#888", bg: "rgba(136,136,136,0.1)" };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group relative w-full text-left flex items-stretch gap-0
        rounded-xl overflow-hidden cursor-pointer outline-none
        transition-all duration-200
        ${isSelected
          ? "ring-2 ring-primary ring-offset-1 ring-offset-card shadow-lg shadow-primary/20"
          : "ring-1 ring-white/[0.07] hover:ring-white/18 hover:shadow-md hover:shadow-black/40 hover:-translate-y-px"
        }
      `}
    >
      {/* ── Left: 5-swatch color bar ── */}
      <div className="flex w-24 shrink-0">
        <div style={{ background: swatches.bg1    }} className="flex-1" />
        <div style={{ background: swatches.bg2    }} className="flex-1" />
        <div style={{ background: swatches.bg3    }} className="flex-1" />
        <div style={{ background: swatches.bgCta  }} className="flex-1 relative">
          {/* accent dot */}
          <span
            style={{
              background: swatches.accent,
              boxShadow: `0 0 8px ${swatches.accent}`,
            }}
            className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full"
          />
        </div>
      </div>

      {/* ── Right: name + mood + mini preview ── */}
      <div className="flex-1 flex flex-col justify-center px-3 py-3 bg-[#111] gap-1.5">
        {/* Name row */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-semibold text-white/90 leading-none">
            {palette.name}
          </span>
          {isSelected && (
            <div className="shrink-0 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={3} />
            </div>
          )}
        </div>

        {/* Mood badge + mini color dots */}
        <div className="flex items-center justify-between">
          <span
            style={{ color: moodStyle.text, background: moodStyle.bg }}
            className="text-[9px] font-mono font-semibold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-md"
          >
            {palette.mood}
          </span>

          {/* 4 mini color dots */}
          <div className="flex items-center gap-1">
            {[swatches.bg1, swatches.bg2, swatches.bgCta, swatches.accent].map((c, i) => (
              <span
                key={i}
                style={{ background: c }}
                className="w-2.5 h-2.5 rounded-full border border-black/20"
              />
            ))}
          </div>
        </div>
      </div>
    </button>
  );
};

// ── Surprise Me Card (horizontal, matches palette cards) ─────────────────────
const SurpriseMeCard: React.FC<{
  isSelected: boolean;
  onClick: () => void;
}> = ({ isSelected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`
      group relative w-full text-left flex items-stretch gap-0
      rounded-xl overflow-hidden cursor-pointer outline-none
      transition-all duration-200
      ${isSelected
        ? "ring-2 ring-primary ring-offset-1 ring-offset-card shadow-lg shadow-primary/20"
        : "ring-1 ring-white/[0.07] hover:ring-white/18 hover:shadow-md hover:shadow-black/40 hover:-translate-y-px"
      }
    `}
  >
    {/* Left: animated gradient swatch */}
    <div className="w-24 shrink-0 relative overflow-hidden bg-[#0a0a0a]">
      <div className={`absolute inset-0 bg-linear-to-br transition-opacity duration-300
        from-primary/30 via-primary/10 to-transparent
        ${isSelected ? "opacity-100" : "opacity-40 group-hover:opacity-70"}`}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <Shuffle className={`w-5 h-5 transition-colors duration-200
          ${isSelected ? "text-primary" : "text-white/25 group-hover:text-white/50"}`}
        />
      </div>
      {/* Subtle dashed border */}
      <div className={`absolute inset-0 border-r-2 border-dashed transition-colors
        ${isSelected ? "border-primary/40" : "border-white/10"}`}
      />
    </div>

    {/* Right: text */}
    <div className="flex-1 flex flex-col justify-center px-3 py-3 bg-[#111] gap-1">
      <div className="flex items-center justify-between">
        <span className={`text-[13px] font-semibold transition-colors
          ${isSelected ? "text-white/90" : "text-white/50 group-hover:text-white/70"}`}>
          Surprise Me
        </span>
        {isSelected && (
          <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
            <Check className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={3} />
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <Wand2 className="w-2.5 h-2.5 text-muted-foreground/50" />
        <span className="text-[10px] font-mono text-muted-foreground/50 tracking-wide">
          AI picks for you
        </span>
      </div>
    </div>
  </button>
);

// ── Skeleton ──────────────────────────────────────────────────────────────────
const SkeletonRow = ({ delay = 0 }: { delay?: number }) => (
  <div
    className="w-full h-14.5 rounded-xl overflow-hidden ring-1 ring-white/18 flex animate-pulse"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="w-24 shrink-0 bg-muted/30" />
    <div className="flex-1 bg-[#111] flex flex-col justify-center px-3 gap-2">
      <div className="h-2.5 w-28 bg-muted/40 rounded-full" />
      <div className="h-2 w-16 bg-muted/25 rounded-full" />
    </div>
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────
export const PalettePicker: React.FC<PalettePickerProps> = ({
  selectedId,
  onSelect,
}) => {
  const [palettes, setPalettes]   = useState<Palette[]>([]);
  const [activeMood, setActiveMood] = useState<MoodFilter>("all");
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(false);
        const url = activeMood === "all"
          ? "/video/palettes"
          : `/video/palettes?mood=${activeMood}`;
        const { data } = await api.get(url);
        setPalettes(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeMood]);

  const selectedName = selectedId
    ? palettes.find((p) => p.id === selectedId)?.name
    : null;

  return (
    <div className="space-y-3.5">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground leading-none mb-1">
            Color Palette
          </p>
          <p className="text-xs text-muted-foreground">
            {selectedId === null ? "AI will choose automatically" : (
              <span className="text-primary/80 font-medium">{selectedName}</span>
            )}
          </p>
        </div>
        {selectedId !== null && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-[11px] font-mono text-muted-foreground/60 hover:text-muted-foreground
              border border-border/40 hover:border-border/70
              px-2 py-1 rounded-lg transition-all cursor-pointer shrink-0 mt-0.5"
          >
            Clear
          </button>
        )}
      </div>

      {/* Mood filter — scrollable single row */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5
        [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {MOODS.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setActiveMood(m.value)}
            className={`
              shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-lg border
              transition-all duration-150 cursor-pointer whitespace-nowrap
              ${activeMood === m.value
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-transparent text-muted-foreground border-border/50 hover:text-foreground hover:border-border hover:bg-muted/20"
              }
            `}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} delay={i * 50} />
          ))}
        </div>
      ) : error ? (
        <div className="py-6 text-center space-y-2">
          <p className="text-xs text-muted-foreground">Could not load palettes</p>
          <button
            type="button"
            onClick={() => setActiveMood(activeMood)}
            className="text-xs text-primary hover:underline cursor-pointer"
          >
            Try again
          </button>
        </div>
      ) : (
        <div
          className="space-y-2 overflow-y-auto
            [&::-webkit-scrollbar]:w-0.75
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-border/30
            [&::-webkit-scrollbar-thumb:hover]:bg-border/60
            [&::-webkit-scrollbar-thumb]:rounded-full"
          style={{ maxHeight: "340px" }}
        >
          <SurpriseMeCard isSelected={selectedId === null} onClick={() => onSelect(null)} />

          {palettes.map((p) => (
            <PaletteCard
              key={p.id}
              palette={p}
              isSelected={selectedId === p.id}
              onClick={() => onSelect(p.id)}
            />
          ))}

          {palettes.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">
              No palettes for this mood yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PalettePicker;