let BACKEND_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
  const statusBadge = document.getElementById('connection-status');
  const statusText = statusBadge.querySelector('.status-text');
  const fillBtn = document.getElementById('fill-btn');
  const resumeInput = document.getElementById('resume-upload');
  const uploadStatus = document.getElementById('upload-status');
  const progressArea = document.getElementById('progress-area');
  const summaryArea = document.getElementById('summary-area');
  const fieldsList = document.getElementById('fields-list');

  // Load Settings
  const settings = await chrome.storage.local.get(['apiUrl', 'profile', 'resumeText']);
  if (settings.apiUrl) {
    BACKEND_URL = settings.apiUrl;
    document.getElementById('api-url').value = BACKEND_URL;
  }

  // Pre-fill Profile
  if (settings.profile) {
    document.getElementById('p-name').value = settings.profile["Full Name"] || '';
    document.getElementById('p-email').value = settings.profile["Email"] || '';
    document.getElementById('p-phone').value = settings.profile["Phone"] || '';
    document.getElementById('p-college').value = settings.profile["College"] || '';
    document.getElementById('p-year').value = settings.profile["Year"] || '';
    document.getElementById('p-skills').value = settings.profile["Skills"] || '';
    document.getElementById('p-exp').value = settings.profile["Experience Summary"] || '';
  }

  // Tab Switching
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(target).classList.add('active');
    });
  });

  // Health Check
  async function checkBackend() {
    try {
      const res = await fetch(`${BACKEND_URL}/`);
      if (res.ok) {
        statusBadge.className = 'status-badge connected';
        statusText.textContent = 'ONLINE';
        fillBtn.disabled = false;
      } else { throw new Error(); }
    } catch (err) {
      statusBadge.className = 'status-badge disconnected';
      statusText.textContent = 'OFFLINE';
      fillBtn.disabled = true;
    }
  }
  checkBackend();
  setInterval(checkBackend, 5000);

  // Settings Save
  document.getElementById('save-settings-btn').addEventListener('click', async () => {
    const newUrl = document.getElementById('api-url').value.trim();
    await chrome.storage.local.set({ apiUrl: newUrl });
    BACKEND_URL = newUrl;
    alert('Settings saved!');
    checkBackend();
  });

  // Resume Upload (Simplified for Production - extracts text)
  resumeInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    uploadStatus.textContent = 'Processing...';
    
    // In a real production app, we'd use pdf.js to extract text here
    // For now, we still upload to backend to keep RAG logic if available
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${BACKEND_URL}/upload-resume`, { method: 'POST', body: formData });
      if (res.ok) {
        uploadStatus.textContent = '✅ Resume ready!';
        uploadStatus.style.color = 'var(--success)';
      } else { throw new Error(); }
    } catch (err) {
      uploadStatus.textContent = '❌ Upload failed';
      uploadStatus.style.color = 'var(--error)';
    }
  });

  // Save Profile Locally
  const saveManualBtn = document.getElementById('save-manual-btn');
  const saveStatus = document.getElementById('save-status');

  saveManualBtn.addEventListener('click', async () => {
    const profile = {
      "Full Name": document.getElementById('p-name').value,
      "Email": document.getElementById('p-email').value,
      "Phone": document.getElementById('p-phone').value,
      "College": document.getElementById('p-college').value,
      "Year": document.getElementById('p-year').value,
      "Skills": document.getElementById('p-skills').value,
      "Experience Summary": document.getElementById('p-exp').value
    };

    saveStatus.textContent = 'Saving...';
    await chrome.storage.local.set({ profile });
    
    // Also sync to backend if connected
    try {
      await fetch(`${BACKEND_URL}/manual-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
    } catch (e) {}

    saveStatus.textContent = '✅ Profile saved locally!';
    saveStatus.style.color = 'var(--success)';
  });

  // Fill Form Flow
  fillBtn.addEventListener('click', async () => {
    const btnText = fillBtn.querySelector('.btn-text');
    const loader = fillBtn.querySelector('.loader-dots');

    progressArea.hidden = false;
    summaryArea.hidden = true;
    fieldsList.innerHTML = '';
    resetSteps();

    btnText.hidden = true;
    loader.hidden = false;
    fillBtn.disabled = true;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 1: Detect
      updateStep('step-detect', 'active');
      const pageInfo = await chrome.tabs.sendMessage(tab.id, { action: 'GET_HTML' });
      const fields = pageInfo.fields || [];
      if (fields.length === 0) throw new Error('No fields found');
      updateStep('step-detect', 'complete', `${fields.length} found`);

      // Step 2: Match (Stateless for Production)
      updateStep('step-match', 'active');
      
      const { profile } = await chrome.storage.local.get('profile');
      const profileCtx = JSON.stringify(profile || {});

      const matchRes = await fetch(`${BACKEND_URL}/match-fields-stateless`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fields,
          profile_context: profileCtx
        })
      });
      const matchData = await matchRes.json();
      const matched = matchData.matched || {};
      updateStep('step-match', 'complete', `${Object.keys(matched).length} matched`);

      // Step 3: Fill
      updateStep('step-fill', 'active');
      const fillResult = await chrome.tabs.sendMessage(tab.id, {
        type: 'FILL_FORM',
        matchedData: matched
      });

      updateStep('step-fill', 'complete', 'Finished');
      showSummary(fields, matched, fillResult?.filled || []);

    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      btnText.hidden = false;
      loader.hidden = true;
      fillBtn.disabled = false;
    }
  });

  function updateStep(id, status, resultText = '') {
    const el = document.getElementById(id);
    el.className = `progress-step ${status}`;
    if (resultText) el.querySelector('.step-result').textContent = resultText;
  }

  function resetSteps() {
    ['step-detect', 'step-match', 'step-fill'].forEach(id => {
      const el = document.getElementById(id);
      el.className = 'progress-step';
      el.querySelector('.step-result').textContent = '';
    });
  }

  function showSummary(allFields, matched, successfullyFilled) {
    summaryArea.hidden = false;
    allFields.forEach(field => {
      const value = matched[field];
      const div = document.createElement('div');
      div.className = 'field-item';
      div.innerHTML = value ? 
        `<div class="field-header"><span class="field-name">${field}</span><span>✅</span></div><div class="field-value">${value}</div>` :
        `<div class="field-header"><span class="field-name">${field}</span><span>⚠️</span></div><div class="field-value" style="color:var(--warning)">Skipped</div>`;
      fieldsList.appendChild(div);
    });
  }
});
