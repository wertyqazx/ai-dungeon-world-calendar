# Calendar + Inner Self + Auto-Cards (experimental)

This experimental version combines the configurable World Calendar with
[Inner Self](https://github.com/LewdLeah/Inner-Self), which includes
Auto-Cards.

Paste these files into the matching AI Dungeon script tabs:

- `library.js` → Library
- `input.js` → Input
- `context.js` → Context
- `output.js` → Output

Edit `WorldCalendarSettings` in `library.js` before use. Inner Self keeps its
official behavior and configuration. This distribution enables its included
Auto-Cards integration by default; it can also be controlled through Inner
Self's configuration or with the `/AC` command.

The upstream Inner Self source is retained without modification under
`vendor/inner-self`, together with its original README and MIT license. The
four top-level files in this folder are the ready-to-paste combined version.

See the repository-level guides in [`../docs`](../docs).
