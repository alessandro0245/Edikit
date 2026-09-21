// "use client";

// import React, { useState, useEffect, useRef } from "react";
// import { Search, Clock, ZoomIn, ChevronDown } from "lucide-react";
// import ShimmerButton from "@/components/ShimmerButton/ShimmerButton";
// import { Slider } from "@/components/ui/slider";
// import {
//   useMatchCutLogic,
//   AspectRatio,
//   Resolution,
// } from "./useMatchCutLogic";
// import MatchCutReadyCard from "./MatchCutReadyCard";

// interface ExampleCard {
//   id: string;
//   topic: string;
//   title: string;
//   url: string;
//   domain: string;
//   headline: string;
//   description: string;
//   aspectRatio: AspectRatio;
//   resolution: Resolution;
//   videoSrc?: string;
// }

// const EXAMPLES: ExampleCard[] = [
//   {
//     id: "ego",
//     topic: "Ego",
//     title: '"Ego"',
//     url: "https://www.egobarbers.co.uk > book-online",
//     domain: "Ego Barbers",
//     headline: "Barbershop | Aiza Khiljee Barbers | Unit...",
//     description:
//       "Ego Barbers in Cockfosters, North London. Walk-ins welcome six days a week, late opening on Thursdays until nine. Book your next cut at Ego online in under a minute.",
//     aspectRatio: "16:9",
//     resolution: "4K",
//     videoSrc: "/previews/animation-1.mp4",
//   },
//   {
//     id: "messi",
//     topic: "Lionel Messi",
//     title: '"Lionel Messi"',
//     url: "https://www.egobarbers.co.uk > book-online",
//     domain: "Ego Barbers",
//     headline: "Barbershop | Abdul Rehman Barbers | Un...",
//     description:
//       "Ego Barbers in Cockfosters, North London. Walk-ins welcome six days a week, late opening on Thursdays until nine. Book your next cut at Ego online in under a minute.",
//     aspectRatio: "9:16",
//     resolution: "1080p",
//     videoSrc: "/previews/animation-2.mp4",
//   },
//   {
//     id: "discipline",
//     topic: "Discipline",
//     title: '"Discipline"',
//     url: "https://www.egobarbers.co.uk > book-online",
//     domain: "Ego Barbers",
//     headline: "Barbershop | Abdul Rehman Barbers | Un...",
//     description:
//       "Ego Barbers in Cockfosters, North London. Walk-ins welcome six days a week, late opening on Thursdays until nine. Book your next cut at Ego online in under a minute.",
//     aspectRatio: "1:1",
//     resolution: "4K",
//     videoSrc: "/previews/animation-3.mp4",
//   },
// ];

// const SUGGESTIONS = ["Lionel Messi", "Growth", "Taylor Swift", "AI"];

// export default function MatchCutPage() {
//   const {
//     prompt,
//     setPrompt,
//     aspectRatio,
//     setAspectRatio,
//     resolution,
//     setResolution,
//     durationInSeconds,
//     setDurationInSeconds,
//     zoomIntensity,
//     setZoomIntensity,
//     isGenerating,
//     progressStep,
//     progress,
//     outputUrl,
//     handleGenerate,
//     handleSelectSuggestion,
//     handleReset,
//     handleDownload,
//   } = useMatchCutLogic();

//   const [activePopover, setActivePopover] = useState<"duration" | "zoom" | null>(null);
//   const durationRef = useRef<HTMLDivElement>(null);
//   const zoomRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       const target = event.target as Node;
//       if (
//         durationRef.current &&
//         !durationRef.current.contains(target) &&
//         zoomRef.current &&
//         !zoomRef.current.contains(target)
//       ) {
//         setActivePopover(null);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   return (
//     <div className="relative min-h-[calc(100vh-80px)] w-full bg-background text-foreground px-4 sm:px-6 py-12 md:py-18 overflow-hidden antialiased flex flex-col justify-between">
//       <div className="relative z-10 mx-auto w-full max-w-5xl flex-1 flex flex-col items-center">
//         {/* Title Section */}
//         <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
//           <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-tight">
//             {outputUrl ? "Your Match Cut is Ready!" : "What's your video about?"}
//           </h1>
//           <p className="mt-3 text-sm sm:text-base text-muted-foreground font-normal">
//             {outputUrl ? (
//               <>
//                 Custom match cut generated for{" "}
//                 <span className="text-white font-medium">&ldquo;{prompt}&rdquo;</span>
//               </>
//             ) : (
//               <>
//                 One topic in, one{" "}
//                 <span className="bg-gradient-to-r from-[#1A73E8] via-[#3B82F6] to-[#5EB5FC] bg-clip-text text-transparent font-medium">
//                   match cut
//                 </span>{" "}
//                 out.
//               </>
//             )}
//           </p>
//         </div>

//         {outputUrl ? (
//           <MatchCutReadyCard
//             outputUrl={outputUrl}
//             topic={prompt}
//             durationInSeconds={durationInSeconds}
//             aspectRatio={aspectRatio}
//             resolution={resolution}
//             onDownload={handleDownload}
//             onRegenerate={() => handleGenerate()}
//             onEditTopic={handleReset}
//             isRegenerating={isGenerating}
//           />
//         ) : (
//           <>
//             {/* Input & Controls Box */}
//             <form
//               onSubmit={handleGenerate}
//               className="w-full max-w-2xl rounded-2xl border border-border bg-[#1F1F1F] p-3.5 sm:p-4.5 backdrop-blur-md transition-all shadow-xl"
//             >
//               {/* Top Row: Search Input & Generate CTA */}
//               <div className="flex items-center gap-3">
//                 <Search className="w-5 h-5 text-muted-foreground shrink-0 ml-1.5" />
//                 <input
//                   type="text"
//                   value={prompt}
//                   maxLength={14}
//                   onChange={(e) => setPrompt(e.target.value)}
//                   placeholder="Type a name, brand or idea..."
//                   disabled={isGenerating}
//                   className="flex-1 bg-transparent text-sm sm:text-base text-foreground placeholder-muted-foreground outline-none border-none ring-0 py-1 disabled:opacity-60"
//                 />
//                 {prompt.length > 0 && (
//                   <span className="text-[11px] font-mono shrink-0 px-1.5 py-0.5 rounded text-muted-foreground bg-white/[0.04]">
//                     {prompt.length}/14
//                   </span>
//                 )}
//                 <ShimmerButton
//                   type="submit"
//                   disabled={isGenerating}
//                   variant="primary"
//                   size="sm"
//                   className="shrink-0 font-semibold uppercase tracking-wider"
//                 >
//                   <span>
//                     {isGenerating
//                       ? progressStep === "rendering"
//                         ? "Rendering..."
//                         : "Generating..."
//                       : "Generate"}
//                   </span>
//                 </ShimmerButton>
//               </div>

//               {/* Bottom Controls: Aspect Ratio + Tuning Popovers + Resolution */}
//               <div className="mt-4 pt-3 border-t border-white/[0.07] flex items-center justify-between flex-wrap gap-2.5">
//                 {/* Aspect Ratio Group */}
//                 <div className="flex items-center gap-1.5">
//                   {/* 16:9 */}
//                   <button
//                     type="button"
//                     disabled={isGenerating}
//                     onClick={() => setAspectRatio("16:9")}
//                     className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer disabled:opacity-50 ${
//                       aspectRatio === "16:9"
//                         ? "border border-primary bg-primary/20 text-white"
//                         : "border border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white hover:border-white/20"
//                     }`}
//                   >
//                     <svg
//                       className="w-3.5 h-2.5 shrink-0"
//                       viewBox="0 0 16 9"
//                       fill="none"
//                       stroke="currentColor"
//                       strokeWidth="2"
//                     >
//                       <rect x="1" y="1" width="14" height="7" rx="1.5" />
//                     </svg>
//                     <span>16:9</span>
//                   </button>

//                   {/* 9:16 */}
//                   <button
//                     type="button"
//                     disabled={isGenerating}
//                     onClick={() => setAspectRatio("9:16")}
//                     className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer disabled:opacity-50 ${
//                       aspectRatio === "9:16"
//                         ? "border border-primary bg-primary/20 text-white"
//                         : "border border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white hover:border-white/20"
//                     }`}
//                   >
//                     <svg
//                       className="w-2.5 h-3.5 shrink-0"
//                       viewBox="0 0 9 16"
//                       fill="none"
//                       stroke="currentColor"
//                       strokeWidth="2"
//                     >
//                       <rect x="1" y="1" width="7" height="14" rx="1.5" />
//                     </svg>
//                     <span>9:16</span>
//                   </button>

//                   {/* 1:1 */}
//                   <button
//                     type="button"
//                     disabled={isGenerating}
//                     onClick={() => setAspectRatio("1:1")}
//                     className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer disabled:opacity-50 ${
//                       aspectRatio === "1:1"
//                         ? "border border-primary bg-primary/20 text-white "
//                         : "border border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white hover:border-white/20"
//                     }`}
//                   >
//                     <svg
//                       className="w-3 h-3 shrink-0"
//                       viewBox="0 0 12 12"
//                       fill="none"
//                       stroke="currentColor"
//                       strokeWidth="2"
//                     >
//                       <rect x="1" y="1" width="10" height="10" rx="1.5" />
//                     </svg>
//                     <span>1:1</span>
//                   </button>
//                 </div>

//                 {/* Center Tuning Popover Pills */}
//                 <div className="flex items-center gap-1.5">
//                   {/* Duration Popover */}
//                   <div className="relative" ref={durationRef}>
//                     <button
//                       type="button"
//                       disabled={isGenerating}
//                       onClick={() =>
//                         setActivePopover(activePopover === "duration" ? null : "duration")
//                       }
//                       className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer disabled:opacity-50 ${
//                         activePopover === "duration"
//                           ? "border border-primary bg-primary/20 text-white shadow-sm shadow-primary/20"
//                           : "border border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white hover:border-white/20 hover:bg-white/[0.05]"
//                       }`}
//                     >
//                       <Clock className="w-3.5 h-3.5 text-zinc-400" />
//                       <span>{durationInSeconds}s</span>
//                       <ChevronDown
//                         className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${
//                           activePopover === "duration" ? "rotate-180 text-primary" : ""
//                         }`}
//                       />
//                     </button>

//                     {activePopover === "duration" && (
//                       <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-60 p-3.5 rounded-xl border border-white/15 bg-[#141416]/95 backdrop-blur-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
//                         <div className="flex items-center justify-between mb-2">
//                           <span className="text-xs font-medium text-zinc-300">Duration</span>
//                           <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/25">
//                             {durationInSeconds}s
//                           </span>
//                         </div>
//                         <Slider
//                           min={1}
//                           max={10}
//                           step={1}
//                           value={durationInSeconds}
//                           onValueChange={(val) => {
//                             const num = Array.isArray(val) ? val[0] : val;
//                             if (typeof num === "number" && !isNaN(num)) {
//                               setDurationInSeconds(num);
//                             }
//                           }}
//                           className="py-2 cursor-pointer"
//                         />
//                         <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-1 text-[11px]">
//                           {[3, 6, 10].map((sec) => (
//                             <button
//                               key={sec}
//                               type="button"
//                               onClick={() => setDurationInSeconds(sec)}
//                               className={`flex-1 py-1 rounded text-center transition-colors cursor-pointer ${
//                                 durationInSeconds === sec
//                                   ? "bg-primary text-white font-medium shadow-sm shadow-primary/20"
//                                   : "bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/10"
//                               }`}
//                             >
//                               {sec}s {sec === 6 ? "★" : ""}
//                             </button>
//                           ))}
//                         </div>
//                       </div>
//                     )}
//                   </div>

//                   {/* Zoom Intensity Popover */}
//                   <div className="relative" ref={zoomRef}>
//                     <button
//                       type="button"
//                       disabled={isGenerating}
//                       onClick={() =>
//                         setActivePopover(activePopover === "zoom" ? null : "zoom")}
//                       className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer disabled:opacity-50 ${
//                         activePopover === "zoom"
//                           ? "border border-primary bg-primary/20 text-white shadow-sm shadow-primary/20"
//                           : "border border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white hover:border-white/20 hover:bg-white/[0.05]"
//                       }`}
//                     >
//                       <ZoomIn className="w-3.5 h-3.5 text-zinc-400" />
//                       <span>{zoomIntensity}%</span>
//                       <ChevronDown
//                         className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${
//                           activePopover === "zoom" ? "rotate-180 text-primary" : ""
//                         }`}
//                       />
//                     </button>

//                     {activePopover === "zoom" && (
//                       <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-3.5 rounded-xl border border-white/15 bg-[#141416]/95 backdrop-blur-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
//                         <div className="flex items-center justify-between mb-2">
//                           <span className="text-xs font-medium text-zinc-300">Zoom Intensity</span>
//                           <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/25">
//                             {zoomIntensity}%
//                           </span>
//                         </div>
//                         <Slider
//                           min={0}
//                           max={100}
//                           step={5}
//                           value={zoomIntensity}
//                           onValueChange={(val) => {
//                             const num = Array.isArray(val) ? val[0] : val;
//                             if (typeof num === "number" && !isNaN(num)) {
//                               setZoomIntensity(num);
//                             }
//                           }}
//                           className="py-2 cursor-pointer"
//                         />
//                         <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-1 text-[11px]">
//                           {[
//                             { label: "0% Static", val: 0 },
//                             { label: "50%", val: 50 },
//                             { label: "100% Full", val: 100 },
//                           ].map((item) => (
//                             <button
//                               key={item.val}
//                               type="button"
//                               onClick={() => setZoomIntensity(item.val)}
//                               className={`flex-1 py-1 rounded text-center transition-colors cursor-pointer ${
//                                 zoomIntensity === item.val
//                                   ? "bg-primary text-white font-medium shadow-sm shadow-primary/20"
//                                   : "bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/10"
//                               }`}
//                             >
//                               {item.label}
//                             </button>
//                           ))}
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 {/* Resolution Group */}
//                 <div className="flex items-center gap-1.5">
//                   <button
//                     type="button"
//                     disabled={isGenerating}
//                     onClick={() => setResolution("4K")}
//                     className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer disabled:opacity-50 ${
//                       resolution === "4K"
//                         ? "border border-primary bg-primary/20 text-white"
//                         : "border border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white hover:border-white/20"
//                     }`}
//                   >
//                     4K
//                   </button>
//                   <button
//                     type="button"
//                     disabled={isGenerating}
//                     onClick={() => setResolution("1080p")}
//                     className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer disabled:opacity-50 ${
//                       resolution === "1080p"
//                         ? "border border-primary bg-primary/20 text-white"
//                         : "border border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white hover:border-white/20"
//                     }`}
//                   >
//                     1080p
//                   </button>
//                 </div>
//               </div>

//               {/* Real-time Rendering Progress Bar */}
//               {isGenerating && (
//                 <div className="mt-4 pt-3 border-t border-white/[0.07] animate-in fade-in duration-300">
//                   <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
//                     <span className="flex items-center gap-2">
//                       <span className="inline-block w-2 h-2 rounded-full bg-primary animate-ping" />
//                       {progressStep === "generating"
//                         ? "Generating match cut search cuts..."
//                         : "Rendering Remotion video..."}
//                     </span>
//                     <span className="font-mono">{Math.round(progress)}%</span>
//                   </div>
//                   <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
//                     <div
//                       className="h-full bg-gradient-to-r from-[#1A73E8] to-[#5EB5FC] transition-all duration-300 ease-out"
//                       style={{ width: `${Math.max(5, Math.min(100, progress))}%` }}
//                     />
//                   </div>
//                 </div>
//               )}
//             </form>

//             {/* Suggestion Chips */}
//             <div className="mt-5 flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap">
//               {SUGGESTIONS.map((item) => (
//                 <button
//                   key={item}
//                   type="button"
//                   disabled={isGenerating}
//                   onClick={() => handleSelectSuggestion(item)}
//                   className="px-3.5 py-1.5 rounded-full border border-border bg-[#1F1F1F] text-sm text-foreground hover:text-white hover:bg-white/[0.08] hover:border-border transition-all cursor-pointer disabled:opacity-50"
//                 >
//                   {item}
//                 </button>
//               ))}
//             </div>
//           </>
//         )}

//         {/* Made with Match Cut Section */}
//         <div className="mt-16 sm:mt-20 w-full">
//           {/* Section Header */}
//           <div className="flex items-center justify-between mb-4">
//             <h2 className="text-base sm:text-lg font-semibold text-foreground tracking-tight">
//               Made with Match Cut
//             </h2>
//           </div>

//           {/* 3 Showcase Cards */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
//             {EXAMPLES.map((example) => (
//               <div
//                 key={example.id}
//                 className="group relative flex flex-col rounded-2xl border border-white/10 bg-[#121316] overflow-hidden hover:border-white/25 transition-all duration-300"
//               >
//                 {/* Search result scene visual */}
//                 <div className="relative aspect-video w-full bg-[#0d0e11] p-4 flex flex-col justify-start overflow-hidden select-none border-b border-white/5">
//                   {/* Blurred top text hint */}
//                   <div className="text-[11px] text-zinc-600 line-clamp-1 filter blur-[1.5px] opacity-60">
//                     have whole distinction and it takes years to learn.
//                   </div>

//                   {/* Favicon & URL */}
//                   <div className="mt-3 flex items-center gap-2">
//                     <div className="w-3.5 h-3.5 rounded-full bg-zinc-600 shrink-0" />
//                     <div className="flex flex-col">
//                       <span className="text-[10px] text-zinc-400 font-medium leading-none">
//                         {example.domain}
//                       </span>
//                       <span className="text-[9px] text-muted-foreground leading-tight">
//                         {example.url}
//                       </span>
//                     </div>
//                   </div>

//                   {/* Headline in Google-blue */}
//                   <h3 className="mt-2 text-sm sm:text-base font-semibold text-[#1A73E8] group-hover:text-[#5EB5FC] transition-colors line-clamp-1">
//                     {example.headline}
//                   </h3>

//                   {/* Snippet */}
//                   <p className="mt-1 text-[10px] sm:text-[11px] text-zinc-400 leading-snug line-clamp-2">
//                     {example.description}
//                   </p>
//                 </div>

//                 {/* Bottom Metadata bar */}
//                 <div className="px-4 py-3 bg-[#121316] flex items-center justify-between text-xs">
//                   <span className="font-semibold text-white tracking-wide">
//                     {example.title}
//                   </span>
//                   <span className="text-muted-foreground font-mono text-[11px]">
//                     {example.aspectRatio} · {example.resolution}
//                   </span>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Search,
  Sparkles,
  Download,
  RotateCcw,
  Loader2,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  ChevronDown,
  Check,
} from "lucide-react";
import Link from "next/link";
import EdikitButton from "@/components/ShimmerButton/ShimmerButton";
import { Slider } from "@/components/ui/slider";
import AnimationPreview from "@/components/Video/AnimationPreview";
import VideoPlayer from "@/components/Video/VideoPlayer";
import {
  useMatchCutLogic,
  AspectRatio,
  Resolution,
} from "./useMatchCutLogic";
import { showErrorToast, showSuccessToast } from "@/components/Toast/showToast";

const MATCH_CUT_PREVIEW_VIDEO = "/matchcut/preview.mp4";
const MATCH_CUT_PREVIEW_POSTER = "/matchcut/matchcut-preview.jpg";

// ─── Aspect Ratio Options ───────────────────────────────────────────────────
const ASPECT_OPTIONS: {
  value: AspectRatio;
  label: string;
  sub: string;
  icon: React.ReactNode;
}[] = [
    {
      value: "9:16",  
      label: "9:16",
      sub: "Reels / TikTok",
      icon: (
        <svg viewBox="0 0 20 32" fill="none" className="w-3.5 h-6">
          <rect
            x="1"
            y="1"
            width="18"
            height="30"
            rx="2.5"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      ),
    },
    {
      value: "16:9",
      label: "16:9",
      sub: "YouTube",
      icon: (
        <svg viewBox="0 0 32 20" fill="none" className="w-6 h-3.5">
          <rect
            x="1"
            y="1"
            width="30"
            height="18"
            rx="2.5"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      ),
    },
    {
      value: "1:1",
      label: "1:1",
      sub: "Square",
      icon: (
        <svg viewBox="0 0 26 26" fill="none" className="w-5 h-5">
          <rect
            x="1"
            y="1"
            width="24"
            height="24"
            rx="2.5"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      ),
    },
  ];

export default function MatchCutPage() {
  const [previewRatio] = useState("9/16");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    text: true,
    settings: true,
  });
  const [copied, setCopied] = useState(false);

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const {
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
    isGenerating,
    progressStep,
    progress,
    outputUrl,
    errorMessage,
    isLoggedIn,
    authLoading,
    handleGenerate,
    handleSelectSuggestion,
    handleReset,
    handleDownload,
  } = useMatchCutLogic();

  const handleCopyLink = async () => {
    if (!outputUrl) return;
    const fullUrl = outputUrl.startsWith("http")
      ? outputUrl
      : `${window.location.origin}${outputUrl}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      showSuccessToast("Link copied", "Video link copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showErrorToast("Copy failed", "Could not copy link to clipboard.");
    }
  };

  const settingsSummary = [
    aspectRatio,
    resolution,
    `${durationInSeconds}s`,
    `${zoomIntensity}%`,
  ].join(", ");

  return (
    <div className="min-h-screen bg-background relative">
      <main className="container mx-auto px-4 py-4">
        {/* Back Button */}
        <Link
          href="/"
          className="rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors inline-block p-1.5"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-12 max-w-7xl mx-auto items-start mt-2">
          {/* Left Column - Sticky Preview */}
          <div className="lg:sticky lg:top-16 space-y-4 order-2 lg:order-1">
            <div 
              className="rounded-2xl overflow-hidden shadow-sm mx-auto transition-all w-full"
              style={{ maxWidth: `calc(79vh * (${previewRatio}) + 1rem)` }}
            >
              <div className="p-2">
                <div className="flex items-center gap-1">
                  <h2 className="font-semibold text-foreground text-xl">
                    Preview
                  </h2>
                </div>
              </div>

              <div className="p-2">
                {/* Outer: owns the visible ring + border-radius. No overflow-hidden here
                    so the ring corners are never fighting the clip boundary.           */}
                <div
                  className="rounded-[20px] ring-[3px] ring-[#4B4B4B] relative mx-auto w-full max-h-[79vh] transition-all"
                  style={{ aspectRatio: previewRatio }}
                >
                  {/* Inner: owns overflow-hidden. radius = 20 - 3 = 17px so the clipped
                      content sits flush with the inside edge of the ring.              */}
                  <div className="overflow-hidden rounded-[17px] bg-black absolute inset-0 flex items-center justify-center">
                    {outputUrl ? (
                      <VideoPlayer
                        src={outputUrl}
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
                      <div className="relative w-full h-full">
                        <AnimationPreview
                          src={MATCH_CUT_PREVIEW_VIDEO}
                          poster={MATCH_CUT_PREVIEW_POSTER}
                          orientation="portrait"
                          fit="contain"
                          showFullscreen
                          playOverlay={false}
                          trigger="auto"
                          className="h-full w-full"
                        />
                        {/* {isGenerating && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 gap-3.5 px-6 z-20">
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-5 h-5 animate-spin text-primary" />

                            </div>
                            <div className="w-full space-y-1.5 max-w-[200px]">
                              <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary transition-all duration-500 ease-out"
                                  style={{
                                    width: `${Math.max(5, Math.min(100, progress))}%`,
                                  }}
                                />
                              </div>
                              <p className="text-right text-[11px] font-mono text-white/80">
                                {Math.round(progress)}%
                              </p>
                            </div>
                          </div>
                        )} */}
                      </div>
                    )}
                  </div>
                </div>


                <p className="mt-4 text-center text-xs text-muted-foreground">
                  The preview shows how your customization will look.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Scrollable Collapsible Categories */}
          <div className="space-y-4 order-1 lg:order-2">
            <div>
              <h1 className="text-2xl font-medium text-foreground mb-1">
                Match Cut
              </h1>
              <p className="text-sm text-muted-foreground">
                Customize this template and generate a video in seconds.
              </p>
            </div>

            {/* ─── SECTION 1: TEXT ─── */}
            <div className="rounded-xl border border-border bg-card/80 overflow-hidden shadow-xs transition-all">
              <button
                type="button"
                onClick={() => toggleSection("text")}
                className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-accent/40 transition-colors select-none text-left"
              >
                <div className="flex items-center gap-2.5 font-semibold text-foreground text-md">
                  <span>Text</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>1 field</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${openSections.text ? "rotate-180" : ""
                      }`}
                  />
                </div>
              </button>

              {openSections.text && (
                <div className="px-4 pb-4 pt-1 space-y-3.5 animate-in fade-in-50 duration-150">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        Topic
                        <span className="text-red-500 text-xs">*</span>
                      </span>
                      {prompt.trim() && (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      )}
                    </label>

                    <div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <input
                          type="text"
                          value={prompt}
                          maxLength={14}
                          onChange={(e) => setPrompt(e.target.value)}
                          disabled={isGenerating}
                          className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm transition-colors disabled:opacity-50"
                          placeholder="Enter a topic, name, brand or idea..."
                        />
                      </div>
                      <p
                        className={`text-[11px] mt-1 text-right transition-colors ${
                          prompt.length >= 14
                            ? "text-red-500 font-medium"
                            : prompt.length >= 12
                            ? "text-amber-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {prompt.length} / 14
                        {prompt.length >= 12 && prompt.length < 14 && (
                          <span className="ml-1 opacity-80">— keeps best under 12</span>
                        )}
                        {prompt.length === 14 && (
                          <span className="ml-1">— max reached</span>
                        )}
                      </p>
                    </div>

                    {/* Quick Suggestion Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[11px] text-muted-foreground mr-1">
                        Suggestions:
                      </span>
                      {["Lionel Messi", "Growth", "Taylor Swift", "AI"].map(
                        (s) => (
                          <button
                            key={s}
                            type="button"
                            disabled={isGenerating}
                            onClick={() => handleSelectSuggestion(s)}
                            className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 ${prompt === s
                                ? "border-primary bg-primary/10 text-foreground shadow-xs"
                                : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent"
                              }`}
                          >
                            {s}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ─── SECTION 2: SETTINGS ─── */}
            <div className="rounded-xl border border-border bg-card/80 overflow-hidden shadow-xs transition-all">
              <button
                type="button"
                onClick={() => toggleSection("settings")}
                className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-accent/40 transition-colors select-none text-left"
              >
                <div className="flex items-center gap-2.5 font-semibold text-foreground text-md">
                  <span>Settings</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{settingsSummary}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${openSections.settings ? "rotate-180" : ""
                      }`}
                  />
                </div>
              </button>

              {openSections.settings && (
                <div className="px-4 pb-4 pt-1 space-y-4 animate-in fade-in-50 duration-150">
                  {/* Aspect Ratio */}
                  <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2.5">
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        Aspect Ratio
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Select the video dimension for your target platform.
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {ASPECT_OPTIONS.map(({ value, label, sub, icon }) => {
                        const active = aspectRatio === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            disabled={isGenerating}
                            onClick={() => setAspectRatio(value)}
                            className={`relative flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 ${active
                                ? "border-primary bg-primary/10 text-foreground shadow-xs"
                                : "border-border bg-background text-muted-foreground hover:text-foreground"
                              }`}
                          >
                            {active && (
                              <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </span>
                            )}
                            <span
                              className={
                                active ? "text-primary" : "text-muted-foreground"
                              }
                            >
                              {icon}
                            </span>
                            <div className="text-center">
                              <p className="text-xs font-semibold leading-none">
                                {label}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {sub}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Resolution */}
                  <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2.5">
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        Resolution
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Export quality for the rendered video.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(["4K", "1080p"] as Resolution[]).map((res) => {
                        const active = resolution === res;
                        return (
                          <button
                            key={res}
                            type="button"
                            disabled={isGenerating}
                            onClick={() => setResolution(res)}
                            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 ${active
                                ? "border-primary bg-primary/10 text-foreground shadow-xs"
                                : "border-border bg-background text-muted-foreground hover:text-foreground"
                              }`}
                          >
                            <span>{res}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          Duration
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Length of the search zoom animation.
                        </p>
                      </div>
                      <span className="text-xs font-mono font-medium text-foreground bg-muted px-2 py-0.5 rounded border border-border">
                        {durationInSeconds}s
                      </span>
                    </div>
                    <Slider
                      min={1}
                      max={10}
                      step={1}
                      value={durationInSeconds}
                      onValueChange={(val) => {
                        const n = Array.isArray(val) ? val[0] : val;
                        if (typeof n === "number" && !isNaN(n))
                          setDurationInSeconds(n);
                      }}
                      className="py-1 cursor-pointer"
                    />
                    <div className="flex gap-2">
                      {[3, 6, 10].map((s) => (
                        <button
                          key={s}
                          type="button"
                          disabled={isGenerating}
                          onClick={() => setDurationInSeconds(s)}
                          className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 ${durationInSeconds === s
                              ? "border-primary bg-primary/10 text-foreground shadow-xs"
                              : "border-border bg-background text-muted-foreground hover:text-foreground"
                            }`}
                        >
                          {s}s{s === 6 ? " (Default)" : ""}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Zoom Intensity */}
                  <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          Zoom Intensity
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Camera zoom into the search result.
                        </p>
                      </div>
                      <span className="text-xs font-mono font-medium text-foreground bg-muted px-2 py-0.5 rounded border border-border">
                        {zoomIntensity}%
                      </span>
                    </div>
                    <Slider
                      min={0}
                      max={100}
                      step={5}
                      value={zoomIntensity}
                      onValueChange={(val) => {
                        const n = Array.isArray(val) ? val[0] : val;
                        if (typeof n === "number" && !isNaN(n))
                          setZoomIntensity(n);
                      }}
                      className="py-1 cursor-pointer"
                    />
                    <div className="flex gap-2">
                      {[
                        { label: "None", val: 0 },
                        { label: "50%", val: 50 },
                        { label: "Full", val: 100 },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          disabled={isGenerating}
                          onClick={() => setZoomIntensity(item.val)}
                          className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 ${zoomIntensity === item.val
                              ? "border-primary bg-primary/10 text-foreground shadow-xs"
                              : "border-border bg-background text-muted-foreground hover:text-foreground"
                            }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Helpful Note */}
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <p className="text-xs text-blue-600 dark:text-blue-400 flex gap-2">
                      <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        <span className="font-medium">Note:</span> Match cut
                        videos look best with concise, punchy terms under 14
                        characters.
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Render Status Card (visible when generating, completed, or failed) */}
            {(isGenerating || outputUrl || errorMessage) && (
              <div className="p-4 rounded-xl border border-border bg-card space-y-3 shadow-xs">
                {isGenerating && progressStep === "generating" && (
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        Creating Scenes
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Generating match cut frames and search elements...
                      </p>
                    </div>
                  </div>
                )}
                {isGenerating && progressStep === "rendering" && (
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        Rendering Video
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {progress !== undefined
                          ? `${Math.round(progress)}% complete`
                          : "Processing your video..."}
                      </p>
                    </div>
                  </div>
                )}
                {!isGenerating && outputUrl && (
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">Completed!</p>
                      <p className="text-sm text-muted-foreground">
                        Your match cut video is ready for download.
                      </p>
                    </div>
                  </div>
                )}
                {!isGenerating && errorMessage && (
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">Render Failed</p>
                      <p className="text-sm text-muted-foreground">
                        {errorMessage}
                      </p>
                    </div>
                  </div>
                )}

                {/* Progress Bar */}
                {isGenerating && (
                  <div className="space-y-1">
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-500 ease-out"
                        style={{
                          width: `${Math.max(5, Math.min(100, progress))}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-right text-muted-foreground">
                      {Math.round(progress)}%
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Action CTA Buttons */}
            {authLoading ? (
              <div className="w-full h-12 rounded-lg bg-gray-300 dark:bg-gray-700 animate-pulse" />
            ) : outputUrl ? (
              <div className="space-y-3">
                <EdikitButton
                  onClick={handleDownload}
                  variant="primary"
                  width="w-full"
                >
                  <Download className="w-4 h-4" />
                  Download Video
                </EdikitButton>

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center pt-1 cursor-pointer"
                >
                  ← Create another match cut
                </button>
              </div>
            ) : (
              <EdikitButton
                onClick={handleGenerate}
                disabled={isGenerating || authLoading || !prompt.trim()}
                variant="primary"
                width="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {progressStep === "rendering"
                      ? "Rendering Video..."
                      : "Generating..."}
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
}
