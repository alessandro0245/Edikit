"use client";

import {
  Play,
  FileText,
  MousePointerClick,
  Wand2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const iconMap = {
  intro: Play,
  content: FileText,
  cta: MousePointerClick,
  custom: Wand2,
};

type IconName = keyof typeof iconMap;

interface CategoryCardProps {
  id: string;
  title: string;
  description: string;
  iconName: IconName;
  examples: string[];
  imageUrl?: string;
  isCustom?: boolean;
  index?: number;
}

const cardNumbers = ["01", "02", "03", "04"];

export default function CategoryCard({
  id,
  title,
  description,
  iconName,
  examples,
  imageUrl,
  isCustom = false,
  index = 0,
}: CategoryCardProps) {
  const Icon = iconMap[iconName] || Wand2;
  const num = cardNumbers[index] ?? "0" + (index + 1);

  return (
    <Link href={`/prompt/${id}`} className="group h-full">
      <div className="relative h-full overflow-hidden rounded-2xl border border-border/60 transition-all duration-300 hover:border-primary/40 bg-card hover:shadow-xl hover:shadow-primary/8 hover:-translate-y-1">

        {/* Background image */}
        {imageUrl && (
          <div className="absolute inset-0 overflow-hidden rounded-2xl">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-30 group-hover:opacity-45"
            />
            <div className="absolute inset-0 bg-linear-to-t from-card via-card/85 to-card/30" />
          </div>
        )}

        {/* Large background number */}
        <span className="absolute top-4 right-5 text-7xl font-black text-foreground/4 group-hover:text-primary/8 transition-colors duration-300 select-none leading-none pointer-events-none">
          {num}
        </span>

        {/* Hover glow ring */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.2)]" />

        {/* Content */}
        <div className="relative h-full p-7 flex flex-col justify-between z-10 min-h-55">

          {/* Top row */}
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-background/70 backdrop-blur-sm border border-border/50 group-hover:border-primary/30 group-hover:bg-primary/10 transition-all duration-300 shadow-sm">
                <Icon
                  className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors duration-300"
                  strokeWidth={2}
                />
              </div>

              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background/50 border border-border/40 group-hover:border-primary/40 group-hover:bg-primary/10 transition-all duration-300">
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-all duration-300 group-hover:translate-x-0.5" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-200 leading-tight">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mt-1.5">
                {description}
              </p>
            </div>
          </div>

          {/* Tags */}
          {examples && examples.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-6">
              {examples.slice(0, 3).map((example, i) => (
                <span
                  key={i}
                  className="inline-block text-[10px] uppercase tracking-widest font-semibold px-2.5 py-1 bg-background/60 backdrop-blur-sm text-muted-foreground rounded-md border border-border/40 group-hover:border-primary/25 group-hover:text-foreground/70 transition-all duration-300"
                >
                  {example}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
