// src/validator.js
import { z } from 'zod';
import { SCREENS } from './constants/screens.js';

// Keep this in sync with your exported screen IDs.
export const Screen = z.enum(Object.values(SCREENS));

/* ───────── Shared ───────── */
export const ABC = z.enum(['A','B','C']);

const Tally = z.object({
  A: z.number().int().min(0),
  B: z.number().int().min(0),
  C: z.number().int().min(0),
});

const AnswerView = z.object({
  key: ABC,
  label: z.string(),
  answerClass: z.string().optional(),
  explanation: z.string().optional(),
}).passthrough();

const ActiveRoundEffect = z.object({
  type: z.string(),
  cardTitle: z.string().optional(),
  note: z.string().optional(),
  threadDelta: z.number().optional(),
}).passthrough();

const FateRef = z.any().nullable();       // we persist full cards; allow passthrough
const QuestionRef = z.any().nullable();   // same for current question

/* ───────── Persisted shape ─────────
   - Sets are arrays in storage
   - We allow passthrough objects for Fate/Question scaffolding
*/
export const persistedGameStateSchema = z.object({
  schemaVersion: z.literal(1).default(1),

  currentScreen: Screen,

  lives: z.number().int().min(0),
  score: z.number().int().min(0),

  roundsToWin: z.number().int().min(1),
  roundsWon: z.number().int().min(0),

  roundNumber: z.number().int().min(1),
  roundScore: z.number().int().min(0),

  pendingBank: z.number().int().min(0).default(0),

  thread: z.number().int().min(0),
  nextRoundT0: z.number().int().min(0).nullable().default(null),
  weavePrimed: z.boolean().default(false),

  notWrongCount: z.number().int().min(0),

  // Difficulty
  startingDifficulty: z.number().int().min(1).max(3).default(1),  // user preference (1..3)
  difficultyLevel: z.number().int().min(1),                       // live unlocked cap (up to 7)
  correctAnswersThisDifficulty: z.number().int().min(0),

  audacity: z.number().int().min(0),

  // Sets are stored as arrays (ids can be number or string)
  answeredQuestionIds: z.array(z.union([z.number(), z.string()])),
  completedFateCardIds: z.array(z.union([z.number(), z.string()])),
  questionHistory: z.record(z.string(), z.string()).default({}),

  activeRoundEffects: z.array(ActiveRoundEffect),
  activePowerUps: z.array(z.string()),

  // Fate scaffolding
  currentFateCard: FateRef,
  pendingFateCard: FateRef,
  activeFateCard: FateRef,
  fateChoices: z.array(z.any().nullable()).length(3),

  // Question scaffolding
  currentQuestion: QuestionRef,
  currentAnswers: z.array(AnswerView),
  currentCategory: z.string(),

  roundAnswerTally: Tally,

  traits: z.object({
    X: z.number().int().min(-9).max(9),
    Y: z.number().int().min(-9).max(9),
    Z: z.number().int().min(-9).max(9),
  }),

  lastOutcome: z.any().optional(),   // REVEAL payload

  roundEndedBy: z.enum(['TIE_OFF', 'SEVER']).nullable(),
  roundWon: z.boolean(),
})
.superRefine((s, ctx) => {
  if (s.roundsWon > s.roundsToWin) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'roundsWon cannot exceed roundsToWin',
      path: ['roundsWon'],
    });
  }
  // Only one fate slot at a time
  const slots = [s.currentFateCard, s.pendingFateCard, s.activeFateCard].filter(Boolean).length;
  if (slots > 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Only one fate card slot should be occupied',
      path: ['activeFateCard'],
    });
  }
});

export const runtimeGameStateSchema = persistedGameStateSchema.transform((s) => ({
  ...s,
  answeredQuestionIds: new Set(s.answeredQuestionIds),
  completedFateCardIds: new Set(s.completedFateCardIds),
}));

export function validateOnLoad(raw) {
  const parsed = persistedGameStateSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: parsed.error.flatten() };
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
