"use client";

import { useState, useCallback } from "react";
import { GameHeader } from "./GameHeader";
import { PrizeLadder, PrizeLadderCompact } from "./PrizeLadder";
import { QuestionCard } from "./QuestionCard";
import { AnswerGrid } from "./AnswerGrid";
import { LifelineBar, LifelineBarCompact } from "./LifelineBar";
import { AIHostPanel } from "./AIHostPanel";
import { LoadingOverlay } from "./LoadingOverlay";
import { ResultSummaryCard, ExplanationCard } from "./ResultSummaryCard";
import {
  MOCK_QUESTIONS,
  MOCK_CORRECT_ANSWERS,
  MOCK_EXPLANATIONS,
  MOCK_HOST_HINTS,
  createInitialGameState,
} from "@/lib/mock-data";
import { PRIZE_LADDER } from "@/types/game";
import type { GameState, GameResult, LifelineType } from "@/types/game";

interface GameClientProps {
  sessionId: string;
}

export function GameClient({ sessionId }: GameClientProps) {
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState(sessionId)
  );
  const [disabledAnswers, setDisabledAnswers] = useState<string[]>([]);
  const [isLocking, setIsLocking] = useState(false);

  const handleSelectAnswer = useCallback((answerId: string) => {
    setGameState((prev) => ({
      ...prev,
      selectedAnswerId: answerId,
    }));
  }, []);

  const handleLockIn = useCallback(async () => {
    if (!gameState.currentQuestion || !gameState.selectedAnswerId) return;

    setIsLocking(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const correctId = MOCK_CORRECT_ANSWERS[gameState.currentQuestion.id];
    const explanation = MOCK_EXPLANATIONS[gameState.currentQuestion.id];
    const isCorrect = gameState.selectedAnswerId === correctId;

    setGameState((prev) => ({
      ...prev,
      status: "revealing",
      correctAnswerId: correctId,
      explanation,
      questionsAnswered: prev.questionsAnswered + 1,
    }));

    setIsLocking(false);

    // After reveal, wait then either advance or end game
    setTimeout(() => {
      if (isCorrect) {
        const nextIndex = gameState.currentQuestionIndex + 1;
        if (nextIndex >= MOCK_QUESTIONS.length) {
          // Won the game
          setGameState((prev) => ({
            ...prev,
            status: "won",
            totalWinnings: PRIZE_LADDER[prev.currentQuestionIndex],
          }));
        } else {
          // Advance to next question
          setGameState((prev) => ({
            ...prev,
            status: "loading",
          }));

          setTimeout(() => {
            const nextQuestion = MOCK_QUESTIONS[nextIndex];
            setGameState((prev) => ({
              ...prev,
              status: "playing",
              currentQuestion: nextQuestion,
              currentQuestionIndex: nextIndex,
              selectedAnswerId: null,
              correctAnswerId: null,
              explanation: undefined,
              hostHint: undefined,
              totalWinnings: PRIZE_LADDER[prev.currentQuestionIndex],
              categoriesFaced: prev.categoriesFaced.includes(nextQuestion.category)
                ? prev.categoriesFaced
                : [...prev.categoriesFaced, nextQuestion.category],
            }));
            setDisabledAnswers([]);
          }, 2000);
        }
      } else {
        // Lost the game
        setGameState((prev) => ({
          ...prev,
          status: "lost",
          totalWinnings: prev.currentQuestionIndex > 0 
            ? PRIZE_LADDER[prev.currentQuestionIndex - 1] 
            : 0,
        }));
      }
    }, 3000);
  }, [gameState.currentQuestion, gameState.selectedAnswerId, gameState.currentQuestionIndex]);

  const handleUseLifeline = useCallback(
    (lifeline: LifelineType) => {
      if (!gameState.currentQuestion || !gameState.lifelines[lifeline]) return;

      setGameState((prev) => ({
        ...prev,
        lifelines: {
          ...prev.lifelines,
          [lifeline]: false,
        },
      }));

      if (lifeline === "fiftyFifty") {
        const correctId = MOCK_CORRECT_ANSWERS[gameState.currentQuestion.id];
        const wrongOptions = gameState.currentQuestion.options
          .filter((opt) => opt.id !== correctId)
          .slice(0, 2);
        setDisabledAnswers(wrongOptions.map((opt) => opt.id));
      } else if (lifeline === "askTheHost") {
        const hint = MOCK_HOST_HINTS[gameState.currentQuestion.id];
        setGameState((prev) => ({
          ...prev,
          hostHint: hint,
        }));
      } else if (lifeline === "skip") {
        const nextIndex = gameState.currentQuestionIndex + 1;
        if (nextIndex < MOCK_QUESTIONS.length) {
          setGameState((prev) => ({
            ...prev,
            status: "loading",
          }));

          setTimeout(() => {
            const nextQuestion = MOCK_QUESTIONS[nextIndex];
            setGameState((prev) => ({
              ...prev,
              status: "playing",
              currentQuestion: nextQuestion,
              currentQuestionIndex: nextIndex,
              selectedAnswerId: null,
              correctAnswerId: null,
              explanation: undefined,
              hostHint: undefined,
              categoriesFaced: prev.categoriesFaced.includes(nextQuestion.category)
                ? prev.categoriesFaced
                : [...prev.categoriesFaced, nextQuestion.category],
            }));
            setDisabledAnswers([]);
          }, 1500);
        }
      }
    },
    [gameState.currentQuestion, gameState.lifelines, gameState.currentQuestionIndex]
  );

  const handlePlayAgain = useCallback(() => {
    setGameState(createInitialGameState(sessionId));
    setDisabledAnswers([]);
  }, [sessionId]);

  const handleReturnHome = useCallback(() => {
    window.location.href = "/";
  }, []);

  // Show results screen
  if (gameState.status === "won" || gameState.status === "lost") {
    const usedLifelines: LifelineType[] = [];
    if (!gameState.lifelines.fiftyFifty) usedLifelines.push("fiftyFifty");
    if (!gameState.lifelines.askTheHost) usedLifelines.push("askTheHost");
    if (!gameState.lifelines.skip) usedLifelines.push("skip");

    const result: GameResult = {
      status: gameState.status,
      finalWinnings: gameState.totalWinnings,
      questionsAnswered: gameState.questionsAnswered,
      categoriesFaced: gameState.categoriesFaced,
      lifelinesUsed: usedLifelines,
    };

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <ResultSummaryCard
          result={result}
          onPlayAgain={handlePlayAgain}
          onReturnHome={handleReturnHome}
        />
      </div>
    );
  }

  if (!gameState.currentQuestion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingOverlay isVisible={true} />
      </div>
    );
  }

  const isRevealing = gameState.status === "revealing";

  return (
    <div className="min-h-screen bg-background">
      <LoadingOverlay
        isVisible={gameState.status === "loading"}
        message="Generating your next question..."
        submessage="Retrieving context and composing answer choices..."
      />

      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        <GameHeader
          questionNumber={gameState.currentQuestion.questionNumber}
          totalQuestions={MOCK_QUESTIONS.length}
          category={gameState.currentQuestion.category}
          difficulty={gameState.currentQuestion.difficulty}
          currentWinnings={gameState.totalWinnings}
        />

        {/* Mobile compact views */}
        <div className="lg:hidden mt-4 space-y-4">
          <PrizeLadderCompact currentStep={gameState.currentQuestionIndex} />
          <LifelineBarCompact
            lifelines={gameState.lifelines}
            onUse={handleUseLifeline}
            disabled={isRevealing || gameState.status === "loading"}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[260px_1fr_280px] gap-6">
          {/* Left sidebar - Prize Ladder (desktop only) */}
          <aside className="hidden lg:block">
            <PrizeLadder
              currentStep={gameState.currentQuestionIndex}
              className="sticky top-6"
            />
          </aside>

          {/* Main content */}
          <main className="space-y-6">
            <QuestionCard question={gameState.currentQuestion} />
            
            <AnswerGrid
              options={gameState.currentQuestion.options}
              selectedId={gameState.selectedAnswerId}
              correctId={gameState.correctAnswerId}
              isRevealing={isRevealing}
              disabledIds={disabledAnswers}
              onSelect={handleSelectAnswer}
              onLockIn={handleLockIn}
              isLocking={isLocking}
            />

            {isRevealing && gameState.explanation && (
              <ExplanationCard
                explanation={gameState.explanation}
                isCorrect={gameState.selectedAnswerId === gameState.correctAnswerId}
                nextPrize={
                  gameState.selectedAnswerId === gameState.correctAnswerId
                    ? PRIZE_LADDER[gameState.currentQuestionIndex + 1]
                    : undefined
                }
              />
            )}
          </main>

          {/* Right sidebar (desktop only) */}
          <aside className="hidden lg:flex flex-col gap-6">
            <LifelineBar
              lifelines={gameState.lifelines}
              onUse={handleUseLifeline}
              disabled={isRevealing || gameState.status === "loading"}
            />
            <AIHostPanel
              hint={gameState.hostHint}
              streak={gameState.questionsAnswered}
              difficulty={gameState.currentQuestion.difficulty}
              lifelines={gameState.lifelines}
            />
          </aside>
        </div>

        {/* Mobile AI Host Panel */}
        <div className="lg:hidden mt-6">
          <AIHostPanel
            hint={gameState.hostHint}
            streak={gameState.questionsAnswered}
            difficulty={gameState.currentQuestion.difficulty}
            lifelines={gameState.lifelines}
          />
        </div>
      </div>
    </div>
  );
}
