// const BACKEND_URL = 'http://localhost:3000';
if (typeof BACKEND_URL === 'undefined') { var BACKEND_URL = 'http://localhost:3000'; }

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'GET_HTML') {
    // Don't send full HTML - extract only field labels directly
    const fields = [];
    
    // Google Forms labels
    document.querySelectorAll('.M7eMe').forEach(el => {
      const text = el.innerText.trim().replace('*', '').trim();
      if (text) fields.push(text);
    });
    
    // Generic form labels fallback
    if (fields.length === 0) {
      document.querySelectorAll('label').forEach(el => {
        const text = el.innerText.trim();
        if (text) fields.push(text);
      });
    }
    
    // aria-label fallback
    if (fields.length === 0) {
      document.querySelectorAll('input[aria-label], textarea[aria-label]').forEach(el => {
        const text = el.getAttribute('aria-label').trim();
        if (text) fields.push(text);
      });
    }
    
    // Remove duplicates
    const uniqueFields = [...new Set(fields)];
    sendResponse({ html: JSON.stringify(uniqueFields), fields: uniqueFields });
    return true;
  }

  if (message.type === 'FILL_FORM' || message.action === 'FILL_FORM') {
    const data = message.matchedData || message.data;
    const filledFields = fillForm(data);
    sendResponse({ success: true, filled: filledFields });
  }
  return true;
});

function fillForm(matchedData) {
  console.log('AutoFill AI: Starting fill with data:', matchedData);
  const containers = document.querySelectorAll('.Qr7Oae');
  const filledFields = [];
  
  containers.forEach(container => {
    const label = container.querySelector('.M7eMe')?.innerText?.trim()?.replace('*','')?.trim();
    if (!label) return;

    let value = null;
    const labelLower = label.toLowerCase();
    
    // Case-insensitive matching
    if (matchedData[label]) {
      value = matchedData[label];
    } else {
      const matchKey = Object.keys(matchedData).find(k => k.trim().toLowerCase() === labelLower);
      if (matchKey) value = matchedData[matchKey];
    }

    if (value) {
      console.log(`Filling "${label}" with "${value}"`);
      const valueStr = value.toString();
      
      // Text/Email/Tel input
      const textInput = container.querySelector('input[type="text"], input[type="email"], input[type="tel"]');
      if (textInput) {
        textInput.focus();
        textInput.value = valueStr;
        textInput.dispatchEvent(new Event('input', { bubbles: true }));
        textInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      // Textarea
      const textarea = container.querySelector('textarea');
      if (textarea) {
        textarea.focus();
        textarea.value = valueStr;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      // Radio buttons
      const radioOptions = container.querySelectorAll('div[role="radio"]');
      if (radioOptions.length > 0) {
        radioOptions.forEach(option => {
          const optionLabel = option.closest('label')?.querySelector('.YEVVod')?.innerText?.trim();
          if (optionLabel && optionLabel.toLowerCase() === valueStr.toLowerCase()) {
            option.click();
          }
        });
      }
      
      // Checkboxes
      const checkboxOptions = container.querySelectorAll('div[role="checkbox"]');
      if (checkboxOptions.length > 0) {
        const valuesToCheck = valueStr.split(',').map(v => v.trim().toLowerCase());
        checkboxOptions.forEach(option => {
          const optionLabel = option.closest('label')?.querySelector('.YEVVod')?.innerText?.trim();
          if (optionLabel && valuesToCheck.includes(optionLabel.toLowerCase())) {
            option.click();
          }
        });
      }

      chrome.runtime.sendMessage({
        type: 'FIELD_FILLED',
        field: label,
        value: valueStr,
        success: true
      });
      filledFields.push(label);
    } else {
      console.log(`Skipping field: ${label}`);
      chrome.runtime.sendMessage({
        type: 'FIELD_SKIPPED', 
        field: label
      });
    }
  });
  return filledFields;
}

function highlightSkippedFields(allFields, filledFields) {
  const containers = document.querySelectorAll('.Qr7Oae');
  containers.forEach(container => {
    const labelEl = container.querySelector('.M7eMe');
    if (labelEl) {
      const labelText = labelEl.innerText.replace('*', '').trim();
      if (allFields.includes(labelText) && !filledFields.includes(labelText)) {
        container.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
        container.style.borderLeft = '4px solid #F59E0B';
        container.classList.add('autofill-skipped');
      } else {
        container.style.backgroundColor = '';
        container.style.borderLeft = '';
        container.classList.remove('autofill-skipped');
      }
    }
  });
}

// Learning System
document.addEventListener('submit', captureAndLearn, true);
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[role="button"]');
  if (btn && (btn.innerText.includes('Submit') || btn.innerText.includes('Next'))) {
    captureAndLearn();
  }
}, true);

function captureAndLearn() {
  const containers = document.querySelectorAll('.Qr7Oae');
  containers.forEach(container => {
    const labelEl = container.querySelector('.M7eMe');
    const input = container.querySelector('input, textarea');
    if (labelEl && input && input.value) {
      const labelText = labelEl.innerText.replace('*', '').trim();
      const value = input.value.trim();
      if (value) {
        chrome.runtime.sendMessage({ action: 'LEARN_FIELD', field: labelText, value: value });
      }
    }
  });
}
