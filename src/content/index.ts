import { detectAndInject } from "./injector";

// Listen for INSERT_PROMPT messages from service worker
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "INSERT_PROMPT") {
    const text: string = message.payload.text;
    insertTextIntoActiveInput(text);
    sendResponse({ success: true });
  }
  return false;
});

function insertTextIntoActiveInput(text: string): void {
  const input = findActiveAIInput();
  if (!input) return;

  if (input instanceof HTMLTextAreaElement || input instanceof HTMLInputElement) {
    input.focus();

    // Insert at current cursor position (or append if no selection)
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const before = input.value.slice(0, start);
    const after = input.value.slice(end);

    // Add a space separator if there's existing text and it doesn't end with whitespace
    const separator = before.length > 0 && !/\s$/.test(before) ? "\n\n" : "";
    const newValue = before + separator + text + after;
    const newCursor = before.length + separator.length + text.length;

    // Use native setter so React's synthetic event system picks up the change
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value"
    )?.set;
    nativeSetter?.call(input, newValue);
    input.setSelectionRange(newCursor, newCursor);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  } else if (input.isContentEditable) {
    input.focus();

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      // Insert at cursor position without selecting all
      const range = sel.getRangeAt(0);

      // Add a separator if there's already content
      const existingText = input.innerText ?? "";
      const separator = existingText.trim().length > 0 ? "\n\n" : "";

      if (separator) {
        range.collapse(false); // move to end of selection
        // Move range to end of content
        range.selectNodeContents(input);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }

      document.execCommand("insertText", false, separator + text);
    } else {
      // Fallback: append to end
      const existingText = input.innerText ?? "";
      const separator = existingText.trim().length > 0 ? "\n\n" : "";
      document.execCommand("insertText", false, separator + text);
    }
  }
}

function findActiveAIInput(): HTMLElement | null {
  const selectors = [
    "#prompt-textarea",
    'textarea[data-id="root"]',
    "[contenteditable='true'][data-testid='compose-input']",
    ".ProseMirror[contenteditable='true']",
    'div[contenteditable="true"][data-placeholder]',
    "textarea",
  ];

  for (const sel of selectors) {
    const el = document.querySelector<HTMLElement>(sel);
    if (el) return el;
  }
  return null;
}

// Start injection
detectAndInject();
