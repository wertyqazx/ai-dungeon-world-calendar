// Auto-Cards processes context before the World Calendar overlay.
const modifier = (text) => {
  [text, stop] = AutoCards("context", text, stop);
  text = WorldCalendar("context", text);
  return { text, stop };
};

modifier(text);
