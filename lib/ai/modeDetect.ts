export type ConversationMode = 'reflective' | 'direct' | 'teaching' | 'pattern' | 'standard'

export interface ModeSignals {
  messageText: string
  wordCount: number
  sessionCount: number       // total conversations the user has had
  recentUserMessages: string[] // last 3 user messages (for impatience detection)
  hasRecurringPattern: boolean
  patternDescription?: string
}

// ── Keyword heuristics ───────────────────────────────────────────────────────

const EMOTIONAL_MARKERS = [
  "don't know what to do", "dont know what to do",
  "scared", "i'm scared", "im scared",
  "i feel lost", "feeling lost", "feel so lost",
  "struggling", "i'm struggling", "im struggling",
  "it's hard", "its hard",
  "i'm worried", "im worried",
  "i feel like", "i don't understand myself", "i dont understand myself",
  "breaking up", "broke up",
  "lost my", "died", "passed away", "death",
  "cancer", "diagnosis",
  "fired", "laid off", "lost my job",
  "anxiety", "anxious", "depressed", "depression",
  "i don't know", "i dont know",
  "i'm not okay", "im not okay",
  "it hurts", "heartbroken",
]

const DIRECT_MARKERS = [
  "should i", "should i?",
  "is this a good time",
  "when should", "when should i",
  "yes or no",
  "just tell me",
  "what would you do",
  "is today a good", "is now a good",
]

const TEACHING_MARKERS = [
  "what is", "what's",
  "what does", "what do",
  "explain", "explain to me",
  "i don't understand", "i dont understand",
  "i don't really understand", "i dont really understand",
  "what does that mean",
  "why does", "why do",
  "teach me", "help me understand",
  "how does", "how do",
  "i've never understood", "ive never understood",
  "what even is",
]

// ── Rule checks ───────────────────────────────────────────────────────────────

function isEmotionallyHeavy(text: string): boolean {
  const lower = text.toLowerCase()
  if (EMOTIONAL_MARKERS.some(m => lower.includes(m))) return true

  // Long personal message that ends without a question mark
  const wordCount = text.trim().split(/\s+/).length
  if (wordCount > 50 && !text.trim().endsWith("?")) return true

  return false
}

function isPracticalQuestion(text: string, wordCount: number, recentMessages: string[]): boolean {
  const lower = text.toLowerCase()
  if (DIRECT_MARKERS.some(m => lower.includes(m))) return true

  // Very short message — likely wants a quick answer
  if (wordCount <= 10 && text.includes("?")) return true

  // User showing impatience in recent messages
  const impatientMarkers = ["just tell me", "so what does that mean", "ok but", "but what should", "what should i actually"]
  const recentCombined = recentMessages.join(" ").toLowerCase()
  if (impatientMarkers.some(m => recentCombined.includes(m))) return true

  // Recent messages very short on average (under 8 words) — terse/impatient pattern
  if (recentMessages.length >= 2) {
    const avgWords = recentMessages.reduce((sum, m) => sum + m.trim().split(/\s+/).length, 0) / recentMessages.length
    if (avgWords < 8 && wordCount <= 15) return true
  }

  return false
}

function isExplicitLearningRequest(text: string): boolean {
  const lower = text.toLowerCase()
  return TEACHING_MARKERS.some(m => lower.includes(m))
}

// ── Main detection function ───────────────────────────────────────────────────

export function detectMode(signals: ModeSignals): ConversationMode {
  const { messageText, wordCount, sessionCount, recentUserMessages, hasRecurringPattern, patternDescription } = signals

  // Rule-based checks first (fast, no DB needed)
  if (isEmotionallyHeavy(messageText)) return 'reflective'
  if (isPracticalQuestion(messageText, wordCount, recentUserMessages)) return 'direct'
  if (isExplicitLearningRequest(messageText)) return 'teaching'

  // Pattern mode: only after threshold and only if a pattern was found
  if (sessionCount >= 10 && hasRecurringPattern && patternDescription) return 'pattern'

  return 'standard'
}
