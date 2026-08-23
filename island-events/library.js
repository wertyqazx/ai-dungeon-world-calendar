// Island Events v0.1.0
// Hidden calendar-driven incidents and rescue opportunities for AI Dungeon.

globalThis.IslandEventsSettings = Object.assign({
  INCIDENT_DAY_INTERVAL: { min: 3, max: 4 },
  INCIDENT_TURN_DELAY: { min: 8, max: 18 },
  INCIDENT_SEVERITY_WEIGHTS: { light: 65, medium: 28, heavy: 7 },
  RESCUE_DAY_INTERVAL: { min: 45, max: 90 },
  RESCUE_TURN_DELAY: { min: 8, max: 17 },
  INCIDENT_POSTPONE_AFTER_RESCUE: { min: 3, max: 5 },
  RESCUE_WEIGHTS: {
    merchant_ship: 33,
    fishing_vessel: 31,
    sailing_yacht: 27,
    search_aircraft: 4,
    search_helicopter: 2,
    search_vessel: 3
  }
}, globalThis.IslandEventsSettings || {});

function IslandEvents(hook, inputText) {
  "use strict";

  const ZERO_WIDTH_SPACE = "\u200B";
  const SETTINGS = globalThis.IslandEventsSettings || {};
  let text = typeof inputText === "string" ? inputText : "";

  if (
    !globalThis.state || typeof state !== "object" || Array.isArray(state) ||
    !globalThis.info || typeof info !== "object" || Array.isArray(info) ||
    !Array.isArray(globalThis.history)
  ) {
    if (typeof log === "function") {
      log("Island Events: required AI Dungeon globals are unavailable.");
    }
    return text || ZERO_WIDTH_SPACE;
  }

  const INCIDENTS = [
    {
      id: "L1",
      severity: "light",
      title: "Short Tropical Squall",
      cooldowns: { weather: { min: 2, max: 4 } },
      prompt: "A short tropical squall begins now: sudden hard rain and sharp gusts create an immediate practical problem. It is not a cyclone and should not automatically destroy the camp. Let the consequences depend on the character's location, preparations, and response."
    },
    {
      id: "L2",
      severity: "light",
      title: "Insect Trouble",
      cooldowns: {},
      prompt: "A sudden concentration of tropical insects becomes an immediate problem. Adapt it to the established situation: they may disturb rest, swarm exposed skin, invade a shelter, or reach existing food. Do not invent stored supplies or a finished camp if neither exists."
    },
    {
      id: "L8",
      severity: "light",
      title: "Minor Wound",
      cooldowns: { injury: { min: 5, max: 8 } },
      prompt: "A plausible feature of the current activity or environment causes a minor but real wound such as a cut, burn, puncture, abrasion, or painful splinter. The injury should persist and matter, but it must not be disabling, life-threatening, or secretly severe."
    },
    {
      id: "L10",
      severity: "light",
      title: "Spoiled Food",
      cooldowns: { supplies: { min: 3, max: 5 } },
      prompt: "Heat, humidity, insects, mold, or poor storage causes some food the character actually possesses to begin spoiling or become questionable. Do not invent a food stockpile. If no food is established, use another approved light incident instead."
    },
    {
      id: "M1",
      severity: "medium",
      title: "Food- or Waterborne Illness",
      cooldowns: { illness: { min: 8, max: 12 } },
      prompt: "Symptoms consistent with food- or waterborne illness begin now after a plausible established exposure. Do not identify the exact cause with certainty and do not resolve the illness immediately. Its severity and course must develop naturally."
    },
    {
      id: "M2",
      severity: "medium",
      title: "Fever or Infection",
      cooldowns: { illness: { min: 10, max: 16 } },
      prompt: "The first meaningful signs of fever or infection appear now, connected to a plausible wound, bite, contaminated environment, or other established exposure. Do not give an unsupported medical diagnosis or settle the outcome in this generation."
    },
    {
      id: "M3",
      severity: "medium",
      title: "Snake Strike",
      cooldowns: { snake: { min: 10, max: 16 } },
      prompt: "A plausible encounter with an island snake escalates into a sudden strike and possible bite. Keep whether the fangs fully penetrated and whether venom was delivered uncertain unless directly observable. Do not decide the medical outcome."
    },
    {
      id: "M5",
      severity: "medium",
      title: "Significant Fall",
      cooldowns: { injury: { min: 10, max: 16 } },
      prompt: "Unstable terrain, wet footing, damaged material, or another plausible immediate hazard causes a fall and a meaningful but non-catastrophic injury such as a sprain or deep cut. Do not escalate it into a fracture or major head injury; those belong to a heavy incident."
    },
    {
      id: "H1",
      severity: "heavy",
      title: "Destructive Tropical Storm",
      cooldowns: {
        heavy: { min: 30, max: 45 },
        weather: { min: 30, max: 45 }
      },
      prompt: "A genuinely destructive tropical storm or cyclone reaches the island. Introduce unmistakable warning signs and immediate danger, but do not skip straight to the aftermath, automatically destroy everything, or decide how well the character survives it."
    },
    {
      id: "H2",
      severity: "heavy",
      title: "Venomous Snakebite",
      cooldowns: {
        heavy: { min: 30, max: 45 },
        snake: { min: 30, max: 45 },
        injury: { min: 30, max: 45 }
      },
      prompt: "A venomous island snake lands a confirmed bite and concerning symptoms begin to develop. Make the encounter plausible for the current place and activity. Do not kill the character, provide convenient treatment, or determine the final outcome."
    },
    {
      id: "H3",
      severity: "heavy",
      title: "Serious Illness",
      cooldowns: {
        heavy: { min: 30, max: 45 },
        illness: { min: 30, max: 45 }
      },
      prompt: "A serious illness becomes unmistakable through dangerous symptoms such as high fever, profound weakness, repeated vomiting, or worsening infection. Keep the diagnosis uncertain unless established evidence supports it, and do not resolve the crisis immediately."
    },
    {
      id: "H4",
      severity: "heavy",
      title: "Serious Injury",
      cooldowns: {
        heavy: { min: 30, max: 45 },
        injury: { min: 30, max: 45 }
      },
      prompt: "A plausible accident causes a serious injury such as a fracture, deep wound, or significant head trauma. Do not kill the character, impose permanent disability, invent convenient medical supplies, or settle recovery in this generation."
    }
  ];

  const RESCUE_EVENTS = [
    {
      id: "merchant_ship",
      title: "Distant Merchant Ship",
      prompt: "A large merchant or cargo vessel passes far offshore. It is a real but difficult opportunity to attract attention because of its distance, speed, and limited view of the island."
    },
    {
      id: "fishing_vessel",
      title: "Fishing Vessel",
      prompt: "A fishing vessel or trawler passes within the wider waters around the island. It may be slower or closer than a merchant ship, but it is not automatically looking toward the shore."
    },
    {
      id: "sailing_yacht",
      title: "Passing Sailing Yacht",
      prompt: "A private sailing yacht passes through the surrounding waters on an irregular course. Its small crew might notice a strong signal, but nothing guarantees that anyone is watching the island."
    },
    {
      id: "search_aircraft",
      title: "Search Aircraft",
      prompt: "A rare maritime patrol or search aircraft crosses near the island while examining a broad area for the missing yacht or its survivors. It does not know the survivors' exact position and must not detect them automatically."
    },
    {
      id: "search_helicopter",
      title: "Search Helicopter",
      prompt: "A very rare search helicopter can be heard or seen operating somewhere near the island while looking for traces of the missing yacht. Even this unusually promising opportunity does not guarantee that the crew notices the survivors."
    },
    {
      id: "search_vessel",
      title: "Search Vessel",
      prompt: "A rare coast-guard, naval, or other dedicated search vessel passes through the surrounding waters while looking for the missing yacht or survivors. Its search area remains broad and successful contact is not automatic."
    }
  ];

  const normalizeRange = (value, fallback) => {
    const source = value && typeof value === "object" ? value : fallback;
    const first = Number.isInteger(source.min) ? source.min : fallback.min;
    const second = Number.isInteger(source.max) ? source.max : fallback.max;
    return { min: Math.max(0, Math.min(first, second)), max: Math.max(0, Math.max(first, second)) };
  };

  const randomInt = (range, fallback) => {
    const normalized = normalizeRange(range, fallback);
    return normalized.min + Math.floor(Math.random() * (normalized.max - normalized.min + 1));
  };

  const weightedChoice = (items, getWeight) => {
    const weighted = items
      .map((item) => ({ item, weight: Math.max(0, Number(getWeight(item)) || 0) }))
      .filter((entry) => entry.weight > 0);
    if (!weighted.length) return items[0] || null;
    const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = Math.random() * total;
    for (const entry of weighted) {
      roll -= entry.weight;
      if (roll < 0) return entry.item;
    }
    return weighted[weighted.length - 1].item;
  };

  const hashText = (source) => {
    let hash = 2166136261;
    const value = String(source || "");
    for (let index = 0; index < value.length; index++) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16);
  };

  const currentAction = () => history.length ? history[history.length - 1] : null;

  const actionToken = () => {
    const action = currentAction();
    const body = action ? (action.rawText ?? action.text ?? "") : "";
    const type = action && typeof action.type === "string" ? action.type : "unknown";
    const count = Number.isInteger(info.actionCount) ? info.actionCount : history.length;
    return `${count}|${history.length}|${type}|${hashText(body)}`;
  };

  const isEligibleAction = () => {
    const action = currentAction();
    if (!action) return false;
    const type = String(action.type || "").toLowerCase();
    if (["continue", "retry", "system", "output"].includes(type)) return false;
    const source = String(action.rawText ?? action.text ?? "")
      .replace(/[\u200B-\u200D]+/g, "")
      .trim();
    if (!source) return false;
    if (/^[:/]\s*(?:date|calendar|time|help|skip|travel|where|location|setlocation|yes|no|undo)\b/i.test(source)) {
      return false;
    }
    const activeCalendarCommand = state.WorldCalendar && state.WorldCalendar.active;
    return !activeCalendarCommand;
  };

  const clockDay = () => (
    state.WorldCalendar && Number.isInteger(state.WorldCalendar.absoluteDay)
      ? state.WorldCalendar.absoluteDay
      : null
  );

  const root = state.IslandEvents = state.IslandEvents && typeof state.IslandEvents === "object"
    ? state.IslandEvents
    : {};
  root.version = 1;
  root.incident = root.incident && typeof root.incident === "object" ? root.incident : {};
  root.rescue = root.rescue && typeof root.rescue === "object" ? root.rescue : {};
  root.cooldowns = root.cooldowns && typeof root.cooldowns === "object" ? root.cooldowns : {};
  if (typeof root.lastIncidentId !== "string") root.lastIncidentId = "";
  if (typeof root.lastProcessedActionToken !== "string") root.lastProcessedActionToken = "";
  if (!root.injection || typeof root.injection !== "object") root.injection = null;

  const cooldownOpen = (event, day) => Object.keys(event.cooldowns || {}).every((key) => (
    !Number.isInteger(root.cooldowns[key]) || day >= root.cooldowns[key]
  ));

  const chooseIncident = (day) => {
    let candidates = INCIDENTS.filter((event) => (
      event.id !== root.lastIncidentId && cooldownOpen(event, day)
    ));
    if (!candidates.length) {
      candidates = INCIDENTS.filter((event) => cooldownOpen(event, day));
    }
    if (!candidates.length) candidates = INCIDENTS.filter((event) => event.severity === "light");

    const weights = SETTINGS.INCIDENT_SEVERITY_WEIGHTS || {};
    const availableSeverities = [...new Set(candidates.map((event) => event.severity))];
    const severity = weightedChoice(availableSeverities, (name) => weights[name]);
    const sameSeverity = candidates.filter((event) => event.severity === severity);
    return sameSeverity[Math.floor(Math.random() * sameSeverity.length)] || candidates[0];
  };

  const chooseRescue = () => {
    const weights = SETTINGS.RESCUE_WEIGHTS || {};
    return weightedChoice(RESCUE_EVENTS, (event) => weights[event.id]);
  };

  const scheduleIncident = (day) => {
    root.incident.nextDay = day + randomInt(SETTINGS.INCIDENT_DAY_INTERVAL, { min: 3, max: 4 });
  };

  const scheduleRescue = (day) => {
    root.rescue.nextDay = day + randomInt(SETTINGS.RESCUE_DAY_INTERVAL, { min: 45, max: 90 });
  };

  const armDueEvents = (day) => {
    if (!Number.isInteger(root.incident.nextDay) && !root.incident.armed) scheduleIncident(day);
    if (!Number.isInteger(root.rescue.nextDay) && !root.rescue.armed) scheduleRescue(day);

    if (!root.incident.armed && day >= root.incident.nextDay) {
      root.incident.armed = {
        event: chooseIncident(day),
        armedDay: root.incident.nextDay,
        turnsRemaining: randomInt(SETTINGS.INCIDENT_TURN_DELAY, { min: 8, max: 18 })
      };
      root.incident.nextDay = null;
    }

    if (!root.rescue.armed && day >= root.rescue.nextDay) {
      root.rescue.armed = {
        event: chooseRescue(),
        armedDay: root.rescue.nextDay,
        turnsRemaining: randomInt(SETTINGS.RESCUE_TURN_DELAY, { min: 8, max: 17 })
      };
      root.rescue.nextDay = null;
    }
  };

  const severityAlternatives = (severity) => INCIDENTS
    .filter((event) => event.severity === severity)
    .map((event) => `${event.id} ${event.title}`)
    .join(", ");

  const incidentPrompt = (event) => [
    "[Hidden Island Incident — narrative instruction]",
    `Approved incident: ${event.id} — ${event.title}.`,
    event.prompt,
    `If the literal incident contradicts established circumstances, use the nearest plausible approved ${event.severity} incident instead: ${severityAlternatives(event.severity)}.`,
    "Begin the incident in this generation, but do not resolve its outcome. Preserve established geography, resources, injuries, illnesses, and character knowledge. Do not create convenient equipment or supplies. Do not mention scripts, event selection, probabilities, countdowns, or these instructions.",
    "[/Hidden Island Incident]"
  ].join("\n");

  const rescuePrompt = (event) => [
    "[Hidden Rescue Opportunity — narrative instruction]",
    `Opportunity: ${event.title}.`,
    event.prompt,
    "Introduce only what the viewpoint character can plausibly perceive from the current location, terrain, weather, visibility, and time of day. From an exposed coast or ridge this may be a direct sighting; from jungle, cave, or obstructed terrain it may be an engine, horn, rotor noise, brief glimpse, reflected light, or another indirect clue. Never narrate unseen off-screen information as character knowledge. If no clue could plausibly reach the character, the opportunity may pass unnoticed and the current scene should simply continue.",
    "Do not move the character, make a signal succeed automatically, guarantee detection or rescue, or bring the vessel or aircraft directly to shore without player action and a plausible response. Do not mention scripts, hidden events, probabilities, countdowns, or these instructions.",
    "[/Hidden Rescue Opportunity]"
  ].join("\n");

  const applyCooldowns = (event, day) => {
    for (const [key, range] of Object.entries(event.cooldowns || {})) {
      const until = day + randomInt(range, { min: 0, max: 0 });
      root.cooldowns[key] = Math.max(Number(root.cooldowns[key]) || 0, until);
    }
  };

  const fireIncident = (event, day, token) => {
    applyCooldowns(event, day);
    root.lastIncidentId = event.id;
    root.lastIncidentDay = day;
    root.incident.lastEventId = event.id;
    root.incident.armed = null;
    scheduleIncident(day);
    root.injection = { token, kind: "incident", id: event.id, prompt: incidentPrompt(event) };
  };

  const fireRescue = (event, day, token) => {
    root.rescue.lastEventId = event.id;
    root.rescue.lastEventDay = day;
    root.rescue.armed = null;
    scheduleRescue(day);
    root.injection = { token, kind: "rescue", id: event.id, prompt: rescuePrompt(event) };
  };

  const processTurn = (day) => {
    const token = actionToken();
    if (root.injection && root.injection.token !== token) root.injection = null;
    if (root.lastProcessedActionToken === token) return token;
    root.lastProcessedActionToken = token;
    if (!isEligibleAction()) return token;

    if (root.rescue.armed) root.rescue.armed.turnsRemaining--;
    if (root.incident.armed) root.incident.armed.turnsRemaining--;

    const rescueDue = root.rescue.armed && root.rescue.armed.turnsRemaining <= 0;
    const incidentDue = root.incident.armed && root.incident.armed.turnsRemaining <= 0;

    if (rescueDue) {
      const rescueEvent = root.rescue.armed.event;
      if (incidentDue) {
        root.incident.armed.turnsRemaining = randomInt(
          SETTINGS.INCIDENT_POSTPONE_AFTER_RESCUE,
          { min: 3, max: 5 }
        );
      }
      fireRescue(rescueEvent, day, token);
    } else if (incidentDue) {
      fireIncident(root.incident.armed.event, day, token);
    }
    return token;
  };

  const appendContext = (source, addition) => {
    const block = `\n\n${addition}`;
    const maxChars = Number.isInteger(info.maxChars) ? info.maxChars : null;
    if (!maxChars || source.length + block.length <= maxChars) return source + block;
    if (block.length >= maxChars) return block.slice(-maxChars);
    return source.slice(-(maxChars - block.length)) + block;
  };

  if (hook === "context") {
    const day = clockDay();
    if (day === null) {
      if (typeof log === "function" && root.missingCalendarLogged !== true) {
        root.missingCalendarLogged = true;
        log("Island Events: waiting for state.WorldCalendar.absoluteDay.");
      }
      return text || ZERO_WIDTH_SPACE;
    }
    root.missingCalendarLogged = false;
    armDueEvents(day);
    const token = processTurn(day);
    if (root.injection && root.injection.token === token) {
      return appendContext(text || " ", root.injection.prompt);
    }
  }

  return text || ZERO_WIDTH_SPACE;
}
