// Paste this file into the AI Dungeon "Context" script tab.
const modifier = (text) => {
  return { text: WorldCalendar("context", text) };
};

modifier(text);
