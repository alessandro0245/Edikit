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

// Map IDs to Lucide icons
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
}

export default function CategoryCard({
  id,
  title,
  description,
  iconName,
  examples,
  imageUrl,
  isCustom = false,
}: CategoryCardProps) {
  const Icon = iconMap[iconName] || Wand2;

  return (
    <Link href={`/prompt/${id}`} className="group h-full">
      <div className="relative h-full overflow-hidden rounded-lg border border-border transition-all duration-300 hover:border-foreground/20 hover:shadow-lg bg-card">
        {/* Background Image */}
        {imageUrl && (
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105 opacity-40 group-hover:opacity-50"
            />
            <div className="absolute inset-0 bg-linear-to-t from-card via-card/80 to-transparent" />
          </div>
        )}

        {/* Content */}
        <div className="relative h-full p-6 flex flex-col justify-between z-10">
          {/* Icon & Title Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-background/80 backdrop-blur-md group-hover:bg-primary/20 transition-colors duration-300 shadow-sm border border-border/50">
                <Icon
                  className={`w-6 h-6 transition-colors duration-300 ${
                    isCustom ? "text-primary" : "text-foreground"
                  } group-hover:text-primary`}
                  strokeWidth={2}
                />
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mt-2 font-medium">
                {description}
              </p>
            </div>
          </div>

          {/* Examples Tags */}
          {examples && examples.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {examples.slice(0, 3).map((example, index) => (
                <span
                  key={index}
                  className="inline-block text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 bg-background/80 backdrop-blur-sm text-muted-foreground rounded-md border border-border/50 group-hover:border-primary/30 transition-colors duration-300"
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