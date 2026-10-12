# Data contracts

Two record shapes. Limits: pretty-printed, 2-space indent, one key per line, no comments, at most 24 lines per block, every line at most 80 characters. Because of the 80-character limit the reasoning, summary and statement texts in the examples are short; the real reasoning limit is 30 words. Identifiers are shortened to 8 hex characters followed by an ellipsis.

## 1. Judgment (one per claim, increment 1)

```json
{
  "claimId": "9c41e7a2…",
  "notionPageId": "1f3a58b0…",
  "verdict": "Partially supported",
  "confidence": 0.72,
  "reasoning": "Paraphrase matches: 12% rent rise, but only in one city.",
  "sources": [
    {
      "url": "https://www.example.org/housing/rents-2026",
      "status": "ok",
      "relevance": "partial",
      "note": "Reports a 12% rent rise, Leeds only"
    }
  ],
  "sourcesChecked": 3,
  "sourcesUnreadable": 1,
  "model": "claude-sonnet-5-5",
  "rubricVersion": "1.0.0",
  "run": "2026-10-12T09:14:03Z"
}
```

| Field | Type | Meaning (plain words) |
|---|---|---|
| claimId | text | The claim's identifier in Geo. |
| notionPageId | text | The row for the same claim in the Notion claims table, where the result is written. |
| verdict | one of: Supported, Partially supported, Not supported, Cannot check | The overall answer to "do the attached sources back this claim?". Cannot check is used when sources are unreadable. |
| confidence | number 0 to 1 | How sure the judge is; 1 is certain. |
| reasoning | text, one sentence, at most 30 words | Why. Judged on meaning: the claim is a paraphrase, so no exact quote is expected. |
| sources | list of source records | One record per attached source that was looked at. |
| sources.url | text | Web address of the source. |
| sources.status | one of: ok, blocked, dead, pdf, timeout | Whether the page could be read: ok, refused access, gone, a PDF document, or too slow. |
| sources.relevance | one of: supports, partial, none, unreadable | What this source says about the claim. |
| sources.note | text | A short note on what was found. |
| sourcesChecked | whole number | How many sources were looked at. |
| sourcesUnreadable | whole number | How many of those could not be read. |
| model | text | The AI model that made the judgment. |
| rubricVersion | text | Version of the judging rules used, so old results can be compared fairly. |
| run | date and time (UTC) | When the judgment was made. |

## 2. Review (one per bounty submission, increment 3)

The review has one more key, `findings`, a list of finding records. It is shown separately in block 2b because a single block would exceed the 24-line limit; in the stored record `findings` sits between `summary` and `followUpOf`.

### 2a. Review envelope

```json
{
  "bounty": {
    "id": "a41c90d7…",
    "name": "Climate claims Q4"
  },
  "curator": {
    "id": "d27f0b64…",
    "name": "Priya N."
  },
  "proposalsReviewed": [
    "7be20c15…"
  ],
  "lastReviewed": "2026-10-11T08:30:00Z",
  "verdict": "revise",
  "summary": "Two of three claims are sound; one needs a corrected year.",
  "followUpOf": null
}
```

| Field | Type | Meaning (plain words) |
|---|---|---|
| bounty.id | text | Identifier of the bounty (the open request for content). |
| bounty.name | text | Its readable name. |
| curator.id | text | Identifier of the person who submitted work for the bounty. |
| curator.name | text | Their readable name. |
| proposalsReviewed | list of text | The proposals (suggested changes to Geo) included in this review. |
| lastReviewed | date and time (UTC) | When this review was last updated. |
| verdict | one of: approve, revise, reject | The overall recommendation to the editor. |
| summary | text, one sentence | The result in a sentence an editor can read at a glance. |
| findings | list of finding records | The individual problems or confirmations; see block 2b. |
| followUpOf | text or null | If this re-checks an earlier review, that review's identifier; otherwise null. |

### 2b. One finding

```json
{
  "id": "f3d81c4e…",
  "check": "C2",
  "severity": "A",
  "relatedEntity": {
    "id": "5c0e9a17…",
    "name": "Emissions fell in 2025"
  },
  "statement": "Emissions fell 8% in 2025.",
  "issue": "Please add the year that the 8% figure refers to.",
  "sources": [
    "https://www.example.org/emissions-2025"
  ],
  "evidence": "The source gives 8% for 2024, not 2025.",
  "confidence": 0.84
}
```

| Field | Type | Meaning (plain words) |
|---|---|---|
| id | text | Identifier of this finding. |
| check | one of: C1, C2, C3, C4, C5 | Which of the five review checks produced it. |
| severity | one of: S, A, B, C | S breaks a hard rule or can corrupt data; A wrong and likely to spread; B costs review effort; C cosmetic. |
| relatedEntity.id | text | The item in Geo the finding is about. |
| relatedEntity.name | text | Its readable name. |
| statement | text | The claim or statement under review. |
| issue | text | What the curator is asked to fix, worded to them ("Please ..."). |
| sources | list of text | Web addresses supporting the finding. |
| evidence | text, one sentence | What the sources actually show. |
| confidence | number 0 to 1 | How sure the reviewer is. |

## Validation

Command: a small `node` script that extracts each json block from this file, runs `JSON.parse`, counts lines, finds the longest line, and checks the text equals `JSON.stringify(obj, null, 2)`.

```
block 1: JSON.parse OK, lines=20, maxLen=74, canonical pretty-print=true
block 2: JSON.parse OK, lines=17, maxLen=74, canonical pretty-print=true
block 3: JSON.parse OK, lines=16, maxLen=63, canonical pretty-print=true
```

Block 1 = Judgment, block 2 = Review envelope (2a), block 3 = one finding (2b). All at most 24 lines and at most 80 characters per line.
