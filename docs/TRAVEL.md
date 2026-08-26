# Travel configuration

Travel is optional and disabled by default. No location table is required if
your scenario only needs dates and events.

World Calendar 1.2.2 treats travel as a graph of direct links. It finds the
shortest route to the destination and divides long journeys into stages. After
each stage, the player may continue, pause, or end the route at the current
location.

## Enable travel

At the beginning of the selected version's `library.js`:

```javascript
ENABLE_TRAVEL: true
```

Before enabling it, configure the sections below.

## 1. Location groups

`LOCATION_GROUPS` maps Character Creator answers and opening text to a state
and continent.

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
- `locations` contains every detectable city, academy, village, or starting
  area name.

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

- `id` must be unique and should use lowercase letters, numbers, and
  underscores.
- `name` is shown to players.
- `state` and `continent` must match the location groups.
- `access` is an optional non-negative number of days used when estimating a
  trip from a custom place in the same region or continent.
- `aliases` can map academies or alternative spellings to the same
  destination.

## 3. Direct route links

`TRAVEL_EDGES` contains only direct connections between neighboring
destinations. Links are automatically symmetric.

```javascript
TRAVEL_EDGES: [
  {
    leftId: "hearthport",
    rightId: "rivergate",
    days: 14,
    mode: "land"
  },
  {
    leftId: "hearthport",
    rightId: "sunharbor",
    days: 20,
    mode: "sea",
    transition: true
  }
]
```

- `leftId` and `rightId` must refer to `TRAVEL_NODES`.
- `days` is the positive whole-number duration of this stage.
- `mode` is a player-facing label such as `land` or `sea`.
- `transition: true` optionally marks a protected intercontinental port link.
- `restrictedState` may be used by a setting-specific route restriction.

The engine chooses the route with the lowest total number of days. A route
such as `A → B → C → D` is presented one stage at a time. The calendar card
marks completed stops with `✓`, the current stop with `➤`, and reports the
remaining travel time.

## 4. Journey behavior

Starting a journey always displays the next stage, arrival date, travel mode,
and relevant calendar events before asking for confirmation:

```text
:travel Eastwatch
:yes
```

At an intermediate stop:

```text
:travel continue
:travel end
```

- `:travel continue` previews the next stage and asks for confirmation.
- `:travel end` discards the remaining route and makes the current stop the
  final destination.
- `:undo` restores the state before the latest completed skip or journey when
  used within the next three actions.

The generated `World Calendar` Story Card contains this editable setting:

```text
Complete Full Route Immediately: false
```

The default `false` pauses at every intermediate stop. Set it to `true` to
complete all remaining stages after one confirmation. Events are still
processed across the whole route.

## 5. Optional origin estimation

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
access leg to `hearthport`, followed by the configured route. The access leg
is the rounded average of the relevant nodes' `access` values, with a minimum
of one day.

All hub IDs must refer to entries in `TRAVEL_NODES`. Leave the hub maps and
continent aliases empty if travel should begin only at exact nodes.

## Legacy complete tables

Existing `TRAVEL_DAYS` tables remain supported when `TRAVEL_EDGES` is empty:

```javascript
TRAVEL_EDGES: [],
TRAVEL_DAYS: {
  "hearthport|rivergate": 14,
  "hearthport|sunharbor": 45,
  "rivergate|sunharbor": 38
}
```

The two IDs in each key must be alphabetically sorted. This compatibility mode
treats every pair as a direct land link. New scenarios should use
`TRAVEL_EDGES`, which produces clearer staged routes and requires only real
neighbor connections.

The old pair-template generator remains available for projects maintaining a
legacy table:

```bash
node tools/generate-route-template.js examples/locations.example.json 30
```

## Disabled behavior

When `ENABLE_TRAVEL` is `false`:

- travel is hidden from `:help`;
- `:travel` returns a clear disabled message;
- no route calculation occurs;
- the `Location` line can be edited as free text;
- dates, time skips, and events continue to work normally.

Enter commands as Story actions, not Do or Say actions, because those action
types may rewrite command text.
