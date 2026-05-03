import type { PromptSource } from "@/shared/types";

const STORAGE_KEY = "prompt_gallery_state";
const FALLBACK_CATEGORIES = ["Writing","Coding","Research","Marketing","Design","Learning","Business","Personal"];

/** Read categories directly from extension storage — always up to date. */
function getStoredCategories(): Promise<string[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const state = result[STORAGE_KEY] as { categories?: string[] } | undefined;
      resolve(state?.categories?.length ? state.categories : FALLBACK_CATEGORIES);
    });
  });
}

// ── Site configs ──────────────────────────────────────────────────────────────

const SITE_CONFIGS: Array<{ test: (h: string) => boolean; source: PromptSource; inputSelectors: string[] }> = [
  {
    test: (h) => h.includes("chatgpt.com") || h.includes("chat.openai.com"),
    source: "chatgpt",
    inputSelectors: [
      "#prompt-textarea",
      'div[contenteditable="true"][data-virtualkeyboard-attached]',
      'div[contenteditable="true"][id*="prompt"]',
      'textarea[data-id="root"]',
      "textarea",
    ],
  },
  {
    test: (h) => h.includes("claude.ai"),
    source: "claude",
    inputSelectors: [
      '.ProseMirror[contenteditable="true"]',
      '[contenteditable="true"][data-placeholder]',
      '[contenteditable="true"]',
    ],
  },
  {
    test: (h) => h.includes("gemini.google.com"),
    source: "gemini",
    inputSelectors: [
      '.ql-editor[contenteditable="true"]',
      '[contenteditable="true"][data-placeholder]',
      '[contenteditable="true"]',
    ],
  },
  {
    test: (h) => h.includes("perplexity.ai"),
    source: "perplexity",
    inputSelectors: [
      "textarea",
      '[contenteditable="true"][placeholder]',
      '[contenteditable="true"]',
    ],
  },
  {
    test: (h) => h.includes("grok.x.ai") || h.includes("grok.com"),
    source: "grok",
    inputSelectors: [
      "textarea",
      '[contenteditable="true"]',
    ],
  },
];

const GENERIC_INPUT_SELECTORS = [
  "#prompt-textarea",
  ".ProseMirror[contenteditable='true']",
  ".ql-editor[contenteditable='true']",
  "textarea",
  "[contenteditable='true']",
];

function getSiteConfig() {
  const h = location.hostname;
  return SITE_CONFIGS.find((c) => c.test(h)) ?? null;
}
function getSource(): PromptSource { return getSiteConfig()?.source ?? "other"; }
function getInputSelectors(): string[] {
  return getSiteConfig()?.inputSelectors ?? GENERIC_INPUT_SELECTORS;
}
function getTextFromInput(el: HTMLElement): string {
  if (el instanceof HTMLTextAreaElement) return el.value;
  return el.innerText ?? el.textContent ?? "";
}

// ── Find the visual text box container ───────────────────────────────────────
// Walk up from the input to find the element that visually represents
// the text box (has background + rounded corners, already positioned).
// This is where we inject our button — just like Capsule Hub does.

function findTextboxContainer(input: HTMLElement): HTMLElement {
  const vw = window.innerWidth;
  let el: HTMLElement | null = input.parentElement;

  for (let d = 0; d < 10 && el && el !== document.body; d++) {
    const cs  = window.getComputedStyle(el);
    const bg  = cs.backgroundColor;
    const pos = cs.position;
    const w   = el.offsetWidth;
    const h   = el.offsetHeight;

    const isPositioned  = pos === "relative" || pos === "absolute" || pos === "fixed";
    const hasBackground = !!bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent";
    const isReasonable  = w > 120 && h > 28 && w < vw * 0.98;

    // Ideal: already positioned, has a background, right size
    if (isPositioned && hasBackground && isReasonable) return el;

    el = el.parentElement;
  }

  // Fallback: grandparent of input
  return input.parentElement?.parentElement ?? input.parentElement ?? input;
}

// ── Button + tooltip ──────────────────────────────────────────────────────────

const BOOKMARK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
  width="15" height="15" fill="currentColor">
  <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
</svg>`;

function attachTooltip(btn: HTMLButtonElement): void {
  let tip: HTMLDivElement | null = null;

  btn.addEventListener("mouseenter", () => {
    tip = document.createElement("div");
    tip.className = "pg-tooltip";
    tip.textContent = "Save to Prompt Gallery";
    document.body.appendChild(tip);

    const r = btn.getBoundingClientRect();
    requestAnimationFrame(() => {
      if (!tip) return;
      tip.style.left = `${r.left + r.width / 2 - tip.offsetWidth / 2}px`;
      tip.style.top  = `${r.top - tip.offsetHeight - 6}px`;
      tip.classList.add("pg-tooltip-visible");
    });
  });

  btn.addEventListener("mouseleave", () => { tip?.remove(); tip = null; });
}

function createSaveButton(): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = "pg-save-btn";
  btn.setAttribute("data-pg", "true");
  btn.setAttribute("aria-label", "Save to Prompt Gallery");
  btn.type = "button";
  btn.innerHTML = BOOKMARK_ICON;
  // Prevent stealing focus from the input
  btn.addEventListener("mousedown", (e) => e.preventDefault());
  attachTooltip(btn);
  return btn;
}

// ── Core injection ────────────────────────────────────────────────────────────
// One button per input, positioned absolute at top-right of the text box.

const attached = new WeakSet<HTMLElement>();

function attachToInput(input: HTMLElement): void {
  if (attached.has(input)) return;
  attached.add(input);

  const source    = getSource();
  const container = findTextboxContainer(input);

  // Don't inject twice into the same container
  if (container.querySelector("[data-pg-injected]")) return;

  // Ensure the container can host absolutely-positioned children
  if (window.getComputedStyle(container).position === "static") {
    container.style.position = "relative";
  }

  const btn = createSaveButton();
  btn.setAttribute("data-pg-injected", "true");

  // Absolute positioning inside the text box — top-right corner
  Object.assign(btn.style, {
    position: "absolute",
    top:      "8px",
    right:    "8px",
    zIndex:   "9999",
    display:  "none",  // hidden until user types
  });

  container.appendChild(btn);

  // ── Visibility: show as soon as any text is present ────────────────────────
  function sync() {
    const hasText = getTextFromInput(input).trim().length > 0;
    btn.style.display = hasText ? "inline-flex" : "none";
  }

  input.addEventListener("input",  sync);
  input.addEventListener("focus",  sync);
  input.addEventListener("keydown", sync);

  // contenteditable doesn't fire reliable "input" events on paste/programmatic change
  if (input.isContentEditable) {
    new MutationObserver(sync).observe(input, {
      childList: true, subtree: true, characterData: true,
    });
  }

  sync(); // check initial state (e.g. if input already has text)

  // ── Click → open save modal ────────────────────────────────────────────────
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    void openSaveModal(getTextFromInput(input), source);
  });
}

// ── DOM scanning ──────────────────────────────────────────────────────────────

function scanAndAttach(): void {
  for (const sel of getInputSelectors()) {
    try {
      document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
        if (!el.closest("[data-pg]")) attachToInput(el);
      });
    } catch { /* ignore invalid selectors */ }
  }
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function showToast(message: string): void {
  document.querySelector(".pg-toast")?.remove();
  const t = document.createElement("div");
  t.className = "pg-toast";
  t.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="#30d158" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg> ${message}`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

// ── Save modal ────────────────────────────────────────────────────────────────

async function openSaveModal(text: string, source: PromptSource): Promise<void> {
  document.querySelector(".pg-overlay")?.remove();

  // Load live categories from storage before rendering
  const storedCats = await getStoredCategories();

  const overlay = document.createElement("div");
  overlay.className = "pg-overlay";
  overlay.setAttribute("data-pg", "true");

  const catOptions = storedCats
    .map((c) => `<option value="${c}">${escapeHtml(c)}</option>`)
    .join("");

  overlay.innerHTML = `
    <div class="pg-modal" role="dialog" aria-modal="true">
      <div class="pg-modal-header">
        <div class="pg-modal-title">
          <div class="pg-modal-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
              <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
            </svg>
          </div>
          Save to Prompt Gallery
        </div>
        <button class="pg-modal-close" aria-label="Close">✕</button>
      </div>
      <div class="pg-modal-body">

        <!-- Title (optional) -->
        <div>
          <label class="pg-field-label">
            Title
            <span style="font-weight:400;text-transform:none;letter-spacing:0;color:#aeaeb2;font-size:10px;margin-left:4px">optional</span>
          </label>
          <input type="text" class="pg-input pg-title-input"
                 placeholder="Auto-generated from prompt text" maxlength="80" />
        </div>

        <!-- Prompt text -->
        <div>
          <label class="pg-field-label">Prompt</label>
          <textarea class="pg-textarea" rows="3">${escapeHtml(text)}</textarea>
        </div>

        <!-- Category + Tags -->
        <div class="pg-row">
          <div style="flex:1">
            <label class="pg-field-label">Category</label>
            <select class="pg-select pg-cat-select">
              <option value="">None</option>
              ${catOptions}
              <option value="__new__">＋ New category…</option>
            </select>
            <!-- Revealed when user picks "New category…" -->
            <input type="text" class="pg-input pg-new-cat"
                   placeholder="Category name…" maxlength="40"
                   style="display:none;margin-top:6px" />
          </div>
          <div style="flex:1">
            <label class="pg-field-label">Tags</label>
            <input type="text" class="pg-input pg-tags-input" placeholder="seo, creative…" />
          </div>
        </div>

        <p class="pg-hint">⌘↩ to save · Esc to close</p>
      </div>
      <div class="pg-modal-footer">
        <button class="pg-btn pg-btn-cancel">Cancel</button>
        <button class="pg-btn pg-btn-save">Save Prompt</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const titleIn  = overlay.querySelector<HTMLInputElement>(".pg-title-input")!;
  const ta       = overlay.querySelector<HTMLTextAreaElement>(".pg-textarea")!;
  const catSel   = overlay.querySelector<HTMLSelectElement>(".pg-cat-select")!;
  const newCatIn = overlay.querySelector<HTMLInputElement>(".pg-new-cat")!;
  const tagsIn   = overlay.querySelector<HTMLInputElement>(".pg-tags-input")!;
  const saveBtn  = overlay.querySelector<HTMLButtonElement>(".pg-btn-save")!;

  // Focus title first so user can optionally name the prompt
  titleIn.focus();

  // Show/hide the new-category text input
  catSel.addEventListener("change", () => {
    const isNew = catSel.value === "__new__";
    newCatIn.style.display = isNew ? "block" : "none";
    if (isNew) { newCatIn.focus(); }
  });

  const close = () => overlay.remove();
  overlay.querySelector(".pg-btn-cancel")!.addEventListener("click", close);
  overlay.querySelector(".pg-modal-close")!.addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); }, { once: true });

  async function save() {
    const promptText = ta.value.trim();
    if (!promptText) { ta.focus(); ta.style.borderColor = "#ff3b30"; return; }

    // Resolve category — either existing or newly typed
    let category = catSel.value;
    if (category === "__new__") {
      category = newCatIn.value.trim();
      if (!category) { newCatIn.focus(); return; }
    }

    const title = titleIn.value.trim();
    const tags  = tagsIn.value
      .split(",")
      .map((t) => t.trim().toLowerCase().replace(/\s+/g, "-"))
      .filter(Boolean);

    saveBtn.disabled = true;
    saveBtn.textContent = "Saving…";

    try {
      const res = (await chrome.runtime.sendMessage({
        type: "SAVE_PROMPT",
        payload: { text: promptText, title, category, tags, source },
      })) as { success: boolean };
      if (res?.success) { close(); showToast("Saved to Prompt Gallery!"); }
      else { saveBtn.disabled = false; saveBtn.textContent = "Save Prompt"; }
    } catch {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Prompt";
    }
  }

  saveBtn.addEventListener("click", save);
  overlay.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) void save();
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Entry point ───────────────────────────────────────────────────────────────

export function detectAndInject(): void {
  scanAndAttach();

  // Re-scan on DOM changes (SPA navigation, dynamic inputs)
  let scanTimer: ReturnType<typeof setTimeout> | null = null;
  new MutationObserver(() => {
    if (scanTimer) return;
    scanTimer = setTimeout(() => { scanTimer = null; scanAndAttach(); }, 400);
  }).observe(document.body, { childList: true, subtree: true });

  // SPA URL changes
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    setTimeout(scanAndAttach, 600);
    setTimeout(scanAndAttach, 1800);
  }).observe(document.documentElement, { childList: true, subtree: true });
}
