const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const library = fs.readFileSync("calendar-only/library.js", "utf8");

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
  const date = submit(runtime, ":date");
  assert.match(date.output, /1 January 1000 AE/);
  assert.match(date.context, /Current location: Hearthport, Example Kingdom, Western Lands/);
  assert.equal(card(runtime, "World Calendar").type, "class");
  assert.equal(card(runtime, "Custom Events").type, "events");
  assert.equal(runtime.WorldCalendarSettings.ENABLE_TRAVEL, false);
  assert.match(card(runtime, "World Calendar").description, /Don't forget to use :skip night/);
  assert.match(card(runtime, "World Calendar").description, /Story actions, not Do or Say actions/);
  assert.match(card(runtime, "World Calendar").description, /Auto-Skip Limit: 7 days/);
  assert.match(card(runtime, "World Calendar").description, /Complete Full Route Immediately: false/);

  const help = submit(runtime, ":help");
  assert.match(help.output, /Don't forget to use :skip night/);
  assert.match(help.output, /Story actions, not Do or Say actions/);
  assert.match(help.output, /World Calendar Commands\n\nIMPORTANT/);
  assert.ok(help.output.indexOf("Don't forget to use :skip night") < help.output.indexOf("Use one universal command"));
  assert.doesNotMatch(help.output, /:travel/);
  assert.match(help.output, /Travel is disabled in this scenario/);

  const beforeTravel = runtime.state.WorldCalendar.absoluteDay;
  const disabled = submit(runtime, ":travel Rivergate");
  assert.match(disabled.output, /Travel is disabled/);
  assert.equal(runtime.state.WorldCalendar.absoluteDay, beforeTravel);
  assert.equal(runtime.state.WorldCalendar.location.name, "Hearthport");

  const customLocation = submit(runtime, ":setlocation My Village");
  assert.match(customLocation.output, /My Village/);
  assert.equal(runtime.state.WorldCalendar.location.name, "My Village");
}

{
  const runtime = buildRuntime();
  runtime.WorldCalendarSettings.ENABLE_TRAVEL = true;
  const preview = submit(runtime, ":travel Rivergate", "The road reaches Rivergate.");
  assert.match(preview.output, /Confirm Journey/);
  assert.match(preview.output, /Full route: ➤ Hearthport → Rivergate/);
  assert.match(preview.output, /Remaining planned travel time: 14 days/);
  assert.equal(runtime.state.WorldCalendar.location.name, "Hearthport");
  const journey = submit(runtime, ":yes", "The road reaches Rivergate.");
  assert.match(journey.output, /Travel time: 14 days/);
  assert.match(journey.output, /Arrival date: 15 January 1000 AE/);
  assert.equal(runtime.state.WorldCalendar.location.name, "Rivergate");

  const help = submit(runtime, ":help");
  assert.match(help.output, /:travel <destination>/);
  assert.match(help.output, /Available destinations are configured by the scenario creator/);
  assert.match(help.output, /custom starting point/);
  assert.match(help.output, /:setlocation <place, region or continent>/);

  assert.equal(runtime.WorldCalendarSettings.TRAVEL_NODES.length, 4);
  assert.equal(runtime.WorldCalendarSettings.TRAVEL_EDGES.length, 4);
}

{
  const runtime = buildRuntime();
  runtime.WorldCalendarSettings.ENABLE_TRAVEL = true;
  const corrected = submit(runtime, ":setlocation Old Ruins, Western Lands");
  assert.match(corrected.output, /Old Ruins, Western Lands/);

  const preview = submit(runtime, ":travel Rivergate", "The road reaches Rivergate.");
  assert.match(preview.output, /Old Ruins, Western Lands → Hearthport → Rivergate/);
  assert.match(preview.output, /estimated 1-day journey to Hearthport/);
  submit(runtime, ":yes", "The road reaches Hearthport.");
  assert.equal(runtime.state.WorldCalendar.location.name, "Hearthport");
  const continuation = submit(runtime, ":travel continue");
  assert.match(continuation.output, /✓ Old Ruins, Western Lands → ➤ Hearthport → Rivergate/);
  const journey = submit(runtime, ":yes", "The road reaches Rivergate.");
  assert.match(journey.output, /Travel time: 14 days/);
  assert.equal(runtime.state.WorldCalendar.location.name, "Rivergate");
}

{
  const runtime = buildRuntime();
  runtime.WorldCalendarSettings.START_DATE = { year: 42, month: 7, day: 9 };
  runtime.WorldCalendarSettings.ERA = "CE";
  const date = submit(runtime, ":date");
  assert.match(date.output, /9 July 42 CE/);
}

{
  const runtime = buildRuntime();
  runtime.state.placeholders = [{ question: "Starting area", answer: "Sunharbor, Coastal Republic" }];
  const where = submit(runtime, ":where");
  assert.match(where.output, /Sunharbor, Coastal Republic, Southern Shores/);
}

{
  const runtime = buildRuntime();
  submit(runtime, ":date");
  const calendar = card(runtime, "World Calendar");
  calendar.entry = calendar.entry.replace(/^Date:.*$/m, "Date: 13 May 1002 AE");
  const context = runtime.WorldCalendar("context", "Continue after editing the card");
  assert.match(context, /Current date: 13 May 1002 AE/);

  const editor = card(runtime, "Custom Events");
  editor.entry = [
    "Custom Events",
    "=== CUSTOM EVENTS ===",
    "yearly | 14 May | Founder's Birthday | 1 day",
    "once | 15 May 1002 | Market Opening | 1 day",
    "=== END CUSTOM EVENTS ==="
  ].join("\n");
  runtime.WorldCalendar("context", "Read custom events");

  const birthday = submit(runtime, ":skip 1 day", "The birthday begins.");
  assert.match(birthday.output, /Founder's Birthday/);
  assert.ok(card(runtime, "Founder's Birthday").keys.endsWith(",you "));

  const market = submit(runtime, ":skip 1 day", "The market opens.");
  assert.match(market.output, /Market Opening/);
  assert.ok(card(runtime, "Market Opening").keys.endsWith(",you "));
  assert.ok(!card(runtime, "Founder's Birthday").keys.endsWith(",you "));
}

{
  const runtime = buildRuntime();
  const first = submit(runtime, ":skip 5 days", "Five days pass.");
  const resultingDay = runtime.state.WorldCalendar.absoluteDay;
  runtime.history.push({ type: "continue", text: first.output, rawText: first.output });
  runtime.info.actionCount += 1;
  const context = runtime.WorldCalendar("context", "Continue normally");
  const output = runtime.WorldCalendar("output", "The story resumes.");
  assert.doesNotMatch(context, /Elapsed time: 5 days/);
  assert.equal(output, "The story resumes.");
  assert.equal(runtime.state.WorldCalendar.absoluteDay, resultingDay);
}

{
  const runtime = buildRuntime();
  const before = runtime.state.WorldCalendar?.absoluteDay;
  const preview = submit(runtime, ":skip 10 days");
  const startingDay = runtime.state.WorldCalendar.absoluteDay;
  assert.match(preview.output, /Confirm Time Skip/);
  assert.match(preview.output, /\(:yes\/:no\)/);
  assert.equal(startingDay, before ?? startingDay);
  const cancelled = submit(runtime, ":no");
  assert.match(cancelled.output, /Cancelled/);
  assert.equal(runtime.state.WorldCalendar.absoluteDay, startingDay);
  submit(runtime, ":skip 10 days");
  submit(runtime, ":yes", "Ten days pass.");
  assert.equal(runtime.state.WorldCalendar.absoluteDay, startingDay + 10);
  const undone = submit(runtime, ":undo");
  assert.match(undone.output, /Undo Complete/);
  assert.equal(runtime.state.WorldCalendar.absoluteDay, startingDay);
}

{
  const runtime = buildRuntime();
  runtime.WorldCalendarSettings.ENABLE_TRAVEL = true;
  const before = submit(runtime, ":date");
  const startingDay = runtime.state.WorldCalendar.absoluteDay;
  const preview = submit(runtime, ":travel Eastwatch");
  assert.match(preview.output, /Full route: ➤ Hearthport → Sunharbor → Eastwatch/);
  assert.match(preview.output, /Stages: 2/);
  assert.match(preview.output, /Remaining planned travel time: 38 days/);
  submit(runtime, ":yes", "The ship reaches Sunharbor.");
  assert.equal(runtime.state.WorldCalendar.location.name, "Sunharbor");
  assert.equal(runtime.state.WorldCalendar.absoluteDay, startingDay + 20);
  const continuation = submit(runtime, ":travel continue");
  assert.match(continuation.output, /✓ Hearthport → ➤ Sunharbor → Eastwatch/);
  assert.match(continuation.output, /Remaining planned travel time: 18 days/);
  assert.match(continuation.output, /Travel mode: sea/);
  void before;
}

{
  const runtime = buildRuntime();
  runtime.WorldCalendarSettings.ENABLE_TRAVEL = true;
  submit(runtime, ":date");
  const calendar = card(runtime, "World Calendar");
  calendar.description = calendar.description.replace(
    "Complete Full Route Immediately: false",
    "Complete Full Route Immediately: true"
  );
  const startingDay = runtime.state.WorldCalendar.absoluteDay;
  const preview = submit(runtime, ":travel Eastwatch");
  assert.match(preview.output, /Confirm Full Journey/);
  assert.match(preview.output, /Stages to complete: 2/);
  assert.equal(runtime.state.WorldCalendar.location.name, "Hearthport");
  const completed = submit(runtime, ":yes", "The entire journey passes.");
  assert.match(completed.output, /\[Full Journey:/);
  assert.equal(runtime.state.WorldCalendar.location.name, "Eastwatch");
  assert.equal(runtime.state.WorldCalendar.absoluteDay, startingDay + 38);
  assert.equal(runtime.state.WorldCalendar.activeRoute, null);
  submit(runtime, ":undo");
  assert.equal(runtime.state.WorldCalendar.location.name, "Hearthport");
  assert.equal(runtime.state.WorldCalendar.absoluteDay, startingDay);
}

{
  const wrappers = ["input.js", "context.js", "output.js"];
  for (const filename of wrappers) {
    const runtime = buildRuntime();
    runtime.text = filename === "context.js" ? "Recent Story:\nTest" : ":date";
    const result = vm.runInContext(fs.readFileSync(`calendar-only/${filename}`, "utf8"), runtime);
    assert.equal(typeof result.text, "string");
  }
}

assert.doesNotMatch(library, /Estoria|Ashara|Ferai|Valebrook|Qadreth|ALD|%NWT_/);
console.log("World Calendar public tests passed.");
