chrome.runtime.onInstalled.addListener(() => {
  console.log('AutoFill AI Agent Extension Installed');
});

// Helper to determine active backend URL
async function getBackendUrl() {
  const { selectedEnv } = await chrome.storage.local.get('selectedEnv');
  if (selectedEnv === 'pro') {
    return 'https://form-filling-agent-backend.onrender.com';
  }
  return 'http://localhost:3000';
}

// Listener for learning fields & commands
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'LEARN_FIELD' || msg.type === 'LEARN_FIELD') {
    (async () => {
      try {
        // 1. Update local extension storage immediately
        const { learnedAnswers } = await chrome.storage.local.get('learnedAnswers');
        const updated = { ...(learnedAnswers || {}), [msg.field]: msg.value };
        await chrome.storage.local.set({ learnedAnswers: updated });
        console.log(`AutoFill AI Learned [Local]: "${msg.field}" -> "${msg.value}"`);

        // 2. Sync with backend API
        const backendUrl = await getBackendUrl();
        await fetch(`${backendUrl}/learn`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ field: msg.field, value: msg.value })
        });
        console.log(`AutoFill AI Synced [Backend]: "${msg.field}"`);
      } catch (err) {
        console.warn('AutoFill AI: Backend learn sync skipped:', err.message);
      }
    })();
    sendResponse({ success: true });
    return true;
  }

  if (msg.action === 'SYNC_KNOWLEDGE') {
    (async () => {
      try {
        const backendUrl = await getBackendUrl();
        const res = await fetch(`${backendUrl}/learned`);
        if (res.ok) {
          const backendAnswers = await res.json();
          const { learnedAnswers } = await chrome.storage.local.get('learnedAnswers');
          const merged = { ...backendAnswers, ...(learnedAnswers || {}) };
          await chrome.storage.local.set({ learnedAnswers: merged });
          sendResponse({ success: true, count: Object.keys(merged).length });
          return;
        }
      } catch (e) {}
      sendResponse({ success: false });
    })();
    return true;
  }
});
