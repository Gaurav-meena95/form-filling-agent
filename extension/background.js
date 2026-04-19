const BACKEND_URL = 'http://localhost:3000';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'LEARN_FIELD') {
    fetch(`${BACKEND_URL}/learn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        field: request.field,
        value: request.value
      })
    })
    .then(res => res.json())
    .then(data => console.log('Learned successfully:', data))
    .catch(err => console.error('Learning failed:', err));
  }
});
