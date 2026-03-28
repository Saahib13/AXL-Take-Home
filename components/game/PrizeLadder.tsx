"use client";

import { cn, formatCurrency } from "@/lib/utils";
import { PRIZE_LADDER } from "@/types/game";
import { ChevronRight, Check } from "lucide-react";

interface PrizeLadderProps {
  currentStep: number;
  className?: string;
}

export function PrizeLadder({ currentStep, className }: PrizeLadderProps) {
  const reversedLadder = [...PRIZE_LADDER].reverse();

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-2xl p-4 shadow-lg",
        className
      )}
    >
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 text-center">
        Prize Ladder
      </h2>
      <div className="flex flex-col gap-1">
        {reversedLadder.map((prize, idx) => {
          const stepIndex = PRIZE_LADDER.length - 1 - idx;
          const isCompleted = stepIndex < currentStep;
          const isCurrent = stepIndex === currentStep;
          const isFuture = stepIndex > currentStep;

          return (
            <div
              key={prize}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 font-mono text-sm",
                isCurrent &&
                  "bg-primary/20 border border-primary text-primary glow-primary",
                isCompleted && "bg-success/10 text-success",
                isFuture && "text-muted-foreground/40"
              )}
            >
              <div className="w-5 flex justify-center">
                {isCompleted && <Check className="h-4 w-4" />}
                {isCurrent && (
                  <ChevronRight className="h-4 w-4 animate-pulse" />
                )}
              </div>
              <span
                className={cn(
                  "flex-1 font-semibold",
                  isCurrent && "text-gold"
                )}
              >
                {formatCurrency(prize)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PrizeLadderCompact({
  currentStep,
  className,
}: PrizeLadderProps) {
  const currentPrize = PRIZE_LADDER[currentStep] || 0;
  const nextPrize = PRIZE_LADDER[currentStep + 1];

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl p-3 shadow-lg",
        className
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">Current Prize</div>
        <div className="text-gold font-bold font-mono">
          {formatCurrency(currentPrize)}
        </div>
        {nextPrize && (
          <>
            <div className="text-muted-foreground">→</div>
            <div className="text-sm text-muted-foreground">Next</div>
            <div className="text-foreground font-semibold font-mono">
              {formatCurrency(nextPrize)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
