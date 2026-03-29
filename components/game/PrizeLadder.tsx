"use client";

import { cn, formatCurrency } from "@/lib/utils";
import { PRIZE_LADDER } from "@/types/game";
import { ChevronRight, Check, Trophy, Sparkles } from "lucide-react";

interface PrizeLadderProps {
  currentStep: number;
  className?: string;
}

export function PrizeLadder({ currentStep, className }: PrizeLadderProps) {
  const reversedLadder = [...PRIZE_LADDER].reverse();
  const milestones = [PRIZE_LADDER.length - 1, 4, 9]; // $1M, $32K, $1K

  return (
    <div
      className={cn(
        "bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-5 shadow-xl inner-glow",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-gold/70 flex items-center justify-center">
          <Trophy className="h-4 w-4 text-gold-foreground" />
        </div>
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Prize Ladder
        </h2>
      </div>

      <div className="flex flex-col gap-1">
        {reversedLadder.map((prize, idx) => {
          const stepIndex = PRIZE_LADDER.length - 1 - idx;
          const isCompleted = stepIndex < currentStep;
          const isCurrent = stepIndex === currentStep;
          const isFuture = stepIndex > currentStep;
          const isMilestone = milestones.includes(stepIndex);

          return (
            <div
              key={prize}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-500 font-mono text-sm",
                isCurrent && "bg-gradient-to-r from-primary/25 to-primary/10 border border-primary/50 glow-primary scale-[1.02]",
                isCompleted && "bg-success/10 border border-success/20",
                isFuture && "opacity-40",
                isMilestone && isFuture && "opacity-60"
              )}
            >
              {/* Left indicator */}
              <div className={cn(
                "w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300",
                isCurrent && "bg-primary text-primary-foreground shadow-lg shadow-primary/30",
                isCompleted && "bg-success text-success-foreground",
                isFuture && "bg-muted/50"
              )}>
                {isCompleted && <Check className="h-3.5 w-3.5" />}
                {isCurrent && <ChevronRight className="h-3.5 w-3.5 animate-pulse" />}
                {isFuture && isMilestone && <Sparkles className="h-3 w-3 text-gold/50" />}
              </div>

              {/* Prize amount */}
              <span
                className={cn(
                  "flex-1 font-semibold tabular-nums transition-colors duration-300",
                  isCurrent && "text-gold text-base",
                  isCompleted && "text-success",
                  isFuture && isMilestone && "text-gold/50",
                  isFuture && !isMilestone && "text-muted-foreground/50"
                )}
              >
                {formatCurrency(prize)}
              </span>

              {/* Milestone indicator */}
              {isMilestone && (
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isCurrent && "bg-gold",
                  isCompleted && "bg-success",
                  isFuture && "bg-gold/30"
                )} />
              )}

              {/* Current step accent line */}
              {isCurrent && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-primary" />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress indicator */}
      <div className="mt-5 pt-4 border-t border-border/50">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Progress</span>
          <span className="font-mono">{currentStep}/{PRIZE_LADDER.length}</span>
        </div>
        <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 rounded-full"
            style={{ width: `${(currentStep / PRIZE_LADDER.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function PrizeLadderCompact({ currentStep, className }: PrizeLadderProps) {
  const currentPrize = PRIZE_LADDER[currentStep] || 0;
  const nextPrize = PRIZE_LADDER[currentStep + 1];
  const progress = (currentStep / PRIZE_LADDER.length) * 100;

  return (
    <div
      className={cn(
        "bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-lg",
        className
      )}
    >
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-gold" />
          <span className="text-sm text-muted-foreground font-medium">Current</span>
        </div>
        <div className="text-gold font-bold font-mono text-lg">
          {formatCurrency(currentPrize)}
        </div>
        {nextPrize && (
          <>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">Next</div>
            <div className="text-foreground font-semibold font-mono">
              {formatCurrency(nextPrize)}
            </div>
          </>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary to-gold transition-all duration-500 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
