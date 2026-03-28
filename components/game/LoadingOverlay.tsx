"use client";

import { cn } from "@/lib/utils";
import { Sparkles, Loader2, Brain, Database, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  submessage?: string;
}

const loadingSteps = [
  { icon: Database, text: "Connecting to data sources..." },
  { icon: Brain, text: "Analyzing context..." },
  { icon: Wand2, text: "Generating question..." },
  { icon: Sparkles, text: "Finalizing..." },
];

export function LoadingOverlay({
  isVisible,
  message = "Generating your next question...",
  submessage = "Our AI is crafting a unique challenge just for you",
}: LoadingOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % loadingSteps.length);
    }, 800);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/3 right-1/3 w-[300px] h-[300px] bg-secondary/8 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>

      <div className="relative flex flex-col items-center gap-8 p-10 max-w-md text-center">
        {/* Main loader */}
        <div className="relative">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-3xl border-2 border-primary/20 animate-pulse" />
          
          {/* Spinning ring */}
          <div className="absolute -inset-2 rounded-[1.75rem] border-2 border-transparent border-t-primary/50 animate-spin" style={{ animationDuration: "2s" }} />
          
          {/* Main icon container */}
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-primary via-secondary to-primary flex items-center justify-center shadow-2xl shadow-primary/30 animate-pulse-glow">
            <Sparkles className="h-12 w-12 text-foreground" />
          </div>
          
          {/* Status indicator */}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-card border-2 border-background flex items-center justify-center">
            <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
          </div>
        </div>

        {/* Text content */}
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-balance">{message}</h3>
          <p className="text-muted-foreground text-pretty">{submessage}</p>
        </div>

        {/* Step indicators */}
        <div className="flex flex-col gap-2 w-full max-w-xs">
          {loadingSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isComplete = index < currentStep;

            return (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300",
                  isActive && "bg-primary/10 border border-primary/30 scale-[1.02]",
                  isComplete && "opacity-50",
                  !isActive && !isComplete && "opacity-30"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300",
                  isActive && "bg-primary/20 text-primary",
                  isComplete && "bg-success/20 text-success",
                  !isActive && !isComplete && "bg-muted/30 text-muted-foreground"
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className={cn(
                  "text-sm font-medium transition-colors duration-300",
                  isActive && "text-foreground",
                  !isActive && "text-muted-foreground"
                )}>
                  {step.text}
                </span>
                {isActive && (
                  <div className="ml-auto flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-xs">
          <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-shimmer rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / loadingSteps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoadingCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-10 flex flex-col items-center gap-6",
        className
      )}
    >
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-pulse-glow">
          <Sparkles className="h-10 w-10 text-foreground" />
        </div>
        <div className="absolute -bottom-1 -right-1">
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
        </div>
      </div>
      <div className="space-y-2 text-center">
        <h3 className="font-semibold text-lg">Generating question...</h3>
        <p className="text-sm text-muted-foreground">Analyzing data sources</p>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
