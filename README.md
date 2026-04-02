# LC Hard Tracker

A static one-page tracker that reads from `LC_HARD.csv` and can be deployed directly with GitHub Pages.

## Files
- `index.html`
- `styles.css`
- `app.js`
- `LC_HARD.csv`

## How it works
- The page loads the CSV in the browser.
- Problems stay in the same order as the CSV.
- Problems are grouped into collapsible sections by `Pattern`.
- The `done` state is stored in browser `localStorage` using `LC#` as the key.

## Deploy on GitHub Pages
1. Create a GitHub repo.
2. Upload all 4 files to the repo root.
3. Go to repo `Settings -> Pages`.
4. Under `Build and deployment`, choose `Deploy from a branch`.
5. Select your main branch and `/root`.
6. Save.

After GitHub finishes deploying, your site will be live.

## Important note
The `done` state is local to each browser/device because it uses `localStorage`.
