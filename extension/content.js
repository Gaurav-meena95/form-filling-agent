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
    'password', 'verify new password', 'authenticity token', 'draft', 'max\u00a0count'
  ];

  function isValidFieldName(text) {
    if (!text) return false;
    const lower = text.toLowerCase().trim();
    if (lower.length < 2) return false;
    if (lower.length > 200) return false;
    if (INVALID_FIELD_NAMES.includes(lower)) return false;
    if (lower.startsWith('enter ') || lower.startsWith('type ') || lower.startsWith('select ') || lower.startsWith('please ')) return false;
    if (/^\d+$/.test(lower)) return false;
    return true;
  }

  // --- LABEL RESOLUTION (HIEARCHICAL ENGINE) ---

  /**
   * Resolves the best label for an element using a strict priority engine.
   * Priority: Linked Label > Parent Label > Sibling Label > ARIA > High-Quality Stored > Placeholder (Last)
   */
  function getBestLabel(el) {
    if (!el) return '';
    
    const clean = (text) => {
        if (!text) return '';
        const t = text.replace(/^\d+\.\s*/, '').replace(/\s*\*$/, '').replace('Required', '').replace(':', '').trim();
        return isValidFieldName(t) ? t : '';
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

    // 3. Sibling Label Search (Common in input-group structure)
    // Look for a label or title-like element before the input in the same container
    const container = el.closest('[class*="group"], [class*="container"], [class*="field"], [class*="question"], .Qr7Oae, .office-form-question');
    if (container) {
        const potentialLabels = container.querySelectorAll('label, [class*="title"], [class*="label"], .M7eMe, legend');
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

    // 5. Pre-stored High Quality Label (from specialized strategies)
    const stored = el.getAttribute('data-autofill-label');
    if (stored) {
        const l = clean(stored);
        if (l) return l;
    }

    // 6. Placeholder (Absolute Final Fallback)
    const placeholder = el.placeholder || el.getAttribute('placeholder');
    if (placeholder) {
        const l = clean(placeholder);
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
      const data = message.matchedData || message.data;
      const filledFields = fillForm(data);
      sendResponse({ success: true, filled: filledFields });
    }
    return true;
  });

  // --- CORE FUNCTIONS ---

  function detectFormFields() {
    const fields = [];
    const seen = new Set();

    function addField(text, element = null, isPlaceholder = false) {
      if (!text) return null;
      const cleanLabel = text.trim()
        .replace('*', '')
        .replace('Required', '')
        .replace(':', '')
        .replace(/^\d+\.\s*/, '')
        .trim();
      
      if (isValidFieldName(cleanLabel) && !seen.has(cleanLabel.toLowerCase())) {
        seen.add(cleanLabel.toLowerCase());
        fields.push(cleanLabel);
        // ONLY tag if it's NOT a placeholder
        if (element && !isPlaceholder) {
            element.setAttribute('data-autofill-label', cleanLabel);
        }
        return cleanLabel;
      }
      return null;
    }

    // High Quality Strategy 1: ARIA LabelledBy (MS Forms etc)
    document.querySelectorAll('input[aria-labelledby], textarea[aria-labelledby], [role="textbox"][aria-labelledby]').forEach(el => {
      const labelledBy = el.getAttribute('aria-labelledby');
      if (labelledBy) {
        const ids = labelledBy.split(' ');
        for (const id of ids) {
            if (id.startsWith('QuestionId_') || id.startsWith('Question')) {
                const labelEl = document.getElementById(id);
                if (labelEl) { addField(labelEl.innerText, el); break; }
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

    // Placeholders (HINT only, never tags)
    document.querySelectorAll('input[placeholder], textarea[placeholder], select[placeholder]').forEach(el => {
      addField(el.getAttribute('placeholder') || el.placeholder, el, true);
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
    const allInputs = document.querySelectorAll(
      'input:not([type="hidden"]), textarea, select, [role="textbox"], [contenteditable="true"]'
    );

    allInputs.forEach(input => {
      const label = getBestLabel(input);
      if (!label || !isValidFieldName(label)) return;

      let value = matchedData[label];
      if (!value) {
        const key = Object.keys(matchedData).find(k => 
          k.trim().toLowerCase() === label.toLowerCase() || label.toLowerCase().includes(k.toLowerCase())
        );
        if (key) value = matchedData[key];
      }

      if (value) {
        const finalValue = isNumberField(input, label) ? value.toString().match(/\d+/)?.[0] || value : value.toString();
        if (input.tagName === 'SELECT') fillSelect(input, finalValue);
        else setNativeValue(input, finalValue);
        filledFields.push(label);
      }
    });

    fillRadiosAndCheckboxes(matchedData, filledFields);
    return filledFields;
  }

  function fillSelect(select, value) {
    const valStr = value.toString().toLowerCase();
    Array.from(select.options).forEach(option => {
      if (option.text.toLowerCase().includes(valStr) || option.value.toLowerCase() === valStr) {
        select.value = option.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  }

  function fillRadiosAndCheckboxes(matchedData, filledFields) {
    document.querySelectorAll('div[role="radio"], div[role="checkbox"], label[role="radio"], input[type="radio"], input[type="checkbox"]').forEach(el => {
      const parent = el.closest('.Qr7Oae, [class*="question"], [class*="field"]');
      if (!parent) return;
      const labelEl = parent.querySelector('.M7eMe, label, [class*="title"], [class*="label"]');
      if (!labelEl) return;
      let label = labelEl.innerText.replace(/^\d+\.\s*/, '').replace('*','').trim();
      let value = matchedData[label] || matchedData[Object.keys(matchedData).find(k => k.toLowerCase() === label.toLowerCase())];
      if (value) {
        const optionText = el.closest('label')?.innerText?.trim() || el.innerText?.trim() || el.getAttribute('aria-label');
        if (optionText && value.toString().toLowerCase().includes(optionText.toLowerCase())) {
          if (el.click) el.click();
          filledFields.push(label);
        }
      }
    });
  }

  function setNativeValue(element, value) {
    try {
      let proto = (element instanceof HTMLTextAreaElement) ? HTMLTextAreaElement.prototype : (element instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLElement.prototype);
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (setter && element.tagName !== 'DIV') setter.call(element, value);
      else {
        element.value = value;
        if (element.tagName === 'DIV' || element.getAttribute('contenteditable')) element.innerText = value;
      }
      if (element._valueTracker) element._valueTracker.setValue('');
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.dispatchEvent(new Event('blur', { bubbles: true }));
      if (element.focus && (element.value !== value && element.innerText !== value)) {
          element.focus();
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

    if (cleanLabel && value && value.trim().length > 0) {
      try {
        chrome.runtime.sendMessage({ action: 'LEARN_FIELD', field: cleanLabel, value: value.trim() });
        console.log(`AutoFill AI: Learning: "${cleanLabel}" -> "${value.trim()}"`);
      } catch (e) {}
    }
  }

  document.addEventListener('blur', (e) => {
    const el = e.target;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.hasAttribute('contenteditable') || el.getAttribute('role') === 'textbox') {
        captureAndLearn(el);
    }
  }, true);

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button, input[type="submit"], [role="button"]');
    if (!btn) return;
    const btnText = (btn.innerText || btn.value || '').toLowerCase();
    const isSubmit = btn.type === 'submit' || btnText.includes('submit') || btnText.includes('next') || btnText.includes('save') || btnText.includes('finish') || btnText.includes('done');
    if (isSubmit) {
        const all = document.querySelectorAll('input:not([type="hidden"]), textarea, select, [role="textbox"], [contenteditable="true"]');
        all.forEach(input => captureAndLearn(input));
    }
  }, true);
}
