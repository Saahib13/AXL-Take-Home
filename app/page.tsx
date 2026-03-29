"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Play,
  ChevronDown,
  Database,
  Zap,
  RefreshCw,
  Code2,
  Trophy,
  Divide,
  MessageCircle,
  SkipForward,
  ArrowRight,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { PRIZE_LADDER } from "@/types/game";

export default function LandingPage() {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  const handleStartGame = useCallback(async () => {
    setIsStarting(true);
    const sessionId = `session_${Date.now()}`;
    await new Promise((resolve) => setTimeout(resolve, 500));
    router.push(`/game/${sessionId}`);
  }, [router]);

  const scrollToHowItWorks = useCallback(() => {
    document.getElementById("how-it-works")?.scrollIntoView({
      behavior: "smooth",
    });
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center">
        {/* Background layers */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08)_0%,transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--secondary)/0.06)_0%,transparent_50%)]" />
          <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/6 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />

        <div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-32 w-full">
          <div className="grid lg:grid-cols-2 gap-16 xl:gap-24 items-center">
            {/* Left: Hero Text */}
            <div className="space-y-10">
              <div className="inline-flex items-center gap-2.5 bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
                <Sparkles className="h-4 w-4" />
                <span>AI-Powered Trivia</span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              </div>

              <div className="space-y-6">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-balance leading-[1.1]">
                  Who Wants to Be a{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-[gradient_3s_linear_infinite]">
                    Millionaire?
                  </span>
                </h1>

                <p className="text-lg lg:text-xl text-muted-foreground max-w-xl text-pretty leading-relaxed">
                  Test your knowledge on AI, startups, tech, and current events.
                  AI-generated questions pull from live data sources to challenge
                  you with fresh, relevant trivia every time.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleStartGame}
                  disabled={isStarting}
                  size="xl"
                  className="text-lg group"
                >
                  {isStarting ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 transition-transform group-hover:scale-110" />
                      Start Game
                      <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
                <Button
                  onClick={scrollToHowItWorks}
                  variant="outline"
                  size="xl"
                  className="text-lg group"
                >
                  How it Works
                  <ChevronDown className="h-5 w-5 transition-transform group-hover:translate-y-0.5" />
                </Button>
              </div>

              {/* Trust badges */}
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-muted to-muted/50 border-2 border-background flex items-center justify-center text-xs font-medium">
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <span>1,200+ players today</span>
                </div>
              </div>
            </div>

            {/* Right: Hero Preview */}
            <div className="relative lg:pl-8">
              <HeroPreview />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground/50 animate-bounce">
          <ChevronDown className="h-5 w-5" />
        </div>
      </section>

      {/* Features Section */}
      <section id="how-it-works" className="relative py-32 border-t border-border/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--muted)/0.3)_0%,transparent_70%)]" />
        
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-20 space-y-4">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-4xl sm:text-5xl font-bold text-balance">
              Powered by AI, Driven by Data
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg text-pretty">
              Every question is uniquely generated using cutting-edge AI and
              real-time data sources.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            <FeatureCard
              icon={<Sparkles className="h-7 w-7" />}
              title="AI-Generated Questions"
              description="Questions are crafted by AI models trained on current events, tech news, and startup culture. Never play the same game twice."
              gradient="from-primary/20 to-primary/5"
            />
            <FeatureCard
              icon={<Database className="h-7 w-7" />}
              title="Data-Backed Gameplay"
              description="Every answer is verified against multiple data sources to ensure accuracy and relevance."
              gradient="from-secondary/20 to-secondary/5"
            />
            <FeatureCard
              icon={<Zap className="h-7 w-7" />}
              title="Dynamic Daily Content"
              description="New questions are generated daily based on trending topics and breaking news in the tech world."
              gradient="from-gold/20 to-gold/5"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10 bg-card/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <span className="font-semibold">AXL Trivia</span>
                <span className="text-muted-foreground text-sm ml-2">
                  Built with Next.js, Tailwind, shadcn/ui
                </span>
              </div>
            </div>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
            >
              <Code2 className="h-5 w-5" />
              <span className="text-sm group-hover:underline">View on GitHub</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <Card className="group relative bg-card/50 backdrop-blur-sm border-border/50 hover:border-border transition-all duration-300 overflow-hidden">
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", gradient)} />
      <CardContent className="relative pt-8 pb-8 px-6 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-muted to-muted/50 border border-border/50 flex items-center justify-center text-primary group-hover:scale-105 transition-transform duration-300">
          {icon}
        </div>
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-muted-foreground text-pretty leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

function HeroPreview() {
  return (
    <div className="relative">
      {/* Outer glow */}
      <div className="absolute -inset-8 bg-gradient-to-r from-primary/15 via-secondary/10 to-primary/15 rounded-[2rem] blur-3xl opacity-60" />
      
      {/* Main card */}
      <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-2xl inner-glow animate-float" style={{ animationDuration: "6s" }}>
        {/* Question Card */}
        <div className="relative bg-gradient-to-br from-card to-muted/30 border border-primary/30 rounded-xl p-5 mb-5 glow-primary">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className="text-xs font-mono bg-background/50">
              Q1
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Tech Startups
            </Badge>
            <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              <span>AI-generated</span>
            </div>
          </div>
          <p className="text-base font-medium leading-relaxed">
            Which company developed the AI chatbot ChatGPT?
          </p>
        </div>

        {/* Answer Options */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {["Google", "OpenAI", "Microsoft", "Meta"].map((answer, i) => (
            <div
              key={answer}
              className={cn(
                "px-4 py-3 rounded-xl border-2 text-sm font-medium flex items-center gap-3 transition-all duration-200",
                i === 1
                  ? "border-primary bg-primary/15 text-primary glow-primary"
                  : "border-border bg-muted/20 text-muted-foreground hover:border-border/80"
              )}
            >
              <span className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border-2 transition-colors",
                i === 1
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-muted/50"
              )}>
                {String.fromCharCode(65 + i)}
              </span>
              {answer}
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          {/* Prize Ladder Preview */}
          <div className="flex-1 bg-muted/20 rounded-xl p-4 border border-border/50">
            <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wider">
              Prize Ladder
            </p>
            <div className="space-y-1.5">
              {[...PRIZE_LADDER].reverse().slice(0, 4).map((prize, i) => (
                <div
                  key={prize}
                  className={cn(
                    "text-xs font-mono px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all",
                    i === 3
                      ? "bg-primary/20 text-gold font-bold border border-primary/30"
                      : "text-muted-foreground/50"
                  )}
                >
                  {i === 3 && <Trophy className="h-3 w-3 text-gold" />}
                  {formatCurrency(prize)}
                </div>
              ))}
              <div className="text-xs text-muted-foreground/30 px-3 font-mono">...</div>
            </div>
          </div>

          {/* Lifelines Preview */}
          <div className="bg-muted/20 rounded-xl p-4 border border-border/50">
            <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wider">
              Lifelines
            </p>
            <div className="space-y-2">
              {[
                { icon: Divide, label: "50:50" },
                { icon: MessageCircle, label: "Ask Host" },
                { icon: SkipForward, label: "Skip" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2.5 text-xs text-primary">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
