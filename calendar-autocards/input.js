// Auto-Cards processes input before the World Calendar overlay.
const modifier = (text) => {
  text = AutoCards("input", text);
  text = WorldCalendar("input", text);
  return { text };
};

modifier(text);
