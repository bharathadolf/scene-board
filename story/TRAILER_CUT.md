# The trailer — *The Unseen Sun*

A 2:18 trailer in four movements, cut from the board and built to be made: 65 shots, 19 cut units, every shot carrying its set, its cast, its camera and its length. Krishna's face arrives at 1:55, and not one frame before it.

Generated from `story/trailer/trailer_data.py`. Change a length or a lens there and run `python3 story/trailer/build_trailer.py`; this document, the board data, the shotspec, the EDL and the CSV are all written from it.

## Technical specification

| | |
| --- | --- |
| Aspect and resolution | 2.39:1 scope, 4096 × 1716 (DCI 4K). The board previews at 1680 × 720. |
| Frame rate | 24 fps, whole-frame cuts throughout |
| Colour | ACEScg working space, ACES 1.3; deliver Rec.709 for online, DCI-P3 for theatrical |
| Render | Cycles, multi-layer OpenEXR, 16-bit half, linear |
| Passes | beauty, depth (Z), cryptomatte (object + material), position, normal, motion vector, diffuse/specular/emission split |
| Audio | 24-bit / 48 kHz; 5.1 for theatrical, stereo fold-down for online |
| Total running time | 2:18 (3333 frames) including cards |

## The shape

| Movement | Runs | Length | What it does | Krishna |
| --- | --- | --- | --- | --- |
| **I · The oldest war** | 0:00 | 30.4s | Scale, and the rule the whole film runs on. | effect, hands |
| **II · The woman** | 0:30 | 28.2s | Who she is, what is being done to her, and what she does about it. | not present |
| **III · What the letter has to cross** | 0:58 | 40.1s | The world between her and the answer. | effect, hands, shadow |
| **IV · First sight** | 1:38 | 31.2s | The withheld thing arrives. | face |
| Cards | 2:09 | 9s | Title, the last line over black, logos | — |

The withholding is the trailer's engine as much as the film's. Through the first three movements he is a pair of hands, a silhouette in smoke, a man seen from behind, an effect on other people's faces. The audience is told about him for two minutes by people who are afraid of him, in love with him or chasing him, and then they see him at the same moment she does.

## The cut

### Movement I · The oldest war

Scale, and the rule the whole film runs on.

**T-01 · The rope** — from E01-06 · The Ocean of Milk · Vīra

| # | Shot id | In | Sec | Type | Camera | On screen |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `T-01_waoex` | 00:00:00:00 | 4 | AERIAL | 24mm · 90m · top · slow drift | The Ocean of Milk from above: the mountain turning in white water, and two lines of figures running out to either horizon on one serpent.<br>*Narration:* “They were made to pull the same rope, and not one of them could see what was holding the mountain up.” |
| 2 | `T-01_2rj4c` | 00:00:04:00 | 1.8 | INSERT | 100mm · 1m · eye · locked | Blistered hands close on the serpent's body, knuckles white, the skin of the palm split. |
| 3 | `T-01_cu9p2` | 00:00:05:19 | 1.6 | MCU | 70mm · 1.5m · eye · locked | An Asura's face at the serpent's head, teeth set, smoke coughing past him. |
| 4 | `T-01_tif2l` | 00:00:07:09 | 2.2 | WIDE | 28mm · 1.2m · low · locked | From the waterline the mountain spins, and nothing that can be seen is holding it up. |

**T-02 · The poison** — from E01-07 · The Ocean of Milk · Bhayānaka

| # | Shot id | In | Sec | Type | Camera | On screen |
| --- | --- | --- | --- | --- | --- | --- |
| 5 | `T-02_347qc` | 00:00:09:14 | 2.4 | WIDE | 24mm · 14m · high · tracking | A black stain crosses the milk-white water faster than a man can run; fish turn white and float up behind it.<br>*Narration:* “The first thing the ocean gave them was not the prize.” |
| 6 | `T-02_k6bzl` | 00:00:12:00 | 1.6 | WIDE | 35mm · 1.6m · eye · pan | Both armies drop the rope and run along the shore, gods and demons mixed together in the same direction. |
| 7 | `T-02_vb8e2` | 00:00:13:14 | 2 | MS | 50mm · 1.1m · eye · locked | At the edge of the water a fisher child stays where she is, one hand held out toward the dark. |
| 8 | `T-02_pg2sr` | 00:00:15:14 | 1.4 | ECU | 100mm · 0.3m · low · locked | The black water reaches her feet and goes round them, and does not touch her. |

**T-03 · The choosing** — from E01-10 · The shore; the assembled claimants · Śṛṅgāra

| # | Shot id | In | Sec | Type | Camera | On screen |
| --- | --- | --- | --- | --- | --- | --- |
| 9 | `T-03_aaoxs` | 00:00:17:00 | 2.2 | WIDE | 35mm · 2.4m · high · locked | The line of claimants along the shore, every one of them arranged to be chosen, every one of them leaning in. |
| 10 | `T-03_tr48n` | 00:00:19:05 | 3 | TRACKING | 50mm · 1.6m · eye · tracking | Lakṣmī walks the line with the garland. The camera travels with her, past face after face, and she passes each one.<br>*Narration:* “Everything in it was taken. One thing was given.” |
| 11 | `T-03_3jm9l` | 00:00:22:05 | 1.6 | INSERT | 85mm · 1.5m · eye · locked | The garland lifts toward a pair of hands that never came forward — and the cut comes before the face. |

**T-04 · The wall** — from E01-18 · Ambikā's temple at Kuṇḍina · Adbhuta

| # | Shot id | In | Sec | Type | Camera | On screen |
| --- | --- | --- | --- | --- | --- | --- |
| 12 | `T-04_tpqxe` | 00:00:23:19 | 2.4 | WIDE | 28mm · 1.6m · eye · push in | A painted wall in the temple of Ambikā: a mountain, a serpent, a dark flood, a hand at a god's throat, and a goddess walking a line of suitors. A priest sweeps at the far end. |
| 13 | `T-04_th0fq` | 00:00:26:05 | 2 | CLOSE | 85mm · 1.6m · eye · locked | Rukmini's face, lit by nothing but the light off the painted wall. The first time the film looks at her. |
| 14 | `T-04_5uosr` | 00:00:28:05 | 2.2 | INSERT | 100mm · 1.4m · eye · locked | Her finger touches the painted figure at the end of the line — the one the goddess stopped for. |

### Movement II · The woman

Who she is, what is being done to her, and what she does about it.

**T-05 · The hall decides** — from E06-03 · Palace hall · Karuṇa

| # | Shot id | In | Sec | Type | Camera | On screen |
| --- | --- | --- | --- | --- | --- | --- |
| 15 | `T-05_62jaz` | 00:00:30:10 | 2 | WIDE | 28mm · 1.6m · eye · locked | The hall, full. Rukmī announces the match in front of the whole household, pleased with himself. |
| 16 | `T-05_vy8fq` | 00:00:32:10 | 2.6 | CLOSE | 85mm · 1.6m · eye · locked | Rukmī, close, closing the sale.<br>**Rukmī:** “Chedi gives us a border. The cowherd would give us a cousin.” |
| 17 | `T-05_8qgo9` | 00:00:35:00 | 1.6 | CLOSE | 85mm · 1.5m · eye · locked | Bhīṣmaka looks down. He loves his son, and the whole room can see it. |
| 18 | `T-05_muxx5` | 00:00:36:14 | 2 | CLOSE | 85mm · 1.6m · eye · locked | Rukmini watches her father not look up. She does not cry. |
| 19 | `T-05_tvxlw` | 00:00:38:14 | 3.4 | MS | 50mm · 1.6m · eye · push in | She answers her brother without raising her voice, and the camera moves in on the last four words.<br>**Rukmini:** “You can give away a kingdom, brother. Not a woman who has already chosen.” |

**T-06 · Ink** — from E06-04 · Rukmini's quarters, night · Śṛṅgāra

| # | Shot id | In | Sec | Type | Camera | On screen |
| --- | --- | --- | --- | --- | --- | --- |
| 20 | `T-06_ogr8i` | 00:00:42:00 | 2 | MACRO | 100mm · 0.8m · high · locked | Ink. The nib goes in, comes out loaded, and makes the first stroke of a letter to a king. |
| 21 | `T-06_8mkvq` | 00:00:44:00 | 2.4 | MS | 50mm · 1.1m · eye · locked | Her room at night, one lamp, the city asleep outside. She is writing fast, which she was never taught to do. |
| 22 | `T-06_y6uzn` | 00:00:46:10 | 1.8 | INSERT | 85mm · 0.9m · high · locked | Her hand presses the seal into the wax, and holds it there a beat too long. |
| 23 | `T-06_gftng` | 00:00:48:05 | 4 | CLOSE | 85mm · 1.6m · eye · locked | Her face over the sealed letter. She says the line to nobody, and it is the thesis of the film.<br>**Rukmini:** “They will say a woman was stolen. Let them. I am the one holding the pen.” |
| 24 | `T-06_at71u` | 00:00:52:05 | 1.6 | INSERT | 70mm · 1.2m · eye · locked | The letter goes into the Brahmin's hands and disappears into his clothes. |

**T-07 · The ride** — from E06-05 · The road from Kuṇḍina to Dvārakā · Vīra

| # | Shot id | In | Sec | Type | Camera | On screen |
| --- | --- | --- | --- | --- | --- | --- |
| 25 | `T-07_mhwdq` | 00:00:53:19 | 2.6 | EWS | 18mm · 40m · top · slow drift | One man on an enormous road at first light, and the country he has to cross opening out past him in every direction. |
| 26 | `T-07_eif90` | 00:00:56:09 | 2.2 | TRACKING | 35mm · 0.6m · low · tracking | Feet, then water: he crosses a river with the letter held above his head, dry. |

### Movement III · What the letter has to cross

The world between her and the answer.

**T-08 · Twenty-three divisions** — from E03-02 · Mathurā's walls · Bhayānaka

| # | Shot id | In | Sec | Type | Camera | On screen |
| --- | --- | --- | --- | --- | --- | --- |
| 27 | `T-08_te23q` | 00:00:58:14 | 2.8 | EWS | 24mm · 30m · high · slow drift | From the wall: a line of dust becomes tents, becomes banners, becomes a country of fires out to the horizon. |
| 28 | `T-08_g72wo` | 00:01:01:09 | 1.8 | CLOSE | 85mm · 1.5m · eye · locked | The water-carrier stops counting, puts down his bucket, and makes one chalk mark on the wall because there is nothing else to do. |

**T-09 · The battle from the wall** — from E03-06 · The walls of Mathurā; the plain · Vīra

| # | Shot id | In | Sec | Type | Camera | On screen |
| --- | --- | --- | --- | --- | --- | --- |
| 29 | `T-09_tqkp6` | 00:01:03:04 | 2 | WIDE | 35mm · 12m · high · locked | From the wall the women watch two chariots go in, and the dust closes over them. |
| 30 | `T-09_iwz3c` | 00:01:05:04 | 1.6 | WIDE | 35mm · 1.4m · low · tracking | Inside the dust: the plough comes through and sweeps the footsoldiers aside like a field being cleared. |
| 31 | `T-09_lay73` | 00:01:06:18 | 1 | CLOSE | 85mm · 1.5m · eye · locked | On the wall, a woman faints and the ones beside her do not catch her. |

**T-10 · Seventeen** — from E03-09 · The wall of Mathurā, across seasons · Karuṇa

| # | Shot id | In | Sec | Type | Camera | On screen |
| --- | --- | --- | --- | --- | --- | --- |
| 32 | `T-10_62zy8` | 00:01:07:18 | 0.6 | INSERT | 100mm · 1.5m · eye · locked | A chalk stroke on the wall. |
| 33 | `T-10_t11hn` | 00:01:08:08 | 0.6 | WIDE | 35mm · 8m · high · locked | Night, torches coming at the wall. |
| 34 | `T-10_fwpet` | 00:01:08:22 | 0.5 | INSERT | 100mm · 1.5m · eye · locked | A second chalk stroke beside the first. |
| 35 | `T-10_t6l2u` | 00:01:09:10 | 0.6 | WIDE | 35mm · 8m · high · locked | A siege tower burning against the wall. |
| 36 | `T-10_3tbzn` | 00:01:10:00 | 0.5 | INSERT | 100mm · 1.5m · eye · locked | A third stroke. The wall is getting crowded. |
| 37 | `T-10_si0ra` | 00:01:10:12 | 2 | WIDE | 28mm · 1.6m · eye · pull back | The camera pulls back off seventeen strokes. The carrier steps back with it, and this time there is no army on the horizon to follow it.<br>*Jarasandha, V.O.:* “Tell Mathurā their king is ash. Tell them who swept it.” |

**T-11 · The burning hill** — from E03-12 · Mount Pravarṣaṇa · Bhayānaka

| # | Shot id | In | Sec | Type | Camera | On screen |
| --- | --- | --- | --- | --- | --- | --- |
| 38 | `T-11_cgc0q` | 00:01:12:12 | 2 | EWS | 24mm · 60m · high · slow drift | The whole hillside alight, fire running up through the trees toward two figures near the top. |
| 39 | `T-11_3aauk` | 00:01:14:12 | 2.2 | MS | 50mm · 1.6m · eye · locked | Balarama looks down the mountain they have run out of. Behind him a figure stands in the smoke with his back to the fire — a silhouette, and nothing more than that. |
| 40 | `T-11_9rcg8` | 00:01:16:17 | 1.8 | ACTION | 35mm · 20m · low · tracking | They jump. The camera follows one silhouette against the flames and stops before the ground. |

**T-12 · The man on foot** — from E05-02 · The road outside Mathurā · Vīra

| # | Shot id | In | Sec | Type | Camera | On screen |
| --- | --- | --- | --- | --- | --- | --- |
| 41 | `T-12_n1pj5` | 00:01:18:12 | 1.6 | WIDE | 35mm · 1.6m · eye · locked | Kālayavana gets off his horse in front of his army, takes off his sword and lets it fall in the dust. |
| 42 | `T-12_227t8` | 00:01:20:02 | 3 | CLOSE | 85mm · 1.7m · eye · locked | Kālayavana, close, looking at something walking toward him that he does not believe.<br>**Kālayavana:** “No chariot. No bow. No shoes. This is the one they call a god?” |
| 43 | `T-12_njg91` | 00:01:23:02 | 2.4 | TRACKING | 35mm · 1.2m · eye · tracking | The chase: a barefoot man always one step out of reach, shot from behind and below, and never once from the front. |

**T-13 · The city rises** — from E04-04 · The sea off Ānarta · Adbhuta

| # | Shot id | In | Sec | Type | Camera | On screen |
| --- | --- | --- | --- | --- | --- | --- |
| 44 | `T-13_sgipu` | 00:01:25:12 | 3.2 | EWS | 24mm · 18m · low · crane | The first gate breaks the surface of the sea. Then a wall, then towers, then terraces of crystal and gold, and the water parts and settles around them as if they had always been there. |
| 45 | `T-13_saf7b` | 00:01:28:17 | 1.2 | MS | 70mm · 1.5m · eye · locked | On the shore a sailor's hand goes to her mouth. |

**T-14 · The kings swear** — from E06-09 · Kuṇḍina's hall and streets · Bhayānaka

| # | Shot id | In | Sec | Type | Camera | On screen |
| --- | --- | --- | --- | --- | --- | --- |
| 46 | `T-14_sdfel` | 00:01:29:22 | 2 | WIDE | 35mm · 14m · high · slow drift | The kings arrive in a column that does not end: escort after escort, banner after banner, filling the streets of Kuṇḍina. |
| 47 | `T-14_u0pgf` | 00:01:31:22 | 1.8 | MS | 50mm · 1.6m · low · push in | In the hall they swear it together and then one by one: if he comes for her, we fight him. |
| 48 | `T-14_7q9c0` | 00:01:33:17 | 1.8 | CLOSE | 85mm · 1.6m · eye · locked | Rukmini at a window above them, counting banners. There are too many to count. |
| 49 | `T-14_zun0i` | 00:01:35:12 | 3.2 | MS | 50mm · 1.6m · eye · locked | On the road outside, Balarama arrives with an army behind him and says what he has come for.<br>**Balarama:** “You came for a bride. I came for the war that follows her.” |

### Movement IV · First sight

The withheld thing arrives.

**T-15 · The waiting** — from E06-11 · Rukmini's quarters · Bhayānaka

| # | Shot id | In | Sec | Type | Camera | On screen |
| --- | --- | --- | --- | --- | --- | --- |
| 50 | `T-15_icm2f` | 00:01:38:17 | 2.4 | MS | 50mm · 1.3m · eye · locked | Dressed for a wedding she did not agree to, alone in the room, waiting for a man who has not come. The lamp is lower than it was. |
| 51 | `T-15_mbl60` | 00:01:41:03 | 1.6 | ECU | 100mm · 1.2m · eye · locked | Her hand finds the fold of the dress where something is hidden, and presses it flat. |

**T-16 · The procession** — from E06-15 · The road from the palace to Ambikā's temple · Śṛṅgāra

| # | Shot id | In | Sec | Type | Camera | On screen |
| --- | --- | --- | --- | --- | --- | --- |
| 52 | `T-16_ieqeu` | 00:01:42:17 | 2.6 | CRANE | 28mm · 9m · high · crane | A ring of soldiers around one woman, moving down a road lined with people, toward a temple door at the end of it. |
| 53 | `T-16_ad92v` | 00:01:45:07 | 1.2 | CLOSE | 85mm · 1.7m · eye · locked | A soldier's eyes go along the roofline and the road, looking for a man nobody here has seen. |
| 54 | `T-16_9ihf4` | 00:01:46:12 | 1.4 | CLOSE | 85mm · 1.6m · eye · tracking | Rukmini looks straight ahead and at nothing, carried forward at somebody else's pace. |

**T-17 · Breaking her silence** — from E06-17 · The temple door and the forecourt · Vīra

| # | Shot id | In | Sec | Type | Camera | On screen |
| --- | --- | --- | --- | --- | --- | --- |
| 55 | `T-17_gnue7` | 00:01:47:22 | 1.8 | MS | 50mm · 1.6m · eye · locked | She comes out of the temple door with her friends behind her and stops on the threshold. |
| 56 | `T-17_gpr52` | 00:01:49:17 | 1.6 | CLOSE | 85mm · 1.6m · eye · locked | She breaks a vow of silence and says something, and the trailer does not let us hear it. |
| 57 | `T-17_3ce96` | 00:01:51:07 | 2.2 | TRACKING | 35mm · 1.5m · eye · tracking | She walks out among the kings who came for her, and goes past them as if they were furniture. One of them drops a cup. |

**T-18 · First sight** — from E06-18 · The forecourt of the temple · Śṛṅgāra, Adbhuta

| # | Shot id | In | Sec | Type | Camera | On screen |
| --- | --- | --- | --- | --- | --- | --- |
| 58 | `T-18_igml4` | 00:01:53:12 | 2 | CLOSE | 85mm · 1.6m · eye · locked | Her eyes are down on the stones. Then they lift. |
| 59 | `T-18_82ert` | 00:01:55:12 | 3 | POV | 50mm · 1.6m · eye · locked | What she sees: a chariot at the edge of the forecourt, and the man in it, in full, for the first time in the film. The blue light arrives with him. Nobody says his name. |
| 60 | `T-18_jifvo` | 00:01:58:12 | 2 | CLOSE | 85mm · 1.6m · eye · push in | Back to her, and what the sight has done to her face. |

**T-19 · The lift and out** — from E06-19 · The forecourt and the road · Vīra

| # | Shot id | In | Sec | Type | Camera | On screen |
| --- | --- | --- | --- | --- | --- | --- |
| 61 | `T-19_dq0gi` | 00:02:00:12 | 1.6 | ACTION | 35mm · 1.4m · low · tracking | He does not wait for her to climb. He takes her up in front of every king there and sets her beside him; her foot leaves the ground. |
| 62 | `T-19_c8zb2` | 00:02:02:02 | 1.8 | WIDE | 28mm · 1.2m · low · tracking | The chariot goes through the ring of kings the way a lion goes through jackals, and Balarama's men open the road in front of it. |
| 63 | `T-19_vq2i4` | 00:02:03:21 | 3.4 | MS | 50mm · 1.6m · low · tracking | From the moving chariot, he says the only thing he says in this trailer, to the kings he is leaving behind.<br>**Krishna:** “Kings — she walked out on her own feet. I am only the chariot.” |
| 64 | `T-19_10xv3` | 00:02:07:07 | 1.6 | ACTION | 35mm · 2m · high · pan | The kings draw their swords too late. Behind the chariot a hundred horses turn at once. |
| 65 | `T-19_kup2h` | 00:02:08:21 | 1 | INSERT | 100mm · 1.6m · eye · locked | The conch, sounded once — and the trailer cuts to black on it. |

**Cards**

| # | Id | In | Sec | What |
| --- | --- | --- | --- | --- |
| 66 | `T-20` | 00:02:09:21 | 3 | The Unseen Sun |
| 67 | `T-21` | 00:02:12:21 | 4 | Rukmini, over black<br>**Rukmini:** “Everyone came to take me. You are the only one who came when I called.” |
| 68 | `T-22` | 00:02:16:21 | 2 | Production logos and release date |

## Department sheet

What each shot needs from each application. A dash means the shot is Blender and comp only.

### Movement I

| Shot id | Set | In frame | Props | Houdini | Nuke | Sound |
| --- | --- | --- | --- | --- | --- | --- |
| `T-01_waoex` | milk_ocean/water | The Devas, The Asuras, Vāsuki, the serpent | Mount Mandara, the churning rod | Milk-ocean surface: viscous white FLIP, radial wake from the rod, foam ring. Hero sim. | Haze pass over distance; the horizon lines never resolve into individual faces. | A low bronze drone, one struck bell. No wind. |
| `T-01_2rj4c` | milk_ocean/water | The Devas, Vāsuki, the serpent | — | Serpent scale displacement, sweat and blood micro-detail. | Shallow depth; keep the far line soft. | Rope-creak of scale on scale; breath. |
| `T-01_cu9p2` | milk_ocean/water | The Asuras, Vāsuki, the serpent | — | Smoke puff from the serpent's mouth, interactive with the face. | Smoke element in front of frame; warm key from nothing visible. | A cough of smoke, deep. |
| `T-01_tif2l` | milk_ocean/water | Kūrma, the tortoise | Mount Mandara, the churning rod | Mountain rotation, water shear at the base, a shell-back barely readable under the surface. | Hold Kūrma at the edge of legibility — he must not read as a creature yet. | Stone grinding on something that does not sound like stone. |
| `T-02_347qc` | milk_ocean/water | — | — | Hālāhala spread: black dye advection across the FLIP surface, dead-fish scatter in the wake. | Crush the blacks in the stain only; the milk stays at 0.9 and does not clip. | Everything else drops out. A hiss, very wide. |
| `T-02_k6bzl` | milk_ocean/water | The Devas, The Asuras | — | Crowd run cycles, shared agent library; wet-sand footstrike. | Motion blur long, 270-degree shutter on this one cut. | Feet on wet shingle, no voices. |
| `T-02_vb8e2` | milk_ocean/water | The fisher child | — | Shoreline interaction at her feet; the black edge arriving. | Her key is the last warm light in the movement. | Water at ankle height. One breath held. |
| `T-02_pg2sr` | milk_ocean/water | The fisher child | — | Dye avoidance at the ankle — art-directed, not physical. | No stylisation; this must read as something the camera caught. | A single low sub drop. |
| `T-03_aaoxs` | milk_ocean/shore | The Devas, The Asuras | — | Crowd variation pass; no two postures repeat in the front rank. | Long lens compression on the line so it reads as endless. | Shingle, cloth, a crowd holding still badly. |
| `T-03_tr48n` | milk_ocean/shore | Lakṣmī, The Devas, The Asuras | Lakṣmī's garland of choosing | Cloth and garland sim on a walking hero asset. | Faces fall out of focus as she passes them. | Her anklets, nothing else. |
| `T-03_3jm9l` | milk_ocean/shore | Lakṣmī, Krishna | Lakṣmī's garland of choosing | Garland sim handover between two rigs. | Frame cuts at the wrist. This is a hard rule, not a preference. | Flowers. A bell, struck once, far away. |
| `T-04_tpqxe` | kundina_temple/painted_wall | The priest | — | — | The mural is a matte painting projected on geometry; it must survive a 2.4s push. | A broom. Temple quiet, with depth behind it. |
| `T-04_th0fq` | kundina_temple/painted_wall | Rukmini | — | — | Bounce from the mural is the key. Warm, low, from frame left. | Her breath. The broom stops. |
| `T-04_5uosr` | kundina_temple/painted_wall | Rukmini | — | — | Paint texture at macro scale; a flake lifts and does not fall. | Fingertip on dry plaster. |

### Movement II

| Shot id | Set | In frame | Props | Houdini | Nuke | Sound |
| --- | --- | --- | --- | --- | --- | --- |
| `T-05_62jaz` | kundina_palace/hall | Rukmī, Bhīṣmaka, Bhīṣmaka's court and its visitors | — | — | Practical lamps; long falloff into the colonnade. | A room going quiet in stages. |
| `T-05_vy8fq` | kundina_palace/hall | Rukmī | — | — | — | Clean dialogue, no room tone under it. |
| `T-05_8qgo9` | kundina_palace/hall | Bhīṣmaka | — | — | — | Silence held one beat past comfortable. |
| `T-05_muxx5` | kundina_palace/hall | Rukmini | — | — | — | — |
| `T-05_tvxlw` | kundina_palace/hall | Rukmini, Rukmī | — | — | — | The push is silent; music has not started yet. |
| `T-06_ogr8i` | kundina_palace/rukmini_quarters | Rukmini | Her letter | Ink wet-surface shader, meniscus on the nib. | Macro depth; the stroke is the only thing in focus in the trailer for 2 seconds. | The nib. Bass flute enters here and runs to the end of the movement. |
| `T-06_8mkvq` | kundina_palace/rukmini_quarters | Rukmini | Her lamp from Kuṇḍina | Lamp flicker driving the key. | Single-source lamp; practical-driven grade. | Night outside; a dog, far off. |
| `T-06_y6uzn` | kundina_palace/rukmini_quarters | Rukmini | — | Wax deformation and cooling. | — | Wax, and the small sound of a decision. |
| `T-06_gftng` | kundina_palace/rukmini_quarters | Rukmini | Her letter | — | — | Flute drops out under the line and comes back after it. |
| `T-06_at71u` | kundina_palace/rukmini_quarters | Rukmini, The Brahmin | Her letter | Cloth sim on the fold. | — | Cloth. |
| `T-07_mhwdq` | open_country/long_road | The Brahmin | — | Procedural terrain, scatter, dawn mist in the valleys. | Atmospheric depth; he is four pixels tall and must still read. | Wind at altitude. Percussion is still absent. |
| `T-07_eif90` | open_country/long_road | The Brahmin, The ferryman | Her letter | River FLIP with character interaction; wet-cloth transfer. | Spray elements; keep the letter clean white in frame. | Water at the waist. Breath. |

### Movement III

| Shot id | Set | In frame | Props | Houdini | Nuke | Sound |
| --- | --- | --- | --- | --- | --- | --- |
| `T-08_te23q` | mathura/walls | Jarasandha's army | — | Instanced camp at four LODs; 30,000 fires; dust haze. | The horizon line is a matte painting handoff past 2 km. | Percussion enters on the first frame of this shot. Frame drums, 92 BPM. |
| `T-08_g72wo` | mathura/walls | The water-carrier | The chalk marks on the wall of Mathurā | — | — | Chalk. The drums continue under it. |
| `T-09_tqkp6` | mathura/plain | The women on the wall | — | Battlefield dust volume; chariot dust trails. | Dust is the wipe that takes the chariots out of frame. | Distance: the battle is heard from the wall, not from inside it. |
| `T-09_iwz3c` | mathura/plain | Balarama, Jarasandha's army | Balarama's plough | Crowd ragdoll hand-off on contact; debris. | Keep Balarama's face readable through the dust — he is not withheld. | Impact, low. |
| `T-09_lay73` | mathura/plain | The women on the wall | — | — | — | Cloth and stone. |
| `T-10_62zy8` | mathura/walls | The water-carrier | The chalk marks on the wall of Mathurā | — | Match-frame the wall across all five inserts; only the marks and the light change. | Chalk, hard on the beat. The cut pattern from here is strictly on the drum. |
| `T-10_t11hn` | mathura/walls | Jarasandha's army | — | Torch instancing, 4,000 lights as cards. | — | — |
| `T-10_fwpet` | mathura/walls | The water-carrier | The chalk marks on the wall of Mathurā | — | — | — |
| `T-10_t6l2u` | mathura/walls | Jarasandha's army | — | Pyro: tower fire, embers. | — | — |
| `T-10_3tbzn` | mathura/walls | The water-carrier | — | — | — | — |
| `T-10_si0ra` | mathura/walls | The water-carrier | — | — | — | Jarasandha's line lands over the pull-back; drums drop to half time under it. |
| `T-11_cgc0q` | pravarshana/peak | — | — | Hero pyro: wildfire up a slope, 2 km scale, with its own wind. | Heat distortion over the ridge line. | Fire at distance — a roar with no crackle in it. |
| `T-11_3aauk` | pravarshana/peak | Balarama, Krishna | — | Smoke interaction around two characters. | Hard rule: the silhouette never resolves. Rim only, no fill, no face. | Smoke, close. A beam goes somewhere below. |
| `T-11_9rcg8` | pravarshana/peak | Krishna, Balarama | — | Fire interaction on falling bodies. | Speed ramp inside the shot; land on the stop. | Air. Cut the sound one frame before the camera stops. |
| `T-12_n1pj5` | open_country/long_road | Kālayavana, Kālayavana's army | — | — | — | Metal in dust. The drums stop dead. |
| `T-12_227t8` | open_country/long_road | Kālayavana | — | — | — | Wind only, under the line. |
| `T-12_njg91` | open_country/long_road | Krishna, Kālayavana | — | Dust kick per footfall; garland sim. | Framing cuts at the shoulder for the whole shot. | Two sets of feet, one of them not hurrying. Drums return at 132. |
| `T-13_sgipu` | dvaraka_shore/sea | — | — | The film's largest sim: city emergence, displaced water, sheeting runoff off every surface, whitewater at the walls. | Wet-surface pass is a separate layer; the gold must not clip at the top. | The full ensemble arrives here — brass and low strings, the only major-key moment in the trailer. |
| `T-13_saf7b` | dvaraka_shore/sea | The sailors | — | — | Reflected city light on the face is the only source. | — |
| `T-14_sdfel` | kundina_palace/hall | The coalition of kings | — | Crowd and horse instancing; banner cloth sim at three LODs. | — | Drums at full, with conches cutting across them. |
| `T-14_u0pgf` | kundina_palace/hall | Jarasandha, Śiśupāla, The coalition of kings | — | — | Firelight from below; this is the only low-angle in the movement. | Many voices saying one thing. |
| `T-14_7q9c0` | kundina_palace/hall | Rukmini | — | — | Window light; her face half out of it. | The hall, heard through stone. |
| `T-14_zun0i` | kundina_palace/hall | Balarama | — | — | — | Clean line; drums drop out and come back on the cut. |

### Movement IV

| Shot id | Set | In frame | Props | Houdini | Nuke | Sound |
| --- | --- | --- | --- | --- | --- | --- |
| `T-15_icm2f` | kundina_palace/rukmini_quarters | Rukmini | Her lamp from Kuṇḍina | Heavy ornament and cloth sim at rest. | The lamp has burned down measurably since T-06; match the two shots. | Everything strips back to one room. A single sustained note. |
| `T-15_mbl60` | kundina_palace/rukmini_quarters | Rukmini | The wedding dress and ornaments | — | — | Cloth and bangles. |
| `T-16_ieqeu` | kundina_temple/approach | Rukmini, The wedding procession, The ring of soldiers | — | Crowd on both sides; flower scatter; dust. | The temple door is the only still point in the frame. | Conches, drums, bards — all of it diegetic and all of it slightly too loud. |
| `T-16_ad92v` | kundina_temple/approach | The ring of soldiers | — | — | — | — |
| `T-16_9ihf4` | kundina_temple/approach | Rukmini | — | — | — | The procession goes slightly out of sync with the picture here. |
| `T-17_gnue7` | kundina_temple/forecourt | Rukmini, Rukmini's maid | — | — | Interior-to-exterior exposure shift held in-camera. | Sound drops away across this cut, not on it. |
| `T-17_gpr52` | kundina_temple/forecourt | Rukmini | — | — | — | Total silence. One breath. This is the quietest frame in the trailer. |
| `T-17_3ce96` | kundina_temple/forecourt | Rukmini, The coalition of kings | — | Rigid-body on the cup; wine. | Faces in the rank go soft as she passes — the inverse of T-03. | The cup is the only sound. |
| `T-18_igml4` | kundina_temple/forecourt | Rukmini | — | — | — | Nothing yet. |
| `T-18_82ert` | kundina_temple/forecourt | Rukmini, Krishna | His chariot | — | The entire grade of the trailer exists to make this frame read as a different kind of light. Hold the key cool, let the forecourt stay warm behind him. | One voice, unaccompanied, on a single syllable. Nothing else. |
| `T-18_jifvo` | kundina_temple/forecourt | Rukmini | — | — | — | The voice continues over the cut. |
| `T-19_dq0gi` | kundina_temple/forecourt | Krishna, Rukmini, The coalition of kings | — | Cloth and ornament sim through the lift. | — | Full ensemble, in on the frame her foot leaves the stone. |
| `T-19_c8zb2` | kundina_temple/forecourt | Krishna, Rukmini, Dāruka, Balarama, The coalition of kings | His chariot | Dust, horses, crowd scatter. | — | Hooves, wheels, and a conch over the top of it. |
| `T-19_vq2i4` | kundina_temple/forecourt | Krishna, Rukmini | His chariot | — | — | Music under, not over. |
| `T-19_10xv3` | kundina_temple/forecourt | The coalition of kings | His chariot | Horse crowd turn; dust wall. | — | Steel, late. |
| `T-19_kup2h` | kundina_temple/forecourt | — | The conch | — | Cut to black on the attack, not the release. | The conch runs two seconds past the cut, into the black. |

## Every word spoken

Eight of the film's fifteen approved lines (`story/COMMERCIAL_CUT.md` section 5) and three narration lines written for the trailer. The narration is new and needs your approval; nothing else here is invented.

| At | Shot | Speaker | English | తెలుగు |
| --- | --- | --- | --- | --- |
| 0:00 | `T-01_waoex` | Narration *(new)* | “They were made to pull the same rope, and not one of them could see what was holding the mountain up.” | “ఒకే తాడును లాగమన్నారు. ఆ కొండను పట్టుకున్నది ఏమిటో ఒక్కరికీ కనిపించలేదు.” |
| 0:09 | `T-02_347qc` | Narration *(new)* | “The first thing the ocean gave them was not the prize.” | “సముద్రం మొదట ఇచ్చింది బహుమతిని కాదు.” |
| 0:19 | `T-03_tr48n` | Narration *(new)* | “Everything in it was taken. One thing was given.” | “అందులో ప్రతిదీ లాక్కున్నారు. ఇచ్చింది ఒక్కటే.” |
| 0:32 | `T-05_vy8fq` | Rukmī | “Chedi gives us a border. The cowherd would give us a cousin.” | “చేది మనకు సరిహద్దు ఇస్తుంది. ఆ గొల్లవాడు ఇచ్చేది ఒక బంధుత్వం మాత్రమే.” |
| 0:38 | `T-05_tvxlw` | Rukmini | “You can give away a kingdom, brother. Not a woman who has already chosen.” | “రాజ్యాన్ని ఇచ్చేయగలవు అన్నయ్యా. ఇప్పటికే నిర్ణయించుకున్న ఆడదాన్ని కాదు.” |
| 0:48 | `T-06_gftng` | Rukmini | “They will say a woman was stolen. Let them. I am the one holding the pen.” | “ఒక ఆడపిల్లను ఎత్తుకుపోయారని అంటారు. అననివ్వండి — కలం పట్టుకున్నది నేనే.” |
| 1:10 | `T-10_si0ra` | Jarasandha (V.O.) | “Tell Mathurā their king is ash. Tell them who swept it.” | “మథురకు చెప్పండి — మీ రాజు బూడిద. ఆ బూడిదను ఊడ్చింది ఎవరో కూడా చెప్పండి.” |
| 1:20 | `T-12_227t8` | Kālayavana | “No chariot. No bow. No shoes. This is the one they call a god?” | “రథం లేదు. విల్లు లేదు. చెప్పులు కూడా లేవు. వీడినా దేవుడంటున్నది?” |
| 1:35 | `T-14_zun0i` | Balarama | “You came for a bride. I came for the war that follows her.” | “నువ్వు పెళ్లికూతురి కోసం వచ్చావు. ఆమె వెనకాల వచ్చే యుద్ధం కోసం నేను వచ్చాను.” |
| 2:03 | `T-19_vq2i4` | Krishna | “Kings — she walked out on her own feet. I am only the chariot.” | “రాజులారా — ఆమె తన కాళ్లతోనే నడిచి వచ్చింది. నేను కేవలం రథాన్ని.” |
| 2:12 | `T-21` | Rukmini (over black) | “Everyone came to take me. You are the only one who came when I called.” | “అందరూ నన్ను తీసుకెళ్లడానికి వచ్చారు. నేను పిలిచినప్పుడు వచ్చింది నువ్వొక్కడివే.” |

## Music and sound

One cue that changes state on a cut and never across one. Each change lands on the shot named in the last column, so the edit and the score can be built against the same frame numbers.

| From | State | Tempo | Instrumentation | Lands on |
| --- | --- | --- | --- | --- |
| 0:00 | **Drone** | no pulse | Contrabass and tanpura on D, one struck bronze bell every eight seconds | `T-01_waoex` |
| 0:30 | **Breath** | free time | Bass flute alone; it stops under every line and returns after it | `T-05_62jaz` |
| 0:58 | **Pulse** | 92 BPM | Frame drums and chenda enter on the first frame of the shot; low strings under them | `T-08_te23q` |
| 1:18 | **Break** | none | Percussion stops dead on the sword hitting the dust; wind only under the line | `T-12_n1pj5` |
| 1:23 | **Drive** | 132 BPM | Full percussion back in on the chase, conch stabs across the beat | `T-12_njg91` |
| 1:25 | **Lift** | 132 BPM | Brass and low strings over the same pulse; the only major-key bars in the trailer | `T-13_sgipu` |
| 1:29 | **Drive** | 132 BPM | Back to minor on the kings arriving; the cue tightens rather than grows | `T-14_sdfel` |
| 1:49 | **Out** | silence | Everything stops. One breath of room tone | `T-17_gpr52` |
| 1:55 | **Voice** | free time | One unaccompanied female voice on a single syllable | `T-18_82ert` |
| 2:00 | **Full** | 132 BPM | Ensemble, voice on top, conch; hard stop into black | `T-19_dq0gi` |
| 2:09 | **Tail** | no pulse | The conch decays across the title, one bell, then nothing under the last line | `T-20` |

Three sound rules the cut depends on:

- **The quietest frame comes before the loudest.** The silence at `T-17_gpr52` is what makes the reveal land; if it is scored, the trailer has no third act.
- **The conch is the only sound that crosses a cut.** It starts on the last shot and runs two seconds into the black under the title.
- **Dialogue is never under music at full.** Every line above has the cue drop to a bed or to nothing.

## What has to exist before the trailer can be built

The trailer touches **10 of the film's 17 sets, 28 of its 76 characters and crowds, and 9 of its 26 props**. That is the real cost of a trailer on a CG film: it is a cross-section of the whole build, not a slice of it, and the sets alone are most of the environment work in the picture.

**Sets** (10): Bhīṣmaka's palace, Kuṇḍina; Dvārakā, the city; Kuṇḍina, the city; Mathurā; Mount Pravarṣaṇa; Outside Kuṇḍina; The Ocean of Milk; The open country; The shore at Dvārakā; The temple of Ambikā, Kuṇḍina

**Characters and crowds** (28): Balarama; Bhīṣmaka; Bhīṣmaka's court and its visitors; Dāruka; Jarasandha; Jarasandha's army; Krishna; Kālayavana; Kālayavana's army; Kūrma, the tortoise; Lakṣmī; Rukmini; Rukmini's maid; Rukmī; The Asuras; The Brahmin; The Devas; The coalition of kings; The ferryman; The fisher child; The priest; The ring of soldiers; The sailors; The water-carrier; The wedding procession; The women on the wall; Vāsuki, the serpent; Śiśupāla

**Props** (9): Balarama's plough; Her lamp from Kuṇḍina; Her letter; His chariot; Lakṣmī's garland of choosing; Mount Mandara, the churning rod; The chalk marks on the wall of Mathurā; The conch; The wedding dress and ornaments

Six of these are hero builds the trailer cannot fake, because the camera is close or the shot is long: Rukmini, Krishna (hands and silhouette first, face last), Balarama, Kālayavana, the water-carrier, and His chariot.

## Staging the stand-in blocking cannot guess

The blocking puts figures two and a half metres apart on one action line, because the board holds no layout for any set. For most of the trailer that is enough to frame against. For these eleven shots the distance *is* the shot, so each one carries the staging it needs. Until a set layout exists, these are the numbers to key in by hand.

| Shot id | Type | Staging |
| --- | --- | --- |
| `T-01_waoex` | AERIAL | Mountain at world centre; the two lines run out to 2 km either side. Camera 90 m up, 300 m back from the rod. |
| `T-03_aaoxs` | WIDE | The line runs 40 m along the waterline, camera 6 m out on the water, long lens. |
| `T-03_tr48n` | TRACKING | She covers 12 m of the line in the shot; the camera dollies level with her at 3 m out. |
| `T-03_3jm9l` | INSERT | Her at 1.2 m from him, both hands inside a 1 m box. Nothing above the wrist is in the staging. |
| `T-07_mhwdq` | EWS | The road runs to the horizon; he is 400 m from camera and 4 px tall. Terrain must carry to 8 km. |
| `T-08_te23q` | EWS | Camp from the wall out to 4 km, fires from 600 m. Camera on the parapet, 30 m above the plain. |
| `T-11_cgc0q` | EWS | Hill 2 km across, the two figures at the top ridge, camera 1.5 km out and 60 m up. |
| `T-13_sgipu` | EWS | City emerges 300 m off the shore, 900 m of frontage. Camera on the water at 18 m, craning to 40 m through the shot. |
| `T-16_ieqeu` | CRANE | Road 120 m from palace gate to temple step, crowd both sides, temple door dead centre at the end. |
| `T-18_82ert` | POV | The chariot stands 18 m upstage at the forecourt edge, kings in two ranks either side of the gap. This is the one distance in the trailer that cannot be guessed. |
| `T-19_c8zb2` | WIDE | Ring of kings 30 m across with one gap; the chariot covers 25 m in the shot and leaves through it. |

The reveal is the one that matters most. In the stand-in blocking her POV puts the camera two and a half metres from him and he fills the frame; the shot is written for eighteen metres across a forecourt. Set that distance before anything else is lit.

## How to build it

1. **Blocking, in Blender, from the shotspec.** The trailer is already a board object: 
   ```
   node scripts/trailer-spec.js                       # previz/trailer/shotspec.json
   blender --background --factory-startup \
     --python pipeline/blender_blocking.py -- previz/trailer/shotspec.json --out previz/trailer/blocking
   ```
   This has been run end to end: it built and rendered all 65 shots as block, depth and object-id passes with a `contact.html` and a `report.json`. `previz/` is not committed, so run the two commands to get them. It writes one Blender scene per cut unit, one camera per shot named by its shot id, timeline markers on the cuts, and the withheld character hidden in every shot that does not name him. None of it is final; it is the thing you light and replace, shot by shot.
2. **Lay the edit first, on the blocking.** Import `story/trailer/trailer.edl` into Premiere or Resolve and conform it to the blocking renders. The cut is locked at this stage, before a single final asset exists, which is the only way a trailer of this size stays affordable.
3. **Houdini takes the 34 shots in the department sheet that name it.** Three of them are the expensive ones: the churning ocean, the burning hill, and the city rising. Cache to the shot's folder and report back through the bridge rather than editing the board.
4. **Nuke conforms to the same shot ids.** Every render carries `shot_id` and `shot_rev` in its report; a comp whose `shot_rev` no longer matches the board is marked stale automatically and should be re-pulled, not patched.
5. **Grade in Resolve against the one rule in the look:** everything before `T-18_82ert` is warm, dusty and earthbound, and the reveal is the first cool light in the picture. If that contrast is graded away the trailer has no reveal.

### A 60-second teaser out of the same material

If the full trailer is too large a build to start with, these units cut to roughly a minute and keep the structure: **T-02** (the poison), **T-04** (the wall), **T-06** (Ink), **T-08** (the divisions), **T-11** (the burning hill), **T-13** (the city rises), **T-17** (breaking her silence), **T-18** (first sight), and the cards. That is 25 shots instead of 65, and it still ends on the face.

## What is open

- **The three narration lines are new.** Everything else spoken in the trailer is from the approved fifteen. If you would rather have no narration at all, movement I plays silent and gains about four seconds.
- **The last line is the film's last line.** Using it as the button is the strongest end the trailer has, and it spends the film's final beat. The alternative is in the card note.
- **No Telugu title yet.** `story/THE_STORY.md` lists four candidates; the title card needs one of them chosen.
- **Shot lengths are authored, not tested.** They are written to be cut to, but a trailer is found in the edit. Expect every length here to move once there is picture.
- **The story is not locked**, so a scene that changes changes its trailer unit. Every shot carries a `rev` fingerprint; when the source scene changes, the shot goes stale and says so.

