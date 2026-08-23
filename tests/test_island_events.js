const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const calendarLibrary = fs.readFileSync("calendar-only/library.js", "utf8");
const islandLibrary = fs.readFileSync("island-events/library.js", "utf8");

function buildRuntime() {
  const runtime = {
    state: {},
    info: { actionCount: 0, maxChars: 20000, memoryLength: 0 },
    history: [],
    storyCards: [],
    logs: []
  };
  runtime.log = (message) => runtime.logs.push(String(message));
  runtime.addStoryCard = (keys, entry, type, title, description) => {
    const card = {
      id: runtime.storyCards.length + 1,
      keys,
      entry,
      type,
      title: title || "",
      description: description || ""
    };
    runtime.storyCards.push(card);
    return runtime.storyCards.length - 1;
  };
  runtime.updateStoryCard = (index, keys, entry, type) => {
    Object.assign(runtime.storyCards[index], { keys, entry, type });
  };
  runtime.removeStoryCard = (index) => runtime.storyCards.splice(index, 1);
  runtime.globalThis = runtime;
  vm.createContext(runtime);
  vm.runInContext(calendarLibrary, runtime);
  vm.runInContext(islandLibrary, runtime);
  return runtime;
}

function submit(runtime, rawInput, modelOutput = "The story continues.", type = "story") {
  let modified = runtime.WorldCalendar("input", rawInput);
  modified = runtime.IslandEvents("input", modified);
  runtime.history.push({ type, text: modified, rawText: modified });
  runtime.info.actionCount += 1;
  let context = runtime.WorldCalendar("context", `Recent Story:\n${modified}`);
  context = runtime.IslandEvents("context", context);
  let output = runtime.WorldCalendar("output", modelOutput);
  output = runtime.IslandEvents("output", output);
  return { modified, context, output };
}

function continueAction(runtime) {
  runtime.WorldCalendar("input", "");
  runtime.IslandEvents("input", "");
  runtime.history.push({ type: "continue", text: "Continue", rawText: "Continue" });
  runtime.info.actionCount += 1;
  let context = runtime.WorldCalendar("context", "Recent Story:\nContinue");
  context = runtime.IslandEvents("context", context);
  runtime.WorldCalendar("output", "The story continues.");
  runtime.IslandEvents("output", "The story continues.");
  return context;
}

{
  const runtime = buildRuntime();
  runtime.IslandEventsSettings.INCIDENT_DAY_INTERVAL = { min: 3, max: 3 };
  runtime.IslandEventsSettings.INCIDENT_TURN_DELAY = { min: 2, max: 2 };
  runtime.IslandEventsSettings.RESCUE_DAY_INTERVAL = { min: 90, max: 90 };

  const initial = submit(runtime, ":date");
  const day = runtime.state.WorldCalendar.absoluteDay;
  assert.equal(runtime.state.IslandEvents.incident.nextDay, day + 3);
  assert.equal(runtime.state.IslandEvents.rescue.nextDay, day + 90);
  assert.doesNotMatch(initial.output, /Hidden Island Incident|Hidden Rescue Opportunity/);

  const preview = submit(runtime, ":skip 10 days");
  assert.match(preview.output, /Confirm Time Skip/);
  assert.doesNotMatch(preview.output, /Tropical Squall|Snake|Incident/);
  const skipped = submit(runtime, ":yes", "Ten days pass.");
  assert.equal(runtime.state.WorldCalendar.absoluteDay, day + 10);
  assert.ok(runtime.state.IslandEvents.incident.armed);
  assert.equal(runtime.state.IslandEvents.incident.armed.turnsRemaining, 2);
  assert.doesNotMatch(skipped.output, /Hidden Island Incident|Approved incident/);

  const firstTurn = submit(runtime, "I inspect the camp.");
  assert.doesNotMatch(firstTurn.context, /Hidden Island Incident/);
  assert.equal(runtime.state.IslandEvents.incident.armed.turnsRemaining, 1);

  const eventTurn = submit(runtime, "I begin gathering materials.");
  assert.match(eventTurn.context, /Hidden Island Incident/);
  assert.match(eventTurn.context, /Approved incident: (?:L1|L2|L8|L10|M1|M2|M3|M5|H1|H2|H3|H4)/);
  assert.doesNotMatch(eventTurn.output, /Hidden Island Incident/);
  const injection = runtime.state.IslandEvents.injection.prompt;

  let retryContext = runtime.WorldCalendar("context", "Recent Story:\nRetry");
  retryContext = runtime.IslandEvents("context", retryContext);
  assert.ok(retryContext.includes(injection));

  const nextTurn = submit(runtime, "I respond to the problem.");
  assert.doesNotMatch(nextTurn.context, /Hidden Island Incident/);
  assert.equal(runtime.state.IslandEvents.incident.nextDay, day + 13);
}

{
  const runtime = buildRuntime();
  runtime.IslandEventsSettings.INCIDENT_TURN_DELAY = { min: 2, max: 2 };
  runtime.IslandEventsSettings.RESCUE_DAY_INTERVAL = { min: 999, max: 999 };
  submit(runtime, ":date");
  const day = runtime.state.WorldCalendar.absoluteDay;
  runtime.state.IslandEvents.incident.nextDay = day;
  runtime.state.IslandEvents.incident.armed = null;

  submit(runtime, ":date");
  assert.equal(runtime.state.IslandEvents.incident.armed.turnsRemaining, 2);
  continueAction(runtime);
  assert.equal(runtime.state.IslandEvents.incident.armed.turnsRemaining, 2);
  submit(runtime, "I check my surroundings.");
  assert.equal(runtime.state.IslandEvents.incident.armed.turnsRemaining, 1);
}

{
  const runtime = buildRuntime();
  runtime.IslandEventsSettings.INCIDENT_TURN_DELAY = { min: 1, max: 1 };
  runtime.IslandEventsSettings.RESCUE_TURN_DELAY = { min: 1, max: 1 };
  runtime.IslandEventsSettings.INCIDENT_POSTPONE_AFTER_RESCUE = { min: 4, max: 4 };
  submit(runtime, ":date");
  const day = runtime.state.WorldCalendar.absoluteDay;
  runtime.state.IslandEvents.incident.nextDay = day;
  runtime.state.IslandEvents.incident.armed = null;
  runtime.state.IslandEvents.rescue.nextDay = day;
  runtime.state.IslandEvents.rescue.armed = null;
  vm.runInContext("Math.random = () => 0.999999", runtime);

  submit(runtime, ":date");
  assert.equal(runtime.state.IslandEvents.rescue.armed.event.id, "search_vessel");
  const eventTurn = submit(runtime, "I reinforce the shelter.");
  assert.match(eventTurn.context, /Hidden Rescue Opportunity/);
  assert.match(eventTurn.context, /Opportunity: Search Vessel/);
  assert.equal(runtime.state.IslandEvents.injection.kind, "rescue");
  assert.equal(runtime.state.IslandEvents.incident.armed.turnsRemaining, 4);
}

{
  const runtime = buildRuntime();
  runtime.IslandEventsSettings.INCIDENT_DAY_INTERVAL = { min: 0, max: 0 };
  runtime.IslandEventsSettings.INCIDENT_TURN_DELAY = { min: 1, max: 1 };
  runtime.IslandEventsSettings.INCIDENT_SEVERITY_WEIGHTS = { light: 0, medium: 0, heavy: 100 };
  runtime.IslandEventsSettings.RESCUE_DAY_INTERVAL = { min: 999, max: 999 };
  vm.runInContext("Math.random = () => 0", runtime);

  submit(runtime, ":date");
  assert.equal(runtime.state.IslandEvents.incident.armed.event.id, "H1");
  const fired = submit(runtime, "I survey the sky.");
  assert.match(fired.context, /Approved incident: H1/);
  const day = runtime.state.WorldCalendar.absoluteDay;
  assert.equal(runtime.state.IslandEvents.cooldowns.heavy, day + 30);
  assert.equal(runtime.state.IslandEvents.cooldowns.weather, day + 30);
}

{
  const runtime = buildRuntime();
  runtime.IslandEventsSettings.RESCUE_WEIGHTS = {
    merchant_ship: 33,
    fishing_vessel: 31,
    sailing_yacht: 27,
    search_aircraft: 4,
    search_helicopter: 2,
    search_vessel: 3
  };
  assert.equal(
    Object.values(runtime.IslandEventsSettings.RESCUE_WEIGHTS).reduce((sum, value) => sum + value, 0),
    100
  );
  assert.equal(
    runtime.IslandEventsSettings.RESCUE_WEIGHTS.search_aircraft +
      runtime.IslandEventsSettings.RESCUE_WEIGHTS.search_helicopter +
      runtime.IslandEventsSettings.RESCUE_WEIGHTS.search_vessel,
    9
  );
}

console.log("Island Events tests passed.");
