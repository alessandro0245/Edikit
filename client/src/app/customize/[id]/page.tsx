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
  Type,
  Image as ImageIcon,
  Palette,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import useCustomizeLogic from "./useCustomizeLogic";
import AnimationPreview from "@/components/Video/AnimationPreview";
import VideoPlayer from "@/components/Video/VideoPlayer";
import { toMp4PreviewUrl } from "@/components/MovPreview";
import { getTemplateOrientation } from "@/utils/templateOrientation";
import FileDropZone from "@/components/Upload/FileDropZone";
import EdikitButton from "@/components/ShimmerButton/ShimmerButton";
import FontPicker from "@/components/FontPicker/FontPicker";

const CustomizePage = () => {
  const [previewRatio] = useState("9/16");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    text: true,
    media: true,
    colors: true,
    settings: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

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

  // Group fields into categories
  const textFields = Object.entries(template.fields).filter(
    ([fieldKey, field]) => fieldKey !== "background" && field.type === "text"
  );
  const mediaFields = Object.entries(template.fields).filter(
    ([fieldKey, field]) =>
      fieldKey !== "background" &&
      (field.type === "image" ||
        field.type === "video" ||
        field.type === "media")
  );
  const colorFields = Object.entries(template.fields).filter(
    ([fieldKey, field]) => fieldKey !== "background" && field.type === "color"
  );

  const hasUploadedVideo = Object.values(uploadedAssets).some((url) =>
    url?.includes("/video/")
  );

  const settingsSummary = [
    "font",
    hasUploadedVideo ? "audio" : null,
    template.hasTransprentBackground !== false ? "background" : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-h-screen bg-background relative">
      {isDownloading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div>
                <p className="font-medium text-foreground">Preparing download</p>
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
          className="rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors inline-block p-1.5"
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
                  className="overflow-hidden rounded-xl border-2 border-border bg-black relative mx-auto w-full max-h-[79vh] transition-all"
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
          </div>

          {/* Right Column - Scrollable Collapsible Categories (Open by default) */}
          <div className="space-y-4 order-1 lg:order-2">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">
                {template.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                Customize this template and generate a video in seconds.
              </p>
            </div>

            {/* ─── SECTION 1: TEXT ─── */}
            {textFields.length > 0 && (
              <div className="rounded-xl border border-border bg-card/80 overflow-hidden shadow-xs transition-all">
                <button
                  type="button"
                  onClick={() => toggleSection("text")}
                  className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-accent/40 transition-colors select-none text-left"
                >
                  <div className="flex items-center gap-2.5 font-semibold text-foreground text-md">
                    {/* <Type className="w-4 h-4 text-muted-foreground" /> */}
                    <span>Text</span> 
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {textFields.length}{" "}
                      {textFields.length === 1 ? "field" : "fields"}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        openSections.text ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {openSections.text && (
                  <div className="px-4 pb-4 pt-1 space-y-1 animate-in fade-in-50 duration-150">
                    {textFields.map(([fieldKey, field]) => (
                      <div key={fieldKey} className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            {field.label}
                            {field.required && (
                              <span className="text-red-500 text-xs">*</span>
                            )}
                            {field.dimensions && (
                              <span className="text-[11px] text-muted-foreground font-normal">
                                ({field.dimensions})
                              </span>
                            )}
                          </span>
                          {formData[fieldKey] && (
                            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                          )}
                        </label>

                        <div>
                          <input
                            type="text"
                            value={
                              (formData[fieldKey] as string) ??
                              field.value ??
                              ""
                            }
                            onChange={(e) =>
                              handleTextChange(fieldKey, e.target.value)
                            }
                            maxLength={field.maxLength}
                            className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm transition-colors"
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                          />
                          {field.maxLength && (
                            <p className="text-[11px] text-muted-foreground mt-1 text-right">
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── SECTION 2: MEDIA ─── */}
            {mediaFields.length > 0 && (
              <div className="rounded-xl border border-border bg-card/80 overflow-hidden shadow-xs transition-all">
                <button
                  type="button"
                  onClick={() => toggleSection("media")}
                  className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-accent/40 transition-colors select-none text-left"
                >
                  <div className="flex items-center gap-2.5 font-semibold text-foreground text-md">
                    {/* <ImageIcon className="w-4 h-4 text-muted-foreground" /> */}
                    <span>Media</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {mediaFields.length}{" "}
                      {mediaFields.length === 1 ? "upload" : "uploads"}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        openSections.media ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {openSections.media && (
                  <div className="px-4 pb-4 pt-1 space-y-3 animate-in fade-in-50 duration-150">
                    <div
                      className={`grid gap-3 ${
                        mediaFields.length > 1
                          ? "grid-cols-1 sm:grid-cols-2"
                          : "grid-cols-1"
                      }`}
                    >
                      {mediaFields.map(([fieldKey, field]) => {
                        const hasFile =
                          filePreviews[fieldKey] || uploadedAssets[fieldKey];
                        const isResizing =
                          videoResizeProgress[fieldKey] !== undefined;

                        return (
                          <div key={fieldKey} className="space-y-1.5">
                            {isResizing ? (
                              <div className="rounded-xl border border-border p-5 flex flex-col items-center justify-center gap-2 min-h-[110px]">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                <p className="text-xs font-medium text-foreground">
                                  Resizing... {videoResizeProgress[fieldKey]}%
                                </p>
                                <div className="w-full bg-muted rounded-full h-1.5">
                                  <div
                                    className="bg-primary h-full rounded-full transition-all duration-300"
                                    style={{
                                      width: `${videoResizeProgress[fieldKey]}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            ) : hasFile ? (
                              <FileDropZone
                                inputId={`upload-${fieldKey}`}
                                accept={
                                  field.type === "video"
                                    ? "video/mp4,video/quicktime"
                                    : field.type === "image"
                                    ? "image/png,image/jpeg,image/jpg,image/webp"
                                    : "image/png,image/jpeg,image/jpg,image/webp,video/mp4,video/quicktime"
                                }
                                onFileSelect={(file, input) =>
                                  handleFileUpload(fieldKey, file, input)
                                }
                                className="overflow-hidden rounded-xl border border-border"
                              >
                                <div className="bg-checker aspect-video flex items-center justify-center p-2">
                                  {field.type === "video" ||
                                  (formData[fieldKey] as File)?.type?.startsWith(
                                    "video/"
                                  ) ||
                                  uploadedAssets[fieldKey]?.includes(
                                    "/video/"
                                  ) ? (
                                    <video
                                      src={
                                        filePreviews[fieldKey] ||
                                        uploadedAssets[fieldKey]
                                      }
                                      className="max-h-36 max-w-full object-contain"
                                      controls
                                      muted
                                      onClick={(event) =>
                                        event.stopPropagation()
                                      }
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
                                      className="max-h-36 max-w-full object-contain pointer-events-none"
                                    />
                                  )}
                                </div>
                                <div className="flex items-center justify-between px-3 py-2 bg-card border-t border-border">
                                  <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                    <Upload className="w-3 h-3" /> {field.label}
                                  </span>
                                  <button
                                    onClick={async (event) => {
                                      event.stopPropagation();
                                      uploadedAssets[fieldKey]
                                        ? await deleteAsset(fieldKey)
                                        : removeFile(fieldKey);
                                    }}
                                    disabled={deletingAssets.has(fieldKey)}
                                    className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
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
                                accept={
                                  field.type === "video"
                                    ? "video/mp4,video/quicktime"
                                    : field.type === "image"
                                    ? "image/png,image/jpeg,image/jpg,image/webp"
                                    : "image/png,image/jpeg,image/jpg,image/webp,video/mp4,video/quicktime"
                                }
                                onFileSelect={(file, input) =>
                                  handleFileUpload(fieldKey, file, input)
                                }
                                className="rounded-xl border border-dashed border-border/80 p-5 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors flex flex-col items-center justify-center min-h-[105px] cursor-pointer"
                              >
                                <Upload className="w-4 h-4 text-muted-foreground mb-1.5" />
                                <p className="text-xs font-medium text-foreground">
                                  {field.label}
                                </p>
                                {field.dimensions && (
                                  <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                                    {field.dimensions}
                                  </p>
                                )}
                              </FileDropZone>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground/60 pt-1">
                      <Info className="w-3 h-3 shrink-0 mt-px" />
                      Templates use square dimensions. Non-square uploads are
                      center-cropped to keep content focused.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ─── SECTION 3: COLORS ─── */}
            {colorFields.length > 0 && (
              <div className="rounded-xl border border-border bg-card/80 overflow-hidden shadow-xs transition-all">
                <button
                  type="button"
                  onClick={() => toggleSection("colors")}
                  className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-accent/40 transition-colors select-none text-left"
                >
                  <div className="flex items-center gap-2.5 font-semibold text-foreground text-md">
                    {/* <Palette className="w-4 h-4 text-muted-foreground" /> */}
                    <span>Colors</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {colorFields.length}{" "}
                      {colorFields.length === 1 ? "color" : "colors"}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        openSections.colors ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {openSections.colors && (
                  <div className="px-4 pb-4 pt-1 space-y-3.5 animate-in fade-in-50 duration-150">
                    {colorFields.map(([fieldKey, field]) => (
                      <div key={fieldKey} className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground flex items-center gap-2">
                          {field.label}
                          {field.required && (
                            <span className="text-red-500 text-xs">*</span>
                          )}
                        </label>
                        <div className="flex items-center gap-3">
                          <div className="relative flex items-center justify-center h-9 w-11 rounded-lg border border-border bg-background overflow-hidden hover:border-primary/50 transition-colors">
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
                                if (
                                  val &&
                                  !val.startsWith("#") &&
                                  !val.startsWith(" ")
                                ) {
                                  val = `#${val}`;
                                }
                                handleTextChange(fieldKey, val);
                              }}
                              maxLength={7}
                              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground font-mono text-xs uppercase placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                              placeholder="#3B82F6"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── SECTION 4: SETTINGS ─── */}
            <div className="rounded-xl border border-border bg-card/80 overflow-hidden shadow-xs transition-all">
              <button
                type="button"
                onClick={() => toggleSection("settings")}
                className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-accent/40 transition-colors select-none text-left"
              >
                <div className="flex items-center gap-2.5 font-semibold text-foreground text-md">
                  {/* <SlidersHorizontal className="w-4 h-4 text-muted-foreground" /> */}
                  <span>Settings</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{settingsSummary}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      openSections.settings ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {openSections.settings && (
                <div className="px-4 pb-4 pt-1 space-y-4 animate-in fade-in-50 duration-150">
                  {/* Font Picker */}
                  <FontPicker
                    value={selectedFont}
                    onChange={(fontId) => setSelectedFont(fontId)}
                  />

                  {/* Background mode toggle */}
                  {template.hasTransprentBackground === false ? (
                    <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                      <p className="text-xs text-yellow-600 dark:text-yellow-400">
                        ⚠️ This template does not support transparent background.
                        The exported video will have a colored background.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2.5">
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          Background Mode
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Colored keeps default background (MP4). Transparent removes
                          background for alpha export (MOV).
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setUseBackgroundColor(true)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                            useBackgroundColor
                              ? "border-primary bg-primary/10 text-foreground shadow-xs"
                              : "border-border bg-background text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Colored (MP4)
                        </button>
                        <button
                          type="button"
                          onClick={() => setUseBackgroundColor(false)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                            !useBackgroundColor
                              ? "border-primary bg-primary/10 text-foreground shadow-xs"
                              : "border-border bg-background text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Transparent (MOV)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Video Audio toggle - only show when a video has been uploaded */}
                  {hasUploadedVideo && (
                    <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2.5">
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          Video Audio
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Control whether uploaded video assets retain their audio
                          in the rendered output.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setMuteAudio(true)}
                          className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                            muteAudio
                              ? "border-primary bg-primary/10 text-foreground shadow-xs"
                              : "border-border bg-background text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <VolumeX className="w-3.5 h-3.5" />
                          Off
                        </button>
                        <button
                          type="button"
                          onClick={() => setMuteAudio(false)}
                          className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                            !muteAudio
                              ? "border-primary bg-primary/10 text-foreground shadow-xs"
                              : "border-border bg-background text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          On
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Helpful hints */}
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      💡 <strong>Note:</strong> Empty fields keep default appearance.
                      Files are uploaded automatically when selected.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Render Status (Always visible below categories) */}
            {renderJob && (
              <div className="p-4 rounded-xl border border-border bg-card space-y-3 shadow-xs">
                <div className="flex items-center gap-3">
                  {renderJob.status === "PENDING" && (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">Job Submitted</p>
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
                        <p className="font-medium text-foreground">Rendering</p>
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
                        <p className="font-medium text-foreground">Completed!</p>
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
                        <p className="font-medium text-foreground">Failed</p>
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

            {/* Generate/Download Button (Always accessible below categories) */}
            {authLoading ? (
              <div className="w-full h-12 rounded-lg bg-gray-300 dark:bg-gray-700 animate-pulse" />
            ) : showRenderedVideo ? (
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
