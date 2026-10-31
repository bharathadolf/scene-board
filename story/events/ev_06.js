const L = require('./lib');
const OUT = '/home/claude/story_events/';

const e6 = {
  fileNo: 'EVENT 06', title: 'The Abduction of Rukmini', sub: 'Rukmini’s choice, her letter, the temple procession and the seizure that is also her answer',
  footer: 'Event 06: The Abduction of Rukmini',
  position: 'After Dvārakā is founded and the cave episode is over. The climax of the film.',
  place: 'Kuṇḍina in Vidarbha; Dvārakā (the Brahmin’s journey); the road back.',
  anchor: 'Śrīmad-Bhāgavatam 10.52.16 to 10.54.52 (TEXT, checked). Your Rukmi, Shishupala and Balarama files cover the same episode from their own sides.',
  rukminiLink: 'This is Rukmini’s event. She is the one who hears of Krishna, chooses, writes, waits, prays and walks out of the temple toward him. Everything else in the gathering leads here.',
  brief: [
    'Bhīṣmaka of Vidarbha has five sons, Rukmī the eldest, and one daughter, Rukmiṇī. Visitors to the palace sing of Krishna’s qualities and beauty; Rukmiṇī decides he is the right husband, and he decides she is the right wife. Rukmī, hostile to Krishna, stops the family from giving her to him and arranges her marriage to Śiśupāla. Distressed, Rukmiṇī sends a trusted brāhmaṇa to Dvārakā with a letter: she has chosen him, she asks him to come the next day, defeat the opposing forces and take her, and she explains the temple procession that will let him do so; if he refuses, she will give up her life and keep trying through many lifetimes.',
    'Krishna smiles, says he cannot sleep either, and vows to bring her as a flame is drawn from kindling. He and the brāhmaṇa ride to Vidarbha in one night. Kuṇḍina is decorated for Śiśupāla’s wedding; his father Damaghoṣa arrives, and Jarasandha, Śālva, Dantavakra, Vidūratha, Pauṇḍraka and others swear to fight Krishna if he comes. Balarama, fearing for his brother, arrives with an army. Rukmiṇī waits anxiously until her omens turn and the brāhmaṇa returns with Krishna’s promise. Citizens wish for the marriage to Krishna.',
    'On the wedding day Rukmiṇī goes in procession, guarded and accompanied by her mothers, friends, musicians and bards, to the temple of Ambikā. She prays that Krishna become her husband, breaks her vow of silence, and walks out. The kings are dazed by her beauty. She sees Krishna, is eager to climb onto his chariot, and he lifts her up before his enemies and drives away through the ring of kings, with Balarama leading.',
    'The kings pursue; the Yadava commanders turn on them and Jarasandha’s side retreats. Rukmī vows not to enter Kuṇḍina until he has killed Krishna and recovered his sister, pursues alone and duels; Krishna breaks his bows and weapons and is about to kill him when Rukmiṇī falls at his feet. He binds Rukmī and shaves part of his hair and moustache. Balarama frees him, rebukes Krishna, and consoles Rukmiṇī. Rukmī, humiliated, builds Bhojakaṭa and will not return home.'
  ],
  beatNote: 'Beats are grouped by part. “Rukmini” shows her state; “Krishna on screen” shows how the hidden-Krishna rule applies by default (details in section 6).',
  beatHead: ['Ref', 'Beat', 'Rukmini', 'Krishna on screen'],
  beatW: [1300, 4300, 2000, 2038],
  beats: [
    ['**A. THE CHOICE**', '', '', ''],
    ['TEXT 10.52.16 to 10.52.22', 'Bhīṣmaka’s family: five sons (Rukmī the eldest) and one daughter. Parīkṣit asks Śuka how Krishna won her, having heard it was a rākṣasa-style marriage. Framing device.', 'Not yet seen', 'No'],
    ['TEXT 10.52.23', 'Visitors to the palace sing Krishna’s praises; Rukmiṇī judges him a fitting husband; Krishna judges her a fitting wife.', 'Listening; falls for the description', 'No; only talked about'],
    ['TEXT 10.52.25', 'Rukmī, hostile to Krishna, blocks the family’s inclination and arranges the match with Śiśupāla.', 'Overridden', 'No'],
    ['TEXT 10.52.26', 'Distressed, Rukmiṇī sends a trusted brāhmaṇa to Krishna.', 'Acts', 'No'],
    ['**B. THE LETTER**', '', '', ''],
    ['TEXT 10.52.27 to 10.52.29', 'At Dvārakā the brāhmaṇa is received, honoured and fed; Krishna massages his feet and asks after his welfare.', 'Waiting at home', 'Reported by the Brahmin; hands or shadow if staged'],
    ['TEXT 10.52.30 to 10.52.36', 'Krishna asks about his duties, his contentment, the king’s protection of his people, and offers to help; the brāhmaṇa tells him everything.', 'Waiting', 'Reported'],
    ['TEXT 10.52.37 to 10.52.43', 'The letter, read aloud: (37) having heard your qualities and beauty, my mind is fixed on you; (38) no sensible maiden would choose another; (39) I have chosen you; come quickly and keep Śiśupāla away; (40) if I have worshipped enough, take my hand; (41) come unseen tomorrow, defeat the forces, take me in the rākṣasa style; (42) on the day before the wedding there is a procession to the goddess Girijā and I can leave the palace without harm to my relatives; (43) if you refuse, I will give up my life and try again over many lifetimes.', 'Her own voice', 'No; the letter is her portrait of him'],
    ['TEXT 10.52.44', 'The brāhmaṇa says he has delivered the confidential message and asks Krishna to decide promptly.', 'Waiting', 'Reported'],
    ['**C. HIS ANSWER AND THE JOURNEY**', '', '', ''],
    ['TEXT 10.53.1 to 10.53.3', 'Krishna smiles; says he cannot sleep either; Rukmī’s envy has blocked it; he vows to bring her as a flame is drawn from kindling.', 'Unaware', 'Reported later by the Brahmin'],
    ['TEXT 10.53.4 to 10.53.6', 'He learns the wedding time, orders his chariot; Dāruka brings it; he and the brāhmaṇa ride from Ānarta to Vidarbha in a single night.', 'Unaware', 'Chariot and road only'],
    ['**D. KUṆḌINA PREPARES**', '', '', ''],
    ['TEXT 10.53.7 to 10.53.13', 'Bhīṣmaka, moved by love for his son, prepares for Śiśupāla’s wedding: the city cleaned and decorated, rituals, gifts to brāhmaṇas, the bride bathed and adorned.', 'Being adorned for a wedding she does not want', 'No'],
    ['TEXT 10.53.14 to 10.53.19', 'Damaghoṣa arrives with an army; Jarasandha, Śālva, Dantavakra, Vidūratha, Pauṇḍraka and thousands of kings come as Śiśupāla’s allies and vow to fight Krishna if he steals the bride.', 'Watching the kings assemble', 'No'],
    ['TEXT 10.53.20 to 10.53.21', 'Balarama, fearing conflict and out of love for his brother, hurries to Kuṇḍina with a large army.', 'Unaware', 'No'],
    ['**E. WAITING**', '', '', ''],
    ['TEXT 10.53.22 to 10.53.26', 'Rukmiṇī waits; the hour is near and Krishna and the brāhmaṇa have not come; she imagines reasons, including the displeasure of Brahmā or Śiva; she consoles herself that the time has not yet come.', 'Anxious', 'No'],
    ['TEXT 10.53.27 to 10.53.30', 'Omens: her left thigh, arm and eye twitch, a good sign; the brāhmaṇa returns joyful with Krishna’s message and promise.', 'Relief', 'Reported'],
    ['TEXT 10.53.31 to 10.53.35', 'Rukmiṇī bows to the brāhmaṇa; Bhīṣmaka receives Krishna and Balarama with honour and hosts the other kings by rank.', 'In the women’s quarters', 'See tension note in section 6'],
    ['TEXT 10.53.36 to 10.53.38', 'The citizens gaze at Krishna and wish Rukmiṇī may marry him, offering their merit.', 'Hears of it', 'See tension note in section 6'],
    ['**F. THE TEMPLE AND THE ABDUCTION**', '', '', ''],
    ['TEXT 10.53.39 to 10.53.43', 'Rukmiṇī leaves the palace, guarded, for the Ambikā temple, with mothers, friends, musicians and bards amid drums, conches and horns.', 'In procession', 'No'],
    ['TEXT 10.53.44 to 10.53.49', 'She washes, enters the temple, is guided by brāhmaṇa women in worship, prays that Krishna become her husband, and receives blessings and prasāda.', 'Praying', 'No'],
    ['TEXT 10.53.50 to 10.53.51', 'She breaks her vow of silence and walks out led by a maidservant; the kings are stunned by her beauty.', 'Steps out', 'No'],
    ['TEXT 10.53.52 to 10.53.55', 'She advances shyly, glancing at the kings; she sees Krishna, is eager to mount his chariot; he seizes her before his enemies and lifts her onto it.', '**First sight of him**', '**First and fullest view**'],
    ['TEXT 10.53.56', 'He drives off through the ring of kings with Balarama leading, like a lion taking its prey from jackals.', 'On the chariot', 'Brief view'],
    ['TEXT 10.53.57', 'Jarasandha and the others cannot bear it; they lament that “mere cowherds” took their honour.', 'Behind her', 'No'],
    ['**G. PURSUIT AND RETREAT**', '', '', ''],
    ['TEXT 10.54.1 to 10.54.5', 'The enraged kings arm and chase; the Yadava commanders turn to face them; arrows fall; Rukmiṇī fears for her husband’s army and Krishna reassures her.', 'Afraid', 'Voice or presence only'],
    ['TEXT 10.54.6 to 10.54.9', 'Gada, Saṅkarṣaṇa (Balarama) and others strike down horses, elephants and chariots; Jarasandha’s side withdraws.', 'Watching', 'No'],
    ['TEXT 10.54.10 to 10.54.17', 'Jarasandha consoles Śiśupāla: victory and defeat are governed by time and fate; the kings will prevail when time turns; the kings go home.', 'Not present', 'No'],
    ['**H. RUKMĪ**', '', '', ''],
    ['TEXT 10.54.18 to 10.54.20', 'Rukmī, unable to bear it, pursues with a division and vows before the kings not to re-enter Kuṇḍina until he has killed Krishna and recovered his sister.', 'Fears her brother', 'No'],
    ['TEXT 10.54.21 to 10.54.31', 'The duel: Krishna breaks each of his bows, destroys his weapons and shield; Rukmī leaps down with a sword; Krishna cuts it to pieces and readies his own to kill him.', 'Terrified for her brother', 'Brief view'],
    ['TEXT 10.54.32 to 10.54.34', 'Rukmiṇī falls at Krishna’s feet and begs for her brother’s life; he stops.', '**Her second act: mercy**', 'Brief view'],
    ['TEXT 10.54.35', 'Krishna binds Rukmī with cloth and shaves part of his hair and moustache.', 'Looks away', 'Brief view'],
    ['TEXT 10.54.36 to 10.54.50', 'Balarama frees Rukmī and rebukes Krishna; he consoles Rukmiṇī: people bear their own joy and sorrow; the self is not the body; a warrior’s duties can be harsh.', 'Calmed', 'No'],
    ['TEXT 10.54.51 to 10.54.52', 'Humiliated, Rukmī builds Bhojakaṭa and will not return to Kuṇḍina.', 'Not present', 'No']
  ],
  cast: [
    ['Rukmiṇī', 'Protagonist; chooser; letter-writer', 'First sight of Krishna at 10.53.52.'],
    ['Rukmī', 'Eldest brother; blocks the match; vows; duels; is disfigured', 'Source: your Rukmi file.'],
    ['Bhīṣmaka', 'Father; inclined toward Krishna but yields to Rukmī’s will out of love for his son', 'Quiet sorrow; hosts Krishna.'],
    ['The Brahmin (unnamed in the text)', 'Messenger; the only one who meets Krishna before the temple', 'Rukmiṇī’s second light source.'],
    ['Śiśupāla', 'The chosen groom; later consoled by Jarasandha', 'Source: your Shishupala file.'],
    ['Damaghoṣa', 'Śiśupāla’s father', 'Arrives with an army.'],
    ['Jarasandha, Śālva, Dantavakra, Vidūratha, Pauṇḍraka', 'The coalition', 'Vow to fight Krishna if he comes.'],
    ['Balarama and the Yadava commanders (Gada and others)', 'Defend the retreat; free Rukmī', 'Source: your Balarama file.'],
    ['Dāruka', 'Krishna’s charioteer', 'Seen from behind or by his hands.'],
    ['Visitors, citizens, bards, brāhmaṇa women, maidservants', 'The ordinary chorus', 'See section 7.'],
    ['Krishna', 'The answer to the letter', 'Hidden by default until 10.53.52.']
  ],
  reach: [
    'Here Rukmini is not receiving a story; she is the one living it. The question is how she learns who Krishna is before she sees him, and the text already supplies the answer.',
    '**Visitors’ songs and talk** (10.52.23): the first and the most important source of her image of him.',
    '**The other events as the content of those songs.** The Earth-cow story, the seventeen sparings of Jarasandha, the walk to the cave, the sea city (Events 02 to 05) are what the visitors and bards tell her. This is how the earlier events become part of her story. ADAPTATION.',
    '**The letter** (10.52.37 to 10.52.43): her own words, the only place she speaks of him directly in the text.',
    '**The Brahmin’s report** (10.53.30): the only reliable eyewitness account of Krishna before the temple.',
    '**The citizens’ wish** (10.53.36 to 10.53.38): the crowd’s hope she can hear.',
    '**Balarama’s consolation** (10.54.36 to 10.54.50): the first time someone close to Krishna speaks to her about him as a person.'
  ],
  talk: [
    ['Visitors to Bhīṣmaka’s palace to Rukmiṇī (10.52.23)', 'DIRECT', 'His qualities, beauty, valour and wealth are sung.', 'The first impression, built entirely from talk.'],
    ['Rukmiṇī’s letter, read by the Brahmin (10.52.37 to 10.52.43)', 'DIRECT', 'My mind is fixed on you; come take me; I will give up my life otherwise.', 'The measure of what she believes he is.'],
    ['Rukmī to the family (10.52.25; ADAPTATION wording)', 'DIRECT', 'He is a cowherd and a thief of women.', 'The insult that the reveal answers.'],
    ['Krishna to the Brahmin, reported (10.52.27 to 10.52.36)', 'DIRECT', 'Asks after his welfare, massages his feet, offers help.', 'Humility and care, shown through the one he served.'],
    ['The Brahmin to Rukmiṇī (10.53.30)', 'DIRECT', 'He is coming; here is his message and promise.', 'Reliability; the answer to the letter.'],
    ['Krishna’s reply, reported (10.53.1 to 10.53.3)', 'DIRECT', 'I cannot sleep either; I will bring you like a flame from kindling.', 'Tenderness and resolve.'],
    ['The kings to each other (10.53.19)', 'INDIRECT', 'If he comes to steal the bride, we fight.', 'The scale of his reputation.'],
    ['Citizens at Kuṇḍina (10.53.36 to 10.53.38)', 'DIRECT', 'May she marry him; we give our merit.', 'Public hope.'],
    ['Jarasandha after the abduction (10.53.57)', 'DIRECT', 'Mere cowherds took our honour.', 'Rivals’ contempt and humiliation.'],
    ['Krishna to Rukmiṇī on the chariot (10.54.5)', 'DIRECT', 'Your side will soon destroy them.', 'Reassurance, voice only.'],
    ['Balarama to Rukmiṇī (10.54.36 to 10.54.50)', 'DIRECT', 'Each bears his own sorrow; a warrior’s duty can be harsh.', 'The brother’s view of him, close and unillusioned.']
  ],
  hidden: [
    '**Source tension (important).** In the text others do see Krishna before Rukmiṇī does: the brāhmaṇa (10.52.27 to 10.52.36), Bhīṣmaka (10.53.31 to 10.53.35) and the citizens (10.53.36 to 10.53.38). In the hidden-Krishna approach these meetings are reported, or shown through the other person’s face, not Krishna’s. Decide later whether to keep them as told scenes.',
    '**The text supports Rukmini’s first sight at the temple.** She sees him at 10.53.52 and is eager to mount his chariot; there is no earlier meeting. The reveal can fall at that verse.',
    '**His voice** can be withheld until after the abduction; the first speech in the text is to Rukmiṇī on the chariot (10.54.5), reassuring her.',
    '**The duel** is the longest scene in which Krishna acts; it can be shown from Rukmī’s or Rukmiṇī’s side so that Krishna remains partly hidden.',
    '**Balarama and the Yadava commanders carry the battle** (10.54.6 to 10.54.9). Balarama is the visible brother; Krishna’s power is felt as the broken bows.'
  ],
  welfare: ['A flower vendor, a weaver and a ferryman of Kuṇḍina', 'A coerced alliance does not bind two kingdoms to war; roads reopen; markets return to Kuṇḍina; Rukmī’s defeated pride is allowed to live and build.', 'The vendor’s garlands used for a different bride; the weaver’s wedding cloth carried away on a chariot; the ferryman takes a Yadava soldier across the river and no one else.'],
  links: [
    '**Event 01 (Manthana):** Lakṣmī chooses Viṣṇu among the assembled; the kings are the disappointed Asuras; Hālāhala is the poison each person holds; Rāhu’s surviving head is Rukmī’s disfigured survival; the Ambikā temple is Pārvatī’s shrine.',
    '**Event 02 (Earth’s burden):** the assembled kings are the burden; the abduction scatters them.',
    '**Event 03 (Jarasandha):** he attends and consoles Śiśupāla.',
    '**Event 04 (Dvārakā):** the Brahmin’s destination and the place Krishna and Rukmiṇī return to.',
    '**Event 05 (Mucukunda):** the method of luring a pursuer away.',
    '**Event 07 (together):** the arrival at Dvārakā.'
  ],
  questions: [
    'Do Krishna’s meetings with the Brahmin, Bhīṣmaka and the citizens stay in as told scenes?',
    'Does the film show the whole duel and the mercy, or only the mercy?',
    'How is “rākṣasa-style marriage” (Parīkṣit’s question) answered: the letter, her walking toward the chariot and her plea are the film’s reply?',
    'Where does Parīkṣit and Śuka’s frame come in, if at all?',
    'How much of Rukmī’s disfigurement and Bhojakaṭa belongs inside the climax?'
  ],
  cautions: [
    'The reading of Rukmiṇī’s omens is in 10.53, not 10.52.',
    'The Brahmin is unnamed in the Bhāgavata text; names given in later retellings are not verified here.',
    'The temple is described as that of Ambikā in 10.53 and Girijā in her letter (10.52.42); both are names of Pārvatī.',
    'Parīkṣit calls the marriage rākṣasa-style (10.52.18 to 10.52.20); the text itself makes the letter and her choice central. The film should keep that.',
    'The duel and the disfigurement are in the text; Balarama’s rebuke follows. Rukmī’s later death (10.61) is outside this gathering.'
  ],
  before: 'Event 05 and the last beats of Event 03 (the Pravarṣaṇa chase).',
  after: 'Event 07 (together in Dvārakā).'
};

L.save(L.eventDoc(e6), OUT + '06_Abduction_of_Rukmini.docx');
