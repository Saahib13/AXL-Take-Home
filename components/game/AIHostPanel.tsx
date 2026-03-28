"use client";

import { cn } from "@/lib/utils";
import { Bot, Zap, TrendingUp, Database } from "lucide-react";
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
        "bg-card border border-border rounded-2xl p-4 shadow-lg",
        className
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <Bot className="h-6 w-6 text-foreground" />
        </div>
        <div>
          <h2 className="font-semibold">AI Host</h2>
          <p className="text-xs text-muted-foreground">
            Your trivia companion
          </p>
        </div>
      </div>

      <div
        className={cn(
          "rounded-xl p-4 mb-4 min-h-[80px] transition-all duration-300",
          hint
            ? "bg-primary/10 border border-primary/30"
            : "bg-muted/30 border border-border"
        )}
      >
        {hint ? (
          <p className="text-sm leading-relaxed">{hint}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Use &quot;Ask the Host&quot; lifeline for a hint from the AI.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatCard
          icon={<Zap className="h-4 w-4 text-gold" />}
          label="Streak"
          value={streak.toString()}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4 text-primary" />}
          label="Difficulty"
          value={difficulty}
        />
        <StatCard
          icon={<Database className="h-4 w-4 text-secondary" />}
          label="Sources"
          value={sourceCount.toString()}
        />
        <StatCard
          icon={<Bot className="h-4 w-4 text-muted-foreground" />}
          label="Lifelines Used"
          value={`${usedLifelines}/3`}
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-muted/30 rounded-lg p-2.5 flex items-center gap-2">
      {icon}
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-semibold text-sm">{value}</div>
      </div>
    </div>
  );
}
