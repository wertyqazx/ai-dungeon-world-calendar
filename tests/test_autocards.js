const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const root = "calendar-autocards";
const library = fs.readFileSync(`${root}/library.js`, "utf8");
const calendarLibrary = fs.readFileSync("calendar-only/library.js", "utf8");

assert.ok(library.includes(calendarLibrary), "Combined builds must share the sanitized calendar core");

function buildRuntime() {
  const runtime = {
    state: {},
    info: { actionCount: 0 },
    history: [],
    storyCards: [],
    logs: [],
    text: " ",
    stop: false
  };
  runtime.log = (message) => runtime.logs.push(String(message));
  runtime.addStoryCard = function (keys, entry, type, title, description) {
    const legacyTitleOnly = arguments.length === 1;
    const card = {
      id: runtime.storyCards.length + 1,
      keys: legacyTitleOnly ? "" : (keys || ""),
      entry: entry || "",
      type: type || "",
      title: legacyTitleOnly ? keys : (title || ""),
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

function run(runtime, hook, source, stop = false) {
  let text = source;
  if (hook === "context") {
    runtime.info.maxChars = 12000;
    runtime.info.memoryLength = 0;
    [text, stop] = runtime.AutoCards(hook, text, stop);
  } else {
    delete runtime.info.maxChars;
    delete runtime.info.memoryLength;
    text = runtime.AutoCards(hook, text);
  }
  text = runtime.WorldCalendar(hook, text);
  return { text, stop: stop === true };
}

function submit(runtime, input, modelOutput = "The story continues.") {
  const inputResult = run(runtime, "input", input);
  runtime.history.push({ type: "story", text: inputResult.text, rawText: inputResult.text });
  runtime.info.actionCount += 1;
  const contextResult = run(runtime, "context", `Recent Story:\n${inputResult.text}`);
  const outputResult = contextResult.stop
    ? { text: "", stop: true }
    : run(runtime, "output", modelOutput);
  return { input: inputResult, context: contextResult, output: outputResult };
}

{
  const runtime = buildRuntime();
  const normal = submit(runtime, "You greet a traveler.", "The traveler answers.");
  assert.equal(typeof normal.context.text, "string");
  assert.ok(runtime.state.WorldCalendar);
  assert.ok(runtime.state.AutoCards);
  assert.ok(runtime.storyCards.some((card) => card.title === "World Calendar"));
  assert.ok(runtime.storyCards.some((card) => card.title === "Custom Events"));
  assert.ok(runtime.storyCards.some((card) => /Configure\s+Auto-Cards/i.test(card.title)));
  assert.match(normal.context.text, /World Time/);
  assert.doesNotMatch(runtime.logs.join("\n"), /unexpected error|cannot read|typeerror/i);
}

{
  for (const file of ["input.js", "context.js", "output.js"]) {
    const runtime = buildRuntime();
    runtime.text = file === "context.js" ? "Recent Story:\nTest" : "Test";
    runtime.stop = false;
    if (file === "context.js") runtime.info.maxChars = 12000;
    const result = vm.runInContext(fs.readFileSync(`${root}/${file}`, "utf8"), runtime);
    assert.equal(typeof result.text, "string");
    if (file === "context.js") assert.equal(typeof result.stop, "boolean");
  }
}

assert.doesNotMatch(library, /Estoria|Ashara|Ferai|Valebrook|Qadreth|ALD|%NWT_/);
console.log("World Calendar + Auto-Cards integration tests passed.");
