# AI Dungeon World Calendar

A configurable calendar, deterministic weather, time-skip, travel, and event engine for AI Dungeon
scenarios. The public package contains no setting-specific lore.

## Choose a version

| Version | Use it when | AI Dungeon files |
| --- | --- | --- |
| [Calendar only](calendar-only) | You only need the calendar, events, and optional travel | `calendar-only/*.js` |
| [Calendar + Auto-Cards](calendar-autocards) | You want automatic Story Card generation without Inner Self (recommended combined setup) | `calendar-autocards/*.js` |
| [Calendar + Inner Self + Auto-Cards](calendar-inner-self-autocards) | You want all three systems together (experimental) | `calendar-inner-self-autocards/*.js` |

Each version has its own README and four ready-to-paste AI Dungeon script
files. Do not mix files between the three folders.

## Features

- Configurable starting date and era.
- Gregorian-style twelve-month calendar with leap years.
- Calendar seasons plus deterministic local weather and temperature.
- Creator-defined climate profiles by region and location.
- Manual `:weather`, `:temperature`, and `:weather auto` controls.
- Universal `:skip <duration>` command and `:skip night`.
- Configurable safe-skip threshold with `:yes` / `:no` confirmation.
- `:undo` for the latest completed skip or journey within three actions.
- Editable `World Calendar` Story Card.
- Player-managed yearly and one-time events through `Custom Events`.
- Optional staged travel over a creator-defined route graph, disabled by default.
- Intermediate stops, route progress, travel modes, and remaining travel time.
- Optional one-confirmation completion of an entire multi-stage route.
- Event cards with `Active` and `Concluded` states.
- Structured `<SYSTEM>` context blocks for authoritative world state, paused journeys, and calendar transitions.
- Skip and travel transition turns omit current weather and current-event state; ordinary context resumes on the next action.
- Retry, Continue, and Erase protection for calendar transactions.
- No external runtime dependencies.

## Basic configuration

Edit `WorldCalendarSettings` near the beginning of the selected version's
`library.js`:

```javascript
globalThis.WorldCalendarSettings = {
  START_DATE: { year: 1000, month: 1, day: 1 },
  ERA: "AE",
  WEATHER_ENABLED: true,
  CLIMATE_BY_REGION: { "Example Kingdom": "temperate" },
  CLIMATE_BY_LOCATION: { "Eastwatch": "mountain" },
  ENABLE_TRAVEL: false,
  // ...
};
```

The calendar and all event features work with travel disabled.

## Commands

Enter all World Calendar commands as **Story actions**, not Do or Say actions.
Those action types may rewrite the input and cause otherwise valid commands to
fail.

```text
:skip 10 days
:skip 2 weeks
:skip 3 months
:skip 1 year 2 months 3 days
:skip night
:yes
:no
:undo
:weather Heavy rain | 8°C
:temperature -3
:weather auto
:date
:where
:help
```

When travel is enabled:

```text
:travel Rivergate
:travel continue
:travel end
:setlocation Old Ruins, Western Lands
```

Skips of up to `AUTO_SKIP_LIMIT_DAYS` execute immediately; the default is seven
days. Longer skips first show the date range and relevant events. Travel always
shows its next stage before departure. Change `Complete Full Route Immediately`
in the generated calendar card if players should finish a whole route after one
confirmation instead of stopping at every intermediate destination.

## Configuration guides

- [Travel and locations](docs/TRAVEL.md)
- [Events](docs/EVENTS.md)
- [Seasons and weather](docs/WEATHER.md)

## Tests

Requires Node.js 18 or later:

```bash
npm test
```

## Licensing

The original World Calendar code is available under the repository's
[MIT License](LICENSE). The combined versions include Auto-Cards and, in the
experimental distribution, Inner Self by LewdLeah under their original MIT
licenses. See [third-party notices](THIRD_PARTY_NOTICES.md) and the attribution
files inside each combined distribution's `vendor` folder.
