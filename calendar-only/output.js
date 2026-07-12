// Paste this file into the AI Dungeon "Output" script tab.
const modifier = (text) => {
  return { text: WorldCalendar("output", text) };
};

modifier(text);
