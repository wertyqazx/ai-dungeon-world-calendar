# Event configuration

The engine supports creator-defined annual events, creator-defined one-time events, and player-defined custom events.

## Annual events

Add objects to `RECURRING_FESTIVALS`:

```javascript
{
  id: "founding_day",
  title: "Founding Day",
  month: 6,
  day: 10,
  durationDays: 2,
  regions: ["Example Kingdom"],
  prompt: "The Example Kingdom celebrates its founding.",
  card: {
    title: "Founding Day",
    keys: "Founding Day",
    entry: "Founding Day is an annual celebration.",
    type: "events"
  }
}
```

Use `regions: ["*"]` for a global event. Regional names must match the `state` values used by the location configuration.

## One-time events

Add objects to `SCHEDULED_EVENTS`:

```javascript
{
  id: "royal_wedding",
  date: { year: 1001, month: 4, day: 12 },
  endDate: { year: 1001, month: 4, day: 14 },
  title: "Royal Wedding",
  prompt: "The royal wedding begins.",
  card: {
    title: "Royal Wedding",
    keys: "Royal Wedding",
    entry: "A major royal wedding takes place in 1001 AE.",
    type: "events"
  }
}
```

Omit `endDate` and use `ongoing: true` for an event that remains active indefinitely.

## Player-defined events

Players edit the automatically created `Custom Events` Story Card:

```text
=== CUSTOM EVENTS ===
yearly | 12 May | A Character's Birthday | 1 day
once | 18 June 1001 | Town Celebration | 3 days
=== END CUSTOM EVENTS ===
```

An optional final field gives the AI additional narrative guidance:

```text
yearly | 12 May | A Character's Birthday | 1 day | Friends gather for a quiet celebration.
```

Invalid lines are reported in the card Notes without disabling valid lines.

## Active cards

Managed event cards use the `events` type. While active, a card receives the `you ` trigger. The trigger is removed when the event concludes, while the card remains available as historical information.
