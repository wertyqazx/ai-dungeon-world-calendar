# Island Events

Scenario-specific companion for `calendar-inner-self-autocards`. It adds hidden
calendar-driven island incidents and rescue opportunities without registering
them as normal World Calendar events, so `:skip` previews never reveal them.

## Behaviour

- A hidden incident day is scheduled 3–4 calendar days after the previous
  incident fires. Reaching or crossing that date arms one incident, which fires
  after 8–18 eligible player actions.
- A hidden rescue opportunity is scheduled 45–90 calendar days after the
  previous rescue event fires. Reaching or crossing that date arms one rescue
  event, which fires after 8–17 eligible player actions.
- WC commands, Continue, Retry, script-only actions, and empty actions do not
  advance either countdown.
- Only one incident and one rescue opportunity can be armed at once. Large time
  skips do not create backlogs.
- Rescue has priority when both timers expire together. The incident is delayed
  by another 3–5 eligible actions.
- Incident severity is weighted 65% light, 28% medium, and 7% heavy. Cooldowns
  prevent heavy weather, illness, snakebite, or injury from repeating rapidly.

## Installation order

Install or invoke `calendar-inner-self-autocards` first. Invoke the Island Events
Context wrapper afterward so its one-turn narrative instruction is placed near
the end of the model context.

The script requires `state.WorldCalendar.absoluteDay`. Until WC initializes that
state, Island Events remains inactive.

## Rescue weights

| Event | Weight |
| --- | ---: |
| Distant merchant ship | 33% |
| Fishing vessel | 31% |
| Passing sailing yacht | 27% |
| Search aircraft | 4% |
| Search helicopter | 2% |
| Search vessel | 3% |

All intervals and weights can be edited in `IslandEventsSettings` at the top of
`library.js`.
