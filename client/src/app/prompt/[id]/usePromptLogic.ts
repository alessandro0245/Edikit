import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/auth";
import toast from "react-hot-toast";

export type ProgressStep = "idle" | "processing" | "complete";

export function usePromptLogic() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;

  const [prompt, setPrompt] = useState("");
  const [progressStep, setProgressStep] = useState<ProgressStep>("idle");
  const [progress, setProgress] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const steps = [
    { label: "Analyzing prompt", duration: 2000 },
    { label: "Processing video", duration: 3000 },
    { label: "Finalizing", duration: 1500 },
  ];

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await api.get("/auth/me", {
          withCredentials: true,
        });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    if (!prompt.trim()) return;

    try {
      setProgressStep("processing");
      setProgress(0);

      
      const { data } = await api.post(
        "/video/generate-prompt",
        {
          categoryId,
          prompt,
        },
        { withCredentials: true },
      );

      setProgress(100);
      setProgressStep("complete");

      console.log("Generated Prompt:", data);
    } catch (err) {
      setProgressStep("idle");
      toast.error("Something went wrong");
    }
  };

  const handleReset = () => {
    setPrompt("");
    setProgressStep("idle");
    setProgress(0);
  };

  const handleDownload = () => {
    toast.success("Video downloaded successfully");
  };

  return {
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
    handleSubmit,
    handleReset,
    handleDownload,
  };
}
