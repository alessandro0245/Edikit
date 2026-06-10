"use client";

import { useEffect, useState } from "react";
import { showErrorToast, showSuccessToast } from "@/components/Toast/showToast";
import { jobsApi, type RenderJobRecord } from "@/lib/jobs";
import { templates } from "@/utils/constant";

export interface DashboardJob {
  id: string;
  title: string;
  subtitle: string;
  status: RenderJobRecord["status"];
  createdLabel: string;
  renderTimeLabel: string;
  outputUrl: string | null;
  error: string | null;
}

const statusLabels: Record<RenderJobRecord["status"], string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
  FAILED: "Failed",
};

const formatRelativeDate = (value: string) => {
  const createdAt = new Date(value);
  const diffMs = Date.now() - createdAt.getTime();
  const diffMinutes = Math.max(Math.floor(diffMs / 60000), 0);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  return `${diffDays}d ago`;
};

const formatDuration = (createdAt: string, updatedAt: string, status: RenderJobRecord["status"]) => {
  if (status !== "COMPLETED") {
    return "—";
  }

  const durationMs = new Date(updatedAt).getTime() - new Date(createdAt).getTime();

  if (durationMs <= 0) {
    return "—";
  }

  const totalSeconds = Math.max(Math.round(durationMs / 1000), 1);

  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
};

const resolveTitle = (job: RenderJobRecord) => {
  if (job.renderType === "AI_PROMPT") {
    return job.promptText?.trim() || "AI Prompt Job";
  }

  const template = templates.find((item) => item.id === job.templateId);
  return template?.name || (job.templateId ? `Template #${job.templateId}` : "Template Job");
};

const resolveSubtitle = (job: RenderJobRecord) => {
  if (job.renderType === "AI_PROMPT") {
    return "AI prompt render";
  }
 
};

export const useDashboardJobs = () => {
  const [jobs, setJobs] = useState<DashboardJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMenuJobId, setActiveMenuJobId] = useState<string | null>(null);
  const [previewJob, setPreviewJob] = useState<DashboardJob | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);

  const loadJobs = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await jobsApi.getMyJobs();
      setJobs(
        data.map((job) => ({
          id: job.id,
          title: resolveTitle(job),
          subtitle: `${resolveSubtitle(job)} · ${statusLabels[job.status]}`,
          status: job.status,
          createdLabel: formatRelativeDate(job.createdAt),
          renderTimeLabel: formatDuration(job.createdAt, job.updatedAt, job.status),
          outputUrl: job.outputUrl || job.nexrenderOutputUrl,
          error: job.error,
        })),
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load your jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadJobs();
  }, []);

  const openPreview = (job: DashboardJob) => {
    setActiveMenuJobId(null);
    setPreviewJob(job);
  };

  const closePreview = () => {
    setPreviewJob(null);
  };

  const toggleMenu = (jobId: string) => {
    setActiveMenuJobId((current) => (current === jobId ? null : jobId));
  };

  const closeMenu = () => {
    setActiveMenuJobId(null);
  };

  const deleteJob = async (jobId: string) => {
    setDeletingJobId(jobId);

    try {
      await jobsApi.deleteJob(jobId);
      if (previewJob?.id === jobId) {
        closePreview();
      }
      await loadJobs();
      showSuccessToast("Job deleted successfully");
    } catch (requestError) {
      showErrorToast(
        "Could not delete job",
        requestError instanceof Error ? requestError.message : "Please try again",
      );
    } finally {
      setDeletingJobId(null);
      setActiveMenuJobId(null);
    }
  };

  return {
    jobs,
    loading,
    error,
    refresh: loadJobs,
    activeMenuJobId,
    previewJob,
    deletingJobId,
    openPreview,
    closePreview,
    toggleMenu,
    closeMenu,
    deleteJob,
  };
};