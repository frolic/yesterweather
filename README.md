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
- **Warmer or colder, at a glance.** The gap between today and yesterday is
  shaded red where today is warmer and blue where it's colder, and a row of
  numbers up top sums it up: vs yesterday, in 4 hours, the next 12 hours.
- **Day rows with a time cursor.** One row per day on the same axis, today's
  line faint behind each. Drag the cursor to any hour and every row shows that
  day's temperature, change vs today, wind and rain at that hour.
- **Wind & rain too.** In the Charts view they stack under the temperature on
  the same axis, so one hover reads all three.

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
