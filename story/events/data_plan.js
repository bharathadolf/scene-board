const L = require('./lib');
const OUT = '/home/claude/story_events/';
const c = [];
L.titleBlock(c, 'CRAFT REFERENCE 13', 'Data Refinement Plan', 'What in the existing story data is not yet good enough for the Story Measurement Framework, and how to fix it');
c.push(L.note('Labels. FRAMEWORK = a criterion ID from document 11. HEURISTIC = my working rule. ADAPTATION = an invention or suggestion for the film, not in the source. “Found” means I looked at the event files and catalogues in this project and saw it; it is a finding about the files, not about the Bhāgavata.'));

// ---------- 1
c.push(L.h1('1. Verdict'));
c.push(L.p('The data is strong where it was designed to be strong: the events are gathered, anchored to verses or your files, labelled by how reliable each item is, and cross-linked to the Manthana and to the world-welfare ledger. It is weak where the framework needs it to be strong: the data is arranged by event and by beat, but measurement works on premise, protagonist, scenes and runtime. Four things block scoring altogether (the premise, the protagonist’s flaw and need, the opponent, and a chosen runtime). The rest is a matter of adding fields to what already exists.'));
c.push(L.p('Nothing needs to be thrown away. The plan below adds fields, fixes a few inconsistencies, and asks you for ten decisions.'));

// ---------- 2
c.push(L.h1('2. What the data already does well'));
c.push(L.tbl(['Strength', 'Where', 'Why it helps measurement'], [
  ['Every beat has an anchor and a reliability label', 'Event files; catalogues (TEXT, SOURCE, TRADITION, ADAPTATION)', 'Lets you separate what is in the tradition from what you invented (E6, mythic layer F4).'],
  ['Rukmini’s 17-step emotional ladder', 'Catalogue 10, section 2', 'A ready spine for her arc (B2, B3, G2). Needs value axes (doc 12, section 4).'],
  ['Intensity and silent ratings per beat', 'Catalogues 09 and 10', 'Support the intensity curve (G2) and silent-capable count (G4).'],
  ['“Who speaks of Krishna” tables', 'Every event file', 'Directly serve H4 (talk about the unseen).'],
  ['World-welfare ledger', 'File 08', 'Serves I4; the ordinary figures can also be planted and paid off (E5).'],
  ['Opening and closing material for the Manthana link', 'Event files, “links” sections', 'Starting point for I5 and F4.'],
  ['Open questions and cautions per event', 'Event files', 'Already lists many decisions that doc 13 gathers below.']
], [2900, 2700, 4038]));
c.push(L.gap());

// ---------- 3 readiness
c.push(L.h1('3. Readiness against the 47 criteria'));
c.push(L.p('For each criterion in document 11: Ready means the data can be scored now; Partial means some of what it needs exists; Missing means the data does not exist yet. “Fix” points to a section here.'));
const R = [
  ['A1', 'Partial', 'Theme is clear; no one-sentence premise.', 'Decision 3, section 8'],
  ['A2', 'Missing', 'No controlling idea. Candidates in section 8.', 'Decision 4'],
  ['A3', 'Missing', 'No logline.', 'Write after A1 and A2'],
  ['A4', 'Missing', 'No value tag per scene or beat.', 'Field “Value axis” (section 5)'],
  ['B1', 'Partial', 'Want is in the text (Krishna, not Śiśupāla); needs a stated finish line.', 'Section 6.1'],
  ['B2', 'Missing', 'No flaw or need defined.', 'Decision 3'],
  ['B3', 'Partial', 'Her acts are listed (write, walk out, plea) but not mapped to the major turns.', 'Field “Turn caused by” (section 5)'],
  ['B4', 'Missing', 'Needs B2.', 'Opening and closing behaviour pair, section 8'],
  ['B5', 'Partial', 'Ladder steps 1 to 3; no scene yet.', 'Doc 12, scenes S1 and S2'],
  ['B6', 'Missing', 'Costs of her choices are not recorded.', 'Field “Cost” (section 5)'],
  ['C1', 'Partial', 'Layers exist but are not tagged to beats.', 'Field “Opposition layer”'],
  ['C2', 'Partial', 'Opponents’ power versus hers is not stated.', 'Section 6.3'],
  ['C3', 'Partial', 'Rukmī and Śiśupāla have logic in your files; Jarasandha has less.', 'Light-source register (section 7)'],
  ['D1', 'Ready', 'D06-b is the candidate; needs a runtime to test the window.', 'Decision 1'],
  ['D2', 'Ready', 'D06-c and D06-d.', 'Decision 1'],
  ['D3', 'Missing', 'No midpoint chosen.', 'Section 6.4'],
  ['D4', 'Partial', 'No escalation order across events.', 'Field “Story-time order” and “Telling order”'],
  ['D5', 'Partial', 'D06-i, D06-l candidates.', 'Doc 12, scene S7'],
  ['D6', 'Partial', 'Agency risk flagged; mitigation (the letter’s plan) is not marked in the beats.', 'Plant register, section 7'],
  ['D7', 'Ready', 'D06-n (first sight).', '—'],
  ['D8', 'Partial', 'D07 beats exist; no opening image.', 'Decision 8'],
  ['D9', 'Missing', 'No runtime chosen; no minute positions.', 'Decision 1'],
  ['E1', 'Missing', 'No charge fields.', 'Field “Charge in / out”'],
  ['E2', 'Partial', 'Implied in beat text; not stated.', 'Field “Want / obstacle”'],
  ['E3', 'Missing', 'No gaps recorded.', 'Field “Gap”'],
  ['E4', 'Missing', 'No sequence assignment.', 'Field “Sequence”'],
  ['E5', 'Partial', 'Some plants noted in event files; no register.', 'Plant register'],
  ['E6', 'Missing', 'Cannot test before a cut exists.', 'After doc 12 scenes are drafted'],
  ['E7', 'Missing', 'Per scene card.', 'Doc 12'],
  ['F1', 'Missing', 'Theme not yet stated or placed.', 'Decision 4'],
  ['F2', 'Ready', 'Manthana and the Balarama/Rukmī/Śiśupāla files can act as B stories.', 'Name the B story'],
  ['F3', 'Partial', 'Closing image is D07-d; opening image undecided.', 'Decision 8'],
  ['F4', 'Partial', 'Parallels sit in each event file; no master map.', 'Section 7 parallels'],
  ['G1', 'Partial', 'Rasa coverage inferred by me; not a field on any beat.', 'Field “Rasa”'],
  ['G2', 'Partial', 'Intensity values exist; not calibrated or ordered by film position.', 'Section 6.5'],
  ['G3', 'Missing', 'No record of what the audience knows when.', 'Field “Audience knows”'],
  ['G4', 'Ready', 'S / D flag exists.', 'Section 6.6 for a third value'],
  ['H1', 'Missing', 'No dialogue yet.', 'After scene cards'],
  ['H2', 'Partial', 'Report scenes exist; not yet built to include conflict.', 'Doc 12, section 6'],
  ['H3', 'Missing', 'No voice notes per character.', 'Light-source register'],
  ['H4', 'Ready', 'Talk tables per event; merge into one list.', 'Section 7'],
  ['I1', 'Partial', 'POV recorded only for Event 06.', 'Field “POV”'],
  ['I2', 'Partial', 'Event files describe Krishna’s presence in words; catalogues do not tag it.', 'Field “Krishna tag”'],
  ['I3', 'Partial', 'Carriers listed per event, not per beat.', 'Field “Carrier”'],
  ['I4', 'Ready', 'Ledger complete per event.', '—'],
  ['I5', 'Partial', 'See F4.', 'Section 7 parallels'],
  ['I6', 'Ready', 'Rule recorded; D07 beats comply.', '—']
];
c.push(L.tbl(['ID', 'Status', 'What is there / what is missing', 'Fix'], R, [650, 1050, 5088, 2850]));
c.push(L.gap());
const cnt = s => R.filter(r => r[1] === s).length;
c.push(L.p(`**Tally.** ${R.length} criteria: ${cnt('Ready')} ready, ${cnt('Partial')} partial, ${cnt('Missing')} missing. This is a count of data readiness, not a score of the story. The “Ready” ones can be scored now; the others will score 0 or 1 until the data exists.`));

// ---------- 4 problems found
c.push(L.h1('4. Specific problems found in the files'));
c.push(L.tbl(['#', 'Problem', 'Evidence', 'Effect', 'Fix'], [
  ['1', 'IDs disagree between catalogue tables', 'In catalogue 10 the main table lists D06-o as “The lift” and D06-t as “The plea”, but the peaks table uses D06-o for “Silence, first sight, the lift” and D06-t for “Oath, duel, plea”. D08-c is named differently in the two tables.', 'A scene card citing an ID could point to different beats.', 'Make the main table the master. Give peaks their own IDs (P-01…) that list the master IDs they combine.'],
  ['2', 'Two ID schemes and no crosswalk', 'Catalogues use D/A IDs; event files use verse references only (“TEXT 10.52.23”).', 'A beat in an event file cannot be traced to its catalogue entry.', 'Add a Beat ID column to every event file’s beat table; one ID per row.'],
  ['3', 'Krishna’s presence is prose, not data', 'Event 06 has a “Krishna on screen” column in words; catalogues have none.', 'I2 cannot be counted.', 'One controlled vocabulary (doc 12, section 5) on every beat.'],
  ['4', 'Story order and telling order are not separated', 'Dvārakā is founded before the cave in the text, but Event 03 ends with the burning-hill chase that comes after Event 05.', 'D4 and D9 cannot be tested; the order of events is ambiguous.', 'Two columns: story-time order and telling order. Split Event 03 into 03a (before the cave) and 03b (the hill).'],
  ['5', 'Intensity is judged, not calibrated', 'Ratings 1 to 5 describe meaning but have no named anchors.', 'G2 depends on consistent ratings.', 'Fix three anchor beats (a 1, a 3, a 5) and rate the rest against them. Section 6.5.'],
  ['6', 'Silent is a yes or no', 'Letter, oath and plea are marked D, but each can be shown in action.', 'G4 under-counts.', 'Add a third value, P (partly), and a note on how to stage it.'],
  ['7', 'Reliability of some items is not confirmed', 'Not confirmed in the check: what Krishna finally grants Mucukunda (the summary stopped at 10.51.59); the “ninety miles” height of the leap; whether the Mucukunda chase is the “eighteenth” attack. Verse numbers may be off by one.', 'A scene could rest on a detail that is wrong.', 'Verification log (section 7); settle these before the item goes into a scene.'],
  ['8', 'Rukmini’s inner life is inferred', 'The ladder’s states beyond what the verse says are my inference.', 'Her arc (B2, B4) rests on inference.', 'Mark each ladder step TEXT or ADAPTATION; define flaw and need explicitly.'],
  ['9', 'Hidden-Krishna rule conflicts with the text at three points', 'The Brahmin, Bhīṣmaka and the citizens meet Krishna before Rukmini does (10.52.27 to 10.52.36; 10.53.31 to 10.53.38).', 'Without a rule, each scene staging improvises.', 'Decision 6.'],
  ['10', 'Stray tokens in a source file', 'The Shishupala file you supplied contains stray “fileciteturn…/citeturn…” strings, which I flagged earlier. I did not find them in the event-file build scripts, but they must not be copied into scene text.', 'Junk text in dialogue or labels.', 'Clean the source file; search for “cite” before quoting from it.'],
  ['11', 'Welfare figures have no return visits', 'Ledger gives one ordinary person per event.', 'E5 needs setup and payoff; a single appearance is only a setup.', 'Add “appears again in…” for each figure (section 7 plants).'],
  ['12', 'No premise, flaw, opponent or runtime', 'See section 3.', 'Gates 1 and 2 cannot pass.', 'Decisions 1 to 4.'],
  ['13', 'Humour absent', 'The rasa check found no hāsya in the gathered material.', 'G1 may fall below four strong rasas for the right reason or the wrong one.', 'Decision 5.'],
  ['14', 'Antagonist spread over four people', 'Rukmī, Śiśupāla, Jarasandha and the kings each oppose; no one is marked primary.', 'C1 to C3 are blurred.', 'Decision 2.']
], [450, 2000, 3238, 1800, 2150]));
c.push(L.gap());

// ---------- 5 master beat sheet
c.push(L.h1('5. A master beat sheet: the fields to add'));
c.push(L.p('One table, one row per beat, replacing the separate lists. The first group already exists; the others are what the framework needs. Fill group B first, because it unblocks the most criteria.'));
c.push(L.tbl(['Group', 'Field', 'Allowed values or form', 'Framework'], [
  ['A. Exists', 'Beat ID', 'One scheme, for example E06-014, plus the old D/A ID', 'Traceability'],
  ['A. Exists', 'Event; anchor; reliability label', 'TEXT (checked), TEXT (unchecked), SOURCE, TRADITION, ADAPTATION', 'E6, F4'],
  ['A. Exists', 'Beat summary', 'One or two sentences', '—'],
  ['A. Exists', 'Scale; intensity; silent', 'S1 to S4; 1 to 5; S / P / D', 'G2, G4'],
  ['B. Unblocks most', 'Story-time order; telling order', 'Integers; the second left blank until the plot is built', 'D4, D9'],
  ['B. Unblocks most', 'POV', 'R (Rukmini) or the character’s name', 'I1'],
  ['B. Unblocks most', 'Krishna tag', 'Not present / spoken of direct / spoken of indirect / effect / shadow or sound / hands / reflection / face', 'I2'],
  ['B. Unblocks most', 'Value axis; charge in; charge out', 'For example freedom / control; + ; −', 'E1, A4'],
  ['B. Unblocks most', 'Rukmini present', 'Yes / reported / no', 'I1, B3'],
  ['C. Conflict', 'Want / obstacle', 'One line each', 'E2'],
  ['C. Conflict', 'Turn; gap', 'One line each', 'E1, E3'],
  ['C. Conflict', 'Turn caused by', 'Rukmini / other / event', 'B3'],
  ['C. Conflict', 'Cost to the protagonist', 'One line', 'B6'],
  ['C. Conflict', 'Opposition layer', 'Inner / personal / social / larger force', 'C1'],
  ['D. Texture', 'Rasa', 'One of the nine; dominant only', 'G1'],
  ['D. Texture', 'Audience knows', 'What the audience knows that Rukmini does not, or the reverse', 'G3'],
  ['D. Texture', 'Carrier; welfare figure; Manthana parallel', 'Names from the event files and ledger', 'I3, I4, I5'],
  ['E. Plan', 'Sequence; minute window', 'Filled after runtime is chosen', 'D9, E4'],
  ['E. Plan', 'Plants; payoffs', 'IDs from the plant register', 'E5']
], [1700, 2800, 3438, 1700]));
c.push(L.gap());

// ---------- 6 refined
c.push(L.h1('6. Refined data: what to decide, with worked examples'));
c.push(L.h2('6.1 The protagonist’s want, restated as an action (B1)'));
c.push(L.p('Source says she wants to be Krishna’s wife and not Śiśupāla’s. A measurable want has a finish line. Suggested form: “Reach Krishna with her choice before the wedding hour, and be taken from the temple on her own plan.” ADAPTATION. The letter supplies the plan (10.52.41 to 10.52.42), so the finish line is hers.'));
c.push(L.h2('6.2 Sample refined rows'));
c.push(L.p('Twelve beats from Event 06 in the new format. Every value here is a proposal (ADAPTATION) except the anchors; they show what a filled row looks like. Columns: beat; value and charge; rasa, intensity and silent; Krishna tag; carrier, parallel or welfare link.'));
c.push(L.tbl(['Beat', 'Value; charge in → out', 'Rasa · I · Sil.', 'Krishna tag', 'Carrier / link'], [
  ['D06-a She hears, and she knows (10.52.23)', 'Open / closed: closed (−) → longing (+)', 'Śṛṅgāra · 3 · S', 'Spoken of, indirect', 'Visitors and bards'],
  ['D06-b The brother overrides (10.52.25)', 'Freedom / control: free (+) → overridden (−)', 'Karuṇa · 4 · P', 'Spoken of, direct (hostile)', 'Rukmī'],
  ['D06-c, d The decision and the letter (10.52.26; 10.52.37 to 10.52.43)', 'Safety / exposure: hidden (+) → staked (−); agency (−) → (+)', 'Śṛṅgāra · 4 · P', 'Addressed in the letter', 'The Brahmin; Lakṣmī’s choice (D01-f)'],
  ['D06-e The Brahmin’s report (10.52.27 to 10.52.36)', 'Hope / despair: dread (−) → relief (+)', 'Adbhuta, Hāsya possible · 3 · P', 'Spoken of, direct; hands', 'The Brahmin'],
  ['D06-f The bride is made ready (10.53.7 to 10.53.13)', 'Freedom / control: (−) → (−−) plus a flicker of defiance', 'Karuṇa · 2 · S', 'Not present', 'Women of the palace; Bhīṣmaka'],
  ['D06-g The kings gather and swear (10.53.14 to 10.53.19)', 'Safety of others: calm (+) → fear (−)', 'Bhayānaka · 4 · P', 'Spoken of, direct (hostile)', 'Kings; Jarasandha'],
  ['D06-i The waiting (10.53.22 to 10.53.26)', 'Hope / despair: hope (+) → dread (−)', 'Bhayānaka · 4 · S', 'Not present', 'Her own mind'],
  ['D06-j The omens turn (10.53.27 to 10.53.30)', 'Hope / despair: dread (−) → relief (+)', 'Śṛṅgāra · 3 · S', 'Spoken of, direct', 'The Brahmin'],
  ['D06-l The prayer to Ambikā (10.53.39 to 10.53.49)', 'Fear / resolve: afraid (−) → resolved (+)', 'Śānta · 3 · S', 'Spoken of (in prayer)', 'Ambikā; Śiva’s poison parallel (D01-e)'],
  ['D06-m Breaking her silence (10.53.50 to 10.53.51)', 'Voice / silence: silent (−) → public (+)', 'Vīra · 4 · S', 'Not present', 'The kings'],
  ['D06-n First sight (10.53.52)', 'Known / unknown: unknown (−) → known (+)', 'Śṛṅgāra, Adbhuta · 5 · S', 'Face (first)', 'None'],
  ['D06-t The plea (10.54.32 to 10.54.34)', 'Mercy / vengeance: fear (−) → mercy won (+)', 'Karuṇa · 5 · P', 'Face', 'Her second decisive act']
], [2800, 2400, 1500, 1438, 1500]));
c.push(L.gap());
c.push(L.p('Ranges for the verse numbers are those in the existing files; I did not re-check them for this table. Rasa labels are my reading of the beat, not in the source.'));
c.push(L.h2('6.3 Strengthening the opposition (C1, C2)'));
c.push(L.p('Make Rukmī the primary opponent and the other three pressure on him and her. He is personal (brother), he has a logic you already have in the Rukmi file, he is present in both halves (the hall and the duel), and he is the one she must save at the end. That gives the film a single face of opposition that is also a cost to her. Jarasandha, Śiśupāla and the kings become the social layer; the hundred offences and the seventeen attacks become the clock. ADAPTATION; see decision 2.'));
c.push(L.h2('6.4 Finding a midpoint (D3)'));
c.push(L.p('The gathered events do not contain an obvious midpoint reversal for Rukmini. Candidates to test: (a) the Brahmin’s return with Krishna’s promise, a false victory that lifts her and raises the stakes; (b) the coalition’s vow, a false defeat. A false victory is stronger here because it makes the low point (the waiting) hurt more. These are options, not a recommendation to adopt.'));
c.push(L.h2('6.5 Calibrating intensity (G2)'));
c.push(L.tbl(['Anchor', 'Beat', 'Why'], [
  ['1', 'D06-f The bride is made ready', 'Quiet pressure; no one threatened.'],
  ['3', 'D06-e The Brahmin’s report', 'A strong scene with no physical danger.'],
  ['5', 'D06-n First sight', 'The peak the whole film delays.']
], [1000, 3500, 5138]));
c.push(L.p('Re-rate every other beat by asking: is it nearer a 1, a 3 or a 5? Then re-order the film’s beats by position and look at the curve. HEURISTIC: flag any run of four or more beats at 4 or 5 without a 2 between.'));
c.push(L.h2('6.6 Silent: S, P or D (G4)'));
c.push(L.p('S: the beat works with no spoken line. P: it works in action but loses detail without speech (the letter becomes writing, sealing and handing over). D: it depends on a speech (Jarasandha’s consolation). Re-rate the beats marked D; many are P. Count S and P as silent-capable when you plan a silent variant.'));

// ---------- 7 registers
c.push(L.h1('7. Registers to add'));
c.push(L.p('Small tables that sit beside the master beat sheet. Each exists because a framework criterion needs a list that is not in any file today.'));
c.push(L.h2('7.1 Light-source register (illumination method; H3, C3, H4)'));
c.push(L.p('One row per character who lights Krishna. The palettes are from the earlier treatment; the rest are my initial entries to be corrected.'));
c.push(L.tbl(['Source', 'Light', 'What they reveal of Krishna', 'What they want / believe', 'Voice note (to fill)'], [
  ['Rukmini', 'Gold', 'The chosen one; borrowed light turning to sight', 'To choose and be chosen', '—'],
  ['Rukmī', 'Red torch', 'The hostile portrait: rival, upstart', 'Control, family honour, spite', '—'],
  ['Śiśupāla', 'Steel', 'The offended rival; offences counted by a mother’s bargain', 'Possession, status', '—'],
  ['Balarama', 'Silver', 'Brother’s loyalty and moral rebuke (the shaving)', 'Loyalty and justice', '—'],
  ['The kings', 'Grey', 'A threat to their honour', 'Face, alliance', '—'],
  ['Bhīṣmaka', 'Ochre', 'Hospitality and a father’s shifting loyalty', 'Peace; his son', '—'],
  ['The Brahmin', 'Candle', 'The intimate human portrait', 'Service; to be believed', '—'],
  ['The Ocean', 'Pearl', 'The scale of what he builds (Dvārakā)', '—', '—'],
  ['Krishna', 'Blue, withheld', 'Appears only from first sight', '—', '—']
], [1400, 1100, 3000, 2538, 1600]));
c.push(L.gap());
c.push(L.h2('7.2 Plant and payoff register (E5)'));
c.push(L.tbl(['Plant', 'Where planted', 'Payoff', 'Check'], [
  ['The letter’s plan: the day, the procession, taking her without harming her kin (10.52.41 to 10.52.42)', 'D06-d', 'The procession and the lift (D06-l to D06-o)', 'Keeps the climax hers (D6)'],
  ['Her vow of silence', 'Early (to be placed)', 'Broken at the temple (D06-m)', 'B4 behaviour pair'],
  ['Her left eye, arm and thigh', 'D06-j', 'The Brahmin’s arrival', 'Do not plant earlier than needed'],
  ['Lakṣmī’s garland (D01-f)', 'Manthana', 'Krishna’s lotus garland at Mathurā (10.50); the procession (ADAPTATION)', 'F4'],
  ['The chalk marks (seventeen attacks)', 'Event 03', 'A clean wall in the final city', 'Ledger figure returns'],
  ['The hundred offences', 'D08-c (optional)', 'The clock for Śiśupāla; pays off outside this film if Śiśupāla’s end is not shown', 'Decide whether the clock is used'],
  ['The sea she has never seen', 'Early talk of Dvārakā', 'D07-a, arrival', 'I6'],
  ['Ambikā’s shrine and Śiva’s poison', 'D01-e', 'The prayer (D06-l)', 'F4, I5']
], [3800, 1700, 2538, 1600]));
c.push(L.gap());
c.push(L.h2('7.3 Verification log'));
c.push(L.p('One row per item not confirmed: item, where it is used, what is known, what to check, who checks, status. Start with the three in problem 7, and re-check the verse numbering of every beat that will become a scene. Until an item is verified, use it only in a variant, or label the scene “ADAPTATION”.'));
c.push(L.h2('7.4 Props, motifs and places'));
c.push(L.p('A short list of recurring physical things (the letter, the garland, the chalk marks, the chariot, the sea) and places (Kuṇḍina, the temple, Dvārakā, the road). Each should say where it first appears and where it comes back, since a silent version relies on objects (G4).'));
c.push(L.h2('7.5 Parallel map (F4, I5)'));
c.push(L.p('One table with two columns: the Manthana image and the human beat it echoes. For example: the mountain sinking (D01-d) and the clock closing in (D06-i); Śiva taking the poison (D01-e) and Rukmini holding her fear; Lakṣmī’s choice (D01-f) and Rukmini’s. Mark each as planted (audience can feel it) or explained (audience is told); aim for planted.'));

// ---------- 8 decisions
c.push(L.h1('8. Decisions needed from you'));
c.push(L.p('Each has a default I would take if you want to move on; the default is a suggestion, not a ruling.'));
c.push(L.tbl(['#', 'Decision', 'Options', 'Suggested default'], [
  ['1', 'Runtime', '110, 120 or 150 minutes (or longer)', '120. Unblocks D9, scene counts and the face-time budget.'],
  ['2', 'Primary opponent', 'Rukmī / Śiśupāla / Jarasandha / the coalition', 'Rukmī, with the rest as pressure (section 6.3).'],
  ['3', 'Rukmini’s flaw and need', 'A. She protects everyone and must learn that a choice costs someone. B. She loves a figure built from others’ stories and must learn to see for herself. C. She listens in silence and must find her voice.', 'B for the inner journey, with C as the visible behaviour: she begins by listening to the songs and ends by speaking (the plea). All three are ADAPTATION; the text shows her as decisive, so keep the flaw modest.'],
  ['4', 'Controlling idea', 'i. A choice made before it is seen holds because the chooser stakes everything first. ii. Force can take a person; only a choice holds them. iii. The world is renewed when someone takes the poison for others.', 'Test (i) or (ii) for the human story and (iii) for the Manthana; they can sit together.'],
  ['5', 'Humour', 'None / a small thread (the Brahmin, a bard, a child)', 'A small thread, to give relief between peaks.'],
  ['6', 'Meetings with Krishna before the reveal', 'Always reported / shown with Krishna’s face hidden / shown fully', 'Always reported (doc 12, section 5).'],
  ['7', 'Telling order', 'Linear / framed by a bard or the Parīkṣit–Śuka frame / braided with the Manthana', 'Linear for Rukmini’s story with Manthana interludes; the bard as carrier.'],
  ['8', 'Opening and closing images', 'Free choice', 'Open with the Ocean; close with Rukmini and Krishna at the sea (D07-d). Answers each other (F3).'],
  ['9', 'Event 03 split', 'One block / split around the cave', 'Split (problem 4).'],
  ['10', 'Final episode length', 'Percent of runtime', 'About 3 to 4%, inside the resolution window.']
], [450, 2000, 3938, 3250]));
c.push(L.gap());

// ---------- 9 plan
c.push(L.h1('9. Order of work'));
c.push(L.tbl(['Pass', 'What', 'Unblocks', 'Effort'], [
  ['1 Decide', 'Decisions 1 to 4 and 6.', 'Gate 1 (A, B, C); D1, D2, D9', 'Small; this is where I need you'],
  ['2 Repair', 'Fix the ID conflicts; add Beat IDs to event files; split Event 03; clean the Shishupala source file.', 'Traceability; D4', 'Small'],
  ['3 Extend', 'Add group B fields to the master beat sheet for every beat; calibrate intensity; re-rate silent.', 'Gate 2 (D, F, I); E1; G2; G4; I1 to I3', 'Medium'],
  ['4 Register', 'Build the light-source, plant and parallel registers; start the verification log.', 'E5, F4, H3, H4', 'Medium'],
  ['5 Verify', 'Check the unconfirmed items and every verse number that will become a scene.', 'Safe use of anchors', 'Medium'],
  ['6 Cards', 'Write scene cards from the refined sheet (doc 12).', 'Gate 3', 'Large']
], [1300, 4338, 2500, 1500]));
c.push(L.gap());
c.push(L.p('I can do passes 2 to 5 myself once you settle pass 1. Decisions 1 to 4 are the only ones I would not guess on your behalf.'));

// ---------- 10 limits
c.push(L.h1('10. Limits'));
['This audit is of the files in this project. It is not a verse-by-verse check of the Bhāgavata.',
  'The readiness statuses are my judgement of whether the data can be scored; another reader might rate some differently.',
  'The sample rows, axes, rasa labels and the suggested defaults are proposals. They are meant to be corrected.',
  'The screenwriting framework is a measuring tool, not a rule. If a measure pushes the story the wrong way, change the measure and say why.'].forEach(t => c.push(L.bl(t)));

L.save(L.makeDoc('Data Refinement Plan', 'Data Refinement Plan', c), OUT + '13_Data_Refinement_Plan.docx');
