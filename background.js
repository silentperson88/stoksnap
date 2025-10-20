chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "setBadge") {
    chrome.action.setBadgeText({ text: msg.recommendation });
    chrome.action.setBadgeBackgroundColor({ color: msg.color });
  }
});
