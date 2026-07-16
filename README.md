# apex-td-project

GitHub repo for the **Apex Values & WIKI — Ball Tower Defense** site.

- **`apex-td-project/`** — the actual app (React + Vite + Supabase). See its
  [README](apex-td-project/README.md) for run/deploy/docs.
- **`setup-git.cmd`** — Windows helper: if this folder isn't a git repo yet,
  run it once, then from then on only use:
  ```
  git add -A && git commit -m "update" && git push
  ```
- **`.github/workflows/deploy.yml`** — every push to `main` builds and deploys
  `apex-td-project/dist/` to GitHub Pages automatically.
