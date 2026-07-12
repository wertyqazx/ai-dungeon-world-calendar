const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const root = "calendar-inner-self-autocards";
const library = fs.readFileSync(`${root}/library.js`, "utf8");
const upstreamInnerSelf = fs.readFileSync(
  `${root}/vendor/inner-self/src/library.js`,
  "utf8"
).trimEnd();

assert.ok(
  library.includes(upstreamInnerSelf),
  "The combined build must contain the unmodified Inner Self source"
);

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

function run(runtime, hook, text, stop = false) {
  runtime.text = text;
  runtime.stop = stop;
  if (hook === "context") {
    runtime.info.maxChars = 12000;
    runtime.info.memoryLength = 0;
  } else {
    delete runtime.info.maxChars;
    delete runtime.info.memoryLength;
  }
  runtime.InnerSelf(hook);
  runtime.text = runtime.WorldCalendar(hook, runtime.text);
  const result = { text: runtime.text };
  if (hook === "context") result.stop = runtime.stop === true;
  return result;
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
  const normal = submit(runtime, "You greet Mira.", "Mira looks up and smiles.");
  assert.equal(typeof normal.input.text, "string");
  assert.equal(typeof normal.context.text, "string");
  assert.equal(typeof normal.context.stop, "boolean");
  assert.ok(runtime.state.WorldCalendar);
  assert.ok(runtime.state.InnerSelf);
  assert.ok(runtime.storyCards.some((card) => card.title === "World Calendar"));
  assert.ok(runtime.storyCards.some((card) => card.title === "Custom Events"));
  assert.ok(runtime.storyCards.some((card) => /Configure\s+Inner Self/i.test(card.title)));
  assert.equal(runtime.storyCards.find((card) => card.title === "World Calendar").type, "calendar");
  assert.equal(runtime.storyCards.find((card) => card.title === "Custom Events").type, "events");
  assert.match(runtime.storyCards.find((card) => card.title === "World Calendar").description, /Don't forget to use :skip night/);
  assert.match(normal.context.text, /World Time/);

  const help = submit(runtime, ":help", "Calendar help requested.");
  assert.match(help.output.text, /Don't forget to use :skip night/);
  assert.match(help.output.text, /World Calendar Commands\n\nIMPORTANT/);
  assert.ok(help.output.text.indexOf("Don't forget to use :skip night") < help.output.text.indexOf("Use one universal command"));
  assert.doesNotMatch(runtime.logs.join("\n"), /unexpected error|cannot read|typeerror/i);

  const autoCards = submit(runtime, "/AC", "Auto-Cards is enabled.");
  assert.equal(typeof autoCards.context.stop, "boolean");
  assert.ok(runtime.state.AutoCards);
  assert.ok(runtime.storyCards.some((card) => /Configure\s+Auto-Cards/i.test(card.title)));
  assert.doesNotMatch(runtime.logs.join("\n"), /unexpected error|cannot read|typeerror/i);
}

{
  const runtime = buildRuntime();
  submit(runtime, "You wait beside the road.", "The afternoon remains quiet.");
  const skip = submit(runtime, ":skip 1 day", "One day passes on the road.");
  assert.match(skip.output.text, /Time Skip:/);

  runtime.history.push({ type: "continue", text: skip.output.text, rawText: skip.output.text });
  runtime.info.actionCount += 1;
  const continued = run(runtime, "context", "Continue after the completed skip");
  assert.equal(typeof continued.text, "string");
}

{
  for (const file of ["input.js", "context.js", "output.js"]) {
    const runtime = buildRuntime();
    runtime.text = file === "context.js" ? "Recent Story:\nTest" : "Test";
    runtime.stop = false;
    if (file === "context.js") runtime.info.maxChars = 12000;
    else delete runtime.info.maxChars;
    const result = vm.runInContext(fs.readFileSync(`${root}/${file}`, "utf8"), runtime);
    assert.equal(typeof result.text, "string");
    if (file === "context.js") assert.equal(typeof result.stop, "boolean");
  }
}

console.log("Combined World Calendar + Inner Self integration tests passed.");
