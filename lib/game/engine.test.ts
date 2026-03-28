
import { describe, expect, it } from "vitest";
import {
  advanceSessionFromAnswer,
  applyFiftyFifty,
  assertValidQuestionNumber,
  computeAnswerOutcome,
  computeGameStatus,
  getBaseDifficultyForQuestion,
  getGuaranteedWinnings,
  getNextDifficulty,
  getPrizeForQuestion,
  pickNextCategory,
  TOTAL_QUESTIONS,
} from "./engine";

describe("getPrizeForQuestion", () => {
  it("returns 100 for Q1 and 32000 for Q10", () => {
    expect(getPrizeForQuestion(1)).toBe(100);
    expect(getPrizeForQuestion(10)).toBe(32000);
    expect(getPrizeForQuestion(5)).toBe(1000);
  });

  it("throws on 0 and 11", () => {
    expect(() => getPrizeForQuestion(0)).toThrow(/Invalid question number/);
    expect(() => getPrizeForQuestion(11)).toThrow(/Invalid question number/);
  });
});

describe("getGuaranteedWinnings", () => {
  it("is 0 before first milestone", () => {
    expect(getGuaranteedWinnings(0)).toBe(0);
    expect(getGuaranteedWinnings(4)).toBe(0);
  });

  it("is 1000 after completing Q5–Q7 band", () => {
    expect(getGuaranteedWinnings(5)).toBe(1000);
    expect(getGuaranteedWinnings(7)).toBe(1000);
  });

  it("is 8000 after completing Q8+", () => {
    expect(getGuaranteedWinnings(8)).toBe(8000);
    expect(getGuaranteedWinnings(10)).toBe(8000);
  });

  it("throws on invalid counts", () => {
    expect(() => getGuaranteedWinnings(-1)).toThrow();
    expect(() => getGuaranteedWinnings(11)).toThrow();
  });
});

describe("getNextDifficulty", () => {
  it("follows base curve for neutral streak", () => {
    expect(getNextDifficulty(1, 1)).toBe(1);
    expect(getNextDifficulty(1, 4)).toBe(2);
    expect(getNextDifficulty(1, 8)).toBe(3);
  });

  it("bumps on strong streak and clamps", () => {
    expect(getNextDifficulty(3, 1)).toBe(2);
    expect(getNextDifficulty(10, 2)).toBeLessThanOrEqual(3);
  });

  it("softens when struggling mid-game", () => {
    expect(getNextDifficulty(0, 5)).toBe(1);
  });

  it("never leaves 1..3", () => {
    for (let q = 1; q <= TOTAL_QUESTIONS; q++) {
      for (let c = 0; c <= 10; c++) {
        const d = getNextDifficulty(c, q);
        expect(d).toBeGreaterThanOrEqual(1);
        expect(d).toBeLessThanOrEqual(3);
      }
    }
  });
});

describe("getBaseDifficultyForQuestion", () => {
  it("matches bands", () => {
    expect(getBaseDifficultyForQuestion(3)).toBe(1);
    expect(getBaseDifficultyForQuestion(4)).toBe(2);
    expect(getBaseDifficultyForQuestion(8)).toBe(3);
  });
});

describe("pickNextCategory", () => {
  it("returns first default when history empty", () => {
    expect(pickNextCategory([])).toBe("AI");
  });

  it("avoids immediate repeat when another least-used exists", () => {
    expect(pickNextCategory(["AI"])).toBe("Startups");
  });

  it("prefers least-used", () => {
    const hist = ["AI", "AI", "Startups"];
    expect(pickNextCategory(hist)).toBe("Internet Culture");
  });

  it("throws on empty pool", () => {
    expect(() => pickNextCategory([], [])).toThrow(/empty/);
  });

  it("is deterministic for ties", () => {
    const cats = ["Zebra", "Apple", "Mango"];
    expect(pickNextCategory([], cats)).toBe("Zebra");
  });
});

describe("applyFiftyFifty", () => {
  it.each([0, 1, 2, 3] as const)(
    "correctIndex %i keeps correct and one lowest wrong",
    (ci) => {
      const r = applyFiftyFifty(ci);
      expect(r.keepIndexes).toHaveLength(2);
      expect(r.removedIndexes).toHaveLength(2);
      expect(r.keepIndexes).toContain(ci);
      const wrong = [0, 1, 2, 3].filter((i) => i !== ci);
      const expectedWrongKeep = Math.min(...wrong);
      expect(r.keepIndexes).toContain(expectedWrongKeep);
      for (const rm of r.removedIndexes) {
        expect(r.keepIndexes).not.toContain(rm);
      }
    }
  );
});

describe("computeAnswerOutcome", () => {
  it("detects correct and incorrect", () => {
    expect(computeAnswerOutcome(2, 2)).toBe("correct");
    expect(computeAnswerOutcome(0, 2)).toBe("incorrect");
  });

  it("returns skipped", () => {
    expect(computeAnswerOutcome(undefined, 1, true)).toBe("skipped");
  });

  it("requires selected when not skipped", () => {
    expect(() => computeAnswerOutcome(undefined, 0)).toThrow(/selectedIndex/);
  });
});

describe("computeGameStatus", () => {
  it("active on non-final correct", () => {
    const r = computeGameStatus({ isCorrect: true, questionNumber: 3 });
    expect(r.status).toBe("active");
    expect(r.currentWinnings).toBe(300);
    expect(r.nextQuestionNumber).toBe(4);
    expect(r.didWinGame).toBe(false);
  });

  it("won on final correct", () => {
    const r = computeGameStatus({ isCorrect: true, questionNumber: 10 });
    expect(r.status).toBe("won");
    expect(r.didWinGame).toBe(true);
    expect(r.nextQuestionNumber).toBe(null);
  });

  it("lost on incorrect with milestone fallback", () => {
    const r = computeGameStatus({ isCorrect: false, questionNumber: 6 });
    expect(r.status).toBe("lost");
    expect(r.currentWinnings).toBe(1000);
    expect(r.didLoseGame).toBe(true);
  });

  it("lost Q1 falls back to 0", () => {
    const r = computeGameStatus({ isCorrect: false, questionNumber: 1 });
    expect(r.currentWinnings).toBe(0);
  });
});

describe("advanceSessionFromAnswer", () => {
  it("correct increments winnings and count", () => {
    const r = advanceSessionFromAnswer({
      currentQuestionNumber: 3,
      currentWinnings: 200,
      correctCount: 2,
      guaranteedWinnings: 0,
      selectedIndex: 1,
      correctIndex: 1,
    });
    expect(r.outcome).toBe("correct");
    expect(r.correctCount).toBe(3);
    expect(r.currentWinnings).toBe(300);
    expect(r.status).toBe("active");
  });

  it("incorrect derives loss payout from engine rules (not stale session value)", () => {
    const r = advanceSessionFromAnswer({
      currentQuestionNumber: 6,
      currentWinnings: 2000,
      correctCount: 5,
      guaranteedWinnings: 1000,
      selectedIndex: 0,
      correctIndex: 2,
    });
    expect(r.outcome).toBe("incorrect");
    expect(r.status).toBe("lost");
    expect(r.currentWinnings).toBe(1000);
    expect(r.guaranteedWinnings).toBe(1000);
    expect(r.correctCount).toBe(5);
  });

  it.each(
    Array.from({ length: 10 }, (_, i) => i + 1)
  )("wrong answer on Q%i pays getGuaranteedWinnings(q - 1)", (q) => {
    const expected = getGuaranteedWinnings(q - 1);
    const status = computeGameStatus({ isCorrect: false, questionNumber: q });
    const r = advanceSessionFromAnswer({
      currentQuestionNumber: q,
      currentWinnings: 999999,
      correctCount: q - 1,
      guaranteedWinnings: 0,
      selectedIndex: 0,
      correctIndex: 1,
    });
    expect(r.currentWinnings).toBe(expected);
    expect(r.guaranteedWinnings).toBe(expected);
    expect(status.currentWinnings).toBe(expected);
    expect(status.guaranteedWinnings).toBe(expected);
  });

  it("milestone: wrong on Q5 pays 0 (first safe not locked until Q5 correct)", () => {
    const r = advanceSessionFromAnswer({
      currentQuestionNumber: 5,
      currentWinnings: 500,
      correctCount: 4,
      guaranteedWinnings: 0,
      selectedIndex: 0,
      correctIndex: 2,
    });
    expect(r.currentWinnings).toBe(0);
    expect(r.guaranteedWinnings).toBe(0);
  });

  it("milestone: wrong on Q6 pays 1000 (first safe locked)", () => {
    const r = advanceSessionFromAnswer({
      currentQuestionNumber: 6,
      currentWinnings: 2000,
      correctCount: 5,
      guaranteedWinnings: 1000,
      selectedIndex: 0,
      correctIndex: 2,
    });
    expect(r.currentWinnings).toBe(1000);
  });

  it("milestone: wrong on Q8 pays 1000 (second safe not until Q8 correct)", () => {
    const r = advanceSessionFromAnswer({
      currentQuestionNumber: 8,
      currentWinnings: 8000,
      correctCount: 7,
      guaranteedWinnings: 1000,
      selectedIndex: 0,
      correctIndex: 1,
    });
    expect(r.currentWinnings).toBe(1000);
  });

  it("milestone: wrong on Q9 pays 8000 (second safe locked)", () => {
    const r = advanceSessionFromAnswer({
      currentQuestionNumber: 9,
      currentWinnings: 16000,
      correctCount: 8,
      guaranteedWinnings: 8000,
      selectedIndex: 0,
      correctIndex: 1,
    });
    expect(r.currentWinnings).toBe(8000);
  });

  it("regression: mismatched input.guaranteedWinnings does not change incorrect payout", () => {
    const q = 6;
    const derived = getGuaranteedWinnings(q - 1);
    const rLow = advanceSessionFromAnswer({
      currentQuestionNumber: q,
      currentWinnings: 2000,
      correctCount: 5,
      guaranteedWinnings: 0,
      selectedIndex: 0,
      correctIndex: 2,
    });
    const rHigh = advanceSessionFromAnswer({
      currentQuestionNumber: q,
      currentWinnings: 2000,
      correctCount: 5,
      guaranteedWinnings: 999999,
      selectedIndex: 0,
      correctIndex: 2,
    });
    expect(rLow.currentWinnings).toBe(derived);
    expect(rHigh.currentWinnings).toBe(derived);
    expect(rLow.guaranteedWinnings).toBe(derived);
    expect(rHigh.guaranteedWinnings).toBe(derived);
  });

  it("skip does not change winnings or count", () => {
    const r = advanceSessionFromAnswer({
      currentQuestionNumber: 2,
      currentWinnings: 200,
      correctCount: 1,
      guaranteedWinnings: 0,
      correctIndex: 0,
      wasSkipped: true,
    });
    expect(r.outcome).toBe("skipped");
    expect(r.currentWinnings).toBe(200);
    expect(r.correctCount).toBe(1);
    expect(r.nextQuestionNumber).toBe(3);
  });

  it("final correct wins", () => {
    const r = advanceSessionFromAnswer({
      currentQuestionNumber: 10,
      currentWinnings: 16000,
      correctCount: 9,
      guaranteedWinnings: 8000,
      selectedIndex: 2,
      correctIndex: 2,
    });
    expect(r.didWinGame).toBe(true);
    expect(r.status).toBe("won");
    expect(r.currentWinnings).toBe(32000);
  });
});

describe("assertValidQuestionNumber", () => {
  it("throws on bad numbers", () => {
    expect(() => assertValidQuestionNumber(0)).toThrow();
    expect(() => assertValidQuestionNumber(1.5)).toThrow();
  });
});
