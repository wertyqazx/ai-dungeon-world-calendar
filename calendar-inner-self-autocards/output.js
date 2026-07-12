// Inner Self and Auto-Cards run exactly as in their official Output wrapper.
InnerSelf("output");

// World Calendar performs its output formatting afterward.
const modifier = (text) => ({ text: WorldCalendar("output", text) });

modifier(text);
