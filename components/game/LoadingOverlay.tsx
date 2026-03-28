"use client";

import { cn } from "@/lib/utils";
import { Sparkles, Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  submessage?: string;
}

export function LoadingOverlay({
  isVisible,
  message = "Generating your next question...",
  submessage = "Retrieving context and composing answer choices...",
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 p-8 max-w-md text-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-pulse-glow">
            <Sparkles className="h-10 w-10 text-foreground" />
          </div>
          <div className="absolute -bottom-2 -right-2">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2 text-balance">{message}</h3>
          <p className="text-sm text-muted-foreground text-pretty">
            {submessage}
          </p>
        </div>
        <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-secondary animate-shimmer w-full" />
        </div>
      </div>
    </div>
  );
}

export function LoadingCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-2xl p-8 flex flex-col items-center gap-4",
        className
      )}
    >
      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-pulse">
        <Sparkles className="h-8 w-8 text-foreground" />
      </div>
      <div className="space-y-2 text-center">
        <h3 className="font-semibold">Generating question...</h3>
        <p className="text-sm text-muted-foreground">
          Analyzing data sources
        </p>
      </div>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
