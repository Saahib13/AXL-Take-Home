"use client";

import { Button } from "@/components/ui/button";
import { AnswerOption } from "./AnswerOption";
import { cn } from "@/lib/utils";
import { Lock, Loader2 } from "lucide-react";
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
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((option) => (
          <AnswerOption
            key={option.id}
            option={option}
            state={getAnswerState(option.id)}
            onClick={() => onSelect(option.id)}
            disabled={isRevealing || disabledIds.includes(option.id)}
          />
        ))}
      </div>

      {!isRevealing && (
        <Button
          onClick={onLockIn}
          disabled={!canLockIn || isLocking}
          variant="gold"
          size="xl"
          className="w-full mt-2"
        >
          {isLocking ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Locking In...
            </>
          ) : (
            <>
              <Lock className="h-5 w-5" />
              Lock In Answer
            </>
          )}
        </Button>
      )}
    </div>
  );
}
