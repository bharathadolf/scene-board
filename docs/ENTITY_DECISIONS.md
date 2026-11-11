# Four decisions about sets that are yours to make

The entity layer (`data/entities.json`) turns 89 place strings into 17 sets. Most of that was
reading; these four were judgement. Each has been given a working answer so that every scene
resolves to a set today — but the answer is a recommendation, and changing it is one row in
`scripts/make-entities.py` and a re-run.

## 1 · Is the shore of the Ocean of Milk the same build as the shore at Dvārakā?

The strings: `The shore` · `The shore of the Ocean of Milk` · `The shore and the Ocean of Milk` · `The shore; the assembled claimants` · `The shore; the assembly` · `The shore at Dvārakā` · `The shore at Ānarta`

**What the data shows.** “The shore” on its own is always the Ocean of Milk — all four uses are in events 1 and 2 — so those merge without argument. The open question is the earthly shore.

**Recommended.** Two sets, one ocean. Keep `milk_ocean` and `dvaraka_shore` as separate builds that share one water simulation and one shoreline kit. The film rhymes them on purpose (the Earth is brought to “the same Ocean of Milk”), and a shared kit makes the rhyme visible without making the mythic shore and her shore the same place.

**The alternative.** One set, redressed. Cheaper by one environment, but the last shot of the film would stand on the first act's ground.

**Applied for now:** two sets.

## 2 · How many palaces is “the palace”?

The strings: `Bhīṣmaka’s palace` · `The palace` · `Palace hall` · `Palace; women’s quarters` · `Rukmini’s quarters` · `Rukmini’s room at night` · `The palace gate` · `The forecourt` · `The forecourt of the temple` · `Kuṇḍina’s hall; evening` · `Kuṇḍina’s hall and streets`

**What the data shows.** The strings split three ways. Hall, quarters and gate are rooms of Bhīṣmaka's house. “The forecourt” is never the palace — every use is the temple's forecourt, in the abduction. And “The palace” ×2 is not Kuṇḍina at all: both are event 8, straight after “The palace of Chedi”.

**Recommended.** One Kuṇḍina palace with three sub-locations (hall, her quarters, gate); the forecourt belongs to the temple set; “The palace” ×2 goes to Chedi.

**The alternative.** Build her quarters as a separate small set if the palace hall is too heavy to light for intimate scenes — a production call, not a story one.

**Applied for now:** one palace, forecourt to the temple, two scenes to Chedi.

## 3 · Is the cave on the mountain road, and is Pravarṣaṇa the same mountain?

The strings: `A mountain cave` · `The cave` · `Heaven’s war; the cave` · `The mountain road` · `Mount Pravarṣaṇa` · `The burning peak; Jarasandha’s camp` · `Across the land to the mountains`

**What the data shows.** The story joins the cave to the mountain road twice: Mucukunda walks out of one onto the other, and the goatherd sees the cave's smoke from it. Pravarṣaṇa is a different mountain, reached later, and the only one set on fire.

**Recommended.** Two sets: `cave_mountain` (cave interior plus its road) and `pravarshana`, both grown from one terrain kit.

**The alternative.** One mountain. Saves a build but the audience would see him flee to the place the hunter already died.

**Applied for now:** two sets.

## 4 · Where does Śiśupāla find the bride gone (E08-05)?

The strings: `Kuṇḍina`

**What the data shows.** The scene only says Kuṇḍina. It is the same moment as E06-21, which is the temple forecourt.

**Recommended.** The temple forecourt, so the backstory beat can be shot inside the abduction's coverage.

**The alternative.** His rooms in the palace, alone — a different scene emotionally.

**Applied for now:** temple forecourt.

---

To change one: edit the scene rows in `scripts/make-entities.py`, then
`npm run data:entities` — it regenerates the data and audits it.
