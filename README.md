# Merry Christmas, Katlyn

A phone-first Christmas gift site: Next.js static export on GitHub Pages.

- **Edit the words and photo path:** `src/config.ts`
- **Add the photo:** save it as `public/photo.jpg` (portrait, 4:5 looks best)
- **Change the gifts or Cute stuff page:** `src/config.ts` has step-by-step instructions and the maximums above each one
- **Change the levels:** `src/game/levels.ts`
- **Change the rules:** `src/game/` is plain TypeScript with no React
- **Change the music:** `src/audio/tunes.ts` (notes) and `src/audio/engine.ts` (sounds and volumes)

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # game logic tests
npm run build   # static site in out/
```

Every push to `main` deploys through `.github/workflows/deploy.yml`.
