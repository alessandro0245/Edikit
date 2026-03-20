"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X, Palette, Sliders, Check
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface VideoSettings {
  backgroundColor: string | null;
  textColor: string | null;
  animationIntensity: AnimationIntensity;
  aspectRatio: AspectRatio;
}

export type AnimationIntensity = "subtle" | "dynamic" | "intense";
export type AspectRatio        = "16:9" | "9:16" | "1:1";

export const DEFAULT_SETTINGS: VideoSettings = {
  backgroundColor:    null,
  textColor:          null,
  animationIntensity: "dynamic",
  aspectRatio:        "16:9",
};

interface VideoSettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: VideoSettings;
  onChange: (settings: VideoSettings) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function countChanges(settings: VideoSettings): number {
  let n = 0;
  if (settings.backgroundColor    !== DEFAULT_SETTINGS.backgroundColor)    n++;
  if (settings.textColor          !== DEFAULT_SETTINGS.textColor)          n++;
  if (settings.animationIntensity !== DEFAULT_SETTINGS.animationIntensity) n++;
  if (settings.aspectRatio        !== DEFAULT_SETTINGS.aspectRatio)        n++;
  return n;
}

type Tab = "colors" | "style";

// ─── Option button (reusable) ─────────────────────────────────────────────────
function OptionButton<T extends string>({
  value, current, onClick, children, className = "",
}: {
  value: T;
  current: T;
  onClick: (v: T) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const active = value === current;
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`
        relative flex flex-col items-center justify-center gap-2
        rounded-xl border px-3 py-3.5 cursor-pointer
        transition-all duration-200 outline-none text-center
        ${active
          ? "border-primary bg-primary/8 text-foreground shadow-sm shadow-primary/15 ring-1 ring-primary/30"
          : "border-border/50 bg-muted/20 text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground"
        }
        ${className}
      `}
    >
      {active && (
        <span className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center">
          <Check className="w-2 h-2 text-primary-foreground" strokeWidth={3} />
        </span>
      )}
      {children}
    </button>
  );
}

// ─── Tab: Colors (Solid/Gradient BG + Text) ──────────────────────────────────
function ColorPickerTab({
  backgroundColor, textColor,
  onBackground, onText,
}: {
  backgroundColor: string | null;
  textColor: string | null;
  onBackground: (v: string) => void;
  onText: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Background Color */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Background Color</p>
          <p className="text-xs text-muted-foreground mt-0.5">Solid or gradient for the video background.</p>
        </div>
        <div className="flex flex-col gap-3">
            <input
              type="color"
              value={backgroundColor || "#000000"}
              onChange={(e) => onBackground(e.target.value)}
              className="w-full h-12 p-1 rounded-lg border border-border bg-background cursor-pointer"
            />
            <div className="flex gap-2 text-xs">
              <button onClick={() => onBackground("#000000")} className="px-2 py-1 rounded bg-black text-white border border-white/20">Black</button>
              <button onClick={() => onBackground("#ffffff")} className="px-2 py-1 rounded bg-white text-black border border-black/10">White</button>
              <button onClick={() => onBackground("#1a1a2e")} className="px-2 py-1 rounded bg-[#1a1a2e] text-white">Dark Blue</button>
            </div>
        </div>
      </div>

      {/* Text Color */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Text Color</p>
          <p className="text-xs text-muted-foreground mt-0.5">Primary color for text and headings.</p>
        </div>
        <div className="flex flex-col gap-3">
            <input
              type="color"
              value={textColor || "#ffffff"}
              onChange={(e) => onText(e.target.value)}
              className="w-full h-12 p-1 rounded-lg border border-border bg-background cursor-pointer"
            />
             <div className="flex gap-2 text-xs">
              <button onClick={() => onText("#ffffff")} className="px-2 py-1 rounded bg-white text-black border border-black/10">White</button>
              <button onClick={() => onText("#000000")} className="px-2 py-1 rounded bg-black text-white border border-white/20">Black</button>
              <button onClick={() => onText("#fbbf24")} className="px-2 py-1 rounded bg-amber-400 text-black">Amber</button>
            </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Style ───────────────────────────────────────────────────────────────
const ANIMATION_OPTIONS: { value: AnimationIntensity; label: string; desc: string; preview: string[] }[] = [
  { value: "subtle",  label: "Subtle",  desc: "Clean fades & gentle slides", preview: ["opacity-20", "opacity-40", "opacity-60"] },
  { value: "dynamic", label: "Dynamic", desc: "Smooth motion & scale",       preview: ["opacity-40", "opacity-70", "opacity-100"] },
  { value: "intense", label: "Intense", desc: "Bold flips & fast energy",    preview: ["opacity-60", "opacity-90", "opacity-100"] },
];

const ASPECT_OPTIONS: { value: AspectRatio; label: string; desc: string; w: number; h: number }[] = [
  { value: "16:9", label: "Landscape", desc: "YouTube, Ads",  w: 48, h: 27 },
  { value: "9:16", label: "Portrait",  desc: "Reels, TikTok", w: 27, h: 48 },
  { value: "1:1",  label: "Square",    desc: "Instagram",     w: 38, h: 38 },
];

function StyleTab({
  intensity, aspectRatio,
  onIntensity, onAspectRatio,
}: {
  intensity: AnimationIntensity;
  aspectRatio: AspectRatio;
  onIntensity: (v: AnimationIntensity) => void;
  onAspectRatio: (v: AspectRatio) => void;
}) {
  return (
    <div className="space-y-6">

      {/* Animation Intensity */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Animation Intensity</p>
          <p className="text-xs text-muted-foreground mt-0.5">Controls how energetic the transitions and motion feel.</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {ANIMATION_OPTIONS.map((opt) => (
            <OptionButton key={opt.value} value={opt.value} current={intensity} onClick={onIntensity} className="h-full">
              {/* Motion bar preview */}
              <div className="flex items-end gap-0.5 h-6 mb-2">
                {opt.preview.map((op, i) => (
                  <div
                    key={i}
                    style={{ height: `${(i + 1) * 33}%` }}
                    className={`w-2 rounded-sm bg-primary ${op}`}
                  />
                ))}
              </div>
              <span className="text-[13px] font-semibold leading-none">{opt.label}</span>
              <span className="text-[10px] text-muted-foreground leading-tight text-center mt-1">{opt.desc}</span>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Aspect Ratio */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Aspect Ratio</p>
          <p className="text-xs text-muted-foreground mt-0.5">Output dimensions — affects composition and framing.</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {ASPECT_OPTIONS.map((opt) => (
            <OptionButton key={opt.value} value={opt.value} current={aspectRatio} onClick={onAspectRatio} className="h-full">
              {/* Visual ratio preview */}
              <div className="flex items-center justify-center h-10 mb-2">
                <div
                  style={{ width: opt.w, height: opt.h }}
                  className={`rounded-sm border-2 transition-colors ${
                    aspectRatio === opt.value ? "border-primary bg-primary/15" : "border-border/60 bg-muted/30"
                  }`}
                />
              </div>
              <span className="text-[13px] font-semibold leading-none">{opt.label}</span>
              <span className="text-[10px] text-muted-foreground mt-1">{opt.desc}</span>
            </OptionButton>
          ))}
        </div>
      </div>

    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export function VideoSettingsModal({
  open, onClose, settings, onChange,
}: VideoSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("colors");
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const changes = countChanges(settings);

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "colors",    label: "Colors",    icon: <Palette className="w-3.5 h-3.5" /> },
    { id: "style",      label: "Style",      icon: <Sliders className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="
        relative z-10 w-full sm:w-130 sm:max-w-[calc(100vw-2rem)]
        bg-card border border-border/60 shadow-2xl shadow-black/60
        rounded-t-3xl sm:rounded-2xl
        flex flex-col
        max-h-[90vh] sm:max-h-[85vh]
        animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-2
        duration-300 ease-out
      ">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <div>
            <h2 className="text-base font-bold text-foreground tracking-tight">
              Video Settings
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {changes === 0
                ? "All defaults — customize below"
                : `${changes} customization${changes > 1 ? "s" : ""} active`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {changes > 0 && (
              <button
                type="button"
                onClick={() => onChange(DEFAULT_SETTINGS)}
                className="text-[11px] font-mono text-muted-foreground hover:text-foreground border border-border/40 hover:border-border px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                Reset all
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pb-4 shrink-0">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            // Show dot if tab has non-default setting
            // Simple approach: colors dot if bg/text changed from default (null here means default)
            // But default is null. So if not null, it's changed?
            const isColorsActive = (settings.backgroundColor !== null || settings.textColor !== null);
            const isStyleActive = (settings.animationIntensity !== "dynamic" || settings.aspectRatio !== "16:9");

            const hasDot = (tab.id === "colors" && isColorsActive) || (tab.id === "style" && isStyleActive);

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium
                  transition-all duration-200 cursor-pointer
                  ${isActive
                    ? "text-primary-foreground shadow-sm bg-primary/10 ring-1 ring-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }
                `}
              >
                {tab.icon}
                {tab.label}
                {hasDot && !isActive && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="h-px bg-border/50 shrink-0 mx-6" />

        {/* Tab content — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5
          [&::-webkit-scrollbar]:w-0.75
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-border/30
          [&::-webkit-scrollbar-thumb]:rounded-full">

          {activeTab === "colors" && (
            <ColorPickerTab
              backgroundColor={settings.backgroundColor}
              textColor={settings.textColor}
              onBackground={(v) => onChange({ ...settings, backgroundColor: v })}
              onText={(v) => onChange({ ...settings, textColor: v })}
            />
          )}

          {activeTab === "style" && (
            <StyleTab
              intensity={settings.animationIntensity}
              aspectRatio={settings.aspectRatio}
              onIntensity={(v) => onChange({ ...settings, animationIntensity: v })}
              onAspectRatio={(v) => onChange({ ...settings, aspectRatio: v })}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="
              w-full py-3 rounded-xl text-sm font-semibold
              bg-primary text-primary-foreground
              hover:bg-primary/90 transition-colors cursor-pointer
              shadow-lg shadow-primary/20
            "
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}