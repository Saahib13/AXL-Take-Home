"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Sparkles, Clock } from "lucide-react";
import type { PublicQuestion } from "@/types/game";

interface QuestionCardProps {
  question: PublicQuestion;
  className?: string;
  showTimer?: boolean;
  timeLeft?: number;
}

export function QuestionCard({
  question,
  className,
  showTimer = false,
  timeLeft = 30,
}: QuestionCardProps) {
  return (
    <Card
      className={cn(
        "bg-gradient-to-br from-card to-card/80 border-primary/20 glow-primary",
        className
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              Q{question.questionNumber}
            </Badge>
            <Badge variant="secondary">{question.category}</Badge>
          </div>
          <div className="flex items-center gap-2">
            {question.source && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                <span>AI-generated from {question.source}</span>
              </div>
            )}
            {showTimer && (
              <div className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded-md">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-mono text-sm">{timeLeft}s</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xl sm:text-2xl font-medium leading-relaxed text-balance">
          {question.questionText}
        </p>
      </CardContent>
    </Card>
  );
}
