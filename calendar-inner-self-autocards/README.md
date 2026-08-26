# Calendar + Inner Self + Auto-Cards (experimental)

This experimental version combines the configurable World Calendar with
[Inner Self](https://github.com/LewdLeah/Inner-Self), which includes
Auto-Cards.

Paste these files into the matching AI Dungeon script tabs:

- `library.js` → Library
- `input.js` → Input
- `context.js` → Context
- `output.js` → Output

Edit `WorldCalendarSettings` at the very top of `library.js` before use. It is
placed above both Inner Self and Auto-Cards settings. The ready-to-use defaults
are `1 January 2000 AD` and disabled travel. Inner Self keeps its official
behavior and configuration. This distribution enables its included
Auto-Cards integration by default; it can also be controlled through Inner
Self's configuration or with the `/AC` command.

The upstream Inner Self source is retained without modification under
`vendor/inner-self`, together with its original README and MIT license. The
four top-level files in this folder are the ready-to-paste combined version.

World Calendar v1.2.2 supports safe-skip confirmations, three-action undo,
staged journeys, calendar seasons, and deterministic climate-based weather
with manual overrides.

Enter all World Calendar commands as **Story actions**, not Do or Say actions.
Those action types may rewrite the input and cause otherwise valid commands to
fail.

See the repository-level guides in [`../docs`](../docs).
