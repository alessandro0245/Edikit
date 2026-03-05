"use client";

import { Coins, Sparkles, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useCredits } from "@/hooks/useCredits";
import { useState } from "react";

export default function CreditsDisplay() {
  const { templateCredits, aiPromptCredits, limit, planType, isLoading } = useCredits();
  const [showDropdown, setShowDropdown] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/50">
        <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-700 animate-pulse" />
        <div className="w-12 h-4 rounded bg-gray-300 dark:bg-gray-700 animate-pulse" />
      </div>
    );
  }

  if (templateCredits === undefined || aiPromptCredits === undefined) {
    return null;
  }

  const templatePercentage = limit ? (templateCredits / limit) * 100 : 0;
  const templateLow = templatePercentage < 20;

  const aiPercentage = limit ? (aiPromptCredits / limit) * 100 : 0;
  const aiLow = aiPercentage < 20;

  const getColor = (low: boolean) => {
    return low ? "text-red-500" : templatePercentage < 50 || aiPercentage < 50 ? "text-yellow-500" : "text-green-500";
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent/80 transition-colors border border-border group"
        title={`Credits: ${templateCredits}/${limit} | AI: ${aiPromptCredits}/${limit}`}
      >
        <Coins
          size={16}
          className={templateLow ? "text-red-500" : "text-green-500"}
        />
        <span className="text-sm font-medium">
          <span className={templateLow ? "text-red-500" : ""}>{templateCredits}</span>
          <span className="text-muted-foreground">/{limit}</span>
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform ${showDropdown ? "rotate-180" : ""}`}
        />
      </button>

      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-card border border-border rounded-lg shadow-lg z-50 p-4">
          {/* Template Credits */}
          <Link
            href="/credits"
            onClick={() => setShowDropdown(false)}
            className="block mb-4 p-3 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Coins size={16} className={templateLow ? "text-red-500" : "text-green-500"} />
                <span className="text-sm font-semibold text-foreground">Template Credits</span>
              </div>
              <span className="text-sm font-bold">
                <span className={templateLow ? "text-red-500" : ""}>{templateCredits}</span>
                <span className="text-muted-foreground">/{limit}</span>
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  templateLow
                    ? "bg-red-500"
                    : templatePercentage < 50
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${Math.min(templatePercentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">For template renders</p>
          </Link>

          <div className="border-t border-border my-2" />

          {/* AI Prompt Credits */}
          <Link
            href="/credits"
            onClick={() => setShowDropdown(false)}
            className="block p-3 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className={aiLow ? "text-red-500" : "text-purple-500"} />
                <span className="text-sm font-semibold text-foreground">AI Prompt Credits</span>
              </div>
              <span className="text-sm font-bold">
                <span className={aiLow ? "text-red-500" : ""}>{aiPromptCredits}</span>
                <span className="text-muted-foreground">/{limit}</span>
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  aiLow
                    ? "bg-red-500"
                    : aiPercentage < 50
                    ? "bg-yellow-500"
                    : "bg-purple-500"
                }`}
                style={{ width: `${Math.min(aiPercentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">For AI generation</p>
          </Link>

          {/* Plan and Actions */}
          <div className="border-t border-border mt-3 pt-3">
            {planType && (
              <p className="text-xs text-muted-foreground mb-2">
                <span className="font-semibold">{planType}</span> plan
              </p>
            )}
            <Link
              href="/pricing"
              onClick={() => setShowDropdown(false)}
              className="block w-full text-center px-3 py-2 text-xs font-medium rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Upgrade Plan
            </Link>
          </div>
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
