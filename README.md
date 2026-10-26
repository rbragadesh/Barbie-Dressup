# Dress-Up World Tour 👗✈️

An iPad-friendly dress-up doll game for young children (built for a 7-year-old) that
mixes fashion play with **geography**, **maths** and **English vocabulary**. The doll
travels the world collecting passport stamps, with the most content for five places
the player knows: **India, South Korea, Taiwan, Singapore and Bali**. Five more
(Japan, France, Egypt, Australia, Brazil) round out the world tour.

It is a plain static website (HTML, CSS, JavaScript; no build step, no server, no
tracking) that installs on the iPad home screen and works offline.

## What's inside

**Dressing room**
- 10 hair styles × 14 colours (including rainbow, ombré and mermaid)
- 6 skin tones, 7 eye colours
- Makeup: lipstick, eyeshadow, blush, lashes, bindi, face paint, glitter
- Nail salon: paint every nail or one at a time, 7 nail-art styles, mehndi (henna)
- 94 items in layers: tops, skirts and trousers, dresses, coats and drapes, scarves,
  socks and tights, shoes, hats and crowns, necklaces, earrings, rings, bangles,
  glasses, things to hold, wings
- Traditional outfits: saree, lehenga choli, pattu pavadai, anarkali, kurti, hanbok,
  qipao, sarong kebaya, Balinese kebaya, kimono
- Every clothing item can be recoloured (24 named colours: say "turquoise", "lavender",
  "crimson"…), patterned (dots, stripes, flowers, paisley…) and given a trim colour
- Seasons (spring, summer, monsoon, autumn, winter) with falling snow, rain, petals or
  leaves; the doll shivers and asks for a coat if she's dressed too lightly for winter
- 15 backgrounds (country ones unlock when you earn that stamp), surprise outfits,
  and a photo album that can save pictures to the iPad's Photos

**World Tour** (one trip per destination)
1. ✈️ **Fly**: an animated flight on a real world map, with a flight-time / clock question
2. 🛬 **Arrive**: capital city, money, languages, weather, flag, and how to say *hello*
   and *thank you* (read aloud in the local language where the iPad has a voice)
3. 👗 **Dress up**: a dressing challenge (wear a hanbok to get into the palace for free,
   hold a lantern in Taipei, no coats in hot Singapore…)
4. 🛍️ **Market**: shopping maths in the local currency (rupees, won, NT dollars, rupiah…)
5. 📖 **Words**: 4–6 new English words with pictures, meanings and sentences, then a word game
   (picture match, fill-the-blank, meanings, spelling with letter tiles)
6. 💡 **Fun facts**: "Did you know?" cards
7. 🛂 **Passport check**: a quiz; pass to earn the stamp and unlock a surprise item

**Also**: Passport (stamps + review cards), Word Book, Brain Games (maths gym, clock,
words, flags, capitals), stars for first-try answers.

**For a child who is still learning to read**: everything has a 🔊 button, and read-aloud
is on by default.

## Grown-up settings

Tap ⚙️ on the home screen and **press and hold** the button (a gate a child is
unlikely to pass by accident). You can change names, the maths level, read-aloud,
sound effects and the voice, unlock all reward items, or reset progress.

| Maths level | Covers |
|---|---|
| Easy | add/take away within 20, groups, patterns, o'clock |
| Medium | within 100, ×2 ×5 ×10, sharing between 2, half past, temperature differences |
| Hard | times tables, sharing, quarter past/to, change from 100 |

Prices use real-world currency sizes, so a sum may read ₩3,000 + ₩2,000; the
explanation reminds the child to "do 3 + 2, then add the zeros back".

## Put it on the iPad

1. **Turn on GitHub Pages (one time):** on GitHub open the repository →
   **Settings → Pages → Build and deployment → Source: "GitHub Actions"**.
   Every push to `main` then runs the tests and publishes the site to
   `https://<your-user>.github.io/<repo-name>/`.
   (Pages on a private repository needs a paid GitHub plan; on a free plan the repo must be public.)
2. **On the iPad**, open that address in **Safari**, tap **Share → Add to Home Screen**.
   It now opens full-screen like an app and works without internet.
3. Optional: better voices. iPad **Settings → Accessibility → Spoken Content → Voices**:
   download an English voice you like, plus Hindi, Korean, Chinese (Taiwan), Indonesian
   or Malay for the "hello" words.

Progress, names and photos are saved only on that iPad (browser storage). Clearing
Safari's website data erases them.

## Run it on a computer

```bash
npm start            # serves the folder at http://localhost:8080 (needs Python 3)
npm test             # content and logic tests (Node 18+, no installs needed)
```

ES modules don't load from `file://`, so open it through a local server rather than
double-clicking `index.html`.

After changing or adding files, run `node scripts/build-sw.mjs` so the offline cache
includes them (a test fails if you forget).

## Project layout

```
index.html, manifest.webmanifest, sw.js   app shell, install info, offline cache
css/styles.css                            all styling (landscape + portrait iPad)
js/doll.js        the SVG doll: body, face, makeup, hair, nails
js/items.js       the wardrobe: every item draws itself in layers
js/scenes.js      background illustrations
js/data/countries.js   destinations: facts, words, stories, challenges, shop items
js/data/worldmap.js    generated map shapes (Natural Earth, public domain)
js/learn.js       maths, vocabulary and quiz question generators
js/ui.js          navigation, stage, weather, modals, question runner
js/screens/*      home, studio, map, trip, passport/words/games/album
scripts/          icon, offline-cache and map generators
tests/app.test.js node:test suite
```

## Notes and honest caveats

- **Name.** "Barbie" is a Mattel trademark, so the app and doll artwork are original
  and the child names her own doll. That is fine for family use; if you ever share the
  site more widely, consider renaming the repository, because the GitHub Pages address
  contains the repository name.
- **Facts.** The content was written for 7-year-olds and checked, but simplified
  ("more than 1.4 billion people", "about 330 metres"). Bali is presented as an island
  province of Indonesia (capital Denpasar; national capital Jakarta). The map uses
  Natural Earth data, with India drawn from Natural Earth's India point-of-view
  boundary.
- **Voices.** Read-aloud uses the iPad's built-in speech. If a language voice isn't
  installed, the app reads a phonetic English spelling instead (e.g. "nuh-muh-stay").
- **Sound** is synthesised in the browser; the iPad's silent switch / volume still applies.
