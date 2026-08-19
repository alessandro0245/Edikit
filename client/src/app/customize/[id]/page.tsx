"use client";
import { useState } from "react";
import {
  ArrowLeft,
  Upload,
  Sparkles,
  Download,
  Loader2,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  Volume2,
  VolumeX,
} from "lucide-react";
import Link from "next/link";
import useCustomizeLogic from "./useCustomizeLogic";
import AnimationPreview from "@/components/Video/AnimationPreview";
import VideoPlayer from "@/components/Video/VideoPlayer";
import { toMp4PreviewUrl } from "@/components/MovPreview";
import {
  getTemplateOrientation,
} from "@/utils/templateOrientation";
import FileDropZone from "@/components/Upload/FileDropZone";
import EdikitButton from "@/components/ShimmerButton/ShimmerButton";
import FontPicker, { type FontId } from "@/components/FontPicker/FontPicker";


const CustomizePage = () => {
  const [previewRatio, setPreviewRatio] = useState("9/16");
  const {
    template,
    renderJob,
    formData,
    filePreviews,
    uploadedAssets,
    uploadingAssets,
    isDownloading,
    downloadProgress,
    authLoading,
    isGenerating,
    isUploading,
    isLoggedIn,
    handleTextChange,
    handleFileUpload,
    removeFile,
    deleteAsset,
    hasRequiredFields,
    handleGeneratePreview,
    handleDownload,
    useBackgroundColor,
    setUseBackgroundColor,
    muteAudio,
    setMuteAudio,
    selectedFont,
    setSelectedFont,
    setImagePreviewReady,
    videoResizeProgress,
    deletingAssets,
  } = useCustomizeLogic();

  if (!template) {
    return null;
  }

  // Check if we should show rendered video or template preview
  const showRenderedVideo =
    renderJob?.status === "COMPLETED" && renderJob.outputUrl;

  const templateOrientation = getTemplateOrientation(template);

  const renderedVideoSrc = showRenderedVideo
    ? (toMp4PreviewUrl(renderJob.outputUrl!) ?? renderJob.outputUrl!)
    : null;

  return (
    <div className="min-h-screen bg-background relative">
      {isDownloading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div>
                <p className="font-medium text-foreground">
                  Preparing download
                </p>
                <p className="text-sm text-muted-foreground">
                  Keep this tab open while the file is being prepared.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${Math.max(downloadProgress, 10)}%` }}
                />
              </div>
              <p className="text-xs text-right text-muted-foreground">
                {downloadProgress}%
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-4">
        <Link
          href="/templates"
          className="rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors "
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-12 max-w-7xl mx-auto items-start">
          {/* Left Column - Sticky Preview */}
          <div className="lg:sticky lg:top-16 space-y-4 order-2 lg:order-1">
            <div className="rounded-2xl overflow-hidden shadow-sm">
              <div className="p-2">
                <div className="flex items-center gap-1">
                  <h2 className="font-semibold text-foreground text-xl">
                    Preview
                  </h2>
                </div>
              </div>

              <div className="p-2">
                <div
                  className="overflow-hidden rounded-xl border border-border bg-black relative mx-auto w-full max-h-[79vh] shadow-2xl transition-all"
                  style={{ aspectRatio: previewRatio }}
                >
                  {showRenderedVideo && renderedVideoSrc ? (
                    <VideoPlayer
                      src={renderedVideoSrc}
                      autoPlay
                      loop
                      muted
                      controls
                      variant="minimal"
                      aspectRatio="none"
                      showDownload={false}
                      showFullscreen
                      className="h-full w-full rounded-none"
                    />
                  ) : (
                    <AnimationPreview
                      src={template.previewUrl}
                      poster={template.thumbnail}
                      orientation={templateOrientation}
                      fit="contain"
                      showFullscreen
                      playOverlay={false}
                      trigger="auto"
                      className="h-full w-full"
                    />
                  )}
                </div>
                
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  The preview shows how your customization will look.
                </p>
              </div>
            </div>

            {/* Upgrade CTA */}
            {/* <div className="p-6 rounded-lg bg-linear-to-br from-primary/10 to-primary/5 border border-primary/20">
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">
                  Unlock Premium Features
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    4K resolution exports
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Remove watermark
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Transparent backgrounds
                  </li>
                </ul>
               
                <EdikitButton
                href="/pricing"
                width="w-full"
                >
                  Upgrade to Pro
                </EdikitButton>
              </div>
            </div> */}
          </div>

          {/* Right Column - Scrollable Form */}
          <div className="space-y-6 order-1 lg:order-2">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">
                {template.name}
              </h1>
              <p className="text-muted-foreground">
                Customize this template and generate a video in seconds.
              </p>
            </div>

            <div className="p-6 rounded-lg space-y-5 bg-card border border-border">
              {/* Dynamic Fields */}
              {Object.entries(template.fields)
                .filter(([fieldKey]) => fieldKey !== "background")
                .map(([fieldKey, field]) => (
                  <div key={fieldKey} className="space-y-1">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      {field.label}
                      {field.required && (
                        <span className="text-red-500 text-xs">*</span>
                      )}
                      {field.dimensions && (
                        <span className="text-xs text-muted-foreground font-normal">
                          ({field.dimensions})
                        </span>
                      )}
                      {uploadedAssets[fieldKey] && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </label>

                    {/* Text Input */}
                    {field.type === "text" && (
                      <div>
                        <input
                          type="text"
                          value={(formData[fieldKey] as string) ?? field.value ?? ""}
                          onChange={(e) =>
                            handleTextChange(fieldKey, e.target.value)
                          }
                          maxLength={field.maxLength}
                          className="w-full h-7 px-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                        />
                        {field.maxLength && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {((formData[fieldKey] as string) || "").length} /{" "}
                            {field.maxLength} characters
                          </p>
                        )}
                        {formData[fieldKey] === " " && (
                          <p className="text-xs text-blue-500/80 mt-1 flex items-center gap-1.5">
                            <Info className="w-3 h-3" />
                            Field cleared. A space will be used for rendering purpose.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Color Input */}
                    {field.type === "color" && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="relative flex items-center justify-center h-10 w-12 rounded-lg border border-border bg-background overflow-hidden hover:border-primary/50 transition-colors">
                            <input
                              type="color"
                              id={`color-${fieldKey}`}
                              value={
                                ((formData[fieldKey] as string) ||
                                field.value ||
                                "#3B82F6").startsWith("#")
                                  ? ((formData[fieldKey] as string) ||
                                      field.value ||
                                      "#3B82F6")
                                  : "#3B82F6"
                              }
                              onChange={(e) =>
                                handleTextChange(fieldKey, e.target.value)
                              }
                              className="h-14 w-14 cursor-pointer border-0 bg-transparent p-0 -m-2"
                            />
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={
                                (formData[fieldKey] as string) ??
                                field.value ??
                                "#3B82F6"
                              }
                              onChange={(e) => {
                                let val = e.target.value;
                                if (val && !val.startsWith("#") && !val.startsWith(" ")) {
                                  val = `#${val}`;
                                }
                                handleTextChange(fieldKey, val);
                              }}
                              maxLength={7}
                              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground font-mono text-sm uppercase placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                              placeholder="#3B82F6"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Select color for {field.label.toLowerCase()}.
                        </p>
                      </div>
                    )}

                    {/* Image Upload */}
                    {field.type === "image" && (
                      <div>
                        {filePreviews[fieldKey] || uploadedAssets[fieldKey] ? (
                          <FileDropZone
                            inputId={`upload-${fieldKey}`}
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            onFileSelect={(file, input) =>
                              handleFileUpload(fieldKey, file, input)
                            }
                            className="overflow-hidden rounded-xl border border-border max-w-72 mx-auto"
                          >
                            <div className="bg-checker aspect-square flex items-center justify-center p-3">
                              <img
                                src={
                                  filePreviews[fieldKey] ||
                                  uploadedAssets[fieldKey]
                                }
                                alt={`${field.label} preview`}
                                onLoad={() =>
                                  setImagePreviewReady((prev) => ({
                                    ...prev,
                                    [fieldKey]: true,
                                  }))
                                }
                                onError={() =>
                                  setImagePreviewReady((prev) => ({
                                    ...prev,
                                    [fieldKey]: true,
                                  }))
                                }
                                className="max-h-72 max-w-72 object-contain pointer-events-none"
                              />
                            </div>
                            <div className="flex items-center justify-between px-3 py-2 bg-card border-t border-border">
                              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Upload className="w-3 h-3" /> Click or drag to
                                replace
                              </span>
                              <button
                                onClick={async (event) => {
                                  event.stopPropagation();
                                  uploadedAssets[fieldKey]
                                    ? await deleteAsset(fieldKey)
                                    : removeFile(fieldKey);
                                }}
                                disabled={deletingAssets.has(fieldKey)}
                                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors cursor-pointer ${
                                  deletingAssets.has(fieldKey)
                                    ? "text-red-400/40 pointer-events-none cursor-not-allowed"
                                    : "text-red-400/70 hover:text-red-400 hover:bg-red-400/10"
                                }`}
                                type="button"
                              >
                                {deletingAssets.has(fieldKey) ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" /> Removing
                                  </>
                                ) : (
                                  <>
                                    <X className="w-3 h-3" /> Remove
                                  </>
                                )}
                              </button>
                            </div>
                          </FileDropZone>
                        ) : (
                          <FileDropZone
                            inputId={`upload-${fieldKey}`}
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            onFileSelect={(file, input) =>
                              handleFileUpload(fieldKey, file, input)
                            }
                            className="rounded-xl border-2 border-dashed border-border p-8 text-center hover:border-primary/50 hover:bg-primary/5"
                          >
                            <div className="w-10 h-10 rounded-full bg-muted mx-auto flex items-center justify-center mb-3">
                              <Upload className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium text-foreground">
                              Upload {field.label}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Click or drag to upload • PNG, JPG (max. 5MB)
                              {field.dimensions && ` • ${field.dimensions}`}
                            </p>
                          </FileDropZone>
                        )}
                      </div>
                    )}

                    {/* Video Upload */}
                    {field.type === "video" && (
                      <div>
                        {videoResizeProgress[fieldKey] !== undefined ? (
                          <div className="rounded-xl border border-border p-8 flex flex-col items-center justify-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <div className="text-center">
                              <p className="text-sm font-medium text-foreground">
                                Resizing video...{" "}
                                {videoResizeProgress[fieldKey]}%
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Cropping to {field.dimensions}
                              </p>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5">
                              <div
                                className="bg-primary h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${videoResizeProgress[fieldKey]}%`,
                                }}
                              />
                            </div>
                          </div>
                        ) : filePreviews[fieldKey] ||
                          uploadedAssets[fieldKey] ? (
                          <FileDropZone
                            inputId={`upload-${fieldKey}`}
                            accept="video/mp4,video/quicktime"
                            onFileSelect={(file, input) =>
                              handleFileUpload(fieldKey, file, input)
                            }
                            className="overflow-hidden rounded-xl border border-border max-w-72 mx-auto"
                          >
                            <div className="bg-checker aspect-square flex items-center justify-center">
                              <video
                                src={
                                  filePreviews[fieldKey] ||
                                  uploadedAssets[fieldKey]
                                }
                                className="max-h-72 max-w-72 object-contain"
                                controls
                                muted
                                onClick={(event) => event.stopPropagation()}
                              />
                            </div>
                            <div className="flex items-center justify-between px-3 py-2 bg-card border-t border-border">
                              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Upload className="w-3 h-3" /> Click or drag to
                                replace
                              </span>
                              <button
                                onClick={async (event) => {
                                  event.stopPropagation();
                                  uploadedAssets[fieldKey]
                                    ? await deleteAsset(fieldKey)
                                    : removeFile(fieldKey);
                                }}
                                disabled={deletingAssets.has(fieldKey)}
                                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors cursor-pointer ${
                                  deletingAssets.has(fieldKey)
                                    ? "text-red-400/40 pointer-events-none cursor-not-allowed"
                                    : "text-red-400/70 hover:text-red-400 hover:bg-red-400/10"
                                }`}
                                type="button"
                              >
                                {deletingAssets.has(fieldKey) ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" /> Removing
                                  </>
                                ) : (
                                  <>
                                    <X className="w-3 h-3" /> Remove
                                  </>
                                )}
                              </button>
                            </div>
                          </FileDropZone>
                        ) : (
                          <FileDropZone
                            inputId={`upload-${fieldKey}`}
                            accept="video/mp4,video/quicktime"
                            onFileSelect={(file, input) =>
                              handleFileUpload(fieldKey, file, input)
                            }
                            className="rounded-xl border-2 border-dashed border-border p-8 text-center hover:border-primary/50 hover:bg-primary/5"
                          >
                            <div className="w-10 h-10 rounded-full bg-muted mx-auto flex items-center justify-center mb-3">
                              <Upload className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium text-foreground">
                              Upload {field.label}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Click or drag to upload • MP4 (max. 50MB)
                              {field.dimensions && ` • ${field.dimensions}`}
                            </p>
                          </FileDropZone>
                        )}
                      </div>
                    )}

                    {/* Media Upload (accepts both image and video) */}
                    {field.type === "media" && (
                      <div>
                        {videoResizeProgress[fieldKey] !== undefined ? (
                          <div className="rounded-xl border border-border p-8 flex flex-col items-center justify-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <div className="text-center">
                              <p className="text-sm font-medium text-foreground">
                                Resizing video...{" "}
                                {videoResizeProgress[fieldKey]}%
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Cropping to {field.dimensions}
                              </p>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5">
                              <div
                                className="bg-primary h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${videoResizeProgress[fieldKey]}%`,
                                }}
                              />
                            </div>
                          </div>
                        ) : filePreviews[fieldKey] ||
                          uploadedAssets[fieldKey] ? (
                          <FileDropZone
                            inputId={`upload-${fieldKey}`}
                            accept="image/png,image/jpeg,image/jpg,image/webp,video/mp4,video/quicktime"
                            onFileSelect={(file, input) =>
                              handleFileUpload(fieldKey, file, input)
                            }
                            className="overflow-hidden rounded-xl border border-border max-w-72 mx-auto"
                          >
                            <div className="bg-checker aspect-square flex items-center justify-center p-3">
                              {(formData[fieldKey] as File)?.type?.startsWith(
                                "video/",
                              ) ||
                              uploadedAssets[fieldKey]?.includes("/video/") ? (
                                <video
                                  src={
                                    filePreviews[fieldKey] ||
                                    uploadedAssets[fieldKey]
                                  }
                                  className="max-h-72 max-w-72 object-contain"
                                  controls
                                  muted
                                  onClick={(event) => event.stopPropagation()}
                                />
                              ) : (
                                <img
                                  src={
                                    filePreviews[fieldKey] ||
                                    uploadedAssets[fieldKey]
                                  }
                                  alt={`${field.label} preview`}
                                  onLoad={() =>
                                    setImagePreviewReady((prev) => ({
                                      ...prev,
                                      [fieldKey]: true,
                                    }))
                                  }
                                  onError={() =>
                                    setImagePreviewReady((prev) => ({
                                      ...prev,
                                      [fieldKey]: true,
                                    }))
                                  }
                                  className="max-h-72 max-w-72 object-contain pointer-events-none"
                                />
                              )}
                            </div>
                            <div className="flex items-center justify-between px-3 py-2 bg-card border-t border-border">
                              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Upload className="w-3 h-3" /> Click or drag to
                                replace
                              </span>
                              <button
                                onClick={async (event) => {
                                  event.stopPropagation();
                                  uploadedAssets[fieldKey]
                                    ? await deleteAsset(fieldKey)
                                    : removeFile(fieldKey);
                                }}
                                disabled={deletingAssets.has(fieldKey)}
                                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors cursor-pointer ${
                                  deletingAssets.has(fieldKey)
                                    ? "text-red-400/40 pointer-events-none cursor-not-allowed"
                                    : "text-red-400/70 hover:text-red-400 hover:bg-red-400/10"
                                }`}
                                type="button"
                              >
                                {deletingAssets.has(fieldKey) ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" /> Removing
                                  </>
                                ) : (
                                  <>
                                    <X className="w-3 h-3" /> Remove
                                  </>
                                )}
                              </button>
                            </div>
                          </FileDropZone>
                        ) : (
                          <FileDropZone
                            inputId={`upload-${fieldKey}`}
                            accept="image/png,image/jpeg,image/jpg,image/webp,video/mp4,video/quicktime"
                            onFileSelect={(file, input) =>
                              handleFileUpload(fieldKey, file, input)
                            }
                            className="rounded-xl border-2 border-dashed border-border p-8 text-center hover:border-primary/50 hover:bg-primary/5"
                          >
                            <div className="w-10 h-10 rounded-full bg-muted mx-auto flex items-center justify-center mb-3">
                              <Upload className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium text-foreground">
                              Upload {field.label}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Click or drag to upload • Image (PNG, JPG) or
                              Video (MP4)
                              {field.dimensions && ` • ${field.dimensions}`}
                            </p>
                          </FileDropZone>
                        )}
                      </div>
                    )}
                    {field.type !== "text" && field.dimensions && (
                      <p className="flex items-start gap-1.5 text-xs text-muted-foreground/60 mt-1">
                        <Info className="w-3 h-3 shrink-0 mt-px" />
                        Templates use square dimensions. Non square uploads are
                        center-cropped, so keep important content centered to
                        avoid edge clipping.
                      </p>
                    )}
                  </div>
                ))}

              {/* ── Font Picker ────────────────────────────────── */}
              <FontPicker
                value={selectedFont}
                onChange={(fontId) => setSelectedFont(fontId)}
              />

              {/* Dimension Disclaimer */}
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  💡 <strong>Note:</strong> Empty fields will keep the
                  template&apos;s default appearance. Files are uploaded
                  automatically when selected.
                </p>
              </div>

              {/* Background mode toggle - template flow only */}
              {template.hasTransprentBackground == false ? (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    ⚠️ This template does not support transparent background.
                    The exported video will have a colored background.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-lg border border-border bg-card space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Background Mode
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Colored keeps default template background. Transparent
                      removes background for alpha export.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setUseBackgroundColor(true)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                        useBackgroundColor
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Colored
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseBackgroundColor(false)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                        !useBackgroundColor
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Transparent
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {useBackgroundColor
                      ? "Export target: MP4"
                      : "Export target: QuickTime MOV (Animation + Alpha)"}
                  </p>
                </div>
              )}

              {/* Video Audio toggle - only show when a video has been uploaded */}
              {Object.values(uploadedAssets).some(
                (url) => url?.includes("/video/")
              ) && (
                <div className="p-4 rounded-lg border border-border bg-card space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Video Audio
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Control whether uploaded video assets retain their audio
                      in the rendered output.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMuteAudio(true)}
                      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                        muteAudio
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <VolumeX className="w-4 h-4" />
                      Off
                    </button>
                    <button
                      type="button"
                      onClick={() => setMuteAudio(false)}
                      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                        !muteAudio
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Volume2 className="w-4 h-4" />
                      On
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {muteAudio
                      ? "Audio from uploaded videos will be removed."
                      : "Audio from uploaded videos will be included in the render."}
                  </p>
                </div>
              )}
            </div>

            {/* Render Status */}
            {renderJob && (
              <div className="p-4 rounded-lg border border-border bg-card space-y-3">
                <div className="flex items-center gap-3">
                  {renderJob.status === "PENDING" && (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      <div className="flex-1">
                        <p className="font-medium">Job Submitted</p>
                        <p className="text-sm text-muted-foreground">
                          Waiting in queue...
                        </p>
                      </div>
                    </>
                  )}
                  {renderJob.status === "PROCESSING" && (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <div className="flex-1">
                        <p className="font-medium">Rendering</p>
                        <p className="text-sm text-muted-foreground">
                          {renderJob.progress !== undefined
                            ? `${renderJob.progress}% complete`
                            : "Processing your video..."}
                        </p>
                      </div>
                    </>
                  )}
                  {renderJob.status === "COMPLETED" && (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div className="flex-1">
                        <p className="font-medium">Completed!</p>
                        <p className="text-sm text-muted-foreground">
                          Your video is ready
                        </p>
                      </div>
                    </>
                  )}
                  {renderJob.status === "FAILED" && (
                    <>
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <div className="flex-1">
                        <p className="font-medium">Failed</p>
                        <p className="text-sm text-muted-foreground">
                          {renderJob.error || "Something went wrong"}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Progress Bar */}
                {renderJob.status === "PROCESSING" &&
                  renderJob.progress !== undefined && (
                    <div className="space-y-1">
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-full transition-all duration-500 ease-out"
                          style={{ width: `${renderJob.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-right text-muted-foreground">
                        {renderJob.progress}%
                      </p>
                    </div>
                  )}
              </div>
            )}

            {/* Generate/Download Button */}
            {authLoading ? (
              <div className="w-full h-12 rounded-lg bg-gray-300 dark:bg-gray-700 animate-pulse" />
            ) : showRenderedVideo ? (
              // Show Download Button when video is ready
              <div className="space-y-3">
                <EdikitButton
                  onClick={handleDownload}
                  disabled={isDownloading}
                  variant="primary"
                  width="w-full"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Downloading... {downloadProgress}%
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download Video
                    </>
                  )}
                </EdikitButton>
                <EdikitButton
                  onClick={handleGeneratePreview}
                  disabled={
                    isGenerating ||
                    authLoading ||
                    !hasRequiredFields() ||
                    uploadingAssets.size > 0 ||
                    renderJob?.status === "PENDING" ||
                    renderJob?.status === "PROCESSING"
                  }
                  variant="primary"
                  width="w-full"
                >
                  {uploadingAssets.size > 0 ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading {uploadingAssets.size} file
                      {uploadingAssets.size > 1 ? "s" : ""}...
                    </>
                  ) : isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting Job...
                    </>
                  ) : isLoggedIn ? (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Render Video
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Login to Render
                    </>
                  )}
                </EdikitButton>
                {isDownloading && downloadProgress > 0 && (
                  <div className="space-y-1">
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${downloadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      {downloadProgress}% downloaded
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Show Render Button
              <EdikitButton
                onClick={handleGeneratePreview}
                disabled={
                  isGenerating ||
                  isUploading ||
                  authLoading ||
                  !hasRequiredFields() ||
                  uploadingAssets.size > 0 ||
                  renderJob?.status === "PENDING" ||
                  renderJob?.status === "PROCESSING"
                }
                variant="primary"
                width="w-full"
              >
                {uploadingAssets.size > 0 ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading {uploadingAssets.size} file
                    {uploadingAssets.size > 1 ? "s" : ""}...
                  </>
                ) : isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting Job...
                  </>
                ) : isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading Asset...
                  </>
                ) : isLoggedIn ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Render Video (5 credits)
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Login to Render
                  </>
                )}
              </EdikitButton>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomizePage;
