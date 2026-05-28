import { createClient } from "@/lib/supabase/server"

export interface MemoryPattern {
  theme: string
  count: number
  entries: string[]
}

// Minimum days between surfacing a pattern to the same user
const PATTERN_COOLDOWN_DAYS = 14

function daysBetween(a: Date, b: Date): number {
  return Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)
}

// Simple keyword-overlap clustering for MVP.
// Groups theme memories that share significant words (4+ chars, not stop words).
const STOP_WORDS = new Set([
  "about", "after", "also", "been", "before", "being", "between", "both",
  "came", "come", "does", "doing", "done", "down", "during", "each",
  "feel", "felt", "find", "from", "gets", "going", "have", "having",
  "here", "herself", "himself", "into", "just", "keep", "kept", "know",
  "like", "make", "more", "most", "much", "myself", "need", "never",
  "often", "once", "only", "other", "over", "really", "same", "seem",
  "self", "some", "still", "such", "sure", "take", "tend", "than",
  "that", "their", "them", "then", "there", "they", "thing", "this",
  "time", "told", "user", "very", "want", "were", "what", "when",
  "where", "which", "while", "will", "with", "would", "your",
])

function extractKeywords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .split(/\s+/)
      .filter(w => w.length >= 4 && !STOP_WORDS.has(w))
  )
}

function overlap(a: Set<string>, b: Set<string>): number {
  let count = 0
  a.forEach(w => { if (b.has(w)) count++ })
  return count
}

export function clusterThemeMemories(contents: string[]): MemoryPattern[] {
  if (contents.length < 3) return []

  const keywordSets = contents.map(c => ({ content: c, keywords: extractKeywords(c) }))
  const clustered: boolean[] = new Array(contents.length).fill(false)
  const patterns: MemoryPattern[] = []

  for (let i = 0; i < keywordSets.length; i++) {
    if (clustered[i]) continue
    const group: string[] = [keywordSets[i].content]
    clustered[i] = true

    for (let j = i + 1; j < keywordSets.length; j++) {
      if (clustered[j]) continue
      if (overlap(keywordSets[i].keywords, keywordSets[j].keywords) >= 2) {
        group.push(keywordSets[j].content)
        clustered[j] = true
      }
    }

    if (group.length >= 3) {
      const sharedKeywords = Array.from(keywordSets[i].keywords).slice(0, 3).join(", ")
      patterns.push({
        theme: sharedKeywords || group[0].slice(0, 60),
        count: group.length,
        entries: group,
      })
    }
  }

  // If no cluster of 3 reached by keyword overlap, fall back: any 3+ theme memories at all
  if (patterns.length === 0 && contents.length >= 3) {
    patterns.push({
      theme: "recurring personal theme",
      count: contents.length,
      entries: contents.slice(0, 5),
    })
  }

  return patterns
}

export async function getRecurringPatterns(userId: string): Promise<MemoryPattern[]> {
  const supabase = createClient()
  const { data: memories } = await supabase
    .from("memories")
    .select("content")
    .eq("user_id", userId)
    .eq("category", "theme")
    .order("created_at", { ascending: false })

  if (!memories || memories.length < 3) return []
  return clusterThemeMemories(memories.map(m => m.content))
}

export async function shouldSurfacePattern(userId: string): Promise<boolean> {
  const supabase = createClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("last_pattern_surfaced_at")
    .eq("id", userId)
    .single()

  if (!profile?.last_pattern_surfaced_at) return true

  const daysSince = daysBetween(new Date(profile.last_pattern_surfaced_at), new Date())
  return daysSince >= PATTERN_COOLDOWN_DAYS
}

export async function markPatternSurfaced(userId: string): Promise<void> {
  const supabase = createClient()

  const { data: current } = await supabase
    .from("profiles")
    .select("pattern_surface_count")
    .eq("id", userId)
    .single()

  await supabase
    .from("profiles")
    .update({
      last_pattern_surfaced_at: new Date().toISOString(),
      pattern_surface_count: ((current?.pattern_surface_count ?? 0) as number) + 1,
    })
    .eq("id", userId)
}

export function buildPatternDescription(pattern: MemoryPattern): string {
  const entrySample = pattern.entries.slice(0, 3).map(e => `"${e}"`).join("; ")
  return `A recurring pattern of: ${entrySample}`
}
