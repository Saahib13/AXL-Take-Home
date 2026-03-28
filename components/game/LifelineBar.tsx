"use client";

import { cn } from "@/lib/utils";
import { Divide, MessageCircle, SkipForward } from "lucide-react";
import type { Lifelines, LifelineType } from "@/types/game";

interface LifelineBarProps {
  lifelines: Lifelines;
  onUse: (lifeline: LifelineType) => void;
  disabled?: boolean;
  className?: string;
}

interface LifelineConfig {
  key: LifelineType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const lifelineConfigs: LifelineConfig[] = [
  {
    key: "fiftyFifty",
    label: "50:50",
    icon: <Divide className="h-5 w-5" />,
    description: "Remove two wrong answers",
  },
  {
    key: "askTheHost",
    label: "Ask the Host",
    icon: <MessageCircle className="h-5 w-5" />,
    description: "Get a hint from the AI host",
  },
  {
    key: "skip",
    label: "Skip",
    icon: <SkipForward className="h-5 w-5" />,
    description: "Skip to the next question",
  },
];

export function LifelineBar({
  lifelines,
  onUse,
  disabled = false,
  className,
}: LifelineBarProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-2xl p-4 shadow-lg",
        className
      )}
    >
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        Lifelines
      </h2>
      <div className="flex flex-col gap-2">
        {lifelineConfigs.map((config) => {
          const isAvailable = lifelines[config.key];
          const isDisabled = disabled || !isAvailable;

          return (
            <button
              key={config.key}
              onClick={() => onUse(config.key)}
              disabled={isDisabled}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 text-left",
                isAvailable &&
                  "border-border bg-card hover:border-primary/50 hover:bg-primary/5 cursor-pointer",
                !isAvailable &&
                  "border-border/30 bg-muted/20 cursor-not-allowed opacity-40"
              )}
            >
              <div
                className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border transition-colors",
                  isAvailable
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border/30 bg-muted/30 text-muted-foreground/50"
                )}
              >
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className={cn(
                    "font-semibold text-sm",
                    isAvailable ? "text-foreground" : "text-muted-foreground/50"
                  )}
                >
                  {config.label}
                </div>
                <div
                  className={cn(
                    "text-xs truncate",
                    isAvailable
                      ? "text-muted-foreground"
                      : "text-muted-foreground/30"
                  )}
                >
                  {isAvailable ? config.description : "Used"}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function LifelineBarCompact({
  lifelines,
  onUse,
  disabled = false,
  className,
}: LifelineBarProps) {
  return (
    <div className={cn("flex gap-2", className)}>
      {lifelineConfigs.map((config) => {
        const isAvailable = lifelines[config.key];
        const isDisabled = disabled || !isAvailable;

        return (
          <button
            key={config.key}
            onClick={() => onUse(config.key)}
            disabled={isDisabled}
            title={config.description}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all duration-200",
              isAvailable &&
                "border-border bg-card hover:border-primary/50 hover:bg-primary/5 cursor-pointer",
              !isAvailable &&
                "border-border/30 bg-muted/20 cursor-not-allowed opacity-40"
            )}
          >
            <div
              className={cn(
                "transition-colors",
                isAvailable ? "text-primary" : "text-muted-foreground/50"
              )}
            >
              {config.icon}
            </div>
            <span
              className={cn(
                "font-semibold text-sm hidden sm:inline",
                isAvailable ? "text-foreground" : "text-muted-foreground/50"
              )}
            >
              {config.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
