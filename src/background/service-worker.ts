import {
  savePrompt,
  getAllPrompts,
  deletePrompt,
  updatePrompt,
  incrementUsage,
  getSettings,
  updateSettings,
} from "@/storage/promptStore";
import type { MessageType, MessageResponse } from "@/shared/types";

chrome.runtime.onMessage.addListener(
  (message: MessageType, sender, sendResponse) => {
    handleMessage(message, sender)
      .then((response) => sendResponse(response))
      .catch((err: Error) =>
        sendResponse({ success: false, error: err.message } as MessageResponse)
      );
    return true; // keep channel open for async response
  }
);

async function handleMessage(
  message: MessageType,
  _sender: chrome.runtime.MessageSender
): Promise<MessageResponse> {
  switch (message.type) {
    case "SAVE_PROMPT": {
      const prompt = await savePrompt(message.payload);
      return { success: true, data: prompt };
    }
    case "GET_ALL_PROMPTS": {
      const prompts = await getAllPrompts();
      return { success: true, data: prompts };
    }
    case "DELETE_PROMPT": {
      await deletePrompt(message.payload.id);
      return { success: true, data: null };
    }
    case "UPDATE_PROMPT": {
      const { id, ...updates } = message.payload;
      const updated = await updatePrompt(id, updates);
      return { success: true, data: updated };
    }
    case "INCREMENT_USAGE": {
      await incrementUsage(message.payload.id);
      return { success: true, data: null };
    }
    case "GET_SETTINGS": {
      const settings = await getSettings();
      return { success: true, data: settings };
    }
    case "UPDATE_SETTINGS": {
      const settings = await updateSettings(message.payload);
      return { success: true, data: settings };
    }
    case "INSERT_PROMPT": {
      // Handled by content script directly; service worker just relays
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id != null) {
        await chrome.tabs.sendMessage(tab.id, {
          type: "INSERT_PROMPT",
          payload: message.payload,
        });
      }
      return { success: true, data: null };
    }
    default:
      return { success: false, error: "Unknown message type" };
  }
}

// On install, set up default state
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    // Pre-warm storage with defaults so first popup open is instant
    await getSettings();
  }
});
