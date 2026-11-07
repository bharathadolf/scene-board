# Publishing the board

The board is published as a **claude.ai artifact**: a private page with its own
URL, its own small database, and permission to call Claude on the viewer's
account. That is where the saved boards live, and why editing by prompt works
there and not on `localhost`.

The artifact for this project:

```
https://claude.ai/artifact/9Dc8Dt8hyJ6Y1GwfmmNvcu
```

Only the owner — and anyone they share it with — can open that link.

## To publish a new version

Build first, then ask Claude, in a session that has the repo:

> Publish `dist/scene_board.html` to `https://claude.ai/artifact/9Dc8Dt8hyJ6Y1GwfmmNvcu`.

Publishing to the same URL replaces the page and keeps the boards, the scene
edits and the link. Publishing without the URL creates a **separate** artifact
with an empty database — which is how to make a staging copy on purpose.

## Capabilities

The page is published with:

```json
{ "db": {}, "downloads": true, "sample": { "images": true }, "assets": {} }
```

- `db` — the boards (`boards`), the scene edits (`scenes`) and the category
  overrides (`meta/cats`).
- `downloads` — the CSV export.
- `sample` with `images` — editing by prompt, and showing Claude the pictures a
  shot's prompt produced. The first use asks the viewer to allow it, and it
  spends their own Claude usage.
- `assets` — the pictures dropped onto shots. Only people who can edit the
  artifact may upload; everyone else sees them but gets no drop zone.

A republish that does not state `capabilities` keeps the stored set. Clearing
them (`{}`) would silently turn off saving and prompt editing, so don't.

## Seeding or repairing the data

The five boards in `data/boards/` are the seed. To write one into the live
artifact, ask Claude to set it:

> Set `boards/b5` in that artifact from `data/boards/b5.json`.

The same route reads the live data back out, which is the way to pull the
boards someone has actually arranged into the repo.

## A staging copy

For a `dev` version that cannot disturb the real boards: build on the `dev`
branch, publish **without** a URL to create a second artifact, and keep that
link for testing. It starts with an empty database — seed it from
`data/boards/`.
