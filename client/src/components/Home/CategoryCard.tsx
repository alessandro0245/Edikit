"use client";

import {
  Instagram,
  Briefcase,
  Heart,
  GraduationCap,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useState } from "react";

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
  title: string;
  description: string;
  iconName: IconName;
  examples: string[];
  isCustom?: boolean;
}

export default function CategoryCard({
  title,
  description,
  iconName,
  examples,
  isCustom = false,
}: CategoryCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = iconMap[iconName];

  return (
    <div
      className="group h-full p-8 border border-border rounded-xl hover:border-foreground/30 hover:shadow-md transition-all duration-300 bg-card hover:bg-card/80"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col h-full space-y-4">
        {/* Icon Container */}
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
          <Icon
            className={`w-6 h-6 transition-colors ${
              isCustom ? "text-primary" : "text-foreground"
            } group-hover:text-primary`}
            strokeWidth={1.5}
          />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-foreground group-hover:text-foreground transition-colors">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>

        {/* Examples */}
        <div className="flex flex-wrap gap-2 pt-2">
          {examples.map((example, index) => (
            <span
              key={index}
              className="inline-block text-xs px-3 py-1 bg-muted text-muted-foreground rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-colors"
            >
              {example}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
