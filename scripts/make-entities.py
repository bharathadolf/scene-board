#!/usr/bin/env python3
"""The production entity layer: what each scene is built from.

The story data says where a scene happens in prose (89 different strings for
115 scenes) and whose eyes it is seen through. A CG pipeline needs something
else: which SET is built, who is IN FRAME, and which story-bearing PROPS are
on it. This file is where that is decided, once, by hand, and written out as

    data/entities.json         sets (set > sub-location), characters, props
    data/scene_entities.json   every scene -> one set, a cast, its props
    data/entity_decisions.json the merges a person still has to settle

The table below is authored, not guessed from text: each row was read against
the scene's summary. Run it again after changing a row.

    python3 scripts/make-entities.py
"""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent

# ------------------------------------------------------------------- the sets
# form   drives the stand-in geometry the blocking builds
# ext    exterior or interior
# why    one line of justification for treating these places as one build
SETS = {
    "celestial": dict(name="The celestial realms", form="court", ext=False,
        why="Every non-earthly interior shares one architecture and one lookdev; the subs are dressings of it.",
        subs={"indra_court": "Indra's court", "battlefield": "The field between heaven and ocean",
              "brahma_realm": "Brahmā's realm", "vaikuntha": "The gate of Vaikuṇṭha",
              "asura_camp": "The Asura camp, neutral ground"}),
    "milk_ocean": dict(name="The Ocean of Milk", form="shore", ext=True,
        why="The Kṣīra-sāgara of the Churning: one mythic shoreline and one ocean of milk carry the Churning and the Earth's petition. Not the sea at Dvārakā, and nothing is shared with it.",
        subs={"shore": "The shore", "water": "The open water, the churning"}),
    "forest": dict(name="The forest", form="forest", ext=True,
        why="Used once, for Śiva and Mohinī; nothing else in the film is woodland.",
        subs={"glade": "A glade"}),
    "kundina_temple": dict(name="The temple of Ambikā, Kuṇḍina", form="temple", ext=True,
        why="The procession road, the sanctum, the painted wall and the forecourt are one continuous walk in the story and one build.",
        subs={"approach": "The road from the palace", "interior": "The sanctum",
              "painted_wall": "The painted wall of the Churning", "forecourt": "The door and the forecourt"}),
    "kundina_palace": dict(name="Bhīṣmaka's palace, Kuṇḍina", form="hall", ext=False,
        why="Hall, gate and the women's side are rooms of one house; she overhears one from another.",
        subs={"hall": "The hall", "rukmini_quarters": "Rukmini's quarters", "gate": "The palace gate"}),
    "kundina_city": dict(name="Kuṇḍina, the city", form="street", ext=True,
        why="Street and market are the same street kit dressed twice.",
        subs={"street": "A street", "market": "The market"}),
    "kundina_outskirts": dict(name="Outside Kuṇḍina", form="plain", ext=True,
        why="Field, well and river crossing are the inland country she walks through; one terrain, three dressings.",
        subs={"field": "A field by the army road", "well": "The roadside well", "river_crossing": "The river crossing"}),
    "mathura": dict(name="Mathurā", form="wall", ext=True,
        why="The wall is the water-carrier's whole world, and the plain is what is seen from it.",
        subs={"walls": "The walls", "gate": "The gate", "council": "The council room",
              "city": "Inside the city", "plain": "The plain before the walls"}),
    "magadha_palace": dict(name="Jarasandha's palace, Magadha", form="hall", ext=False,
        why="The only interior that belongs to the enemy.",
        subs={"hall": "The hall"}),
    "war_camp": dict(name="A war camp", form="camp", ext=True,
        why="One tent kit; the banners are the dressing.",
        subs={"yavana": "Kālayavana's camp", "magadha": "Jarasandha's camp"}),
    "open_country": dict(name="The open country", form="road", ext=True,
        why="Every road, chase and duel happens on procedural terrain: one environment, generated per shot.",
        subs={"long_road": "A long road", "fields": "Fields and villages under an army",
              "chase_road": "The road out of Kuṇḍina", "roadside": "The roadside after the rout",
              "duel_plain": "The plain of the duel", "river_plain": "The river plain, Bhojakaṭa"}),
    "cave_mountain": dict(name="The cave and its mountain", form="cave", ext=False,
        why="Mucukunda walks out of the cave onto the mountain road, and the goatherd sees the cave's smoke from it: adjacent by the story.",
        subs={"cave": "The cave", "road": "The mountain road"}),
    "pravarshana": dict(name="Mount Pravarṣaṇa", form="mountain", ext=True,
        why="A different mountain in the story, and the only one that burns.",
        subs={"slope": "The climb", "peak": "The burning peak"}),
    "dvaraka_city": dict(name="Dvārakā, the city", form="gate", ext=True,
        why="The city that rises from the sea: gate, streets, quay, hall and her rooms are one build seen at different scales.",
        subs={"gate": "The gate and the road outside", "streets": "The streets", "quay": "The quay",
              "hall": "The hall", "room": "Rukmini's new room", "courtyard": "A courtyard",
              "terrace": "A terrace by the sea"}),
    "dvaraka_shore": dict(name="The shore at Dvārakā", form="shore", ext=True,
        why="An earthly coast in the Dvāpara Yuga, before the city rises and after it. A different place and a different water from the Ocean of Milk.",
        subs={"beach": "The shore", "sea": "The sea off Ānarta"}),
    "chedi_palace": dict(name="The palace of Chedi", form="room", ext=False,
        why="Śiśupāla's birth and his mother's plea; three scenes, one chamber.",
        subs={"chamber": "The birth chamber"}),
    "bard_fire": dict(name="The bard's fire", form="fire", ext=True,
        why="The frame of the telling; used once.",
        subs={"fire": "The fire"}),
}

# ------------------------------------------------------------- the characters
# kind: lead / role / creature / crowd.  A crowd is a simulation, not a rig.
CHARS = {
    "rukmini": ("Rukmini", "lead"), "krishna": ("Krishna", "lead"),
    "balarama": ("Balarama", "role"), "rukmi": ("Rukmī", "role"),
    "bhishmaka": ("Bhīṣmaka", "role"), "shishupala": ("Śiśupāla", "role"),
    "jarasandha": ("Jarasandha", "role"), "kalayavana": ("Kālayavana", "role"),
    "mucukunda": ("Mucukunda", "role"), "brahmin": ("The Brahmin", "role"),
    "daruka": ("Dāruka", "role"), "water_carrier": ("The water-carrier", "role"),
    "gate_guard": ("The gate guard", "role"), "potter": ("The potter", "role"),
    "goatherd": ("The goatherd", "role"), "herdsman": ("The herdsman", "role"),
    "ferryman": ("The ferryman", "role"), "farmer": ("The farmer", "role"),
    "old_woman": ("The old woman", "role"), "soldier": ("The soldier from the north", "role"),
    "merchant": ("The merchant", "role"), "priest": ("The priest", "role"),
    "rukmini_mother": ("Rukmini's mother", "role"), "maid": ("Rukmini's maid", "role"),
    "bard": ("The bard", "role"), "flower_vendor": ("The flower vendor", "role"),
    "weaver": ("The weaver", "role"), "asti": ("Asti", "role"), "prapti": ("Prāpti", "role"),
    "ugrasena": ("Ugrasena", "role"), "shurasena": ("Śūrasena", "role"),
    "narada": ("Nārada", "role"), "damaghosha": ("Damaghoṣa", "role"),
    "shishupala_mother": ("Śiśupāla's mother", "role"),
    "infant_shishupala": ("The infant Śiśupāla", "role"),
    "indra": ("Indra", "role"), "durvasa": ("Durvāsā", "role"), "brahma": ("Brahmā", "role"),
    "shiva": ("Śiva", "role"), "parvati": ("Pārvatī", "role"), "lakshmi": ("Lakṣmī", "role"),
    "bali": ("Bali", "role"), "varuni": ("Vāruṇī", "role"), "dhanvantari": ("Dhanvantari", "role"),
    "mohini": ("Mohinī", "role"), "rahu": ("Rāhu", "role"), "surya": ("Sūrya", "role"),
    "candra": ("Candra", "role"), "kubera": ("Kubera", "role"), "varuna": ("Varuṇa", "role"),
    "jaya": ("Jaya", "role"), "vijaya": ("Vijaya", "role"), "fisher_child": ("The fisher child", "role"),
    "airavata": ("Airāvata, the elephant", "creature"), "vasuki": ("Vāsuki, the serpent", "creature"),
    "kurma": ("Kūrma, the tortoise", "creature"), "earth_cow": ("The Earth, as a cow", "creature"),
    "c_devas": ("The Devas", "crowd"), "c_asuras": ("The Asuras", "crowd"),
    "c_kings": ("The coalition of kings", "crowd"), "c_kumaras": ("The four Kumāras", "crowd"),
    "c_magadha_army": ("Jarasandha's army", "crowd"), "c_yavana_army": ("Kālayavana's army", "crowd"),
    "c_yadava_army": ("The Yadava army", "crowd"), "c_rukmi_division": ("Rukmī's division", "crowd"),
    "c_armies": ("Armies of the arrogant kings", "crowd"),
    "c_yadava_people": ("The people of Mathurā, later of Dvārakā", "crowd"),
    "c_women_mathura": ("The women on the wall", "crowd"),
    "c_kundina_people": ("The people of Kuṇḍina", "crowd"),
    "c_court": ("Bhīṣmaka's court and its visitors", "crowd"),
    "c_procession": ("The wedding procession", "crowd"),
    "c_guards": ("The ring of soldiers", "crowd"),
    "c_brahmana_women": ("The brāhmaṇa women", "crowd"),
    "c_fishers": ("The fisher family", "crowd"), "c_sailors": ("The sailors", "crowd"),
    "c_listeners": ("The bard's listeners", "crowd"),
}

# extra words a shot description uses for someone, beyond their name
ALIAS = {
    "gate_guard": ["guard", "guard's"], "water_carrier": ["water-carrier", "water carrier"],
    "brahmin": ["brahmin", "brahmana", "messenger"], "rukmi": ["rukmi", "her brother", "brother"],
    "bhishmaka": ["bhishmaka", "her father", "the king"], "rukmini_mother": ["her mother", "mother"],
    "maid": ["maid", "maidservant"], "earth_cow": ["cow"], "airavata": ["elephant", "airavata"],
    "vasuki": ["serpent", "vasuki"], "kurma": ["tortoise", "kurma"], "fisher_child": ["child"],
    "c_kings": ["kings", "ring of kings", "claimants"], "c_devas": ["devas", "gods"],
    "c_asuras": ["asuras"], "c_guards": ["soldiers", "guards"], "c_procession": ["procession", "musicians"],
    "c_kundina_people": ["citizens", "crowd", "people"], "c_yadava_people": ["people", "citizens", "crowd"],
    "c_women_mathura": ["women"], "c_magadha_army": ["army", "enemy", "tents"],
    "c_yavana_army": ["army", "barbarian", "banners"], "c_yadava_army": ["yadava", "commanders", "rear-guard"],
    "c_sailors": ["sailors", "sailor"], "c_fishers": ["fisher family", "family"],
    "c_court": ["visitors", "visitor", "court"], "c_listeners": ["listeners", "listener"],
    "c_armies": ["army", "armies", "soldiers"], "c_brahmana_women": ["women"],
    "shishupala": ["shishupala", "sisupala", "bridegroom", "groom"],
    "infant_shishupala": ["infant", "child", "baby"], "shishupala_mother": ["mother"],
    "soldier": ["soldier"], "old_woman": ["old woman"],
}
# while he is withheld the shot lists never name him; this is how they point at him
OBLIQUE = ["figure", "a man", "man's", "the man", "silhouette", "shadow", "his hands", "a hand", "the hand"]
PROP_ALIAS = {
    "lotus_garland": ["lotus garland", "garland"], "garland_durvasa": ["garland"],
    "garland_lakshmi": ["garland"], "wedding_garland": ["garland"], "mandara": ["mountain", "mandara"],
    "amrita_pot": ["pot", "nectar", "amrita"], "sudarshana": ["disc"], "treasures": ["treasures", "jewel"],
    "sky_chariots": ["chariots", "chariot"], "chariot": ["chariot"], "plough": ["plough"],
    "conch": ["conch"], "chalk_marks": ["chalk", "mark", "marks"], "water_jar": ["jar"],
    "letter": ["letter"], "painted_cloth": ["painted cloth", "cloth", "sketch"],
    "potter_wheel": ["wheel"], "lamp_kundina": ["lamp"], "lamp_dvaraka": ["second lamp", "lamp"],
    "empty_place": ["empty place", "place laid", "empty seat"], "sword_rukmi": ["sword", "blade"],
    "bows_rukmi": ["bow", "bows"], "razor_cloth": ["razor", "cloth"], "wedding_dress": ["dress", "ornaments"],
    "plough_farm": ["plough"], "net": ["net"],
}

# ------------------------------------------------------------------ the props
# only objects the story hangs something on; a prop here is tracked shot to shot
PROPS = {
    "garland_durvasa": "Durvāsā's garland, trampled",
    "garland_lakshmi": "Lakṣmī's garland of choosing",
    "lotus_garland": "His lotus garland — the mark he is known by",
    "wedding_garland": "The garland lifted toward her window",
    "mandara": "Mount Mandara, the churning rod",
    "amrita_pot": "The pot of amṛta",
    "sudarshana": "The Sudarśana disc",
    "treasures": "The treasures of the churning",
    "sky_chariots": "The two radiant chariots",
    "chariot": "His chariot",
    "plough": "Balarama's plough",
    "conch": "The conch",
    "chalk_marks": "The chalk marks on the wall of Mathurā",
    "water_jar": "A water jar",
    "letter": "Her letter",
    "painted_cloth": "The painted cloth of the city in the sea",
    "potter_wheel": "The potter's wheel",
    "lamp_kundina": "Her lamp from Kuṇḍina",
    "lamp_dvaraka": "The second lamp, already lit",
    "empty_place": "The place laid for a brother who will not come",
    "sword_rukmi": "Rukmī's sword",
    "bows_rukmi": "Rukmī's bows, broken one by one",
    "razor_cloth": "The cloth that binds him and the razor",
    "wedding_dress": "The wedding dress and ornaments",
    "plough_farm": "The farmer's plough",
    "net": "The fisher family's net",
}

# ------------------------------------------------------- scene by scene, by hand
# src | set/sub | other sets seen | cast | props
ROWS = """
E01-01|celestial/indra_court||indra,durvasa,airavata,c_devas|garland_durvasa
E01-02|celestial/indra_court|celestial/battlefield|indra,c_devas,c_asuras|
E01-03|celestial/brahma_realm|milk_ocean/shore|indra,brahma,c_devas|
E01-04|celestial/asura_camp||indra,bali,c_devas,c_asuras|
E01-05|milk_ocean/shore|milk_ocean/water|c_devas,c_asuras,kurma|mandara
E01-06|milk_ocean/water||c_devas,c_asuras,vasuki|mandara
E01-07|milk_ocean/water|milk_ocean/shore|brahma,c_devas,c_asuras,fisher_child,c_fishers|mandara
E01-08|milk_ocean/shore||shiva,parvati,fisher_child,c_devas,c_asuras|
E01-09|milk_ocean/water||krishna,airavata,c_devas,c_asuras|treasures
E01-10|milk_ocean/shore||lakshmi,krishna,c_devas,c_asuras|garland_lakshmi
E01-11|milk_ocean/shore||bali,varuni,c_asuras|
E01-12|milk_ocean/shore||dhanvantari,c_asuras|amrita_pot
E01-13|milk_ocean/shore||mohini,c_asuras,c_devas|amrita_pot
E01-14|milk_ocean/shore||rahu,surya,candra,mohini,c_devas|amrita_pot,sudarshana
E01-15|celestial/battlefield||indra,bali,c_devas,c_asuras|
E01-16|forest/glade||shiva,mohini|
E01-17|milk_ocean/shore||fisher_child,c_fishers|net
E01-18|kundina_temple/painted_wall||rukmini,priest|
E01-19|kundina_palace/hall||rukmini,bard,c_kings|
E02-01|open_country/fields||earth_cow,c_armies|
E02-02|celestial/brahma_realm||earth_cow,brahma|
E02-03|milk_ocean/shore||brahma,shiva,earth_cow,c_devas|
E02-04|milk_ocean/shore||brahma,c_devas|
E02-05|milk_ocean/shore||brahma,c_devas|
E02-06|celestial/brahma_realm|mathura/city|brahma,shurasena|
E02-07|kundina_outskirts/field||farmer,earth_cow,c_armies|plough_farm
E02-08|kundina_city/street||rukmini,old_woman,earth_cow,c_armies|
E02-09|kundina_palace/hall||rukmini,c_court|
E03-01|magadha_palace/hall||jarasandha,asti,prapti|
E03-02|mathura/walls|mathura/plain|water_carrier,c_magadha_army|chalk_marks
E03-03|mathura/council||krishna~,balarama|
E03-04|mathura/gate|mathura/plain|krishna,balarama,c_women_mathura,c_yadava_army,c_magadha_army|sky_chariots,conch
E03-05|mathura/plain||jarasandha,balarama,c_magadha_army|sky_chariots
E03-06|mathura/walls|mathura/plain|balarama,c_women_mathura,c_magadha_army|sky_chariots,plough
E03-07|mathura/plain||balarama,jarasandha|
E03-08|open_country/long_road||jarasandha,c_kings|
E03-09|mathura/walls||water_carrier,c_magadha_army|chalk_marks
E03-10|mathura/city||krishna,ugrasena,c_yadava_people|
E03-11|open_country/long_road||krishna,balarama,jarasandha,c_magadha_army,c_yadava_people|
E03-12|pravarshana/slope||krishna,balarama,jarasandha,c_magadha_army|
E03-13|pravarshana/peak|war_camp/magadha|jarasandha,c_magadha_army|
E03-14|kundina_palace/hall||rukmini,rukmi,bhishmaka,c_court|
E03-15|kundina_city/market||rukmini,soldier,merchant|
E04-01|mathura/walls|mathura/plain|water_carrier,c_yavana_army|chalk_marks
E04-02|mathura/council||krishna~,balarama|
E04-03|dvaraka_shore/beach||krishna,balarama|
E04-04|dvaraka_shore/sea||c_sailors|
E04-05|dvaraka_city/quay|dvaraka_city/hall|indra,varuna,kubera,c_yadava_people|treasures
E04-06|dvaraka_city/streets|mathura/city|potter,c_yadava_people|
E04-07|dvaraka_city/gate||krishna,gate_guard|lotus_garland
E04-08|dvaraka_city/quay||potter|potter_wheel
E04-09|kundina_outskirts/river_crossing||rukmini,ferryman,c_sailors|
E04-10|kundina_palace/rukmini_quarters||rukmini|painted_cloth
E05-01|war_camp/yavana||kalayavana,narada,c_yavana_army|
E05-02|mathura/plain||krishna,kalayavana,c_yavana_army|lotus_garland
E05-03|open_country/long_road||krishna,kalayavana|lotus_garland
E05-04|cave_mountain/cave||krishna,kalayavana,mucukunda|
E05-05|cave_mountain/cave||kalayavana,mucukunda|
E05-06|cave_mountain/cave|celestial/battlefield|mucukunda,c_devas,c_asuras|
E05-07|cave_mountain/cave||mucukunda,krishna|
E05-08|cave_mountain/cave||mucukunda,krishna~|
E05-09|cave_mountain/cave||mucukunda,krishna~|
E05-10|cave_mountain/cave||mucukunda,krishna~|
E05-11|cave_mountain/road||mucukunda|
E05-12|mathura/walls|mathura/plain|water_carrier,c_yavana_army|chalk_marks
E05-13|cave_mountain/road||goatherd,mucukunda|
E05-14|kundina_outskirts/well||rukmini,herdsman|water_jar
E05-15|kundina_temple/interior||rukmini,rukmini_mother,priest|
E05-16|kundina_palace/hall||rukmini,maid,c_court|
E06-01|bard_fire/fire||bard,c_listeners|
E06-02|kundina_palace/hall||rukmini,c_court|
E06-03|kundina_palace/hall||rukmini,rukmi,bhishmaka|
E06-04|kundina_palace/rukmini_quarters||rukmini,brahmin|letter
E06-05|open_country/long_road||brahmin|letter
E06-06|dvaraka_city/hall||brahmin,krishna|letter
E06-07|open_country/long_road||brahmin,daruka,krishna|chariot
E06-08|kundina_palace/rukmini_quarters||rukmini,bhishmaka,maid|wedding_dress
E06-09|kundina_palace/hall|kundina_city/street|rukmini,damaghosha,jarasandha,shishupala,c_kings|
E06-10|open_country/long_road||balarama,c_yadava_army|
E06-11|kundina_palace/rukmini_quarters||rukmini|
E06-12|kundina_palace/rukmini_quarters||rukmini,brahmin|
E06-13|kundina_palace/gate||rukmini,brahmin,bhishmaka,balarama,krishna~,c_kings|
E06-14|kundina_city/street||rukmini,c_kundina_people|wedding_garland
E06-15|kundina_temple/approach||rukmini,rukmini_mother,c_procession,c_guards|
E06-16|kundina_temple/interior||rukmini,c_brahmana_women|
E06-17|kundina_temple/forecourt||rukmini,maid,c_kings|
E06-18|kundina_temple/forecourt||rukmini,krishna,c_kings|chariot
E06-19|kundina_temple/forecourt||rukmini,krishna,c_kings|chariot
E06-20|kundina_temple/forecourt|open_country/chase_road|rukmini,krishna,balarama,c_kings|chariot,conch
E06-21|kundina_temple/forecourt||shishupala,jarasandha,c_kings|
E06-22|open_country/chase_road||rukmini,krishna~,c_kings,c_yadava_army|chariot
E06-23|open_country/roadside||jarasandha,shishupala,c_kings|
E06-24|open_country/roadside||rukmi,c_kings,c_rukmi_division|
E06-25|open_country/duel_plain||rukmini,krishna,rukmi|chariot,bows_rukmi,sword_rukmi
E06-26|open_country/duel_plain||rukmini,krishna,rukmi|sword_rukmi
E06-27|open_country/duel_plain||rukmini,krishna,rukmi|razor_cloth
E06-28|open_country/duel_plain||rukmini,krishna~,balarama,rukmi|razor_cloth
E06-29|open_country/duel_plain||rukmini,balarama|
E06-30|open_country/river_plain||rukmi|
E06-31|kundina_city/street|kundina_outskirts/river_crossing|flower_vendor,weaver,ferryman|
E07-01|open_country/long_road||rukmini,krishna~|chariot
E07-02|dvaraka_shore/beach||rukmini,krishna~|chariot
E07-03|dvaraka_city/streets||rukmini,water_carrier,potter,goatherd,farmer,flower_vendor,c_fishers,earth_cow,c_yadava_people|
E07-04|dvaraka_city/room||rukmini,krishna|lamp_kundina,lamp_dvaraka
E07-05|dvaraka_city/hall||rukmini,c_yadava_people|empty_place
E07-06|dvaraka_city/courtyard||rukmini,bard,c_kings|
E07-07|dvaraka_city/terrace||rukmini,krishna|
E07-08|dvaraka_shore/beach||rukmini,krishna|
E08-01|chedi_palace/chamber||shishupala_mother,infant_shishupala|
E08-02|chedi_palace/chamber||shishupala_mother,infant_shishupala,krishna|
E08-03|chedi_palace/chamber||shishupala_mother,krishna~|
E08-04|celestial/vaikuntha||jaya,vijaya,c_kumaras|
E08-05|kundina_temple/forecourt||shishupala|
E08-06|open_country/duel_plain|dvaraka_city/hall|balarama,krishna~,rukmi|
E08-07|kundina_palace/hall|open_country/chase_road|rukmi|
"""

# ------------------------------------------- what a person still has to settle
DECISIONS = [
    dict(id="shore", title="Is the shore of the Ocean of Milk the same build as the shore at Dvārakā?",
         strings=["The shore", "The shore of the Ocean of Milk", "The shore and the Ocean of Milk",
                  "The shore; the assembled claimants", "The shore; the assembly", "The shore at Dvārakā",
                  "The shore at Ānarta"],
         found="“The shore” on its own is always the Ocean of Milk — all four uses are in events 1 and 2 — so those merge without argument. The open question is the earthly shore.",
         recommend="Two sets, one ocean. Keep `milk_ocean` and `dvaraka_shore` as separate builds that share one water simulation and one shoreline kit. The film rhymes them on purpose (the Earth is brought to “the same Ocean of Milk”), and a shared kit makes the rhyme visible without making the mythic shore and her shore the same place.",
         alternative="One set, redressed. Cheaper by one environment, but the last shot of the film would stand on the first act's ground.",
         applied="two sets",
         settled="Two different places, and not for sharing. The Ocean of Milk belongs to the Kṣīra-sāgara-mathanam — the Churning — and the shore at Dvārakā is an earthly coast in the Dvāpara Yuga. They are separate builds with separate water: the mythic ocean is milk, the other is the sea. Nothing is shared between them."),
    dict(id="palace", title="How many palaces is “the palace”?",
         strings=["Bhīṣmaka’s palace", "The palace", "Palace hall", "Palace; women’s quarters",
                  "Rukmini’s quarters", "Rukmini’s room at night", "The palace gate", "The forecourt",
                  "The forecourt of the temple", "Kuṇḍina’s hall; evening", "Kuṇḍina’s hall and streets"],
         found="The strings split three ways. Hall, quarters and gate are rooms of Bhīṣmaka's house. “The forecourt” is never the palace — every use is the temple's forecourt, in the abduction. And “The palace” ×2 is not Kuṇḍina at all: both are event 8, straight after “The palace of Chedi”.",
         recommend="One Kuṇḍina palace with three sub-locations (hall, her quarters, gate); the forecourt belongs to the temple set; “The palace” ×2 goes to Chedi.",
         alternative="Build her quarters as a separate small set if the palace hall is too heavy to light for intimate scenes — a production call, not a story one.",
         applied="one palace, forecourt to the temple, two scenes to Chedi"),
    dict(id="mountain", title="Is the cave on the mountain road, and is Pravarṣaṇa the same mountain?",
         strings=["A mountain cave", "The cave", "Heaven’s war; the cave", "The mountain road",
                  "Mount Pravarṣaṇa", "The burning peak; Jarasandha’s camp", "Across the land to the mountains"],
         found="The story joins the cave to the mountain road twice: Mucukunda walks out of one onto the other, and the goatherd sees the cave's smoke from it. Pravarṣaṇa is a different mountain, reached later, and the only one set on fire.",
         recommend="Two sets: `cave_mountain` (cave interior plus its road) and `pravarshana`, both grown from one terrain kit.",
         alternative="One mountain. Saves a build but the audience would see him flee to the place the hunter already died.",
         applied="two sets"),
    dict(id="shishupala_gone", title="Where does Śiśupāla find the bride gone (E08-05)?",
         strings=["Kuṇḍina"],
         found="The scene only says Kuṇḍina. It is the same moment as E06-21, which is the temple forecourt.",
         recommend="The temple forecourt, so the backstory beat can be shot inside the abduction's coverage.",
         alternative="His rooms in the palace, alone — a different scene emotionally.",
         applied="temple forecourt"),
]

# Krishna is withheld for most of the film. `k` in the story data says how much
# of him the audience is given; the pipeline carries that down to the camera.
def presence(k):
    k = k.lower()
    if k.startswith("face") or ", face" in k:
        return "face"
    if k.startswith("hands"):
        return "hands"
    if k.startswith("shadow"):
        return "shadow"
    if k.startswith("reflection"):
        return "offscreen"
    if k.startswith("effect"):
        return "effect"
    return "absent"


def write_decisions_doc():
    still = [d for d in DECISIONS if not d.get("settled")]
    done = [d for d in DECISIONS if d.get("settled")]
    n = {1: "One decision", 2: "Two decisions", 3: "Three decisions", 4: "Four decisions"}.get(len(still), f"{len(still)} decisions")
    out = [f"# {n} about sets that {'is' if len(still) == 1 else 'are'} yours to make", "",
           "The entity layer (`data/entities.json`) turns 89 place strings into 17 sets. Most of that was",
           "reading; these were judgement. Each has a working answer so that every scene resolves to a set",
           "today — but the answer is a recommendation, and changing it is one row in",
           "`scripts/make-entities.py` and a re-run.", ""]
    for i, x in enumerate(still, 1):
        out += [f"## {i} · {x['title']}", "", "The strings: " + " · ".join(f"`{s}`" for s in x["strings"]), "",
                "**What the data shows.** " + x["found"], "", "**Recommended.** " + x["recommend"], "",
                "**The alternative.** " + x["alternative"], "", "**Applied for now:** " + x["applied"] + ".", ""]
    if done:
        out += ["---", "", "# Settled", ""]
        for x in done:
            out += [f"## {x['title']}", "", "The strings: " + " · ".join(f"`{s}`" for s in x["strings"]), "",
                    "**Settled.** " + x["settled"], "", "**In the data:** " + x["applied"] + ".", ""]
    out += ["---", "", "To change one: edit the scene rows in `scripts/make-entities.py`, then",
            "`npm run data:entities` — it regenerates the data and this page, and audits both.", ""]
    (ROOT / "docs" / "ENTITY_DECISIONS.md").write_text("\n".join(out), encoding="utf8")


def main():
    scenes = json.loads((ROOT / "data" / "scenes.json").read_text(encoding="utf8"))
    by_src = {s["src"]: s for s in scenes}
    out, errs = {}, []
    for line in ROWS.strip().splitlines():
        src, place, also, cast, props = [x.strip() for x in line.split("|")]
        if src not in by_src:
            errs.append(f"{src}: not a scene")
            continue
        s = by_src[src]
        st, sub = place.split("/")
        if st not in SETS or sub not in SETS[st]["subs"]:
            errs.append(f"{src}: unknown set {place}")
        cast = [c for c in cast.split(",") if c]
        # a trailing ~ means: in the scene, never in frame — a voice, an eyeline
        off = [c[:-1] for c in cast if c.endswith("~")]
        cast = [c.rstrip("~") for c in cast]
        props = [p for p in props.split(",") if p]
        for c in cast:
            if c not in CHARS:
                errs.append(f"{src}: unknown character {c}")
        for p in props:
            if p not in PROPS:
                errs.append(f"{src}: unknown prop {p}")
        pres = presence(s["k"])
        if "krishna" in off:
            if pres in ("face", "hands", "shadow"):
                errs.append(f"{src}: Krishna is marked off-frame but the scene says “{s['k']}”")
            pres = "offscreen"
        elif "krishna" in cast and pres in ("absent", "effect"):
            errs.append(f"{src}: Krishna is in frame but the scene says “{s['k']}”")
        # Mohinī is his form; a scene that gives his hands through her is consistent
        if "krishna" not in cast and "mohini" not in cast and pres in ("face", "hands", "shadow", "offscreen"):
            errs.append(f"{src}: the scene says “{s['k']}” but Krishna is not in the cast")
        e = dict(set=st, sub=sub, cast=cast)
        if off:
            e["off"] = off               # in the scene, never in frame
        if also:
            e["also"] = [a for a in also.split(",") if a]
            for a in e["also"]:
                a_set, a_sub = a.split("/")
                if a_set not in SETS or a_sub not in SETS[a_set]["subs"]:
                    errs.append(f"{src}: unknown set {a}")
        if props:
            e["props"] = props
        if "krishna" in cast:
            e["krishna"] = pres          # face / hands / shadow / offscreen
        e["place"] = s["pl"]             # the prose it was read from, kept for the trail
        out[s["c"]] = e
    missing = [s["src"] for s in scenes if s["c"] not in out]
    if missing:
        errs.append("no row for: " + ", ".join(missing))
    if errs:
        raise SystemExit("\n".join(errs))

    import unicodedata

    def plain(x):
        return "".join(c for c in unicodedata.normalize("NFD", x.lower())
                       if not unicodedata.combining(c))

    def aliases(cid, name):
        base = plain(name).split(",")[0]
        base = re.sub(r"^the ", "", base).strip()
        got = [base] + [plain(a) for a in ALIAS.get(cid, [])]
        return sorted(set(a for a in got if a), key=lambda a: (-len(a), a))

    ents = dict(
        sets={k: dict(name=v["name"], form=v["form"], ext=v["ext"], why=v["why"],
                      subs=v["subs"]) for k, v in SETS.items()},
        characters={k: dict(name=n, kind=kind, alias=aliases(k, n)) for k, (n, kind) in CHARS.items()},
        props={k: dict(name=n, alias=sorted(PROP_ALIAS.get(k, []), key=lambda a: -len(a)))
               for k, n in PROPS.items()},
        oblique=OBLIQUE,
    )
    dump = lambda p, d: (ROOT / "data" / p).write_text(
        json.dumps(d, ensure_ascii=False, indent=1) + "\n", encoding="utf8")
    dump("entities.json", ents)
    dump("scene_entities.json", out)
    dump("entity_decisions.json", DECISIONS)
    write_decisions_doc()
    used_sets = {e["set"] for e in out.values()}
    used_subs = {e["set"] + "/" + e["sub"] for e in out.values()}
    print(f"{len(out)} scenes → {len(used_sets)} sets, {len(used_subs)} sub-locations, "
          f"{len(CHARS)} characters ({sum(1 for _, k in CHARS.values() if k == 'crowd')} crowds), "
          f"{len(PROPS)} props, {len(DECISIONS)} decisions open")


if __name__ == "__main__":
    main()
