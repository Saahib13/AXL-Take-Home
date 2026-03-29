"use client";

import { Button } from "@/components/ui/button";
import { AnswerOption } from "./AnswerOption";
import { cn } from "@/lib/utils";
import { Lock, Loader2, ShieldCheck } from "lucide-react";
import type { AnswerOption as AnswerOptionType, AnswerState } from "@/types/game";

interface AnswerGridProps {
  options: AnswerOptionType[];
  selectedId: string | null;
  correctId: string | null;
  isRevealing: boolean;
  disabledIds?: string[];
  onSelect: (id: string) => void;
  onLockIn: () => void;
  isLocking?: boolean;
  className?: string;
}

export function AnswerGrid({
  options,
  selectedId,
  correctId,
  isRevealing,
  disabledIds = [],
  onSelect,
  onLockIn,
  isLocking = false,
  className,
}: AnswerGridProps) {
  const getAnswerState = (optionId: string): AnswerState => {
    if (disabledIds.includes(optionId)) return "disabled";
    
    if (isRevealing && correctId) {
      if (optionId === correctId) return "correct";
      if (optionId === selectedId && optionId !== correctId) return "incorrect";
      return "disabled";
    }
    
    if (optionId === selectedId) return "selected";
    return "default";
  };

  const canLockIn = selectedId !== null && !isRevealing;

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {options.map((option, index) => (
          <div
            key={option.id}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 75}ms` }}
          >
            <AnswerOption
              option={option}
              state={getAnswerState(option.id)}
              onClick={() => onSelect(option.id)}
              disabled={isRevealing || disabledIds.includes(option.id)}
            />
          </div>
        ))}
      </div>

      {!isRevealing && (
        <div className="pt-2">
          <Button
            onClick={onLockIn}
            disabled={!canLockIn || isLocking}
            variant="gold"
            size="xl"
            className={cn(
              "w-full relative overflow-hidden transition-all duration-300",
              canLockIn && "animate-pulse-glow",
              !canLockIn && "opacity-60"
            )}
          >
            {/* Shimmer effect when ready */}
            {canLockIn && !isLocking && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
            )}
            
            <span className="relative flex items-center justify-center gap-2.5">
              {isLocking ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Locking In...</span>
                </>
              ) : canLockIn ? (
                <>
                  <ShieldCheck className="h-5 w-5" />
                  <span>Lock In Final Answer</span>
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5" />
                  <span>Select an Answer</span>
                </>
              )}
            </span>
          </Button>
          
          {canLockIn && (
            <p className="text-center text-xs text-muted-foreground mt-3 animate-slide-up">
              Are you sure? This action cannot be undone.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
