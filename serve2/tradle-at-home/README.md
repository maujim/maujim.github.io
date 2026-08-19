# Tradle

A dependency-free, local five-guess country game built from the public data files loaded by [Tradle Unlimited](https://tradle.net/unlimited/).

## Run

```bash
npm start
```

Open <http://localhost:4173>.

## Data dump

- `data/countries/{code}-{long-name}.csv`: 217 raw country/territory export files (2021 merchandise exports, HS4 product level), named like `us-united-states.csv`.
- `data/daily-countries.csv`: Tradle's date-to-country schedule snapshot.
- `data/countries-meta.json`: country names and coordinates used for distance and direction feedback.
- `data/manifest.json`: provenance, coverage, missing-file notes, and exact playable-code-to-filename mapping.

The visualized total is **exports, not GDP**. The source page requests each file from `https://tradle.net/countries/{lowercase ISO code}.csv`. The local app never calls Tradle at runtime.

Codes `ru` and `tw` occur in the schedule but their country CSV URLs returned HTTP 404 when this snapshot was collected, so they are recorded as unavailable and excluded from random play.

Guess closeness follows Tradle's formula: `round(max(20,000 km - distance, 0) / 20,000 km × 100)`. In other words, it is a geographic proximity score, not a similarity score for the countries' exports.
