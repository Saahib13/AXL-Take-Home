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
  TrendingUp,
  Star,
  Award,
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
      const duration = 4000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 70,
          origin: { x: 0, y: 0.7 },
          colors: ["#3B82F6", "#8B5CF6", "#F59E0B", "#10B981"],
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 70,
          origin: { x: 1, y: 0.7 },
          colors: ["#3B82F6", "#8B5CF6", "#F59E0B", "#10B981"],
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
        "max-w-lg w-full mx-auto border-2 bg-card/90 backdrop-blur-xl shadow-2xl animate-scale-in overflow-hidden",
        isWin ? "border-gold/50 glow-gold" : "border-destructive/30",
        className
      )}
    >
      {/* Top accent */}
      <div className={cn(
        "h-1.5 w-full",
        isWin 
          ? "bg-gradient-to-r from-gold via-primary to-gold" 
          : "bg-gradient-to-r from-destructive/50 via-destructive to-destructive/50"
      )} />

      <CardHeader className="text-center pt-10 pb-6">
        {/* Icon */}
        <div className="relative mx-auto mb-6">
          <div
            className={cn(
              "w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl",
              isWin
                ? "bg-gradient-to-br from-gold via-gold/80 to-gold/60 shadow-gold/30 animate-float"
                : "bg-gradient-to-br from-destructive via-destructive/80 to-destructive/60"
            )}
            style={isWin ? { animationDuration: "3s" } : undefined}
          >
            {isWin ? (
              <Trophy className="h-12 w-12 text-gold-foreground" />
            ) : (
              <XCircle className="h-12 w-12 text-destructive-foreground" />
            )}
          </div>
          {/* Decorative elements for win */}
          {isWin && (
            <>
              <Star className="absolute -top-2 -left-2 h-6 w-6 text-gold animate-pulse" />
              <Star className="absolute -top-1 -right-3 h-4 w-4 text-gold/70 animate-pulse" style={{ animationDelay: "0.3s" }} />
              <Award className="absolute -bottom-1 -right-1 h-7 w-7 text-gold/80" />
            </>
          )}
        </div>

        <CardTitle className="text-4xl font-bold mb-2">
          {isWin ? "Congratulations!" : "Game Over"}
        </CardTitle>
        <p className="text-muted-foreground text-lg">
          {isWin
            ? "You conquered the trivia mountain!"
            : "Better luck next time!"}
        </p>
      </CardHeader>

      <CardContent className="space-y-6 pb-8 px-8">
        {/* Final winnings - prominent display */}
        <div className={cn(
          "rounded-2xl p-8 text-center border",
          isWin 
            ? "bg-gradient-to-br from-gold/15 to-gold/5 border-gold/30" 
            : "bg-muted/20 border-border/50"
        )}>
          <p className="text-sm text-muted-foreground mb-2 font-medium">Final Winnings</p>
          <p
            className={cn(
              "text-5xl font-bold font-mono tracking-tight",
              isWin ? "text-gold" : "text-foreground"
            )}
          >
            {formatCurrency(result.finalWinnings)}
          </p>
          {isWin && result.finalWinnings >= 100000 && (
            <div className="flex items-center justify-center gap-2 mt-3 text-gold/80">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Outstanding performance!</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatItem
            icon={<HelpCircle className="h-5 w-5" />}
            label="Questions Answered"
            value={result.questionsAnswered.toString()}
            color="primary"
          />
          <StatItem
            icon={<Tags className="h-5 w-5" />}
            label="Categories"
            value={result.categoriesFaced.length.toString()}
            color="secondary"
          />
        </div>

        {/* Categories */}
        {result.categoriesFaced.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground font-medium">
              Categories Faced
            </p>
            <div className="flex flex-wrap gap-2">
              {result.categoriesFaced.map((cat, i) => (
                <Badge 
                  key={i} 
                  variant="outline" 
                  className="px-3 py-1.5 bg-muted/20"
                >
                  {cat}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Lifelines */}
        {result.lifelinesUsed.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground font-medium">
              Lifelines Used
            </p>
            <div className="flex flex-wrap gap-2">
              {result.lifelinesUsed.map((lifeline) => (
                <Badge
                  key={lifeline}
                  variant="secondary"
                  className="flex items-center gap-2 px-3 py-1.5"
                >
                  {lifelineLabels[lifeline].icon}
                  {lifelineLabels[lifeline].label}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button 
            onClick={onPlayAgain} 
            variant={isWin ? "gold" : "default"} 
            size="lg" 
            className="flex-1 group"
          >
            <RotateCcw className="h-4 w-4 transition-transform group-hover:-rotate-180 duration-500" />
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
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "primary" | "secondary";
}) {
  return (
    <div className={cn(
      "rounded-xl p-4 flex items-center gap-4 border",
      color === "primary" && "bg-primary/5 border-primary/20",
      color === "secondary" && "bg-secondary/5 border-secondary/20"
    )}>
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center",
        color === "primary" && "bg-primary/10 text-primary",
        color === "secondary" && "bg-secondary/10 text-secondary"
      )}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-bold text-xl">{value}</p>
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
        "border-2 animate-slide-up overflow-hidden",
        isCorrect ? "border-success/40 glow-success" : "border-destructive/40",
        className
      )}
    >
      {/* Top accent */}
      <div className={cn(
        "h-1 w-full",
        isCorrect 
          ? "bg-gradient-to-r from-success/50 via-success to-success/50" 
          : "bg-gradient-to-r from-destructive/50 via-destructive to-destructive/50"
      )} />

      <CardHeader className="pb-3 pt-5">
        <CardTitle className="text-lg flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            isCorrect ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          )}>
            <Sparkles className="h-5 w-5" />
          </div>
          <span className={isCorrect ? "text-success" : "text-destructive"}>
            {isCorrect ? "Correct!" : "Incorrect"}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="pb-6">
        <p className="text-muted-foreground leading-relaxed mb-4">
          {explanation}
        </p>
        {isCorrect && nextPrize && (
          <div className="flex items-center gap-2 text-success bg-success/10 px-4 py-2.5 rounded-xl border border-success/20">
            <TrendingUp className="h-5 w-5" />
            <span className="font-semibold">
              You advance to {formatCurrency(nextPrize)}!
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
