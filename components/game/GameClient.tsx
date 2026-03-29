"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GameHeader } from "./GameHeader";
import { PrizeLadder, PrizeLadderCompact } from "./PrizeLadder";
import { QuestionCard } from "./QuestionCard";
import { AnswerGrid } from "./AnswerGrid";
import { LifelineBar, LifelineBarCompact } from "./LifelineBar";
import { AIHostPanel } from "./AIHostPanel";
import { LoadingOverlay } from "./LoadingOverlay";
import { ResultSummaryCard, ExplanationCard } from "./ResultSummaryCard";
import {
  getGameSession,
  postAnswer,
  postNextQuestion,
  postFiftyFifty,
  postAskHost,
  postSkip,
  postStartGame,
  GameApiError,
} from "@/lib/api/game";
import {
  apiQuestionToUi,
  apiLifelinesToUi,
  removedIndexesToOptionIds,
} from "@/lib/game/uiMappers";
import { PRIZE_LADDER, TOTAL_QUESTIONS } from "@/types/game";
import type {
  GameSessionApiResponse,
  ApiPublicQuestion,
  GameResult,
  LifelineType,
  Lifelines,
  PublicQuestion,
} from "@/types/game";

interface GameClientProps {
  sessionId: string;
}

function mergeSessionFromAnswer(
  prev: GameSessionApiResponse,
  res: {
    status: string;
    currentWinnings: number;
    correctCount: number;
  }
): GameSessionApiResponse {
  return {
    ...prev,
    status: res.status,
    currentWinnings: res.currentWinnings,
    correctCount: res.correctCount,
    question: null,
  };
}

export function GameClient({ sessionId }: GameClientProps) {
  const router = useRouter();
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [session, setSession] = useState<GameSessionApiResponse | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<PublicQuestion | null>(
    null
  );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [disabledIndexes, setDisabledIndexes] = useState<string[]>([]);
  const [hostHint, setHostHint] = useState<string | undefined>(undefined);
  const [lifelines, setLifelines] = useState<Lifelines>({
    fiftyFifty: false,
    askTheHost: false,
    skip: false,
  });
  const [categoriesFaced, setCategoriesFaced] = useState<string[]>([]);

  const [bootLoading, setBootLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLocking, setIsLocking] = useState(false);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [isRevealing, setIsRevealing] = useState(false);
  const [correctAnswerId, setCorrectAnswerId] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);
  const [endResult, setEndResult] = useState<"won" | "lost" | null>(null);

  const clearRevealTimer = useCallback(() => {
    if (revealTimerRef.current !== null) {
      clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
  }, []);

  const applyApiQuestion = useCallback((q: ApiPublicQuestion) => {
    setCurrentQuestion(apiQuestionToUi(q));
    setDisabledIndexes(removedIndexesToOptionIds(q.removedOptionIndexes));
    setHostHint(q.hostHint ?? undefined);
    setCategoriesFaced((prev) =>
      prev.includes(q.category) ? prev : [...prev, q.category]
    );
  }, []);

  const ingestSession = useCallback(
    (data: GameSessionApiResponse) => {
      setSession(data);
      setLifelines(apiLifelinesToUi(data.lifelines));
      if (data.question) {
        applyApiQuestion(data.question);
      } else {
        setCurrentQuestion(null);
        setDisabledIndexes([]);
        setHostHint(undefined);
      }
      setSelectedIndex(null);
      setCorrectAnswerId(null);
      setExplanation(null);
      setIsRevealing(false);
      setLastAnswerCorrect(false);
      clearRevealTimer();
    },
    [applyApiQuestion, clearRevealTimer]
  );

  const loadSession = useCallback(async () => {
    setBootLoading(true);
    setLoadError(null);
    try {
      const data = await getGameSession(sessionId);
      ingestSession(data);
      if (data.status === "won" || data.status === "lost") {
        setEndResult(data.status as "won" | "lost");
      } else {
        setEndResult(null);
      }
    } catch (e) {
      const msg =
        e instanceof GameApiError ? e.message : "Failed to load game session.";
      setLoadError(msg);
      setSession(null);
      setCurrentQuestion(null);
    } finally {
      setBootLoading(false);
    }
  }, [sessionId, ingestSession]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => () => clearRevealTimer(), [clearRevealTimer]);

  const handleSelectAnswer = useCallback((answerId: string) => {
    const n = Number.parseInt(answerId, 10);
    if (Number.isNaN(n) || n < 0 || n > 3) return;
    setSelectedIndex(n);
  }, []);

  const handleLockIn = useCallback(async () => {
    if (selectedIndex === null || !currentQuestion) return;
    setIsLocking(true);
    setActionError(null);
    clearRevealTimer();
    try {
      const res = await postAnswer(sessionId, selectedIndex);
      setCorrectAnswerId(String(res.correctIndex));
      setExplanation(res.explanation);
      setIsRevealing(true);
      const correct = res.outcome === "correct";
      setLastAnswerCorrect(correct);
      setSession((prev) =>
        prev ? mergeSessionFromAnswer(prev, res) : prev
      );

      if (!correct || res.didLoseGame) {
        revealTimerRef.current = setTimeout(() => {
          setEndResult("lost");
          setIsRevealing(false);
        }, 3500);
      } else if (res.didWinGame) {
        revealTimerRef.current = setTimeout(() => {
          setEndResult("won");
          setIsRevealing(false);
        }, 3500);
      }
    } catch (e) {
      const msg =
        e instanceof GameApiError ? e.message : "Could not submit answer.";
      setActionError(msg);
    } finally {
      setIsLocking(false);
    }
  }, [
    selectedIndex,
    currentQuestion,
    sessionId,
    clearRevealTimer,
  ]);

  const handleNextQuestion = useCallback(async () => {
    setIsLoadingNext(true);
    setActionError(null);
    try {
      const res = await postNextQuestion(sessionId);
      setSession((prev) =>
        prev
          ? {
              ...prev,
              question: res.question,
              prizeLadder: res.prizeLadder,
              lifelines: res.lifelines,
              currentQuestionNumber: res.question.questionNumber,
            }
          : prev
      );
      setLifelines(apiLifelinesToUi(res.lifelines));
      applyApiQuestion(res.question);
      setSelectedIndex(null);
      setCorrectAnswerId(null);
      setExplanation(null);
      setIsRevealing(false);
      setLastAnswerCorrect(false);
      clearRevealTimer();
    } catch (e) {
      const msg =
        e instanceof GameApiError ? e.message : "Could not load next question.";
      setActionError(msg);
    } finally {
      setIsLoadingNext(false);
    }
  }, [sessionId, applyApiQuestion, clearRevealTimer]);

  const handleUseLifeline = useCallback(
    async (lifeline: LifelineType) => {
      if (!currentQuestion || !lifelines[lifeline]) return;
      setActionError(null);
      try {
        if (lifeline === "fiftyFifty") {
          const res = await postFiftyFifty(sessionId);
          setDisabledIndexes((prev) => [
            ...new Set([
              ...prev,
              String(res.removedIndexes[0]),
              String(res.removedIndexes[1]),
            ]),
          ]);
          setLifelines((l) => ({ ...l, fiftyFifty: false }));
          setSession((prev) =>
            prev
              ? {
                  ...prev,
                  lifelines: {
                    ...prev.lifelines,
                    fiftyFiftyAvailable: false,
                  },
                }
              : prev
          );
        } else if (lifeline === "askTheHost") {
          const res = await postAskHost(sessionId);
          setHostHint(res.hostHint);
          setLifelines((l) => ({ ...l, askTheHost: false }));
          setSession((prev) =>
            prev
              ? {
                  ...prev,
                  lifelines: {
                    ...prev.lifelines,
                    askHostAvailable: false,
                  },
                }
              : prev
          );
        } else if (lifeline === "skip") {
          const res = await postSkip(sessionId);
          setSession((prev) =>
            prev
              ? {
                  ...prev,
                  question: res.question,
                  lifelines: res.lifelines,
                  currentQuestionNumber: res.question.questionNumber,
                }
              : prev
          );
          setLifelines(apiLifelinesToUi(res.lifelines));
          applyApiQuestion(res.question);
          setSelectedIndex(null);
          setCorrectAnswerId(null);
          setExplanation(null);
          setIsRevealing(false);
          clearRevealTimer();
        }
      } catch (e) {
        const msg =
          e instanceof GameApiError ? e.message : "Lifeline request failed.";
        setActionError(msg);
      }
    },
    [
      currentQuestion,
      lifelines,
      sessionId,
      applyApiQuestion,
      clearRevealTimer,
    ]
  );

  const handlePlayAgain = useCallback(async () => {
    setActionError(null);
    try {
      const { sessionId: newId } = await postStartGame();
      router.replace(`/game/${newId}`);
    } catch (e) {
      const msg =
        e instanceof GameApiError ? e.message : "Could not start a new game.";
      setActionError(msg);
    }
  }, [router]);

  const handleReturnHome = useCallback(() => {
    router.push("/");
  }, [router]);

  const prizeLadderStep = session?.correctCount ?? 0;
  const selectedId =
    selectedIndex !== null ? String(selectedIndex) : null;
  const showContinueOnly =
    session?.status === "active" &&
    !currentQuestion &&
    !isRevealing &&
    !bootLoading &&
    endResult === null;

  const usedLifelines: LifelineType[] = [];
  if (!lifelines.fiftyFifty) usedLifelines.push("fiftyFifty");
  if (!lifelines.askTheHost) usedLifelines.push("askTheHost");
  if (!lifelines.skip) usedLifelines.push("skip");

  if (bootLoading && !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingOverlay isVisible />
      </div>
    );
  }

  if (loadError && !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <p className="text-destructive">{loadError}</p>
          <Button onClick={() => loadSession()}>Try again</Button>
          <Button variant="outline" onClick={handleReturnHome}>
            Home
          </Button>
        </div>
      </div>
    );
  }

  if (endResult !== null && session) {
    const result: GameResult = {
      status: endResult,
      finalWinnings: session.currentWinnings,
      questionsAnswered: session.correctCount,
      categoriesFaced,
      lifelinesUsed: usedLifelines,
    };

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[120px]" />
        </div>
        {actionError && (
          <p className="fixed top-4 left-1/2 -translate-x-1/2 text-sm text-destructive z-50">
            {actionError}
          </p>
        )}
        <ResultSummaryCard
          result={result}
          onPlayAgain={handlePlayAgain}
          onReturnHome={handleReturnHome}
        />
      </div>
    );
  }

  if (showContinueOnly) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]" />
        </div>
        <div className="relative max-w-md w-full rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-8 text-center space-y-6 shadow-xl">
          <h2 className="text-xl font-semibold">Ready for the next question?</h2>
          <p className="text-muted-foreground text-sm">
            Continue when you are set. Your progress is saved on the server.
          </p>
          {actionError && (
            <p className="text-sm text-destructive">{actionError}</p>
          )}
          <Button
            size="lg"
            className="w-full"
            onClick={() => handleNextQuestion()}
            disabled={isLoadingNext}
          >
            {isLoadingNext ? "Loading…" : "Next question"}
          </Button>
        </div>
        <LoadingOverlay
          isVisible={isLoadingNext}
          message="Generating your next question..."
          submessage="Our AI is crafting a unique challenge just for you"
        />
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingOverlay isVisible />
      </div>
    );
  }

  const isRevealingUi = isRevealing;
  const nextPrizeAfterCorrect =
    lastAnswerCorrect &&
    currentQuestion.questionNumber > 0 &&
    currentQuestion.questionNumber < PRIZE_LADDER.length
      ? PRIZE_LADDER[currentQuestion.questionNumber]
      : undefined;

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-secondary/3 rounded-full blur-[120px]" />
      </div>

      <LoadingOverlay
        isVisible={bootLoading || isLoadingNext}
        message="Generating your next question..."
        submessage="Our AI is crafting a unique challenge just for you"
      />

      {actionError && (
        <div className="relative z-10 max-w-7xl mx-auto px-5 pt-4">
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
            {actionError}
          </p>
        </div>
      )}

      <div className="relative max-w-7xl mx-auto p-5 lg:p-8">
        <GameHeader
          questionNumber={currentQuestion.questionNumber}
          totalQuestions={TOTAL_QUESTIONS}
          category={currentQuestion.category}
          difficulty={currentQuestion.difficulty}
          currentWinnings={session?.currentWinnings ?? 0}
        />

        <div className="lg:hidden mt-5 space-y-4">
          <PrizeLadderCompact currentStep={prizeLadderStep} />
          <LifelineBarCompact
            lifelines={lifelines}
            onUse={handleUseLifeline}
            disabled={isRevealingUi || isLoadingNext || isLocking}
          />
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-6 lg:gap-8">
          <aside className="hidden lg:block">
            <PrizeLadder
              currentStep={prizeLadderStep}
              className="sticky top-8"
            />
          </aside>

          <main className="space-y-6">
            <QuestionCard question={currentQuestion} />

            <AnswerGrid
              options={currentQuestion.options}
              selectedId={selectedId}
              correctId={correctAnswerId}
              isRevealing={isRevealingUi}
              disabledIds={disabledIndexes}
              onSelect={handleSelectAnswer}
              onLockIn={handleLockIn}
              isLocking={isLocking}
            />

            {isRevealingUi && explanation && (
              <>
                <ExplanationCard
                  explanation={explanation}
                  isCorrect={lastAnswerCorrect}
                  nextPrize={nextPrizeAfterCorrect}
                />
                {lastAnswerCorrect && session?.status === "active" && (
                  <div className="pt-2">
                    <Button
                      variant="gold"
                      size="xl"
                      className="w-full"
                      onClick={() => handleNextQuestion()}
                      disabled={isLoadingNext}
                    >
                      {isLoadingNext ? "Loading…" : "Next question"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>

          <aside className="hidden lg:flex flex-col gap-6">
            <LifelineBar
              lifelines={lifelines}
              onUse={handleUseLifeline}
              disabled={isRevealingUi || isLoadingNext || isLocking}
            />
            <AIHostPanel
              hint={hostHint}
              streak={session?.correctCount ?? 0}
              difficulty={currentQuestion.difficulty}
              lifelines={lifelines}
            />
          </aside>
        </div>

        <div className="lg:hidden mt-6">
          <AIHostPanel
            hint={hostHint}
            streak={session?.correctCount ?? 0}
            difficulty={currentQuestion.difficulty}
            lifelines={lifelines}
          />
        </div>
      </div>
    </div>
  );
}
