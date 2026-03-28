"use client";

import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";
import type { AnswerOption as AnswerOptionType, AnswerState } from "@/types/game";

interface AnswerOptionProps {
  option: AnswerOptionType;
  state: AnswerState;
  onClick?: () => void;
  disabled?: boolean;
}

const stateStyles: Record<AnswerState, string> = {
  default:
    "bg-card/80 border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer hover:scale-[1.01] active:scale-[0.99]",
  selected:
    "bg-primary/15 border-primary text-primary glow-primary cursor-pointer scale-[1.01]",
  correct:
    "bg-success/15 border-success text-success glow-success cursor-default animate-reveal-correct",
  incorrect:
    "bg-destructive/15 border-destructive text-destructive glow-destructive cursor-default animate-reveal-incorrect",
  disabled: 
    "bg-muted/10 border-border/30 text-muted-foreground/40 cursor-not-allowed opacity-40 scale-95",
};

const labelStyles: Record<AnswerState, string> = {
  default: "border-border bg-muted/30 text-muted-foreground group-hover:border-primary/50 group-hover:text-primary group-hover:bg-primary/10",
  selected: "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20",
  correct: "border-success bg-success text-success-foreground shadow-lg shadow-success/20",
  incorrect: "border-destructive bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20",
  disabled: "border-border/30 bg-muted/20 text-muted-foreground/40",
};

export function AnswerOption({
  option,
  state,
  onClick,
  disabled = false,
}: AnswerOptionProps) {
  const isInteractive = state === "default" || state === "selected";

  return (
    <button
      onClick={onClick}
      disabled={disabled || !isInteractive}
      className={cn(
        "group relative flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300 text-left w-full backdrop-blur-sm",
        stateStyles[state]
      )}
    >
      {/* Hover gradient overlay */}
      {isInteractive && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      )}

      <div
        className={cn(
          "relative flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border-2 transition-all duration-300",
          labelStyles[state]
        )}
      >
        {state === "correct" ? (
          <Check className="h-6 w-6" />
        ) : state === "incorrect" ? (
          <X className="h-6 w-6" />
        ) : (
          option.label
        )}
      </div>
      
      <span
        className={cn(
          "relative flex-1 text-base sm:text-lg font-medium transition-colors duration-200",
          state === "default" && "text-foreground",
          state === "selected" && "text-primary",
          state === "correct" && "text-success",
          state === "incorrect" && "text-destructive",
          state === "disabled" && "text-muted-foreground/40"
        )}
      >
        {option.text}
      </span>

      {/* Selection indicator */}
      {state === "selected" && (
        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary animate-pulse" />
      )}
    </button>
  );
}
