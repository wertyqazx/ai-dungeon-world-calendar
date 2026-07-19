# Travel configuration

Travel is optional and disabled by default. No location table is required if your scenario only needs dates and events.

## Enable travel

At the beginning of the selected version's `library.js`:

```javascript
ENABLE_TRAVEL: true
```

Before enabling it, configure the sections below.

## 1. Location groups

`LOCATION_GROUPS` maps Character Creator answers and opening text to a state and continent.

```javascript
LOCATION_GROUPS: [
  {
    state: "Example Kingdom",
    continent: "Western Lands",
    aliases: ["Kingdom of Example"],
    locations: ["Hearthport", "Rivergate"]
  }
]
```

- `state` is used for regional events.
- `continent` is displayed in the calendar and context.
- `aliases` contains alternative state names.
- `locations` contains every detectable city, academy, village, or starting-area name.

## 2. Travel nodes

Only concrete destinations belong in `TRAVEL_NODES`:

```javascript
TRAVEL_NODES: [
  {
    id: "hearthport",
    name: "Hearthport",
    state: "Example Kingdom",
    continent: "Western Lands",
    access: 0,
    aliases: ["Hearthport Academy"]
  }
]
```

Requirements:

- `id` must be unique and should use lowercase letters, numbers, and underscores.
- `name` is shown to players.
- `state` and `continent` must match the location groups.
- `access` is an optional non-negative number of days used when estimating a
  trip from a custom place in the same region or continent.
- `aliases` can map academies or alternative spellings to the same destination.

## 3. Optional origin estimation

The calendar can begin a journey from a custom place even when that place is
not a travel node. Configure a representative hub for each supported region
and continent:

```javascript
STATE_TRAVEL_HUBS: {
  "Example Kingdom": "hearthport"
},
CONTINENT_TRAVEL_HUBS: {
  "Western Lands": "hearthport"
},
CONTINENT_ALIASES: [
  { name: "Western Lands", aliases: ["Western Lands", "the west"] }
]
```

The player can then use a correction such as
`:setlocation Old Ruins, Western Lands`. A later journey includes an estimated
access leg to `hearthport`, followed by the configured route duration. The
access leg is the rounded average of the relevant nodes' `access` values, with
a minimum of one day.

All hub IDs must refer to entries in `TRAVEL_NODES`. Leave the hub maps and
continent aliases empty if you only want travel to begin at exact nodes.

## 4. Route durations

`TRAVEL_DAYS` stores one duration for every unordered pair of destinations:

```javascript
TRAVEL_DAYS: {
  "hearthport|rivergate": 14,
  "hearthport|sunharbor": 45,
  "rivergate|sunharbor": 38
}
```

The two IDs in each key must be alphabetically sorted. The route is automatically symmetric, so the reverse key must not be added.

For `N` destinations, a complete table contains:

```text
N × (N - 1) / 2
```

Examples:

| Destinations | Required pairs |
| ---: | ---: |
| 4 | 6 |
| 10 | 45 |
| 20 | 190 |
| 36 | 630 |

## Generate the pair template

Put your nodes in a JSON file using `examples/locations.example.json` as a template, then run:

```bash
node tools/generate-route-template.js examples/locations.example.json 30
```

The second argument is the placeholder duration. The command prints every required pair. Copy the result into `TRAVEL_DAYS` and replace the placeholder values with your actual travel times.

## Disabled behavior

When `ENABLE_TRAVEL` is `false`:

- travel is hidden from `:help`;
- `:travel` returns a clear disabled message;
- no route calculation occurs;
- the `Location` line can be edited as free text;
- dates, time skips, and events continue to work normally.
