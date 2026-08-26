# Ready-to-Use Published Script

Use this edition when installing World Calendar through AI Dungeon's published
script system. It is designed to work immediately without access to or edits in
the script code.

The package includes the four matching AI Dungeon script files:

- `library.js` → Library
- `input.js` → Input
- `context.js` → Context
- `output.js` → Output

## Defaults

- Date: `1 January 1000 AD` (a neutral placeholder)
- Location: unknown until the story or player supplies one
- Travel: unavailable
- Built-in holidays and scheduled events: none
- Weather: automatic neutral temperate weather and temperature based on date
- Auto-Skip Limit: 7 days

No regional climate tables or route configuration are required. Automatic
weather is deterministic, so Retry keeps the same conditions on the same date.

## First-time setup

After connecting the script, open the generated `World Calendar` Story Card.
Edit its `Date:` line to match the adventure. The full date, year, and era label
are editable:

```text
Date: 23 March 2457 Fifth Era
```

`AD` may be replaced with labels such as `CE`, `BCE`, `ALD`, `Imperial Era`, or
another label up to 24 characters.

For the full calendar experience, open the generated `Custom Events` Story Card
and add the setting's holidays, birthdays, anniversaries, or one-time events.
No holidays are included automatically.

```text
yearly | 12 May | Founder's Day | 1 day
once | 18 June 1000 | Royal Coronation | 3 days
```

Enter World Calendar commands as Story actions rather than Do actions. Use
`:help` in an adventure for the complete command guide.
