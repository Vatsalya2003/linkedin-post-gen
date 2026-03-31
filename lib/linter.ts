// ─────────────────────────────────────────────────────────────────────────────
// lib/linter.ts
//
// Post-generation quality checker. Runs on each generated post body and returns
// a score (0–100) plus a list of specific, actionable issues.
// Score >= 70 = pass. Used to surface quality issues to the user.
// ─────────────────────────────────────────────────────────────────────────────

export interface LintIssue {
  rule: string;
  message: string;
  severity: "error" | "warning";
  penalty: number;
}

export interface LintResult {
  score: number;     // 0–100 (100 = no issues found)
  issues: LintIssue[];
  pass: boolean;     // score >= 70
}

// Common acronyms that should NOT be flagged as all-caps violations
const ALLOWED_ACRONYMS = new Set([
  "AI", "API", "CEO", "CTO", "AWS", "LLM", "GPU", "CLI", "SDK", "IDE",
  "CI", "CD", "PR", "SQL", "CSS", "HTML", "JS", "TS", "UI", "UX",
  "SAAS", "B2B", "ML", "NLP", "RAG", "CRUD", "MVP", "KPI", "ROI",
  "SWE", "SRE", "DX", "SSR", "SSG", "API", "REST", "RPC", "ORM",
]);

// ─────────────────────────────────────────────────────────────────────────────
// SLOP PHRASES — 40+ patterns that signal low-quality corporate writing
// Each match is a separate issue (penalty stacks per match found).
// ─────────────────────────────────────────────────────────────────────────────
const SLOP_PHRASES = [
  "game-changer",
  "game changer",
  "excited to share",
  "let that sink in",
  "the future is here",
  "in today's rapidly evolving",
  "as we stand on the cusp",
  "here's why",
  "i'm thrilled to announce",
  "thrilled to announce",
  "proud to share",
  "humbled and honored",
  "thought leader",
  "synergy",
  "paradigm shift",
  "move the needle",
  "low-hanging fruit",
  "circle back",
  "deep dive",
  "unpack this",
  "at the end of the day",
  "it goes without saying",
  "needless to say",
  "without further ado",
  "stay tuned",
  "mark my words",
  "this is huge",
  "mind-blowing",
  "revolutionary",
  "disruptive",
  "next level",
  "cutting-edge",
  "cutting edge",
  "state-of-the-art",
  "state of the art",
  "best-in-class",
  "best in class",
  "leverage",
  "unlock",
  "empower",
  "supercharge",
  "the reality is",
  "here's the thing",
  "hot take:",
  "like and share",
  "share if you agree",
  "drop a comment",
  "agree?",
  "thoughts?",
  "am i wrong?",
];

// ─────────────────────────────────────────────────────────────────────────────
// WEAK HOOK PREFIXES — first-line openers that signal a bad hook
// ─────────────────────────────────────────────────────────────────────────────
const WEAK_HOOK_PREFIXES = [
  "i'm excited",
  "i am excited",
  "today i",
  "i want to share",
  "in today's",
  "as we",
  "have you ever",
  "did you know",
];

// Count emoji in a string using unicode ranges
function countEmoji(text: string): number {
  const emojiRegex =
    /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1FFFF}\u{FE00}-\u{FE0F}\u{200D}]/gu;
  return (text.match(emojiRegex) ?? []).length;
}

// ─────────────────────────────────────────────────────────────────────────────
// lintPost — main export
// Runs all checks, collects issues, computes score.
// ─────────────────────────────────────────────────────────────────────────────
export function lintPost(body: string): LintResult {
  const issues: LintIssue[] = [];
  let penalty = 0;

  const lower = body.toLowerCase();
  const lines = body.split("\n");
  const firstLine = lines.find((l) => l.trim().length > 0) ?? "";

  // ── CHECK 1: Slop phrases (error, -8 each) ────────────────────────────────
  for (const phrase of SLOP_PHRASES) {
    if (lower.includes(phrase.toLowerCase())) {
      issues.push({
        rule: "slop-phrase",
        message: `Slop phrase detected: "${phrase}" — remove or rephrase`,
        severity: "error",
        penalty: 8,
      });
      penalty += 8;
    }
  }

  // ── CHECK 2: Post length ──────────────────────────────────────────────────
  const len = body.length;
  if (len < 80) {
    issues.push({
      rule: "too-short-error",
      message: "Post is too short to provide value (under 80 chars)",
      severity: "error",
      penalty: 25,
    });
    penalty += 25;
  } else if (len < 500) {
    issues.push({
      rule: "too-short-warning",
      message: `Post is on the short side (${len} chars; aim for 1000–1500)`,
      severity: "warning",
      penalty: 5,
    });
    penalty += 5;
  } else if (len > 3000) {
    issues.push({
      rule: "too-long-error",
      message: `Post is way too long (${len} chars) — readers will drop off`,
      severity: "error",
      penalty: 20,
    });
    penalty += 20;
  } else if (len > 2000) {
    issues.push({
      rule: "too-long-warning",
      message: `Post exceeds optimal length (${len} chars; aim for 1000–1500)`,
      severity: "warning",
      penalty: 10,
    });
    penalty += 10;
  }

  // ── CHECK 3: Emoji overuse (warning, -3 per excess beyond 2) ─────────────
  const emojiCount = countEmoji(body);
  if (emojiCount > 2) {
    const excess = emojiCount - 2;
    for (let i = 0; i < excess; i++) {
      issues.push({
        rule: "emoji-overuse",
        message: `Excess emoji (${emojiCount} found; max 2). Remove ${excess} emoji.`,
        severity: "warning",
        penalty: 3,
      });
      penalty += 3;
    }
  }

  // ── CHECK 4: Hashtag count + position ────────────────────────────────────
  const hashMatches = body.match(/#\w+/g) ?? [];
  const hashCount = hashMatches.length;

  if (hashCount > 3) {
    issues.push({
      rule: "too-many-hashtags",
      message: `Too many hashtags (${hashCount} found; max 3, prefer 0)`,
      severity: "warning",
      penalty: 5,
    });
    penalty += 5;
  }

  if (hashCount > 0) {
    // Check that ALL hashtags appear only in the last 200 chars
    const lastChunk = body.slice(-200);
    const hashInBody = hashMatches.some((tag) => {
      const tagIdx = body.indexOf(tag);
      return tagIdx < body.length - 200;
    });
    if (hashInBody) {
      issues.push({
        rule: "hashtags-in-body",
        message: "Hashtags should be at the very end of the post, not in the body",
        severity: "warning",
        penalty: 5,
      });
      penalty += 5;
      void lastChunk; // suppress unused warning
    }
  }

  // ── CHECK 5: Weak hook detection (warning, -10) ───────────────────────────
  const hookLower = firstLine.toLowerCase().trim();
  for (const prefix of WEAK_HOOK_PREFIXES) {
    if (hookLower.startsWith(prefix)) {
      issues.push({
        rule: "weak-hook",
        message: `Weak hook opener: "${firstLine.trim()}" — start with a pain, tension, or bold claim instead`,
        severity: "warning",
        penalty: 10,
      });
      penalty += 10;
      break;
    }
  }

  // ── CHECK 6: Link in body (warning, -10) ─────────────────────────────────
  if (/https?:\/\//.test(body)) {
    issues.push({
      rule: "link-in-body",
      message: "External links decrease reach ~30%. Move URL to a comment and write 'link in comments' instead.",
      severity: "warning",
      penalty: 10,
    });
    penalty += 10;
  }

  // ── CHECK 7: All-caps words (warning, -3 per excess word beyond 2) ────────
  const words = body.split(/\s+/);
  const capsViolations: string[] = [];
  for (const word of words) {
    const clean = word.replace(/[^A-Za-z]/g, "");
    if (
      clean.length > 3 &&
      clean === clean.toUpperCase() &&
      !ALLOWED_ACRONYMS.has(clean)
    ) {
      capsViolations.push(clean);
    }
  }
  if (capsViolations.length > 2) {
    const excess = capsViolations.slice(2);
    for (const word of excess) {
      issues.push({
        rule: "all-caps-word",
        message: `All-caps word "${word}" — use lowercase or title case for emphasis`,
        severity: "warning",
        penalty: 3,
      });
      penalty += 3;
    }
  }

  // ── CHECK 8: Corporate "we" voice (warning, -8) ───────────────────────────
  const weCount = (lower.match(/\bwe\b|\bour\b/g) ?? []).length;
  const iCount = (lower.match(/\bi\b|\bi've\b|\bi'm\b|\bi'd\b/g) ?? []).length;
  if (weCount > 3 && iCount < 2) {
    issues.push({
      rule: "corporate-we",
      message: `Corporate "we/our" voice detected (${weCount} uses vs ${iCount} "I" uses). Posts using "we" voice appear in 45% of bottom performers.`,
      severity: "warning",
      penalty: 8,
    });
    penalty += 8;
  }

  // ── CHECK 9: Markdown formatting artifacts (warning, -8 per type) ───────────
  // LinkedIn does NOT render markdown — asterisks and backticks appear literally.
  // Each detected type (bold, italic, backtick) = one issue.
  if (/\*\*[^*\n]+\*\*/.test(body)) {
    issues.push({
      rule: "markdown-bold",
      message: 'Post contains **bold** markdown — LinkedIn renders this as literal asterisks. Remove all ** formatting.',
      severity: "warning",
      penalty: 8,
    });
    penalty += 8;
  }
  // Italic: single asterisk wrapping (not part of **)
  if (/(?<!\*)\*[^*\n]+\*(?!\*)/.test(body)) {
    issues.push({
      rule: "markdown-italic",
      message: 'Post contains *italic* markdown — LinkedIn renders this as literal asterisks. Remove all * formatting.',
      severity: "warning",
      penalty: 8,
    });
    penalty += 8;
  }
  if (/`[^`\n]+`/.test(body)) {
    issues.push({
      rule: "markdown-backtick",
      message: 'Post contains `backtick` code spans — LinkedIn renders these as literal backticks. Write tool names as plain text (e.g. llama.cpp not `llama.cpp`).',
      severity: "warning",
      penalty: 8,
    });
    penalty += 8;
  }

  // ── Final score ───────────────────────────────────────────────────────────
  const score = Math.max(0, Math.min(100, 100 - penalty));
  return {
    score,
    issues,
    pass: score >= 70,
  };
}
