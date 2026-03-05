"use client";

import {
  ArrowRight,
  Loader2,
  CheckCircle2,
  Menu,
  X,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { usePromptLogic } from "./usePromptLogic";
import VideoPlayer from "@/components/Video/VideoPlayer";
import VideoDownloadButton from "@/components/Video/VideoDownloadButton";

export default function PromptPage() {
  const {
    categoryId,
    prompt,
    setPrompt,
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
    canUseAiPrompt,
    handleSubmit,
    handleReset,
    handleDownload,
  } = usePromptLogic();

  return (
    <div className="h-fit overflow-hidden bg-background flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-50 bg-card border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">
              Create Video
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {categoryId.replace(/-/g, " ")}
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "block" : "hidden"
        } lg:block w-full lg:w-96 bg-card border-b lg:border-b-0 lg:border-r border-border h-screen flex flex-col overflow-y-auto max-h-[calc(100vh-73px)] lg:max-h-screen`}
      >
        {/* Desktop Header */}
        <div className="hidden lg:block p-6 lg:p-12 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            Create Video
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Category: {categoryId.replace(/-/g, " ")}
          </p>
        </div>

        {/* Prompt Section */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
          {progressStep === "idle" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="prompt"
                  className="block text-sm font-medium text-foreground mb-3"
                >
                  Describe Your Video
                </label>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Tell us what you want your video to look like. Include details about content, style, colors, mood, etc. (min 10 characters)"
                  className="w-full h-40 px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent resize-none"
                  minLength={10}
                  maxLength={500}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-muted-foreground">
                    {prompt.length < 10
                      ? `${10 - prompt.length} more characters needed`
                      : ""}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {prompt.length}/500
                  </span>
                </div>
              </div>

              {/* Credits warning */}
              {isLoggedIn && canUseAiPrompt === false && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                  <p className="text-xs text-destructive">
                    You don&apos;t have enough AI prompt credits.{" "}
                    <a href="/pricing" className="underline font-medium">
                      Get more credits
                    </a>
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  prompt.trim().length < 10 ||
                  authLoading ||
                  !isLoggedIn ||
                  isSubmitting ||
                  canUseAiPrompt === false
                }
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
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
                    Generate Video
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Progress Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    {progressStep === "error" ? "Error" : "Progress"}
                  </h3>
                  <span className="text-xs font-medium text-muted-foreground">
                    {progressStep === "error"
                      ? "Failed"
                      : `${Math.round(progress)}%`}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ease-out ${
                      progressStep === "error" ? "bg-destructive" : "bg-primary"
                    }`}
                    style={{
                      width: `${progressStep === "error" ? 100 : progress}%`,
                    }}
                  />
                </div>

                {/* Steps */}
                <div className="mt-6 space-y-3">
                  {steps.map((step, index) => {
                    const stepThresholds = [15, 85, 100];
                    const isActive = progress >= stepThresholds[index] * 0.5;
                    const isComplete = progress >= stepThresholds[index];
                    const isFailed = progressStep === "error";

                    return (
                      <div key={index} className="flex items-center gap-3">
                        <div
                          className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                            isFailed
                              ? "bg-destructive/30"
                              : isComplete
                                ? "bg-primary"
                                : isActive
                                  ? "bg-primary/30"
                                  : "bg-muted"
                          }`}
                        >
                          {isFailed ? (
                            <AlertTriangle className="w-3 h-3 text-destructive" />
                          ) : isComplete ? (
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          ) : isActive ? (
                            <Loader2 className="w-3 h-3 text-primary animate-spin" />
                          ) : null}
                        </div>
                        <span
                          className={`text-sm ${
                            isFailed
                              ? "text-destructive"
                              : isComplete || isActive
                                ? "text-foreground font-medium"
                                : "text-muted-foreground"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Error Message */}
              {progressStep === "error" && errorMessage && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{errorMessage}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your credits have been refunded.
                  </p>
                </div>
              )}

              {/* Prompt Display */}
              <div className="p-4 bg-background rounded-lg border border-border">
                <p className="text-xs text-muted-foreground font-medium mb-2">
                  Your Prompt
                </p>
                <p className="text-sm text-foreground line-clamp-4">{prompt}</p>
              </div>

              {/* Reset / Try Again Button */}
              {(progressStep === "complete" || progressStep === "error") && (
                <button
                  onClick={handleReset}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-muted text-foreground font-medium rounded-lg hover:bg-muted/80 transition-colors cursor-pointer"
                >
                  {progressStep === "error" ? (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Try Again
                    </>
                  ) : (
                    "Create Another"
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            {progressStep === "idle"
              ? "1 credit per generation"
              : progressStep === "error"
                ? "Credits refunded on failure"
                : progressStep === "complete"
                  ? "Video ready!"
                  : "Processing your request..."}
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full flex flex-col overflow-y-hidden">
        {/* Video Preview Section */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 space-y-6">
          {/* Video Player or Placeholder */}
          {progressStep === "complete" && outputUrl ? (
            <div className="w-full max-w-4xl">
              <VideoPlayer
                src={outputUrl}
                autoPlay
                showDownload={false}
                className="rounded-lg lg:rounded-xl overflow-hidden"
              />
            </div>
          ) : (
            <div className="w-full max-w-4xl aspect-video bg-linear-to-br from-muted to-muted/50 border border-border rounded-lg lg:rounded-xl flex items-center justify-center">
              {progressStep === "processing" ? (
                <div className="flex flex-col items-center space-y-4">
                  <Loader2 className="w-10 lg:w-12 h-10 lg:h-12 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">
                    Generating your video... {Math.round(progress)}%
                  </p>
                </div>
              ) : progressStep === "error" ? (
                <div className="flex flex-col items-center space-y-4 px-4 text-center">
                  <AlertTriangle className="w-10 lg:w-12 h-10 lg:h-12 text-destructive" />
                  <p className="text-sm font-medium text-destructive">
                    Generation Failed
                  </p>
                  <p className="text-xs text-muted-foreground max-w-md">
                    {errorMessage ||
                      "An error occurred during video generation."}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-4 px-4 text-center">
                  <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🎬</span>
                  </div>
                  <p className="text-sm lg:text-base text-muted-foreground">
                    Write a prompt to generate your AI video
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions - shown when complete */}
          {progressStep === "complete" && outputUrl && (
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-4xl">
              <VideoDownloadButton
                videoUrl={outputUrl}
                filename={`edikit-${categoryId}-${Date.now()}.mp4`}
                variant="primary"
                size="lg"
                className="flex-1"
              />
              <button
                onClick={async () => {
                  const freshUrl = await handleDownload();
                  if (freshUrl) {
                    // URL refreshed, VideoPlayer will use outputUrl from state
                  }
                }}
                className="flex-1 px-6 py-2 border border-border text-foreground font-medium rounded-lg hover:bg-muted transition-colors text-sm lg:text-base cursor-pointer"
              >
                Refresh Link
              </button>
              <button
                onClick={handleReset}
                className="flex-1 px-6 py-2 border border-border text-foreground font-medium rounded-lg hover:bg-muted transition-colors text-sm lg:text-base cursor-pointer"
              >
                Create New
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
