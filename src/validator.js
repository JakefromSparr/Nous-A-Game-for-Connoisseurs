import { z } from 'zod';

// Tweak to your actual screen ids
export const Screen = z.enum([
  'WELCOME',
  'WAITING_ROOM',
  'RULES',
  'OPTIONS',
  'GAME_LOBBY',
  'ROUND_LOBBY',
  'QUESTION',
  'REVEAL',
  'FATE',
  'THREAD_SEVERED',
  'FATE_RESULT',
  'LAST_DECK',
  'FINAL_QUESTION',
  'FINAL_RESULT',
  'FINAL_READING',
  'GAME_OVER',
  'RESULTS',
  'CREDITS'
]);

// Button/answer keys
export const ABC = z.enum(['A','B','C']);

// If you already have tokens for powerups, use those strings here
export const PowerUp = z.enum(['DOUBLE_POINTS_THIS_QUESTION','RETRY','HINT']).catch('HINT');

const Answer = z.object({
  key: ABC,
  label: z.string()
});

const Tally = z.object({
  A: z.number().int().min(0),
  B: z.number().int().min(0),
  C: z.number().int().min(0),
});

const FateRef = z.object({ id: z.string() }).passthrough().nullable();
const QuestionRef = z.object({ id: z.string() }).passthrough().nullable();

export const persistedGameStateSchema = z.object({
  schemaVersion: z.literal(1).default(1),

  currentScreen: Screen,

  lives: z.number().int().min(0),
  score: z.number().int().min(0),

  roundsToWin: z.number().int().min(1),
  roundsWon: z.number().int().min(0),

  roundNumber: z.number().int().min(1),
  roundScore: z.number().int().min(0),

  thread: z.number().int().min(0),
  audacity: z.number().int().min(0),

  difficultyLevel: z.number().int().min(1),
  correctAnswersThisDifficulty: z.number().int().min(0),

  // Persist as arrays (storage-friendly)
  answeredQuestionIds: z.array(z.string()),
  completedFateCardIds: z.array(z.string()),

  activeRoundEffects: z.array(z.string()),      // keep simple for now
  activePowerUps: z.array(PowerUp),

  currentFateCard: FateRef,
  pendingFateCard: FateRef,
  activeFateCard: FateRef,

  currentQuestion: QuestionRef,
  currentAnswers: z.array(Answer),

  notWrongCount: z.number().int().min(0),
  currentCategory: z.string(),

  roundAnswerTally: Tally,

  traits: z.object({
    X: z.number().int(),
    Y: z.number().int(),
    Z: z.number().int(),
  }),
})
.superRefine((s, ctx) => {
  if (s.roundsWon > s.roundsToWin) {
    ctx.addIssue({ code: 'custom', message: 'roundsWon cannot exceed roundsToWin', path: ['roundsWon'] });
  }
  if (s.score < s.roundScore) {
    ctx.addIssue({ code: 'custom', message: 'score must be \u2265 roundScore', path: ['score'] });
  }
  // Optional guard: at most one fate slot occupied at a time
  const slots = [s.currentFateCard, s.pendingFateCard, s.activeFateCard].filter(Boolean).length;
  if (slots > 1) {
    ctx.addIssue({ code: 'custom', message: 'Only one fate card slot should be occupied', path: ['activeFateCard'] });
  }
});

// Transform persisted arrays -> runtime Sets
export const runtimeGameStateSchema = persistedGameStateSchema.transform((s) => ({
  ...s,
  answeredQuestionIds: new Set(s.answeredQuestionIds),
  completedFateCardIds: new Set(s.completedFateCardIds),
}));

export function validateOnLoad(raw) {
  const parsed = persistedGameStateSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: parsed.error.flatten() };
  // transform to runtime (Sets etc.)
  const runtime = runtimeGameStateSchema.parse(parsed.data);
  return { ok: true, data: runtime };
}

export function sanitizeBeforeSave(state) {
  // Convert Sets back to arrays before validating/persisting
  const persisted = {
    ...state,
    answeredQuestionIds: Array.from(state.answeredQuestionIds || []),
    completedFateCardIds: Array.from(state.completedFateCardIds || []),
  };
  const check = persistedGameStateSchema.safeParse(persisted);
  return check.success
    ? { ok: true, data: check.data }
    : { ok: false, data: persisted, errors: check.error.flatten() };
}

// Dev-only assert
export function assertState(state) {
  if (import.meta?.env?.DEV) {
    const { ok, errors } = sanitizeBeforeSave(state);
    if (!ok) console.error('[STATE INVALID]', errors);
  }
}

