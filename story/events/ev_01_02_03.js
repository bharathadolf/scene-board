const L = require('./lib');
const OUT = '/home/claude/story_events/';

// ---------------------------------------------------------------- 01 MANTHANA
const e1 = {
  fileNo: 'EVENT 01', title: 'Kṣīra Sāgara Manthana', sub: 'The Churning of the Ocean of Milk for the elixir',
  footer: 'Event 01: Kṣīra Sāgara Manthana',
  position: 'Cosmic time, before the human events. The mythic frame for the whole film.',
  place: 'Heaven, the Ocean of Milk, Mount Mandara.',
  anchor: 'Śrīmad-Bhāgavatam 8.5 to 8.12, as given in your supplied episode file. Variants exist in the Viṣṇu Purāṇa (Book 1, ch. 9).',
  rukminiLink: 'Lakṣmī emerges from the Ocean and chooses Viṣṇu among assembled claimants; Rukmini chooses Krishna among assembled kings. Rukmini is regarded in the tradition as an incarnation of Lakṣmī (Viṣṇu, Bhāgavata and Padma Purāṇas, as reported by a secondary source; verify verses).',
  brief: [
    'Durvāsā’s curse drains the Devas of prosperity and strength, and the Asuras overrun them. Brahmā takes the Devas to Viṣṇu, who tells them to make a temporary alliance with the Asuras and churn the Ocean of Milk for amṛta. Mount Mandara is the churning rod and the serpent Vāsuki the rope. The mountain sinks; Viṣṇu becomes Kūrma, the tortoise, and holds it up.',
    'The churning brings the poison Hālāhala first, which Śiva drinks and holds at his throat. Then come the treasures, then Lakṣmī, who chooses Viṣṇu. Dhanvantari appears with the nectar; the Asuras seize it and quarrel; Viṣṇu becomes Mohinī and gives the nectar to the Devas. Rāhu disguises himself, is exposed, and is beheaded by the Sudarśana disc, though his head survives. The Asuras attack, the Devas win, and Śiva later asks to see Mohinī.'
  ],
  beatHead: ['Ref', 'Beat'],
  beatW: [1500, 8138],
  beats: [
    ['SOURCE 8.5', 'Durvāsā gives Indra a garland; Indra puts it on Airāvata, who throws it down. Durvāsā curses the Devas. (TRADITION: the full garland story is told in the Viṣṇu Purāṇa; verify which text carries each detail.)'],
    ['SOURCE 8.5', 'The Devas lose prosperity and strength; the Asuras gain the advantage.'],
    ['SOURCE 8.5', 'The Devas go to Brahmā, who leads them to Viṣṇu. Viṣṇu proposes churning the Ocean of Milk for amṛta.'],
    ['SOURCE 8.6', 'The Devas negotiate a temporary alliance; the Asuras agree, expecting a share.'],
    ['SOURCE 8.6', 'Mandara is chosen as the rod, Vāsuki as the rope; Mandara is carried to the Ocean.'],
    ['SOURCE 8.6', 'Mandara sinks. Viṣṇu becomes Kūrma and carries it on his back.'],
    ['SOURCE 8.6', 'Devas hold Vāsuki’s tail, Asuras the head; the Lord empowers mountain, serpent and both teams.'],
    ['SOURCE 8.7', 'The churning begins; the Ocean is agitated; Hālāhala poison emerges and threatens the worlds.'],
    ['SOURCE 8.7', 'Śiva drinks the poison; Pārvatī contains it at his throat, which turns blue (Nīlakaṇṭha). The churning resumes.'],
    ['SOURCE 8.8', 'Treasures emerge: Surabhi, Uccaiḥśravā, Airāvata and other elephants, the Kaustubha jewel (taken by Viṣṇu), Pārijāta, the Apsarās. Order varies across texts.'],
    ['SOURCE 8.8', 'Lakṣmī emerges, is honoured, considers the assembled beings and chooses Viṣṇu; he gives her a permanent place on his chest. The Asuras are disappointed.'],
    ['SOURCE 8.8', 'Vāruṇī emerges and is accepted by the Asuras with Viṣṇu’s permission.'],
    ['SOURCE 8.8', 'Dhanvantari emerges carrying a pot of amṛta. The Asuras seize it and quarrel over who drinks first.'],
    ['SOURCE 8.9', 'Viṣṇu becomes Mohinī; the Asuras, captivated, ask her to distribute the nectar. She separates the two sides and gives it to the Devas.'],
    ['SOURCE 8.9', 'Rāhu disguises himself as a Deva; Sūrya and Candra expose him; Sudarśana severs his head, which survives because nectar has touched it.'],
    ['SOURCE 8.10 to 8.11', 'The alliance collapses; the Asuras attack. Bali leads the Asuras, Indra the Devas; illusions and weapons; Indra’s thunderbolt turns the war; the Devas regain heaven.'],
    ['SOURCE 8.12', 'Śiva asks to see the Mohinī form; Viṣṇu shows it; Śiva is bewildered and then recognises the divine power behind it.']
  ],
  cast: [
    ['Viṣṇu', 'Planner; Kūrma; Mohinī; holder of Lakṣmī', 'Never shown directly in the default approach.'],
    ['Lakṣmī', 'Goddess of fortune; chooses Viṣṇu', 'The model for Rukmini’s choice.'],
    ['Indra, Brahmā', 'Leader of the Devas; the intermediary', 'Indra’s loss frames the political arc.'],
    ['Durvāsā', 'Source of the curse', 'Opens the story.'],
    ['Śiva, Pārvatī', 'Drinks the poison; contains it', 'Pārvatī is also Ambikā, whose temple Rukmini visits.'],
    ['Bali and the Asuras', 'Rival claimants; seize the nectar', 'The rival kings’ mythic double.'],
    ['Vāsuki, Mandara', 'Rope and rod', 'Visual rhyme with armies pulling from two sides.'],
    ['Dhanvantari', 'Physician; bears amṛta', 'The healing gift.'],
    ['Rāhu, Sūrya, Candra', 'The infiltrator and his exposers', 'The survivor who returns as an eclipse.']
  ],
  reach: [
    '**The Ambikā temple mural.** Rukmini prays at the temple of Ambikā (Pārvatī), who held the poison at Śiva’s throat. A painted wall can carry the whole Churning in panels, and Rukmini can see herself in the panel where Lakṣmī chooses. ADAPTATION.',
    '**The bard’s recital.** A bard (the Bhāgavata mentions bards in her procession, 10.53.42) recites the tale on the eve of the wedding, to a hall of kings who do not notice they are the Asuras. ADAPTATION.',
    '**Her mother’s or nurse’s bedtime story,** told in her childhood and remembered at the choice. ADAPTATION.',
    '**The priests’ explanation** of the omens at the wedding preparations (10.53.7 to 13). ADAPTATION.'
  ],
  talk: [
    ['Voice from the sky (via Brahmā) to the Devas', 'INDIRECT', 'The Lord already knows their distress and tells them how to proceed.', 'He acts through others and through time; he is never in the room.'],
    ['Viṣṇu to the Devas', 'INDIRECT', 'Make an alliance with your enemies; I will arrange the rest.', 'Plans the whole operation yet stays beneath it.'],
    ['Bard or priest to Rukmini (ADAPTATION)', 'DIRECT', 'The goddess of fortune looked at all of them and went to the one who did not reach for her.', 'Sets up the idea that he is chosen, not seized.'],
    ['Devas and sages to Lakṣmī', 'EFFECT', 'They honour her as she emerges.', 'The world reorganises around her choice.'],
    ['Śiva to Mohinī (8.12)', 'EFFECT', 'He is bewildered by her form and then recognises the power behind it.', 'The Lord’s form can undo even the wise.']
  ],
  hidden: [
    'The Manthana is the film’s grammar lesson: the Lord is the support, not the visible puller. He appears as a voice from the sky, as a landform under the mountain, as hands, hair and a voice (Mohinī), and as a presence that Lakṣmī walks toward. The camera never enters it.',
    'Name rule (ADAPTATION): in the myth the Lord is Viṣṇu; characters in the human story do not say “Viṣṇu is Krishna” aloud. The audience makes that link from the parallels.'
  ],
  welfare: ['A fisher family on the Ocean’s shore, seen inside the myth', 'When the poison is held, the water clears and the catch returns; when Lakṣmī chooses, light returns to the shore.', 'A fisher child dips a hand in the water and brings it up clean; later, a net full of silver.'],
  links: [
    '**Event 02 (Earth’s burden):** the gods go to the shore of the same Ocean of Milk to ask the Lord for help (10.1.19 to 10.1.20).',
    '**Event 03 (Jarasandha):** the temporary alliance of rivals mirrors the coalition of kings; “seizing is not holding”.',
    '**Event 04 (Dvārakā):** Indra gives Krishna the Pārijāta tree at the city’s founding (10.50.54 to 10.50.56); the same tree rose from the Ocean (8.8).',
    '**Event 05 (Mucukunda):** Mucukunda fought for the Devas against the Asuras; his long sleep begins after those wars (10.51).',
    '**Event 06 (abduction):** Lakṣmī’s choice and Rukmini’s choice; Hālāhala and the poisons Rukmini, Krishna and Śiva each hold; Rāhu’s surviving head and Rukmi’s surviving humiliation.',
    '**Event 07 (together):** Lakṣmī’s permanent place beside Viṣṇu; the colour returning to the world.'
  ],
  questions: [
    'Is the Manthana told once, in full, or broken into pieces across the film?',
    'Is it shown as a mural, a recital, a dream, or as cosmic scenes the audience alone sees?',
    'Does Rukmini know the story, or does the audience only see it in parallel?',
    'Which texts do you lock to: the Bhāgavata only, or the Viṣṇu Purāṇa as well for the garland and Mohinī details?'
  ],
  cautions: [
    'Your episode file already says the order of treasures and several details vary across Purāṇas; this file keeps to the Bhāgavata sequence it gives.',
    'The Vāsuki rope image and Balarama as Śeṣa/Ananta are different serpents in the texts; treat any rhyme as visual, not as an identification.',
    'The Lakṣmī–Rukmini identification is traditional and comes from secondary reporting here; check verses before it appears in a script.'
  ],
  before: 'Nothing; this is the mythic beginning.',
  after: 'Event 02 (Earth’s burden) through the shared Ocean of Milk shore; echoed in Events 06 and 07.'
};

// ---------------------------------------------------------------- 02 EARTH'S BURDEN
const e2 = {
  fileNo: 'EVENT 02', title: 'The Burden of the Earth', sub: 'Bhūmi’s plea and the Lord’s decision to appear among the Yadus',
  footer: 'Event 02: The Burden of the Earth',
  position: 'Before Krishna’s birth. The reason for everything that follows.',
  place: 'Brahmā’s realm and the shore of the Ocean of Milk.',
  anchor: 'Śrīmad-Bhāgavatam 10.1.17 to 10.1.28 (TEXT, checked).',
  rukminiLink: 'The armies of arrogant kings that crush the Earth are the same kings who gather in Kuṇḍina; Rukmini’s world is already under that weight.',
  brief: [
    'The Earth, weighed down by great armies of arrogant demons who have taken birth as kings, goes to Brahmā in distress, in the form of a weeping cow. Brahmā takes her, the Devas and Śiva to the shore of the Ocean of Milk and worships Viṣṇu with the Puruṣa-sūkta. In trance, Brahmā hears Viṣṇu’s voice from the sky and passes on the command: the Lord already knows the Earth’s distress; the Devas are to take birth in the Yadu family; the Lord himself will appear as Vasudeva’s son and relieve the burden through his own power of time.',
    'Ananta (Śeṣa, Saṅkarṣaṇa) will appear first as the elder brother, and the Lord’s potency Yogamāyā will appear to carry out the work. Brahmā returns; Śūrasena rules from Mathurā, which becomes the Yadu capital.'
  ],
  beatHead: ['Ref', 'Beat'],
  beatW: [1500, 8138],
  beats: [
    ['TEXT 10.1.17', 'The Earth is burdened by armies of arrogant demons posing as kings and goes to Brahmā.'],
    ['TEXT 10.1.18', 'She takes the form of a cow, tearful and distressed, and tells Brahmā her suffering.'],
    ['TEXT 10.1.19', 'Brahmā, the Devas and Śiva go with her to the shore of the Ocean of Milk.'],
    ['TEXT 10.1.20', 'They worship Viṣṇu, lord of the gods, with the Puruṣa-sūkta hymn.'],
    ['TEXT 10.1.21', 'Brahmā, in trance, hears a voice from the sky and relays the Lord’s message to the Devas: do not delay.'],
    ['TEXT 10.1.22', 'The Lord already knew the Earth’s distress. The Devas are to take birth among the Yadus as sons and grandsons; the Lord will lighten the Earth’s load through his time-power.'],
    ['TEXT 10.1.23', 'The Lord will appear as Vasudeva’s son; the wives of the Devas are to be born to be with him.'],
    ['TEXT 10.1.24', 'Ananta (Śeṣa, Saṅkarṣaṇa) will appear first as the elder brother, Baladeva.'],
    ['TEXT 10.1.25', 'Yogamāyā will appear to carry out the Lord’s work.'],
    ['TEXT 10.1.26 to 10.1.28', 'Brahmā returns to his abode; Śūrasena rules from Mathurā, which becomes the Yadu capital.']
  ],
  cast: [
    ['Bhūmi (the Earth)', 'Petitioner, as a weeping cow', 'Gives the film its first image of suffering.'],
    ['Brahmā', 'Carries her plea; hears the Lord’s voice', 'The intermediary.'],
    ['Śiva and the Devas', 'Accompany Brahmā', 'The same company as in the Manthana.'],
    ['Viṣṇu (voice only)', 'Gives the decision', 'Unseen.'],
    ['Ananta / Śeṣa', 'To appear as Balarama', 'Source of Balarama’s role in the later events.'],
    ['Yogamāyā', 'The Lord’s potency', 'Works behind events (for example, Dvārakā’s relocation).'],
    ['Śūrasena', 'King at Mathurā', 'Sets the Yadu stage.']
  ],
  reach: [
    '**A weeping cow in Kuṇḍina.** A cow refuses to move as an army marches through the street, and a bard or an old woman tells the Earth’s story. ADAPTATION.',
    '**Bhīṣmaka or the family priest** tells it as the reason a righteous king should fear the arrival of too many armies. ADAPTATION.',
    '**The visitors who praised Krishna** (10.52.23) begin with this tale: “He was asked for, before he was born.” ADAPTATION.',
    '**The temple of Ambikā** can show the Earth-cow in a painted panel beside the Churning. ADAPTATION.'
  ],
  talk: [
    ['Bhūmi to Brahmā', 'INDIRECT', 'The kings are too many and too proud; I cannot carry them.', 'He is the answer to a crushing world; he is implied by her need.'],
    ['Voice of Viṣṇu to Brahmā, who relays it to the Devas', 'INDIRECT', 'I will appear as Vasudeva’s son. Come after me. Do not delay.', 'He announces himself through a relay; no face, no name yet.'],
    ['Brahmā to the Devas', 'INDIRECT', 'The Lord has decided; your task is to be born beside him.', 'Others prepare the stage for him.'],
    ['Bard or priest to Rukmini (ADAPTATION)', 'DIRECT', 'He did not come because he was invited. He came because the Earth wept.', 'The reason for him, before the man.']
  ],
  hidden: [
    'This event hides Krishna completely: he does not yet exist as a person, only as a voice and a promise. It is the cleanest example of the unseen-support grammar.',
    'Krishna’s birth (10.3) and the death of Kaṁsa are not part of this gathering; characters can refer to them in dialogue, but they are not staged.'
  ],
  welfare: ['A farmer and his cow in a field outside Kuṇḍina', 'The Earth’s burden is lightened; fields are no longer trampled by passing armies.', 'The cow lies down in the furrow; the plough turns clean soil.'],
  links: [
    '**Event 01 (Manthana):** the gods go again to the Ocean of Milk, this time to ask for the Lord himself rather than for nectar.',
    '**Event 03 (Jarasandha):** Krishna spares Jarasandha so that more armies gather, which brings the burden into his hands (10.50.5 to 10.50.10).',
    '**Event 06 (abduction):** the kings who assemble at Kuṇḍina are the burden made visible.',
    '**Balarama:** the file on Balarama already treats him as Saṅkarṣaṇa/Śeṣa; this event is the source of that thread.'
  ],
  questions: [
    'Is the Earth-cow shown to the audience in cosmic scale, or only as a story Rukmini hears?',
    'Does the film open here, or does it start in Kuṇḍina and reach this event through a teller?',
    'How much of Krishna’s birth and Kaṁsa’s fall is referenced in dialogue, given they are not staged?'
  ],
  cautions: [
    'Only 10.1.17 to 10.1.28 is verified here; the rest of Canto 10 chapter 1 belongs to the birth story and is outside this gathering.',
    'The cow-form of Bhūmi is a text detail (10.1.18), not an invention.'
  ],
  before: 'Event 01 (the shore of the Ocean of Milk, reused).',
  after: 'Event 03 (Jarasandha’s attacks on Mathurā).'
};

// ---------------------------------------------------------------- 03 JARASANDHA
const e3 = {
  fileNo: 'EVENT 03', title: 'Jarasandha’s Repeated Attacks', sub: 'Seventeen sieges of Mathurā, each defeated and each forgiven',
  footer: 'Event 03: Jarasandha’s Repeated Attacks',
  position: 'After Kaṁsa’s death; before Dvārakā. The final chase belongs after Event 05 in story time.',
  place: 'Mathurā; later the hill Pravarṣaṇa.',
  anchor: 'Śrīmad-Bhāgavatam 10.50.1 to 10.50.42 (TEXT, checked); 10.52.6 to 10.52.14 (the later chase); 10.54.10 to 10.54.17 (Jarasandha consoles Śiśupāla).',
  rukminiLink: 'Jarasandha comes to Kuṇḍina as the leader of Śiśupāla’s allies (10.53.14 to 10.53.19). His reputation, and the story of how many times Krishna spared him, reaches Rukmini as dread and as a clue to Krishna’s patience.',
  brief: [
    'Kaṁsa’s widows, Asti and Prāpti, return to their father Jarasandha, king of Magadha, and tell him how they were widowed. Grief and rage drive him to surround Mathurā with twenty-three akṣauhiṇī divisions. Krishna sees that the army weighs on his people and decides to destroy the army but spare Jarasandha, because Jarasandha will keep gathering new armies, bringing more demons to be removed and furthering the relief of the Earth’s burden.',
    'Two chariots and divine weapons descend; Krishna and Balarama ride out and Krishna blows his conch. Jarasandha taunts them; Krishna replies that true heroes show courage in action, not in boasting. The women of Mathurā watch from the walls and faint when the chariots pass out of sight. Krishna’s arrows and Balarama’s plough destroy the army. Balarama seizes Jarasandha, but Krishna stops him from binding him. Jarasandha, ashamed, resolves on penance, is dissuaded by other kings, and goes home. This happens seventeen times.',
    'Later, after the Mucukunda episode, Jarasandha returns with twenty-three divisions while the Yadavas carry wealth toward Dvārakā; Krishna and Balarama run, climb Mount Pravarṣaṇa, and he sets the hill on fire. They leap down and reach Dvārakā unseen; Jarasandha thinks them dead and returns to Magadha.'
  ],
  beatHead: ['Ref', 'Beat'],
  beatW: [1500, 8138],
  beats: [
    ['TEXT 10.50.1 to 10.50.3', 'Asti and Prāpti return to their father Jarasandha and tell him of Kaṁsa’s death; he resolves to rid the Earth of the Yādavas.'],
    ['TEXT 10.50.4', 'He surrounds Mathurā with twenty-three akṣauhiṇī divisions.'],
    ['TEXT 10.50.5 to 10.50.10', 'Krishna weighs the situation: destroy the army, spare Jarasandha so he gathers more armies; this lets the demons come to him and serves the relief of the Earth’s burden.'],
    ['TEXT 10.50.11 to 10.50.12', 'Two radiant chariots with drivers and weapons descend from the sky.'],
    ['TEXT 10.50.13 to 10.50.16', 'Krishna and Balarama ride out with a small contingent; Krishna blows the conch and the enemy trembles.'],
    ['TEXT 10.50.17 to 10.50.19', 'Jarasandha mocks Krishna as a boy and challenges Balarama; Krishna answers that heroes act rather than boast.'],
    ['TEXT 10.50.20 to 10.50.29', 'The battle: Jarasandha surrounds them; the women of Mathurā watch from the walls and faint when the chariots are hidden by the enemy; Krishna’s arrows and Balarama’s plough destroy elephants, horses, chariots and infantry.'],
    ['TEXT 10.50.30 to 10.50.31', 'Balarama seizes Jarasandha; Krishna stops him from binding him because he still has a purpose.'],
    ['TEXT 10.50.32 to 10.50.34', 'Ashamed, Jarasandha resolves on penance; other kings dissuade him by telling him his defeat was karma; he returns to Magadha.'],
    ['TEXT 10.50.35 to 10.50.40', 'Krishna returns amid celebration and flowers; he gives the battlefield wealth to Ugrasena.'],
    ['TEXT 10.50.41 to 10.50.42', 'Jarasandha attacks seventeen times in all; each time the Vṛṣṇis destroy his army; he is released each time.'],
    ['TEXT 10.52.6 to 10.52.9', 'After the cave (Event 05), Jarasandha comes again with twenty-three divisions while wealth is carried to Dvārakā; Krishna and Balarama flee on foot and he pursues, laughing.'],
    ['TEXT 10.52.10 to 10.52.11', 'They climb Mount Pravarṣaṇa; he sets it on fire but cannot find them.'],
    ['TEXT 10.52.12 to 10.52.14', 'They leap from the burning peak, reach Dvārakā unseen; he believes them dead and goes to Magadha.'],
    ['TEXT 10.54.10 to 10.54.17', 'At Kuṇḍina, after the abduction, Jarasandha consoles the dejected Śiśupāla: victory and defeat are governed by time and fate, and the kings will win when time turns.']
  ],
  cast: [
    ['Jarasandha', 'King of Magadha; leader of the coalition', 'Persistent, proud, philosophical in defeat.'],
    ['Asti and Prāpti', 'Kaṁsa’s widows; Jarasandha’s daughters', 'The source of the grievance.'],
    ['Balarama', 'Fights with his plough; seizes Jarasandha', 'His power is shown here before it is needed at Kuṇḍina.'],
    ['Ugrasena', 'The Yadu king', 'Receives the spoils.'],
    ['The women of Mathurā', 'Watch from the walls', 'The witnesses and the first ordinary-people chorus.'],
    ['Other kings', 'Dissuade Jarasandha from penance', 'The coalition’s habit of consoling itself.']
  ],
  reach: [
    '**Jarasandha in the flesh at Kuṇḍina.** Rukmini sees the man who was spared seventeen times, and hears the story from soldiers, her father or Rukmi. ADAPTATION.',
    '**The visitors’ tales** (10.52.23): travelling merchants add the siege stories to Krishna’s praises. ADAPTATION.',
    '**Rukmi’s admiration for Jarasandha** gives Rukmini the political side of the same tale: the kings’ pride in him against her wonder at Krishna’s patience. ADAPTATION.',
    '**Counting.** The tally of seventeen sparings can be echoed in Shishupala’s hundred, and in the counting motif already in the earlier treatment.'
  ],
  talk: [
    ['Jarasandha to Krishna (10.50.17)', 'DIRECT', 'Calls him a boy and challenges Balarama.', 'The rival’s contempt, which the audience reads as respect in disguise.'],
    ['Krishna to Jarasandha (10.50.18 to 10.50.19)', 'DIRECT', 'Heroes show courage in action, not in speech.', 'Calm, unprovoked. Reported, not staged, in the hidden-Krishna approach.'],
    ['Krishna’s deliberation (10.50.5 to 10.50.10)', 'INDIRECT', 'I will break the army and leave the king, so that more come.', 'A strategist who plans for the Earth, not for himself.'],
    ['Soldier or merchant to Rukmini (ADAPTATION)', 'DIRECT', 'Seventeen times he was beaten, and seventeen times he was let go.', 'His patience, and the mystery of why.'],
    ['Jarasandha to Śiśupāla (10.54.10 to 10.54.17)', 'INDIRECT', 'Time turns; do not grieve.', 'Krishna is the wheel the coalition thinks will turn back.'],
    ['Rukmi to Bhīṣmaka (ADAPTATION)', 'DIRECT', 'Jarasandha will crush him if we stand with him.', 'The threat he is believed to pose.']
  ],
  hidden: [
    'The battle can be shown by its sounds and effects: the conch, the plough, the walls, the fainting women. The camera stays on the women of Mathurā rather than on the chariots (10.50.21 to 10.50.23).',
    'Krishna’s answer to Jarasandha is a spoken line. In the hidden-Krishna approach it is reported by a witness, not staged.',
    'Two radiant chariots arriving from the sky (10.50.11 to 10.50.12) is a pure “effect” beat.'
  ],
  welfare: ['A water-carrier of Mathurā who chalks a mark on the wall after each siege', 'Each defeat gives the city a pause; the marks eventually reach seventeen.', 'A wall of chalk marks; after the move to Dvārakā, the empty wall.'],
  links: [
    '**Event 01 (Manthana):** the coalition of rivals and the “seizing is not holding” theme; the Asuras’ repeated attacks.',
    '**Event 02 (Earth’s burden):** Krishna spares Jarasandha so that more of the burden gathers around him.',
    '**Event 04 (Dvārakā):** the sieges and the pending threat of Kālayavana are why the city is built.',
    '**Event 05 (Mucukunda):** the last chase occurs after the cave.',
    '**Event 06 (abduction):** Jarasandha attends Śiśupāla’s wedding (10.53.14 to 10.53.19) and consoles him afterwards (10.54.10 to 10.54.17).'
  ],
  questions: [
    'Do we stage any of the seventeen attacks, or only report them?',
    'Is the final chase on Pravarṣaṇa included, and if so, placed here or after Event 05?',
    'How much of Jarasandha’s character do we show at Kuṇḍina: menace, philosophy, or both?'
  ],
  cautions: [
    'The text of 10.50 mentions seventeen attacks; the later pursuit in 10.52 is sometimes counted as an eighteenth. Treat the count as “seventeen, and one more after the cave” rather than a fixed number.',
    'Jarasandha’s death at Bhīma’s hands (Mahābhārata) is outside this gathering.',
    'Do not use the “ninety miles” height of the leap from the hill; the figure was not confirmed in this pass.'
  ],
  before: 'Event 02 (Earth’s burden; Krishna’s appearance in the Yadu line).',
  after: 'Event 04 (the founding of Dvārakā), then Event 05; the Pravarṣaṇa chase closes this thread, then Event 06.'
};

Promise.all([
  L.save(L.eventDoc(e1), OUT + '01_Ksheera_Sagara_Manthana.docx'),
  L.save(L.eventDoc(e2), OUT + '02_Burden_of_the_Earth.docx'),
  L.save(L.eventDoc(e3), OUT + '03_Jarasandha_Repeated_Attacks.docx')
]);
