export interface FuzzyResult {
  score: number
  /** Half-open [start, end) ranges in the ORIGINAL text, for bolding. */
  ranges: Array<[number, number]>
}

/** Word starts: beginning of text or after a separator. */
const isBoundary = (text: string, i: number): boolean =>
  i === 0 || /[\s\-_/#.@(]/.test(text[i - 1])

/**
 * Case-insensitive greedy subsequence match with bonuses for word-boundary
 * starts and contiguous runs — not edit distance. Deterministic; returns
 * null when the query is not a subsequence of the text. Scores only make
 * sense relative to each other (same query, different texts).
 */
export function fuzzyMatch(query: string, text: string): FuzzyResult | null {
  const q = query.toLowerCase()
  const t = text.toLowerCase()
  if (q.length === 0 || q.length > t.length) return null

  // Prefer the tightest interpretation cheaply: try a whole-substring hit
  // first (best possible contiguity), else greedy subsequence.
  const sub = t.indexOf(q)
  let indices: number[]
  if (sub >= 0) {
    indices = Array.from({ length: q.length }, (_, k) => sub + k)
  } else {
    indices = []
    let ti = 0
    for (let qi = 0; qi < q.length; qi++) {
      const found = t.indexOf(q[qi], ti)
      if (found < 0) return null
      indices.push(found)
      ti = found + 1
    }
  }

  // Contiguity must outweigh boundaries: a scattered query hits a boundary
  // bonus PER island, so "r e p" would otherwise beat the substring "rep".
  let score = 0
  for (let k = 0; k < indices.length; k++) {
    score += 1
    if (k > 0 && indices[k] === indices[k - 1] + 1) score += 3 // contiguous run
    if (isBoundary(text, indices[k])) score += 2 // word start
  }
  // Light penalties: later first-hit and longer haystacks rank below
  // earlier, tighter ones without ever flipping a bonus-sized gap.
  score = score / (1 + indices[0] * 0.05 + text.length * 0.005)

  const ranges: Array<[number, number]> = []
  for (const i of indices) {
    const last = ranges[ranges.length - 1]
    if (last && i === last[1]) last[1] = i + 1
    else ranges.push([i, i + 1])
  }
  return { score, ranges }
}
