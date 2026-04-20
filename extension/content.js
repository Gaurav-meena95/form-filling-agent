// Universal Form Filling Agent - content.js
if (typeof BACKEND_URL === 'undefined') { var BACKEND_URL = 'http://localhost:3000'; }

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'GET_HTML') {
    const fields = detectFields();
    // We send back both the unique labels and the count
    const uniqueLabels = [...new Set(fields.map(f => f.label))];
    sendResponse({ fields: uniqueLabels, rawFields: fields });
    return true;
  }

  if (message.type === 'FILL_FORM' || message.action === 'FILL_FORM') {
    const data = message.matchedData || message.data;
    const filledFields = universalFill(data);
    sendResponse({ success: true, filled: filledFields });
  }
  return true;
});

/**
 * Detects all interactive fields on the page and finds their labels.
 */
function detectFields() {
  const selectors = [
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="file"])',
    'textarea',
    'select',
    '[role="checkbox"]',
    '[role="radio"]'
  ];
  
  const elements = document.querySelectorAll(selectors.join(', '));
  const detected = [];

  elements.forEach(el => {
    // 1. Find the best label for this element
    const label = findBestLabel(el);
    if (label) {
      detected.push({
        label: label,
        tagName: el.tagName.toLowerCase(),
        type: el.getAttribute('type') || (el.getAttribute('role') || 'text'),
        id: el.id,
        name: el.name
      });
    }
  });

  return detected;
}

/**
 * Heuristic-based label detection
 */
function findBestLabel(el) {
  // A. Check for Google Forms Specific Labels (Fallback support)
  const googleLabel = el.closest('.Qr7Oae')?.querySelector('.M7eMe')?.innerText?.trim()?.replace('*', '')?.trim();
  if (googleLabel) return googleLabel;

  // 1. Explicit <label for="...">
  if (el.id) {
    const labelEl = document.querySelector(`label[for="${el.id}"]`);
    if (labelEl && labelEl.innerText.trim()) return labelEl.innerText.trim();
  }

  // 2. Implicit Parent <label>
  const parentLabel = el.closest('label');
  if (parentLabel && parentLabel.innerText.trim()) {
    // Remove the element's own text if it's inside the label
    return parentLabel.innerText.trim().replace(el.innerText, '').split('\n')[0].trim();
  }

  // 3. ARIA Labels
  const ariaLabel = el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.getAttribute('title');
  if (ariaLabel && ariaLabel.trim()) return ariaLabel.trim();

  const ariaLabelledBy = el.getAttribute('aria-labelledby');
  if (ariaLabelledBy) {
    const labelEl = document.getElementById(ariaLabelledBy);
    if (labelEl && labelEl.innerText.trim()) return labelEl.innerText.trim();
  }

  // 4. Proximity - Look for text before the input
  // Scan previous siblings for a text-heavy element
  let prev = el.previousElementSibling;
  while (prev) {
    if (prev.innerText && prev.innerText.trim().length > 1 && prev.innerText.trim().length < 100) {
      return prev.innerText.trim();
    }
    prev = prev.previousElementSibling;
  }

  // 5. Check parent's children (Common for custom structures)
  const parent = el.parentElement;
  if (parent) {
    const siblingText = parent.querySelector('span, div, p')?.innerText?.trim();
    if (siblingText && siblingText.length > 1 && siblingText.length < 50) return siblingText;
  }

  // 6. Name/ID fallback (Last resort, cleaned up)
  const nameOrId = el.name || el.id;
  if (nameOrId && nameOrId.length > 2) {
    return nameOrId.replace(/[-_]/g, ' ').replace(/([A-Z])/g, ' $1').trim();
  }

  return null;
}

/**
 * Universal filling logic that handles different element types and triggers events.
 */
function universalFill(matchedData) {
  console.log('Universal Fill Starting...', matchedData);
  const filled = [];
  const fields = detectFields(); // Re-scan to get fresh elements

  const elements = document.querySelectorAll('input, textarea, select, [role="checkbox"], [role="radio"]');

  elements.forEach(el => {
    const label = findBestLabel(el);
    if (!label) return;

    const labelLower = label.toLowerCase();
    let value = null;

    // Direct match or Fuzzy match
    if (matchedData[label]) {
      value = matchedData[label];
    } else {
      const matchKey = Object.keys(matchedData).find(k => k.toLowerCase() === labelLower || labelLower.includes(k.toLowerCase()));
      if (matchKey) value = matchedData[matchKey];
    }

    if (value) {
      const success = fillElement(el, value);
      if (success) {
        filled.push(label);
        highlightField(el, true);
      }
    }
  });

  return filled;
}

function fillElement(el, value) {
  const tagName = el.tagName.toLowerCase();
  const type = el.getAttribute('type') || el.getAttribute('role');

  try {
    if (tagName === 'input' || tagName === 'textarea') {
      if (type === 'checkbox' || type === 'radio') {
        const valStr = value.toString().toLowerCase();
        const labelText = findBestLabel(el).toLowerCase();
        if (labelText.includes(valStr) || valStr === 'true' || valStr === 'yes') {
          if (!el.checked) el.click();
        }
      } else {
        triggerValueChange(el, value);
      }
    } else if (tagName === 'select') {
      const options = Array.from(el.options);
      const target = value.toString().toLowerCase();
      const match = options.find(o => o.text.toLowerCase().includes(target) || o.value.toLowerCase() === target);
      if (match) {
        el.value = match.value;
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else if (type === 'radio' || type === 'checkbox') {
      // Role-based elements (like in modern frameworks)
      el.click();
    }
    return true;
  } catch (e) {
    console.error('Error filling element:', e);
    return false;
  }
}

function triggerValueChange(el, value) {
  el.focus();
  el.value = value;
  el.setAttribute('value', value);
  
  // Dispatch events for React/Vue/etc.
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new Event('blur', { bubbles: true }));
}

function highlightField(el, success) {
  const originalBorder = el.style.border;
  const originalBg = el.style.backgroundColor;
  
  el.style.border = success ? '2px solid #10B981' : '2px solid #EF4444';
  el.style.backgroundColor = success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
  
  setTimeout(() => {
    el.style.border = originalBorder;
    el.style.backgroundColor = originalBg;
  }, 3000);
}

// Global capture for learning
document.addEventListener('submit', (e) => {
  const form = e.target;
  const inputs = form.querySelectorAll('input, textarea, select');
  inputs.forEach(el => {
    const label = findBestLabel(el);
    const value = el.value;
    if (label && value && value.length > 0) {
      chrome.runtime.sendMessage({ action: 'LEARN_FIELD', field: label, value: value });
    }
  });
}, true);
