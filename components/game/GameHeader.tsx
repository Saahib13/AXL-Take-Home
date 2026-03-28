"use client";

import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Sparkles, Trophy } from "lucide-react";

interface GameHeaderProps {
  questionNumber: number;
  totalQuestions: number;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  currentWinnings: number;
}

const difficultyColors = {
  easy: "success",
  medium: "gold",
  hard: "destructive",
} as const;

export function GameHeader({
  questionNumber,
  totalQuestions,
  category,
  difficulty,
  currentWinnings,
}: GameHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold tracking-tight">AXL Trivia</h1>
        </div>
        <span className="text-muted-foreground">|</span>
        <span className="text-sm text-muted-foreground font-mono">
          Question {questionNumber} of {totalQuestions}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="outline" className="font-normal">
          {category}
        </Badge>
        <Badge variant={difficultyColors[difficulty]}>
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
        </Badge>
        <div className="flex items-center gap-1.5 bg-gold/10 text-gold px-3 py-1.5 rounded-full">
          <Trophy className="h-4 w-4" />
          <span className="font-semibold font-mono">
            {formatCurrency(currentWinnings)}
          </span>
        </div>
      </div>
    </header>
  );
}
