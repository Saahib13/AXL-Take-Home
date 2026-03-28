import type { PublicQuestion, GameState, Lifelines } from "@/types/game";

export const MOCK_QUESTIONS: PublicQuestion[] = [
  {
    id: "q1",
    questionNumber: 1,
    category: "Tech Startups",
    difficulty: "easy",
    questionText:
      "Which company developed the AI chatbot ChatGPT that launched in November 2022?",
    options: [
      { id: "a1", label: "A", text: "Google" },
      { id: "a2", label: "B", text: "OpenAI" },
      { id: "a3", label: "C", text: "Microsoft" },
      { id: "a4", label: "D", text: "Meta" },
    ],
    source: "Live AI dataset",
  },
  {
    id: "q2",
    questionNumber: 2,
    category: "Internet Culture",
    difficulty: "easy",
    questionText:
      "What does 'FOMO' stand for in internet slang?",
    options: [
      { id: "b1", label: "A", text: "For Our Mutual Organization" },
      { id: "b2", label: "B", text: "Fear Of Missing Out" },
      { id: "b3", label: "C", text: "Friends Only, Members Only" },
      { id: "b4", label: "D", text: "Finally Over, Moving On" },
    ],
    source: "Cultural trends database",
  },
  {
    id: "q3",
    questionNumber: 3,
    category: "Venture Capital",
    difficulty: "medium",
    questionText:
      "What is the term for a startup valued at over $1 billion?",
    options: [
      { id: "c1", label: "A", text: "Decacorn" },
      { id: "c2", label: "B", text: "Centaur" },
      { id: "c3", label: "C", text: "Unicorn" },
      { id: "c4", label: "D", text: "Phoenix" },
    ],
    source: "VC terminology index",
  },
  {
    id: "q4",
    questionNumber: 4,
    category: "Programming",
    difficulty: "medium",
    questionText:
      "Which programming language was created by Brendan Eich in just 10 days?",
    options: [
      { id: "d1", label: "A", text: "Python" },
      { id: "d2", label: "B", text: "Ruby" },
      { id: "d3", label: "C", text: "JavaScript" },
      { id: "d4", label: "D", text: "TypeScript" },
    ],
    source: "Tech history archive",
  },
  {
    id: "q5",
    questionNumber: 5,
    category: "AI & Machine Learning",
    difficulty: "hard",
    questionText:
      "What type of neural network architecture powers modern large language models like GPT-4?",
    options: [
      { id: "e1", label: "A", text: "Convolutional Neural Network" },
      { id: "e2", label: "B", text: "Recurrent Neural Network" },
      { id: "e3", label: "C", text: "Transformer" },
      { id: "e4", label: "D", text: "Generative Adversarial Network" },
    ],
    source: "AI research papers",
  },
];

export const MOCK_CORRECT_ANSWERS: Record<string, string> = {
  q1: "a2",
  q2: "b2",
  q3: "c3",
  q4: "d3",
  q5: "e3",
};

export const MOCK_EXPLANATIONS: Record<string, string> = {
  q1: "OpenAI, founded in 2015, developed ChatGPT which launched on November 30, 2022, and reached 100 million users in just two months, making it the fastest-growing consumer application in history.",
  q2: "FOMO stands for 'Fear Of Missing Out' and describes the anxiety that comes from feeling like others are having rewarding experiences without you. The term gained popularity with the rise of social media.",
  q3: "A 'Unicorn' is a privately held startup company valued at over $1 billion. The term was coined by venture capitalist Aileen Lee in 2013 to emphasize the statistical rarity of such ventures.",
  q4: "JavaScript was created by Brendan Eich in just 10 days in May 1995 while he was working at Netscape. It has since become one of the most widely used programming languages in the world.",
  q5: "The Transformer architecture, introduced in the 2017 paper 'Attention Is All You Need' by Vaswani et al., revolutionized NLP and is the foundation for models like GPT, BERT, and Claude.",
};

export const MOCK_HOST_HINTS: Record<string, string> = {
  q1: "Think about which company made headlines for their AI breakthrough in late 2022. It rhymes with 'Soap and A.I.'",
  q2: "This acronym became popular on social media when people started sharing their perfect moments online.",
  q3: "This mythical creature is known for being extremely rare and magical, just like billion-dollar startups.",
  q4: "The name of this language might make you think of a hot beverage, but it was actually named to ride on the popularity of another language.",
  q5: "This architecture 'transforms' the way we process language. The clue is literally in the name!",
};

export const DEFAULT_LIFELINES: Lifelines = {
  fiftyFifty: true,
  askTheHost: true,
  skip: true,
};

export const createInitialGameState = (sessionId: string): GameState => ({
  sessionId,
  status: "playing",
  currentQuestion: MOCK_QUESTIONS[0],
  currentQuestionIndex: 0,
  selectedAnswerId: null,
  correctAnswerId: null,
  lifelines: { ...DEFAULT_LIFELINES },
  totalWinnings: 0,
  questionsAnswered: 0,
  categoriesFaced: [MOCK_QUESTIONS[0].category],
  explanation: undefined,
  hostHint: undefined,
});
