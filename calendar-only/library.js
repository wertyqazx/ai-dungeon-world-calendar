// AI Dungeon World Calendar v1.0.0
// Paste this entire file into the AI Dungeon "Library" script tab.

/**
 * Creator configuration. Edit this block before publishing your scenario.
 */
globalThis.WorldCalendarSettings = {
  START_DATE: { year: 1000, month: 1, day: 1 },
  ERA: "AE",
  CALENDAR_CARD_TITLE: "World Calendar",
  MAX_SKIP_YEARS: 1000,
  MAX_RECENT_EVENTS: 5,

  // Travel is optional. The calendar and events work when this is false.
  ENABLE_TRAVEL: false,
  START_LOCATION: {
    id: "hearthport",
    name: "Hearthport",
    state: "Example Kingdom",
    continent: "Western Lands"
  },

  // Used for Character Creator and opening-text location detection.
  LOCATION_GROUPS: [
    {
      state: "Example Kingdom",
      continent: "Western Lands",
      aliases: [],
      locations: ["Hearthport", "Rivergate"]
    },
    {
      state: "Coastal Republic",
      continent: "Southern Shores",
      aliases: [],
      locations: ["Sunharbor"]
    },
    {
      state: "Frontier League",
      continent: "Eastern Expanse",
      aliases: [],
      locations: ["Eastwatch"]
    }
  ],

  // Concrete destinations available to :travel when ENABLE_TRAVEL is true.
  TRAVEL_NODES: [
    { id: "hearthport", name: "Hearthport", state: "Example Kingdom", continent: "Western Lands", aliases: [] },
    { id: "rivergate", name: "Rivergate", state: "Example Kingdom", continent: "Western Lands", aliases: [] },
    { id: "sunharbor", name: "Sunharbor", state: "Coastal Republic", continent: "Southern Shores", aliases: [] },
    { id: "eastwatch", name: "Eastwatch", state: "Frontier League", continent: "Eastern Expanse", aliases: [] }
  ],

  // Symmetric route table. Each unordered pair appears exactly once.
  TRAVEL_DAYS: {
    "hearthport|rivergate": 14,
    "hearthport|sunharbor": 45,
    "hearthport|eastwatch": 80,
    "rivergate|sunharbor": 38,
    "rivergate|eastwatch": 72,
    "eastwatch|sunharbor": 55
  },

  // Annual events. Copy the commented example to create your own.
  RECURRING_FESTIVALS: [
    /*
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
        entry: "Founding Day is an annual celebration in the Example Kingdom.",
        type: "events"
      }
    }
    */
  ],

  // One-time events. Copy the commented example to create your own.
  SCHEDULED_EVENTS: [
    /*
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
    */
  ]
};

function WorldCalendar(hook, inputText) {
  "use strict";

  const ZERO_WIDTH_SPACE = "\u200B";
  const CALENDAR_MARKER = "%WC_CALENDAR_V1%";
  const CALENDAR_KEY = `${CALENDAR_MARKER},you `;
  const CUSTOM_EVENTS_MARKER = "%WC_CUSTOM_EVENTS_V1%";
  const CUSTOM_EVENTS_KEY = CUSTOM_EVENTS_MARKER;
  const SETTINGS = globalThis.WorldCalendarSettings || {};
  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const LOCATION_GROUPS = Array.isArray(SETTINGS.LOCATION_GROUPS) ? SETTINGS.LOCATION_GROUPS : [];
  const TRAVEL_NODES = Array.isArray(SETTINGS.TRAVEL_NODES) ? SETTINGS.TRAVEL_NODES : [];
  const TRAVEL_DAYS = SETTINGS.TRAVEL_DAYS && typeof SETTINGS.TRAVEL_DAYS === "object"
    ? SETTINGS.TRAVEL_DAYS
    : {};
  const TRAVEL_ENABLED = SETTINGS.ENABLE_TRAVEL === true;

  let text = (typeof inputText === "string") ? inputText : "";

  if (
    !globalThis.state || typeof state !== "object" || Array.isArray(state) ||
    !globalThis.info || typeof info !== "object" || Array.isArray(info) ||
    !Array.isArray(globalThis.history) ||
    !Array.isArray(globalThis.storyCards)
  ) {
    if (typeof log === "function") {
      log("World Calendar: required AI Dungeon globals are unavailable.");
    }
    return text || ZERO_WIDTH_SPACE;
  }

  const isLeapYear = (year) => (
    (year % 4 === 0) && ((year % 100 !== 0) || (year % 400 === 0))
  );

  const daysInMonth = (year, month) => {
    if (month === 2) return isLeapYear(year) ? 29 : 28;
    return [4, 6, 9, 11].includes(month) ? 30 : 31;
  };

  const isValidDate = (date) => (
    date && Number.isInteger(date.year) && date.year >= 1 &&
    Number.isInteger(date.month) && date.month >= 1 && date.month <= 12 &&
    Number.isInteger(date.day) && date.day >= 1 &&
    date.day <= daysInMonth(date.year, date.month)
  );

  const daysBeforeYear = (year) => {
    const y = year - 1;
    return (365 * y) + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400);
  };

  const dateToOrdinal = (date) => {
    if (!isValidDate(date)) throw new Error("Invalid calendar date.");
    let ordinal = daysBeforeYear(date.year);
    for (let month = 1; month < date.month; month++) {
      ordinal += daysInMonth(date.year, month);
    }
    return ordinal + date.day - 1;
  };

  const ordinalToDate = (ordinal) => {
    ordinal = Math.max(0, Math.floor(Number(ordinal) || 0));
    let low = 1;
    let high = Math.max(2, Math.floor(ordinal / 365) + 2);
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      if (daysBeforeYear(middle) <= ordinal) low = middle;
      else high = middle - 1;
    }
    const year = low;
    let remaining = ordinal - daysBeforeYear(year);
    let month = 1;
    while (remaining >= daysInMonth(year, month)) {
      remaining -= daysInMonth(year, month);
      month++;
    }
    return { year, month, day: remaining + 1 };
  };

  const formatDate = (dateOrOrdinal) => {
    const date = (typeof dateOrOrdinal === "number")
      ? ordinalToDate(dateOrOrdinal)
      : dateOrOrdinal;
    return `${date.day} ${MONTHS[date.month - 1]} ${date.year} ${SETTINGS.ERA || "AE"}`;
  };

  const startDate = isValidDate(SETTINGS.START_DATE)
    ? SETTINGS.START_DATE
    : { year: 1000, month: 1, day: 1 };
  const startOrdinal = dateToOrdinal(startDate);

  const clock = state.WorldCalendar = state.WorldCalendar || {};
  clock.version = 1;
  if (!Number.isInteger(clock.absoluteDay) || clock.absoluteDay < 0) {
    clock.absoluteDay = startOrdinal;
  }
  if (!Number.isInteger(clock.nextTransactionId) || clock.nextTransactionId < 1) {
    clock.nextTransactionId = 1;
  }
  if (!Array.isArray(clock.firedEvents)) clock.firedEvents = [];
  if (!Array.isArray(clock.endedEvents)) clock.endedEvents = [];
  if (!Array.isArray(clock.eventLog)) clock.eventLog = [];
  if (!Array.isArray(clock.journal)) clock.journal = [];
  if (!Array.isArray(clock.customEvents)) clock.customEvents = [];
  if (!Array.isArray(clock.customEventIds)) clock.customEventIds = [];
  if (!clock.active || typeof clock.active !== "object" || Array.isArray(clock.active)) {
    clock.active = null;
  }
  if (clock.active && clock.active.kind === "skip" && !Array.isArray(clock.active.transitions)) {
    clock.active.transitions = Array.isArray(clock.active.events) ? clock.active.events : [];
  }

  const safeActionCount = () => (
    Number.isInteger(info.actionCount) ? Math.max(0, info.actionCount) : history.length
  );

  const makeMarker = (id) => {
    const digits = Math.max(1, id).toString(3);
    const encoded = [...digits].map((digit) => (
      digit === "0" ? "\u200B" : digit === "1" ? "\u200C" : "\u200D"
    )).join("");
    return `\u200B\u200D${encoded}\u200C\u200B`;
  };

  const historyContains = (marker) => history.some((action) => (
    typeof (action && (action.text ?? action.rawText)) === "string" &&
    (action.text ?? action.rawText).includes(marker)
  ));

  const hasMeaningfulActionAfterMarker = (marker) => {
    let markerIndex = -1;
    for (let index = history.length - 1; index >= 0; index--) {
      const actionText = history[index] && (history[index].text ?? history[index].rawText);
      if (typeof actionText === "string" && actionText.includes(marker)) {
        markerIndex = index;
        break;
      }
    }
    if (markerIndex < 0) return true;
    return history.slice(markerIndex + 1).some((action) => {
      const actionText = String(action && (action.text ?? action.rawText) || "")
        .replace(/[\u200B-\u200D]+/g, "")
        .trim();
      return actionText !== "";
    });
  };

  const containsPhrase = (source, phrase) => {
    const haystack = String(source || "").toLowerCase();
    const needle = String(phrase || "").toLowerCase();
    if (!needle) return false;
    let index = haystack.indexOf(needle);
    while (index >= 0) {
      const left = index === 0 ? "" : haystack[index - 1];
      const rightIndex = index + needle.length;
      const right = rightIndex >= haystack.length ? "" : haystack[rightIndex];
      if (!/[a-z0-9]/i.test(left) && !/[a-z0-9]/i.test(right)) return true;
      index = haystack.indexOf(needle, index + 1);
    }
    return false;
  };

  const locationId = (name, stateName) => `${stateName}-${name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const resolveLocation = (source, detectedFrom = "text") => {
    const candidates = LOCATION_GROUPS.flatMap((group) => group.locations.map((name) => ({
      name,
      state: group.state,
      continent: group.continent
    }))).sort((a, b) => b.name.length - a.name.length);

    for (const candidate of candidates) {
      if (containsPhrase(source, candidate.name)) {
        return {
          id: locationId(candidate.name, candidate.state),
          ...candidate,
          status: "stationary",
          detectedFrom
        };
      }
    }

    for (const group of LOCATION_GROUPS) {
      const stateAliases = [group.state, ...(group.aliases || [])].sort((a, b) => b.length - a.length);
      if (stateAliases.some((alias) => containsPhrase(source, alias))) {
        return {
          id: locationId(group.state, group.state),
          name: group.state,
          state: group.state,
          continent: group.continent,
          status: "stationary",
          detectedFrom
        };
      }
    }
    return null;
  };

  const unknownLocation = () => ({
    id: "unknown",
    name: "Unknown Location",
    state: "Unknown",
    continent: "Unknown",
    status: "stationary",
    detectedFrom: "fallback"
  });

  const isUsableLocation = (location) => (
    location && typeof location === "object" && !Array.isArray(location) &&
    typeof location.name === "string" && typeof location.state === "string" &&
    typeof location.continent === "string"
  );

  const detectInitialLocation = () => {
    for (const placeholder of (Array.isArray(state.placeholders) ? state.placeholders : [])) {
      const resolved = resolveLocation(placeholder && placeholder.answer, "placeholder");
      if (resolved) return resolved;
    }
    for (const action of history.slice(0, 5)) {
      const resolved = resolveLocation(action && (action.text ?? action.rawText), "opening");
      if (resolved) return resolved;
    }
    if (history.length <= 2 && hook === "output") {
      const resolved = resolveLocation(text, "opening output");
      if (resolved) return resolved;
    }
    return null;
  };

  const configuredStartLocation = () => {
    const location = SETTINGS.START_LOCATION;
    if (!isUsableLocation(location)) return null;
    return {
      ...location,
      id: String(location.id || locationId(location.name, location.state)),
      status: "stationary",
      detectedFrom: "settings"
    };
  };

  if (!isUsableLocation(clock.location)) clock.location = unknownLocation();
  if (clock.location.id === "unknown") {
    clock.location = detectInitialLocation() || configuredStartLocation() || clock.location;
  }

  const locationLabel = () => {
    const location = clock.location;
    const nameIncludesState = location.name.toLowerCase().includes(location.state.toLowerCase());
    return nameIncludesState
      ? `${location.name}, ${location.continent}`
      : `${location.name}, ${location.state}, ${location.continent}`;
  };

  const travelNodeLocation = (node, detectedFrom = "travel") => ({
    id: locationId(node.name, node.state),
    name: node.name,
    state: node.state,
    continent: node.continent,
    status: "stationary",
    travelNodeId: node.id,
    detectedFrom
  });

  const resolveTravelNode = (source) => {
    const candidates = TRAVEL_NODES.flatMap((node) => [node.name, ...(node.aliases || [])]
      .map((alias) => ({ alias, node })))
      .sort((a, b) => b.alias.length - a.alias.length);
    return candidates.find((candidate) => containsPhrase(source, candidate.alias))?.node || null;
  };

  const currentTravelNode = () => (
    TRAVEL_NODES.find((node) => node.id === clock.location.travelNodeId) ||
    TRAVEL_NODES.find((node) => (
      node.name === clock.location.name && node.state === clock.location.state
    )) ||
    resolveTravelNode(clock.location.name)
  );

  const travelPairKey = (originId, destinationId) => [originId, destinationId].sort().join("|");
  const getTravelDays = (origin, destination) => {
    if (!origin || !destination || origin.id === destination.id) return 0;
    const days = TRAVEL_DAYS[travelPairKey(origin.id, destination.id)];
    return Number.isInteger(days) && days > 0 ? days : null;
  };

  const detectedTravelNode = currentTravelNode();
  if (detectedTravelNode && clock.location.travelNodeId !== detectedTravelNode.id) {
    clock.location = travelNodeLocation(detectedTravelNode, clock.location.detectedFrom || "initial detection");
  }

  const normalizeEvent = (event) => {
    if (!event || typeof event !== "object" || Array.isArray(event)) return null;
    if (typeof event.id !== "string" || event.id.trim() === "") return null;
    if (!isValidDate(event.date)) return null;
    const normalized = { ...event, id: event.id.trim(), ordinal: dateToOrdinal(event.date) };
    if (isValidDate(event.endDate)) normalized.endOrdinal = dateToOrdinal(event.endDate);
    return normalized;
  };

  const allEvents = () => {
    const seen = new Set();
    const configured = Array.isArray(SETTINGS.SCHEDULED_EVENTS) ? SETTINGS.SCHEDULED_EVENTS : [];
    const custom = clock.customEvents.filter((event) => event.customKind === "once");
    return [...configured, ...custom]
      .map(normalizeEvent)
      .filter((event) => {
        if (!event || seen.has(event.id)) return false;
        seen.add(event.id);
        return true;
      })
      .sort((a, b) => a.ordinal - b.ordinal);
  };

  const findCardIndex = (keys, marker = null) => storyCards.findIndex((card) => (
    card && typeof card === "object" && typeof card.keys === "string" &&
    (card.keys === keys || (marker && card.keys.includes(marker)))
  ));

  const upsertCard = ({ keys, entry, type, title, notes, marker = null }) => {
    let index = findCardIndex(keys, marker);
    let created = false;

    if (index < 0 && typeof addStoryCard === "function") {
      try {
        // AI Dungeon's practical API accepts title and notes as the fourth and
        // fifth arguments used by current AI Dungeon scripting.
        const result = addStoryCard(keys, entry, type, title, notes);
        if (result && typeof result === "object") index = storyCards.indexOf(result);
        else if (Number.isInteger(result)) index = result;
        if (index < 0 || !storyCards[index] || storyCards[index].keys !== keys) {
          index = findCardIndex(keys, marker);
        }
        created = index >= 0;
      } catch (error) {
        if (typeof log === "function") {
          log(`World Calendar: could not create Story Card '${title}': ${error.message}`);
        }
      }
    }

    if (index < 0 || !storyCards[index]) {
      if (typeof log === "function" && clock.lastCardErrorAction !== safeActionCount()) {
        clock.lastCardErrorAction = safeActionCount();
        log(`World Calendar: Story Card '${title}' is missing and could not be created.`);
      }
      return { index: -1, created: false };
    }

    if (typeof updateStoryCard === "function") {
      try {
        updateStoryCard(index, keys, entry, type);
      } catch (error) {
        storyCards[index].keys = keys;
        storyCards[index].entry = entry;
        storyCards[index].type = type;
      }
    } else {
      storyCards[index].keys = keys;
      storyCards[index].entry = entry;
      storyCards[index].type = type;
    }

    const card = storyCards[index];
    card.title = title;
    card.description = notes;
    return { index, created };
  };

  const removeCardByKeys = (keys, marker = null) => {
    const index = findCardIndex(keys, marker);
    if (index < 0) return false;
    if (typeof removeStoryCard === "function") {
      try {
        removeStoryCard(index);
        return true;
      } catch {}
    }
    storyCards.splice(index, 1);
    return true;
  };

  const eventCardMarker = (event) => (
    `%WC_EVENT_${event.id.replace(/[^a-z0-9_-]+/gi, "_")}%`
  );

  const eventCardKeys = (event, status = "concluded") => {
    const reserved = eventCardMarker(event);
    const configured = event.card && typeof event.card.keys === "string"
      ? event.card.keys.split(",")
        .map((key) => key.trim())
        .filter((key) => key && key.toLowerCase() !== "you")
        .join(",")
      : "";
    const base = configured ? `${reserved},${configured}` : `${reserved},${event.title || event.id}`;
    return status === "active" ? `${base},you ` : base;
  };

  const normalizeFestival = (festival) => {
    if (!festival || typeof festival !== "object" || Array.isArray(festival)) return null;
    if (typeof festival.id !== "string" || festival.id.trim() === "") return null;
    if (!Number.isInteger(festival.month) || festival.month < 1 || festival.month > 12) return null;
    if (!Number.isInteger(festival.day) || festival.day < 1 || festival.day > 31) return null;
    return {
      ...festival,
      id: festival.id.trim(),
      durationDays: Number.isInteger(festival.durationDays) ? Math.max(1, festival.durationDays) : 1,
      regions: Array.isArray(festival.regions) && festival.regions.length ? festival.regions : ["*"]
    };
  };

  const allFestivals = () => {
    const seen = new Set();
    const configured = Array.isArray(SETTINGS.RECURRING_FESTIVALS) ? SETTINGS.RECURRING_FESTIVALS : [];
    const custom = clock.customEvents.filter((event) => event.customKind === "yearly");
    return [...configured, ...custom]
      .map(normalizeFestival)
      .filter((festival) => {
        if (!festival || seen.has(festival.id)) return false;
        seen.add(festival.id);
        return true;
      });
  };

  const festivalAppliesHere = (festival) => (
    festival.regions.includes("*") || festival.regions.includes(clock.location.state)
  );

  const festivalOccurrence = (festival, year) => {
    const date = { year, month: festival.month, day: festival.day };
    if (!isValidDate(date)) return null;
    const startOrdinal = dateToOrdinal(date);
    return {
      year,
      startOrdinal,
      endOrdinal: startOrdinal + festival.durationDays - 1,
      endBoundary: startOrdinal + festival.durationDays
    };
  };

  const currentFestivals = () => {
    const currentYear = ordinalToDate(clock.absoluteDay).year;
    return allFestivals().filter(festivalAppliesHere).map((festival) => ({
      festival,
      occurrence: festivalOccurrence(festival, currentYear)
    })).filter(({ occurrence }) => (
      occurrence && occurrence.startOrdinal <= clock.absoluteDay && clock.absoluteDay <= occurrence.endOrdinal
    )).map(({ festival, occurrence }) => ({
      ...festival,
      ordinal: occurrence.startOrdinal,
      endOrdinal: occurrence.endOrdinal,
      region: festival.regions.includes("*") ? "Worldwide" : festival.regions.join(" and "),
      recurring: true
    }));
  };

  const currentEvents = () => {
    const fired = new Set(clock.firedEvents);
    const ended = new Set(clock.endedEvents);
    const scheduled = allEvents().filter((event) => fired.has(event.id) && !ended.has(event.id) && (
      event.ongoing === true || !Number.isInteger(event.endOrdinal) || clock.absoluteDay <= event.endOrdinal
    ));
    return [...scheduled, ...currentFestivals()];
  };

  const snapshotCard = (keys, marker = null) => {
    const index = findCardIndex(keys, marker);
    if (index < 0) return null;
    const card = storyCards[index];
    return {
      keys: card.keys,
      entry: card.entry,
      type: card.type,
      title: card.title,
      description: card.description
    };
  };

  const setEventCardStatus = (event, status, details = {}) => {
    if (!event.card || typeof event.card !== "object") return null;
    const marker = eventCardMarker(event);
    const keys = eventCardKeys(event, status);
    const before = snapshotCard(keys, marker);
    const region = details.region || (
      Array.isArray(event.regions) && !event.regions.includes("*") ? event.regions.join(" and ") : "Worldwide"
    );
    const statusLines = status === "active"
      ? [
          "Status: Active.",
          details.startOrdinal != null ? `Current occurrence began: ${formatDate(details.startOrdinal)}.` : "",
          details.endOrdinal != null ? `Scheduled conclusion: ${formatDate(details.endOrdinal)}.` : ""
        ]
      : status === "upcoming"
      ? [
          "Status: Upcoming.",
          details.startOrdinal != null ? `Scheduled beginning: ${formatDate(details.startOrdinal)}.` : ""
        ]
      : [
          "Status: Concluded.",
          details.endOrdinal != null ? `Concluded on: ${formatDate(details.endOrdinal)}.` : "",
          details.nextOrdinal != null ? `Next occurrence: ${formatDate(details.nextOrdinal)}.` : ""
        ];
    const baseEntry = String(event.card.entry || `${event.title || event.id} is a dated world event.`);
    const entry = [...statusLines.filter(Boolean), `Region: ${region}.`, "", baseEntry].join("\n");
    const result = upsertCard({
      keys,
      entry,
      type: "events",
      title: String(event.card.title || event.title || event.id),
      notes: String(event.card.notes || "Managed automatically by World Calendar."),
      marker
    });
    if (result.index < 0) return null;
    return { keys, marker, created: result.created, before };
  };

  const restoreCardChange = (change) => {
    if (!change) return;
    const markerSource = String(change.marker || change.keys || change.before?.keys || "");
    const marker = change.marker || markerSource.match(/%WC_EVENT_[^%]+%/)?.[0] || null;
    if (change.created && !change.before) {
      removeCardByKeys(change.keys, marker);
      return;
    }
    if (change.before) {
      upsertCard({
        keys: change.before.keys,
        entry: change.before.entry,
        type: change.before.type,
        title: change.before.title,
        notes: change.before.description,
        marker
      });
    }
  };

  const eventDisplayName = (eventOrLog) => {
    const title = String(eventOrLog.title || eventOrLog.id || "Unnamed event");
    const region = eventOrLog.region;
    return region && region !== "Worldwide" ? `${title} (${region})` : title;
  };

  const eventLogLabel = (event) => {
    const name = eventDisplayName(event);
    if (event.kind === "started") return `${name} began.`;
    if (event.kind === "ended") return `${name} ended.`;
    if (event.kind === "occurred") return `${name} was celebrated and concluded.`;
    if (event.kind === "recurred") return `${name} occurred ${event.count || "multiple"} times.`;
    return name;
  };

  const calendarEntry = () => {
    const active = currentEvents();
    const recentLimit = Number.isInteger(SETTINGS.MAX_RECENT_EVENTS)
      ? Math.max(0, SETTINGS.MAX_RECENT_EVENTS)
      : 5;
    const recent = recentLimit > 0 ? clock.eventLog.slice(-recentLimit).reverse() : [];
    return [
      "World Calendar",
      "=== EDITABLE STATE ===",
      `Date: ${formatDate(clock.absoluteDay)}`,
      `Location: ${clock.location.name}`,
      "=== END EDITABLE STATE ===",
      `Region: ${clock.location.state}, ${clock.location.continent}.`,
      "The world uses twelve ordinary months. The date changes only through explicit time-skip commands.",
      "",
      "Current events:",
      active.length ? active.map((event) => `- ${eventDisplayName(event)}`).join("\n") : "- None.",
      "",
      "Recent dated events:",
      recent.length
        ? recent.map((event) => `- ${formatDate(event.ordinal)} — ${eventLogLabel(event)}`).join("\n")
        : "- None."
    ].join("\n");
  };

  const calendarNotes = () => [
    "IMPORTANT: Don't forget to use :skip night whenever your character goes to sleep.",
    "AI Dungeon World Calendar v1.0.0",
    clock.lastCardEditError ? `Last edit error: ${clock.lastCardEditError}` : "Editable state is valid.",
    "Edit only the Date and Location lines at the top of the Entry.",
    "Manual edits are administrative corrections and do not create a narrated time skip or journey.",
    "Add personal yearly or one-time events in the separate Custom Events card.",
    `Travel system: ${TRAVEL_ENABLED ? "Enabled" : "Disabled"}.`,
    "",
    "Available commands:",
    ":skip <duration>",
    "",
    "Examples:",
    ":skip 10 days",
    ":skip 2 weeks",
    ":skip 3 months",
    ":skip 1 year",
    ":skip 1 year 2 months 3 days",
    ":skip night — advance to the next morning",
    ...(TRAVEL_ENABLED ? [":travel Rivergate"] : []),
    "",
    ":date — show the current date",
    ":where — show the current location",
    ...(TRAVEL_ENABLED ? [":travel <city> — travel to a configured city"] : []),
    ":help — show command help",
    "",
    "Advanced correction command:",
    ":setlocation Hearthport",
    "",
    `Starting date: ${formatDate(startOrdinal)}.`,
    "Normal story actions do not advance the calendar."
  ].join("\n");

  const updateCalendarCard = () => {
    const result = upsertCard({
      keys: CALENDAR_KEY,
      entry: calendarEntry(),
      type: "calendar",
      title: String(SETTINGS.CALENDAR_CARD_TITLE || "World Calendar"),
      notes: calendarNotes(),
      marker: CALENDAR_MARKER
    });
    if (result.index >= 0) {
      clock.lastRenderedDateText = formatDate(clock.absoluteDay);
      clock.lastRenderedLocationText = clock.location.name;
    }
    return result;
  };

  const parseEditableDate = (source) => {
    const value = String(source || "").trim();
    const named = value.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d+)(?:\s+[A-Za-z][A-Za-z0-9.-]*)?$/i);
    if (named) {
      const month = MONTHS.findIndex((name) => name.toLowerCase() === named[2].toLowerCase()) + 1;
      const date = { day: Number(named[1]), month, year: Number(named[3]) };
      return isValidDate(date) ? date : null;
    }
    const numeric = value.match(/^(\d+)-(\d{1,2})-(\d{1,2})$/);
    if (numeric) {
      const date = { year: Number(numeric[1]), month: Number(numeric[2]), day: Number(numeric[3]) };
      return isValidDate(date) ? date : null;
    }
    return null;
  };

  const customEventsTemplate = () => [
    "Custom Events",
    "=== CUSTOM EVENTS ===",
    "# yearly | 12 May | A Character's Birthday | 1 day",
    "# once | 18 June 1001 | Town Celebration | 3 days",
    "=== END CUSTOM EVENTS ==="
  ].join("\n");

  const customEventsNotes = () => [
    "World Calendar Custom Events v1",
    "Add one event per line inside the editable block.",
    "Formats:",
    "yearly | DAY MONTH | TITLE | N days",
    "once | DAY MONTH YEAR | TITLE | N days",
    "The duration is optional and defaults to 1 day.",
    "Lines beginning with # are examples and are ignored.",
    "",
    clock.customEventErrors?.length
      ? `Errors:\n${clock.customEventErrors.map((error) => `- ${error}`).join("\n")}`
      : "All custom event lines are valid."
  ].join("\n");

  const ensureCustomEventsCard = () => {
    const index = findCardIndex(CUSTOM_EVENTS_KEY, CUSTOM_EVENTS_MARKER);
    const existingEntry = index >= 0 && typeof storyCards[index].entry === "string"
      ? storyCards[index].entry
      : customEventsTemplate();
    return upsertCard({
      keys: CUSTOM_EVENTS_KEY,
      entry: existingEntry,
      type: "events",
      title: "Custom Events",
      notes: customEventsNotes(),
      marker: CUSTOM_EVENTS_MARKER
    });
  };

  const customEventId = (source) => {
    let hash = 2166136261;
    for (let index = 0; index < source.length; index++) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `custom_${(hash >>> 0).toString(16)}`;
  };

  const parseCustomMonthDay = (source) => {
    const match = String(source || "").trim().match(/^(\d{1,2})\s+([A-Za-z]+)$/i);
    if (!match) return null;
    const month = MONTHS.findIndex((name) => name.toLowerCase() === match[2].toLowerCase()) + 1;
    const date = { year: 2000, month, day: Number(match[1]) };
    return isValidDate(date) ? { month, day: date.day } : null;
  };

  const parseCustomEventLine = (source, lineNumber) => {
    const parts = source.split("|").map((part) => part.trim());
    if (parts.length < 3) {
      return { error: `Line ${lineNumber}: expected TYPE | DATE | TITLE | DURATION.` };
    }
    const kindText = parts[0].toLowerCase();
    const customKind = ["yearly", "annual"].includes(kindText)
      ? "yearly"
      : ["once", "one-time", "onetime"].includes(kindText) ? "once" : null;
    if (!customKind) {
      return { error: `Line ${lineNumber}: use 'yearly' or 'once'.` };
    }
    const title = parts[2];
    if (!title) return { error: `Line ${lineNumber}: the event title is empty.` };

    const durationText = parts[3] || "1 day";
    const durationMatch = durationText.match(/^(\d+)\s*days?$/i);
    const durationDays = durationMatch ? Number(durationMatch[1]) : 0;
    if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 365) {
      return { error: `Line ${lineNumber}: duration must be from 1 to 365 days.` };
    }

    const prompt = parts.slice(4).join(" | ") || `The personal event '${title}' takes place.`;
    const normalizedSource = [customKind, parts[1], title, `${durationDays} days`, prompt].join("|");
    const id = customEventId(normalizedSource);
    const card = { title, keys: title, entry: prompt, type: "events" };

    if (customKind === "yearly") {
      const date = parseCustomMonthDay(parts[1]);
      if (!date) return { error: `Line ${lineNumber}: yearly dates use '12 May'.` };
      return {
        event: {
          id,
          customKind,
          title,
          month: date.month,
          day: date.day,
          durationDays,
          regions: ["*"],
          prompt,
          card
        }
      };
    }

    const date = parseEditableDate(parts[1]);
    if (!date) return { error: `Line ${lineNumber}: one-time dates use '18 June 1001'.` };
    return {
      event: {
        id,
        customKind,
        title,
        date,
        endDate: ordinalToDate(dateToOrdinal(date) + durationDays - 1),
        prompt,
        region: "Worldwide",
        card
      }
    };
  };

  const readCustomEventsCard = () => {
    const index = findCardIndex(CUSTOM_EVENTS_KEY, CUSTOM_EVENTS_MARKER);
    if (index < 0 || typeof storyCards[index].entry !== "string") {
      return { changed: false };
    }
    const entry = storyCards[index].entry;
    const block = entry.match(/=== CUSTOM EVENTS ===([\s\S]*?)=== END CUSTOM EVENTS ===/i);
    const errors = [];
    const events = [];
    const seenIds = new Set();
    const source = block ? block[1] : "";
    if (!block) errors.push("The editable CUSTOM EVENTS block is missing.");

    source.split("\n").forEach((rawLine, indexInBlock) => {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) return;
      const parsed = parseCustomEventLine(line, indexInBlock + 1);
      if (parsed.error) {
        errors.push(parsed.error);
      } else if (seenIds.has(parsed.event.id)) {
        errors.push(`Line ${indexInBlock + 1}: duplicate event.`);
      } else {
        seenIds.add(parsed.event.id);
        events.push(parsed.event);
      }
    });

    const signature = `${block ? "valid" : "invalid"}\n${source}`;
    const changed = signature !== clock.customEventsSignature;
    clock.customEventErrors = errors;
    storyCards[index].description = customEventsNotes();
    if (!changed) return { changed: false };

    const nextIds = new Set(events.map((event) => event.id));
    const removedIds = new Set(clock.customEventIds.filter((id) => !nextIds.has(id)));
    for (const id of removedIds) {
      const marker = eventCardMarker({ id });
      removeCardByKeys(marker, marker);
    }
    clock.firedEvents = clock.firedEvents.filter((id) => !removedIds.has(id));
    clock.endedEvents = clock.endedEvents.filter((id) => !removedIds.has(id));
    clock.eventLog = clock.eventLog.filter((event) => !removedIds.has(event.id));
    clock.customEvents = events;
    clock.customEventIds = events.map((event) => event.id);
    clock.customEventsSignature = signature;
    clock.journal = [];
    clock.active = null;
    return { changed: true };
  };

  const rebuildCustomScheduledEventsForDate = () => {
    const customEvents = allEvents().filter((event) => event.customKind === "once");
    const customIds = new Set(customEvents.map((event) => event.id));
    clock.firedEvents = clock.firedEvents.filter((id) => !customIds.has(id));
    clock.endedEvents = clock.endedEvents.filter((id) => !customIds.has(id));
    clock.eventLog = clock.eventLog.filter((event) => !customIds.has(event.id));
    for (const event of customEvents) {
      if (clock.absoluteDay < event.ordinal) continue;
      clock.firedEvents.push(event.id);
      if (Number.isInteger(event.endOrdinal) && event.endOrdinal < clock.absoluteDay) {
        clock.endedEvents.push(event.id);
        setEventCardStatus(event, "concluded", {
          endOrdinal: event.endOrdinal,
          region: "Worldwide"
        });
      } else {
        setEventCardStatus(event, "active", {
          startOrdinal: event.ordinal,
          endOrdinal: event.endOrdinal,
          region: "Worldwide"
        });
      }
    }
  };

  const readCalendarOverrides = () => {
    const index = findCardIndex(CALENDAR_KEY, CALENDAR_MARKER);
    if (index < 0 || typeof storyCards[index].entry !== "string") {
      return { dateChanged: false, locationChanged: false };
    }
    const entry = storyCards[index].entry;
    if (!entry.includes("=== EDITABLE STATE ===")) {
      return { dateChanged: false, locationChanged: false };
    }
    const dateLine = entry.match(/^Date:\s*(.+?)\s*$/mi);
    const locationLine = entry.match(/^Location:\s*(.+?)\s*$/mi);
    const dateText = dateLine ? dateLine[1].trim() : null;
    const locationText = locationLine ? locationLine[1].trim() : null;
    const renderedDateText = typeof clock.lastRenderedDateText === "string"
      ? clock.lastRenderedDateText
      : formatDate(clock.absoluteDay);
    const renderedLocationText = typeof clock.lastRenderedLocationText === "string"
      ? clock.lastRenderedLocationText
      : clock.location.name;
    const dateWasEdited = dateText == null || dateText !== renderedDateText;
    const locationWasEdited = locationText == null || (
      locationText.toLowerCase() !== renderedLocationText.toLowerCase()
    );

    if (!dateWasEdited && !locationWasEdited) {
      return { dateChanged: false, locationChanged: false };
    }

    const errors = [];
    let dateChanged = false;
    let locationChanged = false;

    if (dateWasEdited && !dateLine) {
      errors.push("The Date line is missing.");
    } else if (dateWasEdited) {
      const parsedDate = parseEditableDate(dateText);
      if (!parsedDate) {
        errors.push(`Invalid date '${dateText}'.`);
      } else {
        const parsedOrdinal = dateToOrdinal(parsedDate);
        if (parsedOrdinal !== clock.absoluteDay) {
          clock.absoluteDay = parsedOrdinal;
          dateChanged = true;
        }
      }
    }

    if (locationWasEdited && !locationLine) {
      errors.push("The Location line is missing.");
    } else if (locationWasEdited) {
      const requestedLocation = locationText;
      if (requestedLocation.toLowerCase() !== clock.location.name.toLowerCase()) {
        const node = resolveTravelNode(requestedLocation);
        if (!node) {
          if (!TRAVEL_ENABLED && requestedLocation !== "") {
            clock.location = {
              ...clock.location,
              id: locationId(requestedLocation, clock.location.state),
              name: requestedLocation,
              status: "stationary",
              detectedFrom: "calendar card"
            };
            locationChanged = true;
          } else {
            errors.push(`Unknown travel city '${requestedLocation}'.`);
          }
        } else if (currentTravelNode()?.id !== node.id) {
          clock.location = travelNodeLocation(node, "calendar card");
          locationChanged = true;
        }
      }
    }

    clock.lastCardEditError = errors.join(" ");
    if (dateChanged || locationChanged) {
      clock.journal = [];
      clock.active = null;
    }
    return { dateChanged, locationChanged };
  };

  const rollbackTransaction = (transaction) => {
    clock.absoluteDay = transaction.beforeDay;
    if (transaction.beforeLocation) clock.location = { ...transaction.beforeLocation };
    const newIds = new Set(transaction.newEventIds || []);
    const newlyEnded = new Set(transaction.endedEventIds || []);
    clock.firedEvents = clock.firedEvents.filter((id) => !newIds.has(id));
    clock.endedEvents = clock.endedEvents.filter((id) => !newlyEnded.has(id));
    if (Number.isInteger(transaction.eventLogLengthBefore)) {
      clock.eventLog.splice(transaction.eventLogLengthBefore);
    } else {
      clock.eventLog = clock.eventLog.filter((event) => !newIds.has(event.id));
    }
    for (const change of [...(transaction.cardChanges || [])].reverse()) restoreCardChange(change);
    for (const keys of (transaction.addedCardKeys || [])) removeCardByKeys(keys);
    if (clock.active && clock.active.id === transaction.id) clock.active = null;
  };

  const reconcileJournal = () => {
    const actionCount = safeActionCount();
    while (clock.journal.length) {
      const transaction = clock.journal[clock.journal.length - 1];
      if (!Number.isInteger(transaction.commitActionCount)) break;
      if (historyContains(transaction.marker)) break;
      if (actionCount >= transaction.commitActionCount) break;
      rollbackTransaction(transaction);
      clock.journal.pop();
    }
    if (
      clock.active && clock.active.completed === true &&
      (!historyContains(clock.active.marker) || hasMeaningfulActionAfterMarker(clock.active.marker))
    ) {
      clock.active = null;
    }
  };

  const settlePreviousActiveCommand = () => {
    if (!clock.active || !["skip", "travel"].includes(clock.active.kind)) {
      clock.active = null;
      return;
    }
    const transaction = clock.journal.find((item) => item.id === clock.active.id);
    if (!transaction || Number.isInteger(transaction.commitActionCount)) {
      clock.active = null;
      return;
    }
    if (historyContains(transaction.marker)) {
      transaction.commitActionCount = safeActionCount();
    } else {
      rollbackTransaction(transaction);
      clock.journal = clock.journal.filter((item) => item.id !== transaction.id);
    }
    clock.active = null;
  };

  const unwrapCommand = (source) => {
    const lines = String(source || "").split("\n").map((line) => line.trim()).filter(Boolean);
    if (!lines.length) return null;
    let candidate = lines[lines.length - 1];
    candidate = candidate.replace(/^>\s*you\b/i, "").trim();
    candidate = candidate.replace(/^(?:say|try\s+to|attempt\s+to|do)\s+/i, "").trim();
    candidate = candidate.replace(/^["'“”]+/, "").replace(/["'“”]+[.!?]?$/, "").trim();
    const match = candidate.match(/^[:/](date|calendar|time|help|skip|travel|where|location|setlocation)\b([\s\S]*)$/i);
    return match ? { name: match[1].toLowerCase(), args: match[2].trim() } : null;
  };

  const parseDuration = (source) => {
    const values = { years: 0, months: 0, days: 0 };
    let matched = false;
    const normalized = String(source || "").toLowerCase().replace(/\band\b/g, " ");
    const pattern = /(\d+)\s*(years?|yrs?|yr|y|months?|mons?|mos?|mo|weeks?|wks?|wk|w|days?|d)\b/g;
    const remainder = normalized.replace(pattern, (_, amountText, unit) => {
      matched = true;
      const amount = Number.parseInt(amountText, 10);
      if (!Number.isSafeInteger(amount)) return " INVALID ";
      if (/^y/.test(unit)) values.years += amount;
      else if (/^mo/.test(unit)) values.months += amount;
      else if (/^w/.test(unit)) values.days += amount * 7;
      else values.days += amount;
      return " ";
    }).replace(/[\s,+;&]+/g, "");

    if (!matched || remainder !== "") {
      return { error: "Use a duration such as ':skip 10 days', ':skip 3 months', or ':skip 1 year'." };
    }
    if ((values.years + values.months + values.days) <= 0) {
      return { error: "The time skip must be greater than zero." };
    }
    return { values };
  };

  const addDuration = (ordinal, duration) => {
    const original = ordinalToDate(ordinal);
    const totalMonths = ((original.year - 1) * 12) + (original.month - 1) +
      (duration.years * 12) + duration.months;
    const year = Math.floor(totalMonths / 12) + 1;
    const month = (totalMonths % 12) + 1;
    const day = Math.min(original.day, daysInMonth(year, month));
    return dateToOrdinal({ year, month, day }) + duration.days;
  };

  const describeDuration = (duration) => {
    const pieces = [];
    const add = (amount, singular) => {
      if (amount) pieces.push(`${amount} ${singular}${amount === 1 ? "" : "s"}`);
    };
    add(duration.years, "year");
    add(duration.months, "month");
    add(duration.days, "day");
    return pieces.join(", ");
  };

  const processScheduledEvents = (beforeDay, afterDay) => {
    const fired = new Set(clock.firedEvents);
    const ended = new Set(clock.endedEvents);
    const transitions = [];
    const newEventIds = [];
    const endedEventIds = [];
    const cardChanges = [];

    for (const event of allEvents()) {
      if (beforeDay < event.ordinal && event.ordinal <= afterDay && !fired.has(event.id)) {
        fired.add(event.id);
        clock.firedEvents.push(event.id);
        newEventIds.push(event.id);
        const region = event.region || "Worldwide";
        const transition = {
          id: event.id,
          kind: "started",
          title: event.title || event.id,
          ordinal: event.ordinal,
          endOrdinal: event.endOrdinal,
          region,
          prompt: event.prompt || "This event begins during the time skip."
        };
        transitions.push(transition);
        clock.eventLog.push(transition);
        const change = setEventCardStatus(event, "active", {
          startOrdinal: event.ordinal,
          endOrdinal: event.endOrdinal,
          region
        });
        if (change) cardChanges.push(change);
      }

      const endBoundary = Number.isInteger(event.endOrdinal) ? event.endOrdinal + 1 : null;
      if (
        endBoundary != null && fired.has(event.id) && !ended.has(event.id) &&
        beforeDay < endBoundary && endBoundary <= afterDay
      ) {
        ended.add(event.id);
        clock.endedEvents.push(event.id);
        endedEventIds.push(event.id);
        const region = event.region || "Worldwide";
        const transition = {
          id: event.id,
          kind: "ended",
          title: event.title || event.id,
          ordinal: event.endOrdinal,
          region,
          prompt: event.endPrompt || `${event.title || event.id} concludes during the time skip.`
        };
        transitions.push(transition);
        clock.eventLog.push(transition);
        const change = setEventCardStatus(event, "concluded", {
          endOrdinal: event.endOrdinal,
          region
        });
        if (change) cardChanges.push(change);
      }
    }
    return { transitions, newEventIds, endedEventIds, cardChanges };
  };

  const nextFestivalStart = (festival, afterDay) => {
    const year = ordinalToDate(afterDay).year;
    for (let candidateYear = year; candidateYear <= year + 2; candidateYear++) {
      const occurrence = festivalOccurrence(festival, candidateYear);
      if (occurrence && afterDay < occurrence.startOrdinal) return occurrence.startOrdinal;
    }
    return null;
  };

  const processRecurringFestivals = (beforeDay, afterDay) => {
    const beforeYear = ordinalToDate(beforeDay).year;
    const afterYear = ordinalToDate(afterDay).year;
    const transitions = [];
    const cardChanges = [];

    for (const festival of allFestivals().filter(festivalAppliesHere)) {
      const occurrences = [];
      for (let year = Math.max(1, beforeYear - 1); year <= afterYear; year++) {
        const occurrence = festivalOccurrence(festival, year);
        if (!occurrence) continue;
        const started = beforeDay < occurrence.startOrdinal && occurrence.startOrdinal <= afterDay;
        const ended = beforeDay < occurrence.endBoundary && occurrence.endBoundary <= afterDay;
        if (started || ended) occurrences.push({ ...occurrence, started, ended });
      }
      if (!occurrences.length) continue;

      const region = festival.regions.includes("*") ? "Worldwide" : festival.regions.join(" and ");
      if (occurrences.length <= 6) {
        for (const occurrence of occurrences) {
          const kind = occurrence.started && occurrence.ended
            ? "occurred"
            : occurrence.started ? "started" : "ended";
          transitions.push({
            id: festival.id,
            kind,
            title: festival.title || festival.id,
            ordinal: kind === "ended" ? occurrence.endOrdinal : occurrence.startOrdinal,
            endOrdinal: occurrence.endOrdinal,
            region,
            prompt: festival.prompt || "A recurring festival is observed during the time skip."
          });
        }
      } else {
        transitions.push({
          id: festival.id,
          kind: "recurred",
          title: festival.title || festival.id,
          ordinal: occurrences[occurrences.length - 1].startOrdinal,
          endOrdinal: occurrences[occurrences.length - 1].endOrdinal,
          region,
          count: occurrences.filter((occurrence) => occurrence.started).length,
          prompt: festival.prompt || "A recurring festival is observed repeatedly during the time skip."
        });
      }

      const afterOccurrence = festivalOccurrence(festival, afterYear);
      const activeNow = afterOccurrence &&
        afterOccurrence.startOrdinal <= afterDay && afterDay <= afterOccurrence.endOrdinal
        ? { ordinal: afterOccurrence.startOrdinal, endOrdinal: afterOccurrence.endOrdinal }
        : null;
      const lastOccurrence = occurrences[occurrences.length - 1];
      const change = setEventCardStatus(festival, activeNow ? "active" : "concluded", {
        startOrdinal: activeNow ? activeNow.ordinal : lastOccurrence.startOrdinal,
        endOrdinal: activeNow ? activeNow.endOrdinal : lastOccurrence.endOrdinal,
        nextOrdinal: activeNow ? null : nextFestivalStart(festival, afterDay),
        region
      });
      if (change) cardChanges.push(change);
    }

    for (const transition of transitions) clock.eventLog.push(transition);
    return { transitions, cardChanges };
  };

  const processCalendarTransitions = (beforeDay, afterDay) => {
    const scheduled = processScheduledEvents(beforeDay, afterDay);
    const festivals = processRecurringFestivals(beforeDay, afterDay);
    const transitions = [...scheduled.transitions, ...festivals.transitions]
      .sort((a, b) => a.ordinal - b.ordinal);
    return {
      transitions,
      newEventIds: scheduled.newEventIds,
      endedEventIds: scheduled.endedEventIds,
      cardChanges: [...scheduled.cardChanges, ...festivals.cardChanges]
    };
  };

  const synchronizeConcludedEvents = () => {
    const fired = new Set(clock.firedEvents);
    const ended = new Set(clock.endedEvents);
    for (const event of allEvents()) {
      if (!fired.has(event.id)) continue;
      const hasConcluded = ended.has(event.id) || (
        Number.isInteger(event.endOrdinal) && event.endOrdinal < clock.absoluteDay
      );
      if (hasConcluded) {
        if (!ended.has(event.id)) clock.endedEvents.push(event.id);
        setEventCardStatus(event, "concluded", {
          endOrdinal: event.endOrdinal,
          region: event.region || "Worldwide"
        });
      } else {
        setEventCardStatus(event, "active", {
          startOrdinal: event.ordinal,
          endOrdinal: event.endOrdinal,
          region: event.region || "Worldwide"
        });
      }
    }
  };

  const synchronizeFestivalCards = () => {
    const currentYear = ordinalToDate(clock.absoluteDay).year;
    for (const festival of allFestivals()) {
      const marker = eventCardMarker(festival);
      const keys = eventCardKeys(festival);
      const occurrence = festivalOccurrence(festival, currentYear);
      const applies = festivalAppliesHere(festival);
      const active = applies && occurrence &&
        occurrence.startOrdinal <= clock.absoluteDay && clock.absoluteDay <= occurrence.endOrdinal;
      if (active) {
        setEventCardStatus(festival, "active", {
          startOrdinal: occurrence.startOrdinal,
          endOrdinal: occurrence.endOrdinal,
          region: festival.regions.includes("*") ? "Worldwide" : festival.regions.join(" and ")
        });
        continue;
      }
      if (findCardIndex(keys, marker) < 0) continue;
      let lastOccurrence = occurrence;
      if (!lastOccurrence || clock.absoluteDay < lastOccurrence.startOrdinal) {
        lastOccurrence = festivalOccurrence(festival, Math.max(1, currentYear - 1));
      }
      setEventCardStatus(festival, "concluded", {
        endOrdinal: lastOccurrence && lastOccurrence.endOrdinal,
        nextOrdinal: applies ? nextFestivalStart(festival, clock.absoluteDay) : null,
        region: festival.regions.includes("*") ? "Worldwide" : festival.regions.join(" and ")
      });
    }
  };

  const rebuildScheduledEventsForDate = () => {
    const fired = [];
    const ended = [];
    clock.eventLog = [];
    for (const event of allEvents()) {
      const region = event.region || "Worldwide";
      if (clock.absoluteDay < event.ordinal) {
        if (findCardIndex(eventCardKeys(event), eventCardMarker(event)) >= 0) {
          setEventCardStatus(event, "upcoming", { startOrdinal: event.ordinal, region });
        }
        continue;
      }
      fired.push(event.id);
      if (Number.isInteger(event.endOrdinal) && event.endOrdinal < clock.absoluteDay) {
        ended.push(event.id);
        setEventCardStatus(event, "concluded", { endOrdinal: event.endOrdinal, region });
      } else {
        setEventCardStatus(event, "active", {
          startOrdinal: event.ordinal,
          endOrdinal: event.endOrdinal,
          region
        });
      }
    }
    clock.firedEvents = fired;
    clock.endedEvents = ended;
  };

  const calendarStatusText = () => {
    const active = currentEvents();
    return [
      ">>> World Calendar",
      `Date: ${formatDate(clock.absoluteDay)}`,
      `Location: ${locationLabel()}`,
      `Current events: ${active.length ? active.map(eventDisplayName).join("; ") : "None"}`
    ].join("\n");
  };

  const locationStatusText = () => [
    ">>> Current Location",
    locationLabel(),
    `Status: ${clock.location.status || "stationary"}`
  ].join("\n");

  const helpText = () => [
    ">>> World Calendar Commands",
    "",
    "IMPORTANT: Don't forget to use :skip night whenever your character goes to sleep.",
    "",
    "Time skip:",
    "Use one universal command: :skip <duration>",
    "",
    "Examples:",
    ":skip 10 days",
    ":skip 2 weeks",
    ":skip 3 months",
    ":skip 1 year 2 months 3 days",
    ":skip night — advance to the next morning",
    "",
    ...(TRAVEL_ENABLED ? [
      "Travel:",
      ":travel <destination> — travel to a configured destination and advance time by the journey duration",
      "Example: :travel Rivergate",
      "Available destinations are the major cities and locations configured by the scenario creator.",
      "If your current location is unknown, custom, or too specific, first select a valid nearby destination:",
      ":setlocation <destination>",
      "Example: :setlocation Hearthport",
      ""
    ] : [
      "Travel is disabled in this scenario.",
      ""
    ]),
    ":date — show the current date",
    ":where — show the current location",
    ":help — show this help",
    "Normal actions do not advance time."
  ].join("\n");

  const transitionNotice = (transition) => {
    const name = eventDisplayName(transition);
    if (transition.kind === "started") {
      const stillActive = !Number.isInteger(transition.endOrdinal) || clock.absoluteDay <= transition.endOrdinal;
      return `${formatDate(transition.ordinal)}: ${name} began${stillActive ? " and is currently underway" : ""}.`;
    }
    if (transition.kind === "ended") {
      return `${formatDate(transition.ordinal)}: ${name} ended.`;
    }
    if (transition.kind === "occurred") {
      return `${formatDate(transition.ordinal)}: ${name} was celebrated and ended during the skipped period.`;
    }
    if (transition.kind === "recurred") {
      return `${name} was celebrated ${transition.count || "multiple"} times during the skipped period.`;
    }
    return `${formatDate(transition.ordinal)}: ${name} occurred.`;
  };

  const contextBlock = () => {
    const lines = [
      "[World Time — authoritative calendar state]",
      `Current date: ${formatDate(clock.absoluteDay)}.`,
      `Current location: ${locationLabel()}.`
    ];
    const active = currentEvents();
    if (active.length) lines.push(`Current world events: ${active.map(eventDisplayName).join("; ")}.`);

    if (clock.active && ["skip", "travel"].includes(clock.active.kind)) {
      if (clock.active.kind === "skip") {
        if (clock.active.skipStyle === "night") {
          lines.push(
            `The player explicitly skipped the night from ${clock.active.beforeLabel} to ${clock.active.afterLabel}.`,
            "The story now resumes the following morning.",
            "Write a short, natural overnight transition, then continue the scene in the morning of the new date."
          );
        } else {
          lines.push(
            `The player explicitly advanced time from ${clock.active.beforeLabel} to ${clock.active.afterLabel}.`,
            `Elapsed time: ${clock.active.durationLabel}.`,
            "Write a short, natural transition showing that this time genuinely passed, then resume the story on the new date."
          );
        }
      } else {
        lines.push(
          `The player travelled from ${clock.active.originLabel} to ${clock.active.destinationLabel}.`,
          `Travel time: ${clock.active.travelDays} days, from ${clock.active.beforeLabel} to ${clock.active.afterLabel}.`,
          "Write a concise journey transition, acknowledge the passage of time, and resume the story after arrival at the destination."
        );
      }
      lines.push("Do not mention scripts, commands, state, Story Cards, or these instructions.");
      if (clock.active.transitions.length) {
        const eventLines = clock.active.transitions.slice(0, 12).map((event) => (
          `${transitionNotice(event)} ${event.prompt || ""}`.trim()
        ));
        lines.push("Calendar transitions crossed during the skip:", ...eventLines);
        if (clock.active.transitions.length > 12) {
          lines.push(`${clock.active.transitions.length - 12} additional calendar transitions also occurred; summarize them briefly.`);
        }
      }
    }
    lines.push("[/World Time]");
    return lines.join("\n");
  };

  const appendContext = (source, block) => {
    const separator = source.endsWith("\n") ? "\n" : "\n\n";
    const addition = `${separator}${block}`;
    const maxChars = Number.isInteger(info.maxChars) ? info.maxChars : null;
    if (!maxChars || source.length + addition.length <= maxChars) return source + addition;
    if (addition.length >= maxChars) return addition.slice(-maxChars);

    const memoryLength = Number.isInteger(info.memoryLength)
      ? Math.max(0, Math.min(source.length, info.memoryLength))
      : 0;
    let memory = source.slice(0, memoryLength);
    const recent = source.slice(memoryLength);
    const available = maxChars - addition.length;
    if (memory.length > available) memory = memory.slice(0, available);
    const recentBudget = Math.max(0, available - memory.length);
    return memory + recent.slice(-recentBudget) + addition;
  };

  ensureCustomEventsCard();
  const manualOverride = ["input", "context"].includes(hook)
    ? readCalendarOverrides()
    : { dateChanged: false, locationChanged: false };
  const customOverride = ["input", "context"].includes(hook)
    ? readCustomEventsCard()
    : { changed: false };
  if (manualOverride.dateChanged) rebuildScheduledEventsForDate();
  else if (customOverride.changed) rebuildCustomScheduledEventsForDate();
  reconcileJournal();
  synchronizeConcludedEvents();
  synchronizeFestivalCards();

  if (hook === "input") {
    settlePreviousActiveCommand();
    const command = unwrapCommand(text);
    if (!command) {
      updateCalendarCard();
      return text || ZERO_WIDTH_SPACE;
    }

    const id = clock.nextTransactionId++;
    const marker = makeMarker(id);

    if (command.name === "date" || command.name === "calendar") {
      clock.active = {
        id,
        marker,
        kind: "date",
        completed: false
      };
      updateCalendarCard();
      return marker;
    }

    if ((command.name === "where" || command.name === "location") && command.args === "") {
      clock.active = { id, marker, kind: "where", completed: false };
      updateCalendarCard();
      return marker;
    }

    if (command.name === "setlocation" || (command.name === "location" && command.args !== "")) {
      const resolved = resolveLocation(command.args, "manual command");
      if (!resolved && !TRAVEL_ENABLED && command.args !== "") {
        clock.location = {
          ...clock.location,
          id: locationId(command.args, clock.location.state),
          name: command.args,
          status: "stationary",
          detectedFrom: "manual command"
        };
        clock.active = { id, marker, kind: "locationSet", completed: false };
      } else if (!resolved) {
        clock.active = {
          id,
          marker,
          kind: "error",
          message: `Unknown location '${command.args}'. Use a canonical city, area, or state name.`,
          completed: false
        };
      } else {
        clock.location = resolved;
        clock.active = { id, marker, kind: "locationSet", completed: false };
      }
      updateCalendarCard();
      return marker;
    }

    if (command.name === "help" || (command.name === "time" && /^(?:help|commands?)$/i.test(command.args))) {
      clock.active = { id, marker, kind: "help", completed: false };
      updateCalendarCard();
      return marker;
    }

    if (command.name === "time" && command.args === "") {
      clock.active = { id, marker, kind: "date", completed: false };
      updateCalendarCard();
      return marker;
    }

    if (command.name === "travel") {
      if (!TRAVEL_ENABLED) {
        clock.active = {
          id,
          marker,
          kind: "error",
          message: "Travel is disabled in WorldCalendarSettings. Set ENABLE_TRAVEL to true after configuring routes.",
          completed: false
        };
        updateCalendarCard();
        return marker;
      }
      const destinationText = command.args.replace(/^to\s+/i, "").trim();
      const origin = currentTravelNode();
      const destination = resolveTravelNode(destinationText);
      if (!origin) {
        clock.active = {
          id,
          marker,
          kind: "error",
          message: "Travel requires a concrete current city. Edit the Location line in World Calendar first.",
          completed: false
        };
        updateCalendarCard();
        return marker;
      }
      if (!destination) {
        clock.active = {
          id,
          marker,
          kind: "error",
          message: `Unknown travel destination '${destinationText}'.`,
          completed: false
        };
        updateCalendarCard();
        return marker;
      }
      if (origin.id === destination.id) {
        clock.active = {
          id,
          marker,
          kind: "error",
          message: `The character is already in ${destination.name}.`,
          completed: false
        };
        updateCalendarCard();
        return marker;
      }
      const travelDays = getTravelDays(origin, destination);
      if (!Number.isInteger(travelDays)) {
        clock.active = {
          id,
          marker,
          kind: "error",
          message: `No travel time is configured between ${origin.name} and ${destination.name}.`,
          completed: false
        };
        updateCalendarCard();
        return marker;
      }

      const beforeDay = clock.absoluteDay;
      const afterDay = beforeDay + travelDays;
      const beforeLocation = { ...clock.location };
      const afterLocation = travelNodeLocation(destination, "travel command");
      const eventLogLengthBefore = clock.eventLog.length;
      // Regional transitions crossed during travel belong to the destination.
      clock.location = afterLocation;
      const processed = processCalendarTransitions(beforeDay, afterDay);
      clock.absoluteDay = afterDay;
      const transaction = {
        id,
        marker,
        beforeDay,
        afterDay,
        beforeLocation,
        afterLocation: { ...afterLocation },
        newEventIds: processed.newEventIds,
        endedEventIds: processed.endedEventIds,
        cardChanges: processed.cardChanges,
        eventLogLengthBefore,
        commitActionCount: null
      };
      clock.journal.push(transaction);
      if (clock.journal.length > 50) clock.journal.splice(0, clock.journal.length - 50);
      clock.active = {
        id,
        marker,
        kind: "travel",
        originLabel: `${origin.name}, ${origin.state}`,
        destinationLabel: `${destination.name}, ${destination.state}`,
        travelDays,
        beforeLabel: formatDate(beforeDay),
        afterLabel: formatDate(afterDay),
        transitions: processed.transitions,
        completed: false
      };
      updateCalendarCard();
      return `\n> You travel from ${origin.name} to ${destination.name}. The journey takes ${travelDays} days, and you arrive on ${formatDate(afterDay)}.${marker}`;
    }

    const isNightSkip = command.name === "skip" && /^(?:the\s+)?night$/i.test(command.args);
    const parsed = isNightSkip
      ? { values: { years: 0, months: 0, days: 1 } }
      : parseDuration(command.args);
    if (parsed.error) {
      clock.active = { id, marker, kind: "error", message: parsed.error, completed: false };
      updateCalendarCard();
      return marker;
    }

    const maxYears = Number.isInteger(SETTINGS.MAX_SKIP_YEARS)
      ? Math.max(1, SETTINGS.MAX_SKIP_YEARS)
      : 1000;
    const roughMaximumDays = maxYears * 366;
    const roughRequestedDays = (parsed.values.years * 366) +
      (parsed.values.months * 31) + parsed.values.days;

    if (!Number.isSafeInteger(roughRequestedDays) || roughRequestedDays > roughMaximumDays) {
      clock.active = {
        id,
        marker,
        kind: "error",
        message: `One time skip cannot exceed approximately ${maxYears} years.`,
        completed: false
      };
      updateCalendarCard();
      return marker;
    }

    const beforeDay = clock.absoluteDay;
    const afterDay = addDuration(beforeDay, parsed.values);
    const beforeDate = ordinalToDate(beforeDay);
    const afterDate = ordinalToDate(afterDay);

    if (afterDay <= beforeDay || (afterDate.year - beforeDate.year) > maxYears + 1) {
      clock.active = {
        id,
        marker,
        kind: "error",
        message: `One time skip cannot exceed approximately ${maxYears} years.`,
        completed: false
      };
      updateCalendarCard();
      return marker;
    }

    const eventLogLengthBefore = clock.eventLog.length;
    const processed = processCalendarTransitions(beforeDay, afterDay);
    clock.absoluteDay = afterDay;
    const transaction = {
      id,
      marker,
      beforeDay,
      afterDay,
      newEventIds: processed.newEventIds,
      endedEventIds: processed.endedEventIds,
      cardChanges: processed.cardChanges,
      eventLogLengthBefore,
      commitActionCount: null
    };
    clock.journal.push(transaction);
    if (clock.journal.length > 50) clock.journal.splice(0, clock.journal.length - 50);

    const durationLabel = isNightSkip ? "one night" : describeDuration(parsed.values);
    clock.active = {
      id,
      marker,
      kind: "skip",
      skipStyle: isNightSkip ? "night" : "duration",
      durationLabel,
      beforeLabel: formatDate(beforeDay),
      afterLabel: formatDate(afterDay),
      transitions: processed.transitions,
      completed: false
    };
    updateCalendarCard();
    return isNightSkip
      ? `\n> The night passes. The story resumes on the morning of ${formatDate(afterDay)}.${marker}`
      : `\n> ${durationLabel} passes. The story resumes on ${formatDate(afterDay)}.${marker}`;
  }

  if (hook === "context") {
    updateCalendarCard();
    return appendContext(text || " ", contextBlock());
  }

  if (hook === "output") {
    let output = text;
    const active = clock.active;

    if (active) {
      if (active.kind === "date") {
        output = calendarStatusText();
      } else if (active.kind === "where") {
        output = locationStatusText();
      } else if (active.kind === "locationSet") {
        output = `>>> Location Updated\n${locationLabel()}`;
      } else if (active.kind === "help") {
        output = helpText();
      } else if (active.kind === "error") {
        output = `>>> Calendar Command Error\n${active.message}\nType :help for examples.`;
      } else if (active.kind === "skip") {
        const body = text.replace(/[\u200B-\u200D]+/g, "").trim() ||
          (active.skipStyle === "night"
            ? `The night passes. The story resumes on the morning of ${active.afterLabel}.`
            : `Time passes. The story resumes on ${active.afterLabel}.`);
        const notices = active.transitions.length
          ? `\n\nCalendar events:\n${active.transitions.slice(0, 12).map((event) => `- ${transitionNotice(event)}`).join("\n")}${(
              active.transitions.length > 12
                ? `\n- ${active.transitions.length - 12} additional transitions occurred.`
                : ""
            )}`
          : "";
        const header = active.skipStyle === "night"
          ? `[Night Skip: ${active.beforeLabel} → Morning of ${active.afterLabel}]`
          : `[Time Skip: ${active.beforeLabel} → ${active.afterLabel}]`;
        output = `${header}${notices}\n\n${body}`;
        const transaction = clock.journal.find((item) => item.id === active.id);
        if (transaction && !Number.isInteger(transaction.commitActionCount)) {
          transaction.commitActionCount = safeActionCount();
        }
      } else if (active.kind === "travel") {
        const body = text.replace(/[\u200B-\u200D]+/g, "").trim() ||
          `The journey ends with the character's arrival at ${active.destinationLabel}.`;
        const notices = active.transitions.length
          ? `\n\nCalendar events:\n${active.transitions.slice(0, 12).map((event) => `- ${transitionNotice(event)}`).join("\n")}${(
              active.transitions.length > 12
                ? `\n- ${active.transitions.length - 12} additional transitions occurred.`
                : ""
            )}`
          : "";
        output = `[Journey: ${active.originLabel} → ${active.destinationLabel}]\nTravel time: ${active.travelDays} days\nArrival date: ${active.afterLabel}${notices}\n\n${body}`;
        const transaction = clock.journal.find((item) => item.id === active.id);
        if (transaction && !Number.isInteger(transaction.commitActionCount)) {
          transaction.commitActionCount = safeActionCount();
        }
      }
      output = `\n\n${String(output || "").trim()}\n\n`;
      active.completed = true;
    }

    updateCalendarCard();
    return output || ZERO_WIDTH_SPACE;
  }

  updateCalendarCard();
  return text || ZERO_WIDTH_SPACE;
}
