# Pine Vault

A private library for unpublished Pine Script indicators, with one-click open in TradingView.

## Files
- `index.html`, `style.css`, `app.js`: the site
- `pine-vault-autopaste.user.js`: Tampermonkey/Violentmonkey userscript that pastes the code into the TradingView Pine Editor and clicks Add to chart
- `.nojekyll`: tells GitHub Pages to serve files as they are

## Deploy on GitHub Pages
1. Create a new repository (e.g. `pine-vault`).
2. Upload all files from this folder to the repository root.
3. Settings > Pages > Build and deployment > Deploy from a branch > `main` / `/ (root)` > Save.
4. Your site appears at `https://<username>.github.io/pine-vault/` after a minute or two.

## Privacy
Indicators are stored in your browser's localStorage, not in the repository, so your code is never uploaded to GitHub.
Use Export for backups. The site itself is public (anyone with the URL can open it), but each visitor only sees what is saved in their own browser.

## Install the userscript
Open `https://<username>.github.io/pine-vault/pine-vault-autopaste.user.js` with Tampermonkey or Violentmonkey installed, or use the "Get auto-paste userscript" button in the site.
If the extension does not offer to install it, create a new script in the extension dashboard and paste the file contents.
