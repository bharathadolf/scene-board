const L = require('./lib');
const OUT = '/home/claude/story_events/';

const c = [];
L.titleBlock(c, 'CRAFT REFERENCE', 'Story Measurement Framework', 'A technical yardstick for building the story, drawn from the most recommended screenwriting books');
c.push(L.note('Labels. BOOK = drawn from the books named. HEURISTIC = a working rule for this project that I have set; it is not a rule in any book and you can change it. CHECKED = confirmed in this pass against a web source (listed in section 12). Everything else about the books comes from my own knowledge of them and was not re-checked page by page.'));

// ------------------------------------------------ 1
c.push(L.h1('1. Purpose and how to use'));
c.push(L.p('This document turns the main screenwriting books into measurements you can apply to the story as it is built. Instead of asking “is this good?”, you ask “does it pass this test, and by how much?”. It has five instruments:'));
['**A scorecard** of 47 criteria in nine groups, each scored 0 to 3 (section 5).',
  '**A timing table** that converts the books’ structure benchmarks into percentages and minutes for your runtime (section 4).',
  '**A scene card and a sequence card** to measure the story at small scale (sections 6 and 7).',
  '**A red-flag list** of the common failures the books warn about (section 8).',
  '**A calibration** that reads the current story-event files against the framework, so you can see what is already strong and what is open (section 9).'].forEach(t => c.push(L.bl(t)));
c.push(L.h2('Four gates'));
c.push(L.tbl(['Gate', 'When', 'Score groups', 'Pass rule (HEURISTIC)'], [
  ['1 Concept', 'Before outlining', 'A Premise, B Protagonist, C Opposition', 'Average 2 or more in each group; no zero in A1, A2, B1, B3.'],
  ['2 Structure', 'Before writing scene cards', 'D Structure, F Theme, I Project rules', 'Average 2 or more; no zero in D1, D2, D6; timing table filled (D9).'],
  ['3 Scenes', 'Before writing pages', 'E Scenes, G Emotion, H Dialogue', 'Average 2 or more; at least 90% of scene cards turn a value (E1).'],
  ['4 Draft', 'After each draft', 'All nine groups', 'Total 85% or more of the maximum, or a written reason for each shortfall.']
], [1300, 1900, 3000, 3438]));
c.push(L.gap());
c.push(L.p('Score at the end of every stage and keep the sheets; a rising total across drafts is the measurement.'));

// ------------------------------------------------ 2
c.push(L.h1('2. The sources and what each one measures'));
c.push(L.p('Books chosen because they recur on recommendation lists (No Film School’s list of 19 books names Save the Cat!, Story, Screenplay, Adventures in the Screen Trade, The Writer’s Journey, Screenwriting 434, Three Uses of the Knife and Into the Woods; Blake Snyder’s own list adds Truby, Hauge, Egri, Seger and Iglesias: CHECKED). Aristotle and the Nāṭyaśāstra are added because they fit this story.'));
c.push(L.tbl(['Source', 'Core idea', 'What this document measures with it'], [
  ['Syd Field, Screenplay', 'Three-act paradigm: setup, confrontation, resolution, joined by two plot points, with a midpoint; page benchmarks.', 'Timing windows; plot points; setup and payoff.'],
  ['Robert McKee, Story', 'Structure is a sequence of value changes; inciting incident, progressive complications, crisis, climax, resolution; the gap between expectation and result; the controlling idea; layers of antagonism.', 'Scene turns; controlling idea; escalation; crisis and climax tests; layers of opposition.'],
  ['Blake Snyder, Save the Cat!', 'Fifteen beats with page positions; the logline; theme stated; the B story; a final image that answers the opening image.', 'Timing windows; logline test; theme and B-story checks; image pair.'],
  ['Christopher Vogler, The Writer’s Journey (after Joseph Campbell)', 'Twelve stages of a mythic journey from the ordinary world to the return with the elixir.', 'Mythic-layer consistency; the arc of the protagonist’s transformation.'],
  ['John Truby, The Anatomy of Story', 'Twenty-two steps built on weakness and need, desire, opponent, plan, and a moral decision at the end.', 'Inner need and flaw; opponent logic; moral decision; audience revelation.'],
  ['Michael Hauge, Writing Screenplays That Sell', 'Six-stage structure; outer motivation versus inner identity and essence.', 'Want versus need; empathy; the logline.'],
  ['Lajos Egri, The Art of Dramatic Writing', 'Start from a premise; characters are built from physiology, sociology and psychology; conflict comes from character.', 'Premise; motivated opponents.'],
  ['Linda Seger, Making a Good Script Great', 'Revision craft: layers, subplots, theme, and rewriting.', 'B stories and layers; revision checks.'],
  ['Paul Gulino, Screenwriting: The Sequence Approach', 'Eight sequences of about fifteen minutes in a two-hour film, each with its own mini-arc.', 'Sequence map and sequence card.'],
  ['William Goldman, Adventures in the Screen Trade', 'Practical craft and honesty about the business; exposition and story first.', 'Exposition in conflict; spare scenes.'],
  ['David Mamet, Three Uses of the Knife and On Directing Film', 'Every scene must answer who wants what from whom, what happens if they do not get it, and why now.', 'The three scene questions.'],
  ['Karl Iglesias, Writing for Emotional Impact', 'Design the emotions the audience feels, scene by scene.', 'Emotional range and curve.'],
  ['Jennifer Van Sijll, Cinematic Storytelling', 'Visual devices that tell story without dialogue.', 'Silent-capable beats.'],
  ['Aristotle, Poetics', 'Unity of action; reversal and recognition; the best plots have both together.', 'Reversal and recognition test.'],
  ['Nāṭyaśāstra (Bharata)', 'The rasas: Śṛṅgāra, Hāsya, Karuṇa, Raudra, Vīra, Bhayānaka, Bībhatsa, Adbhuta, and Śānta as a later ninth.', 'Emotional range by rasa (relevant to this story’s tradition).']
], [2400, 4038, 3200]));
c.push(L.gap());

// ------------------------------------------------ 3
c.push(L.h1('3. Where the books agree: the shared skeleton'));
c.push(L.p('The books use different words but converge on one shape. The alignment below is approximate; where a book has no named beat the cell says so.'));
c.push(L.tbl(['Stage', 'Field', 'McKee', 'Snyder', 'Vogler', 'Gulino'], [
  ['1 Setup', 'Act I setup', 'The world and its values', 'Opening image; theme stated; set-up', 'Ordinary world', 'Seq 1 status quo'],
  ['2 First disturbance', 'Inciting incident', 'Inciting incident', 'Catalyst', 'Call to adventure', 'End of Seq 1'],
  ['3 Commitment', 'Plot point I', 'First act-turning reversal', 'Debate, then Break into Two', 'Crossing the first threshold', 'End of Seq 2'],
  ['4 Rising complications', 'Act II confrontation', 'Progressive complications', 'B story; Fun and Games; Bad Guys Close In', 'Tests, allies, enemies', 'Seq 3'],
  ['5 Midpoint', 'Midpoint', 'No named beat; a major reversal in Act II', 'Midpoint', 'Approach and Ordeal', 'End of Seq 4'],
  ['6 Low point', 'Between midpoint and plot point II', 'Crisis building', 'All Is Lost; Dark Night of the Soul', 'Ordeal’s aftermath', 'Seq 5 and 6'],
  ['7 Second turn', 'Plot point II', 'Act II’s greatest reversal', 'Break into Three', 'The Road Back', 'End of Seq 6'],
  ['8 Climax', 'Act III climax', 'Crisis, then climax', 'Finale', 'Resurrection', 'Seq 7 and 8'],
  ['9 Resolution', 'Resolution', 'Resolution', 'Final image', 'Return with the elixir', 'End of Seq 8']
], [1300, 1400, 1800, 2000, 1700, 1438]));
c.push(L.gap());

// ------------------------------------------------ 4
c.push(L.h1('4. Timing: benchmarks converted to your runtime'));
c.push(L.p('CHECKED. Syd Field’s paradigm for a 120-page script: Act I about pages 1 to 30, with the inciting incident in the first ten pages and Plot Point I between pages 20 and 30; Act II about pages 31 to 90 with the midpoint near page 60; Plot Point II near page 90; Act III to page 120. Save the Cat’s 110-page positions: Catalyst page 12, Break into Two page 25 (about 23%), Midpoint page 55 (50%), All Is Lost page 75 (about 68%), Break into Three page 85 (about 77%), Final Image page 110.'));
const RT = [150, 120, 110];
function mins(pct, rt) { return Math.round(pct / 100 * rt); }
const marks = [
  ['Inciting incident / Catalyst', 8, 12, 'Field: by about page 10 of 120 (8%). Snyder: page 12 of 110 (11%).'],
  ['First turning point (commitment)', 20, 25, 'Field: pages 20 to 30 of 120 (17 to 25%). Snyder: page 25 of 110 (23%).'],
  ['Midpoint', 48, 52, 'Field: page 60 of 120 (50%). Snyder: page 55 of 110 (50%).'],
  ['Low point (All Is Lost)', 66, 70, 'Snyder: page 75 of 110 (about 68%).'],
  ['Second turning point', 74, 78, 'Field: page 90 of 120 (75%). Snyder: page 85 of 110 (about 77%).'],
  ['Climax begins', 88, 94, 'Within Act III (Field’s last 30 pages; Snyder’s Finale from 77%); HEURISTIC.'],
  ['Final image', 98, 100, 'Snyder: the last page; Field: resolution is brief.']
];
c.push(L.tbl(['Milestone', 'Window (% of runtime)', '150 min', '120 min', '110 min', 'Basis'],
  marks.map(m => [m[0], `${m[1]} to ${m[2]}%`, ...RT.map(rt => `${mins(m[1], rt)} to ${mins(m[2], rt)}`), m[3]]),
  [2000, 1300, 950, 950, 950, 3488]));
c.push(L.gap());
c.push(L.p('The windows are HEURISTIC summaries of the two timelines; no book states them. The formula is minutes = percentage × runtime ÷ 100, so you can reset the runtime and recompute. Field stresses that these are guides and that “the form” matters more than the page numbers.'));
c.push(L.h2('Act proportions'));
c.push(L.tbl(['Act', 'Share', '150 min', '120 min', 'Basis'], [
  ['Act I', '25%', `${mins(25, 150)}`, `${mins(25, 120)}`, 'Field: 30 of 120 pages.'],
  ['Act IIa (to midpoint)', '25%', `${mins(25, 150)}`, `${mins(25, 120)}`, 'Field: Act II is 60 of 120 pages, split by the midpoint.'],
  ['Act IIb (midpoint to second turn)', '25%', `${mins(25, 150)}`, `${mins(25, 120)}`, 'As above.'],
  ['Act III', '25%', `${mins(25, 150)}`, `${mins(25, 120)}`, 'Field: 30 of 120 pages.']
], [3200, 1000, 1200, 1200, 3038]));
c.push(L.gap());

// ------------------------------------------------ 5 SCORECARD
c.push(L.h1('5. The scorecard'));
c.push(L.p('Score each criterion 0 to 3. **0** = absent. **1** = present but weak or implicit. **2** = clear. **3** = clear, distinctive and proved in scenes. Write the evidence next to the score.'));
const S = [];
function G(title, rows) { S.push([title, rows]); }
G('A. Premise and controlling idea', [
  ['A1', 'One-sentence premise: protagonist, want, obstacle and stakes.', 'The sentence; each part nameable.', 'Egri; Snyder; Hauge'],
  ['A2', 'Controlling idea: one sentence of the form “value wins or loses because of cause”.', 'The sentence; the climax proves it.', 'McKee; Truby'],
  ['A3', 'Logline hook: ironic or surprising, makes a picture, and says who it is for.', 'Reaction of three listeners.', 'Snyder'],
  ['A4', 'The idea holds in every scene; no scene argues the opposite without an answer.', 'Value tag on each scene card.', 'McKee']
]);
G('B. Protagonist', [
  ['B1', 'Outer want: a visible goal with a finish line.', 'Goal stated as an action.', 'McKee; Hauge'],
  ['B2', 'Inner need and flaw: a weakness the story tests; a need the goal hides.', 'Flaw named; the scene that exposes it.', 'Truby; Hauge; Vogler'],
  ['B3', 'Active protagonist: her choices, not others’ acts, cause the major turns.', 'Count the turns she causes.', 'McKee; Field'],
  ['B4', 'Measurable change: start and end differ in belief or behaviour.', 'An opening and closing behaviour pair.', 'Truby; Vogler'],
  ['B5', 'Early empathy: the audience cares within the first 10%.', 'The scene that earns it.', 'Snyder; Hauge'],
  ['B6', 'Character shown by costly choices under pressure.', 'Three choices that cost something.', 'McKee']
]);
G('C. Opposition', [
  ['C1', 'Layers of opposition: inner, personal, social and larger forces all press.', 'One force per layer named.', 'McKee'],
  ['C2', 'The opposition is stronger than the protagonist at the start.', 'Early defeats; what she must grow to win.', 'McKee; Truby'],
  ['C3', 'The opponent has a logic: he believes he is right and wants something understandable.', 'His want and justification.', 'Egri; Truby']
]);
G('D. Structure', [
  ['D1', 'Inciting incident upsets the balance of life and arouses a want, inside its window.', 'Scene and minute.', 'McKee; Field; Snyder'],
  ['D2', 'First turning point: a decision that commits her and cannot be undone.', 'Scene; why it is irreversible.', 'Field; Snyder'],
  ['D3', 'Midpoint changes the game: a false victory or defeat; stakes rise.', 'Scene; what changed.', 'Field; Snyder'],
  ['D4', 'Progressive complications: each turn is bigger and costlier; no repeats.', 'Escalation list.', 'McKee'],
  ['D5', 'Low point and crisis: a forced dilemma between two goods or two evils.', 'The dilemma stated.', 'McKee; Snyder'],
  ['D6', 'Climax by the protagonist: her own earned action resolves the main conflict, with no unearned rescue.', 'The act; where it is planted.', 'McKee; Field'],
  ['D7', 'Reversal and recognition coincide, ideally in one scene.', 'Both identified.', 'Aristotle'],
  ['D8', 'Resolution is short, shows a new equilibrium, and answers the opening image.', 'Opening and closing image.', 'Field; Vogler; Snyder'],
  ['D9', 'Milestones fall inside the windows in section 4.', 'Timing table filled.', 'Field; Snyder']
]);
G('E. Scenes and sequences', [
  ['E1', 'Each scene turns a value, from positive to negative or the reverse.', 'Charge in and out on each scene card.', 'McKee'],
  ['E2', 'Each scene has someone who wants something and is blocked.', 'The three scene questions answered.', 'Mamet; Egri'],
  ['E3', 'The gap: key beats show a difference between expected and actual result.', 'List of gaps at the turns.', 'McKee'],
  ['E4', 'Each of the eight sequences has a goal, a mini-arc and ends on a turn.', 'Sequence cards.', 'Gulino'],
  ['E5', 'Plant and payoff: every payoff is planted and every plant paid.', 'Two-column ledger.', 'Field; Snyder'],
  ['E6', 'No spare scenes: removing a scene breaks something.', 'Removal test.', 'McKee; Goldman'],
  ['E7', 'Late in, early out: scenes start near the turn and end just after.', 'Entry and exit on each card.', 'General craft convention']
]);
G('F. Theme and resonance', [
  ['F1', 'Theme is dramatised: stated at most once, indirectly, then proved in action.', 'Theme line; where it is tested.', 'Snyder; McKee'],
  ['F2', 'A B story illuminates the theme from another side.', 'B story named.', 'Snyder; Seger'],
  ['F3', 'Opening and final images answer each other.', 'The image pair.', 'Snyder'],
  ['F4', 'The mythic layer obeys its own rules throughout.', 'Parallel map complete.', 'Vogler; Campbell']
]);
G('G. Emotion and audience experience', [
  ['G1', 'Emotional range: at least four distinct rasas, one dominant.', 'Rasa map (section 9).', 'Nāṭyaśāstra; Iglesias'],
  ['G2', 'Intensity curve rises overall, with relief between peaks.', 'Curve drawn from the catalogue ratings.', 'McKee; Field; HEURISTIC'],
  ['G3', 'Audience knowledge is managed deliberately: suspense, mystery or surprise.', 'Knowledge ledger per sequence.', 'Truby; dramatic-irony tradition'],
  ['G4', 'Key beats work without dialogue.', 'Count of silent-capable beats.', 'Van Sijll; Mamet']
]);
G('H. Dialogue and exposition', [
  ['H1', 'Subtext: at key beats characters do not say exactly what they mean.', 'Line audit.', 'McKee; Mamet'],
  ['H2', 'Exposition is delivered inside conflict.', 'List of exposition scenes.', 'Goldman; McKee'],
  ['H3', 'Voices are distinct: with the names covered, speakers can still be told apart.', 'Blind read.', 'General craft convention'],
  ['H4', 'Talk about the unseen: each mention reveals the speaker as much as the subject.', 'Speaker and aspect pairs.', 'Illumination method (this project)']
]);
G('I. Project rules', [
  ['I1', 'Rukmini is the viewpoint in most scenes (suggested 70% or more; you set it).', 'Scene count.', 'HEURISTIC'],
  ['I2', 'Krishna’s face appears only at and after the reveal; a screen-time budget is set.', 'Time log.', 'HEURISTIC'],
  ['I3', 'Each event reaches Rukmini through a named carrier.', 'Carrier per event.', 'HEURISTIC; event files'],
  ['I4', 'Each event has its world-welfare proof.', 'Ledger complete.', 'HEURISTIC; ledger'],
  ['I5', 'Each act carries at least one Manthana parallel.', 'Parallel map.', 'HEURISTIC; event 01'],
  ['I6', 'The marriage is not shown; they are together at the end; nothing follows.', 'Final sequence check.', 'Project brief']
]);
let total = 0;
S.forEach(([title, rows]) => {
  c.push(L.h2(title));
  c.push(L.tbl(['ID', 'Criterion and test', 'Evidence to look for', 'Source', 'Score'], rows.map(r => [...r, '__ / 3']), [650, 3900, 2700, 1488, 900]));
  c.push(L.gap());
  total += rows.length;
});
c.push(L.h2('Reading the total'));
c.push(L.p(`There are ${total} criteria, so the maximum is ${total * 3}. HEURISTIC bands: below 50% means the concept is not yet formed; 50 to 70% is an outline that can be developed; 70 to 85% is ready for scene cards; 85% or more is ready for pages. A zero in A1, A2, B1, B3, D1, D2 or D6 blocks the next gate whatever the total.`));

// ------------------------------------------------ 6 SCENE CARD
c.push(L.h1('6. Scene card'));
c.push(L.p('One card per scene. A scene that cannot fill the “turn” line is a candidate for cutting or merging (E1, E6).'));
c.push(L.tbl(['Field', 'Fill in'], [
  ['Scene ID, sequence, place and time', ''],
  ['Whose scene (viewpoint)', 'Rukmini or another (I1).'],
  ['Mamet’s three questions', 'Who wants what from whom? What happens if they do not get it? Why now?'],
  ['Want and obstacle', 'E2.'],
  ['Value at stake; charge in → out', 'For example hope → dread; safety → danger. The two must differ (E1).'],
  ['The turn', 'The single thing that changes.'],
  ['The gap', 'What was expected and what happened (E3).'],
  ['Emotion (rasa) and intensity 1 to 5', 'G1, G2.'],
  ['Krishna tag', 'Not present, spoken of (direct or indirect), effect, shadow, hands, reflection, face.'],
  ['Dialogue need', 'Silent-capable or depends on speech (G4).'],
  ['Plants and payoffs', 'E5.'],
  ['Entry and exit', 'Late in, early out (E7).'],
  ['Runtime and position', 'Minute mark against the timing table.'],
  ['Source anchor', 'Verse, file, or ADAPTATION.']
], [3400, 6238]));
c.push(L.gap());

// ------------------------------------------------ 7 SEQUENCE CARD
c.push(L.h1('7. The eight sequences (Gulino)'));
c.push(L.p('The sequence approach splits a feature into eight pieces of roughly equal length, each with its own goal and a turn at the end. Labels are from my knowledge of the book and were not re-checked. At 150 minutes each is about 19 minutes; at 120, 15.'));
const seqs = [
  ['1', 'Status quo and inciting incident', 'Act I'],
  ['2', 'Predicament and lock-in', 'Act I'],
  ['3', 'First obstacle and raising the stakes', 'Act IIa'],
  ['4', 'First culmination (midpoint)', 'Act IIa'],
  ['5', 'Subplot and rising action', 'Act IIb'],
  ['6', 'Main culmination (end of Act II)', 'Act IIb'],
  ['7', 'New tension and twist', 'Act III'],
  ['8', 'Resolution', 'Act III']
];
c.push(L.tbl(['Seq', 'Function', 'Act', 'Window (%)', '150 min', '120 min'],
  seqs.map((s, i) => [s[0], s[1], s[2], `${(i * 12.5).toFixed(1).replace('.0', '')} to ${((i + 1) * 12.5).toFixed(1).replace('.0', '')}`,
    `${Math.round(i * 12.5 * 1.5)} to ${Math.round((i + 1) * 12.5 * 1.5)}`, `${Math.round(i * 12.5 * 1.2)} to ${Math.round((i + 1) * 12.5 * 1.2)}`]),
  [700, 3500, 1200, 1500, 1369, 1369]));
c.push(L.gap());
c.push(L.p('**Sequence card (copy for each):** goal of the sequence; who wants it; what stops them; the mini-arc in three lines (setup, complication, turn); the turn that ends it; Krishna’s visible time; the intensity peak; the world-welfare proof if the sequence carries an event.'));

// ------------------------------------------------ 8 RED FLAGS
c.push(L.h1('8. Red flags'));
c.push(L.p('Common failures the books warn about, with a test for each. Run this list at every gate.'));
c.push(L.tbl(['Red flag', 'Test', 'Source of the warning'], [
  ['Passive protagonist', 'Remove her from the outline: do the major turns still happen? If so, she is passive.', 'McKee; Field'],
  ['Unearned rescue (deus ex machina)', 'Is the climax won by coincidence or an outside power she did not set up? Coincidence may get a hero into trouble but should not get her out.', 'McKee'],
  ['A sagging middle', 'Is there a clear midpoint reversal and escalation between it and the low point?', 'Field; Snyder'],
  ['Repetition passed off as escalation', 'Do two sequences do the same job at the same level?', 'McKee'],
  ['On-the-nose dialogue', 'Do characters announce their feelings or the theme?', 'McKee; Mamet'],
  ['Exposition dumps', 'Is any speech there only to inform the audience?', 'Goldman; McKee'],
  ['Two climaxes', 'Is there a second peak after the main climax that is as large as the first?', 'Field; Snyder'],
  ['A long resolution', 'Is the final sequence longer than the window in section 4?', 'Field'],
  ['A thin opponent', 'Can the opponent state why he is right?', 'Egri; Truby'],
  ['Theme preaching', 'Is the theme stated more than once, or by the protagonist at the end?', 'Snyder; McKee'],
  ['Mythic layer as lecture', 'Does the mythic frame stop the story to explain itself?', 'Vogler; Seger'],
  ['Checklist storytelling', 'Are stages included only because a model lists them?', 'Vogler himself treats the stages as flexible']
], [2400, 4838, 2400]));
c.push(L.gap());

// ------------------------------------------------ 9 CALIBRATION
c.push(L.h1('9. Calibration: what the current story-event files already show'));
c.push(L.p('This is my first reading of the story-event files (not a score by you). It shows where the framework already finds strength and where decisions are open. Nothing here fixes the plot.'));
c.push(L.h2('9.1 Baseline readout'));
c.push(L.tbl(['Group', 'Status', 'Reading'], [
  ['A Premise', 'Partial', 'The theme is clear (choice holds where seizing does not) and the Manthana frame is set. There is no one-sentence premise or controlling idea yet. A candidate controlling idea for testing: “A choice made before it is seen holds, because the chooser stakes everything first.” ADAPTATION.'],
  ['B Protagonist', 'Partial', 'Outer want is in the text (to be Krishna’s, not Śiśupāla’s). Inner flaw and need are open. Agency risk: in the text Krishna carries the climax’s physical act; see 9.3.'],
  ['C Opposition', 'Strong', 'Layers exist: Rukmī (personal), the coalition of Jarasandha, Śiśupāla and others (social), the arranged wedding and its clock (larger), and her own fear (inner).'],
  ['D Structure', 'Open', 'Events are gathered, not ordered. Two risks to design for are in 9.3.'],
  ['E Scenes', 'Not started', 'No scene cards yet.'],
  ['F Theme', 'Strong', 'The Manthana parallel gives a ready theme carrier; Balarama, Rukmī and Śiśupāla can serve as B stories.'],
  ['G Emotion', 'Partial', 'Intensity ratings exist in the two catalogues; rasa coverage has a gap (9.4).'],
  ['H Dialogue', 'Open', 'Talk-about-Krishna tables exist in every event file; the dialogue itself is not written.'],
  ['I Project rules', 'Strong', 'Rules are defined in the index; counts pending.']
], [1700, 1300, 6638]));
c.push(L.gap());

c.push(L.h2('9.2 An illustrative fit, to test the framework (not a plot decision)'));
c.push(L.p('One way the shared skeleton could take the gathered events. It exists to show how the measurements are used; the real order is for you to build. ADAPTATION.'));
c.push(L.tbl(['Skeleton beat', 'Candidate content from the events', 'Test it with'], [
  ['Opening image and setup', 'The Manthana opening; Kuṇḍina; the visitors’ songs about Krishna.', 'F3, B5, I3'],
  ['Inciting incident', 'Rukmī overrides her and arranges the Śiśupāla match (D06-b).', 'D1; window 8 to 12%'],
  ['Break into Two', 'She sends the Brahmin with her letter (D06-c, D06-d): an irreversible, active choice.', 'D2, B3'],
  ['Fun and Games', 'The stories of him reaching Kuṇḍina: the Earth’s burden, the seventeen sparings, Dvārakā, the cave (Events 02 to 05).', 'H4, I3, G1'],
  ['Midpoint', 'A reversal such as the Brahmin’s return with Krishna’s promise, or the kings assembling in force.', 'D3'],
  ['Bad Guys Close In', 'The coalition gathers and vows; the wedding is made ready (D06-f, D06-g).', 'C1, D4'],
  ['All Is Lost and Dark Night', 'The waiting; the hour nears with no sign (D06-i); the prayer (D06-l).', 'D5, G2'],
  ['Break into Three', 'The walk, the first sight, the lift (D06-m to D06-o).', 'D7, D9'],
  ['Finale', 'Pursuit, duel, plea, consolation (D06-s to D06-w).', 'D6, E4'],
  ['Final image', 'Rukmini and Krishna together at the sea (D07-d); the “elixir” returned is the choice that held.', 'D8, F3, I6']
], [2200, 5238, 2200]));
c.push(L.gap());

c.push(L.h2('9.3 Risks the framework flags'));
c.push(L.tbl(['Risk', 'Why it matters', 'Measure and mitigation'], [
  ['The rescuer does the climax (B3, D6)', 'In the text Krishna lifts her onto the chariot and fights the pursuit. If she only waits, the protagonist is passive and the climax looks like a rescue.', 'Her letter in the text sets out the plan: the day, the temple procession, how he can take her without harming her relatives (10.52.41 to 10.52.42). Staging the abduction as her own plan carried out, plus her walk out and her plea, keeps the climax hers.'],
  ['Two climaxes or a long ending (D8, red flags)', 'If the abduction is the climax, the pursuit, duel, plea, consolation and arrival follow it and may exceed the resolution window.', 'Treat the abduction as the second turning point (about 74 to 78%) and the duel and plea as the finale, which leaves about 25% of runtime for Act III. Test with D9.'],
  ['Repetition (D4)', 'Seventeen sieges and several chases could read as the same beat.', 'Escalate or compress: one fully staged siege, the rest told by a counter such as the chalk marks.'],
  ['Mythic layer as lecture (F4)', 'The Manthana could stop the story to explain itself.', 'Keep each Manthana appearance short and tied to a choice in the human story.'],
  ['An absent protagonist’s hero (I1, I2)', 'Many events happen without Rukmini.', 'Every event must pass through a carrier into her scene (I3).']
], [2400, 3500, 3738]));
c.push(L.gap());

c.push(L.h2('9.4 Rasa coverage check (G1)'));
c.push(L.tbl(['Rasa', 'Where it lives in the gathered events', 'Status'], [
  ['Śṛṅgāra (love)', 'The letter; first sight; together at the end.', 'Strong'],
  ['Vīra (heroic)', 'The battle of Mathurā; the pursuit; the duel.', 'Strong'],
  ['Karuṇa (pathos)', 'The Earth-cow; the plea for her brother; Rukmī’s exile.', 'Strong'],
  ['Raudra (fury)', 'Rukmī’s oath; Jarasandha’s grief and rage.', 'Present'],
  ['Bhayānaka (terror)', 'Hālāhala; the burning hill; the waiting.', 'Present'],
  ['Adbhuta (wonder)', 'The sea city; Mucukunda’s vision; Lakṣmī’s emergence.', 'Strong'],
  ['Śānta (peace)', 'Mucukunda’s renunciation; the closing image.', 'Present'],
  ['Hāsya (humour)', 'None in the gathered material.', 'Gap'],
  ['Bībhatsa (disgust)', 'None; at most the shaving.', 'Gap, probably intended']
], [2200, 5238, 2200]));
c.push(L.p('Decide whether the film wants light relief (hāsya) and where, since a long run of intensity 4 and 5 beats without relief tests G2. That is a plot-building decision.'));

// ------------------------------------------------ 10 PROCESS
c.push(L.h1('10. Using it during story building'));
['**Stage 1, concept.** Fill section 5 groups A to C. Do not outline until the gate passes.',
  '**Stage 2, structure.** Choose a runtime, fill the timing table (section 4), place the gathered events against the skeleton, and score groups D, F and I.',
  '**Stage 3, sequences and scenes.** Make eight sequence cards and then scene cards (sections 6 and 7); score E, G and H.',
  '**Stage 4, draft review.** Score all nine groups and run the red-flag list. Keep each sheet in a dated file so the improvement is visible.',
  '**When a score is low,** go to the source named in the table; the book will tell you the fix.'].forEach(t => c.push(L.bl(t)));

// ------------------------------------------------ 11 caution
c.push(L.h1('11. Limits of this framework'));
['Structure books describe patterns found in many films; they are not laws. Field says the form matters more than page counts, and Vogler’s stages are flexible.',
  'The numeric windows are my summary of two timelines, and the score bands and gate rules are my own working rules. They are there to be tested and changed.',
  'The books are mostly about Western feature films. The Nāṭyaśāstra rasa map is included because this story comes from an Indian tradition; use it as a check on emotional range, not as a replacement for structure.',
  'A high score does not make a good film. It shows the story is built to stand; the writing and the performances still have to carry it.',
  'The name “theory of illumination” used earlier in this project is treated here as a method of characterising a protagonist through other characters’ light on him. If you are following a specific published theory under that name, send it and I will add it as a criterion.'].forEach(t => c.push(L.bl(t)));

// ------------------------------------------------ 12 sources
c.push(L.h1('12. Sources'));
c.push(L.p('Checked in this pass:'));
['No Film School, “The 20 Best Screenwriting Books You Should Get Right Now”: https://nofilmschool.com/best-screenwriting-books',
  'Save the Cat!, “Other Books on Story and Screenwriting” (Blake Snyder’s own recommendations): https://savethecat.com/tips-and-tactics/other-books-on-story-and-screenwriting',
  'ScreenWeaver, “Save the Cat Beat Sheet: All 15 Beats with Page Numbers”: https://www.screenweaver.ai/blog/save-the-cat-15-beats-page-numbers',
  'Syd Field, “Utilizing Syd Field’s Screenwriting Paradigm to Understand Script Timeline Structure” (guest post): https://sydfield.com/guest-blog/utilizing-syd-fields-screenwriting-paradigm-to-understand-script-timeline-structureby-natalia-lazarus/'].forEach(t => c.push(L.bl(t)));
c.push(L.p('The page figures from the Save the Cat source (page numbers, with percentages given only for Break into Two, Midpoint, All Is Lost and Break into Three) and from the Field source (a 120-page assumption that the source itself notes as an application) are as those sites state them.'));
c.push(L.p('Not re-checked, from my knowledge of the books: McKee’s Story, Vogler’s The Writer’s Journey, Truby’s The Anatomy of Story, Hauge, Egri, Seger, Gulino’s sequence labels, Goldman, Mamet’s three questions, Iglesias, Van Sijll, Aristotle’s Poetics and the Nāṭyaśāstra rasa list. Check chapter and page references before quoting any of them.'));

L.save(L.makeDoc('Story Measurement Framework', 'Story Measurement Framework', c), OUT + '11_Story_Measurement_Framework.docx');
