import api from "./api";

export type RenderJobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type RenderJobType = "TEMPLATE" | "AI_PROMPT";

export interface RenderJobRecord {
  id: string;
  templateId: number | null;
  renderType: RenderJobType;
  status: RenderJobStatus;
  outputUrl: string | null;
  previewUrl?: string | null;
  nexrenderOutputUrl: string | null;
  error: string | null;
  promptText: string | null;
  expiresAt?: string | null;
  isExpired?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const jobsApi = {
  getMyJobs: async (): Promise<RenderJobRecord[]> => {
    const { data } = await api.get("/render/jobs");
    return data;
  },
  deleteJob: async (jobId: string): Promise<void> => {
    await api.delete(`/render/job/${jobId}`);
  },
};

