import type {
  AnswerApiResponse,
  AskHostApiResponse,
  FiftyFiftyApiResponse,
  GameSessionApiResponse,
  NextQuestionApiResponse,
  SkipApiResponse,
  StartGameApiResponse,
} from "@/types/game";

export class GameApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "GameApiError";
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      throw new GameApiError("Invalid JSON from server", res.status);
    }
  }
  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : res.statusText;
    throw new GameApiError(msg, res.status);
  }
  return data as T;
}

export async function postStartGame(): Promise<StartGameApiResponse> {
  const res = await fetch("/api/game/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  return parseResponse<StartGameApiResponse>(res);
}

export async function getGameSession(
  sessionId: string
): Promise<GameSessionApiResponse> {
  const res = await fetch(`/api/game/${sessionId}`, { method: "GET" });
  return parseResponse<GameSessionApiResponse>(res);
}

export async function postAnswer(
  sessionId: string,
  selectedIndex: number
): Promise<AnswerApiResponse> {
  const res = await fetch(`/api/game/${sessionId}/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ selectedIndex }),
  });
  return parseResponse<AnswerApiResponse>(res);
}

export async function postNextQuestion(
  sessionId: string
): Promise<NextQuestionApiResponse> {
  const res = await fetch(`/api/game/${sessionId}/next`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  return parseResponse<NextQuestionApiResponse>(res);
}

export async function postFiftyFifty(
  sessionId: string
): Promise<FiftyFiftyApiResponse> {
  const res = await fetch(`/api/game/${sessionId}/lifeline/fifty-fifty`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  return parseResponse<FiftyFiftyApiResponse>(res);
}

export async function postAskHost(sessionId: string): Promise<AskHostApiResponse> {
  const res = await fetch(`/api/game/${sessionId}/lifeline/ask-host`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  return parseResponse<AskHostApiResponse>(res);
}

export async function postSkip(sessionId: string): Promise<SkipApiResponse> {
  const res = await fetch(`/api/game/${sessionId}/lifeline/skip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  return parseResponse<SkipApiResponse>(res);
}
