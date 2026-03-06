"use client";

import {
  Instagram,
  Briefcase,
  Heart,
  GraduationCap,
  Sparkles,
  Wand2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const iconMap = {
  instagram: Instagram,
  briefcase: Briefcase,
  heart: Heart,
  graduationCap: GraduationCap,
  sparkles: Sparkles,
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
  const Icon = iconMap[iconName];

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
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-linear-to-t from-card via-card/60 to-transparent" />
          </div>
        )}

        {/* Content */}
        <div className="relative h-full p-6 flex flex-col justify-between">
          {/* Icon & Title Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-background/80 backdrop-blur-sm group-hover:bg-primary/20 transition-colors duration-300">
                <Icon
                  className={`w-5 h-5 transition-colors duration-300 ${
                    isCustom ? "text-primary" : "text-foreground"
                  } group-hover:text-primary`}
                  strokeWidth={2}
                />
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground group-hover:text-foreground transition-colors">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                {description}
              </p>
            </div>
          </div>

          {/* Examples Tags */}
          {examples.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {examples.map((example, index) => (
                <span
                  key={index}
                  className="inline-block text-xs px-2.5 py-1 bg-background/60 backdrop-blur-sm text-foreground/70 rounded-full group-hover:bg-primary/20 group-hover:text-primary transition-colors duration-300"
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