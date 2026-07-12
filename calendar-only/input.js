// Paste this file into the AI Dungeon "Input" script tab.
const modifier = (text) => {
  return { text: WorldCalendar("input", text) };
};

modifier(text);
