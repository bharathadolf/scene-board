# Can ComfyUI do this look? A test kit, and what it would take to integrate

## 1 · What you actually sent

Fifteen frames, and the first useful finding is that **they are not one style —
they are five**, and that is the problem worth solving.

| | frames | what it is |
| --- | --- | --- |
| **A** | the queen, the king on the throne | anime key visual: heavy black ink contours, flat violet and indigo fills, gold ornament, a hard warm rim light, orange irises |
| **B** | most of the chariot frames | painted concept art: ink linework over gouache, limited palette, volumetric dust, strong silhouettes |
| **C** | two of the chariot frames | flat poster / woodblock — hard diagonal of light, almost no rendering |
| **D** | the figure under the moon | anime lineart over painting — **and Greco-Roman architecture and drapery**, not Indian |
| **E** | the cave mouth | photoreal cinematic, the only frame in the film's own 21:9 |

Nine of those frames are the same chariot prompt rendered nine different ways.
That is Midjourney behaving normally, and it is exactly what a 115-scene film
cannot absorb: the audience will read a change of medium as a change of meaning.

Two smaller things worth noting. Fourteen frames are 1456×816 (16:9); the board
builds its comps at 1680×720 (21:9), so most of these would be cropped. And
frame D is the same failure your check already caught on S-719 shot 10 — the
model drifting to Rome whenever the prompt says "ancient" and "columns".

## 2 · The straight answer

**Yes, ComfyUI can produce all five of those looks.** A current SDXL anime
fine-tune gets group A close out of the box; group B is what SDXL concept-art
checkpoints do best; C and E are prompt and model choices, not hard problems.

But matching a look is the uninteresting half. The reason to move this pipeline
to ComfyUI is the half Midjourney cannot do at all:

| | Midjourney | ComfyUI |
| --- | --- | --- |
| Same prompt twice | a new interpretation each time | **same model + seed + prompt = the same image, bit for bit** |
| Your own look | describable only in words | **a LoRA trained on your 36 approved frames** |
| Reuse a composition | re-roll and hope | **ControlNet: hold the layout, change the content** |
| Keep a face consistent | character reference, loosely | **IPAdapter / reference image, per entity** |
| 21:9 natively | crop from 16:9 | any resolution you ask for |
| Cost per frame | subscription, per generation | electricity |
| Polish out of the box | **better** | needs work to match |
| Ops burden | none | **yours**: VRAM, weights, versions, breakage |

For this project the deciding factor is the second row. You have 1,000 shots
coming and four scenes done. A look you can *reproduce* is worth more than a
look that is slightly prettier once.

## 3 · Which model — and the licence trap

Most of the popular anime checkpoints cannot legally be used for a film you
intend to exploit. Check this before you fall in love with a look:

| model | licence position | verdict for a feature film |
| --- | --- | --- |
| **NoobAI-XL** | its card prohibits any commercialization | **out** |
| **Pony V7** | commercial use allowed *except* in professional video production | **out** — that clause is this exact use |
| **Flux.1 [dev]**, **FLUX.2 [dev]** | non-commercial without a BFL licence | out unless licensed |
| **Krea 2** | commercial under $1M annual revenue | conditional |
| **Illustrious-XL** | CreativeML Open RAIL-M on current open weights | usable — read the version's terms |
| **SDXL 1.0 base** | CreativeML Open RAIL++-M | usable, deepest LoRA/ControlNet ecosystem |
| **FLUX.2 [klein]** 4B | Apache 2.0 | usable, ~8–13 GB, made for LoRA training |
| **Z-Image** base | Apache 2.0 | usable (Turbo is not fine-tunable; train on base) |
| **Qwen-Image** 20B | Apache 2.0 | usable, but fp8 wanted ~21 GB of a 24 GB card |

**The shortlist I would test**: Illustrious-XL for group A, an SDXL concept-art
checkpoint for group B, and FLUX.2 klein as the modern Apache-2.0 hedge. SDXL
stays in the matrix as the control, because that is where the LoRA you will
eventually train is cheapest to make.

## 4 · The test kit

In `comfy/`, ready to run on your machine next to ComfyUI:

```
comfy/
  workflows/sdxl_txt2img.json    the workhorse graph (checkpoint → 2 prompts → KSampler → save)
  workflows/sdxl_lora.json       the same with a LoRA loader spliced in
  workflows/flux_txt2img.json    separate UNET/CLIP/VAE loaders, for Flux-family models
  prompts.json                   three shots and three style recipes
  matrix.json                    which models × recipes × shots × seeds to run
  run_tests.py                   submits, waits, downloads, builds a contact sheet
```

The three test shots are the three hardest things this film asks for, and the
texts are the board's own shot briefs:

- **face** — a queen in close three-quarter profile *(from S-937)*
- **chariot** — the procession on the dust road *(from S-851)*
- **cave** — the mouth of the cave, one distant figure *(from S-719)*

A face, a crowd in motion, and an empty landscape. A model that holds all three
will hold the film.

```bash
# point it at the checkpoints you actually have
python3 comfy/run_tests.py --list
python3 comfy/run_tests.py --models "illustriousXL.safetensors" "sd_xl_base_1.0.safetensors"
# everything in matrix.json
python3 comfy/run_tests.py --out comfy/out
```

It writes `comfy/out/<model>/<recipe>/<shot>_seed<n>.png` and one contact sheet
per model. Pillow makes the sheet; without it you still get the frames.

### How to score it

**Consistency first, prettiness second.** Each cell runs twice with different
seeds on purpose. For every model and recipe:

1. **Does it repeat?** Put the two seeds side by side. Same medium, same palette,
   same weight of line? If a recipe swings between cel-shaded and painterly
   across two seeds, it will swing across 1,000 shots. Score 0–3.
2. **Does it match the reference?** Against frames A and B. 0–3.
3. **Is it the right century and continent?** Any Roman helmet, Greek column,
   Chinese pagoda or Victorian coat scores 0. This is the failure mode your
   check already catches, and it is cheaper to fix in the model than in review.
4. **Does it obey composition?** Did "one small distant figure" stay small, and
   did "no people in the foreground" hold?
5. **Can it withhold?** The film's rule is that Krishna is unseen until the
   temple. Try one prompt with "a hand entering frame, the rest of the figure
   out of shot" and see whether the model can resist drawing a face.

The winner is the highest **1**, not the highest **2**.

## 5 · Then: a LoRA of your own look

Once a base model survives the matrix, the real move is to stop describing your
style and start training it. You have the material already: **36 pictures, 29 of
them approved, each with the prompt that made it and a written judgement of why
it was kept.** That is a cleaner dataset than most LoRAs are trained on.

Rough shape: 30–60 frames, captioned with the shot brief, 1,500–3,000 steps on
SDXL. After that the prompt stops carrying the style — `<lora:unseen-sun:0.8>`
does — and every shot in the film starts from the same visual grammar. That is
the point at which the look stops being a lottery.

## 6 · Integrating it with the board

### The loop does not change

The board's check does not care where a picture came from. It judges pixels
against the shot and the prompt. So the integration is narrow:

```
shot → prompt → [Midjourney  OR  ComfyUI] → picture → check → kept or prompt rewritten
```

What changes on a shot:

| field | now | after |
| --- | --- | --- |
| `mj` | the Midjourney prompt | `prompt` — the text, engine-independent |
| — | | `engine`: `mj` or `comfy` |
| — | | `wf`: which workflow, `model`, `seed`, `lora` |

Keeping `seed` and `model` on the shot is what makes a picture **re-creatable a
year later**, which no Midjourney shot in the board currently is.

### The one real obstacle

The published board runs on `https://claude.ai`. ComfyUI runs on
`http://127.0.0.1:8188`. **Browsers block https pages from calling http
localhost** — this is mixed-content blocking, not a CORS flag you can set, and
`--enable-cors-header` does not fix it.

Three ways round it, in the order I would try them:

1. **A local runner, like the test script.** The board exports pending jobs —
   shot id, prompt, workflow, model, seed — as a JSON file; `run_comfy.py` picks
   it up, generates, and the pictures go back in through the board's existing
   upload. No browser involved, works today, and it is the same code path as
   `run_tests.py`. **This is the one I would build.**
2. **Run the board locally.** `npm run serve` puts it on `http://localhost`,
   where calling ComfyUI on another localhost port is ordinary. You lose the
   hosted database unless you point it at the same artifact.
3. **Put ComfyUI behind https** with a local certificate or a tunnel. Works,
   but it is the most setup for the least gain.

### What to build, in order

1. `engine`, `model`, `seed`, `wf` on the shot record — a day, and it unblocks
   everything else.
2. **Export pending jobs** from a scene, a sequence or the board — reuse the
   zip machinery that already exists for the After Effects export.
3. **`comfy/run_comfy.py`** — the runner, nearly the same script as the test one.
4. **Import results**: drop the runner's output folder on the board and have it
   match `S-719_03_seed101.png` back to the shot. This is the bulk-upload item
   already in the roadmap; ComfyUI makes it urgent rather than nice.
5. Then the check runs exactly as it does now — and because the seed is stored,
   a rejected picture can be re-rolled with one number changed instead of a new
   prompt.

## 7 · What I could not do here

I have no GPU, no ComfyUI and no model weights in this session, so **nothing in
section 4 has been run** — the graphs are written to ComfyUI's API format and
the builder is unit-tested, but the first real proof is you running it. The
model names in `matrix.json` are placeholders; change them to the files in your
`ComfyUI/models/checkpoints` folder before the first run.

Tell me what the contact sheets look like and I will narrow the matrix, write
the LoRA captions from the board's own briefs, and build the runner.

---

Sources: [Best ComfyUI Models 2026](https://iimagined.ai/blog/best-comfyui-models-2026) ·
[ComfyUI API examples](https://docs.comfy.org/development/comfyui-server/api-examples) ·
[Best anime and stylized checkpoints](https://insiderllm.com/guides/best-anime-stylized-checkpoints-local-image-generation/) ·
[FLUX vs SDXL in 2026](https://aiofm.info/en/guides/flux-vs-sdxl)
