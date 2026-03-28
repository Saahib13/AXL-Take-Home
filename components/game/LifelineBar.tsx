"use client";

import { cn } from "@/lib/utils";
import { Divide, MessageCircle, SkipForward, Sparkles } from "lucide-react";
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
  color: string;
}

const lifelineConfigs: LifelineConfig[] = [
  {
    key: "fiftyFifty",
    label: "50:50",
    icon: <Divide className="h-5 w-5" />,
    description: "Remove two wrong answers",
    color: "primary",
  },
  {
    key: "askTheHost",
    label: "Ask the Host",
    icon: <MessageCircle className="h-5 w-5" />,
    description: "Get a hint from the AI",
    color: "secondary",
  },
  {
    key: "skip",
    label: "Skip Question",
    icon: <SkipForward className="h-5 w-5" />,
    description: "Skip to next question",
    color: "gold",
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
        "bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-5 shadow-xl inner-glow",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-5">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Lifelines
        </h2>
        <span className="ml-auto text-xs text-muted-foreground font-mono">
          {Object.values(lifelines).filter(Boolean).length}/3 remaining
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {lifelineConfigs.map((config) => {
          const isAvailable = lifelines[config.key];
          const isDisabled = disabled || !isAvailable;

          return (
            <button
              key={config.key}
              onClick={() => onUse(config.key)}
              disabled={isDisabled}
              className={cn(
                "group relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 text-left overflow-hidden",
                isAvailable && !disabled &&
                  "border-border bg-card/50 hover:border-primary/50 hover:bg-primary/5 cursor-pointer hover:scale-[1.01] active:scale-[0.99]",
                isAvailable && disabled &&
                  "border-border/50 bg-muted/10 cursor-not-allowed opacity-60",
                !isAvailable &&
                  "border-border/20 bg-muted/5 cursor-not-allowed"
              )}
            >
              {/* Hover gradient */}
              {isAvailable && !disabled && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              )}

              {/* Icon */}
              <div
                className={cn(
                  "relative flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center border-2 transition-all duration-300",
                  isAvailable && config.color === "primary" && "border-primary/40 bg-primary/10 text-primary group-hover:border-primary group-hover:bg-primary/20",
                  isAvailable && config.color === "secondary" && "border-secondary/40 bg-secondary/10 text-secondary group-hover:border-secondary group-hover:bg-secondary/20",
                  isAvailable && config.color === "gold" && "border-gold/40 bg-gold/10 text-gold group-hover:border-gold group-hover:bg-gold/20",
                  !isAvailable && "border-border/30 bg-muted/20 text-muted-foreground/30"
                )}
              >
                {config.icon}
              </div>

              {/* Text */}
              <div className="relative flex-1 min-w-0">
                <div
                  className={cn(
                    "font-semibold text-sm transition-colors duration-200",
                    isAvailable ? "text-foreground" : "text-muted-foreground/40"
                  )}
                >
                  {config.label}
                </div>
                <div
                  className={cn(
                    "text-xs truncate transition-colors duration-200",
                    isAvailable
                      ? "text-muted-foreground"
                      : "text-muted-foreground/25"
                  )}
                >
                  {isAvailable ? config.description : "Already used"}
                </div>
              </div>

              {/* Status indicator */}
              {!isAvailable && (
                <div className="relative text-xs text-muted-foreground/40 font-medium px-2 py-1 bg-muted/20 rounded-md">
                  Used
                </div>
              )}
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
              "group flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 transition-all duration-300 flex-1",
              isAvailable && !disabled &&
                "border-border bg-card/80 hover:border-primary/50 hover:bg-primary/5 cursor-pointer",
              isAvailable && disabled &&
                "border-border/50 bg-muted/10 cursor-not-allowed opacity-60",
              !isAvailable &&
                "border-border/20 bg-muted/5 cursor-not-allowed opacity-40"
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200",
                isAvailable && config.color === "primary" && "bg-primary/10 text-primary",
                isAvailable && config.color === "secondary" && "bg-secondary/10 text-secondary",
                isAvailable && config.color === "gold" && "bg-gold/10 text-gold",
                !isAvailable && "bg-muted/20 text-muted-foreground/40"
              )}
            >
              {config.icon}
            </div>
            <span
              className={cn(
                "font-semibold text-sm hidden sm:inline transition-colors duration-200",
                isAvailable ? "text-foreground" : "text-muted-foreground/40"
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
