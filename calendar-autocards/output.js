// Auto-Cards processes output before the World Calendar overlay.
const modifier = (text) => {
  text = AutoCards("output", text);
  text = WorldCalendar("output", text);
  return { text };
};

modifier(text);
