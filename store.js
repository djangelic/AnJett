const LS_KEYS = {
  community: "anjett.community.v1",
  purchases: "anjett.purchases.v1",
  admin: "anjett.admin.v1"
};

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getCommunity() {
  const existing = loadJSON(LS_KEYS.community, null);
  if (existing) return existing;

  const init = {
    approved: [
      {
        id: "com-7mm-ice-monster",
        kind: "community",
        name: "7mm Ice Monster Pops",
        chef: "ChefJett7",
        tags: ["ice", "funny", "7mm"],
        preview: "It’s small… but it ROARS!",
        need: ["yogurt", "juice", "berries", "molds"],
        stepsLocked: [
          "Mix juice and yogurt (half and half).",
          "Add tiny berry bits.",
          "Freeze in molds.",
          "Roar when you take the first bite."
        ],
        priceCard: 1.99,
        keywords: ["7 millimeters", "7mm", "millimeters", "ice", "monster", "pops"]
      }
    ],
    pending: []
  };

  saveJSON(LS_KEYS.community, init);
  return init;
}

export function saveCommunity(state) {
  saveJSON(LS_KEYS.community, state);
}

export function getPurchases() {
  return loadJSON(LS_KEYS.purchases, []);
}

export function addPurchase(item) {
  const purchases = getPurchases();
  purchases.unshift({ ...item, purchasedAt: new Date().toISOString() });
  saveJSON(LS_KEYS.purchases, purchases);
}

export function clearPurchases() {
  saveJSON(LS_KEYS.purchases, []);
}

export function isAdmin() {
  return loadJSON(LS_KEYS.admin, false) === true;
}

export function toggleAdmin() {
  const next = !isAdmin();
  saveJSON(LS_KEYS.admin, next);
  return next;
}
