import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/auth";
import toast from "react-hot-toast";
import { useCredits } from "@/hooks/useCredits";

export type ProgressStep = "idle" | "processing" | "complete" | "error";

export interface JobStatus {
  jobId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  progress: number;
  outputUrl: string | null;
  error: string | null;
  videoConfig: Record<string, unknown> | null;
}

const POLL_INTERVAL = 2000;

export function usePromptLogic() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;

  const [prompt, setPrompt] = useState("");
  const [selectedPaletteId, setSelectedPaletteId] = useState<string | null>(
    null,
  );
  const [progressStep, setProgressStep] = useState<ProgressStep>("idle");
  const [progress, setProgress] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [jobId, setJobId] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasCompletedRef = useRef(false);
  const { canRender, refreshCredits } = useCredits();

  const steps = [
    { label: "Analyzing prompt with AI", key: "analyzing" },
    { label: "Rendering video", key: "rendering" },
    { label: "Finalizing & uploading", key: "finalizing" },
  ];

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await api.get("/auth/me", { withCredentials: true });
        localStorage.setItem("user", JSON.stringify(data));
        setIsLoggedIn(true);
      } catch {
        setIsLoggedIn(false);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []);

  const startPolling = useCallback(
    (id: string) => {
      if (pollRef.current) clearInterval(pollRef.current);
      hasCompletedRef.current = false;

      const poll = async () => {
        if (hasCompletedRef.current) return;
        try {
          const { data } = await api.get<JobStatus>(`/video/job/${id}`, {
            withCredentials: true,
          });

          switch (data.status) {
            case "PENDING":
              setProgress(15);
              break;
            case "PROCESSING":
              setProgress(15 + data.progress * 70);
              break;
            case "COMPLETED":
              if (!hasCompletedRef.current) {
                hasCompletedRef.current = true;
                clearInterval(pollRef.current!);
                pollRef.current = null;
                setProgress(100);
                setOutputUrl(data.outputUrl);
                setProgressStep("complete");
                refreshCredits();
                toast.success("Video generated successfully!");
              }
              break;
            case "FAILED":
              if (!hasCompletedRef.current) {
                hasCompletedRef.current = true;
                clearInterval(pollRef.current!);
                pollRef.current = null;
                setProgressStep("error");
                setErrorMessage(
                  data.error || "Video generation failed. Credits refunded.",
                );
                refreshCredits();
                toast.error(data.error || "Video generation failed");
              }
              break;
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      };

      // Set interval first so pollRef.current is valid inside poll()
      pollRef.current = setInterval(poll, POLL_INTERVAL);
      poll();
    },
    [refreshCredits],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    if (!prompt.trim()) return;
    if (canRender === false) {
      toast.error("Insufficient credits. Please purchase more.");
      router.push("/pricing");
      return;
    }

    try {
      setIsSubmitting(true);
      setProgressStep("processing");
      setProgress(5);
      setErrorMessage(null);
      setOutputUrl(null);

      const { data } = await api.post(
        "/video/generate-prompt",
        {
          categoryId,
          prompt,
          paletteId: selectedPaletteId ?? undefined, // ← NEW: undefined = AI picks
        },
        { withCredentials: true },
      );

      setJobId(data.jobId);
      setProgress(10);
      startPolling(data.jobId);
    } catch (err: any) {
      setProgressStep("error");
      const message =
        err?.response?.data?.message ||
        "Something went wrong. Please try again.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    hasCompletedRef.current = false;
    setPrompt("");
    setSelectedPaletteId(null); // ← NEW: reset palette on new video
    setProgressStep("idle");
    setProgress(0);
    setJobId(null);
    setOutputUrl(null);
    setErrorMessage(null);
  };

  const handleDownload = async () => {
    if (!jobId) return;
    try {
      const { data } = await api.get(`/video/job/${jobId}/download`, {
        withCredentials: true,
      });
      if (data.downloadUrl) {
        setOutputUrl(data.downloadUrl);
        return data.downloadUrl as string;
      }
    } catch {
      toast.error("Failed to get download link. Please try again.");
    }
    return null;
  };

  return {
    categoryId,
    prompt,
    setPrompt,
    selectedPaletteId, // ← NEW
    setSelectedPaletteId, // ← NEW
    progressStep,
    progress,
    sidebarOpen,
    setSidebarOpen,
    isLoggedIn,
    authLoading,
    steps,
    jobId,
    outputUrl,
    errorMessage,
    isSubmitting,
    canRender,
    handleSubmit,
    handleReset,
    handleDownload,
  };
}
