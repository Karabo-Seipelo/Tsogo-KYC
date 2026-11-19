// R-07.7: one switch for the banner and for noindex.
export function demoModeEnabled(mode = process.env.DEMO_MODE) {
  return mode === undefined || mode === "true";
}
