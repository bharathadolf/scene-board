const L = require('./lib');
const OUT = '/home/claude/story_events/';

const W4 = [800, 5638, 1900, 1300];
const H4 = ['ID', 'Dramatic event: what is at stake', 'Anchor', 'Intensity · Silent'];
function row(id, name, stake, anchor, rating) { return [id, `**${name}**\n${stake}`, anchor, rating]; }

const c = [];
L.titleBlock(c, 'CATALOGUE 10', 'Intense Dramatic Events', 'The emotional, moral and psychological turning points across the story events');
c.push(L.note('Labels. TEXT = Bhāgavata verse checked in this pass (numbering may be off by one); SOURCE = your supplied files; TRADITION = other sources, not re-checked; ADAPTATION = invention for the film. This file gathers what is possible; it does not choose or order. Variants come later.'));

c.push(L.h1('1. How to read this catalogue'));
c.push(L.tbl(['Rating', 'Meaning'], [
  ['Intensity 1 to 5', '1 = quiet pressure; 3 = a strong scene; 5 = one of the film’s emotional peaks.'],
  ['Silent: S', 'The beat can play with no dialogue (gesture, face, object, sound).'],
  ['Silent: D', 'The beat depends on a spoken line or a reading (a letter, an oath, a speech).'],
  ['Anchor', 'The verse or file where the beat is grounded. Beats with no anchor but a theme are ADAPTATION.']
], [2400, 7238]));
c.push(L.gap());

c.push(L.h1('2. Rukmini’s emotional ladder'));
c.push(L.p('Rukmini is the protagonist; this ladder follows her state from first hearing of Krishna to arriving at Dvārakā. Most steps are in the text.'));
c.push(L.tbl(['Step', 'State', 'What happens', 'Anchor'], [
  ['1', 'Wonder', 'Visitors sing of Krishna’s qualities, beauty and valour.', 'TEXT 10.52.23'],
  ['2', 'Certainty', 'She decides he is the right husband.', 'TEXT 10.52.23'],
  ['3', 'Helplessness', 'Rukmī overrides her and arranges the match with Śiśupāla.', 'TEXT 10.52.25'],
  ['4', 'Courage', 'She sends a trusted brāhmaṇa to Dvārakā.', 'TEXT 10.52.26'],
  ['5', 'Exposure', 'Her letter: she has chosen; if he refuses she will give up her life.', 'TEXT 10.52.37 to 10.52.43'],
  ['6', 'Suffocation', 'She is bathed and adorned for a wedding she does not want.', 'TEXT 10.53.7 to 10.53.13'],
  ['7', 'Dread', 'The hour nears; he and the Brahmin have not come; she imagines reasons, including divine displeasure.', 'TEXT 10.53.22 to 10.53.26'],
  ['8', 'Relief', 'Omens turn good; the Brahmin returns with his message and promise.', 'TEXT 10.53.27 to 10.53.30'],
  ['9', 'Resolve', 'The procession; the prayer to Ambikā.', 'TEXT 10.53.39 to 10.53.49'],
  ['10', 'Public exposure', 'She breaks her vow of silence and walks out among the dazed kings.', 'TEXT 10.53.50 to 10.53.51'],
  ['11', 'Recognition', 'She sees him and is eager to mount the chariot.', 'TEXT 10.53.52'],
  ['12', 'Surrender and choice', 'He lifts her onto the chariot before his enemies.', 'TEXT 10.53.55'],
  ['13', 'Fear for others', 'Arrows fall on the Yadavas; she fears for her husband’s army.', 'TEXT 10.54.4 to 10.54.5'],
  ['14', 'Terror for her brother', 'The duel; the raised sword.', 'TEXT 10.54.21 to 10.54.31'],
  ['15', 'Mercy', 'She falls at his feet and begs for Rukmī’s life.', 'TEXT 10.54.32 to 10.54.34'],
  ['16', 'Grief, then calm', 'Balarama consoles her.', 'TEXT 10.54.36 to 10.54.50'],
  ['17', 'Belonging', 'She arrives in Dvārakā; the city rejoices.', 'TEXT 10.54.53 to 10.54.60']
], [700, 1800, 5038, 2100]));
c.push(L.gap());

c.push(L.h1('3. The dramatic engines'));
c.push(L.p('These forces recur across the events and generate most of the high-intensity beats.'));
[
  '**Choice against seizure.** Rukmini chooses; Rukmī, the kings and the Asuras seize. Seizing is not holding.',
  '**Patience against rage.** Krishna’s sparing of Jarasandha and of Rukmī, and the hundred-offence promise (SOURCE: Shishupala file), against the rage that keeps coming back.',
  '**Brother against husband.** Rukmini between Rukmī and Krishna; Balarama between Krishna and Rukmī.',
  '**Honour against mercy.** Rukmī’s vow and the shaving, against Rukmini’s plea and Balarama’s rebuke.',
  '**The clock.** The wedding hour; the seventeen attacks; the hundred offences; the Brahmin’s delay.',
  '**Poison held.** Śiva’s throat, Krishna’s patience, Rukmini’s silence and sorrow.',
  '**The unseen answer.** Everyone speaks of him; no one is sure he will come.'
].forEach(t => c.push(L.bl(t)));

c.push(L.h1('4. Event 01: Kṣīra Sāgara Manthana'));
c.push(L.tbl(H4, [
  row('D01-a', 'The garland and the curse', 'A moment of disrespect becomes a catastrophe; pride and repentance. (TRADITION: the full garland story is in the Viṣṇu Purāṇa.)', 'SOURCE 8.5', '3 · S'),
  row('D01-b', 'The fall of the Devas', 'Heaven loses its radiance; the gods become suppliants.', 'SOURCE 8.5', '3 · S'),
  row('D01-c', 'The humiliating alliance', 'The Devas must make a pact with their enemies to survive.', 'SOURCE 8.6', '3 · D'),
  row('D01-d', 'The mountain sinks', 'Failure at the brink; hope held only by the Lord’s unseen act.', 'SOURCE 8.6', '4 · S'),
  row('D01-e', 'Hālāhala and Śiva’s choice', 'One person walks toward the poison so that everyone else can live.', 'SOURCE 8.7', '5 · S'),
  row('D01-f', 'Lakṣmī’s choice', 'She surveys the assembled and passes every claimant; the Asuras are rejected.', 'SOURCE 8.8', '5 · S'),
  row('D01-g', 'The seizure and quarrel', 'Greed turns the winners against each other the moment they hold the prize.', 'SOURCE 8.8', '3 · S'),
  row('D01-h', 'Mohinī’s deception', 'The rightful side is served by a trick; moral grey.', 'SOURCE 8.9', '4 · S'),
  row('D01-i', 'Rāhu exposed', 'A traitor, a refusal to be shut out, a head that survives.', 'SOURCE 8.9', '3 · S'),
  row('D01-j', 'Śiva before Mohinī', 'The wise are undone by wonder; recognition after bewilderment.', 'SOURCE 8.12', '3 · S')
], W4));
c.push(L.gap());

c.push(L.h1('5. Event 02: The Burden of the Earth'));
c.push(L.tbl(H4, [
  row('D02-a', 'The Earth weeps', 'The weight of arrogant kings, shown as a cow in tears; a world crying for help.', 'TEXT 10.1.17 to 10.1.18', '4 · S'),
  row('D02-b', 'The voice from the sky', 'The answer arrives, promising a person who has not yet been born.', 'TEXT 10.1.21 to 10.1.25', '3 · D')
], W4));
c.push(L.gap());

c.push(L.h1('6. Event 03: Jarasandha’s repeated attacks'));
c.push(L.tbl(H4, [
  row('D03-a', 'The widows’ return', 'Grief arrives at a father’s door; rage is born from loss.', 'TEXT 10.50.1 to 10.50.3', '3 · S'),
  row('D03-b', 'The decision to spare him', 'Krishna chooses to leave the enemy alive so that more may come. Mercy as strategy; a hard, almost cruel patience.', 'TEXT 10.50.5 to 10.50.10', '4 · D'),
  row('D03-c', 'The women on the wall', 'They faint when the chariots vanish from sight; helpless witnesses.', 'TEXT 10.50.22 to 10.50.23', '4 · S'),
  row('D03-d', 'Jarasandha seized and freed', 'A king bound in shame and let go; Balarama’s impatience against Krishna’s restraint.', 'TEXT 10.50.30 to 10.50.31', '4 · S'),
  row('D03-e', 'The near-penance', 'Jarasandha resolves to atone and is talked out of it by other kings: a chance at change refused.', 'TEXT 10.50.32 to 10.50.34', '3 · D'),
  row('D03-f', 'Seventeen times', 'Tragic repetition: loss, return, loss, return. An enemy who cannot learn.', 'TEXT 10.50.41 to 10.50.42', '3 · S'),
  row('D03-g', 'The burning hill', 'Two brothers on a mountain on fire, with no army; fear for their lives.', 'TEXT 10.52.9 to 10.52.11', '5 · S'),
  row('D03-h', 'The false victory', 'Jarasandha believes them dead and goes home satisfied.', 'TEXT 10.52.13 to 10.52.14', '3 · S')
], W4));
c.push(L.gap());

c.push(L.h1('7. Event 04: The founding of Dvārakā'));
c.push(L.tbl(H4, [
  row('D04-a', 'The two-front dilemma', 'Whichever way they turn, the family is exposed; a council in which no option is safe.', 'TEXT 10.50.45 to 10.50.48', '3 · D'),
  row('D04-b', 'Leaving home', 'An entire people uprooted overnight and waking in a strange city. Wonder and displacement.', 'TEXT 10.50.57', '4 · S'),
  row('D04-c', 'The lone walk from the gate', 'Krishna goes out unarmed and alone while others sleep in safety.', 'TEXT 10.50.58', '4 · S')
], W4));
c.push(L.gap());

c.push(L.h1('8. Event 05: Kālayavana and Mucukunda'));
c.push(L.tbl(H4, [
  row('D05-a', 'Walking away to save others', 'He takes the threat out of the city by drawing it after him; accepted shame and risk.', 'TEXT 10.51.1 to 10.51.8', '4 · S'),
  row('D05-b', 'The taunt of cowardice', 'Kālayavana shouts that Krishna is running away, and he lets it be said.', 'TEXT 10.51.8', '3 · D'),
  row('D05-c', 'The sleeper’s wrath', 'An act of arrogance wakes something that burns.', 'TEXT 10.51.11 to 10.51.12', '4 · S'),
  row('D05-d', 'Mucukunda sees him', 'A king who has slept through ages sees the Lord and weeps; the film’s purest portrait by the face of an awed man.', 'TEXT 10.51.22 to 10.51.26', '5 · S'),
  row('D05-e', 'The renunciation', 'Mucukunda declines every boon and asks only to serve; Krishna calls the offer a test.', 'TEXT 10.51.43 to 10.51.59', '4 · D'),
  row('D05-f', 'The sage walks north', 'A man leaves the world he woke into.', 'TEXT 10.52.1 to 10.52.4', '3 · S')
], W4));
c.push(L.gap());

c.push(L.h1('9. Event 06: The abduction of Rukmini'));
c.push(L.tbl(H4, [
  row('D06-a', 'She hears, and she knows', 'A woman falls for a man she has only heard sung about.', 'TEXT 10.52.23', '3 · S'),
  row('D06-b', 'The brother overrides', 'Her choice is cancelled by the person who is supposed to protect her; the father’s love for his son overrides his own preference.', 'TEXT 10.52.25; 10.53.7', '4 · D'),
  row('D06-c', 'The decision to write', 'A princess puts her honour and her life into the hands of a messenger.', 'TEXT 10.52.26', '4 · S'),
  row('D06-d', 'The letter', 'Intimacy and ultimatum: if he refuses she will keep trying through many lifetimes.', 'TEXT 10.52.37 to 10.52.43', '5 · D'),
  row('D06-e', 'The Brahmin’s journey and report', 'The one person who meets him; the honest portrait of a man who massages a brāhmaṇa’s feet.', 'TEXT 10.52.27 to 10.52.36', '4 · D'),
  row('D06-f', 'The bride is made ready', 'Bath, jewels and ritual as a form of imprisonment.', 'TEXT 10.53.7 to 10.53.13', '3 · S'),
  row('D06-g', 'The kings gather and swear', 'A city on the edge of a massacre.', 'TEXT 10.53.14 to 10.53.19', '4 · D'),
  row('D06-h', 'Balarama arrives', 'A brother’s love sends an army before he is asked.', 'TEXT 10.53.20 to 10.53.21', '3 · S'),
  row('D06-i', 'The waiting', 'The hour is near; the Brahmin has not returned; she imagines every reason, including divine anger.', 'TEXT 10.53.22 to 10.53.26', '5 · S'),
  row('D06-j', 'The omens turn', 'Her left eye, arm and thigh twitch; the Brahmin walks in smiling.', 'TEXT 10.53.27 to 10.53.30', '4 · S'),
  row('D06-k', 'The citizens’ wish', 'A whole city offers its merit for a bride’s choice.', 'TEXT 10.53.36 to 10.53.38', '3 · D'),
  row('D06-l', 'The prayer to Ambikā', 'A silent request at the shrine of the goddess who held Śiva’s poison.', 'TEXT 10.53.44 to 10.53.49', '4 · S'),
  row('D06-m', 'Breaking her silence', 'She leaves the temple and walks out among the kings, who are stunned by her.', 'TEXT 10.53.50 to 10.53.51', '5 · S'),
  row('D06-n', 'First sight', 'Recognition at last; the moment the whole film has delayed.', 'TEXT 10.53.52', '5 · S'),
  row('D06-o', 'The lift', 'He seizes her before his enemies; the humiliation of the kings.', 'TEXT 10.53.55 to 10.53.57', '5 · S'),
  row('D06-p', 'The coalition’s lament', 'Kings who have lost their honour to “cowherds”.', 'TEXT 10.53.57', '3 · D'),
  row('D06-q', 'Jarasandha consoles Śiśupāla', 'Philosophy as a way of saving face: defeat and victory belong to time.', 'TEXT 10.54.10 to 10.54.17', '3 · D'),
  row('D06-r', 'Rukmī’s oath', 'A public vow that locks him out of his own home.', 'TEXT 10.54.18 to 10.54.20', '5 · D'),
  row('D06-s', 'The duel between brother and husband', 'A woman watches the two men she loves try to kill each other.', 'TEXT 10.54.21 to 10.54.31', '5 · S'),
  row('D06-t', 'The plea', 'Her second decisive act: on her knees at the feet of the man who has just saved her.', 'TEXT 10.54.32 to 10.54.34', '5 · S'),
  row('D06-u', 'The shaving', 'Mercy and humiliation in the same stroke.', 'TEXT 10.54.35', '4 · S'),
  row('D06-v', 'Balarama’s rebuke', 'Two brothers in moral disagreement in front of the bride.', 'TEXT 10.54.36 to 10.54.50', '4 · D'),
  row('D06-w', 'Balarama consoles her', 'A brother-in-law becomes a teacher in a moment of grief.', 'TEXT 10.54.36 to 10.54.50', '4 · D'),
  row('D06-x', 'Rukmī’s exile', 'A proud man builds a city so he need not go home.', 'TEXT 10.54.51 to 10.54.52', '4 · S')
], W4));
c.push(L.gap());

c.push(L.h1('10. Event 07: Together after the climax'));
c.push(L.tbl(H4, [
  row('D07-a', 'Arrival at the sea', 'A woman who has never seen the ocean sees a city on the water.', 'ADAPTATION; TEXT 10.54.53', '4 · S'),
  row('D07-b', 'The city rejoices', 'Everyone seen earlier, now smiling; the ledger closes.', 'TEXT 10.54.54 to 10.54.60', '3 · S'),
  row('D07-c', 'The empty place', 'Her brother’s absence in the middle of the joy.', 'ADAPTATION', '4 · S'),
  row('D07-d', 'Together', 'Two people in one frame after a film in which one has barely been seen.', 'ADAPTATION', '5 · S'),
  row('D07-e', 'The song', 'The kings hear the story, and it is sung through the land.', 'TEXT 10.54.60', '3 · D')
], W4));
c.push(L.gap());

c.push(L.h1('11. From your character files (outside the five main events)'));
c.push(L.p('These beats come from your Shishupala, Rukmi and Balarama files. They were not in your list of events, but they are among the strongest dramatic material the story contains. Whether they appear is a plot-building decision.'));
c.push(L.tbl(H4, [
  row('D08-a', 'The marked child', 'An infant born with extra arms and a third eye, and a heavenly voice that names the unknown who will be his death.', 'SOURCE Shishupala file §3', '5 · S'),
  row('D08-b', 'The mother’s terror', 'The child’s marks vanish in Krishna’s lap, and the mother realises the saviour is the destined killer.', 'SOURCE Shishupala file §4', '5 · S'),
  row('D08-c', 'The mother’s plea and the hundred offences', 'A bargain made with the one who will take her son: forgive a hundred offences.', 'SOURCE Shishupala file §5', '5 · D'),
  row('D08-d', 'The lost bride', 'Śiśupāla is humiliated; his hostility hardens.', 'SOURCE Shishupala file §9', '4 · S'),
  row('D08-e', 'Rukmī’s overreach', 'Control, vow and ruin as a single arc.', 'SOURCE Rukmi file §4 to §14', '4 · D'),
  row('D08-f', 'Balarama’s two loyalties', 'A man who defends Krishna with an army and rebukes him for the shaving.', 'SOURCE Balarama file §14, §17', '4 · D'),
  row('D08-g', 'Jaya and Vijaya’s curse', 'A cosmic curse behind Śiśupāla’s life, mirroring Durvāsā’s curse.', 'SOURCE Shishupala file §2', '3 · D')
], W4));
c.push(L.gap());

c.push(L.h1('12. The peaks: intensity 5 across the film'));
c.push(L.tbl(['ID', 'Beat', 'Why it peaks'], [
  ['D01-e', 'Hālāhala and Śiva’s choice', 'The first great act of absorption.'],
  ['D01-f', 'Lakṣmī’s choice', 'The mythic mirror of Rukmini’s choice.'],
  ['D03-g', 'The burning hill', 'The only moment the two brothers are afraid.'],
  ['D05-d', 'Mucukunda sees him', 'The purest portrait of Krishna by an awed face.'],
  ['D06-d', 'The letter', 'Rukmini’s voice at its most naked.'],
  ['D06-i', 'The waiting', 'The tension of an unanswered letter.'],
  ['D06-m to D06-o', 'Silence, first sight, the lift', 'The climax in three steps.'],
  ['D06-r to D06-t', 'Oath, duel, plea', 'Brother against husband, and her answer.'],
  ['D07-d', 'Together', 'The ending image.'],
  ['D08-a to D08-c', 'Śiśupāla’s marks, mother’s terror and the hundred offences', 'The film’s clock; optional.']
], [1700, 4038, 3900]));
c.push(L.gap());

c.push(L.h1('13. Silence points'));
c.push(L.p('Beats rated S that carry the most weight without dialogue. Useful if any version of the film drops speech.'));
['D01-e, D01-f (Śiva and Lakṣmī)', 'D03-c, D03-g (the women on the wall; the burning hill)', 'D05-d (Mucukunda’s face)', 'D06-i, D06-j (the waiting and the omens)', 'D06-l, D06-m, D06-n, D06-o (the prayer, the walk, the sight, the lift)', 'D06-s, D06-t, D06-u (the duel, the plea, the shaving)', 'D07-a, D07-d (the sea and the two together)'].forEach(t => c.push(L.bl(t)));

c.push(L.h1('14. Cautions'));
['These are possible dramatic events. Which ones appear, in what order, and with how much weight is a plot-building decision.',
  'Beats marked ADAPTATION go beyond the text; the Bhāgavata gives no inner thoughts, so every state on Rukmini’s ladder beyond what the verse says is inferred.',
  'The Brahmin’s report that Krishna massaged his feet is a text detail (10.52.27 to 10.52.29) and works as indirect characterisation; use it when you want Krishna’s humility described, not shown.',
  'Verse numbers are from a summary and can be off by one; read each verse before quoting it.'].forEach(t => c.push(L.bl(t)));

L.save(L.makeDoc('Intense Dramatic Events', 'Catalogue 10: Intense Dramatic Events', c), OUT + '10_Intense_Dramatic_Events_Catalogue.docx');
