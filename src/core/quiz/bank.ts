// Quiz question bank — language-neutral structure only (the definitions.ts
// pattern): every prompt/option/explanation string lives in the dictionaries
// under quiz.questions.<id>, keyed by these stable ids. Option order is fixed
// so correctIndex stays aligned across locales.

export type QuizSectionId = "training" | "inference" | "processes" | "evolution" | "learn";

export type QuizQuestion = {
  id: string;
  sectionId: QuizSectionId;
  correctIndex: number;
  optionCount: number;
};

export const QUIZ_SECTION_IDS: readonly QuizSectionId[] = [
  "training",
  "inference",
  "processes",
  "evolution",
  "learn",
];

export const QUESTIONS_PER_SECTION = 5;

const q = (sectionId: QuizSectionId, key: string, correctIndex: number): QuizQuestion => ({
  id: `${sectionId}-${key}`,
  sectionId,
  correctIndex,
  optionCount: 4,
});

export const QUIZ_BANK: readonly QuizQuestion[] = [
  // How an LLM is trained
  q("training", "pretrain-objective", 1),
  q("training", "data-scale", 2),
  q("training", "sft-purpose", 0),
  q("training", "rlhf-role", 3),
  q("training", "eval-benchmarks", 1),
  // How an LLM answers (inference)
  q("inference", "first-step", 2),
  q("inference", "logits-meaning", 1),
  q("inference", "temperature-effect", 0),
  q("inference", "kv-cache-why", 3),
  q("inference", "stop-condition", 2),
  // Working with LLMs (processes)
  q("processes", "quantization-tradeoff", 1),
  q("processes", "distillation-goal", 0),
  q("processes", "rag-benefit", 2),
  q("processes", "lora-frozen", 1),
  q("processes", "guardrails-where", 3),
  // Evolution of AI
  q("evolution", "perceptron-year", 1),
  q("evolution", "alexnet-milestone", 2),
  q("evolution", "attention-paper", 0),
  q("evolution", "rnn-limitation", 3),
  q("evolution", "scaling-laws", 1),
  // Learn (transformer mechanics)
  q("learn", "softmax-output", 2),
  q("learn", "gqa-saves", 1),
  q("learn", "rope-encodes", 0),
  q("learn", "moe-active", 3),
  q("learn", "tokenizer-units", 1),
];

export function questionsForSection(sectionId: QuizSectionId): QuizQuestion[] {
  return QUIZ_BANK.filter((question) => question.sectionId === sectionId);
}
