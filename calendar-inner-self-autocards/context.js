// Inner Self and Auto-Cards run exactly as in their official Context wrapper.
InnerSelf("context");

// World Calendar appends its authoritative state afterward.
const modifier = (text) => ({ text: WorldCalendar("context", text), stop });

modifier(text);
