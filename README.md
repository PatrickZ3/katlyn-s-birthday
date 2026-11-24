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

## Explore Toronto (the 3D walk)

The **Explore Toronto** page (in the menu) is a 3D walk around the real
streets between Bay and Yonge, from College down to Queen.

- The streets, buildings and parks come from OpenStreetMap and are saved in
  `src/explore/map-data.json`, so the site never needs the internet for the map.
  To refresh them, run `node scripts/fetch-map.mjs`.
- Her look (jacket, hair and so on) is set in `COLORS` at the top of
  `src/explore/character.ts`.
- Walking speed, the camera angle (`CAMERA`) and how big the city is
  (`MAP_SCALE`, 0.7 = 70% of real size) are at the top of `src/explore/scene.ts`.
- Her home sign (711 Bay Street) and where it stands are in `explore.home` in
  `src/config.ts`. Paste a spot's coordinates from Google Maps to move it.
- Tap the 📍 label at the top left to open the map. Pinch or use + / − to zoom
  (shop names appear when zoomed in), drag to move around, tap a spot to go there.
- Famous places have extra details so they're easy to spot: the Eaton Centre's
  glass roof and signs, the giant screens at Yonge & Dundas, Old City Hall's
  clocks, and theatre marquees. They're in `src/explore/landmarks.ts`; the
  Yonge & Dundas screen ads are in `ADS` at the top of that file.
- Real street-level shops and restaurants get signs styled for what they are
  (Korean writing on Korean places, a döner spit at kebab shops, lanterns at
  Chinese places...). The styles are in `themeFor` in `src/explore/themes.ts`.
- The words on the page are in `explore` in `src/config.ts`.

Map data © OpenStreetMap contributors, available under the Open Database
License. The page shows this credit in the bottom corner, as the licence requires.
