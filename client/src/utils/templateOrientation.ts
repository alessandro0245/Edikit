import type { Template } from "@/utils/constant";

export type VideoOrientation = "portrait" | "landscape" | "square";

export function getTemplateOrientation(template: Template): VideoOrientation {
  const dims = template.fields.background?.dimensions;
  const [w, h] = dims?.split("x").map(Number) ?? [9, 16];
  if (w === h) return "square";
  return w > h ? "landscape" : "portrait";
}

export const orientationContainerClass: Record<VideoOrientation, string> = {
  portrait: "aspect-[9/16]",
  landscape: "aspect-video",
  square: "aspect-square",
};

export function getOrientationFromDimensions(
  dimensions?: string,
): VideoOrientation {
  if (!dimensions) return "portrait";
  const [w, h] = dimensions.split("x").map(Number);
  if (w === h) return "square";
  return w > h ? "landscape" : "portrait";
}
