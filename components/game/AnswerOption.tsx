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
    "bg-card border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer",
  selected:
    "bg-primary/20 border-primary text-primary glow-primary cursor-pointer",
  correct:
    "bg-success/20 border-success text-success glow-success cursor-default",
  incorrect:
    "bg-destructive/20 border-destructive text-destructive glow-destructive cursor-default",
  disabled: "bg-muted/30 border-border/50 text-muted-foreground/50 cursor-not-allowed opacity-50",
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
        "relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 text-left w-full group",
        stateStyles[state]
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg border-2 transition-colors",
          state === "default" && "border-border bg-muted/50 text-muted-foreground group-hover:border-primary group-hover:text-primary",
          state === "selected" && "border-primary bg-primary text-primary-foreground",
          state === "correct" && "border-success bg-success text-success-foreground",
          state === "incorrect" && "border-destructive bg-destructive text-destructive-foreground",
          state === "disabled" && "border-border/50 bg-muted/30 text-muted-foreground/50"
        )}
      >
        {state === "correct" ? (
          <Check className="h-5 w-5" />
        ) : state === "incorrect" ? (
          <X className="h-5 w-5" />
        ) : (
          option.label
        )}
      </div>
      <span
        className={cn(
          "flex-1 text-base sm:text-lg font-medium",
          state === "default" && "text-foreground",
          state === "disabled" && "text-muted-foreground/50"
        )}
      >
        {option.text}
      </span>
    </button>
  );
}
