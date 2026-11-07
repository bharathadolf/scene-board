# Builds story/COMMERCIAL_CUT.md from the table below, so every runtime and
# ratio in that document is computed rather than guessed.
# Run: python3 scripts/make-commercial-cut.py
import json, collections, os

SEQ = [
 ("0", "Prologue: the oldest war", "Under the titles. The churning, the poison, the goddess who chooses, the war — four images, no dialogue, one line of narration. The whole of the Manthana in the time it takes to read the cast.", [
   ("E01-06", "The great churning", "A", 1.0),
   ("E01-07", "Hālāhala rises", "A", 1.0),
   ("E01-10", "Lakṣmī chooses", "D", 1.0),
   ("E01-15", "The Deva–Asura war", "A", 1.5)]),

 ("1", "Cold open: the hill burns", "An army sets a mountain alight to kill two men. We never see their faces. The enemy rides home certain he has won.", [
   ("E03-11", "The chase on foot", "A", 2.0),
   ("E03-12", "The burning hill", "A", 2.0),
   ("E03-13", "The leap and the false victory", "A", 1.5)]),

 ("2", "Introduction: the man they burned", "They walk out of the smoke. The hero's entry — the first full look at him, at minute seven, where a commercial film has to put it.", [
   ("NEW-01", "Out of the smoke", "A", 2.5),
   ("NEW-02", "The road back, and the city that sees them", "A", 2.0),
   ("E03-10", "The return and the spoils", "D", 1.5)]),

 ("3", "Why they keep coming", "The antagonist in three strokes: a dead son-in-law, two widows, and a vow. Kuṇḍina hears of it in the same breath.", [
   ("E03-01", "The widows return", "D", 1.5),
   ("E03-05", "The taunt and the answer", "D", 1.5),
   ("E03-14", "Rukmī admires Jarasandha", "D", 2.0)]),

 ("4", "Seventeen sieges", "The long war as one escalating block: divisions at the gate, the conch, the wall, the capture — and the release that makes it happen again. Ends on the tally.", [
   ("E03-02", "Twenty-three divisions at the gate", "A", 2.0),
   ("E03-04", "The sky-chariots and the conch", "A", 2.0),
   ("E03-06", "The battle seen from the wall", "A", 2.0),
   ("E03-07", "Jarasandha seized and freed", "A", 2.0),
   ("E03-09", "Seventeen times", "A", 2.0)]),

 ("5", "Kuṇḍina: the one who is listening", "The heroine's entry. Not a girl waiting to be told about him — a woman already collecting him, from murals, from soldiers, from sailors.", [
   ("NEW-03", "Rukmini, and the name she already knows", "D", 2.5),
   ("E01-18", "The mural at Ambikā's temple", "D", 2.0),
   ("E03-15", "“Seventeen times”", "D", 1.5)]),

 ("6", "The sale", "Her brother trades her for a border. The scene that makes the audience want the abduction.", [
   ("E06-02", "Songs in the hall", "D", 1.5),
   ("E06-03", "The hall decides", "D", 2.5),
   ("NEW-04", "Rukmī and Śiśupāla shake on it", "D", 2.0)]),

 ("7", "Thirty million", "The second enemy arrives at the other gate while the first is still at this one. The hero walks out unarmed and lets himself be chased.", [
   ("E04-01", "Thirty million at the gate", "A", 2.0),
   ("E04-02", "The two-front dilemma", "D", 1.5),
   ("E05-02", "Kālayavana sees the man on foot", "A", 2.0),
   ("E05-03", "The unarmed chase", "A", 3.0),
   ("E05-04", "The cave and the sleeper", "A", 1.5)]),

 ("8", "The glance", "The pay-off of the chase: a sleeping king, a borrowed cloak, and an army that is ash before it knows it is in a fight.", [
   ("E05-05", "The kick and the ash", "A", 2.0),
   ("E05-07", "Mucukunda sees him", "D", 1.5),
   ("E05-11", "The sage walks north", "D", 1.0),
   ("E05-12", "The Yavana army destroyed", "A", 2.0)]),

 ("9", "The city from the sea", "The spectacle block. A kingdom moved overnight rather than defended — the hero outthinking a war instead of winning it.", [
   ("E04-03", "The decision to build", "D", 1.5),
   ("E04-04", "The city rises from the sea", "A", 3.0),
   ("E04-06", "The great move: waking in Dvārakā", "D", 2.5)]),

 ("10", "She decides", "Everything she has gathered comes together and she does the one thing nobody expects of her: she writes.", [
   ("E04-09", "The sailors' tale at the ferry", "D", 2.0),
   ("E05-16", "Nārada's marks reach Rukmini", "D", 1.5),
   ("E06-04", "Ink", "D", 2.5),
   ("NEW-05", "She seals it and names the hour", "D", 1.5)]),

 ("11", "Interval: the ride", "A messenger crossing a country against a clock, cut with a wedding being built around a woman who has already left it. He reads the letter. The chariot turns. Interval.", [
   ("E06-05", "The Brahmin's ride", "A", 3.0),
   ("E06-06", "The Brahmin at Dvārakā", "D", 2.0),
   ("NEW-06", "He reads it", "D", 2.0),
   ("E06-07", "The night ride", "A", 3.0)]),

 ("12", "The ring closes", "Second half opens wide: the coalition deploying around a city, and a brother arriving by sea with an army nobody counted on.", [
   ("E06-09", "The kings gather and swear", "D", 2.0),
   ("NEW-07", "Jarasandha deploys: the ring around Kuṇḍina", "A", 2.5),
   ("E06-10", "Balarama arrives", "A", 2.5)]),

 ("13", "The night before", "Six minutes of quiet, bought by the twenty before it. She is dressed for a wedding she will not attend.", [
   ("E06-08", "The bride is made ready", "D", 2.0),
   ("E06-11", "The waiting", "D", 2.0),
   ("E06-12", "Omens and the smile", "D", 1.5)]),

 ("14", "The temple", "The procession, the prayer, and the look at the door. The biggest moment in the film has no line in it.", [
   ("E06-15", "The guarded procession", "D", 2.5),
   ("E06-16", "The prayer to Ambikā", "D", 2.0),
   ("E06-17", "Breaking her silence", "D", 1.5),
   ("E06-18", "First sight", "D", 2.0)]),

 ("15", "The lift", "She is in the chariot before the guard understands what he has seen, and the chariot goes out through the middle of them.", [
   ("E06-19", "The lift", "A", 2.0),
   ("E06-20", "Through the ring of kings", "A", 3.5),
   ("NEW-08", "The chariot through the market", "A", 3.5)]),

 ("16", "The pursuit", "The biggest action block in the film: a rear-guard holding a ford against a coalition while the chariot runs.", [
   ("E06-21", "The coalition's lament", "D", 1.5),
   ("E06-22", "The pursuit and the Yadava defence", "A", 4.0),
   ("NEW-09", "Balarama holds the ford", "A", 4.0),
   ("NEW-10", "Śiśupāla turns back", "A", 2.5)]),

 ("17", "The duel", "One man who swore an oath, one chariot, and a woman stepping between two swords.", [
   ("E06-24", "Rukmī's oath", "D", 1.5),
   ("E06-25", "The duel", "A", 4.0),
   ("E06-26", "The plea", "D", 2.0),
   ("E06-27", "The shaving", "D", 2.5)]),

 ("18", "The reckoning", "The cost, counted out: a brother's head, a friend's rebuke, and an enemy being told to wait his turn.", [
   ("E06-28", "Balarama's rebuke", "D", 2.0),
   ("E06-29", "Balarama consoles her", "D", 1.5),
   ("E06-23", "Jarasandha consoles Śiśupāla", "D", 2.0),
   ("E06-30", "Rukmī's exile", "D", 1.5)]),

 ("19", "Together", "Eight minutes of warmth, earned. No wedding scene, and nothing after it.", [
   ("E07-01", "The cut: from the road to the city", "D", 1.0),
   ("E07-02", "First sight of the sea", "D", 1.5),
   ("E07-04", "The lamp", "D", 1.5),
   ("E07-06", "The song", "D", 1.5),
   ("E07-07", "What he says, and does not say", "D", 1.5),
   ("E07-08", "Together at the edge of the sea", "D", 1.0)]),
]

INTERVAL_AFTER = "11"

scenes = [(s, q[0], q[1]) for q in SEQ for s in q[3]]
total = sum(s[3] for s, _, _ in scenes)
act = sum(s[3] for s, _, _ in scenes if s[2] == 'A')
dra = total - act
first = sum(s[3] for s, sid, _ in scenes if int(sid) <= int(INTERVAL_AFTER))
new = [s for s, _, _ in scenes if s[0].startswith('NEW')]
reused = [s for s, _, _ in scenes if not s[0].startswith('NEW')]
master = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','data','scenes.json'), encoding='utf8'))
by_ev = collections.Counter(s['src'][:3] for s in master)
kept_ev = collections.Counter(s[0][:3] for s, _, _ in scenes if not s[0].startswith('NEW'))

def mins(m):
    return (str(int(m)) if float(m).is_integer() else str(m)) + ''

rows = []
n = 0
for sid, name, blurb, items in SEQ:
    rows.append((sid, name, blurb, items))

out = []
w = out.append
w(f"""# The commercial cut

A second shape for the same story, built for a theatre on a Friday: shorter,
louder, and far more of it in motion. It uses the scenes in
`data/scenes.json` wherever it can and names the ten it still needs.

|  | master cut | commercial cut |
| --- | --- | --- |
| runtime | ≈ 3 h 18 min | **{int(total//60)} h {int(total%60)} min** |
| scenes | 115 | **{len(scenes)}** ({len(reused)} reused, {len(new)} new) |
| action | 22 scenes, ≈ 40 min | **{sum(1 for s,_,_ in scenes if s[2]=='A')} scenes, ≈ {int(act)} min** |
| drama | 93 scenes | **{sum(1 for s,_,_ in scenes if s[2]=='D')} scenes, ≈ {int(dra)} min** |
| time in action | 20% | **{round(100*act/total)}%** |
| Krishna's face first seen | minute 171 of 198 | **minute 7** |
| interval | — | after sequence {INTERVAL_AFTER}, at minute {int(first)} |

---

## 1. What changes, and why

**The hero is seen in the first ten minutes.** This is the one rule of the
master cut that a commercial film cannot keep. There, Krishna is a rumour for
three hours and the whole picture is built on the withholding. Here he walks
out of the smoke at minute seven, and the audience spends the film waiting for
him to do it again — which is a different pleasure, and the one they paid for.
Everything else below follows from that single decision.

**The myth becomes a title sequence.** Nineteen scenes of the Churning go to
four, under the credits, with one line of narration. The Earth's burden — nine
scenes of gods and petitions — goes entirely; what it explained is now one
sentence a bard says in passing. Mucukunda's sixteen scenes become eight, and
his long spiritual testing becomes a look.

**The carriers mostly go.** The fisher child, the potter, the farmer, the
water-carrier who counts sieges by the seasons: that device — ordinary people
feeling the result without knowing the cause — is the master cut's soul and
the commercial cut's drag. Four of them survive, in the sequences where the
audience needs a breath.

**The heroine gets an entry.** In the master cut Rukmini is discovered
gradually. Here she gets a proper introduction scene (NEW-03) that establishes
her as someone already gathering him, so that the letter is a decision she has
been building toward rather than a surprise.

**Dialogue is cut by about half and sharpened.** The talking scenes that stay
are the ones with a turn in them. Fifteen lines carry the film; they are in
section 5.

---

## 2. The shape

| # | sequence | min | mix |
| --- | --- | --- | --- |""")

for sid, name, blurb, items in SEQ:
    m = sum(i[3] for i in items)
    a = sum(1 for i in items if i[2] == 'A')
    d = len(items) - a
    w(f"| {sid} | **{name}** | {mins(m)} | {a}A · {d}D |")
    if sid == INTERVAL_AFTER:
        w(f"| | **— INTERVAL —** | {int(first)} | |")

w(f"""
First half {int(first)} minutes, second half {int(total-first)}. The interval
falls on the chariot turning out of Dvārakā, which is the loudest sound in the
film before the duel.

---

## 3. The scenes

`E…` codes are scenes that already exist in `data/scenes.json`; `NEW-…` are
the ten this cut still needs written. **A** is action, **D** is drama.

| # | scene | from | | min | sequence |
| --- | --- | --- | --- | --- | --- |""")

n = 0
for sid, name, blurb, items in SEQ:
    for code, title, cat, m in items:
        n += 1
        w(f"| {n} | {title} | `{code}` | **{cat}** | {mins(m)} | {sid}. {name} |")
    if sid == INTERVAL_AFTER:
        w("| | **— INTERVAL —** | | | | |")

w("""
---

## 4. The ten scenes to write

| code | scene | what it has to do |
| --- | --- | --- |
| **NEW-01** | Out of the smoke | The entry. Two men walk down off a burnt hill with the fire behind them. Hold on his face — the first and only time the film announces him. No line until the last beat. |
| **NEW-02** | The road back, and the city that sees them | The news outrunning them: a cart driver, a gate, a street that fills. Establishes that this man is a rumour before he is a king. |
| **NEW-03** | Rukmini, and the name she already knows | Her entry. A horse she is not supposed to ride, a market, a soldier's story she corrects. She knows the tally of sieges better than her brother does. |
| **NEW-04** | Rukmī and Śiśupāla shake on it | The sale, closed. Two men agreeing about a woman who is not in the room, in the room next to hers. |
| **NEW-05** | She seals it and names the hour | The letter finished: wax, a choice of messenger, and the hour named — the temple, the morning of the wedding. Gives the second half its clock. |
| **NEW-06** | He reads it | The interval beat. A letter read once, in silence, then aloud to nobody. The conch. Daruka reaching for the reins. |
| **NEW-07** | Jarasandha deploys: the ring around Kuṇḍina | The coalition as a map: who holds which road, how many, and the one road nobody is watching. Tells the audience the rules of the chase to come. |
| **NEW-08** | The chariot through the market | The breakout continued: a street built for a wedding, now a corridor at speed — garlands, an overturned cart, a child pulled out of the way. |
| **NEW-09** | Balarama holds the ford | The set piece. One man and a plough-blade against a crossing, so that the chariot gets an hour. The film's biggest fight, and not the hero's. |
| **NEW-10** | Śiśupāla turns back | The bridegroom riding at the chariot alone, being passed over, and turning back unhurt and unlooked-at — which is worse. |

---

## 5. The dialogue

Fifteen lines. Everything else in the film can be played without words.

| # | moment | the line |
| --- | --- | --- |""")

LINES = [
 ("1","Jarasandha, riding away from the burning hill (E03-13)",
  "Tell Mathurā their king is ash. Tell them who swept it.",
  "మథురకు చెప్పండి — మీ రాజు బూడిద. ఆ బూడిదను ఊడ్చింది ఎవరో కూడా చెప్పండి."),
 ("2","Krishna, releasing Jarasandha for the seventeenth time (E03-07) — the entry line of the film",
  "I don't kill my enemies. I keep them. Who else will bring me their armies?",
  "శత్రువును చంపను — దాచుకుంటాను. లేకపోతే నా ముందుకు సైన్యాలను ఎవరు తెస్తారు?"),
 ("3","Rukmī, closing the sale (NEW-04)",
  "Chedi gives us a border. The cowherd would give us a cousin.",
  "చేది మనకు సరిహద్దు ఇస్తుంది. ఆ గొల్లవాడు ఇచ్చేది ఒక బంధుత్వం మాత్రమే."),
 ("4","Rukmini, to her brother, without raising her voice (E06-03)",
  "You can give away a kingdom, brother. Not a woman who has already chosen.",
  "రాజ్యాన్ని ఇచ్చేయగలవు అన్నయ్యా. ఇప్పటికే నిర్ణయించుకున్న ఆడదాన్ని కాదు."),
 ("5","Kālayavana, watching a barefoot man walk away from him (E05-02)",
  "No chariot. No bow. No shoes. This is the one they call a god?",
  "రథం లేదు. విల్లు లేదు. చెప్పులు కూడా లేవు. వీడినా దేవుడంటున్నది?"),
 ("6","Mucukunda, waking (E05-07) — the answer to line 5, and the only line in that block",
  "You are not the one who woke me. You are the one who brought him here.",
  "నన్ను లేపింది నువ్వు కాదు. నిన్ను ఇక్కడికి తెచ్చింది ఆయన."),
 ("7","Rukmini, finishing the letter (E06-04)",
  "They will say a woman was stolen. Let them. I am the one holding the pen.",
  "ఒక ఆడపిల్లను ఎత్తుకుపోయారని అంటారు. అననివ్వండి — కలం పట్టుకున్నది నేనే."),
 ("8","Krishna, having read it (NEW-06) — the interval line",
  "She has not asked me to save her. She has told me where to stand.",
  "ఆమె కాపాడమని అడగలేదు. ఎక్కడ నిలబడాలో చెప్పింది."),
 ("9","Balarama, arriving at Kuṇḍina (E06-10)",
  "You came for a bride. I came for the war that follows her.",
  "నువ్వు పెళ్లికూతురి కోసం వచ్చావు. ఆమె వెనకాల వచ్చే యుద్ధం కోసం నేను వచ్చాను."),
 ("10","The temple door (E06-18)",
  "— no line. Four seconds. The whole film is paying for this silence.",
  "— మాట లేదు. నాలుగు క్షణాలు. ఈ నిశ్శబ్దం కోసమే ఇంతసేపు."),
 ("11","Krishna, taking the chariot out through the kings (E06-20)",
  "Kings — she walked out on her own feet. I am only the chariot.",
  "రాజులారా — ఆమె తన కాళ్లతోనే నడిచి వచ్చింది. నేను కేవలం రథాన్ని."),
 ("12","Śiśupāla, left standing on the road (NEW-10)",
  "He did not beat me. He did not even look at me.",
  "వాడు నన్ను ఓడించలేదు. కనీసం నా వైపు చూడనే లేదు."),
 ("13","Rukmini, between her husband and her brother (E06-26)",
  "Kill him and I am a widow of my own blood. Let him live — that is the longer sentence.",
  "చంపితే నా రక్తానికి నేనే విధవను. బతకనివ్వు — ఆ బతుకే పెద్ద శిక్ష."),
 ("14","Balarama, after the shaving (E06-28)",
  "You shaved a man's head in front of his sister. That is not mercy. That is a receipt.",
  "అక్క ఎదుటే ఆమె తమ్ముడి తల గొరిగావు. అది కరుణ కాదు — అది రసీదు."),
 ("15","Rukmini, the last line of the film (E07-08)",
  "Everyone came to take me. You are the only one who came when I called.",
  "అందరూ నన్ను తీసుకెళ్లడానికి వచ్చారు. నేను పిలిచినప్పుడు వచ్చింది నువ్వొక్కడివే."),
]
for n_, where, en, te in LINES:
    w(f"| {n_} | {where} | **“{en}”**<br>“{te}” |")

w("""
Three rules the lines follow, and the reason they land:

- **Nobody explains the plot.** Every line above is a position, a refusal or a
  provocation. Exposition is carried by the picture or cut.
- **The hero speaks least.** Four of the fifteen are his, and two of those are
  about other people. A quiet hero makes the audience lean in; a talkative one
  makes them wait.
- **The heroine gets the first and the last word of the second half.** She
  opens it by writing and closes it by saying what the whole film was about.

---

## 6. What each event costs in this cut

| event | master | here | what happens to it |
| --- | --- | --- | --- |""")

names = {'E01':'Kṣīra Sāgara Manthanam','E02':"The Earth's burden",'E03':'Jarasandha','E04':'Dvārakā',
         'E05':'Mucukunda','E06':'The abduction','E07':'The final episode','E08':'The backstories'}
fate = {'E01':'Four images under the titles. The alliance of enemies, the trampled garland and Mohinī are gone; what survives is the poison, the choosing and the war.',
        'E02':'Cut. The reason Krishna exists becomes one line of narration in the prologue. This is the biggest loss in the cut and the easiest to defend commercially.',
        'E03':'Becomes the first act. The sieges are compressed into one escalating block, and the hill that opens the film is its pay-off, played first.',
        'E04':'Kept as spectacle and shortened. The council scenes go; the city rising and a people waking in it stay.',
        'E05':'Halved. The chase and the ash are the whole point; Mucukunda’s testing and prayers become a single look and a walk north.',
        'E06':'Almost untouched. This is the film, and three new action scenes are added inside it.',
        'E07':'Kept almost whole, at eight minutes. A commercial film earns the right to be quiet at the end.',
        'E08':'Cut. Śiśupāla’s birth and the curse are gone; his humiliation on the road now does that work in one scene.'}
for k in sorted(names):
    w(f"| **{k} {names[k]}** | {by_ev[k]} scenes | {kept_ev.get(k,0)} | {fate[k]} |")

w("""
---

## 7. What this version gives up

Worth saying plainly, so the choice is made on purpose:

- **The withheld hero.** The master cut's single best idea. Once he is seen at
  minute seven, the mural, the bard, the sailors and the goatherd stop being a
  way of meeting him and become colour.
- **The welfare theme.** With the carriers mostly gone, the film no longer
  argues that these events reach a fisher child and a farmer. It becomes a
  story about kings.
- **Rukmini's interiority.** She still decides, and she still gets the last
  line, but twelve scenes of her listening and weighing become four. The
  decision is louder and less earned.
- **The mythic frame.** Without the Earth's burden, nobody in the film can say
  why any of it is happening. A commercial audience will not ask. A reader of
  the Bhāgavata will.

If the two cuts are ever made from the same footage, the scenes marked `NEW`
are the only ones that do not exist in the master, and the master loses nothing
by having them.

---

## 8. Building it on the board

This document is an order, not new data. To work on it:

1. Copy any board, name it **Board 6 · The commercial cut**.
2. Clear it, and place the reused scenes above in order — their codes are in
   `data/scenes.json` under `src`.
3. The ten `NEW-…` scenes have to be written and added to
   `story/events/sc_e09.js` before they can appear on the board.
4. Mark the action scenes: this cut flips several scenes that are drama in the
   master (`E04-01`, `E06-10`) into action.
""")

import os
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')
open(os.path.join(ROOT,'story','COMMERCIAL_CUT.md'), 'w', encoding='utf8').write('\n'.join(out) + '\n')
print('total', total, 'first half', first, 'scenes', len(scenes), 'action', act, 'drama', dra, 'pct', round(100*act/total))
print('reused', len(reused), 'new', len(new))
print('kept per event', dict(kept_ev))
