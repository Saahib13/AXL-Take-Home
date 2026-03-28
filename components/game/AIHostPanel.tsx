"use client";

import { cn } from "@/lib/utils";
import { Bot, Zap, TrendingUp, Database, Sparkles, MessageSquare } from "lucide-react";
import type { Lifelines } from "@/types/game";

interface AIHostPanelProps {
  hint?: string;
  streak?: number;
  difficulty?: string;
  sourceCount?: number;
  lifelines: Lifelines;
  className?: string;
}

export function AIHostPanel({
  hint,
  streak = 0,
  difficulty = "Medium",
  sourceCount = 42,
  lifelines,
  className,
}: AIHostPanelProps) {
  const usedLifelines =
    (lifelines.fiftyFifty ? 0 : 1) +
    (lifelines.askTheHost ? 0 : 1) +
    (lifelines.skip ? 0 : 1);

  return (
    <div
      className={cn(
        "bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-5 shadow-xl inner-glow",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-5">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-secondary to-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Bot className="h-7 w-7 text-foreground" />
          </div>
          {/* Online indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-success border-2 border-card flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-success-foreground animate-pulse" />
          </div>
        </div>
        <div>
          <h2 className="font-semibold text-lg">AI Host</h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-primary" />
            Your trivia companion
          </p>
        </div>
      </div>

      {/* Hint area */}
      <div
        className={cn(
          "relative rounded-xl p-5 mb-5 min-h-[100px] transition-all duration-500 overflow-hidden",
          hint
            ? "bg-gradient-to-br from-primary/15 to-secondary/10 border border-primary/30"
            : "bg-muted/20 border border-border/50"
        )}
      >
        {/* Decorative corner */}
        {hint && (
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-primary/20 to-transparent rounded-bl-3xl" />
        )}

        {hint ? (
          <div className="relative animate-slide-up">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">AI Hint</span>
            </div>
            <p className="text-sm leading-relaxed text-foreground">{hint}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-2">
            <MessageSquare className="h-6 w-6 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              Use <span className="text-primary font-medium">&quot;Ask the Host&quot;</span> lifeline for a hint
            </p>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <StatCard
          icon={<Zap className="h-4 w-4" />}
          label="Streak"
          value={streak.toString()}
          color="gold"
          highlight={streak >= 3}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Difficulty"
          value={difficulty}
          color="primary"
        />
        <StatCard
          icon={<Database className="h-4 w-4" />}
          label="Sources"
          value={sourceCount.toString()}
          color="secondary"
        />
        <StatCard
          icon={<Bot className="h-4 w-4" />}
          label="Lifelines"
          value={`${3 - usedLifelines}/3`}
          color="muted"
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "gold" | "primary" | "secondary" | "muted";
  highlight?: boolean;
}) {
  const colorStyles = {
    gold: "text-gold bg-gold/10 border-gold/20",
    primary: "text-primary bg-primary/10 border-primary/20",
    secondary: "text-secondary bg-secondary/10 border-secondary/20",
    muted: "text-muted-foreground bg-muted/30 border-border/50",
  };

  return (
    <div className={cn(
      "rounded-xl p-3 flex items-center gap-3 border transition-all duration-300",
      colorStyles[color],
      highlight && "ring-2 ring-gold/30 scale-[1.02]"
    )}>
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center",
        color === "gold" && "bg-gold/20",
        color === "primary" && "bg-primary/20",
        color === "secondary" && "bg-secondary/20",
        color === "muted" && "bg-muted/50"
      )}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider opacity-70 font-medium">{label}</div>
        <div className="font-bold text-sm truncate">{value}</div>
      </div>
    </div>
  );
}
