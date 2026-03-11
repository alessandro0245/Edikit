"use client";

import {
  ArrowRight,
  Loader2,
  CheckCircle2,
  Menu,
  X,
  AlertTriangle,
  RefreshCw,
  Film,
  SlidersHorizontal,
} from "lucide-react";
import { usePromptLogic } from "./usePromptLogic";
import VideoPlayer from "@/components/Video/VideoPlayer";
import VideoDownloadButton from "@/components/Video/VideoDownloadButton";
import {
  VideoSettingsModal,
  countChanges,
} from "@/components/VideoSettingsModal/VideoSettingsModal";
import { useRef } from "react";

// ── Step indicator ────────────────────────────────────────────────────────────
function StepIndicator({
  steps,
  progress,
  progressStep,
}: {
  steps: { label: string; key: string }[];
  progress: number;
  progressStep: string;
}) {
  const thresholds = [15, 85, 100];
  return (
    <div className="space-y-2.5">
      {steps.map((step, i) => {
        const isComplete = progress >= thresholds[i];
        const isActive = progress >= thresholds[i] * 0.5 && !isComplete;
        const isFailed = progressStep === "error";
        return (
          <div key={i} className="flex items-center gap-3">
            <div
              className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500
              ${
                isFailed
                  ? "bg-red-500/20 border border-red-500/40"
                  : isComplete
                    ? "bg-primary border border-primary"
                    : isActive
                      ? "bg-primary/20 border border-primary/50"
                      : "bg-muted border border-border"
              }`}
            >
              {isFailed ? (
                <AlertTriangle className="w-3 h-3 text-red-400" />
              ) : isComplete ? (
                <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
              ) : isActive ? (
                <Loader2 className="w-3 h-3 text-primary animate-spin" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
              )}
            </div>
            <span
              className={`text-sm transition-colors duration-300
              ${
                isFailed
                  ? "text-red-400"
                  : isComplete
                    ? "text-foreground font-medium"
                    : isActive
                      ? "text-foreground/80"
                      : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
            {isActive && !isFailed && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProgressBar({
  progress,
  isError,
}: {
  progress: number;
  isError: boolean;
}) {
  return (
    <div className="relative w-full h-1 bg-muted rounded-full overflow-hidden">
      <div
        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out
          ${isError ? "bg-red-500" : "bg-primary"}`}
        style={{ width: `${isError ? 100 : progress}%` }}
      />
    </div>
  );
}

function EmptyCanvas() {
  return (
    <div className="w-full max-w-4xl aspect-video relative overflow-hidden rounded-xl border border-border/50 bg-[#080808]">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-muted/60 border border-border/60 flex items-center justify-center">
          <Film className="w-7 h-7 text-muted-foreground/60" />
        </div>
        <div className="text-center space-y-1.5">
          <p className="text-sm font-medium text-muted-foreground">
            Your video will appear here
          </p>
          <p className="text-xs text-muted-foreground/50">
            Fill in the prompt and hit Generate
          </p>
        </div>
        {[
          ["top-4 left-4", "border-t border-l"],
          ["top-4 right-4", "border-t border-r"],
          ["bottom-4 left-4", "border-b border-l"],
          ["bottom-4 right-4", "border-b border-r"],
        ].map(([pos, border], i) => (
          <div
            key={i}
            className={`absolute ${pos} w-5 h-5 ${border} border-border/30`}
          />
        ))}
      </div>
    </div>
  );
}

function ProcessingCanvas({ progress }: { progress: number }) {
  return (
    <div className="w-full max-w-4xl aspect-video relative overflow-hidden rounded-xl border border-primary/20 bg-[#080808]">
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse ${40 + progress * 0.3}% 40% at 50% 50%, hsl(var(--primary)/0.08), transparent)`,
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="3"
            />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-mono font-bold text-primary tabular-nums">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">
          Rendering your video...
        </p>
      </div>
    </div>
  );
}

function ErrorCanvas({ message }: { message: string | null }) {
  return (
    <div className="w-full max-w-4xl aspect-video relative overflow-hidden rounded-xl border border-red-500/20 bg-[#0d0505]">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-red-400">Generation Failed</p>
          <p className="text-xs text-muted-foreground max-w-sm">
            {message ?? "An error occurred during video generation."}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PromptPage() {
  const {
    categoryId,
    prompt,
    setPrompt,
    settings,
    setSettings,
    settingsOpen,
    setSettingsOpen,
    progressStep,
    progress,
    sidebarOpen,
    setSidebarOpen,
    isLoggedIn,
    authLoading,
    steps,
    outputUrl,
    errorMessage,
    isSubmitting,
    canRender,
    handleSubmit,
    handleReset,
    handleDownload,
  } = usePromptLogic();

  const isIdle = progressStep === "idle";
  const isProcessing = progressStep === "processing";
  const isComplete = progressStep === "complete";
  const isError = progressStep === "error";
  const changeCount = countChanges(settings);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* ── Mobile top bar ── */}
      <div className="lg:hidden sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border px-4 py-3.5 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-foreground tracking-tight">
            Create Video
          </h1>
          <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">
            {categoryId.replace(/-/g, " ")}
          </p>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
        >
          {sidebarOpen ? (
            <X className="w-4 h-4" />
          ) : (
            <Menu className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* ── Sidebar ── */}
      <aside
        className={`
        ${sidebarOpen ? "flex" : "hidden"} lg:flex
        w-full lg:w-100 xl:w-110 flex-col
        bg-card border-b lg:border-b-0 lg:border-r border-border
        lg:h-screen lg:sticky lg:top-0
      `}
      >
        {/* Header */}
        <div className="hidden lg:flex flex-col px-8 pt-10 pb-7 border-b border-border gap-1">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Create Video
          </h1>
          <p className="text-sm text-muted-foreground capitalize">
            {categoryId.replace(/-/g, " ")}
          </p>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 lg:px-8 py-6 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
          {isIdle ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Prompt */}
              <div className="space-y-2">
                <label
                  htmlFor="prompt"
                  className="text-xs font-semibold text-foreground uppercase tracking-widest"
                >
                  Describe Your Video
                </label>

                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    id="prompt"
                    value={prompt}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPrompt(value);

                      const el = textareaRef.current;
                      if (el) {
                        el.style.height = "auto";
                        el.style.height = el.scrollHeight + "px";
                      }
                    }}
                    placeholder="Describe your video — content, mood, style, tone..."
                    minLength={10}
                    maxLength={500}
                    className="w-full min-h-35 px-4 py-3.5 text-sm bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/60 focus:border-primary/60 resize-none transition-all leading-relaxed overflow-y-hidden"
                  />

                  <span
                    className={`absolute bottom-3 right-3.5 text-[10px] font-mono tabular-nums transition-colors ${
                      prompt.length > 450
                        ? "text-red-400"
                        : "text-muted-foreground/40"
                    }`}
                  >
                    {prompt.length}/500
                  </span>
                </div>

                {prompt.length > 0 && prompt.length < 10 && (
                  <p className="text-[11px] text-muted-foreground">
                    {10 - prompt.length} more characters needed
                  </p>
                )}
              </div>

              {/* Credits warning */}
              {isLoggedIn && canRender === false && (
                <div className="flex items-start gap-2.5 p-3.5 bg-red-500/5 border border-red-500/20 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400 leading-relaxed">
                    Not enough credits{" "}
                    <a
                      href="/pricing"
                      className="underline underline-offset-2 font-medium"
                    >
                      Get more →
                    </a>
                  </p>
                </div>
              )}

              {/* Action Row */}
              <div className="flex gap-2.5">
                {/* Customize */}
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className={`relative flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border text-sm font-medium transition-all duration-200 cursor-pointer shrink-0 ${
                    changeCount > 0
                      ? "border-primary/50 bg-primary/10 text-primary hover:bg-primary/20"
                      : "border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/40"
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Customize</span>

                  {changeCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-4.5 h-4.5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-sm shadow-primary/30">
                      {changeCount}
                    </span>
                  )}
                </button>

                {/* Generate */}
                <button
                  type="submit"
                  disabled={
                    prompt.trim().length < 10 ||
                    authLoading ||
                    !isLoggedIn ||
                    isSubmitting ||
                    canRender === false
                  }
                  className="group flex-1 relative overflow-hidden flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-primary/20 cursor-pointer"
                >
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />

                  {authLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : !isLoggedIn ? (
                    <>
                      Login to Generate
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      Generate
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-widest text-foreground">
                    {isError ? "Failed" : isComplete ? "Complete" : "Rendering"}
                  </span>

                  <span
                    className={`text-xs font-mono tabular-nums ${
                      isError
                        ? "text-red-400"
                        : isComplete
                          ? "text-primary"
                          : "text-muted-foreground"
                    }`}
                  >
                    {isError ? "—" : `${Math.round(progress)}%`}
                  </span>
                </div>

                <ProgressBar progress={progress} isError={isError} />
              </div>

              <StepIndicator
                steps={steps}
                progress={progress}
                progressStep={progressStep}
              />

              {isError && errorMessage && (
                <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl space-y-1">
                  <p className="text-xs font-medium text-red-400">
                    {errorMessage}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Credits have been refunded.
                  </p>
                </div>
              )}

              <div className="p-4 bg-background/60 border border-border/60 rounded-xl space-y-3">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
                    Prompt
                  </p>
                  <p className="text-xs text-foreground/80 leading-relaxed line-clamp-3">
                    {prompt}
                  </p>
                </div>
              </div>

              {(isComplete || isError) && (
                <button
                  onClick={handleReset}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-muted hover:bg-muted/70 text-foreground text-sm font-medium rounded-xl transition-colors cursor-pointer"
                >
                  {isError ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      Try Again
                    </>
                  ) : (
                    "Create Another Video"
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-border bg-muted/20">
          <p className="text-[11px] text-muted-foreground/60 text-center font-mono">
            {isIdle
              ? "5 credit per generation"
              : isError
                ? "Credits refunded on failure"
                : isComplete
                  ? "✓ Video ready to download"
                  : "Processing — please wait..."}
          </p>
        </div>
      </aside>

      {/* ── Main canvas ── */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 gap-6 min-h-[60vh] lg:min-h-screen">
        {isComplete && outputUrl ? (
          <div className="w-full max-w-4xl rounded-xl overflow-hidden shadow-2xl shadow-black/40 ring-1 ring-border/40">
            <VideoPlayer
              src={outputUrl}
              autoPlay
              showDownload={false}
              className="w-full"
            />
          </div>
        ) : isProcessing ? (
          <ProcessingCanvas progress={progress} />
        ) : isError ? (
          <ErrorCanvas message={errorMessage} />
        ) : (
          <EmptyCanvas />
        )}

        {isComplete && outputUrl && (
          <div className="w-full max-w-4xl flex flex-col sm:flex-row gap-3">
            <VideoDownloadButton
              videoUrl={outputUrl}
              filename={`edikit-${categoryId}-${Date.now()}.mp4`}
              variant="primary"
              size="lg"
              className="flex-1"
            />
            <button
              onClick={async () => {
                await handleDownload();
              }}
              className="flex-1 px-5 py-2.5 text-sm font-medium border border-border text-foreground rounded-xl hover:bg-muted transition-colors cursor-pointer"
            >
              Refresh Link
            </button>
            <button
              onClick={handleReset}
              className="flex-1 px-5 py-2.5 text-sm font-medium border border-border text-foreground rounded-xl hover:bg-muted transition-colors cursor-pointer"
            >
              New Video
            </button>
          </div>
        )}

        {isIdle && (
          <p className="text-[11px] font-mono text-muted-foreground/40 uppercase tracking-widest">
            {categoryId.replace(/-/g, " ")} · Edikit AI
          </p>
        )}
      </main>

      {/* ── Settings Modal ── */}
      <VideoSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onChange={setSettings}
      />
    </div>
  );
}
