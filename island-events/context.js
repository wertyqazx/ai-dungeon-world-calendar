// Run this after the WC + Inner Self + Auto-Cards Context wrapper so that a
// due event remains close to the end of the model context.
const modifier = (text) => ({ text: IslandEvents("context", text), stop });

modifier(text);
