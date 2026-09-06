"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/auth";
import { useCredits } from "@/hooks/useCredits";
import {
  showErrorToast,
  showSuccessToast,
} from "@/components/Toast/showToast";

export type AspectRatio = "16:9" | "9:16" | "1:1";
export type Resolution = "4K" | "1080p";
export type MatchCutProgressStep =
  | "idle"
  | "generating"
  | "rendering"
  | "complete"
  | "error";

export interface MatchCutJobStatus {
  jobId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  progress?: number;
  outputUrl?: string | null;
  error?: string | null;
}

const POLL_INTERVAL = 2500;

export function useMatchCutLogic() {
  const router = useRouter();
  const { canRender, refreshCredits } = useCredits();

  // Form states
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [resolution, setResolution] = useState<Resolution>("4K");
  const [durationInSeconds, setDurationInSeconds] = useState(6);
  const [zoomIntensity, setZoomIntensity] = useState(100);

  // Workflow states
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressStep, setProgressStep] =
    useState<MatchCutProgressStep>("idle");
  const [progress, setProgress] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check login status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await api.get("/auth/me", { withCredentials: true });
        if (data) {
          localStorage.setItem("user", JSON.stringify(data));
          setIsLoggedIn(true);
        }
      } catch {
        setIsLoggedIn(false);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Clean up polling timer
  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []);

  // Poll job status
  const startPolling = useCallback(
    (id: string) => {
      if (pollRef.current) clearInterval(pollRef.current);

      const poll = async () => {
        try {
          const { data } = await api.get<MatchCutJobStatus>(`/video/job/${id}`, {
            withCredentials: true,
          });

          switch (data.status) {
            case "PENDING":
              setProgressStep("generating");
              setProgress(20);
              break;
            case "PROCESSING":
              setProgressStep("rendering");
              setProgress(20 + (data.progress || 0) * 75);
              break;
            case "COMPLETED":
              setProgress(100);
              setOutputUrl(data.outputUrl || null);
              setProgressStep("complete");
              setIsGenerating(false);
              refreshCredits();
              if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
              }
              showSuccessToast(
                "Match cut ready!",
                "Your viral search intro video has rendered successfully."
              );
              break;
            case "FAILED":
              setProgressStep("error");
              setIsGenerating(false);
              setErrorMessage(
                data.error || "Match cut video render failed. Credits refunded."
              );
              refreshCredits();
              if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
              }
              showErrorToast(
                "Render failed",
                data.error || "Video generation failed. Please try again."
              );
              break;
          }
        } catch (err: any) {
          console.error("MatchCut polling error:", err);
        }
      };

      poll();
      pollRef.current = setInterval(poll, POLL_INTERVAL);
    },
    [refreshCredits]
  );

  // Form submission / Generate action
  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmed = prompt.trim();
    if (!trimmed) {
      showErrorToast(
        "Topic required",
        "Please enter a name, brand, or idea first."
      );
      return;
    }

    if (trimmed.length > 14) {
      showErrorToast(
        "Topic too long",
        "Match cut looks best with concise words or names (maximum 14 characters)."
      );
      return;
    }

    if (!isLoggedIn && !authLoading) {
      showErrorToast("Login required", "Please log in to generate videos.");
      router.push("/login");
      return;
    }

    if (canRender === false) {
      showErrorToast(
        "Insufficient credits",
        "You need credits to render match cut videos. Please upgrade or buy credits."
      );
      router.push("/pricing");
      return;
    }

    try {
      setIsGenerating(true);
      setProgressStep("generating");
      setProgress(10);
      setErrorMessage(null);
      setOutputUrl(null);

      showSuccessToast(
        "Generating match cut",
        `Creating intro for "${trimmed}" (${aspectRatio}, ${resolution})...`
      );

      const { data } = await api.post(
        "/video/generate-matchcut",
        {
          word: trimmed,
          durationInSeconds,
          aspectRatio,
          resolution: resolution.toLowerCase() === "4k" ? "4k" : "1080p",
          zoomIntensity,
        },
        { withCredentials: true }
      );

      const createdJobId = data.jobId;
      setJobId(createdJobId);
      startPolling(createdJobId);
    } catch (err: any) {
      setIsGenerating(false);
      setProgressStep("error");
      const message =
        err?.response?.data?.message ||
        "Could not generate match cut. Please verify backend connection and try again.";
      setErrorMessage(message);
      showErrorToast("Generation error", message);
    }
  };

  const handleSelectSuggestion = (topic: string) => {
    setPrompt(topic);
  };

  const handleReset = () => {
    setIsGenerating(false);
    setProgressStep("idle");
    setProgress(0);
    setOutputUrl(null);
    setErrorMessage(null);
    setJobId(null);
  };

  const handleDownload = async () => {
    if (!outputUrl) return;
    const filename = `matchcut-${prompt.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "video"}.mp4`;
    try {
      const res = await fetch(outputUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      const a = document.createElement("a");
      a.href = outputUrl;
      a.download = filename;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return {
    // Form fields
    prompt,
    setPrompt,
    aspectRatio,
    setAspectRatio,
    resolution,
    setResolution,
    durationInSeconds,
    setDurationInSeconds,
    zoomIntensity,
    setZoomIntensity,

    // Status
    isGenerating,
    progressStep,
    progress,
    jobId,
    outputUrl,
    errorMessage,
    isLoggedIn,
    authLoading,

    // Actions
    handleGenerate,
    handleSelectSuggestion,
    handleReset,
    handleDownload,
  };
}
