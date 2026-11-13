# DEPLOY NOW — why git says "Everything up-to-date"

That message is **git being honest**, not the site being broken: the commit you are
pushing has been pushed before, so the remote has nothing new to receive and **no new
deploy is triggered**.

The authoritative check is the repo, not the site:

```bash
git log -1 --format='%h %ci %s'     # the newest commit that actually reached GitHub
```

If that is still `b874f39a … release 2026-11-12 (Batch 4)` then **rev 8 was never
pushed** — it only exists in the ZIP I hand you. I do not push, deploy or write to
the live KV; the operator does.

## The two-repo trap (check this first)

This project ships **two** packages that point at **two different GitHub repos**:

| Package | Repo `push.cmd` targets | Live URL | Last deploy (as of 2026-11-13) |
|---|---|---|---|
| `apex-td-project.zip` | `ZenithValues/Apex-Ball-TD-WIKI` | https://zenithvalues.github.io/Apex-Ball-TD-WIKI/ | `2026-11-13-00aa3274` (Batch 4) |
| `apex-td-final.zip` | `ApexBallValuesWiki/ApexBallValuesWiki.github.io` | https://apexballvalueswiki.github.io/ | `2026-11-08` — no `build.json` at all |

So: pushing the **project** package and then looking at
`apexballvalueswiki.github.io` will never show your changes, and re-running
`push.cmd` from an already-pushed folder will answer *"Everything up-to-date"*.

Decide which URL is "the site" before you judge a build. Every deploy since
2026-11-13 writes `/build.json`; if that URL 404s, the deployment is older than
that feature:

```bash
curl -s https://zenithvalues.github.io/Apex-Ball-TD-WIKI/build.json
curl -s https://apexballvalueswiki.github.io/build.json      # 404 = pre-Nov-13 site
```

## `push.cmd` no longer hides this from you (rev 8 rewrite)

The old script pushed, git answered *"Everything up-to-date"*, the site did not
change, and nothing explained why. The new one checks **before** it commits:

| Command | What it does |
|---|---|
| `push.cmd` | Shows the build stamp inside the folder, the remote HEAD, and how many files differ from `origin/main`. If that count is **0** it stops with a loud `NOTHING TO PUSH` block and exit code **2** — it will not invent an empty push. |
| `push.cmd /dryrun` | Everything above, then exits without committing or pushing. |
| `push.cmd /retrigger` | Deliberately makes an empty commit to re-run GitHub Actions on the same source. |

The commit message is handed to git with **`git commit -F <file>`**, never
`-m "%MSG%"`. That was a real failure: the message contains `"What can I
afford?"`, the shell ended the argument at the first quote, and git tried to
commit the rest of the sentence as file names
(`error: pathspec 'can' did not match any file(s)`). A file cannot be misquoted.

The build stamp it prints comes from `public/BUILD_ID.txt` (one bare line written
by `scripts/stamp-build.mjs`), falling back to `public/build.json` — so "which
build is in this folder?" is answered exactly, not guessed. Actions stamps its
**own** id when it builds, so after a deploy compare the build **date** and the
route count in `/build.json` rather than expecting an identical hash.

## Push rev 8 in five lines

```bash
# 1. extract the ZIP somewhere fresh (never push from an old extract)
# 2. from the folder that holds package.json:
git init                                  # only if it is not a repo yet
git remote add origin https://github.com/ZenithValues/Apex-Ball-TD-WIKI.git
git add -A
git commit -m "rev 8: first-load values, coin ladder, no currencies page, item pages, icons, skin colours, persistent login + achievements, afford rarity sort"
git push origin main
```

`push.cmd` in the ZIP does the same thing, asks for `YES` first, and refuses to
run at all when there is nothing to send. On the
`ZenithValues` repo the push triggers `.github/workflows/deploy.yml`, which runs
`npm ci` → `npm run lint` → `npm test` → `npm run build` and publishes `dist/`.
If the workflow fails, the site keeps the previous build — check the Actions tab,
not the site.

**Expected result after a successful deploy:**
`build.json` → `"id": "2026-11-13-<hash>"` with **959 routes**, and the site's
`index-*.js` hash changes (it is `index-B9sAomCq.js` on the 8 Nov site).

## How to tell "the site is stale" from "the data is stale"

- **Build stale** → the *feature* is missing (e.g. no Values → Artifacts page, no
  Demand tier colours). Compare `build.json` id with the ZIP's build stamp.
- **Data stale** → the page is there but numbers are old. Rev 8 fixed the real
  cause (browser HTTP caching of `/overrides`); with rev 8 live the data chip
  reads **LIVE** within ~60 s of a publish. If it reads **CACHED** for minutes
  after an edit, that is a data bug to report with the time and the slug.
- Nothing in this ZIP has been pushed, deployed or written to the live database.
