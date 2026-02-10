export const ROUTES = ["home", "results", "recipe", "generate", "store", "downloads", "about"];

export function setRoute(state, patch) {
  Object.assign(state, patch);
}
