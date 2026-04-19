const BACKEND_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
  const statusBadge = document.getElementById('connection-status');
  const statusText = statusBadge.querySelector('.status-text');
  const fillBtn = document.getElementById('fill-btn');
  const resumeInput = document.getElementById('resume-upload');
  const uploadStatus = document.getElementById('upload-status');
  const progressArea = document.getElementById('progress-area');
  const summaryArea = document.getElementById('summary-area');
  const fieldsList = document.getElementById('fields-list');

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

  // 1. Health Check
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

  // 2. Resume Upload
  resumeInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    uploadStatus.textContent = 'Uploading...';
    uploadStatus.style.color = 'var(--text-dim)';

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${BACKEND_URL}/upload-resume`, { method: 'POST', body: formData });
      if (res.ok) {
        uploadStatus.textContent = '✅ Resume updated!';
        uploadStatus.style.color = 'var(--success)';
      } else { throw new Error(); }
    } catch (err) {
      uploadStatus.textContent = '❌ Upload failed';
      uploadStatus.style.color = 'var(--error)';
    }
  });

  // 3. Save Manual Profile
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
    saveStatus.style.color = 'var(--text-dim)';

    try {
      const res = await fetch(`${BACKEND_URL}/manual-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      if (res.ok) {
        saveStatus.textContent = '✅ Profile saved!';
        saveStatus.style.color = 'var(--success)';
      } else { throw new Error(); }
    } catch (err) {
      saveStatus.textContent = '❌ Save failed';
      saveStatus.style.color = 'var(--error)';
    }
  });

  // 4. Fill Form Flow
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

      // Force inject content.js first before sending any message
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });

      // Wait for injection to complete
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 1: Detect fields directly from page (no backend call needed)
      updateStep('step-detect', 'active');
      
      let pageInfo;
      try {
        pageInfo = await chrome.tabs.sendMessage(tab.id, { action: 'GET_HTML' });
      } catch (e) {
        alert('Cannot access this page. Please open a form first.');
        return;
      }

      const fields = pageInfo.fields || [];
      if (fields.length === 0) {
        alert('No form fields detected on this page.');
        return;
      }
      updateStep('step-detect', 'complete', `${fields.length} found`);

      // Step 2: Match
      updateStep('step-match', 'active');
      const matchRes = await fetch(`${BACKEND_URL}/match-fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      });
      const matchData = await matchRes.json();
      const matched = matchData.matched || {};
      updateStep('step-match', 'complete', `${Object.keys(matched).length} matched`);

      // Step 3: Fill
      updateStep('step-fill', 'active');

      // Re-inject content.js to make sure it's fresh
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      await new Promise(resolve => setTimeout(resolve, 500));

      let fillResult;
      try {
        fillResult = await chrome.tabs.sendMessage(tab.id, {
          type: 'FILL_FORM',
          matchedData: matched
        });
      } catch(e) {
        fillResult = { filled: [] };
      }

      updateStep('step-fill', 'complete', 'Finished');
      showSummary(fields, matched, fillResult?.filled || []);

    } catch (err) {
      console.error('Full error:', err);
      alert(`Error: ${err.message}`);
    }
 finally {
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
      
      if (value) {
        div.innerHTML = `
          <div class="field-header">
            <span class="field-name">${field}</span>
            <span class="field-status">✅</span>
          </div>
          <div class="field-value">${value}</div>
        `;
      } else {
        div.innerHTML = `
          <div class="field-header">
            <span class="field-name">${field}</span>
            <span class="field-status">⚠️</span>
          </div>
          <div class="field-value" style="color: var(--warning); font-style: italic;">Skipped (no data)</div>
        `;
      }
      fieldsList.appendChild(div);
    });
  }
});
