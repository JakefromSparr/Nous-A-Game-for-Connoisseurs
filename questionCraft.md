## 0) The Point

NOUS questions aren’t trivia. They expose **why** people assume, not **what** they know. 

A NOUS card fails the instant the player realizes they’re analyzing wording. The prompt must feel like a normal utterance. The “aha” is not a “clever grammar trick,” but:
**“Oh… I read that the other way — and that reveals something about me.”** NOUS questions aren’t trivia. They expose **why** people assume, not **what** they know.

> *It feels like a dad‑joke, a “well‑you’re‑not‑wrong” meme, a Jackbox prompt, and a séance—all at once.*

**One-line litmus:**

> “The player must choose which *kind* of meaning to defend.” 

---

## 1) The Three-Step Method 

### Step 1 — Find the Fracture Point 

Identify a *real* ambiguity inside the prompt itself (not in the answer list). Examples: lexical, syntactic, zeugma/syllepsis, garden-path, paraprosdokian, donkey sentence. 

If the twist lives in the answers, you’re writing a trivia trap. 

### Step 2 — Set the Dichotomy (the cut)

Frame the prompt so the ambiguity forces a **worldview fork** (Lens A vs Lens B). Common forks:

* Literal vs metaphorical
* Social vs physical
* Systemic vs individual
* Functional vs factual
* Comfort vs precision

### Step 3 — Write Answers as Worldviews 

Every question has three answers: **Typical, Revelatory, Wrong.** 

* **Typical** = instinctive/default reading (safe/common lens)
* **Revelatory** = counter-reading that is *also correct* under a different interpretation
* **Wrong** = tempting miss that collapses under both interpretations

**Non-negotiable:** Two answers must remain simultaneously correct under different readings. If only one is truly right, it’s a trick riddle, not NOUS. 

---

## 2) Answer Classes (Design Contract)

### What the player experiences

* **Typical**: “Sure, that’s what it means.”
* **Revelatory**: “Oh. That’s also true. I just didn’t choose that lens.”
* **Wrong**: “That *felt* plausible… why did I want it to be true?”

### Scoring & Thread (engine behavior reference)

* Typical: **+2 points**, **+0 thread**
* Revelatory: **+1 point**, **+1 thread**
* Wrong: **+0 points**, **−1 thread**
Per‑question weights & overrides live in **`traitConfig.js`**.
---

## 3) Anatomy of a Question

### 1  Core Intent

Instead of asking *“Do you know the answer?”* NOUS asks:

> **“Why did you assume that was the only answer?”**

#### Lenses & Biases

| Lens tested   | Typical bias exposed                             |
| ------------- | ------------------------------------------------ |
| **Language**  | default reading of syntax / idiom                |
| **Meaning**   | automatic scope, scale or metaphor               |
| **Exclusion** | unseen constraints players imagine are ruled out |

A **Tier 5** item triggers an **“Oh—wait…”** realisation when the hidden frame snaps into view.

---

### 2  Question Anatomy

| Field                    | Purpose                                          |
| ------------------------ | ------------------------------------------------ |
| `title`                  | Evocative header                                 |
| `text`                   | The prompt                                       |
| `answers[]`              | Three objects ― `Typical`, `Revelatory`, `Wrong` |
| `answers[*].text`        | Shown to players                                 |
| `answers[*].explanation` | Post‑reveal comment                              |
| *Positions*              | Engine shuffles A / B / C each draw              |

---

### 3  Categories

| Category | Cognitive challenge                                           |
| -------- | ------------------------------------------------------------- |
| **Mind** | Interpret literal structure (language, logic, semantics)      |
| **Body** | Question physical / factual limits (practical, sensory)       |
| **Soul** | Confront meaning & intent (emotional, ethical, philosophical) |

---

## 4) The Six Gates (Quality Rubric)

Run every draft through these **in order**. 

1. **Ambiguity lives inside the prompt** (not the answers).
2. **Prompt is a single unbroken utterance** (no setup paragraph, no “X said…”).
3. **Two answers are simultaneously correct** under different readings.
4. **Not merely a simple pun/synonym swap.**
5. **Choosing Typical vs Revelatory exposes a cognitive dichotomy** (worldview fork).
6. **Feels natural while exploiting an “invisible contract”** of conversation.

---

## 5) Failure Modes (and surgical fixes)

* **Trivia Trap**: the cleverness is in answer options

  * Fix: move ambiguity into the prompt wording. 
* **Crutch Setup**: “X said… what did they mean?” telegraphs the puzzle

  * Fix: compress into one utterance or discard. 
* **One-Answer Riddle**: only one answer is truly right

  * Fix: craft a second truth that survives under an alternate parse/frame. 
* **Pun-and-Done**: depends on homonym recognition

  * Fix: embed context so each meaning implies a different stance on reality.
* **Shallow Fork**: reveals knowledge, not worldview

  * Fix: sharpen the dichotomy (comfort vs precision, social vs physical, etc.).

---

## 6) Pattern Cookbook (when you’re stuck)

| #  | Pattern                       | One‑line hook                                   |
| -- | ----------------------------- | ----------------------------------------------- |
| 1  | **Scope / Context Ambiguity** | Term spans multiple scales ("birthday", "side") |
| 2  | **Positivity Conditioning**   | Comfort vs ruthless logic ("revolt")            |
| 3  | **Fixed‑Function Disruption** | Verb/object repurposed ("climb down")           |
| 4  | **Overlapping Dichotomy**     | Breaks binary sets ("wheels & flies")           |
| 5  | **Simplified Heuristic Bias** | Exposes over‑simple rule ("straight line")      |
| 6  | **Non‑linear Framing**        | Time / order reversals                          |
| 7  | **Familiarity Heuristic**     | Familiar exemplar beats valid stranger          |
| 8  | **Gricean Implicature**       | Violates quantity / quality maxims              |
| 9  | **Proximity / Recency**       | Latest fact overweighted                        |
| 10 | **Myth vs Mechanism**         | Folklore challenged by cold fact                |

Use at least **one** pattern – Tier 5 often blends two.

---

## 7) Rating Scale (1–5) — “How clean is the cut?”

Rate the *craft quality* of the card, independent of tier.

* **1** Pun/riddle, no implicature tension
* **2** Mild twist; still obvious
* **3** Good idea; framing fuzzy
* **4** Strong; minor ambiguity remaining
* **5** Two valid interpretations, crystal framing, genuine reflection

### Rating‑5 Examples

> **Prompt:** *How does this end?*\
> **A.** With a question mark.\
> **B.** With an “S.”\
> **C.** With everyone still sane.\
> **Twist:** “This” could be the sentence, the word **this**, or the scenario itself.

> **Prompt:** *Which of these has 3 sides?*\
> **A.** Triangle\
> **B.** Square\
> **C.** Circle\
> **Twist:** “Exactly” is never stated; squares qualify under broader definition.

> **Prompt:** *Where does your journey begin?*\
> **A.** When you take the first step.\
> **B.** When you decide to go.\
> **C.** When you’re ready.\
> **Twist:** Action vs intention vs readiness – mirrors inner worldview.

> **Prompt:** *How do you prevent the working class from revolting?*\
> **A.** Bread and circuses.\
> **B.** They can’t revolt if they’re dead.\
> **C.** Give them cake.\
> **Twist:** Ethical horror vs pragmatic control – tension spans categories.


---

## 8) Tier Taxonomy (0–5) — “What kind of experience is this?”

Tier is about *intent + player feeling*, not just difficulty. (Tier 0 is tutorial.)

| Tier |  Right-answer pattern                           | Player feeling                     |
| ---: |  ---------------------------------------------- | ---------------------------------- |
|    0 |  3/3 “works”                                    | onboarding, trust-building         |
|    1 |  2 of 3                                         | “bias revealed”                    |
|    2 |  2 of 3 (values)                                | “it’s about us now”                |
|    3 |  2 of 3 (jargon vs folk / precision vs comfort) | “am I smart or gullible?”          |
|    4 |  1 of 3                                         | “the mirror is cheating”           |
|    5 |  0 of 3 (projection)                            | “we’re exposed; nothing is stable” |

---

## 9) Submission Checklist (single, non-overlapping)

A draft isn’t “NOUS-ready” until all are true:

* [ ] **Prompt stands alone** (no setup paragraph).
* [ ] **Ambiguity is inside the prompt**, not smuggled into answers. 
* [ ] **Two answers are correct** under different readings; **one wrong** under both.
* [ ] You can explain **both correct rationales** in **≤ 20–30 words each**.
* [ ] Wrong answer is **tempting** (not a throwaway).
* [ ] You can name the **dichotomy** being tested (write it in a comment).
* [ ] Assigned **category** (Mind/Body/Soul) and at least one **pattern**. 
* [ ] Rated **1–5**; Tier 3+ generally expects rating **≥4**.

---

## 10) Closing Reminder

NOUS crowns those who **question** the most, not those who **know** the most.

> “We don’t test knowledge. We expose the hand that holds the knife.”
