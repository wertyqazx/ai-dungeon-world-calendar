# Calendar only

Use this version when you only want the configurable World Calendar, events,
and optional travel system.

Paste these files into the matching AI Dungeon script tabs:

- `library.js` → Library
- `input.js` → Input
- `context.js` → Context
- `output.js` → Output

Edit `WorldCalendarSettings` near the beginning of `library.js` before using
the scripts. The ready-to-use default is `1 January 2000 AD`. Travel is disabled
by default and can be enabled after locations and direct route links have been
configured. Version 1.2.2 supports safe-skip
confirmations, three-action undo, staged journeys, calendar seasons, and
deterministic climate-based weather with manual overrides.

Enter all World Calendar commands as **Story actions**, not Do or Say actions.
Those action types may rewrite the input and cause otherwise valid commands to
fail.

See the repository-level guides in [`../docs`](../docs).
