const L = require('./lib');
const OUT = '/home/claude/story_events/';

function entry(name, what, hidden, extra) {
  return `**${name}**\n${what}\n**Hidden-Krishna handling:** ${hidden}` + (extra ? `\n${extra}` : '');
}
const W4 = [900, 5638, 1500, 1600];
const H4 = ['ID', 'Sequence', 'Anchor', 'Scale · Intensity'];

const c = [];
L.titleBlock(c, 'CATALOGUE 09', 'Action Sequences', 'Wars, battles, duels, chases and spectacle set-pieces across the story events');
c.push(L.note('Labels. TEXT = Bhāgavata verse checked in this pass (numbering may be off by one); SOURCE = your supplied files; TRADITION = other sources, not re-checked; ADAPTATION = invention for the film. This file gathers what is possible; it does not order or choose. Variants come later.'));

c.push(L.h1('1. How to read this catalogue'));
c.push(L.p('Every entry has an ID (A + event number + a letter), the event it belongs to, a short account of the action, and how Krishna stays hidden in it. Two ratings follow each entry.'));
c.push(L.tbl(['Rating', 'Meaning'], [
  ['Scale S1', 'A duel or a single moment: two or three people.'],
  ['Scale S2', 'A skirmish, chase or breakout: a small group in motion.'],
  ['Scale S3', 'A battle: armies, a city or a road.'],
  ['Scale S4', 'Cosmic: gods, demons, the Ocean, the sky.'],
  ['Intensity 1 to 5', '1 = quiet tension; 3 = strong set-piece; 5 = a peak of the film.'],
  ['Silent-capable', 'Almost all of these work without dialogue; where the action depends on a spoken line the entry says so.']
], [2400, 7238]));
c.push(L.gap());
c.push(L.p('**Rukmini’s place in action.** She is the protagonist but is not a fighter; her decisive acts are walking out, kneeling and pleading. The catalogue notes where she is present, where she only hears, and where her action is the turning point of a fight (A06-5 and A06-9).'));

c.push(L.h1('2. Action grammar: how each side fights'));
c.push(L.p('A consistent fighting style per character is what makes action tell story. These styles follow what the text shows.'));
c.push(L.tbl(['Who', 'Style', 'Signature', 'What it says about them'], [
  ['Krishna', 'Precision and restraint', 'Breaks bows, weapons and shields rather than killing (10.54.21 to 10.54.31); spares Jarasandha again and again (10.50.5 to 10.50.10; 10.50.41 to 10.50.42); conch (10.50.16); chariot; the sky-chariots and weapons (10.50.11 to 10.50.12). The Sudarśana disc is TRADITION here (it appears in the Manthana file and later at the Rājasūya).', 'He disarms and delays; he uses fights to move people, not to win them.'],
  ['Balarama', 'Mass and force', 'The plough and the club (SOURCE: Balarama file; TEXT 10.50.27 to 10.50.29, 10.54.6 to 10.54.8 name Saṅkarṣaṇa and Gada among those who rout the enemy); seizes Jarasandha (10.50.30).', 'The elder brother’s directness; the film’s visible muscle.'],
  ['Jarasandha', 'Numbers and siege', 'Armies of twenty-three akṣauhiṇīs (10.50.4; 10.52.7); sets a mountain on fire (10.52.11).', 'Persistence and grievance; losing, he learns nothing and comes again.'],
  ['Rukmī', 'Repeated re-arming', 'Takes up new bows as each is broken (10.54.21 to 10.54.31); pursues alone (10.54.18 to 10.54.20).', 'Pride that cannot accept the evidence of the battlefield.'],
  ['Śiśupāla and the kings', 'Show of force', 'Armies, vows, rage (10.53.14 to 10.53.19; 10.54.1 to 10.54.5).', 'Fear dressed as honour.'],
  ['Kālayavana', 'Contempt and pursuit', 'Follows on foot, unarmed, taunting (10.51.6 to 10.51.8); kicks a sleeper (10.51.10).', 'The arrogant who does not look where he runs.'],
  ['Mucukunda', 'A glance', 'Wakes and burns the intruder to ash (10.51.12).', 'Power held in sleep; killing without intention.'],
  ['Indra, Bali and the gods and Asuras', 'Cosmic weapons and illusion', 'Thunderbolt; Bali’s illusions (SOURCE: Manthana file 14).', 'The mythic double of the mortal armies.'],
  ['Śiva', 'Absorption, not fighting', 'Drinks Hālāhala (SOURCE: Manthana file 6).', 'The model of holding a harm so it does not spread.'],
  ['Rukmini', 'Choice and plea', 'Walks out of the temple (10.53.50 to 10.53.52); falls at Krishna’s feet (10.54.32 to 10.54.34).', 'Her two actions end or redirect two fights.']
], [1500, 1800, 3938, 2400]));
c.push(L.gap());

c.push(L.h1('3. Event 01: Kṣīra Sāgara Manthana (cosmic action)'));
c.push(L.tbl(H4, [
  ['A01-a', entry('The rout of the Devas', 'After Durvāsā’s curse the Asuras overrun a weakened heaven and the Devas flee to Brahmā. Colour drains from the armour and the court.', 'The Lord is absent; he appears only as the destination they run toward.'), 'SOURCE 8.5', 'S4 · 3'],
  ['A01-b', entry('The sinking of Mandara', 'The mountain is carried to the shore and sinks into the ocean; the Lord becomes Kūrma and lifts it on his back. A disaster that is also a rescue.', 'Kūrma is seen only as a rising landform and a shell-like dome, never a face.'), 'SOURCE 8.6', 'S4 · 4'],
  ['A01-c', entry('The Great Churning', 'Devas at the tail and Asuras at the head of Vāsuki haul against each other; the mountain spins, the Ocean convulses. Endurance action: blistered hands, rope creak, tide.', 'The Lord empowers both teams invisibly; the strain is visible, the helper is not.'), 'SOURCE 8.6 to 8.7', 'S4 · 4'],
  ['A01-d', entry('Hālāhala', 'The poison surges, beings flee in panic; Śiva walks into it, drinks, and Pārvatī holds it at his throat.', 'Not applicable; Śiva is the actor.', 'A disaster-escape followed by a still, quiet climax.'), 'SOURCE 8.7', 'S4 · 4'],
  ['A01-e', entry('The seizure of the pot', 'The Asuras snatch the amṛta from Dhanvantari and fight each other over who drinks first.', 'The Lord watches by absence; his next move is already forming.'), 'SOURCE 8.8', 'S3 · 3'],
  ['A01-f', entry('Mohinī and the distribution', 'A deception sequence, closer to a heist than a fight: the Asuras entrust the pot to a beautiful stranger who gives it to the Devas.', 'Mohinī is shown as hands, hair and voice only.'), 'SOURCE 8.9', 'S2 · 3'],
  ['A01-g', entry('Rāhu’s infiltration', 'Rāhu hides among the Devas to drink; the sun and moon expose him; the disc severs his head, which survives.', 'The disc is an arriving flash; no hand holds it on screen.'), 'SOURCE 8.9', 'S1 · 3'],
  ['A01-h', entry('The Deva–Asura war', 'The alliance collapses; Bali leads the Asuras with illusions, Indra leads the Devas with the thunderbolt; weapons and magic fill the field until the Devas regain heaven.', 'The Lord’s hand is felt in the turning of the battle, not seen.', 'The film’s largest cosmic set-piece; it can be cross-cut with A06-6.'), 'SOURCE 8.10 to 8.11', 'S4 · 5']
], W4));
c.push(L.gap());

c.push(L.h1('4. Event 02: The Burden of the Earth'));
c.push(L.tbl(H4, [
  ['A02-a', entry('The march of the burden', 'Not a fight but a spectacle of pressure: armies of arrogant kings tramp across fields; the Earth, as a weeping cow, collapses under them.', 'The Lord is only a voice from the sky, later.', 'Can be staged as the same armies that appear at Kuṇḍina.'), 'TEXT 10.1.17 to 10.1.18', 'S3 · 2']
], W4));
c.push(L.gap());

c.push(L.h1('5. Event 03: Jarasandha’s repeated attacks'));
c.push(L.tbl(H4, [
  ['A03-a', entry('The siege of Mathurā', 'Twenty-three akṣauhiṇī divisions surround the city (a standard akṣauhiṇī is 21,870 chariots, 21,870 elephants, 65,610 cavalry and 109,350 infantry, so about five million fighters in all: TRADITION). For film, show it as an army that fills the horizon, not a count.', 'No Krishna in the shot; the city is seen from the walls.'), 'TEXT 10.50.4', 'S3 · 3'],
  ['A03-b', entry('The sky-chariots', 'Two radiant chariots with drivers and divine weapons descend from the sky.', 'An effect: light, wheels, a sound; the passenger is not seen.'), 'TEXT 10.50.11 to 10.50.12', 'S2 · 3'],
  ['A03-c', entry('The sortie and the conch', 'Krishna and Balarama ride out with a small contingent. The conch sounds and the enemy trembles.', 'The conch is heard before anything is seen.'), 'TEXT 10.50.13 to 10.50.16', 'S2 · 4'],
  ['A03-d', entry('The battle of Mathurā', 'Jarasandha surrounds them; arrows destroy elephants, horses and chariots, and the plough sweeps the infantry. The women on the walls faint when the chariots are hidden by the enemy.', 'Shown from the walls and by the faces of the women; arrows and ploughs are effects.', 'Includes the exchange of taunts (10.50.17 to 10.50.19), which depends on dialogue.'), 'TEXT 10.50.17 to 10.50.29', 'S3 · 5'],
  ['A03-e', entry('Jarasandha seized and freed', 'Balarama grabs the defeated king and starts to bind him; Krishna stops him. A small fight with a large moral turn.', 'Krishna’s restraining word or hand is reported or shown only by Balarama’s hesitation.'), 'TEXT 10.50.30 to 10.50.31', 'S1 · 4'],
  ['A03-f', entry('The seventeen attacks', 'A cycle of sieges, each defeated. Escalation ideas: a night assault, a fire assault, an elephant charge, siege towers, a flood. ADAPTATION for the variations; the count is TEXT.', 'The chalk-mark counter (the water-carrier on the wall) is the through-line; the fighting is told by the marks.'), 'TEXT 10.50.41 to 10.50.42', 'S3 · 3 each'],
  ['A03-g', entry('The chase on foot and the burning hill', 'After the cave, Jarasandha returns with twenty-three divisions; Krishna and Balarama run on foot, climb Pravarṣaṇa, and he sets the hill on fire.', 'Two figures in smoke, never a clear face.'), 'TEXT 10.52.6 to 10.52.11', 'S2 · 5'],
  ['A03-h', entry('The leap', 'They jump from the burning peak and disappear; Jarasandha thinks them dead and goes home.', 'A single silhouette against flame; the landing is off screen.'), 'TEXT 10.52.12 to 10.52.14', 'S1 · 5']
], W4));
c.push(L.gap());

c.push(L.h1('6. Event 04: The founding of Dvārakā (spectacle and logistics)'));
c.push(L.tbl(H4, [
  ['A04-a', entry('Raising the sea city', 'A fortress twelve yojanas around rises from the ocean: gold gateways, crystal terraces, the gods’ gifts. Spectacle action: sea against stone.', 'The architect and the gods are shown; the one who commissioned it is not.'), 'TEXT 10.50.49 to 10.50.56', 'S3 · 3'],
  ['A04-b', entry('The great move', 'By yogic power every person of Mathurā is carried to Dvārakā at once; they wake by the sea. A mass-evacuation set-piece with no enemy.', 'An effect; the people’s wonder is the shot.'), 'TEXT 10.50.57', 'S3 · 3']
], W4));
c.push(L.gap());

c.push(L.h1('7. Event 05: The Kālayavana trap at Mucukunda’s cave'));
c.push(L.tbl(H4, [
  ['A05-a', entry('The Yavana siege', 'Kālayavana besieges Mathurā with thirty million troops. A wider and stranger army than Jarasandha’s.', 'The besieged city; no Krishna.'), 'TEXT 10.50.43 to 10.50.44', 'S3 · 4'],
  ['A05-b', entry('The unarmed chase', 'Krishna walks out unarmed in a lotus garland; Kālayavana runs after him on foot, always one step short, across the land to a mountain cave. A chase where the pursued sets the pace.', 'A figure ahead at the edge of the frame; footprints; the pursuer’s face.'), 'TEXT 10.50.58; 10.51.1 to 10.51.8', 'S2 · 4'],
  ['A05-c', entry('The cave', 'In the dark, a sleeper; the kick; the wake; a glance; ash. A short, silent and frightening fight with no weapon.', 'Mucukunda’s face is the camera’s subject; Krishna appears only after Kālayavana is dead.'), 'TEXT 10.51.9 to 10.51.12', 'S1 · 4'],
  ['A05-d', entry('The Yavana army destroyed', 'Krishna returns to Mathurā and destroys the barbarian army, sending its wealth toward Dvārakā.', 'A summary beat; effects only.'), 'TEXT 10.52.5', 'S3 · 3']
], W4));
c.push(L.gap());

c.push(L.h1('8. Event 06: The abduction of Rukmini'));
c.push(L.tbl(H4, [
  ['A06-a', entry('The Brahmin’s ride', 'The messenger’s journey to Dvārakā and back. Dangers are not in the text; ADAPTATION options include a guard post, a river crossing and a pursuer sent by Rukmī.', 'N/A; the Brahmin is the actor.'), 'TEXT 10.52.26; 10.53.27 to 10.53.30', 'S2 · 2'],
  ['A06-b', entry('The night ride', 'Krishna and the Brahmin ride from Ānarta to Vidarbha in a single night, with Dāruka driving.', 'Chariot, road, dawn light; the occupants are backlit.'), 'TEXT 10.53.4 to 10.53.6', 'S2 · 3'],
  ['A06-c', entry('Kuṇḍina on the edge', 'Armies assemble; the kings vow to fight if Krishna comes; Balarama arrives with an army. A battle that has not yet happened.', 'He is known by the weapons raised against him.'), 'TEXT 10.53.14 to 10.53.21', 'S3 · 3'],
  ['A06-d', entry('The guarded procession', 'Rukmini walks to the temple inside a ring of soldiers, with mothers, friends, musicians and bards. Escape-through-ceremony action.', 'No Krishna; the guards watch the road for him.'), 'TEXT 10.53.39 to 10.53.43', 'S2 · 3'],
  ['A06-e', entry('The abduction', 'She steps out, sees him, and is lifted onto the chariot before the kings. He drives through the ring of kings with Balarama leading.', 'The first full sight of him; brief and sustained at once. Her view is the camera.', 'The film’s central action beat; consent is carried by her letter and her walk toward the chariot.'), 'TEXT 10.53.50 to 10.53.56', 'S2 · 5'],
  ['A06-f', entry('The pursuit and the Yadava defence', 'The kings arm and chase; arrows fall; Gada, Saṅkarṣaṇa and others strike down horses, elephants and chariots. Krishna reassures her.', 'The chariot is the still centre; the battle swirls behind it.'), 'TEXT 10.54.1 to 10.54.8', 'S3 · 5'],
  ['A06-g', entry('The rout', 'Jarasandha’s side sees its forces destroyed and withdraws; he consoles Śiśupāla.', 'Told through the defeated.'), 'TEXT 10.54.9 to 10.54.17', 'S3 · 3'],
  ['A06-h', entry('Rukmī’s pursuit and the duel', 'Rukmī vows, pursues with one division and attacks; Krishna breaks bow after bow, weapon after weapon, then his sword; Krishna raises his own sword to kill him.', 'The duel can be shown from Rukmī’s side, so Krishna’s side is arrows and splintered wood.'), 'TEXT 10.54.18 to 10.54.31', 'S1 · 5'],
  ['A06-i', entry('The sparing, binding and shaving', 'Rukmiṇī falls at Krishna’s feet; he stops, binds Rukmī with cloth and shaves part of his hair and moustache; Balarama frees him.', 'Her plea is the action; the blade and the hair are the effect.', 'This is violence of humiliation, not of death.'), 'TEXT 10.54.32 to 10.54.50', 'S1 · 4']
], W4));
c.push(L.gap());

c.push(L.h1('9. Event 07: Together after the climax'));
c.push(L.p('No action. The final episode is deliberately quiet; the contrast with A06-e to A06-i is the point. If any motion is wanted, the arrival by chariot along the shore is the only candidate.'));

c.push(L.h1('10. Candidate additions (ADAPTATION)'));
c.push(L.p('Small action ideas that fit the events without changing them. Choose later.'));
['**The stopped Brahmin:** Rukmī’s guard questions the messenger at the gate of Kuṇḍina.',
  '**The decoy chariot:** a second chariot leaves Kuṇḍina in another direction to draw the pursuit.',
  '**The maid’s delay:** a maidservant slows the guards at the temple door.',
  '**The river crossing:** the ferryman takes the Yadava party across and refuses the kings.',
  '**The hundred counts:** a small skirmish with Śiśupāla’s men in which a count is kept (the first seed of the offence clock; SOURCE: Shishupala file).'].forEach(t => c.push(L.bl(t)));

c.push(L.h1('11. Overview ladder: every sequence by story time'));
c.push(L.tbl(['Event', 'Peak action (intensity 5)', 'Strong set-pieces (4)', 'Scale mostly'], [
  ['01 Manthana', 'A01-h Deva–Asura war', 'A01-b, A01-c, A01-d', 'S4'],
  ['02 Earth’s burden', 'None', 'None', 'S3'],
  ['03 Jarasandha', 'A03-d battle of Mathurā; A03-g chase and burning hill; A03-h leap', 'A03-c, A03-e', 'S3, S1'],
  ['04 Dvārakā', 'None', 'None', 'S3 (spectacle)'],
  ['05 Mucukunda', 'None', 'A05-a, A05-b, A05-c', 'S1 to S3'],
  ['06 Abduction', 'A06-e abduction; A06-f pursuit; A06-h duel', 'A06-i', 'S1 to S3'],
  ['07 Together', 'None', 'None', 'None']
], [1700, 3938, 2400, 1600]));
c.push(L.gap());

c.push(L.h1('12. Outside the film’s window (excluded by the brief)'));
c.push(L.p('These action episodes exist in the tradition but fall after the marriage, so they are not part of this film: Rukmī’s death at the dice game (10.61), Balarama and Dvivida (10.67), Balarama’s plough at Hastinapura (10.68) and Śiśupāla’s death at the Rājasūya (10.74). They are listed here so you know what is deliberately left out.'));

c.push(L.h1('13. Cautions'));
['The Bhāgavata gives the sieges and the battles with little tactical detail. Everything beyond the verses (terrain, formations, weapons beyond those named) is ADAPTATION.',
  'The numbers (twenty-three akṣauhiṇīs, thirty million Yavanas) are in the text; the akṣauhiṇī breakdown is TRADITION.',
  'Krishna’s restraint (breaking weapons, sparing Jarasandha and Rukmī) is the film’s moral thread; staging that makes him a conventional killer would cut against it.',
  'The abduction is described by Parīkṣit as rākṣasa-style (10.52.18 to 10.52.20); the film should keep her letter and her walk as the consent that the action rests on.',
  'Verse numbers are from a summary and can be off by one; read the verse before quoting it.'].forEach(t => c.push(L.bl(t)));

L.save(L.makeDoc('Action Sequences', 'Catalogue 09: Action Sequences', c), OUT + '09_Action_Sequences_Catalogue.docx');
