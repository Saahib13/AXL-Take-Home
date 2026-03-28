"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import {
  Trophy,
  XCircle,
  Home,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Tags,
  Divide,
  MessageCircle,
  SkipForward,
} from "lucide-react";
import type { GameResult, LifelineType } from "@/types/game";
import confetti from "canvas-confetti";

interface ResultSummaryCardProps {
  result: GameResult;
  onPlayAgain: () => void;
  onReturnHome: () => void;
  className?: string;
}

const lifelineLabels: Record<LifelineType, { label: string; icon: React.ReactNode }> = {
  fiftyFifty: { label: "50:50", icon: <Divide className="h-4 w-4" /> },
  askTheHost: { label: "Ask the Host", icon: <MessageCircle className="h-4 w-4" /> },
  skip: { label: "Skip", icon: <SkipForward className="h-4 w-4" /> },
};

export function ResultSummaryCard({
  result,
  onPlayAgain,
  onReturnHome,
  className,
}: ResultSummaryCardProps) {
  const isWin = result.status === "won";

  useEffect(() => {
    if (isWin) {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#3B82F6", "#8B5CF6", "#F59E0B"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#3B82F6", "#8B5CF6", "#F59E0B"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isWin]);

  return (
    <Card
      className={cn(
        "max-w-lg mx-auto border-2",
        isWin ? "border-gold glow-gold" : "border-destructive/50",
        className
      )}
    >
      <CardHeader className="text-center pb-4">
        <div
          className={cn(
            "w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center",
            isWin
              ? "bg-gradient-to-br from-gold to-gold/70"
              : "bg-gradient-to-br from-destructive to-destructive/70"
          )}
        >
          {isWin ? (
            <Trophy className="h-10 w-10 text-gold-foreground" />
          ) : (
            <XCircle className="h-10 w-10 text-destructive-foreground" />
          )}
        </div>
        <CardTitle className="text-3xl font-bold">
          {isWin ? "You Win!" : "Game Over"}
        </CardTitle>
        <p className="text-muted-foreground">
          {isWin
            ? "Congratulations! You conquered the trivia mountain!"
            : "Better luck next time!"}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="bg-muted/30 rounded-xl p-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">Final Winnings</p>
          <p
            className={cn(
              "text-4xl font-bold font-mono",
              isWin ? "text-gold" : "text-foreground"
            )}
          >
            {formatCurrency(result.finalWinnings)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <StatItem
            icon={<HelpCircle className="h-5 w-5 text-primary" />}
            label="Questions Answered"
            value={result.questionsAnswered.toString()}
          />
          <StatItem
            icon={<Tags className="h-5 w-5 text-secondary" />}
            label="Categories"
            value={result.categoriesFaced.length.toString()}
          />
        </div>

        {result.categoriesFaced.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Categories Faced
            </p>
            <div className="flex flex-wrap gap-2">
              {result.categoriesFaced.map((cat, i) => (
                <Badge key={i} variant="outline">
                  {cat}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {result.lifelinesUsed.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Lifelines Used</p>
            <div className="flex flex-wrap gap-2">
              {result.lifelinesUsed.map((lifeline) => (
                <Badge
                  key={lifeline}
                  variant="secondary"
                  className="flex items-center gap-1.5"
                >
                  {lifelineLabels[lifeline].icon}
                  {lifelineLabels[lifeline].label}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button onClick={onPlayAgain} variant="default" size="lg" className="flex-1">
            <RotateCcw className="h-4 w-4" />
            Play Again
          </Button>
          <Button
            onClick={onReturnHome}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            <Home className="h-4 w-4" />
            Return Home
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StatItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-muted/30 rounded-xl p-4 flex items-center gap-3">
      {icon}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-bold text-lg">{value}</p>
      </div>
    </div>
  );
}

export function ExplanationCard({
  explanation,
  isCorrect,
  nextPrize,
  className,
}: {
  explanation: string;
  isCorrect: boolean;
  nextPrize?: number;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "border-2",
        isCorrect ? "border-success/50 glow-success" : "border-destructive/50",
        className
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles
            className={cn(
              "h-5 w-5",
              isCorrect ? "text-success" : "text-destructive"
            )}
          />
          {isCorrect ? "Correct!" : "Incorrect"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
          {explanation}
        </p>
        {isCorrect && nextPrize && (
          <p className="text-success font-semibold">
            You advance to {formatCurrency(nextPrize)}!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
