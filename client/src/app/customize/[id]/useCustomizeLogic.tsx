"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { templates } from "@/utils/constant";
import api from "@/lib/auth";
import { downloadVideo } from "@/lib/videoDownload";
import {
  showInfoToast,
  showErrorToast,
  showSuccessToast,
} from "@/components/Toast/showToast";

interface FormDataState {
  [key: string]: string | File | null;
}

interface RenderJob {
  id: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  outputUrl?: string;
  progress?: number;
  error?: string;
}

interface CustomizePersistedState {
  formData: Record<string, string>;
  uploadedAssets: Record<string, string>;
  renderJob: RenderJob | null;
  useBackgroundColor?: boolean;
}

const getCustomizeStorageKey = (templateId: number) =>
  `customize-template-${templateId}-state`;

export const useCustomizeLogic = () => {
  const params = useParams();
  const router = useRouter();
  const templateId = parseInt(params.id as string);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasNotifiedRef = useRef(false);

  const template = templates.find((t) => t.id === templateId);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [renderJob, setRenderJob] = useState<RenderJob | null>(null);
  const [formData, setFormData] = useState<FormDataState>({});
  const [filePreviews, setFilePreviews] = useState<{ [key: string]: string }>(
    {},
  );
  const [uploadedAssets, setUploadedAssets] = useState<{
    [key: string]: string;
  }>({});
  const [uploadingAssets, setUploadingAssets] = useState<Set<string>>(
    new Set(),
  );
  const [imagePreviewReady, setImagePreviewReady] = useState<{
    [key: string]: boolean;
  }>({});
  const [isRestoringState, setIsRestoringState] = useState(true);
  const hasHydratedStateRef = useRef(false);

  // Video & image preview state
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [useBackgroundColor, setUseBackgroundColor] = useState(true);

  // Redirect if template not found
  useEffect(() => {
    if (!template) {
      router.push("/templates");
    }
  }, [template, router]);

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

  // Restore persisted state for this template, or initialize a clean form.
  useEffect(() => {
    if (template) {
      hasHydratedStateRef.current = false;
      setIsRestoringState(true);

      const initialData: FormDataState = {};
      Object.entries(template.fields).forEach(([key, field]) => {
        initialData[key] = field.type === "text" ? "" : "";
      });

      try {
        const savedState = window.localStorage.getItem(
          getCustomizeStorageKey(templateId),
        );

        if (savedState) {
          const parsedState = JSON.parse(
            savedState,
          ) as Partial<CustomizePersistedState>;

          Object.entries(template.fields).forEach(([key, field]) => {
            if (field.type === "text") {
              initialData[key] =
                typeof parsedState.formData?.[key] === "string"
                  ? parsedState.formData[key]
                  : "";
            }
          });

          setFormData(initialData);
          setUploadedAssets(parsedState.uploadedAssets ?? {});
          setRenderJob(parsedState.renderJob ?? null);
          setUseBackgroundColor(parsedState.useBackgroundColor ?? true);
        } else {
          setFormData(initialData);
          setUploadedAssets({});
          setRenderJob(null);
          setUseBackgroundColor(true);
        }
      } catch (error) {
        console.error("Failed to restore customize state:", error);
        setFormData(initialData);
        setUploadedAssets({});
        setRenderJob(null);
        setUseBackgroundColor(true);
      }

      setFilePreviews({});
      setUploadingAssets(new Set());
      setImagePreviewReady({});
      hasNotifiedRef.current = false;
      hasHydratedStateRef.current = true;
      setIsRestoringState(false);
    }
  }, [template]);

  // Persist the user-entered state so downloads or refreshes don't wipe it out.
  useEffect(() => {
    if (!template || !hasHydratedStateRef.current) return;

    try {
      const persistedFormData: Record<string, string> = {};

      Object.entries(template.fields).forEach(([key, field]) => {
        if (field.type !== "text") return;

        const value = formData[key];
        persistedFormData[key] = typeof value === "string" ? value : "";
      });

      const stateToPersist: CustomizePersistedState = {
        formData: persistedFormData,
        uploadedAssets,
        renderJob,
        useBackgroundColor,
      };

      window.localStorage.setItem(
        getCustomizeStorageKey(templateId),
        JSON.stringify(stateToPersist),
      );
    } catch (error) {
      console.error("Failed to persist customize state:", error);
    }
  }, [formData, uploadedAssets, renderJob, template, templateId, useBackgroundColor]);

  // Poll job status
  useEffect(() => {
    if (
      !renderJob ||
      renderJob.status === "COMPLETED" ||
      renderJob.status === "FAILED"
    ) {
      return;
    }

    // Reset notification flag when starting a new job
    hasNotifiedRef.current = false;

    const pollInterval = setInterval(async () => {
      try {
        const { data } = await api.get(`/render/job/${renderJob.id}`, {
          withCredentials: true,
        });

        // Check status BEFORE updating state to prevent re-triggering
        if (data.status === "COMPLETED") {
          clearInterval(pollInterval);
          // Only show toast once, even if multiple requests complete simultaneously
          if (!hasNotifiedRef.current) {
            hasNotifiedRef.current = true;
            showSuccessToast("Video rendered successfully!");
          }
          setRenderJob(data);
        } else if (data.status === "FAILED") {
          clearInterval(pollInterval);
          if (!hasNotifiedRef.current) {
            hasNotifiedRef.current = true;
            showErrorToast(data.error || "Rendering failed");
          }
          setRenderJob(data);
        } else {
          // Only update state if still processing
          setRenderJob(data);
        }
      } catch (error) {
        console.error("Failed to poll job status:", error);
      }
    }, 8000);

    return () => clearInterval(pollInterval);
  }, [renderJob]);

  // Cleanup video on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = "";
      }
    };
  }, []);

  const handleVideoClick = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!isVideoPlaying) {
      // Start playing
      if (!isVideoLoaded) {
        setIsVideoLoading(true);
        video.src = template!.previewUrl;
        video.load();
      } else {
        video.play().catch(() => {
          console.error("Play failed");
        });
      }
      setIsVideoPlaying(true);
    } else {
      // Pause video
      video.pause();
      setIsVideoPlaying(false);
    }
  };

  const handleVideoLoaded = () => {
    setIsVideoLoaded(true);
    setIsVideoLoading(false);

    if (isVideoPlaying && videoRef.current) {
      videoRef.current.play().catch(() => {
        console.error("Autoplay failed");
      });
    }
  };

  const handleVideoError = () => {
    setIsVideoLoading(false);
    setIsVideoLoaded(false);
    showErrorToast("Failed to load video preview");
  };

  const handleVideoEnded = () => {
    setIsVideoPlaying(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  const handleTextChange = (fieldKey: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldKey]: value }));
  };

  // Validate image dimensions match the required dimensions
  const validateImageDimensions = (
    file: File,
    requiredWidth: number,
    requiredHeight: number,
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const isValid =
            img.width === requiredWidth && img.height === requiredHeight;
          console.log(
            `Image validation: ${img.width}x${img.height} vs required ${requiredWidth}x${requiredHeight} - ${isValid ? "✓ PASS" : "✗ FAIL"}`,
          );
          resolve(isValid);
        };
        img.onerror = () => {
          console.error("Failed to load image for validation");
          resolve(false);
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => {
        console.error("FileReader error");
        resolve(false);
      };
      reader.readAsDataURL(file);
    });
  };

  // Validate image dimensions are within a range (for icons)
  const validateImageDimensionsRange = (
    file: File,
    minWidth: number,
    minHeight: number,
    maxWidth: number,
    maxHeight: number,
  ): Promise<{
    isValid: boolean;
    actualWidth: number;
    actualHeight: number;
  }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const isValid =
            img.width >= minWidth &&
            img.width <= maxWidth &&
            img.height >= minHeight &&
            img.height <= maxHeight;
          console.log(
            `Image range validation: ${img.width}x${img.height} vs range ${minWidth}x${minHeight} to ${maxWidth}x${maxHeight} - ${isValid ? "✓ PASS" : "✗ FAIL"}`,
          );
          resolve({
            isValid,
            actualWidth: img.width,
            actualHeight: img.height,
          });
        };
        img.onerror = () => {
          console.error("Failed to load image for validation");
          resolve({ isValid: false, actualWidth: 0, actualHeight: 0 });
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => {
        console.error("FileReader error");
        resolve({ isValid: false, actualWidth: 0, actualHeight: 0 });
      };
      reader.readAsDataURL(file);
    });
  };

  // Validate video dimensions match the required dimensions
  const validateVideoDimensions = (
    file: File,
    requiredWidth: number,
    requiredHeight: number,
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const isValid =
          video.videoWidth === requiredWidth &&
          video.videoHeight === requiredHeight;
        console.log(
          `Video validation: ${video.videoWidth}x${video.videoHeight} vs required ${requiredWidth}x${requiredHeight} - ${isValid ? "✓ PASS" : "✗ FAIL"}`,
        );
        resolve(isValid);
      };

      video.onerror = () => {
        console.error("Failed to load video for validation");
        window.URL.revokeObjectURL(video.src);
        resolve(false);
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (
    fieldKey: string,
    file: File | null,
    inputElement?: HTMLInputElement,
  ) => {
    if (!file) return;

    if (file.type.startsWith("image/")) {
      // Get the field to check if it has required dimensions
      const field = template?.fields[fieldKey];
      if (field && field.dimensions) {
        // Check if dimensions contain a range (e.g., "800x800-1920x1920")
        if (field.dimensions.includes("-")) {
          // Parse range dimensions
          const [minDimensions, maxDimensions] = field.dimensions.split("-");
          const [minWidth, minHeight] = minDimensions
            .split("x")
            .map((d) => parseInt(d.trim()));
          const [maxWidth, maxHeight] = maxDimensions
            .split("x")
            .map((d) => parseInt(d.trim()));

          if (minWidth && minHeight && maxWidth && maxHeight) {
            try {
              const result = await validateImageDimensionsRange(
                file,
                minWidth,
                minHeight,
                maxWidth,
                maxHeight,
              );
              if (!result.isValid) {
                showErrorToast(
                  `❌ Invalid dimensions! Required: ${field.dimensions} (Got: ${result.actualWidth}x${result.actualHeight})`,
                );
                // Clear the file input so user can try again
                if (inputElement) {
                  inputElement.value = "";
                }
                setImagePreviewReady((prev) => {
                  const next = { ...prev };
                  delete next[fieldKey];
                  return next;
                });
                return;
              }
            } catch (error) {
              console.error("Image range validation failed", error);
              showErrorToast("Failed to validate image");
              if (inputElement) {
                inputElement.value = "";
              }
              setImagePreviewReady((prev) => {
                const next = { ...prev };
                delete next[fieldKey];
                return next;
              });
              return;
            }
          }
        } else {
          // Parse exact dimensions (format: "1920x1080")
          const [width, height] = field.dimensions
            .split("x")
            .map((d) => parseInt(d.trim()));

          if (width && height) {
            try {
              const isValid = await validateImageDimensions(
                file,
                width,
                height,
              );
              if (!isValid) {
                showErrorToast(
                  `❌ Invalid dimensions! Required: ${field.dimensions}`,
                );
                // Clear the file input so user can try again
                if (inputElement) {
                  inputElement.value = "";
                }
                setImagePreviewReady((prev) => {
                  const next = { ...prev };
                  delete next[fieldKey];
                  return next;
                });
                return; // Stop upload if dimensions don't match
              }
            } catch (error) {
              console.error("Image validation failed", error);
              showErrorToast("Failed to validate image");
              // Clear the file input
              if (inputElement) {
                inputElement.value = "";
              }
              setImagePreviewReady((prev) => {
                const next = { ...prev };
                delete next[fieldKey];
                return next;
              });
              return;
            }
          }
        }
      }

      setImagePreviewReady((prev) => ({
        ...prev,
        [fieldKey]: false,
      }));

      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreviews((prev) => ({
          ...prev,
          [fieldKey]: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith("video/")) {
      // Get the field to check if it has required dimensions
      const field = template?.fields[fieldKey];
      if (field && field.dimensions) {
        // Parse dimensions (format: "1920x1080")
        const [width, height] = field.dimensions
          .split("x")
          .map((d) => parseInt(d.trim()));

        if (width && height) {
          try {
            const isValid = await validateVideoDimensions(file, width, height);
            if (!isValid) {
              showErrorToast(
                `❌ Invalid video dimensions! Required: ${field.dimensions}`,
              );
              // Clear the file input so user can try again
              if (inputElement) {
                inputElement.value = "";
              }
              return; // Stop upload if dimensions don't match
            }
          } catch (error) {
            console.error("Video validation failed", error);
            showErrorToast("Failed to validate video");
            // Clear the file input
            if (inputElement) {
              inputElement.value = "";
            }
            return;
          }
        }
      }

      const videoUrl = URL.createObjectURL(file);
      setFilePreviews((prev) => ({ ...prev, [fieldKey]: videoUrl }));
    }

    setFormData((prev) => ({ ...prev, [fieldKey]: file }));
    await uploadSingleAsset(fieldKey, file);
  };

  const uploadSingleAsset = async (fieldKey: string, file: File) => {
    if (!isLoggedIn) return;

    // Mark this field as uploading
    setUploadingAssets((prev) => new Set(prev).add(fieldKey));

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("files", file);

      const { data } = await api.post("/render/upload-asset", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      setUploadedAssets((prev) => ({
        ...prev,
        [fieldKey]: data.urls[0],
      }));

      showSuccessToast(`${fieldKey} uploaded successfully`);
    } catch (error) {
      console.error("Upload failed:", error);
      showErrorToast(`Failed to upload ${fieldKey}`);
    } finally {
      // Remove from uploading set
      setUploadingAssets((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fieldKey);
        return newSet;
      });
    }
  };

  const removeFile = (fieldKey: string) => {
    setFormData((prev) => ({ ...prev, [fieldKey]: null }));
    setFilePreviews((prev) => {
      const newPreviews = { ...prev };
      delete newPreviews[fieldKey];
      return newPreviews;
    });
    setImagePreviewReady((prev) => {
      const newPreviewState = { ...prev };
      delete newPreviewState[fieldKey];
      return newPreviewState;
    });
    setUploadedAssets((prev) => {
      const newAssets = { ...prev };
      delete newAssets[fieldKey];
      return newAssets;
    });
  };

  const deleteAsset = async (fieldKey: string) => {
    if (!uploadedAssets[fieldKey]) return;

    try {
      const assetUrl = uploadedAssets[fieldKey];

      // Extract publicId and resourceType from the URL
      const resourceType = assetUrl.includes("/video/") ? "video" : "image";

      // Extract everything after /upload/v{version}/
      const uploadMatch = assetUrl.match(/\/upload\/v\d+\/(.+?)(?:\?|$)/);
      if (!uploadMatch) {
        throw new Error("Invalid Cloudinary URL format");
      }

      const fullPath = uploadMatch[1];
      // Remove the file extension
      const publicId = fullPath.substring(0, fullPath.lastIndexOf("."));

      console.log(`Deleting asset: ${publicId} (${resourceType})`);

      // Call the delete endpoint
      await api.delete("/render/delete-asset", {
        data: {
          publicId,
          resourceType,
        },
        withCredentials: true,
      });

      // Remove from state
      setUploadedAssets((prev) => {
        const newAssets = { ...prev };
        delete newAssets[fieldKey];
        return newAssets;
      });

      // Remove preview
      setFilePreviews((prev) => {
        const newPreviews = { ...prev };
        delete newPreviews[fieldKey];
        return newPreviews;
      });

      setImagePreviewReady((prev) => {
        const newPreviewState = { ...prev };
        delete newPreviewState[fieldKey];
        return newPreviewState;
      });

      showSuccessToast(`${fieldKey} deleted successfully`);
    } catch (error) {
      console.error("Failed to delete asset:", error);
      showErrorToast(`Failed to delete ${fieldKey}`);
    }
  };

  const hasRequiredFields = () => {
    if (!template) return false;

    // Check if any uploads are still in progress
    if (uploadingAssets.size > 0) return false;

    return Object.entries(template.fields).every(([key, field]) => {
      if (key === "background") {
        return true;
      }

      if (field.required) {
        if (field.type === "image" || field.type === "video" || field.type === "media") {
          return !!uploadedAssets[key];
        }
        const value = formData[key];
        return value !== "" && value !== null;
      }
      return true;
    });
  };

  const handleGeneratePreview = async () => {
    if (!isLoggedIn) {
      showInfoToast("Please log in to generate preview");
      router.push("/login");
      return;
    }

    setIsGenerating(true);

    try {
      const renderDto: any = {};

      Object.entries(template!.fields).forEach(([key, field]) => {
        if (key === "background") {
          return;
        }

        if (field.type === "text") {
          const value = formData[key] as string;
          if (value) {
            renderDto[key] = value;
          }
        } else if (field.type === "image" || field.type === "video") {
          if (uploadedAssets[key]) {
            renderDto[key] = uploadedAssets[key];
          }
        } else if (field.type === "media") {
          if (uploadedAssets[key]) {
            const url = uploadedAssets[key];
            const n = key.replace("media", "");
            const isVideo = url.includes("/video/");
            const dtoKey = isVideo ? `video${n}` : `image${n}`;
            renderDto[dtoKey] = url;
          }
        }
      });

      const { data } = await api.post(
        `/render/create-job/${templateId}`,
        {
          ...renderDto,
          useBackgroundColor,
        },
        {
          withCredentials: true,
        },
      );

      setRenderJob(data);
      showInfoToast("Render job submitted! Processing...");
    } catch (error: any) {
      console.error("Failed to create render job:", error);
      showErrorToast(
        error.response?.data?.message || "Failed to create render job",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!renderJob?.outputUrl) return;

    setIsDownloading(true);
    setDownloadProgress(50);

    try {
      const timestamp = new Date().toISOString().slice(0, 10);
      const downloadUrl = renderJob.outputUrl;

      await new Promise<void>((resolve, reject) => {
        const ext = useBackgroundColor ? "mp4" : "mov";
        downloadVideo(downloadUrl, {
          filename: `video-${timestamp}.${ext}`,
          onProgress: (progress) => setDownloadProgress(progress),
          onSuccess: () => {
            setDownloadProgress(100);
            showInfoToast("Video downloaded successfully!");
            resolve();
          },
          onError: (message) => reject(new Error(message)),
        });
      });
    } catch (error) {
      console.error("Failed to download video:", error);
      showErrorToast("Failed to download video");
    } finally {
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
      }, 1000);
    }
  };

  return {
    template,
    renderJob,
    formData,
    filePreviews,
    uploadedAssets,
    uploadingAssets,
    isVideoPlaying,
    isVideoLoaded,
    isVideoLoading,
    imageError,
    setImageError,
    isDownloading,
    downloadProgress,
    authLoading,
    isGenerating,
    isUploading,
    isLoggedIn,
    videoRef,
    handleVideoClick,
    handleVideoLoaded,
    handleVideoError,
    handleVideoEnded,
    handleTextChange,
    handleFileUpload,
    uploadSingleAsset,
    removeFile,
    deleteAsset,
    hasRequiredFields,
    handleGeneratePreview,
    handleDownload,
    useBackgroundColor,
    setUseBackgroundColor,
    imagePreviewReady,
    setImagePreviewReady,
    isRestoringState,
    setFilePreviews,
    setUploadedAssets,
    setFormData,
    setUploadingAssets,
  } as const;
};

export default useCustomizeLogic;
