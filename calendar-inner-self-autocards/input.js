// Inner Self and Auto-Cards run exactly as in their official Input wrapper.
InnerSelf("input");

// World Calendar runs as a separate overlay modifier.
const modifier = (text) => ({ text: WorldCalendar("input", text) });

modifier(text);
