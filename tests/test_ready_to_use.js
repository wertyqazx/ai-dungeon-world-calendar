const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const root = "ready-to-use";
const library = fs.readFileSync(`${root}/library.js`, "utf8");

function buildRuntime() {
  const runtime = {
    state: {},
    info: { actionCount: 0, maxChars: 12000, memoryLength: 0 },
    history: [],
    storyCards: [],
    logs: []
  };
  runtime.log = (message) => runtime.logs.push(String(message));
  runtime.addStoryCard = (keys, entry, type, title, description) => {
    runtime.storyCards.push({
      id: runtime.storyCards.length + 1,
      keys,
      entry,
      type,
      title: title || "",
      description: description || ""
    });
    return runtime.storyCards.length - 1;
  };
  runtime.updateStoryCard = (index, keys, entry, type) => {
    Object.assign(runtime.storyCards[index], { keys, entry, type });
  };
  runtime.removeStoryCard = (index) => runtime.storyCards.splice(index, 1);
  runtime.globalThis = runtime;
  vm.createContext(runtime);
  vm.runInContext(library, runtime);
  return runtime;
}

function submit(runtime, rawInput, modelOutput = "The story continues.") {
  const modified = runtime.WorldCalendar("input", rawInput);
  runtime.history.push({ type: "story", text: modified, rawText: modified });
  runtime.info.actionCount += 1;
  const context = runtime.WorldCalendar("context", `Recent Story:\n${modified}`);
  const output = runtime.WorldCalendar("output", modelOutput);
  return { modified, context, output };
}

function card(runtime, title) {
  return runtime.storyCards.find((item) => item.title === title);
}

{
  const runtime = buildRuntime();
  const status = submit(runtime, ":date");

  assert.match(status.output, /1 January 1000 AD/);
  assert.match(status.context, /Current location: Unknown Location\./);
  assert.match(status.context, /Current weather:/);
  assert.match(status.context, /Current temperature: -?\d+°C\./);
  assert.doesNotMatch(status.context, /Current region:/);
  assert.equal(runtime.WorldCalendarSettings.ENABLE_TRAVEL, false);
  assert.equal(runtime.WorldCalendarSettings.START_LOCATION, null);
  assert.equal(runtime.WorldCalendarSettings.LOCATION_GROUPS.length, 0);
  assert.equal(runtime.WorldCalendarSettings.TRAVEL_NODES.length, 0);
  assert.equal(runtime.WorldCalendarSettings.TRAVEL_EDGES.length, 0);
  assert.equal(runtime.WorldCalendarSettings.RECURRING_FESTIVALS.length, 0);
  assert.equal(runtime.WorldCalendarSettings.SCHEDULED_EVENTS.length, 0);

  const calendar = card(runtime, "World Calendar");
  const customEvents = card(runtime, "Custom Events");
  assert.match(calendar.description, /default date, 1 January 1000 AD, is a neutral placeholder/i);
  assert.match(calendar.description, /full calendar experience/i);
  assert.match(calendar.description, /No holidays are included by default/i);
  assert.match(customEvents.description, /full calendar experience/i);
  assert.doesNotMatch(customEvents.entry, /^(?!#).*(?:yearly|once)\s*\|/mi);

  const help = submit(runtime, ":help");
  assert.match(help.output, /replace the default 1 January 1000 AD/i);
  assert.match(help.output, /Custom Events Story Card/i);
  assert.match(help.output, /No holidays are included by default/i);
  assert.match(help.output, /Travel is not included in the Ready-to-Use Edition/i);
  assert.doesNotMatch(help.output, /:travel/);
}

{
  const runtime = buildRuntime();
  submit(runtime, ":date");
  const calendar = card(runtime, "World Calendar");
  calendar.entry = calendar.entry.replace(/^Date:.*$/m, "Date: 23 March 2457 Fifth Era");
  const edited = runtime.WorldCalendar("context", "Continue after calendar setup");
  assert.match(edited, /Current date: 23 March 2457 Fifth Era\./);
  assert.equal(runtime.state.WorldCalendar.era, "Fifth Era");

  calendar.entry = calendar.entry.replace(/^Date:.*$/m, "Date: 23 March 2457 CE");
  const eraOnlyEdit = runtime.WorldCalendar("context", "Continue after changing the era");
  assert.match(eraOnlyEdit, /Current date: 23 March 2457 CE\./);
  assert.equal(runtime.state.WorldCalendar.era, "CE");
}

{
  const runtime = buildRuntime();
  const first = submit(runtime, ":date");
  const weather = first.context.match(/Current weather: ([^.]+)\./)?.[1];
  const temperature = first.context.match(/Current temperature: (-?\d+°C)\./)?.[1];
  const relocated = submit(runtime, ":setlocation Frostmere");
  assert.match(relocated.context, new RegExp(`Current weather: ${weather}\\.`));
  assert.match(relocated.context, new RegExp(`Current temperature: ${temperature}\\.`));

  const disabled = submit(runtime, ":travel Anywhere");
  assert.match(disabled.output, /Travel is disabled/);
}

{
  for (const filename of ["input.js", "context.js", "output.js"]) {
    const runtime = buildRuntime();
    runtime.text = filename === "context.js" ? "Recent Story:\nTest" : ":date";
    const result = vm.runInContext(fs.readFileSync(`${root}/${filename}`, "utf8"), runtime);
    assert.equal(typeof result.text, "string");
  }
}

assert.doesNotMatch(library, /Hearthport|Rivergate|Example Kingdom|Coastal Republic|Frontier League/);
console.log("Ready-to-Use published-script tests passed.");
