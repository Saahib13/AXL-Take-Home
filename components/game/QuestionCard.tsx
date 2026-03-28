"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Sparkles, Clock, Zap } from "lucide-react";
import type { PublicQuestion } from "@/types/game";

interface QuestionCardProps {
  question: PublicQuestion;
  className?: string;
  showTimer?: boolean;
  timeLeft?: number;
}

const difficultyConfig = {
  easy: { label: "Easy", color: "text-success", bg: "bg-success/10", border: "border-success/30" },
  medium: { label: "Medium", color: "text-gold", bg: "bg-gold/10", border: "border-gold/30" },
  hard: { label: "Hard", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30" },
};

export function QuestionCard({
  question,
  className,
  showTimer = false,
  timeLeft = 30,
}: QuestionCardProps) {
  const diffConfig = difficultyConfig[question.difficulty];

  return (
    <Card
      className={cn(
        "relative overflow-hidden bg-gradient-to-br from-card via-card to-muted/20 border-primary/20 glow-primary animate-scale-in",
        className
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
      
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <CardHeader className="relative pb-4 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Badge 
              variant="outline" 
              className="font-mono text-sm px-3 py-1 bg-background/50 border-border/50"
            >
              Q{question.questionNumber}
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              {question.category}
            </Badge>
            <Badge 
              variant="outline" 
              className={cn("px-3 py-1", diffConfig.bg, diffConfig.border, diffConfig.color)}
            >
              <Zap className="h-3 w-3 mr-1" />
              {diffConfig.label}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            {question.source && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>AI-generated from {question.source}</span>
              </div>
            )}
            {showTimer && (
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-mono",
                timeLeft <= 10 
                  ? "bg-destructive/10 text-destructive border border-destructive/30" 
                  : "bg-muted/50 text-muted-foreground"
              )}>
                <Clock className="h-3.5 w-3.5" />
                <span>{timeLeft}s</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative pb-8">
        <p className="text-2xl sm:text-3xl font-semibold leading-relaxed text-balance tracking-tight">
          {question.questionText}
        </p>
      </CardContent>
    </Card>
  );
}
