# pentru Alexandra ☾

A static, responsive university counter: a green-tinted night sky with randomly scattered stars, black lace, a glowing moon, silver chains and a heartagram pendant, Gothic lettering, and occasional groups of 1–3 bats. The browser tab says “pentru Alexandra” and uses a moon icon.

## Change the dates

All dates and timing settings are at the top of **[config.js](./config.js)**. Use `YYYY-MM-DD` dates. Every date begins at midnight in `Europe/Bucharest`, independently of the visitor's device timezone.

The defaults are:

| Year | Starts | Semester II | Summer begins |
| --- | --- | --- | --- |
| I | 28 September 2026 | 1 March 2027 | 1 July 2027 |
| II | 28 September 2027 | 1 March 2028 | 1 July 2028 |
| III | 28 September 2028 | 1 March 2029 | 1 July 2029 |
| IV | 28 September 2029 | 1 March 2030 | 1 July 2030 |

Graduation is **1 July 2030**. The fourth year finishes on that date.

- Overall progress is elapsed time from enrollment to graduation, including summers.
- Years I–III continue counting throughout summer until the next year starts. Year IV counts until graduation.
- Semester I runs from the year's start to 1 March. Semester II runs from 1 March to 1 July.
- From 1 July to the next year's start, the semester section says **Summer break** and shows the percentage of the break elapsed.
- Values mean **completed**, not remaining. Each counter has six decimal places; the last four are smaller. Click, tap, Enter, or Space on the main bar to show/hide its extra digits. That preference is remembered locally when storage is available.
- Before enrollment, counters show 0%. At graduation, all counters stop at 100%.

For a date preview, set `PREVIEW_NOW` in `config.js` to an ISO timestamp with its timezone offset, such as `'2027-07-15T12:00:00+03:00'`. Return it to `null` for live time. Invalid dates produce a visible error instead of misleading percentages.

Colours, layout, and paint strengths (`--brush-strength` and `--pigment-strength`) are at the top of **[styles.css](./styles.css)**. Brush textures blend across the sky, lace, text, and counters; an additional SVG pigment filter gives the lettering and progress bar uneven coverage and slightly rough edges. The moon, chains, pendant, and bats sit above the painted surface.

Bat timings, `BAT_FLOCK_SIZE`, and `STARS` settings are in `config.js`. Each visit brings a random 1–3 bats on smooth curved paths between the middle of the progress bar and the lower-right corner. Flights alternate randomly between ascending and descending, sometimes nearly vertically, and flocks can separate into different paths. Departures are spaced 1–2.1 seconds apart, with independently varied sizes, speeds, and wingbeats. Adjust `BAT_DEPARTURE_GAP_MS`, `BAT_VERTICAL_CHANCE`, and `BAT_SPLIT_CHANCE` to tune this behaviour. Stars vary in size and brightness, with soft bloom; approximately 46% flicker on independent 1.8–4.6 second cycles while the rest stay still. Star density adapts to the viewport. Reduced-motion preferences stop decorative animation. Background tabs pause the stars and clock and clear the current flock until the page is visible again.

## Preview locally

Requires Node.js, with no packages to install:

```sh
npm run dev
```

Open `http://127.0.0.1:4173`. Use this local server rather than double-clicking `index.html`, because browser ES modules require HTTP.

## Test and build

```sh
npm test
npm run build
```

The build copies only the public page, scripts, fonts, and artwork into **`dist/`**. Tests cover date boundaries, summer progress, all four years, graduation, leap day, daylight-saving changes, decimal precision, and invalid configuration.

## Host on Cloudflare Pages

The page is ready for [Cloudflare Pages Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/). In Workers & Pages, create a Pages project using Direct Upload and upload the **`dist/`** folder. No backend, database, API key, environment variables, or runtime services are needed.

For a Git-connected Pages project, use **`npm run build`** as the build command and **`dist`** as the output directory, with no framework preset. See Cloudflare's [static HTML guide](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/).

After editing source files, run `npm run build` again before uploading. Hosting is not set up or published by this project.

## Assets

All fonts and artwork are served locally, with no external network requests. Pirata One, UnifrakturMaguntia, and Cormorant Garamond use the SIL Open Font License; copies are in `assets/fonts/`.

The transparent decorative PNGs were made with the built-in Imagegen tool. The site serves compressed WebP copies with their transparency preserved; original PNGs remain in `assets/` for future edits and are excluded from the deployment folder. Final prompts are recorded in **[assets/GENERATION.md](./assets/GENERATION.md)**. The paint grain, favicon, and bat are lightweight SVG/CSS artwork.
