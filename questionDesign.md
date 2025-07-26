# NOUS – Question Design Guide

*A playbook for writing, rating, and wiring NOUS prompts.*

---

## 1  Essence

NOUS questions aren’t trivia. They expose **why** people assume, not **what** they know.

> *It feels like a dad‑joke, a “well‑you’re‑not‑wrong” meme, a Jackbox prompt, and a séance—all at once.*

---

## 2  Core Intent

Instead of asking *“Do you know the answer?”* NOUS asks:

> **“Why did you assume that was the only answer?”**

### Lenses & Biases

| Lens tested   | Typical bias exposed                             |
| ------------- | ------------------------------------------------ |
| **Language**  | default reading of syntax / idiom                |
| **Meaning**   | automatic scope, scale or metaphor               |
| **Exclusion** | unseen constraints players imagine are ruled out |

A **Tier 5** item triggers an **“Oh—wait…”** realisation when the hidden frame snaps into view.

---

## 3  Question Anatomy

| Field                    | Purpose                                          |
| ------------------------ | ------------------------------------------------ |
| `title`                  | Evocative header                                 |
| `text`                   | The prompt                                       |
| `answers[]`              | Three objects ― `Typical`, `Revelatory`, `Wrong` |
| `answers[*].text`        | Shown to players                                 |
| `answers[*].explanation` | Post‑reveal comment                              |
| *Positions*              | Engine shuffles A / B / C each draw              |

### Engine Scoring (read‑only)

| Class      | Points | Thread |
| ---------- | ------ | ------ |
| Typical    |  +2    |   0    |
| Revelatory |  +1    |  +1    |
| Wrong      |  0     |  −1    |

*Thread is clamped to 0 +∞ automatically.*

---

## 4  Categories

| Category | Cognitive challenge                                           |
| -------- | ------------------------------------------------------------- |
| **Mind** | Interpret literal structure (language, logic, semantics)      |
| **Body** | Question physical / factual limits (practical, sensory)       |
| **Soul** | Confront meaning & intent (emotional, ethical, philosophical) |

---

## 5  Rating Scale (quality bar)

| ⭐     | Meaning                                                        |
| ----- | -------------------------------------------------------------- |
| **1** | Pure riddle/pun – no implicature tension                       |
| **2** | Mild twist – answer still obvious                              |
| **3** | Good concept but framing fuzzy                                 |
| **4** | Strong concept – minor ambiguity                               |
| **5** | Two valid interpretations, crystal framing, genuine reflection |

---

## 6  Design Patterns – *How to fool a brain*

| #  | Pattern                       | One‑line hook                                   |
| -- | ----------------------------- | ----------------------------------------------- |
| 1  | **Scope / Context Ambiguity** | Term spans multiple scales ("birthday", "side") |
| 2  | **Positivity Conditioning**   | Comfort vs ruthless logic ("revolt")            |
| 3  | **Fixed‑Function Disruption** | Verb/object repurposed ("climb down")           |
| 4  | **Overlapping Dichotomy**     | Breaks binary sets ("wheels & flies")           |
| 5  | **Simplified Heuristic Bias** | Exposes over‑simple rule ("straight line")      |
| 6  | **Non‑linear Framing**        | Time / order reversals                          |
| 7  | **Familiarity Heuristic**     | Familiar exemplar beats valid stranger          |
| 8  | **Gricean Implicature**       | Violates quantity / quality maxims              |
| 9  | **Proximity / Recency**       | Latest fact overweighted                        |
| 10 | **Myth vs Mechanism**         | Folklore challenged by cold fact                |

Use at least **one** pattern – Tier 5 often blends two.

---

## 7  Tier‑5 Examples

> **Prompt:** *How does this end?*\
> **A.** With a question mark.\
> **B.** With an “S.”\
> **C.** With everyone still sane.\
> **Twist:** “This” could be the sentence, the word **this**, or the scenario itself.

> **Prompt:** *Which of these has 3 sides?*\
> **A.** Triangle\
> **B.** Square\
> **C.** Circle\
> **Twist:** “Exactly” is never stated; squares qualify under broader definition.

> **Prompt:** *Where does your journey begin?*\
> **A.** When you take the first step.\
> **B.** When you decide to go.\
> **C.** When you’re ready.\
> **Twist:** Action vs intention vs readiness – mirrors inner worldview.

> **Prompt:** *How do you prevent the working class from revolting?*\
> **A.** Bread and circuses.\
> **B.** They can’t revolt if they’re dead.\
> **C.** Give them cake.\
> **Twist:** Ethical horror vs pragmatic control – tension spans categories.

---

## 8  Engine Impact (read‑only)

| AnswerClass | Default axis delta | Thread |
| ----------- | ------------------ | ------ |
| Typical     |  X‑1  Y‑1  Z‑1     | 0      |
| Revelatory  |  X+2  Y+3  Z+2     | +1     |
| Wrong       |  X‑2  Y‑2  Z‑2     | −1     |

Per‑question weights & overrides live in **`traitConfig.js`**.

---

## 9  Submission Checklist

\
\- [ ] Two valid answers by interpretation, one clearly wrong. &#x20;

\- [ ] Hidden assumption identified and documented. &#x20;

\- [ ] Fits one category and at least one design pattern. &#x20;

\- [ ] Self-test: can you articulate \*both\* correct rationales in ≤ 30 words each? &#x20;

\- [ ] Rated on 1–5 scale; Tier-3+ only if rating ≥ 4. &#x20;



NOUS crowns those who **question** the most, not those who **know** the most.

