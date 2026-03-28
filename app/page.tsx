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
  Github,
  Trophy,
  Divide,
  MessageCircle,
  SkipForward,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { PRIZE_LADDER } from "@/types/game";

export default function LandingPage() {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  const handleStartGame = useCallback(async () => {
    setIsStarting(true);
    // Generate a mock session ID
    const sessionId = `session_${Date.now()}`;
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    router.push(`/game/${sessionId}`);
  }, [router]);

  const scrollToHowItWorks = useCallback(() => {
    document.getElementById("how-it-works")?.scrollIntoView({
      behavior: "smooth",
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Hero Text */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                AI-Powered Trivia
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
                Who Wants to Be a{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                  Millionaire?
                </span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-xl text-pretty leading-relaxed">
                Test your knowledge on AI, startups, tech, and current events.
                AI-generated questions pull from live data sources to challenge
                you with fresh, relevant trivia every time.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleStartGame}
                  disabled={isStarting}
                  size="xl"
                  className="text-lg"
                >
                  {isStarting ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5" />
                      Start Game
                    </>
                  )}
                </Button>
                <Button
                  onClick={scrollToHowItWorks}
                  variant="outline"
                  size="xl"
                  className="text-lg"
                >
                  How it Works
                  <ChevronDown className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Right: Hero Preview */}
            <div className="relative">
              <HeroPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="how-it-works" className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-balance">
              Powered by AI, Driven by Data
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-pretty">
              Every question is uniquely generated using cutting-edge AI and
              real-time data sources.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Sparkles className="h-8 w-8" />}
              title="AI-Generated Questions"
              description="Questions are crafted by AI models trained on current events, tech news, and startup culture. Never play the same game twice."
            />
            <FeatureCard
              icon={<Database className="h-8 w-8" />}
              title="Data-Backed Gameplay"
              description="Every answer is verified against multiple data sources to ensure accuracy and relevance."
            />
            <FeatureCard
              icon={<Zap className="h-8 w-8" />}
              title="Dynamic Daily Content"
              description="New questions are generated daily based on trending topics and breaking news in the tech world."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold">AXL Trivia</span>
              <span className="text-sm">|</span>
              <span className="text-sm">
                Built with Next.js, Tailwind, shadcn/ui
              </span>
            </div>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-5 w-5" />
              <span className="text-sm">View on GitHub</span>
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
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="bg-card/50 backdrop-blur border-border hover:border-primary/30 transition-colors">
      <CardContent className="pt-6">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 text-primary">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground text-pretty">{description}</p>
      </CardContent>
    </Card>
  );
}

function HeroPreview() {
  return (
    <div className="relative">
      {/* Glow effect */}
      <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-2xl" />

      <div className="relative bg-card border border-border rounded-2xl p-6 shadow-2xl">
        {/* Mini Question Card */}
        <div className="bg-gradient-to-br from-card to-muted/50 border border-primary/20 rounded-xl p-4 mb-4 glow-primary">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="text-xs">
              Q1
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Tech Startups
            </Badge>
          </div>
          <p className="text-sm font-medium">
            Which company developed the AI chatbot ChatGPT?
          </p>
        </div>

        {/* Mini Answer Options */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {["Google", "OpenAI", "Microsoft", "Meta"].map((answer, i) => (
            <div
              key={answer}
              className={cn(
                "px-3 py-2 rounded-lg border text-xs font-medium flex items-center gap-2 transition-all",
                i === 1
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-border bg-muted/30 text-muted-foreground"
              )}
            >
              <span className="w-5 h-5 rounded flex items-center justify-center bg-muted/50 text-xs">
                {String.fromCharCode(65 + i)}
              </span>
              {answer}
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          {/* Mini Prize Ladder */}
          <div className="flex-1 bg-muted/30 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-2 font-medium">
              Prize Ladder
            </p>
            <div className="space-y-1">
              {[...PRIZE_LADDER].reverse().slice(0, 4).map((prize, i) => (
                <div
                  key={prize}
                  className={cn(
                    "text-xs font-mono px-2 py-1 rounded flex items-center gap-1",
                    i === 3
                      ? "bg-primary/20 text-gold font-semibold"
                      : "text-muted-foreground/60"
                  )}
                >
                  {i === 3 && <Trophy className="h-3 w-3 text-gold" />}
                  {formatCurrency(prize)}
                </div>
              ))}
              <div className="text-xs text-muted-foreground/40 px-2">...</div>
            </div>
          </div>

          {/* Mini Lifelines */}
          <div className="bg-muted/30 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-2 font-medium">
              Lifelines
            </p>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-primary">
                <Divide className="h-3 w-3" />
                <span>50:50</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-primary">
                <MessageCircle className="h-3 w-3" />
                <span>Ask Host</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-primary">
                <SkipForward className="h-3 w-3" />
                <span>Skip</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
