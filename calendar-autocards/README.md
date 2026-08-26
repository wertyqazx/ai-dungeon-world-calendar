# Calendar + Auto-Cards

This is the recommended combined version when you want the configurable
World Calendar together with automatic Story Card generation, without the
experimental Inner Self system.

Paste these files into the matching AI Dungeon script tabs:

- `library.js` → Library
- `input.js` → Input
- `context.js` → Context
- `output.js` → Output

Edit `WorldCalendarSettings` near the World Calendar section of `library.js`
before use. Auto-Cards v1.1.3 is enabled by default in this distribution and
can be configured through its in-game card or `/AC` command.

World Calendar v1.2.1 supports safe-skip confirmations, three-action undo,
staged journeys, calendar seasons, and deterministic climate-based weather
with manual overrides.

Enter all World Calendar commands as **Story actions**, not Do or Say actions.
Those action types may rewrite the input and cause otherwise valid commands to
fail.

See the repository-level guides in [`../docs`](../docs).
