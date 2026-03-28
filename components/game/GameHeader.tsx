"use client";

import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Sparkles, Trophy, Zap } from "lucide-react";

interface GameHeaderProps {
  questionNumber: number;
  totalQuestions: number;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  currentWinnings: number;
}

const difficultyConfig = {
  easy: { color: "bg-success/10 text-success border-success/30", label: "Easy" },
  medium: { color: "bg-gold/10 text-gold border-gold/30", label: "Medium" },
  hard: { color: "bg-destructive/10 text-destructive border-destructive/30", label: "Hard" },
};

export function GameHeader({
  questionNumber,
  totalQuestions,
  category,
  difficulty,
  currentWinnings,
}: GameHeaderProps) {
  const config = difficultyConfig[difficulty];

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-5">
      {/* Left side - Branding and progress */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">AXL Trivia</h1>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-mono">Q{questionNumber}</span>
              <span className="opacity-50">/</span>
              <span className="font-mono opacity-70">{totalQuestions}</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="w-px h-8 bg-border/50" />
          <div className="flex flex-col gap-1">
            <div className="text-xs text-muted-foreground">Progress</div>
            <div className="w-24 h-1.5 bg-muted/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 rounded-full"
                style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Category, difficulty, winnings */}
      <div className="flex flex-wrap items-center gap-2.5">
        <Badge variant="outline" className="font-medium px-3 py-1.5 bg-muted/20">
          {category}
        </Badge>
        <Badge variant="outline" className={`font-medium px-3 py-1.5 ${config.color}`}>
          <Zap className="h-3 w-3 mr-1" />
          {config.label}
        </Badge>
        <div className="flex items-center gap-2 bg-gradient-to-r from-gold/15 to-gold/5 border border-gold/30 text-gold px-4 py-2 rounded-xl shadow-sm">
          <Trophy className="h-4 w-4" />
          <span className="font-bold font-mono text-sm">
            {formatCurrency(currentWinnings)}
          </span>
        </div>
      </div>
    </header>
  );
}
