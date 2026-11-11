# How to be sure of the flaws, and what to change in the story

## 1 · Why this report is not just agreement

The risk report says it is "drawn from the craft review". That craft review is
mine. If I now read the risk report and nod, nothing has been established — the
story would have been convicted on the evidence of its own defence lawyer.

So the seven risks were treated as **hypotheses** and tested against the scene
data instead: `data/scenes.json` (115 scenes, each with its point of view and
the single thing it turns on) joined to the twenty sequences of
`DRAFT_SCREENPLAY.md`. The test is in `scripts/audit-protagonist.py`, it runs
in a second, and it can be re-run after every rewrite.

The result: **the risk report is right about the biggest thing, wrong about the
nature of one thing, and missing one thing entirely.** All three matter for what
gets changed.

---

# Part A — How to make sure

Four instruments, cheapest first. Only the fourth needs other people.

## A1 · The structural audit *(scripted, repeatable, runs now)*

```bash
python3 scripts/audit-protagonist.py
```

It measures three things that are otherwise argued about in adjectives, and
fails on four fixed thresholds:

| the threshold | why that number | the draft today |
| --- | --- | --- |
| Her first scene by minute **10** | an audience decides who the film is about long before the paradigm's 17 | **FAIL — minute 25** |
| No stretch longer than **12 min** without a scene of hers | half a sequence is the longest a lead can vanish before the film changes subject | **FAIL — 25 min, then 21 min** |
| She is the subject of the turn in **60%** of her second-half scenes | below this she is a witness to her own climax | **FAIL — 26%** |
| At most **2 of the last 8** turns are her watching something | an ending of reaction shots has no arc in it | **FAIL — 3, and 7 of 8 are not hers at all** |

**0 of 4 pass.** That is the honest state of the draft, and it is the baseline
every later run is measured against.

## A2 · The hinge audit *(the one that found the real fault)*

Every scene on the board records **what it turns on** — the one hinge the cut
will privilege. Reading those 27 lines for her second-half scenes is the single
most revealing thing in this exercise, because it shows a pattern no synopsis
would:

| where | the hinge as written | she is |
| --- | --- | --- |
| `E06-09` | The vow is sworn aloud. | present |
| `E06-12` | He walks in smiling before he speaks. | present |
| `E06-14` | A woman lifts a garland toward her window. | present |
| `E06-20` | The ring breaks. | present |
| `E06-22` | The Yadava line holds. | present |
| `E06-25` | The sword is raised. | present |
| **`E06-26`** | **He lowers the sword.** | **present at the climax of the film** |
| `E06-27` | The razor. | present |
| `E07-01` | The sea appears at the edge of the road. | present |
| `E07-03` | The water-carrier raises a hand beside a clean wall. | present |
| **`E07-06`** | **The bard includes her letter.** | **present at the payoff of her arc** |
| `E07-07` | One of them speaks. | present |
| `E07-08` | The held shot. | present |

Thirteen of her own scenes turn on somebody else's action. **The mercy at the
climax is credited to him** — she pleads, he lowers the sword, and the hinge is
his. **Her arc's payoff is credited to a bard.** The last eight scenes of the
film are a woman arriving somewhere and being shown things.

This is measurable, it is specific to a line each, and it is the cheapest fault
in the film to fix.

## A3 · The cold-reader protocol *(the only test of the opening that works)*

The opening cannot be audited by anyone who knows the story. Six readers who do
not, the draft handed over in three instalments, and three questions after each,
asked in writing before they read on:

| after | the three questions | pass condition |
| --- | --- | --- |
| **minute 10** | Who is this film about? What do they want? What is stopping them? | 4 of 6 may name Krishna today; after the change, 4 of 6 must name her or say "the woman in the market" |
| **minute 25** | Same three. | 6 of 6 name her, and name *being sold* as the obstacle |
| **minute 45** | Same three, plus: what is she going to do? | 5 of 6 predict she will act, not that she will be rescued |

Record the answers verbatim. If the reader hesitates about who the film is
about at minute 25, no amount of structure argument survives it.

## A4 · The animatic test *(use the tool that already exists)*

The board builds a contact sheet and an After Effects comp from any sequence.
Two tests cost nothing but render time:

1. **The silent opening.** Cut sequences 1–3 as an animatic with no dialogue and
   show it to a reader cold. Ask them to describe the person the film is
   following. Today they will describe a man walking out of a gate.
2. **The ending without sound.** Cut sequence 20 the same way. If the cut reads
   as a woman being given a tour, A2 is confirmed in pictures.

---

# Part B — The verdict on the seven risks

| | the risk report says | verdict | the evidence |
| --- | --- | --- | --- |
| 2.1 | protagonist enters too late | **confirmed, and worse than stated** | first scene of hers at **minute 25**; sequences 1–3 contain not one scene of hers, not even among the draft's own new scenes |
| 2.2 | accidental flat arc | **confirmed** | nothing she believes is contradicted anywhere in the 115 scenes; the only scene that pays a flat arc (`E07-06`) is 40 seconds long and its hinge belongs to a bard |
| 2.3 | "loving an enemy" is missing | **confirmed** | no scene in the data places her loyalty to him against her loyalty to her house; the conflict is staged as an obstacle, never as a cost |
| 2.4 | second-half passivity | **confirmed, but mis-diagnosed** | her *placement* in the second half is strong — 4 of 4, 4 of 4, 2 of 2 across sequences 13–16. The fault is not screen time. **She is the grammatical subject of the hinge in 7 of 27 of her own scenes.** This is a rewrite of thirteen lines, not a restructure — see B2 |
| 2.5 | antagonist payoff incomplete | **confirmed** | Rukmī never holds the standing he sold her for; `E06-27` (the razor) is the first time the trade is priced, and by then he has already lost |
| 2.6 | thin character juxtaposition | **confirmed, cheaper than stated** | the report costs this at four new scenes. **`E03-01` already exists** — the widows' arrival opens sequence 3. Two new scenes finish the foil, not four |
| 2.7 | dual structure confuses | **confirmed** | 25 minutes of a man's Field-perfect structure before the protagonist appears |

## Two findings the risk report does not contain

### B1 · There is a second dead zone, and it is in the worse place

The report diagnoses the opening. It does not notice that **sequences 8, 9 and
10 — 21 minutes, from 63.5 to 84.5 — contain no scene of hers either.**

`D-07`–`D-09` are the village strand; `E03-10`, `E03-08`, `E05-12`, `E03-11`,
`E03-12`, `E03-13` are all his. The audience last sees her hire a ferryman at
about minute 60 and does not see her again until she writes the letter.

The opening gap costs the film its protagonist. **This one costs the film its
midpoint**: she disappears for a fifth of an hour and returns to make the single
biggest decision in the story, with no reason on screen for why now.

### B2 · Her agency inverts exactly when the stakes rise

Act one is full of her doing things, and the draft's own new scenes are the best
of it: she catches a relic-forger in four seconds (`D-01`), walks two liars into
one room and breaks one of them with a single question (`D-02`), pays a
ferryman to row her out to empty water and draws the city anyway (`D-04`),
picks up a dead king's crown and finds it heavier than she expected (`D-05`).

Then the film gets serious and she stops. By the taking she is a passenger, and
at the climax — the one moment that is unambiguously hers, the plea that saves
her brother's life — **the hinge is written as "He lowers the sword."**

That is the fault under risk 2.4, stated precisely. It is not that she has too
little to do. It is that **the film hands her hinges to other people from minute
95 onward**, and it does it worst at the two moments that matter most.

---

# Part C — What to modify

Five changes. Four of them are re-ordering or rewriting; the net runtime cost is
**+0.5 minutes**.

## C1 · Act one: her entry at 8, her inciting incident at 17, the sale still at 45

| # | sequence | was | **now** | what changed |
| --- | --- | --- | --- | --- |
| 1 | The man who walks out | 0–6.5 | **0–6.5** | untouched |
| 2 | The cave | 6.5–12.5 | **6.5–15** | `NEW-03` moved in and intercut — **she appears at minute 8**, correcting a soldier's tally, before the mystery is posed |
| 3 | Seventeen | 12.5–25 | **15–29** | releases montage trimmed 1.5; **the first half of `E06-03` placed at 17** — she overhears the Chedi match being *discussed*, not agreed; `W-01` added |
| 4 | The woman who is counting | 25–34.5 | **29–36** | loses `NEW-03` to sequence 2 |
| 5 | The house | 34.5–45 | **36–45** | loses the match-discussed beat to sequence 3. **`D-03`, the sale, still lands at 45** |

Plot Point I is untouched. Six of the seven Field marks stay where they are.

## C2 · The thirteen hinge rewrites *(the highest-value change in the film)*

Not new scenes. The same scenes, with the hinge moved onto her. Each is one
line in the scene record and one decision on the day.

| scene | the hinge now | **the hinge required** |
| --- | --- | --- |
| `E06-09` | The vow is sworn aloud. | **She does not look away while the vow names him.** |
| `E06-12` | He walks in smiling before he speaks. | **She has her answer ready before he asks.** |
| `E06-14` | A woman lifts a garland toward her window. | **She takes the garland** — and with it the city's expectation. |
| `E06-20` | The ring breaks. | **She lets go of the rail.** She is not taken; she stops holding on. |
| `E06-22` | The Yadava line holds. | **She counts the dead, and stops counting.** The first crack in *being right is enough*. |
| `E06-25` | The sword is raised. | **She crosses the ground between them.** |
| **`E06-26`** | He lowers the sword. | **She puts her hand flat on the blade.** The sword lowering is the consequence; the hinge is hers. **This is the climax of the film and it is currently his.** |
| `E06-27` | The razor. | **She turns her face away and does not stop it.** Mercy has a price and she pays it in front of everyone. |
| `E07-01` | The sea appears at the edge of the road. | **She stands up in the moving chariot.** |
| `E07-03` | The water-carrier raises a hand beside a clean wall. | **She returns the greeting first.** |
| **`E07-06`** | The bard includes her letter. | **She gives the bard the letter's real last line** — the one she cut before sending. Her arc pays off in her own voice. |
| `E07-07` | One of them speaks. | **She answers.** |
| `E07-08` | The held shot. | **She walks in, and the shot holds on the gate she chose, not on her face.** |

Keep exactly two watching beats in the last eight — `E07-04` (the second lamp
already lit) and `E07-05` (the empty place). Both are reveals that must land as
reveals, and the empty chair is the ending's price.

## C3 · Close the second dead zone *(costs nothing — it is a move)*

Sequence 11 currently holds ten and a half minutes of letter. Split it:

| what moves | from | **to** | effect |
| --- | --- | --- | --- |
| `D-10` — the village's story reaches her, third-hand | sequence 11 | **sequence 8, ≈ minute 70** | the one unflattering fact about him lands *inside* the strand that earns it |
| the drafting beat — her hand crossing out lines, three times | sequence 11 | **sequence 10, ≈ minute 81** | the decision at 88 now has visible preparation |
| `E06-04` — sealed, the hour named | stays | **88** | **the midpoint does not move** |

| # | sequence | was | **now** |
| --- | --- | --- | --- |
| 6 | Two gates | 45–52.5 | **45–54.5** *(+`D-11`)* |
| 7 | The city in the sea | 52.5–63.5 | **54.5–64** *(−1.5 trim)* |
| 8 | What it costs | 63.5–69.5 | **64–71.5** *(+`D-10`)* |
| 9 | The flood | 69.5–76.5 | **71.5–80.5** *(+`W-03`)* |
| 10 | The burning hill | 76.5–84.5 | **80.5–88** *(−2.0 trim, + the drafting)* |
| 11 | She writes | 84.5–95 | **88–95.5** |

Longest remaining stretch without her: **11 minutes.** Act II-B now opens at
95.5 instead of 95 — half a minute of drift, well inside the paradigm.

## C4 · Three new scenes, not seven

| code | where | what happens | min |
| --- | --- | --- | --- |
| **`D-11`** | sequence 6, ≈ 45 | She defends him to Rukmī — and hears herself do it. The scene ends on her understanding that she has just taken a side against her own house. *This is situation 9, "loving an enemy," the one real gap in the chart.* | 2.0 |
| **`D-12`** | sequence 18, before `E06-27` | Jarasandha treats Rukmī as an equal in front of the court. Ninety seconds of exactly the standing he sold his sister for, in his hands. Then the razor. *Without this he is a man who loses; with it he is a man who wins and is ruined.* | 1.5 |
| **`W-01`** | sequence 3, ≈ 24 | Asti and Prāpti, already arriving in `E03-01`, are given one scene of their own: two women who were handed to a man for a border, learning they now inherit his war. Nobody asked them anything. | 1.5 |
| **`W-03`** | sequence 9, ≈ 73 | The same two women, a year on, being married off again — to the alliance, not to a person. Cut against the flood. | 2.0 |

`W-01` and `W-03` are the character juxtaposition the film has never had: the
alternative outcome, on screen, twice. One woman writes a letter; two others
inherit a war. The film's argument doubles and no one has to say it.

## C5 · The planted lie *(one line)*

In `D-02`, after she catches the liar — she is pleased with herself, and says
something like *being right is the whole of it*. One line, delivered as
competence, never referred to again.

It is contradicted at `E06-22` (she counts the dead), paid at `E06-26` (she pays
with her brother's dignity), and settled at `E07-05` (the empty place at the
table). **The arc closes itself**, and the film stops having an accidental flat
protagonist without a single new scene.

## The runtime ledger

| | min |
| --- | --- |
| added — `D-11` 2.0, `D-12` 1.5, `W-01` 1.5, `W-03` 2.0 | **+7.0** |
| trimmed — seq 3 releases 1.5, seq 7 city 1.5, seq 10 hill 2.0, seq 20 sea 1.5 | **−6.5** |
| **net** | **+0.5** |
| **new running time** | **175.0 min** |

Everything else — C1, C2, C3, C5 — is free.

---

# Part D — The acceptance test

Re-run the audit after the rewrite. These four numbers must change, and nothing
else needs to be argued about:

| | today | **required** |
| --- | --- | --- |
| her first scene | minute 25 | **≤ 10** → minute 8 |
| longest stretch without her | 25 min, then 21 min | **≤ 12** → 11 min |
| she is the subject of her second-half hinges | 7 of 27 *(26%)* | **≥ 60%** → 20 of 27 *(74%)* |
| watching beats in the last eight | 3, and 7 of 8 not hers | **≤ 2** → 2 |

```bash
python3 scripts/audit-protagonist.py   # must print 4 of 4 pass
```

Then A3, the cold readers, on the re-ordered opening. The audit can be satisfied
by a writer gaming it; six strangers at minute 10 cannot be.

---

# Part E — What must not change

The risk report's section 5 is right and nothing above touches it:

- **Krishna gets no arc and no earlier face.** The withheld face is the device.
  He is still unseen until minute 126.
- **Rukmī is not redeemed.** `D-12` gives him his victory precisely so the loss
  costs something — it is not a step toward forgiving him. He builds Bhojakaṭa
  and stays.
- **The empty place stays empty.** `E07-05` keeps its watching hinge for exactly
  this reason.
- **The six Field marks that land stay where they are.** Plot Point I at 45, the
  midpoint at 88, the face at 126, Plot Point II at 130, the climax at 153.
- **No wedding scene, nothing after E07, the braid intact.**

One thing the hinge rewrites must not become: her narrating her own decisions.
Every line in C2 is an action, not a statement. She puts her hand on the blade;
she does not explain why.

---

*Tested against `data/scenes.json` (115 scenes), `DRAFT_SCREENPLAY.md`
(20 sequences, 174.5 min) and `data/orders/braided.json`, using
`scripts/audit-protagonist.py`. Responds to
"Why This Story Risks Failing as a Commercial Feature Film" and to
`story/CRAFT_REVIEW.md`, which that report is drawn from.*
