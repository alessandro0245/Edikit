"use client";

import { useEffect, useRef } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Folder,
  Loader2,
  MoreVertical,
  Play,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import MovPreview from "@/components/MovPreview";
import VideoDownloadButton from "@/components/Video/VideoDownloadButton";
import { useDashboardJobs } from "./useDashboardJobs";
import type { DashboardJob } from "./useDashboardJobs";

const getStatusBadgeClass = (status: DashboardJob["status"]) => {
  switch (status) {
    case "COMPLETED":
      return "bg-green-100 text-green-800 border border-green-300";
    case "FAILED":
      return "bg-red-100 text-red-800 border border-red-300";
    case "PROCESSING":
      return "bg-blue-100 text-blue-800 border border-blue-300";
    case "PENDING":
      return "bg-yellow-100 text-yellow-800 border border-yellow-300";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusIcon = (status: DashboardJob["status"]) => {
  switch (status) {
    case "COMPLETED":
      return <CheckCircle2 className="h-4 w-4" />;
    case "FAILED":
      return <AlertCircle className="h-4 w-4" />;
    case "PROCESSING":
    case "PENDING":
      return <Loader2 className="h-4 w-4 animate-spin" />;
    default:
      return <span>-</span>;
  }
};

const getJobIcon = (job: DashboardJob) => {
  if (job.status === "PROCESSING" || job.status === "PENDING") {
    return <Loader2 className="h-5 w-5 animate-spin text-white" />;
  }

  if (job.status === "FAILED") {
    return <AlertCircle className="h-5 w-5 text-white" />;
  }

  return job.outputUrl ? (
    <Play className="h-5 w-5 text-white" />
  ) : (
    <Folder className="h-5 w-5 text-white" />
  );
};

const isMovUrl = (url: string | null | undefined) =>
  Boolean(url?.toLowerCase().includes(".mov"));

const formatFileName = (title: string, outputUrl?: string | null) =>
  `${
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "video"
  }.${isMovUrl(outputUrl) ? "mov" : "mp4"}`;

const JobsSkeleton = () => (
  <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
    <table className="w-full">
      <thead>
        <tr className="border-b border-border bg-muted">
          <th className="px-4 py-4 text-left text-sm font-semibold text-foreground lg:px-6">
            Job / Template
          </th>
          <th className="px-4 py-4 text-left text-sm font-semibold text-foreground lg:px-6">
            Status
          </th>
          <th className="px-4 py-4 text-left text-sm font-semibold text-foreground lg:px-6">
            Created
          </th>
          <th className="px-4 py-4 text-left text-sm font-semibold text-foreground lg:px-6">
            Render Time
          </th>
          <th className="px-4 py-4 text-left text-sm font-semibold text-foreground lg:px-6">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 4 }).map((_, index) => (
          <tr key={index} className="animate-pulse border-b border-border">
            <td className="px-4 py-4 lg:px-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded bg-muted" />
                <div className="space-y-2">
                  <div className="h-3 w-40 rounded bg-muted" />
                  <div className="h-3 w-28 rounded bg-muted" />
                </div>
              </div>
            </td>
            <td className="px-4 py-4 lg:px-6">
              <div className="h-8 w-24 rounded-full bg-muted" />
            </td>
            <td className="px-4 py-4 lg:px-6">
              <div className="h-3 w-20 rounded bg-muted" />
            </td>
            <td className="px-4 py-4 lg:px-6">
              <div className="h-3 w-16 rounded bg-muted" />
            </td>
            <td className="px-4 py-4 lg:px-6">
              <div className="h-8 w-8 rounded bg-muted" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function DashboardJobsPage() {
  const {
    jobs,
    loading,
    error,
    refresh,
    activeMenuJobId,
    previewJob,
    deletingJobId,
    openPreview,
    closePreview,
    toggleMenu,
    closeMenu,
    deleteJob,
  } = useDashboardJobs();

  const actionsRefs = useRef<
    Record<
      string,
      { desktop: HTMLDivElement | null; mobile: HTMLDivElement | null }
    >
  >({});

  const setActionsRef =
    (jobId: string, variant: "desktop" | "mobile") =>
    (node: HTMLDivElement | null) => {
      actionsRefs.current[jobId] = {
        ...(actionsRefs.current[jobId] ?? { desktop: null, mobile: null }),
        [variant]: node,
      };
    };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!activeMenuJobId) return;

      const target = event.target as Node;
      const currentRefs = actionsRefs.current[activeMenuJobId];
      const isInsideMenu = currentRefs
        ? Object.values(currentRefs).some((ref) =>
            Boolean(ref && ref.contains(target)),
          )
        : false;

      if (!isInsideMenu) {
        closeMenu();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
        closePreview();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [activeMenuJobId, closeMenu, closePreview]);

  return (
    <div className="space-y-6">
      <div className="ml-10 mt-10 flex flex-wrap items-end justify-between gap-4 pr-4">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">
            Jobs
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Monitor and manage your render jobs here.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {loading ? (
        <JobsSkeleton />
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <p className="font-medium">Could not load jobs</p>
          </div>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-4 py-4 text-left text-sm font-semibold text-foreground lg:px-6">
                    Job / Template
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-foreground lg:px-6">
                    Status
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-foreground lg:px-6">
                    Created
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-foreground lg:px-6">
                    Render Time
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-foreground lg:px-6">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="border-b border-border transition-colors hover:bg-muted/50"
                  >
                    <td className="px-4 py-4 lg:px-6">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => job.outputUrl && openPreview(job)}
                          disabled={!job.outputUrl}
                          className={`flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 transition-opacity ${job.outputUrl ? "cursor-pointer hover:opacity-90" : "cursor-not-allowed opacity-60"}`}
                          aria-label={
                            job.outputUrl
                              ? `Preview ${job.title}`
                              : `${job.title} is not ready for preview`
                          }
                        >
                          {getJobIcon(job)}
                        </button>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {job.title}
                          </p>
                          <p className="truncate text-xs italic text-muted-foreground">
                            {job.subtitle}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {job.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 lg:px-6">
                      <span
                        className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium ${getStatusBadgeClass(job.status)}`}
                      >
                        {getStatusIcon(job.status)}
                        {job.status.charAt(0) +
                          job.status.slice(1).toLowerCase()}
                      </span>
                    </td>

                    <td className="px-4 py-4 lg:px-6">
                      <p className="text-sm text-foreground">
                        {job.createdLabel}
                      </p>
                    </td>

                    <td className="px-4 py-4 lg:px-6">
                      <p className="text-sm text-foreground">
                        {job.renderTimeLabel}
                      </p>
                    </td>

                    <td className="px-4 py-4 lg:px-6">
                      <div
                        ref={setActionsRef(job.id, "desktop")}
                        className="relative inline-block text-left"
                      >
                        <button
                          type="button"
                          onClick={() => toggleMenu(job.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted"
                          aria-haspopup="menu"
                          aria-expanded={activeMenuJobId === job.id}
                          aria-label="Job actions"
                        >
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </button>

                        {activeMenuJobId === job.id && (
                          <div className="absolute bottom-full right-0 z-20 mb-2 w-52 rounded-xl border border-border bg-card p-2 shadow-xl">
                            <button
                              type="button"
                              onClick={() => void deleteJob(job.id)}
                              disabled={deletingJobId === job.id}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Trash2 className="h-4 w-4" />
                              {deletingJobId === job.id
                                ? "Deleting..."
                                : "Delete video"}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="space-y-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <button
                      type="button"
                      onClick={() => job.outputUrl && openPreview(job)}
                      disabled={!job.outputUrl}
                      className={`flex h-10 w-10 items-center justify-center rounded bg-slate-700 transition-opacity ${job.outputUrl ? "cursor-pointer hover:opacity-90" : "cursor-not-allowed opacity-60"}`}
                      aria-label={
                        job.outputUrl
                          ? `Preview ${job.title}`
                          : `${job.title} is not ready for preview`
                      }
                    >
                      {getJobIcon(job)}
                    </button>
                    <div className="min-w-0">
                      <p className="wrap-break-word text-sm font-medium text-foreground">
                        {job.title}
                      </p>
                      <p className="text-xs italic text-muted-foreground">
                        {job.subtitle}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {job.id}
                      </p>
                    </div>
                  </div>
                  <div
                    ref={setActionsRef(job.id, "mobile")}
                    className="relative inline-block text-left"
                  >
                    <button
                      type="button"
                      onClick={() => toggleMenu(job.id)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted"
                      aria-haspopup="menu"
                      aria-expanded={activeMenuJobId === job.id}
                      aria-label="Job actions"
                    >
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </button>

                    {activeMenuJobId === job.id && (
                      <div className="absolute bottom-full right-0 z-20 mb-2 w-52 rounded-xl border border-border bg-card p-2 shadow-xl">
                        <div className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                          Job actions
                        </div>
                        <button
                          type="button"
                          onClick={() => void deleteJob(job.id)}
                          disabled={deletingJobId === job.id}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 className="h-4 w-4" />
                          {deletingJobId === job.id
                            ? "Deleting..."
                            : "Delete video"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="mb-1 font-medium text-muted-foreground">
                      Status
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${getStatusBadgeClass(job.status)}`}
                    >
                      {getStatusIcon(job.status)}
                      {job.status.charAt(0) + job.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                  <div>
                    <p className="mb-1 font-medium text-muted-foreground">
                      Created
                    </p>
                    <p className="text-foreground">{job.createdLabel}</p>
                  </div>
                  <div>
                    <p className="mb-1 font-medium text-muted-foreground">
                      Render Time
                    </p>
                    <p className="text-foreground">{job.renderTimeLabel}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!jobs.length && (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground md:text-base">
                No jobs found for your account yet.
              </p>
            </div>
          )}
        </>
      )}

      {previewJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={closePreview}
        >
          <div
            className="w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {previewJob.title}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {previewJob.subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={closePreview}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Close preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
              <div className="overflow-hidden rounded-xl border border-border bg-black">
                {previewJob.outputUrl ? (
                  isMovUrl(previewJob.outputUrl) ? (
                    <MovPreview
                      src={previewJob.outputUrl}
                      className="h-full w-full max-h-[70vh] object-contain"
                    />
                  ) : (
                    <video
                      src={previewJob.outputUrl}
                      controls
                      autoPlay
                      className="h-full w-full max-h-[70vh] object-contain"
                    />
                  )
                ) : (
                  <div className="flex min-h-80 items-center justify-center text-sm text-muted-foreground">
                    Preview unavailable
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    Job ID
                  </p>
                  <p className="mt-1 break-all text-sm text-foreground">
                    {previewJob.id}
                  </p>
                  <p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">
                    Status
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {previewJob.status}
                  </p>
                </div>

                {previewJob.outputUrl && (
                  <VideoDownloadButton
                    videoUrl={previewJob.outputUrl}
                    filename={formatFileName(previewJob.title, previewJob.outputUrl)}
                  />
                )}

                {previewJob.error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    {previewJob.error}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
