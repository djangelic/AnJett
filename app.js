import { render } from "./ui.js";
import { toggleAdmin } from "./store.js";

const appEl = document.getElementById("app");
const toastEl = document.getElementById("toast");
const modalBackdrop = document.getElementById("modalBackdrop");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const modalClose = document.getElementById("modalClose");

const state = {
  route: "home",
  query: "",
  activeRecipeId: null
};

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.style.display = "block";
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toastEl.style.display = "none"; }, 1600);
}

function openModal(title, bodyHTML) {
  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHTML;
  modalBackdrop.style.display = "flex";
  modalBackdrop.setAttribute("aria-hidden", "false");
}

function closeModal() {
  modalBackdrop.style.display = "none";
  modalBackdrop.setAttribute("aria-hidden", "true");
}

modalClose.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", (e) => {
  if (e.target.id === "modalBackdrop") closeModal();
});

function rerender() {
  // nav active styles
  document.querySelectorAll(".pill").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.route === state.route);
  });

  render(appEl, state, { toast, openModal, closeModal, rerender });
}

document.getElementById("brandBtn").addEventListener("click", () => {
  state.route = "home";
  state.query = "";
  state.activeRecipeId = null;
  rerender();
});
document.getElementById("brandBtn").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    state.route = "home";
    state.query = "";
    state.activeRecipeId = null;
    rerender();
  }
});

document.querySelectorAll(".pill").forEach(btn => {
  btn.addEventListener("click", () => {
    state.route = btn.dataset.route;
    rerender();
  });
});

// Admin shortcut: Ctrl+Shift+A
window.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.shiftKey && (e.key === "A" || e.key === "a")) {
    const on = toggleAdmin();
    toast(on ? "Admin mode ON" : "Admin mode OFF");
    rerender();
  }
});

rerender();
