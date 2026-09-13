// Universal Form Filling Agent - content.js
if (typeof window.autoFillAILoaded === 'undefined') {
  window.autoFillAILoaded = true;

  if (typeof BACKEND_URL === 'undefined') { var BACKEND_URL = 'http://localhost:3000'; }

  // --- GLOBAL CONFIG & VALIDATION ---
  
  const INVALID_FIELD_NAMES = [
    'single line text', 'multi line text', 'enter your answer',
    'the value must be a number', 'other answer', 'other',
    'yes', 'no', 'enter your answer here', 'type your answer',
    'select an option', 'choose an option', 'mm/dd/yyyy',
    'please enter an email', 'please enter a url', 'please enter a number',
    'type here', 'write\npreview', 'comment', 'dummy field just to avoid empty submit',
    'password', 'verify new password', 'authenticity token', 'draft', 'max\u00a0count',
    'submit', 'next', 'back', 'cancel', 'reset'
  ];

  function cleanFieldLabel(text) {
    if (!text) return '';
    let parts = text.split('\n').map(p => p.trim()).filter(p => p.length > 0 && p.toLowerCase() !== 'skipped' && p.toLowerCase() !== 'required');
    let t = parts.length > 0 ? parts[parts.length - 1] : text;
    
    // Strip leading question numbers e.g. "1. Full Name", "1) Name"
    t = t.replace(/^\d+[\.\)]\s*/, '')
         .replace(/\s*\*+$/, '')
         .replace(/Required/gi, '')
         .replace(/^[:\-–\s]+|[:\-–\s]+$/g, '')
         .trim();
    
    // Clean conversational prefixes: "Enter your full name" -> "full name"
    const stripped = t.replace(/^(please\s+)?(enter|type|provide|input|select|choose|fill in|write)\s+(your\s+)?/i, '').trim();
    if (stripped.length >= 2) {
      t = stripped;
    }
    return t;
  }

  function isValidFieldName(text) {
    if (!text) return false;
    const lower = text.toLowerCase().trim();
    if (lower.length < 2 || lower.length > 200) return false;
    if (INVALID_FIELD_NAMES.includes(lower)) return false;
    if (/^\d+$/.test(lower)) return false;
    return true;
  }

  function splitIdentifier(str) {
    if (!str) return '';
    // Split camelCase and snake_case: "applicantEmail" -> "applicant email", "current_city" -> "current city"
    return str.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').trim();
  }

  // --- LABEL RESOLUTION (HIERARCHICAL ENGINE) ---

  function getBestLabel(el) {
    if (!el) return '';

    const clean = (text) => {
      const cleaned = cleanFieldLabel(text);
      return isValidFieldName(cleaned) ? cleaned : '';
    };

    // 1. Linked Label via ID/For
    if (el.id) {
      const labelEl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (labelEl && labelEl.innerText.trim()) {
        const l = clean(labelEl.innerText);
        if (l) return l;
      }
    }

    // 2. Parent Container/Wrapper Label
    const parentLabel = el.closest('label');
    if (parentLabel && parentLabel.innerText.trim()) {
      const l = clean(parentLabel.innerText);
      if (l) return l;
    }

    // 3. Sibling / Container Label Search (Google Forms .M7eMe, MS Forms, Workday, Greenhouse)
    const container = el.closest('[class*="group"], [class*="container"], [class*="field"], [class*="question"], [role="listitem"], .Qr7Oae, .office-form-question');
    if (container) {
      const potentialLabels = container.querySelectorAll('.M7eMe, label, [class*="title"], [class*="label"], legend, h2, h3, h4');
      for (const lbl of potentialLabels) {
        if (lbl !== el && lbl.innerText.trim()) {
          const l = clean(lbl.innerText);
          if (l) return l;
        }
      }
    }

    // 4. ARIA labels (labelledby > label)
    const labelledBy = el.getAttribute('aria-labelledby');
    if (labelledBy) {
      const ids = labelledBy.split(' ');
      let combined = '';
      for (const id of ids) {
        const lEl = document.getElementById(id);
        if (lEl) combined += ' ' + lEl.innerText;
      }
      const l = clean(combined);
      if (l) return l;
    }
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel) {
      const l = clean(ariaLabel);
      if (l) return l;
    }

    // 5. Pre-stored High Quality Label
    const stored = el.getAttribute('data-autofill-label');
    if (stored) {
      const l = clean(stored);
      if (l) return l;
    }

    // 6. Placeholder
    const placeholder = el.placeholder || el.getAttribute('placeholder');
    if (placeholder) {
      const l = clean(placeholder);
      if (l) return l;
    }

    // 7. Input Name attribute (fallback for standard HTML forms)
    if (el.name) {
      const readableName = clean(splitIdentifier(el.name));
      if (readableName) return readableName;
    }

    // 8. Input Title attribute
    if (el.title) {
      const l = clean(el.title);
      if (l) return l;
    }

    return '';
  }

  // --- MESSAGE LISTENER ---

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'GET_HTML') {
      const fields = detectFormFields();
      sendResponse({ fields: fields });
      return true;
    }

    if (message.type === 'FILL_FORM' || message.action === 'FILL_FORM') {
      const data = message.matchedData || message.data || {};
      const filledFields = fillForm(data);
      sendResponse({ success: true, filled: filledFields });
      return true;
    }
    return true;
  });

  // --- CORE FUNCTIONS ---

  function detectFormFields() {
    const fields = [];
    const seen = new Set();

    function addField(text, element = null, isPlaceholder = false) {
      if (!text) return null;
      const cleanLabel = cleanFieldLabel(text);
      
      if (isValidFieldName(cleanLabel) && !seen.has(cleanLabel.toLowerCase())) {
        seen.add(cleanLabel.toLowerCase());
        fields.push(cleanLabel);
        if (element && !isPlaceholder) {
          element.setAttribute('data-autofill-label', cleanLabel);
        }
        return cleanLabel;
      }
      return null;
    }

    // High Quality Strategy 1: ARIA LabelledBy (MS Forms, Google Forms, custom UI)
    document.querySelectorAll('input[aria-labelledby], textarea[aria-labelledby], [role="textbox"][aria-labelledby]').forEach(el => {
      const labelledBy = el.getAttribute('aria-labelledby');
      if (labelledBy) {
        const ids = labelledBy.split(' ');
        for (const id of ids) {
          const labelEl = document.getElementById(id);
          if (labelEl && labelEl.innerText.trim()) { 
            addField(labelEl.innerText, el); 
            break; 
          }
        }
      }
    });

    // Structural Scanning
    document.querySelectorAll('.M7eMe, .office-form-question-title, .question-title-box, label, legend').forEach(el => {
      if (el.innerText.trim()) addField(el.innerText);
    });

    document.querySelectorAll('input[aria-label], textarea[aria-label], select[aria-label], [role="textbox"][aria-label]').forEach(el => {
      addField(el.getAttribute('aria-label'), el);
    });

    // Placeholders
    document.querySelectorAll('input[placeholder], textarea[placeholder], select[placeholder]').forEach(el => {
      addField(el.getAttribute('placeholder') || el.placeholder, el, true);
    });

    // Name & title attributes
    document.querySelectorAll('input:not([type="hidden"]), textarea, select').forEach(el => {
      if (el.name) addField(splitIdentifier(el.name), el, true);
      if (el.title) addField(el.title, el, true);
    });

    return [...new Set(fields)];
  }

  function isNumberField(input, label) {
    if (input && input.type === 'number') return true;
    const placeholder = (input?.getAttribute?.('placeholder') || '').toLowerCase();
    if (placeholder.includes('must be a number') || placeholder.includes('only number')) return true;
    const labelLower = (label || '').toLowerCase();
    if (labelLower.includes('years') || labelLower.includes('phone') || 
        labelLower.includes('contact') || labelLower.includes('ctc') ||
        labelLower.includes('lpa') || labelLower.includes('salary')) return true;
    return false;
  }

  function fillForm(matchedData) {
    const filledFields = [];
    if (!matchedData || Object.keys(matchedData).length === 0) {
      console.warn('AutoFill AI: No matched data provided to fill.');
      return filledFields;
    }

    const allInputs = document.querySelectorAll(
      'input:not([type="hidden"]), textarea, select, [role="textbox"], [contenteditable="true"]'
    );

    const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    allInputs.forEach(input => {
      const label = getBestLabel(input);
      if (!label || !isValidFieldName(label)) return;

      let value = matchedData[label];
      if (!value) {
        // Robust fuzzy search across keys
        const target = norm(label);
        for (const [k, v] of Object.entries(matchedData)) {
          const kNorm = norm(k);
          if (kNorm === target || 
              (kNorm.length >= 3 && target.includes(kNorm)) || 
              (target.length >= 3 && kNorm.includes(target))) {
            value = v;
            break;
          }
        }
      }

      if (value !== undefined && value !== null && value !== '') {
        const finalValue = isNumberField(input, label) ? (value.toString().match(/\d+/)?.[0] || value) : value.toString();
        if (input.tagName === 'SELECT') {
          fillSelect(input, finalValue);
        } else {
          setNativeValue(input, finalValue);
        }
        filledFields.push(label);
      }
    });

    fillRadiosAndCheckboxes(matchedData, filledFields);
    console.log(`AutoFill AI: Form filled ${filledFields.length} fields.`, filledFields);
    return filledFields;
  }

  function fillSelect(select, value) {
    const valStr = value.toString().toLowerCase().trim();
    let matched = false;
    Array.from(select.options).forEach(option => {
      const optText = option.text.toLowerCase().trim();
      const optVal = option.value.toLowerCase().trim();
      if (!matched && (optText === valStr || optVal === valStr || optText.includes(valStr) || valStr.includes(optText))) {
        select.value = option.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        matched = true;
      }
    });
  }

  function fillRadiosAndCheckboxes(matchedData, filledFields) {
    document.querySelectorAll('div[role="radio"], div[role="checkbox"], label[role="radio"], input[type="radio"], input[type="checkbox"]').forEach(el => {
      const parent = el.closest('.Qr7Oae, [class*="question"], [class*="field"], [role="listitem"]');
      if (!parent) return;
      const labelEl = parent.querySelector('.M7eMe, label, [class*="title"], [class*="label"], legend');
      if (!labelEl) return;
      let label = cleanFieldLabel(labelEl.innerText);
      let value = matchedData[label];
      if (!value) {
        const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const target = norm(label);
        for (const [k, v] of Object.entries(matchedData)) {
          if (norm(k) === target || target.includes(norm(k)) || norm(k).includes(target)) {
            value = v;
            break;
          }
        }
      }

      if (value) {
        const optionText = el.closest('label')?.innerText?.trim() || el.innerText?.trim() || el.getAttribute('aria-label') || '';
        const optLower = optionText.toLowerCase();
        const valLower = value.toString().toLowerCase();
        if (optLower && (optLower === valLower || valLower.includes(optLower) || optLower.includes(valLower))) {
          if (el.click) el.click();
          if (el.type === 'checkbox' || el.type === 'radio') {
            el.checked = true;
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
          filledFields.push(label);
        }
      }
    });
  }

  function setNativeValue(element, value) {
    try {
      if (element.getAttribute('contenteditable') === 'true' || element.getAttribute('role') === 'textbox') {
        element.focus();
        element.innerText = value;
        try {
          document.execCommand('selectAll', false, null);
          document.execCommand('insertText', false, value);
        } catch (e) {}
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }

      const proto = (element instanceof HTMLTextAreaElement) ? HTMLTextAreaElement.prototype : (element instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLElement.prototype);
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;

      if (element._valueTracker) {
        element._valueTracker.setValue('');
      }

      if (setter) {
        setter.call(element, value);
      } else {
        element.value = value;
      }

      element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.dispatchEvent(new Event('blur', { bubbles: true }));

      // Fallback for tricky custom frameworks
      if (element.value !== value && element.focus) {
        element.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, value);
      }
    } catch (e) {
      console.error('AutoFill AI: Error in setNativeValue:', e);
    }
  }

  function captureAndLearn(el) {
    if (!el) return;
    const cleanLabel = getBestLabel(el);
    let value = (el.tagName === 'DIV' || el.getAttribute('contenteditable')) ? el.innerText : el.value;

    if (cleanLabel && value && value.trim().length > 0 && isValidFieldName(cleanLabel)) {
      try {
        chrome.runtime.sendMessage({ action: 'LEARN_FIELD', field: cleanLabel, value: value.trim() });
        console.log(`AutoFill AI Learned: "${cleanLabel}" -> "${value.trim()}"`);
      } catch (e) {}
    }
  }

  document.addEventListener('blur', (e) => {
    const el = e.target;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.hasAttribute('contenteditable') || el.getAttribute('role') === 'textbox') {
      captureAndLearn(el);
    }
  }, true);

  document.addEventListener('change', (e) => {
    const el = e.target;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
      captureAndLearn(el);
    }
  }, true);

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button, input[type="submit"], [role="button"]');
    if (!btn) return;
    const btnText = (btn.innerText || btn.value || '').toLowerCase();
    const isSubmit = btn.type === 'submit' || btnText.includes('submit') || btnText.includes('next') || btnText.includes('save') || btnText.includes('finish') || btnText.includes('done') || btnText.includes('apply');
    if (isSubmit) {
      const all = document.querySelectorAll('input:not([type="hidden"]), textarea, select, [role="textbox"], [contenteditable="true"]');
      all.forEach(input => captureAndLearn(input));
    }
  }, true);
}
