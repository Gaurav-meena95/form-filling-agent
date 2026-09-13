// Backend Configuration
const BACKENDS = {
  local: 'http://localhost:3000',
  pro: 'https://form-filling-agent-backend.onrender.com'
};
let BACKEND_URL = BACKENDS.local;

document.addEventListener('DOMContentLoaded', async () => {
  const statusBadge = document.getElementById('connection-status');
  const statusText = statusBadge.querySelector('.status-text');
  const fillBtn = document.getElementById('fill-btn');
  const resumeInput = document.getElementById('resume-upload');
  const uploadStatus = document.getElementById('upload-status');
  const progressArea = document.getElementById('progress-area');
  const summaryArea = document.getElementById('summary-area');
  const fieldsList = document.getElementById('fields-list');

  // Load Saved Data - default to local for reliable speed and connectivity
  const saved = await chrome.storage.local.get(['profile', 'learnedAnswers', 'resumeText', 'selectedEnv']);
  let selectedEnv = saved.selectedEnv || 'local';

  // Pre-fill Profile
  if (saved.profile) {
    document.getElementById('p-name').value = saved.profile["Full Name"] || '';
    document.getElementById('p-email').value = saved.profile["Email"] || '';
    document.getElementById('p-phone').value = saved.profile["Phone"] || '';
    document.getElementById('p-college').value = saved.profile["College"] || '';
    document.getElementById('p-year').value = saved.profile["Year"] || '';
    document.getElementById('p-skills').value = saved.profile["Skills"] || '';
    document.getElementById('p-exp').value = saved.profile["Experience Summary"] || '';
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

  // Environment Switching
  const envBtns = document.querySelectorAll('.env-btn');
  
  function updateEnvUI(env) {
    envBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.env === env);
    });
  }
  
  updateEnvUI(selectedEnv);

  envBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      selectedEnv = btn.dataset.env;
      await chrome.storage.local.set({ selectedEnv });
      updateEnvUI(selectedEnv);
      checkBackend();
    });
  });

  // Sync backend knowledge into extension storage
  async function syncKnowledge() {
    try {
      const res = await fetch(`${BACKEND_URL}/learned`);
      if (res.ok) {
        const backendLearned = await res.json();
        const current = (await chrome.storage.local.get('learnedAnswers')).learnedAnswers || {};
        const merged = { ...backendLearned, ...current };
        await chrome.storage.local.set({ learnedAnswers: merged });
        console.log(`Synced ${Object.keys(merged).length} learned fields with backend.`);
      }
    } catch (e) {
      console.warn('Knowledge sync offline or skipped:', e.message);
    }
  }

  // Health Check & Backend Selection
  async function checkBackend() {
    BACKEND_URL = BACKENDS[selectedEnv];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${BACKEND_URL}/`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        statusBadge.className = 'status-badge connected';
        statusText.textContent = selectedEnv === 'local' ? 'ONLINE (LOCAL)' : 'ONLINE (PROD)';
        fillBtn.disabled = false;
        syncKnowledge();
      } else { 
        throw new Error(); 
      }
    } catch (err) {
      statusBadge.className = 'status-badge disconnected';
      statusText.textContent = selectedEnv === 'local' ? 'LOCAL OFFLINE' : 'PROD OFFLINE';
      fillBtn.disabled = true;
    }
  }
  checkBackend();
  setInterval(checkBackend, 5000);

  // Resume Upload
  resumeInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    uploadStatus.textContent = 'Processing with AI...';
    uploadStatus.style.color = '#a78bfa';
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${BACKEND_URL}/upload-resume`, { method: 'POST', body: formData });
      const data = await res.json();
      
      await chrome.storage.local.set({ lastResume: file.name });
      await syncKnowledge();
      
      uploadStatus.textContent = 'Resume learned & ready ✓';
      uploadStatus.style.color = 'var(--success)';
    } catch (err) {
      uploadStatus.textContent = 'Upload failed. Check backend.';
      uploadStatus.style.color = 'var(--error)';
    }
  });

  // Save Profile Locally & Sync to Backend
  const saveManualBtn = document.getElementById('save-manual-btn');
  const saveStatus = document.getElementById('save-status');

  saveManualBtn.addEventListener('click', async () => {
    const profile = {
      "Full Name": document.getElementById('p-name').value.trim(),
      "Email": document.getElementById('p-email').value.trim(),
      "Phone": document.getElementById('p-phone').value.trim(),
      "College": document.getElementById('p-college').value.trim(),
      "Year": document.getElementById('p-year').value.trim(),
      "Skills": document.getElementById('p-skills').value.trim(),
      "Experience Summary": document.getElementById('p-exp').value.trim()
    };

    saveStatus.textContent = 'Saving...';
    saveStatus.style.color = '#a78bfa';
    await chrome.storage.local.set({ profile });

    try {
      await fetch(`${BACKEND_URL}/manual-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      await syncKnowledge();
      saveStatus.textContent = 'Profile saved & learned ✓';
      saveStatus.style.color = 'var(--success)';
    } catch (e) {
      saveStatus.textContent = 'Saved locally in extension ✓';
      saveStatus.style.color = 'var(--success)';
    }
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
      if (!tab?.id) throw new Error('No active browser tab found');

      // Inject content script if not already present
      try {
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
      } catch (e) {
        console.log('Script injection note:', e.message);
      }
      await new Promise(resolve => setTimeout(resolve, 300));

      updateStep('step-detect', 'active');
      const pageInfo = await chrome.tabs.sendMessage(tab.id, { action: 'GET_HTML' });
      const fields = pageInfo?.fields || [];
      if (fields.length === 0) throw new Error('No form fields detected on this page.');
      updateStep('step-detect', 'complete', `${fields.length} detected`);

      updateStep('step-match', 'active');
      const { profile, learnedAnswers } = await chrome.storage.local.get(['profile', 'learnedAnswers']);
      
      const profileCtx = JSON.stringify(profile || {});
      const learnedCtx = JSON.stringify(learnedAnswers || {});

      const matchRes = await fetch(`${BACKEND_URL}/match-fields-stateless`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fields,
          profile_context: profileCtx,
          learned_context: learnedCtx
        })
      });
      
      const matchData = await matchRes.json();
      const matched = matchData.matched || {};
      const matchedCount = Object.keys(matched).length;
      
      if (matchedCount === 0 && matchData.error) {
        throw new Error(`AI Matching failed: ${matchData.error}`);
      }
      
      updateStep('step-match', 'complete', `${matchedCount} mapped`);

      updateStep('step-fill', 'active');
      const fillResult = await chrome.tabs.sendMessage(tab.id, {
        type: 'FILL_FORM',
        matchedData: matched
      });

      const filledFields = fillResult?.filled || [];
      updateStep('step-fill', 'complete', `${filledFields.length} filled`);
      showSummary(fields, matched, filledFields);

    } catch (err) {
      alert(`AutoFill: ${err.message}`);
    } finally {
      btnText.hidden = false;
      loader.hidden = true;
      fillBtn.disabled = false;
    }
  });

  function updateStep(id, status, resultText = '') {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = `progress-step ${status}`;
    if (resultText) {
      const resEl = el.querySelector('.step-result');
      if (resEl) resEl.textContent = resultText;
    }
  }

  function resetSteps() {
    ['step-detect', 'step-match', 'step-fill'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.className = 'progress-step';
      const resEl = el.querySelector('.step-result');
      if (resEl) resEl.textContent = '';
    });
  }

  function showSummary(allFields, matched, successfullyFilled) {
    summaryArea.hidden = false;
    allFields.forEach(field => {
      const value = matched[field];
      const isFilled = successfullyFilled.includes(field) || Boolean(value);
      const div = document.createElement('div');
      div.className = 'field-item';
      div.innerHTML = isFilled && value ? 
        `<div class="field-header"><span class="field-name">${field}</span><span class="field-status-icon success"></span></div><div class="field-value">${value}</div>` :
        `<div class="field-header"><span class="field-name">${field}</span><span class="field-status-icon warning"></span></div><div class="field-value" style="color:var(--warning)">Skipped / No data</div>`;
      fieldsList.appendChild(div);
    });
  }
});
