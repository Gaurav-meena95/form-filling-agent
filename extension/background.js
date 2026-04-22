chrome.runtime.onInstalled.addListener(() => {
  console.log('AutoFill AI Agent Extension Installed');
});

// Listener for learning fields
chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  if (msg.action === 'LEARN_FIELD' || msg.type === 'LEARN_FIELD') {
    const { learnedAnswers } = await chrome.storage.local.get('learnedAnswers');
    const updated = { ...(learnedAnswers || {}), [msg.field]: msg.value };
    await chrome.storage.local.set({ learnedAnswers: updated });
    console.log('AutoFill AI: Knowledge updated in background storage.');
  }
});
