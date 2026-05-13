'use client';
import {
  ArrowLeft,
  Upload,
  Sparkles,
  Download,
  Loader2,
  X,
  CheckCircle,
  AlertCircle,
  Play,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import useCustomizeLogic from "./useCustomizeLogic";

const CustomizePage = () => {
  const {
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
    removeFile,
    deleteAsset,
    hasRequiredFields,
    handleGeneratePreview,
    handleDownload,
    useBackgroundColor,
    setUseBackgroundColor,
    imagePreviewReady,
    setImagePreviewReady,
  } = useCustomizeLogic();

  if (!template) {
    return null;
  }

  // Check if we should show rendered video or template preview
  const showRenderedVideo =
    renderJob?.status === "COMPLETED" && renderJob.outputUrl;

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

      <main className="container mx-auto px-4 py-8">
        <Link
          href="/templates"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Templates
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Left Column - Dynamic Form */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {template.name}
              </h1>
              <p className="text-muted-foreground">{template.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                  {template.category}
                </span>
              </div>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card space-y-6">
              {/* Dynamic Fields */}
              {Object.entries(template.fields)
                .filter(([fieldKey]) => fieldKey !== "background")
                .map(([fieldKey, field]) => (
                <div key={fieldKey} className="space-y-2">
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
                        value={(formData[fieldKey] as string) || ""}
                        onChange={(e) =>
                          handleTextChange(fieldKey, e.target.value)
                        }
                        maxLength={field.maxLength}
                        className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                      {field.maxLength && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {((formData[fieldKey] as string) || "").length} /{" "}
                          {field.maxLength} characters
                        </p>
                      )}
                    </div>
                  )}

                  {/* Image Upload */}
                  {field.type === "image" && (
                    <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={(e) =>
                          handleFileUpload(
                            fieldKey,
                            e.target.files?.[0] || null,
                            e.target,
                          )
                        }
                        className="hidden"
                        id={`upload-${fieldKey}`}
                      />

                      {filePreviews[fieldKey] || uploadedAssets[fieldKey] ? (
                        <div className="space-y-3">
                          <div className="relative rounded-lg overflow-hidden">
                            <img
                              src={filePreviews[fieldKey] || uploadedAssets[fieldKey]}
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
                              className="w-full h-40 object-cover rounded-lg"
                            />
                            <button
                              onClick={async () => {
                                // If uploaded, delete from server first
                                if (uploadedAssets[fieldKey]) {
                                  await deleteAsset(fieldKey);
                                } else {
                                  // If not uploaded, just remove locally
                                  removeFile(fieldKey);
                                }
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer"
                              type="button"
                              title={
                                uploadedAssets[fieldKey]
                                  ? "Delete from server"
                                  : "Remove file"
                              }
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <label
                              htmlFor={`upload-${fieldKey}`}
                              className="text-xs text-center flex-1 text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                            >
                              Click to change image
                            </label>
                          </div>
                        </div>
                      ) : (
                        <label
                          htmlFor={`upload-${fieldKey}`}
                          className="cursor-pointer block text-center"
                        >
                          <div className="w-12 h-12 rounded-full bg-muted mx-auto flex items-center justify-center mb-2">
                            <Upload className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <p className="text-sm font-medium text-foreground">
                            Upload {field.label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PNG, JPG (max. 5MB)
                            {field.dimensions && ` • ${field.dimensions}`}
                          </p>
                        </label>
                      )}
                    </div>
                  )}

                  {/* Video Upload */}
                  {field.type === "video" && (
                    <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        accept="video/mp4,video/quicktime"
                        onChange={(e) =>
                          handleFileUpload(
                            fieldKey,
                            e.target.files?.[0] || null,
                            e.target,
                          )
                        }
                        className="hidden"
                        id={`upload-${fieldKey}`}
                      />

                      {filePreviews[fieldKey] || uploadedAssets[fieldKey] ? (
                        <div className="space-y-3">
                          <div className="relative">
                            <video
                              src={filePreviews[fieldKey] || uploadedAssets[fieldKey]}
                              className="w-full h-40 object-cover rounded-lg"
                              controls
                            />
                            <button
                              onClick={async () => {
                                // If uploaded, delete from server first
                                if (uploadedAssets[fieldKey]) {
                                  await deleteAsset(fieldKey);
                                } else {
                                  // If not uploaded, just remove locally
                                  removeFile(fieldKey);
                                }
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                              type="button"
                              title={
                                uploadedAssets[fieldKey]
                                  ? "Delete from server"
                                  : "Remove file"
                              }
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <label
                            htmlFor={`upload-${fieldKey}`}
                            className="text-xs text-center block text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                          >
                            Click to change video
                          </label>
                        </div>
                      ) : (
                        <label
                          htmlFor={`upload-${fieldKey}`}
                          className="cursor-pointer block text-center"
                        >
                          <div className="w-12 h-12 rounded-full bg-muted mx-auto flex items-center justify-center mb-2">
                            <Upload className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <p className="text-sm font-medium text-foreground">
                            Upload {field.label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            MP4 (max. 50MB)
                            {field.dimensions && ` • ${field.dimensions}`}
                          </p>
                        </label>
                      )}
                    </div>
                  )}

                  {/* Media Upload (accepts both image and video) */}
                  {field.type === "media" && (
                    <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp,video/mp4,video/quicktime"
                        onChange={(e) =>
                          handleFileUpload(
                            fieldKey,
                            e.target.files?.[0] || null,
                            e.target,
                          )
                        }
                        className="hidden"
                        id={`upload-${fieldKey}`}
                      />

                      {filePreviews[fieldKey] || uploadedAssets[fieldKey] ? (
                        <div className="space-y-3">
                          <div className="relative">
                            {(formData[fieldKey] as File)?.type?.startsWith("video/") ||
                            uploadedAssets[fieldKey]?.includes("/video/") ? (
                              <video
                                src={filePreviews[fieldKey] || uploadedAssets[fieldKey]}
                                className="w-full h-40 object-cover rounded-lg"
                                controls
                              />
                            ) : (
                              <div className="relative overflow-hidden rounded-lg">
                                <img
                                  src={filePreviews[fieldKey] || uploadedAssets[fieldKey]}
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
                                  className="w-full h-40 object-cover rounded-lg"
                                />
                              </div>
                            )}
                            <button
                              onClick={async () => {
                                if (uploadedAssets[fieldKey]) {
                                  await deleteAsset(fieldKey);
                                } else {
                                  removeFile(fieldKey);
                                }
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                              type="button"
                              title={
                                uploadedAssets[fieldKey]
                                  ? "Delete from server"
                                  : "Remove file"
                              }
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <label
                            htmlFor={`upload-${fieldKey}`}
                            className="text-xs text-center block text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                          >
                            Click to change
                          </label>
                        </div>
                      ) : (
                        <label
                          htmlFor={`upload-${fieldKey}`}
                          className="cursor-pointer block text-center"
                        >
                          <div className="w-12 h-12 rounded-full bg-muted mx-auto flex items-center justify-center mb-2">
                            <Upload className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <p className="text-sm font-medium text-foreground">
                            Upload {field.label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Image (PNG, JPG) or Video (MP4)
                            {field.dimensions && ` • ${field.dimensions}`}
                          </p>
                        </label>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Dimension Disclaimer */}
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  💡 <strong>Note:</strong> Empty fields will keep the
                  template&apos;s default appearance. Files are uploaded
                  automatically when selected.
                </p>
              </div>

              {/* Background mode toggle - template flow only */}
              <div className="p-4 rounded-lg border border-border bg-card space-y-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Background Mode</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Colored keeps default template background. Transparent removes background for alpha export.
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
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary-gradient text-primary-foreground font-medium disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl cursor-pointer"
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
                </button>
                <button
                  onClick={handleGeneratePreview}
                  disabled={
                    isGenerating ||
                    authLoading ||
                    !hasRequiredFields() ||
                    uploadingAssets.size > 0 ||
                    renderJob?.status === "PENDING" ||
                    renderJob?.status === "PROCESSING"
                  }
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary-gradient text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                </button>
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
              <button
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
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary-gradient text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                    Render Video
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Login to Render
                  </>
                )}
              </button>
            )}
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Preview
                </h2>

                <div className="aspect-square bg-muted rounded-lg overflow-hidden relative border border-border">
                  {showRenderedVideo ? (
                    // Show rendered video with controls
                    <video
                      src={renderJob.outputUrl}
                      className="w-full h-full object-cover"
                      controls
                      autoPlay
                      loop
                    />
                  ) : (
                    // Show interactive template preview
                    <>
                      {/* Static Thumbnail - shown when video not playing */}
                      {!isVideoPlaying && !imageError && template.thumbnail && (
                        <Image
                          src={template.thumbnail}
                          alt={template.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          onError={() => setImageError(true)}
                          priority={false}
                        />
                      )}

                      {/* Fallback if image fails or no thumbnail */}
                      {(imageError || !template.thumbnail) &&
                        !isVideoPlaying && (
                          <div className="absolute inset-0 flex items-center justify-center bg-muted">
                            <p className="text-sm text-muted-foreground">
                              No preview
                            </p>
                          </div>
                        )}

                      {/* Video (lazy loaded on first click) */}
                      <video
                        ref={videoRef}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${
                          isVideoPlaying && isVideoLoaded
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                        onLoadedData={handleVideoLoaded}
                        onError={handleVideoError}
                        onEnded={handleVideoEnded}
                      />

                      {/* Play/Pause Overlay */}
                      <div
                        className="absolute inset-0 cursor-pointer"
                        onClick={handleVideoClick}
                      >
                        {!isVideoPlaying && !isVideoLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 backdrop-blur-sm transition-transform hover:scale-110">
                              <Play className="h-8 w-8 fill-primary-foreground text-primary-foreground ml-1" />
                            </div>
                          </div>
                        )}

                        {/* Loading indicator while video loads */}
                        {isVideoLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                            <Loader2 className="h-12 w-12 animate-spin text-white" />
                          </div>
                        )}

                        {/* Subtle pause indicator when playing */}
                        {isVideoPlaying && isVideoLoaded && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/10">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
                              <div className="flex gap-1">
                                <div className="w-1.5 h-5 bg-white rounded-full" />
                                <div className="w-1.5 h-5 bg-white rounded-full" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Click hint */}
                      {!isVideoPlaying && !isVideoLoading && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm">
                          <p className="text-xs text-white font-medium">
                            Click to preview
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Upgrade CTA */}
            <div className="p-6 rounded-lg bg-linear-to-br from-primary/10 to-primary/5 border border-primary/20">
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
                <Link
                  href="/pricing"
                  className="block w-full text-center px-4 py-2 rounded-lg bg-primary-gradient text-primary-foreground font-medium"
                >
                  Upgrade to Pro
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomizePage;
