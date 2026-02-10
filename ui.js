import { monsterUrl } from "./images.js";
import { OFFICIAL_RECIPES, PACKS, TRENDING } from "./data.js";
import { getCommunity, saveCommunity, getPurchases, addPurchase, clearPurchases, isAdmin } from "./store.js";

const money = (n) => `$${Number(n).toFixed(2)}`;

export function render(appEl, state, helpers) {
  // helpers: { toast, openModal, closeModal }
  if (state.route === "home") return renderHome(appEl, state, helpers);
  if (state.route === "results") return renderResults(appEl, state, helpers);
  if (state.route === "recipe") return renderRecipe(appEl, state, helpers);
  if (state.route === "generate") return renderGenerate(appEl, state, helpers);
  if (state.route === "store") return renderStore(appEl, state, helpers);
  if (state.route === "downloads") return renderDownloads(appEl, state, helpers);
  if (state.route === "about") return renderAbout(appEl, state, helpers);
  return renderHome(appEl, state, helpers);
}

function escapeHTML(s) {
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function allSearchableRecipes() {
  const com = getCommunity();
  const communityApproved = com.approved.map(r => ({ ...r, price: r.priceCard ?? 1.99 }));
  return [...OFFICIAL_RECIPES, ...communityApproved];
}

function searchRecipes(query) {
  const q = (query || "").trim().toLowerCase();
  const com = getCommunity();
  if (!q) {
    return {
      official: OFFICIAL_RECIPES,
      community: com.approved
    };
  }
  const tokens = q.split(/\s+/).filter(Boolean);

  const scoreRecipe = (r) => {
    const hay = [
      r.name,
      r.preview || "",
      ...(r.tags || []),
      ...((r.keywords||[]))
    ].join(" ").toLowerCase();

    let score = 0;
    for (const t of tokens) if (hay.includes(t)) score += 1;
    if ((r.keywords||[]).some(k => k.toLowerCase() === q)) score += 3;
    return score;
  };

  const official = OFFICIAL_RECIPES
    .map(r => ({ r, s: scoreRecipe(r) }))
    .filter(x => x.s > 0)
    .sort((a,b) => b.s - a.s)
    .map(x => x.r);

  const community = com.approved
    .map(r => ({ r, s: scoreRecipe(r) }))
    .filter(x => x.s > 0)
    .sort((a,b) => b.s - a.s)
    .map(x => x.r);

  return { official, community };
}

function cardHTML(r, label) {
  const by = r.kind === "community" ? `<span class="tag">By: ${escapeHTML(r.chef || "Community")}</span>` : "";
  const tags = (r.tags || []).slice(0,4).map(t => `<span class="tag">${escapeHTML(t)}</span>`).join("");
  const price = r.kind === "community" ? (r.priceCard ?? 1.99) : (r.price ?? 2.99);

  const img = monsterUrl(r.id || r.name, 360);

  return `
    <div class="card" data-open="${escapeHTML(r.id)}" role="button" tabindex="0" title="Open recipe">
      <img class="cardImg" src="${img}" alt="Monster for ${escapeHTML(r.name)}" loading="lazy" />
      <h3 class="title">${escapeHTML(r.name)}</h3>
      <div class="muted">${escapeHTML(r.preview || "")}</div>
      <div class="meta">
        <span class="tag">${label}</span>
        ${by}
        <span class="tag">Download ${money(price)}</span>
        ${tags}
      </div>
    </div>
  `;
}

function listItemHTML(title, subtitle, actionText, dataAttr) {
  return `
    <div class="listItem" ${dataAttr}>
      <div>
        <div style="font-weight:900;">${escapeHTML(title)}</div>
        <div class="small">${escapeHTML(subtitle)}</div>
      </div>
      <div class="small">${escapeHTML(actionText)}</div>
    </div>
  `;
}

function downloadTextFile(filename, text) {
  const blob = new Blob([text], {type:"text/plain;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function safeFilename(name) {
  return String(name).replace(/[^\w\s\-]+/g, "").trim().replace(/\s+/g, "-");
}

function recipeCardText(r, includeLocked) {
  const price = r.kind === "community" ? (r.priceCard ?? 1.99) : (r.price ?? 2.99);
  const head = [
    "AnJett.com — Recipe Card",
    "=======================",
    "",
    `Name: ${r.name}`,
    `Type: ${r.kind === "community" ? "Community" : "Official"}`,
    r.kind === "community" ? `Chef: ${r.chef || "Community"}` : "",
    `Tags: ${(r.tags || []).join(", ")}`,
    "",
    "Preview:",
    r.preview || "",
    "",
    "What you’ll need:",
    ...(r.need || []).map(x => `- ${x}`),
    ""
  ].filter(Boolean);

  if (!includeLocked) {
    head.push("LOCKED SECTION: Pay to download for full steps + tips.");
    head.push(`Price: ${money(price)}`);
    return head.join("\n");
  }

  head.push("Full Steps:");
  head.push(...(r.stepsLocked || []).map((s,i) => `${i+1}) ${s}`));
  head.push("");
  head.push("Beast Tips:");
  head.push("- Keep it fun. Keep it safe.");
  head.push("- Ask an adult for heat/sharp tools.");
  head.push("");
  head.push(`Price Paid: ${money(price)} (demo)`);
  return head.join("\n");
}

function packCardText(p) {
  return [
    "AnJett.com — Recipe Pack",
    "=======================",
    "",
    `Pack: ${p.name}`,
    `Price: ${money(p.price)} (demo)`,
    "",
    "Includes:",
    ...p.includes.map(x => `- ${x}`),
    "",
    "Tip: Search the recipe names to find matching cards."
  ].join("\n");
}

async function demoPayAndUnlock(item) {
  const ok = confirm(`DEMO PAYMENT\n\nPay ${money(item.price)} to download:\n${item.name}\n\nClick OK to simulate a successful payment.`);
  if (!ok) return false;

  addPurchase({
    id: item.id,
    name: item.name,
    price: item.price,
    kind: item.kind,
    type: item.type || "recipe"
  });

  return true;
}

function renderHome(appEl, state, helpers) {
  appEl.innerHTML = `
    <div class="hero">
      <h1 class="h1">Pretend Monster Recipes</h1>
      <div class="sub">Search silly recipes, preview them, then pay to download recipe cards. Community can make recipes with <b>Generate Recipe</b>.</div>

      <div class="searchRow">
        <input class="input" id="searchInput" placeholder="Try: 7 millimeters, ice beast, crumbzilla..." value="${escapeHTML(state.query || "")}" />
        <button class="btn" id="searchBtn" type="button">SEARCH</button>
        <button class="btn secondary" id="goGenerateBtn" type="button">GENERATE RECIPE</button>
      </div>

      <div class="chips">
        ${TRENDING.map(t => `<div class="chip" data-chip="${escapeHTML(t)}">${escapeHTML(t)}</div>`).join("")}
      </div>
    </div>

    <div class="section">
      <h2>Featured Today</h2>
      <div class="grid">
        ${OFFICIAL_RECIPES.slice(0,3).map(r => cardHTML(r, "Official")).join("")}
      </div>
    </div>

    <div class="section">
      <h2>Community Spotlight</h2>
      <div class="grid">
        ${getCommunity().approved.slice(0,3).map(r => cardHTML(r, "Community")).join("") || `<div class="panel muted">No community recipes yet — click Generate Recipe to add the first one!</div>`}
      </div>
    </div>
  `;

  const searchInput = appEl.querySelector("#searchInput");
  const doSearch = () => {
    state.query = searchInput.value;
    state.route = "results";
    helpers.rerender();
  };

  appEl.querySelector("#searchBtn").addEventListener("click", doSearch);
  searchInput.addEventListener("keydown", (e) => { if (e.key === "Enter") doSearch(); });

  appEl.querySelector("#goGenerateBtn").addEventListener("click", () => {
    state.route = "generate";
    helpers.rerender();
  });

  appEl.querySelectorAll("[data-chip]").forEach(el => {
    el.addEventListener("click", () => {
      state.query = el.dataset.chip;
      state.route = "results";
      helpers.rerender();
    });
  });

  wireOpenCards(appEl, state, helpers);
}

function renderResults(appEl, state, helpers) {
  const { official, community } = searchRecipes(state.query);
  const q = (state.query || "").trim();

  appEl.innerHTML = `
    <div class="section">
      <h2>Search results for: <span class="muted">"${escapeHTML(q)}"</span></h2>

      <div class="panel">
        <div class="searchRow" style="justify-content:flex-start;">
          <input class="input" id="searchInput" placeholder="Search recipes..." value="${escapeHTML(state.query || "")}" />
          <button class="btn" id="searchBtn" type="button">SEARCH</button>
          <button class="btn secondary" id="clearBtn" type="button">CLEAR</button>
        </div>
        <div class="small" style="margin-top:10px;">Tip: try <b>7 millimeters</b> or <b>ice beast</b>.</div>
      </div>

      <div class="section">
        <h2>Official Recipes</h2>
        <div class="grid">
          ${official.map(r => cardHTML(r, "Official")).join("") || `<div class="panel muted">No official matches.</div>`}
        </div>
      </div>

      <div class="section">
        <h2>Community Recipes</h2>
        <div class="grid">
          ${community.map(r => cardHTML(r, "Community")).join("") || `<div class="panel muted">No community matches.</div>`}
        </div>
      </div>
    </div>
  `;

  const searchInput = appEl.querySelector("#searchInput");
  const doSearch = () => {
    state.query = searchInput.value;
    helpers.rerender();
  };

  appEl.querySelector("#searchBtn").addEventListener("click", doSearch);
  searchInput.addEventListener("keydown", (e) => { if (e.key === "Enter") doSearch(); });

  appEl.querySelector("#clearBtn").addEventListener("click", () => {
    state.query = "";
    state.route = "home";
    helpers.rerender();
  });

  wireOpenCards(appEl, state, helpers);
}

function renderRecipe(appEl, state, helpers) {
  const com = getCommunity();
  const r =
    OFFICIAL_RECIPES.find(x => x.id === state.activeRecipeId) ||
    com.approved.find(x => x.id === state.activeRecipeId) ||
    com.pending.find(x => x.id === state.activeRecipeId) ||
    null;

  if (!r) {
    appEl.innerHTML = `
      <div class="section">
        <div class="panel">
          <div style="font-weight:900;">Recipe not found.</div>
          <div class="muted">Go back and search again.</div>
          <div class="divider"></div>
          <button class="btn" id="goHomeBtn" type="button">GO HOME</button>
        </div>
      </div>
    `;
    appEl.querySelector("#goHomeBtn").addEventListener("click", () => {
      state.route = "home";
      state.activeRecipeId = null;
      helpers.rerender();
    });
    return;
  }

  const price = r.kind === "community" ? (r.priceCard ?? 1.99) : (r.price ?? 2.99);
  const by = r.kind === "community" ? `<span class="tag">By: ${escapeHTML(r.chef || "Community")}</span>` : `<span class="tag">Official</span>`;
  const tags = (r.tags || []).map(t => `<span class="tag">${escapeHTML(t)}</span>`).join("");
  const img = monsterUrl(r.id || r.name, 520);

  appEl.innerHTML = `
    <div class="section">
      <div class="twoCol">
        <div class="panel">
          <img class="cardImg" style="height: 260px;" src="${img}" alt="Monster for ${escapeHTML(r.name)}" loading="lazy" />
          <h2 style="margin:0 0 8px;">${escapeHTML(r.name)}</h2>
          <div class="meta">${by}<span class="tag">Download ${money(price)}</span>${tags}</div>

          <div class="divider"></div>

          <div style="font-weight:900;">Preview (Free)</div>
          <div class="muted" style="margin-top:6px;">${escapeHTML(r.preview || "")}</div>

          <div class="fieldLabel">What you'll need (Preview)</div>
          <div class="list">
            ${(r.need || []).slice(0,6).map(x => `<div class="listItem"><div>${escapeHTML(x)}</div></div>`).join("") || `<div class="muted">No ingredients listed.</div>`}
          </div>

          <div class="divider"></div>

          <div class="lock">
            <div style="font-weight:900;">LOCKED: Full Recipe (Download to unlock)</div>
            <div class="muted" style="margin-top:6px;">Full steps + exact amounts + Beast Tips + printable recipe card.</div>
          </div>

          <div class="divider"></div>

          <div class="searchRow" style="justify-content:flex-start;">
            <button class="btn secondary" id="previewBtn" type="button">PREVIEW CARD</button>
            <button class="btn" id="payBtn" type="button">PAY & DOWNLOAD ${money(price)}</button>
          </div>
          <div class="small" style="margin-top:10px;">For parents/guardians. This demo simulates payment.</div>
        </div>

        <div class="panel">
          <div style="font-weight:900;">More like this</div>
          <div class="muted" style="margin-top:6px;">Click any to open.</div>
          <div class="divider"></div>
          <div class="list">
            ${OFFICIAL_RECIPES.slice(0,4).map(x => listItemHTML(x.name, x.preview, "Open", `data-open="${escapeHTML(x.id)}" style="cursor:pointer;"`)).join("")}
          </div>

          <div class="divider"></div>
          <div style="font-weight:900;">Want to add your own?</div>
          <div class="small">Go to Generate Recipe and submit one to the community.</div>
          <div class="divider"></div>
          <button class="btn secondary" id="goGenerateBtn" type="button">GENERATE RECIPE</button>
        </div>
      </div>
    </div>
  `;

  appEl.querySelector("#previewBtn").addEventListener("click", () => {
    helpers.openModal("Recipe Card Preview", `<pre>${escapeHTML(recipeCardText(r, false))}</pre>`);
  });

  appEl.querySelector("#payBtn").addEventListener("click", async () => {
    const ok = await demoPayAndUnlock({ id: r.id, name: r.name, price, kind: r.kind, type: "recipe" });
    if (!ok) return;

    helpers.toast("Payment success! Download starting...");
    downloadTextFile(`${safeFilename(r.name)}-AnJett-Card.txt`, recipeCardText(r, true));
    state.route = "downloads";
    helpers.rerender();
  });

  appEl.querySelector("#goGenerateBtn").addEventListener("click", () => {
    state.route = "generate";
    helpers.rerender();
  });

  wireOpenCards(appEl, state, helpers);
}

function renderGenerate(appEl, state, helpers) {
  const com = getCommunity();
  const pending = com.pending || [];
  const admin = isAdmin();

  appEl.innerHTML = `
    <div class="section">
      <h2>Generate Recipe</h2>
      <div class="muted">Make your own pretend monster recipe. Submissions go to <b>Pending</b> first.</div>

      <div class="twoCol" style="margin-top:14px;">
        <div class="panel">
          <form id="genForm">
            <div class="fieldLabel">Recipe Name</div>
            <input class="input" name="name" placeholder="Example: Ice Beast" required />

            <div class="fieldLabel">Chef Name (nickname only)</div>
            <input class="input" name="chef" placeholder="Example: ChefJett7" required />

            <div class="fieldLabel">Short Description</div>
            <textarea class="input" name="desc" placeholder="1–2 sentences. Keep it fun!" required></textarea>

            <div class="fieldLabel">Ingredients (one per line)</div>
            <textarea class="input" name="need" placeholder="yogurt\nberries\nhoney" required></textarea>

            <div class="fieldLabel">Steps (one per line)</div>
            <textarea class="input" name="steps" placeholder="Mix the stuff.\nFreeze it.\nAdd sprinkles and roar." required></textarea>

            <div class="fieldLabel">Tags (comma separated)</div>
            <input class="input" name="tags" placeholder="ice, beast, mini, funny" />

            <div class="divider"></div>

            <div class="searchRow" style="justify-content:flex-start;">
              <button class="btn secondary" id="gPreview" type="button">PREVIEW</button>
              <button class="btn" id="gSubmit" type="submit">SUBMIT TO COMMUNITY</button>
            </div>
            <div class="small" style="margin-top:10px;">Tip: don’t include personal info (no phone/email/address).</div>
          </form>
          <div class="small" id="genMsg" style="margin-top:10px;"></div>
        </div>

        <div class="panel">
          <div style="font-weight:900;">Pending Submissions</div>
          <div class="small">${admin ? "Admin can approve/reject." : "Admins review before it goes live."}</div>
          <div class="divider"></div>

          ${pending.length === 0 ? `<div class="muted">No pending recipes right now.</div>` : `
            <div class="list">
              ${pending.map(p => `
                <div class="listItem">
                  <div>
                    <div style="font-weight:900;">${escapeHTML(p.name)}</div>
                    <div class="small">By: ${escapeHTML(p.chef || "Unknown")} · Tags: ${(p.tags||[]).map(escapeHTML).join(", ")}</div>
                    <div class="small">${escapeHTML(p.preview || "")}</div>
                  </div>
                  <div class="right">
                    <button class="btn secondary" type="button" data-viewpending="${escapeHTML(p.id)}">VIEW</button>
                    ${admin ? `<button class="btn" type="button" data-approve="${escapeHTML(p.id)}">APPROVE</button>` : ""}
                    ${admin ? `<button class="btn danger" type="button" data-reject="${escapeHTML(p.id)}">REJECT</button>` : ""}
                  </div>
                </div>
              `).join("")}
            </div>
          `}

          <div class="divider"></div>
          <div style="font-weight:900;">Community Live</div>
          <div class="small">Approved recipes show up in Search.</div>
          <div class="divider"></div>

          <div class="list">
            ${com.approved.slice(0,4).map(r => listItemHTML(r.name, `By: ${r.chef || "Community"}`, "Open", `data-open="${escapeHTML(r.id)}" style="cursor:pointer;"`)).join("")}
          </div>
        </div>
      </div>
    </div>
  `;

  const form = appEl.querySelector("#genForm");
  const msg = appEl.querySelector("#genMsg");

  // IMPORTANT: prevent page reload / navigation
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const draft = readGenerateForm(new FormData(form));
    if (!draft) return;

    // Very basic personal info filter
    const combined = `${draft.name} ${draft.preview} ${(draft.stepsLocked||[]).join(" ")} ${(draft.need||[]).join(" ")}`.toLowerCase();
    const looksLikePersonal = /(\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b)|(@)|(\baddress\b)|(\bstreet\b)|(\bemail\b)/i.test(combined);
    if (looksLikePersonal) {
      alert("Please remove personal info (no phone/email/address).");
      return;
    }

    const com2 = getCommunity();
    com2.pending.unshift(draft);
    saveCommunity(com2);

    helpers.toast("Submitted! It’s in pending review 🐾");
    msg.textContent = "Submitted! Check Pending on the right.";
    form.reset();
    helpers.rerender(); // refresh pending list
  });

  appEl.querySelector("#gPreview").addEventListener("click", () => {
    const draft = readGenerateForm(new FormData(form), true);
    if (!draft) return;
    helpers.openModal("Preview Submission", `<pre>${escapeHTML(recipeCardText(draft, false))}</pre>`);
  });

  appEl.querySelectorAll("[data-viewpending]").forEach(btn => {
    btn.addEventListener("click", () => {
      const com2 = getCommunity();
      const p = com2.pending.find(x => x.id === btn.dataset.viewpending);
      if (!p) return;
      helpers.openModal("Pending Recipe", `<pre>${escapeHTML(recipeCardText(p, true))}</pre>`);
    });
  });

  appEl.querySelectorAll("[data-approve]").forEach(btn => {
    btn.addEventListener("click", () => {
      const com2 = getCommunity();
      const idx = com2.pending.findIndex(x => x.id === btn.dataset.approve);
      if (idx === -1) return;
      const item = com2.pending.splice(idx, 1)[0];
      com2.approved.unshift(item);
      saveCommunity(com2);
      helpers.toast("Approved! Now it shows up in Search.");
      helpers.rerender();
    });
  });

  appEl.querySelectorAll("[data-reject]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!confirm("Reject and delete this submission?")) return;
      const com2 = getCommunity();
      com2.pending = com2.pending.filter(x => x.id !== btn.dataset.reject);
      saveCommunity(com2);
      helpers.toast("Rejected.");
      helpers.rerender();
    });
  });

  wireOpenCards(appEl, state, helpers);
}

function readGenerateForm(fd, allowPartial = false) {
  const name = (fd.get("name") || "").toString().trim();
  const chef = (fd.get("chef") || "").toString().trim();
  const desc = (fd.get("desc") || "").toString().trim();
  const needLines = (fd.get("need") || "").toString().split("\n").map(s => s.trim()).filter(Boolean);
  const stepsLines = (fd.get("steps") || "").toString().split("\n").map(s => s.trim()).filter(Boolean);
  const tags = (fd.get("tags") || "").toString().split(",").map(s => s.trim()).filter(Boolean);

  if (!allowPartial) {
    if (!name || !desc || !chef || needLines.length < 2 || stepsLines.length < 2) {
      alert("Please fill out: name, description, chef name, at least 2 ingredients, and at least 2 steps.");
      return null;
    }
  } else {
    // partial preview: still require name
    if (!name) {
      alert("Add a recipe name to preview.");
      return null;
    }
  }

  const keywords = [
    name, chef, ...tags,
    ...needLines.slice(0,6),
    ...stepsLines.slice(0,3)
  ].map(s => String(s).toLowerCase()).filter(Boolean);

  let id = "";
  if (crypto?.randomUUID) id = `com-${crypto.randomUUID()}`;
  else id = `com-${Math.random().toString(16).slice(2)}-${Date.now()}`;

  return {
    id,
    kind: "community",
    name,
    chef: chef || "CommunityChef",
    tags: tags.length ? tags : ["community"],
    preview: desc || "A brand new community monster recipe!",
    need: needLines.length ? needLines : ["mystery ingredient 1", "mystery ingredient 2"],
    stepsLocked: stepsLines.length ? stepsLines : ["Do something awesome", "Roar", "Eat"],
    priceCard: 1.99,
    keywords
  };
}

function renderStore(appEl, state, helpers) {
  appEl.innerHTML = `
    <div class="section">
      <h2>Store</h2>
      <div class="muted">Buy packs and download them. (Demo payment.)</div>

      <div class="grid" style="margin-top:14px;">
        ${PACKS.map(p => `
          <div class="card" data-buypack="${escapeHTML(p.id)}" role="button" tabindex="0" title="Buy pack">
            <img class="cardImg" src="${monsterUrl(p.id, 360)}" alt="Monster for ${escapeHTML(p.name)}" loading="lazy" />
            <h3 class="title">${escapeHTML(p.name)}</h3>
            <div class="muted">Includes: ${escapeHTML(p.includes.join(", "))}</div>
            <div class="meta">
              <span class="tag">Pack</span>
              <span class="tag">${money(p.price)}</span>
              <span class="tag">Pay & Download</span>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  appEl.querySelectorAll("[data-buypack]").forEach(el => {
    el.addEventListener("click", async () => {
      const pack = PACKS.find(p => p.id === el.dataset.buypack);
      if (!pack) return;
      const ok = await demoPayAndUnlock({ id: pack.id, name: pack.name, price: pack.price, kind: "pack", type: "pack" });
      if (!ok) return;

      helpers.toast("Payment success! Download starting...");
      downloadTextFile(`${safeFilename(pack.name)}-AnJett-Pack.txt`, packCardText(pack));
      state.route = "downloads";
      helpers.rerender();
    });
  });
}

function renderDownloads(appEl, state, helpers) {
  const purchases = getPurchases();

  appEl.innerHTML = `
    <div class="section">
      <h2>My Downloads</h2>
      <div class="muted">Anything you “paid for” (demo) appears here for re-download.</div>

      <div class="panel" style="margin-top:14px;">
        ${purchases.length === 0 ? `
          <div style="font-weight:900;">No downloads yet.</div>
          <div class="muted">Go search a recipe and click Pay & Download.</div>
          <div class="divider"></div>
          <button class="btn" id="goSearchBtn" type="button">GO SEARCH</button>
        ` : `
          <div class="list">
            ${purchases.map(p => `
              <div class="listItem">
                <div>
                  <div style="font-weight:900;">${escapeHTML(p.name)}</div>
                  <div class="small">${escapeHTML(p.kind || "item")} · Paid ${money(p.price)} · ${new Date(p.purchasedAt).toLocaleString()}</div>
                </div>
                <div class="right">
                  <button class="btn" type="button" data-redownload="${escapeHTML(p.id)}">DOWNLOAD AGAIN</button>
                </div>
              </div>
            `).join("")}
          </div>
          <div class="divider"></div>
          <button class="btn secondary" id="clearPurchasesBtn" type="button">CLEAR DOWNLOAD HISTORY</button>
        `}
      </div>
    </div>
  `;

  const goSearchBtn = appEl.querySelector("#goSearchBtn");
  if (goSearchBtn) {
    goSearchBtn.addEventListener("click", () => {
      state.route = "home";
      helpers.rerender();
    });
  }

  const clearBtn = appEl.querySelector("#clearPurchasesBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (!confirm("Clear download history?")) return;
      clearPurchases();
      helpers.toast("Cleared.");
      helpers.rerender();
    });
  }

  appEl.querySelectorAll("[data-redownload]").forEach(btn => {
    btn.addEventListener("click", () => {
      const purchases2 = getPurchases();
      const p = purchases2.find(x => x.id === btn.dataset.redownload);
      if (!p) return;

      if (p.type === "pack") {
        const pack = PACKS.find(x => x.id === p.id);
        if (pack) downloadTextFile(`${safeFilename(pack.name)}-AnJett-Pack.txt`, packCardText(pack));
        return;
      }

      const com = getCommunity();
      const r =
        OFFICIAL_RECIPES.find(x => x.id === p.id) ||
        com.approved.find(x => x.id === p.id) ||
        com.pending.find(x => x.id === p.id);

      if (r) downloadTextFile(`${safeFilename(r.name)}-AnJett-Card.txt`, recipeCardText(r, true));
    });
  });
}

function renderAbout(appEl) {
  appEl.innerHTML = `
    <div class="section">
      <h2>About</h2>
      <div class="panel">
        <div style="font-weight:900;">What is AnJett.com?</div>
        <div class="muted" style="margin-top:6px;">
          A playful pretend recipe site: search recipes, preview them, then pay to download recipe cards.
          The community can make their own recipes using Generate Recipe.
        </div>

        <div class="divider"></div>

        <div style="font-weight:900;">Disclaimer</div>
        <div class="muted" style="margin-top:6px;">
          Fan-made parody recipe site. Not affiliated with any real creator.
        </div>

        <div class="divider"></div>

        <div style="font-weight:900;">How saving works on GitHub Pages</div>
        <div class="muted" style="margin-top:6px;">
          This version stores community recipes and downloads in your browser (localStorage). That means it saves on your device,
          but it won't sync across different devices unless you add a real backend later.
        </div>
      </div>
    </div>
  `;
}

function wireOpenCards(appEl, state, helpers) {
  appEl.querySelectorAll("[data-open]").forEach(el => {
    const open = () => {
      state.activeRecipeId = el.dataset.open;
      state.route = "recipe";
      helpers.rerender();
    };
    el.addEventListener("click", open);
    el.addEventListener("keydown", (e) => { if (e.key === "Enter") open(); });
  });
}
