const L = require('./lib');
const OUT = '/home/claude/story_events/';

// ---------------------------------------------------------------- 07 FINAL EPISODE
const e7 = {
  fileNo: 'EVENT 07', title: 'The Final Episode: Together After the Climax', sub: 'Rukmini and Krishna in Dvārakā, with the marriage left unseen',
  footer: 'Event 07: Together After the Climax',
  position: 'Immediately after the abduction and its aftermath. The last episode of the film.',
  place: 'The road to Dvārakā; Dvārakā by the sea.',
  anchor: 'Śrīmad-Bhāgavatam 10.54.53 to 10.54.60 (arrival and celebration; TEXT, checked). The “together” scenes themselves are ADAPTATION.',
  rukminiLink: 'The film ends on Rukmini: the woman who chose, arriving at the place she chose, and standing beside the one she chose, who has hardly been seen. The brief says no events after the marriage and no marriage on screen.',
  brief: [
    'The Bhāgavata says Krishna marries Rukmiṇī according to Vedic rites and takes her to Dvārakā; the city erupts in celebration, its streets and doorways decorated, guests from many royal clans rejoice, and the citizens offer jewelled gifts to the bride and groom. The kings hear the story of the abduction, and it is sung throughout the land. The chapter closes with Dvārakā overjoyed to see Krishna united with Rukmiṇī.',
    'Per the brief, the film leaves the wedding itself off screen and ends with the two of them together after the climax. This file gathers what that final episode can hold: the arrival, the sea, the city’s welcome, the quiet between them, the cost of the day (Rukmī’s absence) and the world’s gain.'
  ],
  beatNote: 'The first three beats are TEXT; the rest are a menu of ADAPTATION material to choose from. Choose later.',
  beatHead: ['Ref', 'Beat'],
  beatW: [1700, 7938],
  beats: [
    ['TEXT 10.54.36 to 10.54.50', 'Before the arrival, Balarama consoles Rukmiṇī about her brother: each person bears their own joy and sorrow; the self is not the body. She calms. (Bridge from the climax.)'],
    ['TEXT 10.54.53', 'Krishna marries Rukmiṇī according to Vedic rites and brings her to Dvārakā. (The rites are not shown; an ellipsis.)'],
    ['TEXT 10.54.54 to 10.54.60', 'Dvārakā is decorated; guests from many clans rejoice; citizens offer jewelled gifts; the kings hear the story of the abduction, which is sung through the land; the city is overjoyed to see them together.'],
    ['ADAPTATION', '**The first sight of the sea.** Rukmini, who has lived inland, sees the ocean for the first time from the chariot, with a city rising from the water.'],
    ['ADAPTATION', '**The city at its doors.** Doorways with lamps, flowers on the streets, the flower vendor and the water-carrier and the potter in the crowd; the proof of the ledger.'],
    ['ADAPTATION', '**The lamp.** Her lamp from Kuṇḍina and a matching lamp lit in Dvārakā (the twin lamps motif): the answer to the letter.'],
    ['ADAPTATION', '**Together at the edge of the sea.** The two stand side by side, shown from behind or in profile, with Rukmini the visual centre.'],
    ['ADAPTATION', '**What he says, and does not say.** A line or a silence: a reply to her letter, or her telling him what she saw at the temple (the reverse of the letter).'],
    ['ADAPTATION', '**The cost.** Rukmī’s absence: a place laid for a brother who will not come; a thread to Bhojakaṭa.'],
    ['ADAPTATION', '**The song.** A bard sings the story of the abduction, as the text says it was sung; the film’s story becomes the song, from Rukmini’s side.'],
    ['ADAPTATION', '**The last image.** The two together in one frame, held a little longer than any shot of Krishna in the film.']
  ],
  cast: [
    ['Rukmini', 'The protagonist, arriving and staying', 'The film’s last look is hers.'],
    ['Krishna', 'Beside her', 'Hidden until the abduction; seen with her here, briefly.'],
    ['Balarama', 'Comforter before the arrival; present at the welcome', 'The brother’s consolation bridges the climax and the ending.'],
    ['The people of Dvārakā', 'The welcome', 'The ordinary witnesses from the ledger.'],
    ['The bard', 'Sings the story', 'Carrier of every earlier event.'],
    ['Rukmī, Śiśupāla, Jarasandha', 'Absent', 'Their absence is the cost and the unfinished threat; none is shown after the marriage.']
  ],
  reach: [
    'This event is Rukmini’s own: no carrier is needed. The earlier events return in the bard’s song, in the city’s details, and in what she recognises: the sea from the stories, the lamps from the Brahmin’s account, the gate from the guard’s story.',
    '**Echoes she can recognise:** the Earth-cow (a cow in the street), the seventeen chalk marks (the wall in Dvārakā is clean), the walk with the lotus garland (a garland on the door), the sea (the Ocean of Milk).'
  ],
  talk: [
    ['Balarama to Rukmiṇī (10.54.36 to 10.54.50)', 'DIRECT', 'People bear their own joy and sorrow; do not grieve for your brother as if he were lost.', 'A close, unromantic view of Krishna.'],
    ['The citizens to the couple (10.54.55)', 'EFFECT', 'They offer gifts and rejoice.', 'He is greeted as one of their own.'],
    ['The bard (ADAPTATION)', 'DIRECT', 'Sings the abduction as she lived it.', 'The film’s portrait of him, now complete.'],
    ['Krishna to Rukmiṇī (ADAPTATION)', 'DIRECT', 'A reply to her letter, or silence.', 'Option, not a commitment.'],
    ['Rukmini to Krishna (ADAPTATION)', 'DIRECT', 'What she saw at the temple.', 'The mirror of the earlier light: she lights him now.']
  ],
  hidden: [
    'After the abduction, Krishna has been seen. The aim here is not to hide him but to keep his screen time small and to keep Rukmini at the centre of every frame he is in.',
    'The marriage is an ellipsis: the cut goes from the road to the city, and from the city to the two of them together. The text’s “Vedic rites” are never shown.',
    'No events after the marriage appear: no teasing, no birth of children, no later sieges, no Rājasūya.'
  ],
  welfare: ['The whole ledger at once: the vendor, the water-carrier, the potter, the goatherd, the farmer and the fisher family', 'The world’s gains, shown together: flowers bloom, the wall is clean, the wheel turns, the road is open, the field is plough-turned, the net is full.', 'A single wide shot of the street, with each of them in a doorway.'],
  links: [
    '**Event 01 (Manthana):** after Lakṣmī chooses Viṣṇu, she is given a permanent place on his chest and light returns to the world; Śiva’s bewilderment at Mohinī is an optional echo of the world’s astonishment.',
    '**Event 02 (Earth’s burden):** the burden is lightened by the end.',
    '**Event 03 (Jarasandha):** “time turns” (10.54.10 to 10.54.17) is a line the audience hears and the film leaves open.',
    '**Event 04 (Dvārakā):** the city as the ending place.',
    '**Event 06 (abduction):** the immediate before.'
  ],
  questions: [
    'Do we show the arrival and welcome, or cut straight to the two of them together?',
    'Does Krishna speak in the last scene?',
    'Is the bard’s song the closing device, or is there only the image?',
    'How much of Rukmī’s absence (the empty place, a letter) belongs in the ending?'
  ],
  cautions: [
    'The “together” scenes are not in the text. Only the arrival, the celebration and the sung story are.',
    'The brief excludes events after the marriage; this file has respected that and left out the teasing scene (10.60), the birth of Pradyumna and later episodes.'
  ],
  before: 'Event 06 (the abduction and its aftermath).',
  after: 'Nothing; this is the end of the film.'
};

// ---------------------------------------------------------------- 08 WELFARE LEDGER
function ledger() {
  const c = [];
  L.titleBlock(c, 'COMPANION FILE', 'The World-Welfare Ledger', 'One ordinary person per event, showing what the world gains');
  c.push(L.note('Labels. All people and images here are ADAPTATION. The “gain” column follows what the Bhāgavata gives each event (Events 01 to 07). The ledger can work in any genre and with or without dialogue.'));
  c.push(L.h1('1. Why this file exists'));
  c.push(L.p('“Loka kalyāṇam” means the welfare of the world. This ledger gives every event one ordinary person who shows what the world gains from it. They are witnesses, not heroes, and each gain should be shown by an image rather than a speech. The same people can recur across the film, so that by the final episode they have all been seen.'));
  c.push(L.h1('2. The ledger'));
  c.push(L.tbl(['Event', 'Ordinary person', 'Place', 'What the world gains', 'Proof image'], [
    ['01 Manthana', 'A fisher family on the shore of the Ocean of Milk', 'The mythic shore', 'The poison is held; the water clears; light returns with Lakṣmī.', 'A child’s hand comes out of the water clean; a net full of silver.'],
    ['02 Earth’s burden', 'A farmer and his cow', 'A field outside Kuṇḍina', 'The Earth’s burden begins to lift; fields are no longer trampled by armies.', 'The cow lies down in the furrow.'],
    ['03 Jarasandha', 'A water-carrier on the wall of Mathurā', 'Mathurā', 'Each siege ends; the city gets time to breathe.', 'Chalk marks on a wall, reaching seventeen.'],
    ['04 Dvārakā', 'A potter whose wheel is moved to the new quay', 'Dvārakā', 'A people are saved from a two-front war and given a safe city.', 'He turns the first pot of the new city by the sea.'],
    ['05 Mucukunda', 'A goatherd whose flock grazes near the cave', 'The mountain road', 'The besieging army is gone; the pastures and road reopen.', 'Smoke from the cave; the goats walk onto the road.'],
    ['06 Abduction', 'A flower vendor, a weaver and a ferryman', 'Kuṇḍina', 'A coerced alliance does not bind two kingdoms to war; markets return; a defeated man is allowed to live.', 'Garlands used for a different bride; the wedding cloth carried off; the ferryman crosses a Yadava soldier only.'],
    ['07 Together', 'All of the above, together', 'Dvārakā', 'All the gains are visible at once.', 'A wide street shot with each of them in a doorway.']
  ], [1300, 2000, 1400, 2700, 2238]));
  c.push(L.gap());
  c.push(L.h1('3. Recurring ordinary people'));
  c.push(L.p('Treat these as a cast of recurring faces. Names are left open.'));
  ['**The flower vendor of Kuṇḍina:** her flowers wilt in the Manthana opening, are used for a different bride in the climax, and bloom in the final city.',
    '**The water-carrier:** appears in Mathurā as the counter of attacks, and again in the final city beside a clean wall.',
    '**The potter:** the same man who relocates to the sea.',
    '**The goatherd:** the witness near the cave; may also be glimpsed on the Brahmin’s road.',
    '**The farmer and cow:** the Earth’s burden; a field the armies cross.',
    '**The ferryman:** the river crossing near Kuṇḍina; also the Brahmin’s route.',
    '**The bard:** the carrier of all the stories to Rukmini, and the voice that sings the film’s story at the end.'].forEach(t => c.push(L.bl(t)));
  c.push(L.h1('4. Rules for using the ledger'));
  ['One person and one proof image per event; more only if the story earns it.',
    'The proof should be visible without dialogue, so the ledger also works in a silent film.',
    'The person should be unaware of the larger events: they live by the result, not the cause.',
    'The ledger closes in Event 07 with all the people seen together.'].forEach(t => c.push(L.bl(t)));
  return L.makeDoc('The World-Welfare Ledger', 'Companion: World-Welfare Ledger', c);
}

// ---------------------------------------------------------------- 00 INDEX
function index() {
  const c = [];
  L.titleBlock(c, 'START HERE', 'The Story Events: Index and Conventions', 'Seven events, one ledger, and the rules that every file follows');
  c.push(L.note('This set gathers the story events for the Krishna–Rukmini film before any plot is built. Each event has its own file so they can be combined later in any order. Variants (thriller, silent film and others) are deliberately left for later.'));

  c.push(L.h1('1. The events in story-time order'));
  c.push(L.tbl(['No.', 'Event', 'Text anchor', 'File'], [
    ['01', 'Kṣīra Sāgara Manthana (the Churning of the Ocean of Milk)', 'Bhāgavata 8.5 to 8.12 (your episode file)', '01_Ksheera_Sagara_Manthana.docx'],
    ['02', 'The Burden of the Earth', 'Bhāgavata 10.1.17 to 10.1.28', '02_Burden_of_the_Earth.docx'],
    ['03', 'Jarasandha’s Repeated Attacks', 'Bhāgavata 10.50.1 to 10.50.42; 10.52.6 to 10.52.14', '03_Jarasandha_Repeated_Attacks.docx'],
    ['04', 'The Founding of Dvārakā on the Sea', 'Bhāgavata 10.50.43 to 10.50.58', '04_Founding_of_Dvaraka.docx'],
    ['05', 'The Kālayavana Trap at Mucukunda’s Cave', 'Bhāgavata 10.51; 10.52.1 to 10.52.5', '05_Kalayavana_and_Mucukunda_Cave.docx'],
    ['06', 'The Abduction of Rukmini', 'Bhāgavata 10.52.16 to 10.54.52', '06_Abduction_of_Rukmini.docx'],
    ['07', 'The Final Episode: Together After the Climax', 'Bhāgavata 10.54.53 to 10.54.60 plus adaptation', '07_Final_Episode_Together.docx'],
    ['—', 'The World-Welfare Ledger (companion)', 'Adaptation', '08_World_Welfare_Ledger.docx'],
    ['—', 'Action Sequences Catalogue (companion)', 'Bhāgavata verses plus adaptation', '09_Action_Sequences_Catalogue.docx'],
    ['—', 'Intense Dramatic Events Catalogue (companion)', 'Bhāgavata verses plus adaptation', '10_Intense_Dramatic_Events_Catalogue.docx']
  ], [600, 3400, 2938, 2700]));
  c.push(L.gap());
  c.push(L.p('The order follows the Bhāgavata. Note that Dvārakā is built (Event 04) before the cave (Event 05), and that Jarasandha’s last chase (end of Event 03) happens after the cave. When you combine, you can split Event 03 into two.'));

  c.push(L.h1('2. The conventions every file follows'));
  ['**Rukmini is the protagonist.** Every event is gathered twice: as it happens (TEXT), and as it reaches Rukmini (ADAPTATION). Most events happen far from her; they reach her as stories, songs, letters, reports and rumours.',
    '**Krishna is hidden.** He is not shown directly before the abduction. Characters speak of him, directly (naming or describing him) or indirectly (a reference, a report, an effect). Each file has a “Who speaks of Krishna here” table and a “Keeping Krishna hidden” section.',
    '**The ending is together, not a wedding.** The marriage is not shown; the last episode shows them together after the climax; no events after the marriage appear.',
    '**The world-welfare beat.** Each event has one ordinary person who shows what the world gains. The companion ledger collects them.',
    '**Catalogues.** Files 09 and 10 list the possible action sequences (wars, battles, duels, chases, spectacle) and the possible intense dramatic events (with Rukmini’s emotional ladder), each tied to an event and a verse.',
    '**Labels.** SOURCE (your files), TEXT (Bhāgavata, checked in this pass), TRADITION (other sources, not re-checked), ADAPTATION (invention for the film).'].forEach(t => c.push(L.bl(t)));

  c.push(L.h1('3. How the events reach Rukmini (story carriers)'));
  c.push(L.tbl(['Carrier', 'Source', 'What they carry'], [
    ['Visitors to Bhīṣmaka’s palace', 'TEXT 10.52.23', 'Krishna’s qualities, beauty and valour; the first image she forms.'],
    ['The bards in her procession', 'TEXT 10.53.42', 'Songs and recitals; the Manthana; the sieges; the cave.'],
    ['The Brahmin messenger', 'TEXT 10.52.26 to 10.52.44; 10.53.30', 'The only first-hand account of Krishna before the temple; Dvārakā.'],
    ['Merchants and sailors', 'ADAPTATION', 'Travel tales; news of the sieges and the sea city.'],
    ['Nārada’s marks of Krishna', 'TEXT 10.51 (Kālayavana recognises Krishna by them)', 'The one precise description by a third party.'],
    ['The Ambikā temple mural and priests', 'ADAPTATION', 'The Manthana, the Earth-cow, the Lord’s forms.'],
    ['Balarama', 'TEXT 10.54.36 to 10.54.50', 'The brother’s portrait and consolation.']
  ], [3000, 3138, 3500]));
  c.push(L.gap());

  c.push(L.h1('4. Recurring cast'));
  c.push(L.tbl(['Character', 'Role across the events', 'Where they appear'], [
    ['Rukmini', 'Protagonist; chooser', '06, 07 (and heard of in all)'],
    ['Krishna', 'Hidden support; the answer', 'All, mostly unseen'],
    ['Balarama', 'Elder brother, defender, comforter', '03, 04, 05, 06, 07'],
    ['Rukmī', 'Brother; blocks and vows', '06'],
    ['Bhīṣmaka', 'Father', '06'],
    ['Śiśupāla and Damaghoṣa', 'The chosen groom and his father', '06 (your Shishupala file for the wider life)'],
    ['Jarasandha', 'Leader of the coalition', '03, 06'],
    ['The Brahmin', 'The messenger', '06'],
    ['Nārada', 'Messenger of the gods; sends Kālayavana', '05'],
    ['Viṣṇu, Lakṣmī, Śiva, Brahmā, Indra', 'The mythic cast', '01, 02, 04'],
    ['The ordinary people', 'The ledger’s witnesses', 'All (see ledger)']
  ], [2200, 4238, 3200]));
  c.push(L.gap());

  c.push(L.h1('5. Tensions to settle when you combine'));
  ['**Others see Krishna in the text.** The Brahmin, Bhīṣmaka and the citizens of Kuṇḍina see him before Rukmiṇī does (10.52.27 to 10.52.36; 10.53.31 to 10.53.38). The text supports Rukmiṇī’s first sight at the temple (10.53.52).',
    '**Krishna acts in the cave, the sieges and the duel.** These can be told, shown through witnesses, or kept to effects. See each file’s “Keeping Krishna hidden”.',
    '**Event 03 splits across the cave.** Its last beats (the chase and the leap) fall after Event 05.',
    '**The Pārijāta tree** appears in Event 01 (the Ocean) and Event 04 (Indra’s gift at the founding of Dvārakā).',
    '**Rukmini’s identity as Lakṣmī** is traditional (reported as Viṣṇu, Bhāgavata and Padma Purāṇas by a secondary source); it is the main bridge between Events 01 and 06.'].forEach(t => c.push(L.bl(t)));

  c.push(L.h1('6. What this pass checked, and what it did not'));
  ['**Checked:** verse-level summaries of Bhāgavata 10.1.17 to 10.1.28, 10.50, 10.51, 10.52, 10.53 and 10.54 against a Bhāgavatam text site (Prabhupāda-edition numbering), summarised by a tool. Verse numbers can be off by one; quote only after reading the verse.',
    '**From your files:** the Manthana episode, and the Rukmi, Shishupala and Balarama stories.',
    '**Secondary sources only:** Rukmini as Lakṣmī; Kālayavana’s parentage and other versions; the Durvāsā–Rukmini temple legend (not used here).',
    '**Corrections to earlier documents in this project:** (a) the Pārijāta tree is given by Indra at the founding of Dvārakā (10.50.54 to 10.50.56), not only fetched later; (b) the omens belong to 10.53 (the waiting), not 10.52; (c) the Brahmin messenger is in the Bhāgavata text, though unnamed; (d) Nārada sends Kālayavana (10.50.43 to 10.50.44); (e) the letter’s seven verses are 10.52.37 to 10.52.43.'].forEach(t => c.push(L.bl(t)));
  return L.makeDoc('The Story Events: Index and Conventions', 'Story events: index', c);
}

Promise.all([
  L.save(L.eventDoc(e7), OUT + '07_Final_Episode_Together.docx'),
  L.save(ledger(), OUT + '08_World_Welfare_Ledger.docx'),
  L.save(index(), OUT + '00_Index_and_Conventions.docx')
]);
