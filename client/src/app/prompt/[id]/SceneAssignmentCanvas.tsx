import { useState } from "react";
import { CheckCircle2, ChevronRight, Image as ImageIcon } from "lucide-react";
import type { UploadedAssets } from "@/components/Home/AssetUploadStep";

interface SceneAssignmentCanvasProps {
  scenes: any[];
  uploadedAssets: UploadedAssets;
  onConfirm: (finalScenes: any[]) => void;
}

export function SceneAssignmentCanvas({ scenes, uploadedAssets, onConfirm }: SceneAssignmentCanvasProps) {
  // Local state to track which media goes to which scene index
  const [assignedScenes, setAssignedScenes] = useState<any[]>(() => {
    // initialize copy
    return JSON.parse(JSON.stringify(scenes));
  });

  const availableMedia = uploadedAssets.mediaUrls || [];

  const handleAssign = (sceneIndex: number, mediaUrl: string) => {
    setAssignedScenes(prev => {
      const next = [...prev];
      next[sceneIndex] = { ...next[sceneIndex] };
      // If clicking the same media, toggle it off
      if (next[sceneIndex].mediaUrl === mediaUrl) {
        next[sceneIndex].mediaUrl = undefined;
      } else {
        next[sceneIndex].mediaUrl = mediaUrl;
      }
      return next;
    });
  };

  const handleConfirm = () => {
    onConfirm(assignedScenes);
  };

  return (
    <div className="w-full max-w-5xl bg-card rounded-2xl border border-border shadow-xl overflow-hidden flex flex-col h-[80vh] lg:h-[85vh]">
      <div className="px-6 py-5 border-b border-border bg-muted/20 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Assign Uploaded Media to Scenes</h2>
          <p className="text-sm text-muted-foreground mt-1">
            We generated {scenes.length} scenes. Pick which of your custom media goes where.
          </p>
        </div>
        <button
          onClick={handleConfirm}
          className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          Confirm & Render <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-border">
        {assignedScenes.map((scene, i) => {
          const isContent = scene.type === 'content';
          return (
            <div key={i} className={`p-5 rounded-xl border ${isContent ? 'border-primary/20 bg-primary/5' : 'border-border bg-background'}`}>
              <div className="flex gap-6">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-1 bg-muted rounded-md text-foreground">
                      Scene {i + 1}
                    </span>
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                      {scene.type}
                    </span>
                  </div>
                  <p className="text-base font-medium text-foreground">{scene.text}</p>
                  {scene.subtext && <p className="text-sm text-foreground/70">{scene.subtext}</p>}
                </div>

                {isContent && availableMedia.length > 0 && (
                  <div className="w-72 bg-card rounded-lg border border-border p-3 grid grid-cols-3 gap-2 shrink-0 h-fit">
                    {availableMedia.map((url, mediaIndex) => {
                      const isSelected = scene.mediaUrl === url;
                      return (
                         <button
                           key={mediaIndex}
                           onClick={() => handleAssign(i, url)}
                           className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all ${isSelected ? 'border-primary shadow-md' : 'border-transparent hover:border-primary/50 opacity-60 hover:opacity-100'}`}
                         >
                           {/* Since we don't know if it's an image or video easily, we can just render it as an img or video block, but for simplicity, we'll try to guess based on extension or just show a fallback if it fails. */}
                           {url.match(/\.(mp4|webm|mov)$/i) ? (
                              <video src={url} className="w-full h-full object-cover" />
                           ) : (
                              <img src={url} className="w-full h-full object-cover" alt="" />
                           )}
                           {isSelected && (
                             <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                               <CheckCircle2 className="w-6 h-6 text-white drop-shadow-md" fill="currentColor" />
                             </div>
                           )}
                         </button>
                      );
                    })}
                  </div>
                )}
                {isContent && availableMedia.length === 0 && (
                  <div className="w-64 flex items-center justify-center bg-muted/30 rounded-lg border border-dashed border-border p-4">
                    <p className="text-[11px] text-muted-foreground text-center">No custom media uploaded.</p>
                  </div>
                )}
                {!isContent && (
                  <div className="w-64 flex items-center justify-center bg-muted/20 rounded-lg p-4">
                    <p className="text-[11px] text-muted-foreground text-center">Intro/CTA scenes don't display custom media.</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}