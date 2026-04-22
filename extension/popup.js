// PRODUCTION URL: This is where the extension talks to the AI
const BACKEND_URL = 'https://form-filling-agent.onrender.com';

document.addEventListener('DOMContentLoaded', async () => {
  const statusBadge = document.getElementById('connection-status');
  const statusText = statusBadge.querySelector('.status-text');
  const fillBtn = document.getElementById('fill-btn');
  const resumeInput = document.getElementById('resume-upload');
  const uploadStatus = document.getElementById('upload-status');
  const progressArea = document.getElementById('progress-area');
  const summaryArea = document.getElementById('summary-area');
  const fieldsList = document.getElementById('fields-list');

  // Load Saved Data
  const saved = await chrome.storage.local.get(['profile', 'learnedAnswers', 'resumeText']);

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
  setInterval(checkBackend, 10000);

  // Resume Upload
  resumeInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    uploadStatus.textContent = 'Processing...';
    
    // Send to backend for RAG processing (stateless session)
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${BACKEND_URL}/upload-resume`, { method: 'POST', body: formData });
      const data = await res.json();
      
      // Also save file name locally
      await chrome.storage.local.set({ lastResume: file.name });
      
      uploadStatus.textContent = 'Resume ready';
      uploadStatus.style.color = 'var(--success)';
    } catch (err) {
      uploadStatus.textContent = 'Upload failed';
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
    saveStatus.textContent = 'Profile saved';
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

      updateStep('step-detect', 'active');
      const pageInfo = await chrome.tabs.sendMessage(tab.id, { action: 'GET_HTML' });
      const fields = pageInfo.fields || [];
      if (fields.length === 0) throw new Error('No fields found');
      updateStep('step-detect', 'complete', `${fields.length} found`);

      updateStep('step-match', 'active');
      const { profile, learnedAnswers } = await chrome.storage.local.get(['profile', 'learnedAnswers']);
      
      // Combine all context
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
      updateStep('step-match', 'complete', `${Object.keys(matched).length} matched`);

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
        `<div class="field-header"><span class="field-name">${field}</span><span class="field-status-icon success"></span></div><div class="field-value">${value}</div>` :
        `<div class="field-header"><span class="field-name">${field}</span><span class="field-status-icon warning"></span></div><div class="field-value" style="color:var(--warning)">Skipped</div>`;
      fieldsList.appendChild(div);
    });
  }
});
