# 🌤️ Yesterweather

**What does 14°C *feel* like? You already know — you felt it yesterday.**

Most weather apps tell you a number and leave you to translate it into "do I need
a jacket?" Yesterweather skips the translation. It puts the next few days right
next to the last couple you actually lived through, so today's forecast is
read against a memory instead of a thermometer.

> Yesterday at this time you were a little too cold. Today is 1° warmer. Lose the
> scarf.

🔗 **[yesterweather.frolic.page](https://yesterweather.frolic.page)**

## The idea

- **Overlaid days.** Every day is one line on a shared 24-hour axis, centred on
  **now** (−12h … now … +12h). Lines stack by time-of-day, so "this hour
  yesterday" sits directly under "this hour today."
- **Feels-like first.** Wind chill and humidity are the whole point — when it's
  6°C but *feels* like 1°C, that's the number that decides your coat. Toggle to
  actual whenever you want.
- **Past → future, side by side.** Two days behind, two days ahead. The days you
  remember anchor the days you're guessing at.
- **A "compared to today" grid.** Each cell is the real temperature, shaded blue
  (colder) → red (warmer) versus today at the same hour. Scan a column for one
  day's arc, a row to compare a single hour across the week.
- **Wind & rain too.** Same overlay, different lens — flip between Temperature,
  Wind, and Rain (hourly rainfall).

It remembers your place, units, metric, and which days you're looking at. It's an
installable PWA, so it lives on your home screen and works mobile-first.

## Built with

[Vite](https://vite.dev) · [React 19](https://react.dev) · TypeScript ·
[Tailwind v4](https://tailwindcss.com) · [d3-shape](https://d3js.org) for the
smooth curves (hand-rolled SVG, no chart library) ·
[Open-Meteo](https://open-meteo.com) for forecast + history (no API key) and
[BigDataCloud](https://www.bigdatacloud.com) for reverse-geocoding your location.

## Run it

```bash
pnpm install
pnpm dev      # http://localhost:5173
pnpm build    # production build + service worker
```

## Deploy

Every push to `main` builds and ships to GitHub Pages via
[`.github/workflows/deploy.yaml`](.github/workflows/deploy.yaml). The custom
domain lives in [`public/CNAME`](public/CNAME).

---

<sub>No accounts, no ads, no "allow notifications?" — just weather you can feel.</sub>
