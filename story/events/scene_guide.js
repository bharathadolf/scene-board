const L = require('./lib');
const OUT = '/home/claude/story_events/';
const c = [];
L.titleBlock(c, 'CRAFT REFERENCE 12', 'Scene Building Guide', 'How to turn the gathered story events into scenes, using the measurements in the Story Measurement Framework');
c.push(L.note('Labels. FRAMEWORK = a criterion ID from document 11 (for example E1, D2). HEURISTIC = a working rule I set for this project; change it freely. ADAPTATION = an invention for the film, not in the source. TEXT, SOURCE and TRADITION keep their earlier meaning (Bhāgavata verse checked; your files; other sources not re-checked). Where this guide proposes a scene, it is a candidate to test, not a plot decision.'));

// ---------- 1
c.push(L.h1('1. What you start with, and what a scene needs'));
c.push(L.p('The event files and the two catalogues give you beats: what happens, where it is anchored, how intense it is, and whether it can play silent. A scene needs more than that. The table shows what already exists and what must be added at scene level. The missing items are why the second document in this pair (13, Data Refinement Plan) exists.'));
c.push(L.tbl(['What a scene card needs', 'Already in the data?', 'Where', 'Framework use'], [
  ['Beat ID and anchor', 'Yes', 'Catalogues 09 and 10 (IDs like D06-n); event files (verse refs)', 'E6, source check'],
  ['Intensity 1 to 5', 'Yes (judged, not calibrated)', 'Catalogues', 'G2'],
  ['Silent or dialogue-dependent', 'Yes (S or D)', 'Catalogue 10', 'G4'],
  ['Rukmini’s state', 'Yes, as a 17-step ladder', 'Catalogue 10, section 2; Event 06', 'B3, I1'],
  ['How Krishna is kept hidden', 'In words, per event', 'Event files, “Krishna on screen” and section 6', 'I2'],
  ['Who carries the event to Rukmini', 'Per event, not per scene', 'Event files, section 4', 'I3'],
  ['World-welfare proof', 'Per event', 'File 08', 'I4'],
  ['Value at stake and charge in → out', 'No', 'Added in this guide (section 4)', 'E1, A4'],
  ['Want and obstacle', 'Partly (implied)', 'Added per scene', 'E2'],
  ['The turn and the gap', 'No', 'Added per scene', 'E1, E3'],
  ['Entry and exit points', 'No', 'Added per scene', 'E7'],
  ['Plants and payoffs', 'Scattered', 'Added per scene; see doc 13 register', 'E5'],
  ['Runtime position and sequence', 'No (runtime not chosen)', 'Section 9', 'D9, E4']
], [2900, 2000, 3038, 1700]));
c.push(L.gap());

// ---------- 2
c.push(L.h1('2. The pipeline: beat to scene to sequence'));
c.push(L.tbl(['Step', 'What you do', 'Framework test', 'Output'], [
  ['1 Choose the beat group', 'Pick the beats for one stretch of story (for example D06-a to D06-d).', 'E4', 'A beat list'],
  ['2 Split or merge', 'One scene = one place and time, one viewpoint, one value change (section 3).', 'E1, E6', 'Scene candidates'],
  ['3 Pick the viewpoint', 'Rukmini’s unless there is a reason (section 9 budget).', 'I1', 'POV tag'],
  ['4 Name the value and charge', 'Choose the value axis and the charge going in and coming out (section 4).', 'E1, A4', 'Value line'],
  ['5 Set want and obstacle', 'Answer Mamet’s three questions (who wants what from whom; what if not; why now).', 'E2', 'Conflict line'],
  ['6 Find the turn and the gap', 'The single change, and the difference between what was expected and what happened.', 'E3', 'Turn line'],
  ['7 Route Krishna', 'Choose how he is present: not at all, spoken of, effect, shadow, hands, reflection, face (section 5).', 'I2, H4', 'Krishna tag'],
  ['8 Attach carrier, welfare proof, plants', 'Who brings this to Rukmini; which ordinary person shows the world gaining; what is planted or paid.', 'I3, I4, E5', 'Support lines'],
  ['9 Set entry and exit', 'Start late, leave early.', 'E7', 'Entry and exit'],
  ['10 Run the quick test', 'Ten yes-or-no questions (section 10).', 'E1 to E7', 'Pass or fix'],
  ['11 Place it', 'Give it a sequence and a minute window (section 9).', 'D9, E4', 'Runtime slot']
], [1900, 4200, 1300, 2238]));
c.push(L.gap());

// ---------- 3
c.push(L.h1('3. Splitting and merging beats'));
c.push(L.p('A beat in the catalogue is a unit of story. A scene is a unit of drama. They do not match one to one.'));
c.push(L.h2('Split when'));
['The beat holds two value changes. In the catalogue, D06-o is listed as “the lift” but the peaks table treats silence, first sight and the lift as one climax in three steps. The three steps change three different values (unknown → known; held → taken; safe → exposed), so they can be three short scenes or one scene with three turns. Decide by length; do not leave it unexamined.',
  'The beat spans two places. D06-e (the Brahmin’s journey and report) is Dvārakā going and Kuṇḍina returning.',
  'The viewpoint changes. A scene should have one.'].forEach(t => c.push(L.bl(t)));
c.push(L.h2('Merge when'));
['Two beats share place, viewpoint and value. D06-c (decision to write) and D06-d (the letter) are one continuous act for Rukmini and can be one scene.',
  'A beat has no turn of its own and only sets up the next. D06-f (the bride is made ready) works better as the opening of the waiting scene than as a scene alone.',
  'Several small beats serve one welfare proof. They can share a single crowd scene.'].forEach(t => c.push(L.bl(t)));
c.push(L.h2('Cut or hold when'));
c.push(L.p('A beat fails the removal test (E6): if nothing later depends on it, hold it in the catalogue for a variant instead of forcing it into the main cut.'));

// ---------- 4 ladder to values
c.push(L.h1('4. Turning Rukmini’s ladder into value charges'));
c.push(L.p('A scene turns a value (framework E1). The 17-step emotional ladder in catalogue 10 gives Rukmini’s state at each step; the table below proposes the value axis behind each step and the charge change a scene on that step could carry. Charge is shown as + and − on the axis named. The Bhāgavata gives almost none of her inner life, so the axes are ADAPTATION; the steps themselves are TEXT in the catalogue. Where two adjacent steps share an axis, they are escalation (D4), not repetition, only if the second goes further than the first.'));
const ladder = [
  ['1 Wonder', 'Open heart / closed', 'closed (−) → longing (+)'],
  ['2 Certainty', 'Certainty / doubt', 'unsure (−) → sure (+)'],
  ['3 Helplessness', 'Freedom / control', 'free (+) → overridden (−)'],
  ['4 Courage', 'Agency / helplessness', 'helpless (−) → acting (+)'],
  ['5 Exposure', 'Safety / exposure', 'hidden (+) → staked everything (−)'],
  ['6 Suffocation', 'Freedom / control', 'overridden (−) → more bound (−−); add one flicker of defiance so the scene still turns'],
  ['7 Dread', 'Hope / despair', 'hope (+) → dread (−)'],
  ['8 Relief', 'Hope / despair', 'dread (−) → relief (+)'],
  ['9 Resolve', 'Fear / resolve', 'afraid (−) → resolved (+)'],
  ['10 Public exposure', 'Voice / silence', 'silent (−) → speaking publicly (+)'],
  ['11 Recognition', 'Known / unknown', 'unknown (−) → known (+)'],
  ['12 Surrender and choice', 'Choice / seizure', 'held (−) → chosen and taken (+)'],
  ['13 Fear for others', 'Safety of others', 'joy (+) → fear for them (−)'],
  ['14 Terror for her brother', 'Loyalty / loyalty', 'torn (−−); the turn is the sword raised'],
  ['15 Mercy', 'Mercy / vengeance', 'fear (−) → mercy won (+)'],
  ['16 Grief, then calm', 'Grief / acceptance', 'grief (−) → calm (+)'],
  ['17 Belonging', 'Home / stranger', 'stranger (−) → home (+)']
];
c.push(L.tbl(['Ladder step', 'Value axis', 'Charge change (ADAPTATION)'], ladder, [2400, 2700, 4538]));
c.push(L.gap());
c.push(L.p('**Reading the ladder as a curve.** Charge goes down at steps 3, 6, 7, 13 and 14, and up at 4, 8, 9, 10, 11, 12, 15, 16, 17. That is a healthy alternation. Steps 5 and 6 (exposure, then suffocation) and 13 and 14 (fear for others, then terror for her brother) are the two places where two negative steps sit side by side. Check that the second is not a repeat of the first (D4, red flag “repetition passed off as escalation”).'));
c.push(L.p('**Non-Rukmini scenes.** Use the same method with the character’s own axis. Rukmī: honour / shame; Śiśupāla: possession / loss; Balarama: loyalty / justice; Jarasandha: grief / rage; the Devas: survival / pride.'));

// ---------- 5 Krishna routing
c.push(L.h1('5. Routing Krishna through a scene'));
c.push(L.p('The project rule is that Krishna is hidden and others speak of him. Every scene card needs a Krishna tag. These are the options, in order from least to most visible. Nothing here removes his presence from the story; it moves it into other people.'));
c.push(L.tbl(['Tag', 'How it looks', 'Good for', 'Watch for'], [
  ['Not present', 'No mention at all.', 'Pure Rukmini or antagonist scenes; relief from the thread.', 'Too many in a row makes the film forget its subject.'],
  ['Spoken of, direct', 'A character names him and says what they think of him.', 'Hostile or awed portraits (Rukmī, the Brahmin, Mucukunda’s memory).', 'Each mention must reveal the speaker as much as him (H4).'],
  ['Spoken of, indirect', 'A reaction, a rumour, a song, a boast or a fear.', 'Crowds, bards, merchants.', 'Keep it specific; vague praise is wallpaper.'],
  ['Effect', 'The result of his act with no sight of him: broken bows, a stilled crowd, a city on water.', 'Action, wonder.', 'The effect must be visible and costly to someone.'],
  ['Shadow or sound', 'A silhouette, hoofbeats, a chariot, a conch (ADAPTATION).', 'Arrival and approach.', 'One per sequence at most or it becomes a trick.'],
  ['Hands', 'Hands only at frame edge.', 'Intimate acts (the Brahmin’s feet massaged, the lift).', 'Do not let hands become a face in disguise.'],
  ['Reflection', 'Seen in water, a blade or a mirror.', 'Moments when Rukmini nearly sees him.', 'Reserve for one or two uses.'],
  ['Face', 'Full view.', 'First sight and after.', 'Budget it (section 9). Only from the first-sight beat onward.']
], [1500, 2900, 2700, 2538]));
c.push(L.gap());
c.push(L.p('**Source tension to resolve.** In the Bhāgavata, the Brahmin, Bhīṣmaka and the citizens meet Krishna before Rukmini sees him (10.52.27 to 10.52.36; 10.53.31 to 10.53.38). The simplest consistent rule is that these meetings are always reported, never shown. The scene cards below assume that rule. It is flagged as a decision in document 13.'));

// ---------- 6 recipes
c.push(L.h1('6. Scene recipes by type'));
c.push(L.p('The material falls into a small number of scene types. Each has a recipe; follow it and check the criteria it names.'));
const rec = [
  ['Report scene', 'A carrier tells Rukmini (or the audience) what happened elsewhere.', 'Give the listener a want: she tests the report, doubts it, or needs one detail. Let the teller have a stake or a flaw. End on what the report changes for her, not on the report.', 'H2, H4, I3'],
  ['Talk-about-the-unseen scene', 'People speak of Krishna while he is absent.', 'Two speakers who disagree. The portrait of Krishna comes out of the clash; the portrait of each speaker comes out of what they choose to say.', 'H4, C3'],
  ['Waiting scene', 'Nothing happens outside; everything happens inside.', 'Give her something to push against: a person, a ritual, a clock. Turn hope into dread and then break it with a small outer event (an omen, a footstep).', 'E1, G2, D5'],
  ['Set-piece scene', 'Battle, duel, chase.', 'Name the single question the action answers (will they escape; will he strike). Rukmini is never the fighter; she is the witness whose choice the fight forces. Tie the stakes to a person the audience has met.', 'E1, G3, D6'],
  ['Choice scene', 'Rukmini decides.', 'Make it cost something and make it irreversible. Show the alternative she gives up. Keep the dialogue short; show the act.', 'B3, B6, D2'],
  ['Mythic interlude', 'A Manthana scene.', 'Keep it short and let it end on a choice that mirrors a choice in the human story, without explaining the link.', 'F2, F4, I5'],
  ['Welfare proof scene', 'An ordinary person shows what the world gains.', 'Attach it to a moment of cost: the person appears just after someone has paid. Return to the same person later so the audience feels time pass.', 'I4, E5'],
  ['Silent scene', 'No dialogue.', 'Replace speech with an object, a gesture or a sound that has been planted. Hold the image until the turn lands.', 'G4, E7']
];
c.push(L.tbl(['Scene type', 'What it is', 'Recipe', 'Tests'], rec, [1700, 2200, 4338, 1400]));
c.push(L.gap());

// ---------- 7 candidates
c.push(L.h1('7. Event 06 turned into scene candidates'));
c.push(L.p('Using the beats D06-a to D07-e, here is one set of scene candidates. It is illustrative: it shows the method, and you can split, merge or cut. POV: R = Rukmini, X = another character. Ladder is the step number from section 4. The Brahmin’s time with Krishna at Dvārakā (D06-e) is deliberately not a scene: under the hidden-Krishna rule it reaches the audience as the report in S9.'));
const sc = [
  ['S1', 'Songs in the hall', 'D06-a', 'R', '1, 2', 'Spoken of, indirect', 'Visitors and bards'],
  ['S2', 'The hall decides', 'D06-b', 'R', '3', 'Spoken of, direct (hostile)', 'Rukmī'],
  ['S3', 'Ink', 'D06-c, d', 'R', '4, 5', 'Addressed in the letter', 'The Brahmin'],
  ['S4', 'The bride is made ready', 'D06-f', 'R', '6', 'Not present', 'Women of the palace'],
  ['S5', 'The kings arrive', 'D06-g', 'R', '6, 7', 'Spoken of, direct (hostile)', 'Windows, servants'],
  ['S6', 'The army at the gate', 'D06-h', 'X', '—', 'Spoken of, indirect (Balarama)', 'Balarama'],
  ['S7', 'The waiting', 'D06-i', 'R', '7', 'Not present', 'Her own mind; friends'],
  ['S8', 'Omens and the smile', 'D06-j, e (report)', 'R', '8', 'Spoken of, direct (the Brahmin)', 'The Brahmin'],
  ['S9', 'The city’s wish', 'D06-k', 'R', '8, 9', 'Spoken of, indirect', 'Citizens; welfare figure'],
  ['S10', 'The procession and the prayer', 'D06-l', 'R', '9', 'Spoken of (prayer)', 'Ambikā shrine'],
  ['S11', 'Breaking her silence', 'D06-m', 'R', '10', 'Not present', 'The kings'],
  ['S12', 'First sight', 'D06-n', 'R', '11', 'Face (first)', 'None; her sight'],
  ['S13', 'The lift', 'D06-o', 'R', '12', 'Hands, face', 'None; the act'],
  ['S14', 'The coalition’s lament', 'D06-p, q', 'X', '—', 'Spoken of, direct (hostile)', 'Jarasandha, Śiśupāla'],
  ['S15', 'Rukmī’s oath', 'D06-r', 'X', '13', 'Spoken of, direct (hostile)', 'Rukmī'],
  ['S16', 'The duel', 'D06-s', 'R', '14', 'Effect, face', 'Rukmini as witness'],
  ['S17', 'The plea', 'D06-t', 'R', '15', 'Face', 'Rukmini'],
  ['S18', 'The shaving and the rebuke', 'D06-u, v', 'R', '15, 16', 'Face; Balarama speaks of him', 'Balarama'],
  ['S19', 'Balarama consoles her', 'D06-w', 'R', '16', 'Spoken of, direct', 'Balarama'],
  ['S20', 'Rukmī’s exile', 'D06-x', 'X', '—', 'Spoken of, indirect', 'Bard or reported'],
  ['S21', 'Arrival at the sea', 'D07-a, b, c', 'R', '17', 'Effect (the city)', 'Citizens; ledger figures'],
  ['S22', 'Together', 'D07-d, e', 'R', '17', 'Face', 'None; the image']
];
c.push(L.tbl(['#', 'Scene', 'Beats', 'POV', 'Ladder', 'Krishna tag', 'Carrier'], sc, [550, 2300, 1300, 600, 800, 2438, 1650]));
c.push(L.gap());
const rCount = sc.filter(s => s[3] === 'R').length;
c.push(L.p(`**Count (I1).** ${rCount} of ${sc.length} scenes here are Rukmini’s viewpoint, which is ${(rCount / sc.length * 100).toFixed(0)}%. That passes the suggested 70%. The test that matters is the whole film, though: the Manthana interludes and the earlier events (02 to 05) will add non-Rukmini scenes, so recompute across all scene cards.`));
c.push(L.p('**Krishna’s face (I2).** In this set the face appears first in S12 and then in S13, S16, S17, S18 and S22. Add up the seconds on each card; section 9 sets the budget.'));

// ---------- 8 worked cards
c.push(L.h1('8. Worked scene cards'));
c.push(L.p('Five cards in the format from the framework (section 6 of document 11). They are drafts for you to correct. “Quick test” uses the ten questions in section 10.'));
function card(title, rows) {
  c.push(L.h2(title));
  c.push(L.tbl(['Field', 'Fill'], rows, [2500, 7138]));
  c.push(L.gap());
}
card('Card S2. The hall decides (D06-b, TEXT 10.52.25)', [
  ['Place, sequence, window', 'Palace hall at Kuṇḍina; end of Sequence 1; about 8 to 12% of runtime (D1).'],
  ['Viewpoint', 'Rukmini (ladder step 3).'],
  ['Mamet’s three questions', 'Rukmī wants Rukmini’s agreement to the Śiśupāla match, to bind an alliance and spite Krishna. If he fails, his authority and his standing with the kings are damaged. It happens now because the visitors’ songs have just made her wish known. Rukmini wants her father to hear her. If he does not, her choice is cancelled.'],
  ['Want and obstacle', 'Want: to be heard. Obstacle: a brother who speaks for the house and a father who yields to his son.'],
  ['Value; charge in → out', 'Freedom / control: free (+) → overridden (−).'],
  ['The turn', 'Her father gives way to Rukmī.'],
  ['The gap', 'She expects her father to protect her; he does not.'],
  ['Emotion, intensity', 'Karuṇa with an edge of Raudra (Rukmī); intensity 3 to 4.'],
  ['Krishna tag', 'Spoken of, direct and hostile. Rukmī’s words are the red-torch light: his hostile words about Krishna give the audience a first portrait by the opposite route: what he fears and resents.'],
  ['Dialogue need', 'Dialogue-dependent (D) in the catalogue; can be partly silent if the father’s yielding is a look.'],
  ['Plants and payoffs', 'Plant: Bhīṣmaka’s love for his son, which later explains why he prepares Śiśupāla’s wedding (10.53.7). Plant: Rukmī’s pride, paid off by his oath (S15).'],
  ['Entry and exit', 'Enter on Rukmī already speaking. Exit on her silence, not on a speech.'],
  ['Quick test', 'Passes questions 1 to 8. Open: the father’s line must be written so he is not a villain.']
]);
card('Card S3. Ink (D06-c and D06-d, TEXT 10.52.26 and 10.52.37 to 10.52.43)', [
  ['Place, sequence, window', 'Her quarters; end of Sequence 2; the first turning point, about 20 to 25% (D2).'],
  ['Viewpoint', 'Rukmini (ladder steps 4 and 5).'],
  ['Mamet’s three questions', 'Rukmini wants the Brahmin to carry the letter to Krishna. If he refuses or is stopped, her choice dies in this room. It is now because the wedding is days away.'],
  ['Want and obstacle', 'Want: to send the letter unseen. Obstacle: guards, the palace, her own fear of what she has written.'],
  ['Value; charge in → out', 'Safety / exposure: hidden (+) → staked everything (−). Agency: helpless (−) → acting (+). Two values; if they pull the scene apart, use the first.'],
  ['The turn', 'She seals the letter and gives it to the Brahmin. It cannot be taken back.'],
  ['The gap', 'She expects to hesitate and does not; or she expects him to refuse and he agrees at once.'],
  ['Emotion, intensity', 'Śṛṅgāra and Vīra; intensity 4.'],
  ['Krishna tag', 'Addressed directly in the letter. This is the strongest direct light on him in the first third, and it is Rukmini’s own.'],
  ['Silent version', 'Show the writing, the sealing and the hand-off without reading the text aloud, and let the letter be read in a later scene (S8) by the one who heard it. Keeps G4 and avoids early reading of the whole text.'],
  ['Plants and payoffs', 'Plant: the plan inside the letter (day, procession, way of taking her without harming her kin; 10.52.41 to 10.52.42). Payoff: the procession (S10) and the lift (S13). This is what keeps the climax hers (D6).'],
  ['Entry and exit', 'Enter with the paper already half written. Exit on the Brahmin leaving the room.'],
  ['Quick test', 'Passes all ten if the plan is visible in the scene.']
]);
card('Card S8. Omens and the smile (D06-j with the report from D06-e, TEXT 10.53.27 to 10.53.30)', [
  ['Place, sequence, window', 'The palace; Sequence 6 or 7; the end of the low point and the start of the climb to the second turn, about 66 to 78%.'],
  ['Viewpoint', 'Rukmini (ladder step 8).'],
  ['Mamet’s three questions', 'Rukmini wants the exact words Krishna said. If the report is vague or false, she goes to the temple with nothing. It is now because the hour is almost here.'],
  ['Want and obstacle', 'Want: certainty. Obstacle: the Brahmin has been through the night; he is full of what he saw; he wants to tell the wrong things (the honours, the feast) before the words that matter.'],
  ['Value; charge in → out', 'Hope / despair: dread (−) → relief (+).'],
  ['The turn', 'He walks in smiling, before he speaks.'],
  ['The gap', 'She braces for refusal after a day of imagined reasons; she gets a smile.'],
  ['Emotion, intensity', 'Hāsya in the Brahmin’s fussing is possible here, which would fill the humour gap noted in document 11; Karuṇa turning to Śṛṅgāra; intensity 3.'],
  ['Krishna tag', 'Spoken of, direct (the Brahmin) and Hands (Krishna massaged the Brahmin’s feet, as the Brahmin reports; 10.52.27 to 10.52.29). The Brahmin’s awe is the candle light: a plain man made smaller and larger by what he saw.'],
  ['Exposition in conflict', 'The Brahmin’s report is the exposition. Conflict makes it a scene: she cross-examines him.'],
  ['Plants and payoffs', 'Payoff: the omens (left eye, arm and thigh). Plant: Krishna’s promise to come, which sets the procession (S10).'],
  ['Entry and exit', 'Enter on the omens, already in progress. Exit on her turning to the door.'],
  ['Quick test', 'Passes 1 to 9. Open: how much of what Krishna said to be quoted, and how much withheld for the reveal.']
]);
card('Card S12. First sight (D06-n, TEXT 10.53.52)', [
  ['Place, sequence, window', 'Outside the temple; end of Sequence 6; Break into Three, about 74 to 78%.'],
  ['Viewpoint', 'Rukmini (ladder step 11).'],
  ['Mamet’s three questions', 'Rukmini wants to see him. If she cannot, the walk was for nothing. It is now because the kings are watching and the moment is short.'],
  ['Want and obstacle', 'Want: recognition. Obstacle: the crowd, the kings, her own fear that the real man will not match the stories.'],
  ['Value; charge in → out', 'Known / unknown: unknown (−) → known (+). Also the reversal and recognition of Aristotle in one beat (D7).'],
  ['The turn', 'Her eyes find him.'],
  ['The gap', 'Open decision. The film has built him from others’ light. Choose what the real man adds that the stories did not.'],
  ['Emotion, intensity', 'Śṛṅgāra and Adbhuta; intensity 5.'],
  ['Krishna tag', 'Face, for the first time. The blue light that was withheld from every earlier scene appears now. Budget the seconds.'],
  ['Silent', 'Yes (S in the catalogue). Do not let anyone name him in the scene.'],
  ['Plants and payoffs', 'Payoff: every earlier description of him, set against the sight. Check that each earlier portrait is both confirmed and widened.'],
  ['Entry and exit', 'Enter on her walking out among the kings; exit on the first movement toward her.'],
  ['Quick test', 'Passes all ten once the gap is chosen.']
]);
card('Card M2. Lakṣmī’s choice (D01-f, mythic interlude)', [
  ['Place, sequence, window', 'The shore of the Ocean of Milk; an interlude early in Act I or II, placed before the first turning point so that the theme is planted before Rukmini acts.'],
  ['Viewpoint', 'Lakṣmī, or the watching bard.'],
  ['Mamet’s three questions', 'Lakṣmī wants a lord who does not need to be won by force. If she chooses wrongly, she is seized like the nectar. It is now because every claimant has arrived.'],
  ['Want and obstacle', 'Want: to choose freely. Obstacle: the claimants who assume they will be chosen.'],
  ['Value; charge in → out', 'Choice / seizure: pressed (−) → chooses (+).'],
  ['The turn', 'She passes every claimant, rejecting the Asuras, and goes to the one who has not asked (the choice of Mukunda is in the text; “has not asked” is ADAPTATION).'],
  ['The gap', 'The powerful expect to be chosen.'],
  ['Emotion, intensity', 'Adbhuta and Śṛṅgāra; intensity 3.'],
  ['Krishna tag', 'Not present, or Hands (a garland settling on an unseen shoulder; ADAPTATION).'],
  ['Mirror to the human story', 'Never say so. Framework F4: the audience sees the match when Rukmini chooses.'],
  ['Plants and payoffs', 'Plant: the garland as a recurring object. Payoff: the lotus garland at Krishna’s departure from Mathurā (10.50) and Rukmini’s procession.'],
  ['Entry and exit', 'Enter with the claimants already waiting. Exit on the garland, not on any reaction.'],
  ['Quick test', 'Passes 1 to 8; the mirror is intended to be felt, not tested by a question.']
]);

// ---------- 9 sequence budgets
c.push(L.h1('9. Sequence assembly and budgets'));
c.push(L.p('Scenes live in sequences (framework section 7). A scene count per sequence keeps the film from sagging. These budgets are HEURISTIC and assume an average scene length you set; the table uses 2.5 minutes.'));
const AVG = 2.5;
const rows = [];
const names = ['1 Status quo and inciting incident', '2 Predicament and lock-in', '3 First obstacle', '4 First culmination (midpoint)', '5 Subplot and rising action', '6 Main culmination', '7 New tension and twist', '8 Resolution'];
names.forEach((n, i) => {
  const m120 = 120 / 8, m150 = 150 / 8;
  rows.push([n, `${(i * 12.5)}% to ${((i + 1) * 12.5)}%`, `${m120.toFixed(1)} min, ${(m120 / AVG).toFixed(0)} scenes`, `${m150.toFixed(1)} min, ${(m150 / AVG).toFixed(0)} scenes`]);
});
c.push(L.tbl(['Sequence', 'Window', '120 min', '150 min'], rows, [3600, 1700, 2169, 2169]));
c.push(L.gap());
c.push(L.p(`At ${AVG} minutes a scene, a 120-minute film holds about ${Math.round(120 / AVG)} scenes and a 150-minute film about ${Math.round(150 / AVG)}. Event 06 as drafted in section 7 has ${sc.length} scene candidates; if it fills Sequences 5 to 8 at 120 minutes (${Math.round(120 / 2 / AVG)} scenes), the count fits with room for the Manthana interludes and the earlier events. If you want the earlier events to carry more weight, shorten Event 06 rather than the other way round.`));
c.push(L.h2('Krishna’s face-time budget (HEURISTIC)'));
const f120 = (0.08 * 120).toFixed(1), f150 = (0.08 * 150).toFixed(1);
c.push(L.p(`Suggested ceiling of 8% of runtime on screen with his face: ${f120} minutes at 120, ${f150} at 150. His face first appears in S12, around 74 to 78% of the runtime, so everything falls in the last quarter. The Hands and Shadow tags carry him before that and cost no face-time. The figure is a starting point; set your own and tally it from the cards.`));

// ---------- 10 quick test
c.push(L.h1('10. The scene quick test'));
c.push(L.p('Ten yes-or-no questions. HEURISTIC pass rule: questions 1 and 2 must be yes, and at least eight of ten overall. A scene that fails goes back to the card, not to the page.'));
c.push(L.tbl(['#', 'Question', 'Framework'], [
  ['1', 'Does a value change between the first image and the last? (Must be yes.)', 'E1'],
  ['2', 'Does someone want something and meet something in their way? (Must be yes.)', 'E2'],
  ['3', 'Can I state the turn in one sentence?', 'E1'],
  ['4', 'Is there a gap between what is expected and what happens?', 'E3'],
  ['5', 'Does the scene begin late and end early?', 'E7'],
  ['6', 'Would removing it break a later scene?', 'E6'],
  ['7', 'Is Krishna’s tag set, and does any mention of him reveal the speaker?', 'I2, H4'],
  ['8', 'Is there a carrier, and is the viewpoint intentional?', 'I1, I3'],
  ['9', 'Are the plants and payoffs recorded?', 'E5'],
  ['10', 'Could the key beat work without dialogue?', 'G4']
], [600, 7138, 1900]));
c.push(L.gap());

// ---------- 11 writing
c.push(L.h1('11. When you write the scene itself'));
['Open on an image or an action, not on a character explaining the place.',
  'Give Rukmini a line only when silence would be less. Her strongest acts in the text are acts: writing, walking out, kneeling.',
  'Let other people say less than they feel. The Brahmin’s fussing, Rukmī’s sneer and Balarama’s rebuke are stronger when each leaves something unsaid.',
  'Say the theme once at most, and not in her mouth (red flag: theme preaching).',
  'In the final sequence keep every scene short. The resolution must stay inside its window (framework section 4).',
  'If a scene needs a long explanation of the myth, cut the explanation and keep the image.'].forEach(t => c.push(L.bl(t)));

// ---------- 12 mistakes
c.push(L.h1('12. Mistakes this material invites'));
c.push(L.tbl(['Mistake', 'Why it happens here', 'Fix'], [
  ['Reporting everything', 'So much happens off-screen (Dvārakā, the cave, the sieges) that every scene becomes someone telling Rukmini.', 'Make each report a scene with a want (section 6). Where possible show the effect rather than the tale.'],
  ['One shape for every scene', 'The catalogue ratings are mostly high; scenes pile up at intensity 4 or 5.', 'Plan relief scenes on purpose: quiet, domestic, a welfare proof.'],
  ['A Krishna-shaped hole', 'Hiding him can make the story feel as if it lacks a centre.', 'Make every mention specific, and let the speaker change over time.'],
  ['The tour of events', 'Walking through Events 02 to 05 in order, one after another, with no pressure on Rukmini.', 'Tie each event to a decision or fear of hers (the carriers in the event files).'],
  ['Mythic scenes that explain', 'The Manthana feels meaningful and invites a lecture.', 'End each interlude on an image, and keep it under the minutes you set.']
], [2200, 3938, 3500]));
c.push(L.gap());

// ---------- 13 limits
c.push(L.h1('13. Limits'));
['Value axes and charges for Rukmini’s ladder are my proposals; the text gives almost nothing of her inner life.',
  'The scene candidates are one possible cut of Event 06. The order of the whole film is not fixed and the scene counts are guides.',
  'The five cards are drafts. Open questions are marked in each card; they need your decisions (see document 13).',
  'Passing the quick test shows a scene is built, not that it is good. Read it aloud and judge it as an audience would.'].forEach(t => c.push(L.bl(t)));

L.save(L.makeDoc('Scene Building Guide', 'Scene Building Guide', c), OUT + '12_Scene_Building_Guide.docx');
