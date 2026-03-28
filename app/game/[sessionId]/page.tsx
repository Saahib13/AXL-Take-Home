import { GameClient } from "@/components/game/GameClient";

interface GamePageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function GamePage({ params }: GamePageProps) {
  const { sessionId } = await params;

  return <GameClient sessionId={sessionId} />;
}

export function generateMetadata() {
  return {
    title: "Playing | AXL Trivia",
    description: "Test your knowledge and climb the prize ladder!",
  };
}
