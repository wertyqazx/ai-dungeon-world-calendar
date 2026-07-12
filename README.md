# AI Dungeon World Calendar

A configurable calendar, time-skip, travel, and event engine for AI Dungeon scenarios.

The public package contains no setting-specific lore. Creators choose their own starting date, era, locations, routes, annual events, and one-time events from the configuration block at the beginning of `src/library.js`.

## Features

- Configurable starting date and era.
- Gregorian-style twelve-month calendar with leap years.
- Universal `:skip <duration>` command.
- `:skip night` transition to the following morning.
- Editable `World Calendar` Story Card.
- Player-managed yearly and one-time events through `Custom Events`.
- Optional location and travel system.
- Event cards with `Active` and `Concluded` states.
- Active event cards receive the `you ` trigger and lose it when concluded.
- Retry, Continue, and Erase protection for calendar transactions.
- No external dependencies.

## Installation

1. Open an AI Dungeon scenario.
2. Go to `Details` → `Scripting` → `Edit Scripts`.
3. Enable scripts.
4. Replace the four script tabs with:
   - Library → `src/library.js`
   - Input → `src/input.js`
   - Context → `src/context.js`
   - Output → `src/output.js`
5. Save the scenario.

## Basic configuration

Edit `WorldCalendarSettings` at the top of `src/library.js`:

```javascript
globalThis.WorldCalendarSettings = {
  START_DATE: { year: 1000, month: 1, day: 1 },
  ERA: "AE",
  ENABLE_TRAVEL: false,
  // ...
};
```

The calendar and all event features work with travel disabled.

## Commands

```text
:skip 10 days
:skip 2 weeks
:skip 3 months
:skip 1 year 2 months 3 days
:skip night
:date
:where
:help
```

When travel is enabled:

```text
:travel Rivergate
```

## Optional travel

Travel is disabled by default:

```javascript
ENABLE_TRAVEL: false
```

To enable it, configure `LOCATION_GROUPS`, `TRAVEL_NODES`, and `TRAVEL_DAYS`, then set:

```javascript
ENABLE_TRAVEL: true
```

See [docs/TRAVEL.md](docs/TRAVEL.md) for the complete setup guide and the route-template generator.

## Events

Creators can define annual and one-time events in `WorldCalendarSettings`. Players can add personal events through the automatically created `Custom Events` Story Card.

See [docs/EVENTS.md](docs/EVENTS.md) for formats and examples.

## Tests

Requires Node.js 18 or later:

```bash
npm test
```

## Repository layout

```text
src/                 AI Dungeon script tabs
docs/                Configuration guides
examples/            Neutral example location data
tools/               Route-template generator
tests/               Automated engine tests
```
