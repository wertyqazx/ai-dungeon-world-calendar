# AI Dungeon World Calendar

A configurable calendar, time-skip, travel, and event engine for AI Dungeon
scenarios. The public package contains no setting-specific lore.

## Choose a version

| Version | Use it when | AI Dungeon files |
| --- | --- | --- |
| [Calendar only](calendar-only) | You only need the calendar, events, and optional travel | `calendar-only/*.js` |
| [Calendar + Inner Self + Auto-Cards](calendar-inner-self-autocards) | You also want Inner Self and its included Auto-Cards system | `calendar-inner-self-autocards/*.js` |

Each version has its own README and four ready-to-paste AI Dungeon script
files. Do not mix files between the two folders.

## Features

- Configurable starting date and era.
- Gregorian-style twelve-month calendar with leap years.
- Universal `:skip <duration>` command and `:skip night`.
- Editable `World Calendar` Story Card.
- Player-managed yearly and one-time events through `Custom Events`.
- Optional location and travel system, disabled by default.
- Event cards with `Active` and `Concluded` states.
- Retry, Continue, and Erase protection for calendar transactions.
- No external runtime dependencies.

## Basic configuration

Edit `WorldCalendarSettings` near the beginning of the selected version's
`library.js`:

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

## Configuration guides

- [Travel and locations](docs/TRAVEL.md)
- [Events](docs/EVENTS.md)

## Tests

Requires Node.js 18 or later:

```bash
npm test
```

## Licensing

The original World Calendar code is available under the repository's
[MIT License](LICENSE). The combined version includes Inner Self and
Auto-Cards by LewdLeah under their original MIT license. See
[third-party notices](THIRD_PARTY_NOTICES.md) and the preserved upstream files
inside `calendar-inner-self-autocards/vendor/inner-self`.
