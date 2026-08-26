# Seasons and weather

World Calendar 1.2.2 derives the season from the date and generates local
weather from the date, current location, and configured climate. The result is
deterministic: Retry does not change the weather for the same day and place.

## Configuration

Enable the system and map region or location names to a built-in profile:

```javascript
WEATHER_ENABLED: true,
CLIMATE_BY_REGION: {
  "Example Kingdom": "temperate",
  "Coastal Republic": "warm_maritime",
  "Frontier League": "warm_frontier"
},
CLIMATE_BY_LOCATION: {
  "Eastwatch": "mountain"
}
```

Location mappings override region mappings. An unknown profile falls back to
`temperate`.

Built-in profiles are:

- `temperate`
- `warm_temperate`
- `cold_maritime`
- `mountain`
- `warm_maritime`
- `desert`
- `desert_coast`
- `humid_forest`
- `tropical_maritime`
- `warm_frontier`
- `tropical_forest`

The calendar seasons are Winter (December–February), Spring (March–May),
Summer (June–August), and Autumn (September–November). Seasons are labels;
the selected climate profile determines actual conditions and temperatures.

## Player commands

```text
:weather Heavy rain
:weather Heavy rain | 8°C
:temperature -3
:weather auto
```

A manual override applies only to the current date and location. `:weather
auto` restores the deterministic result.

## AI context

Ordinary turns receive season, weather, and temperature inside the
authoritative World Time `<SYSTEM>` block. The direct transition turn after a
skip or journey omits current weather and current-event state so the transition
instruction remains primary. Full ordinary state returns on the next action.
