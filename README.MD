# Komf user script for Komga and Kavita

Adds [komf](https://github.com/gregoryn22/komf) integration to the Komga and Kavita web UI.

This is a fork of [Snd-R/komf-userscript](https://github.com/Snd-R/komf-userscript), updated for komf 2.x and the
[gregoryn22/komf](https://github.com/gregoryn22/komf) fork. It talks to komf's `/api` routes, so it also works with
upstream komf 2.x; fork-only settings (title sanitization) are hidden when komf doesn't report them.

---

### Features

- Settings dialog in the main navigation
  - Komga/Kavita connection and event listener (library filter, excluded series)
  - Metadata providers: MangaBaka (API or local database mode), MangaUpdates, MangaDex, AniList, MyAnimeList,
    BookWalker and ComicVine, with drag-and-drop priority and per-library overrides
  - MangaBaka and BookWalker database downloads with progress
  - Processing: covers (including cover locking), titles, book ordering, tags (score, publisher tag names),
    and the fork's title sanitization (strip suffixes and regex patterns)
  - Notifications: Discord webhooks and Apprise URLs
- Library toolbar menu: auto-identify or reset all series in the library
- Series toolbar menu: identify manually (search all providers), auto-identify, or reset metadata. Identify and
  auto-identify show live job progress

Deprecated providers (Bangumi, Yen Press, Viz, Webtoons) and removed ones (Kodansha, Nautiljon, Hentag) are only
listed while they're still enabled, so they can be turned off.

### Installation

Requires Tampermonkey, Violentmonkey or another userscript manager.

1. Install `komf.user.js` from the [latest release](https://github.com/gregoryn22/komf-userscript/releases/latest).
   Updates are picked up automatically from this repository.
2. Set `@include` to your Komga or Kavita server URL (or both). The defaults only cover `localhost`.
3. Open Komf settings from the Komga or Kavita UI and set the komf URL (default `http://localhost:8085`).

### Building

```bash
npm ci
npm run userscript
```

This type-checks, builds, and writes `komf.user.js` (the `komf.meta.js` header plus the bundle).

### Releasing

Bump `@version` in `komf.meta.js`, commit, and push a tag with the same version (for example `1.0.1`). The release
workflow builds `komf.user.js` and attaches it to a GitHub release.
