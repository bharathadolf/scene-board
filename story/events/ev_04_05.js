const L = require('./lib');
const OUT = '/home/claude/story_events/';

// ---------------------------------------------------------------- 04 DVARAKA
const e4 = {
  fileNo: 'EVENT 04', title: 'The Founding of Dvārakā on the Sea', sub: 'A fortress city in the ocean, built so the Yadavas could be safe',
  footer: 'Event 04: The Founding of Dvārakā',
  position: 'After the seventeen sieges; when Kālayavana arrives; before the cave.',
  place: 'Mathurā; the ocean off Ānarta.',
  anchor: 'Śrīmad-Bhāgavatam 10.50.43 to 10.50.58 (TEXT, checked). Ānarta as the starting place of the later chariot journey is from 10.53.6.',
  rukminiLink: 'Dvārakā is where the Brahmin goes with her letter, where Krishna lives, and where she ends. Inland Rukmini has never seen the sea; the city in the water is her imagined future.',
  brief: [
    'As the eighteenth round of fighting approaches, Kālayavana arrives with thirty million barbarian troops and besieges Mathurā. Krishna and Balarama see that the Yadavas face danger from two sides: if Jarasandha comes while they fight Kālayavana, their people will be harmed. They decide to build a fortress no enemy can enter, settle the family there, and then destroy Kālayavana.',
    'Krishna has a city built in the ocean, twelve yojanas around, with Viśvakarmā’s skill evident in its avenues, courtyards and gardens. The gods contribute: Indra gives the Sudharmā assembly hall and the Pārijāta tree, Varuṇa swift horses, Kubera his eight treasures. By his yogic power Krishna moves all of Mathurā’s people to Dvārakā in one move, then walks out of the city gate, unarmed, wearing a lotus garland.'
  ],
  beatHead: ['Ref', 'Beat'],
  beatW: [1500, 8138],
  beats: [
    ['TEXT 10.50.43 to 10.50.44', 'Kālayavana arrives and besieges Mathurā with thirty million troops (see Event 05 for who sends him).'],
    ['TEXT 10.50.45 to 10.50.47', 'Krishna and Balarama see danger from two directions: Jarasandha could arrive while they fight Kālayavana.'],
    ['TEXT 10.50.48', 'They decide to build an impregnable fortress, settle the family there, then deal with Kālayavana.'],
    ['TEXT 10.50.49 to 10.50.50', 'A fortress twelve yojanas around is built within the ocean, with a wondrous city inside; the architecture is Viśvakarmā’s.'],
    ['TEXT 10.50.51 to 10.50.53', 'Features: golden-topped gateways touching the sky, crystal upper levels, jewelled houses, treasuries, stables, watchtowers, household temples; people of all four orders live there.'],
    ['TEXT 10.50.54 to 10.50.56', 'Gifts of the gods: Indra gives the Sudharmā hall and the Pārijāta tree; Varuṇa swift horses; Kubera the eight treasures; other guardians their powers.'],
    ['TEXT 10.50.57', 'By yogic power Krishna transports all of Mathurā’s people to Dvārakā.'],
    ['TEXT 10.50.58', 'Krishna, wearing a lotus garland and carrying no weapons, leaves through the city gate.']
  ],
  cast: [
    ['Krishna', 'Decides, builds, relocates, then leaves', 'Seen only as an absence at the gate in the hidden-Krishna approach.'],
    ['Balarama', 'Shares the decision', 'The planner’s partner.'],
    ['Viśvakarmā', 'The architect', 'The city’s maker.'],
    ['Indra', 'Gives the Sudharmā hall and the Pārijāta tree', 'Links to the Manthana treasures.'],
    ['Varuṇa, Kubera and the guardians', 'Give horses and treasure', 'The world’s wealth gathers at the sea.'],
    ['The Yadavas', 'The people moved', 'The ordinary witnesses.']
  ],
  reach: [
    '**The Brahmin’s account.** He travels to Dvārakā and returns to describe it: the city in the sea, the gates, the lamps. The audience and Rukmini see it through his eyes. ADAPTATION (the journey is TEXT, 10.52.26 to 10.52.36).',
    '**Sailors and merchants** carry the description to Vidarbha. ADAPTATION.',
    '**A painted map or cloth** (a patachitra-style scroll) shows the city. ADAPTATION.',
    '**Rukmini imagines the sea.** She has never seen it; her imagination of Dvārakā is a set of images the film can use again at the end. ADAPTATION.'
  ],
  talk: [
    ['Krishna and Balarama, in council (10.50.45 to 10.50.48)', 'INDIRECT', 'Two threats at once: build a fortress and move the family before we face the Yavana.', 'He plans for others’ safety before his own victory.'],
    ['Gods to Krishna, with gifts (10.50.54 to 10.50.56)', 'EFFECT', 'The wealth and powers of the gods are returned to him.', 'The world’s wealth serves him; he does not seek it.'],
    ['Yadavas, waking in Dvārakā (ADAPTATION)', 'INDIRECT', 'We went to sleep in Mathurā and woke by the sea.', 'He moves a whole people without a word.'],
    ['A gate guard (ADAPTATION)', 'INDIRECT', 'He walked out alone with only a garland of lotuses.', 'Unarmed, unhurried.'],
    ['The Brahmin to Rukmini (ADAPTATION)', 'DIRECT', 'The city stands on water, and the lamps are lit all night.', 'Where she will end up.']
  ],
  hidden: [
    'Krishna’s exit through the gate in a lotus garland (10.50.58) can be a back-of-garland shot, or reported by a guard.',
    'The relocation of the Yadavas by yoga power is an effect: the audience sees the result, not the act.',
    'The architecture (gold gateways, crystal terraces) can be the city’s portrait of him without showing him.'
  ],
  welfare: ['A potter of Mathurā whose wheel is moved to the new quay', 'A people saved from a two-front war are settled in safety.', 'The potter sets his wheel by the waves and turns the first pot of the new city.'],
  links: [
    '**Event 01 (Manthana):** the Pārijāta tree and a city built in the Ocean; the sea that was churned now houses the Lord’s city. Lakṣmī is born of the sea.',
    '**Event 03 (Jarasandha):** the sieges are the cause; the last chase follows.',
    '**Event 05 (Mucukunda):** the plan: settle the family, then deal with Kālayavana.',
    '**Event 06 (abduction):** the place the Brahmin travels to; the place Krishna returns to with Rukmini.',
    '**Event 07 (together):** the final setting.'
  ],
  questions: [
    'Is Dvārakā shown in full before Rukmini reaches it, or only as described?',
    'Does the film show the moment the people wake in the new city?',
    'How much weight does the Pārijāta tree carry as a link to the Manthana?'
  ],
  cautions: [
    'Earlier documents in this project said the Pārijāta tree is fetched later for Satyabhāmā (10.59). The Bhāgavata also has Indra giving it at the founding (10.50.54 to 10.50.56). Both can be true; this file uses the founding version.',
    'Sources vary on who builds the city and on its location; this file keeps to the Bhāgavata, which names Viśvakarmā and puts it in the ocean.',
    'The exact size (twelve yojanas) is from a summary of the verse; confirm before quoting.'
  ],
  before: 'Event 03 (the seventeen sieges).',
  after: 'Event 05 (Kālayavana and Mucukunda).'
};

// ---------------------------------------------------------------- 05 KALAYAVANA / MUCUKUNDA
const e5 = {
  fileNo: 'EVENT 05', title: 'The Kālayavana Trap at Mucukunda’s Cave', sub: 'An unarmed walk, a sleeper’s gaze, and a sage who asks for nothing',
  footer: 'Event 05: Kālayavana and Mucukunda',
  position: 'Immediately after Dvārakā is built and the people are moved.',
  place: 'Outside Mathurā; a mountain cave.',
  anchor: 'Śrīmad-Bhāgavatam 10.50.43 to 10.50.44 (Kālayavana arrives); 10.51 (the cave); 10.52.1 to 10.52.5 (Mucukunda departs; Krishna returns).',
  rukminiLink: 'The story reaches her as a marvel: a king who slept for ages woke and saw him. Mucukunda’s prayers are the film’s most intimate account of Krishna by someone who truly saw him.',
  brief: [
    'Kālayavana, sent by Nārada according to the Bhāgavata, besieges Mathurā with thirty million troops. Seeing Krishna come out on foot and unarmed, Kālayavana recognises him from the marks Nārada described and follows him on foot without weapons. Krishna stays just out of reach, leads him across the land and into a mountain cave.',
    'In the cave a man is asleep. Kālayavana, taking him for Krishna pretending to sleep, kicks him. The sleeper is Mucukunda, a king of the Ikṣvāku line who fought for the Devas against the Asuras and was given a boon of undisturbed sleep, with the power to burn whoever woke him. He wakes, glances at Kālayavana, and the Yavana burns to ash.',
    'Krishna then shows himself to Mucukunda, who recognises him as the Lord, remembers the sage Garga’s prediction, and offers prayers: he wasted his life on kingdom and family and wants only to serve the Lord’s feet. Krishna offers boons and Mucukunda declines; Krishna praises him and says the offer was a test. Mucukunda leaves and goes north to Badarikāśrama to practise austerity. Krishna returns to Mathurā, destroys the Yavana army and sends its wealth to Dvārakā.'
  ],
  beatHead: ['Ref', 'Beat'],
  beatW: [1500, 8138],
  beats: [
    ['TEXT 10.50.43 to 10.50.44', 'Kālayavana, sent by Nārada, besieges Mathurā with thirty million troops.'],
    ['TEXT 10.50.58 and 10.51.1 to 10.51.5', 'Krishna walks out unarmed; Kālayavana recognises him by Nārada’s marks and decides to fight without weapons.'],
    ['TEXT 10.51.6 to 10.51.8', 'The chase: Kālayavana runs after him; Krishna keeps just ahead, leading him far away; Kālayavana taunts him for fleeing.'],
    ['TEXT 10.51.9 to 10.51.10', 'Krishna enters a mountain cave; Kālayavana follows and finds a man asleep; he kicks him, thinking he is Krishna.'],
    ['TEXT 10.51.11 to 10.51.12', 'Mucukunda wakes, angry; his glance burns Kālayavana to ash.'],
    ['TEXT 10.51.13 to 10.51.21', 'Mucukunda’s background: a king of the Ikṣvāku line who fought for the Devas against the Asuras; he asked for undisturbed sleep with the power to burn whoever woke him; later released when Kārttikeya became general, he chose sleep over liberation.'],
    ['TEXT 10.51.22 to 10.51.26', 'Krishna reveals himself; Mucukunda sees his four-armed form and wonders if this is the Supreme Lord.'],
    ['TEXT 10.51.27 to 10.51.42', 'Mucukunda asks who he is; Krishna says his births are countless, in this age as Vasudeva’s son to protect dharma; he killed Kaṁsa; Kālayavana was burned by Mucukunda’s glance; he came because Mucukunda had earlier prayed for him.'],
    ['TEXT 10.51.43 to 10.51.44', 'Krishna offers any boon; Mucukunda bows, recognises Nārāyaṇa, and recalls Garga’s prediction.'],
    ['TEXT 10.51.45 to 10.51.57', 'Mucukunda’s prayers: the delusion of worldly happiness, the rarity of human birth, the waste of his kingship, death like a snake, the futility of power, freedom through the company of devotees, thanks for removing his attachment, and a plea to serve the Lord.'],
    ['TEXT 10.51.58 to 10.51.59', 'Krishna praises his steadiness and says the offered boons were a test.'],
    ['TEXT 10.52.1 to 10.52.4', 'Mucukunda leaves the cave, judges that Kali-yuga has come, goes north to Badarikāśrama and worships Hari.'],
    ['TEXT 10.52.5', 'Krishna returns to Mathurā, destroys the barbarian army, and sends its wealth toward Dvārakā.']
  ],
  cast: [
    ['Kālayavana', 'The Yavana king; pursuer', 'Sent by Nārada in the Bhāgavata; other texts give him other origins (TRADITION).'],
    ['Mucukunda', 'The sleeping king; the one who truly sees', 'The film’s model of the awed witness.'],
    ['Krishna', 'The lure and the lord', 'Hidden by default (see section 6).'],
    ['Nārada', 'Sends Kālayavana; gives the marks of Krishna', 'The mischievous messenger.'],
    ['Garga', 'Predicted the Lord’s coming to Mucukunda', 'Offstage voice of prophecy.'],
    ['The Yavana army', 'Thirty million besiegers', 'Destroyed after the cave (10.52.5).'],
    ['Kārttikeya', 'Becomes the Devas’ general in Mucukunda’s place', 'Marks the end of Mucukunda’s service.']
  ],
  reach: [
    '**The tale as it reaches Kuṇḍina:** a merchant or traveller brings the story that a Yavana king was burned by a sleeping king. ADAPTATION.',
    '**Mucukunda’s prayer as a recited text:** a priest at the Ambikā temple recites it to Rukmini or her mother. ADAPTATION.',
    '**Nārada’s description of Krishna’s marks** reaches Rukmini through a visitor, as it reached Kālayavana. It is the closest the film comes to an exact description by a third party. ADAPTATION.',
    '**Rukmini thinks of the walk:** the image of a man walking out alone to absorb a threat becomes her private picture of him.'
  ],
  talk: [
    ['Nārada to Kālayavana (10.51; offstage)', 'DIRECT', 'The marks by which you will know Vāsudeva.', 'A precise third-party description.'],
    ['Kālayavana to Krishna (10.51.8)', 'DIRECT', 'Taunts him for running away.', 'He is called a coward by the one he is leading to death.'],
    ['Mucukunda to Krishna (10.51.23 to 10.51.26)', 'DIRECT', 'Who are you, with such light, alone in a wild place?', 'Awe from the one man who sees him without prejudice.'],
    ['Krishna to Mucukunda (10.51.27 to 10.51.42)', 'DIRECT', 'My births are countless; I came in this age to protect dharma.', 'His own account of himself, reported not staged in the hidden-Krishna approach.'],
    ['Mucukunda’s prayers (10.51.45 to 10.51.57)', 'DIRECT', 'I wasted my life on kingship; let me serve your feet.', 'The most intimate portrait of him in the whole gathering.'],
    ['A herdsman to a friend (ADAPTATION)', 'INDIRECT', 'A Yavana ran in after a man, and only smoke came out.', 'His power as an effect on the land.']
  ],
  hidden: [
    'The chase can show Krishna only as a figure ahead, always at the edge of the frame, or by his footprints.',
    'Mucukunda is the film’s illumination in miniature: the camera stays on Mucukunda’s face while he sees the Lord. His awe is the portrait.',
    'The cave is a room with a sleeper and a flash; the burning of Kālayavana is an effect, not a face.'
  ],
  welfare: ['A goatherd whose flock grazes near the mountain', 'The besieging army that threatened Mathurā is gone; pasture and road are open again.', 'Smoke from the cave; the goats walking back onto the road.'],
  links: [
    '**Event 01 (Manthana):** Mucukunda fought the Asuras for the Devas; the cave is a place where ages sleep. Krishna absorbing the danger by walking out alone echoes Śiva holding Hālāhala. A glance that burns echoes the Sudarśana severing Rāhu.',
    '**Event 03 (Jarasandha):** the same siege season; the last Pravarṣaṇa chase follows this event.',
    '**Event 04 (Dvārakā):** the city that has just been built is the safe place the plan depended on.',
    '**Event 06 (abduction):** Krishna’s method here (patience, taking the danger away from others, deceiving a pursuer into the wrong place) appears again at Kuṇḍina.'
  ],
  questions: [
    'Does the film stage the cave or leave it as a story?',
    'Is Mucukunda’s prayer used whole, in part, or only as a theme?',
    'Which origin for Kālayavana do we use: the Bhāgavata’s (sent by Nārada) or another (Gargya’s son, Śiva’s boon)?'
  ],
  cautions: [
    'The summary I had for 10.51 stops mid-verse at 10.51.59; what Krishna finally grants Mucukunda, beyond the test, is not confirmed in this pass.',
    'Parentage of Kālayavana (Gargya and an Apsarā; Śiva’s boon) comes from other Purāṇas and the Harivaṁśa as reported by a secondary source; do not mix with the Bhāgavata version without marking it.',
    'Local legends place the cave at specific sites; ignore for story purposes unless you want a real location.'
  ],
  before: 'Event 04 (Dvārakā’s founding).',
  after: 'Event 03’s last beats (the Pravarṣaṇa chase), then Event 06.'
};

Promise.all([
  L.save(L.eventDoc(e4), OUT + '04_Founding_of_Dvaraka.docx'),
  L.save(L.eventDoc(e5), OUT + '05_Kalayavana_and_Mucukunda_Cave.docx')
]);
