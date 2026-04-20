// Universal Form Filling Agent - content.js
if (typeof window.autoFillAILoaded === 'undefined') {
  window.autoFillAILoaded = true;

  if (typeof BACKEND_URL === 'undefined') { var BACKEND_URL = 'http://localhost:3000'; }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('AutoFill AI: Message received:', message);
    if (message.action === 'GET_HTML') {
      const fields = detectFormFields();
      console.log('AutoFill AI: Detected fields:', fields);
      sendResponse({ fields: fields });
      return true;
    }

    if (message.type === 'FILL_FORM' || message.action === 'FILL_FORM') {
      const data = message.matchedData || message.data;
      const filledFields = fillForm(data);
      console.log('AutoFill AI: Fill complete. Success fields:', filledFields);
      sendResponse({ success: true, filled: filledFields });
    }
    return true;
  });

  function detectFormFields() {
    const fields = [];
    const seen = new Set();

    // These are placeholders/options, not field labels - ignore them
    const INVALID_FIELD_NAMES = [
      'single line text', 'multi line text', 'enter your answer',
      'the value must be a number', 'other answer', 'other',
      'yes', 'no', 'enter your answer here', 'type your answer',
      'select an option', 'choose an option', 'mm/dd/yyyy'
    ];

    function isValidFieldName(text) {
      if (!text) return false;
      const lower = text.toLowerCase().trim();
      if (lower.length < 2) return false;
      if (lower.length > 200) return false;
      if (INVALID_FIELD_NAMES.includes(lower)) return false;
      if (lower.startsWith('enter ') || lower.startsWith('type ') || lower.startsWith('select ')) return false;
      if (/^\d+$/.test(lower)) return false;
      return true;
    }

    function addField(text, element = null) {
      if (!text) return null;
      const clean = text.trim()
        .replace('*', '')
        .replace('Required', '')
        .replace(':', '')
        .replace(/^\d+\.\s*/, '') // Clean question number prefix like "1. "
        .trim();
      
      if (isValidFieldName(clean) && !seen.has(clean.toLowerCase())) {
        seen.add(clean.toLowerCase());
        fields.push(clean);
        if (element) element.setAttribute('data-autofill-label', clean);
        return clean;
      }
      return null;
    }

    // Strategy 1: Microsoft Forms - aria-labelledby pointing to QuestionId div
    document.querySelectorAll('input[aria-labelledby], textarea[aria-labelledby], [role="textbox"][aria-labelledby]').forEach(el => {
      const labelledBy = el.getAttribute('aria-labelledby');
      if (!labelledBy) return;
      
      const ids = labelledBy.split(' ');
      for (const id of ids) {
        if (id.startsWith('QuestionId_') || id.startsWith('Question')) {
          const labelEl = document.getElementById(id);
          if (labelEl) {
            addField(labelEl.innerText, el);
            break;
          }
        }
      }
    });

    // Strategy 2: Google Forms
    document.querySelectorAll('.M7eMe').forEach(el => addField(el.innerText));

    // Strategy 3: Microsoft Forms Fallback
    document.querySelectorAll('.office-form-question-title, .question-title-box').forEach(el => {
      addField(el.innerText);
    });

    // Strategy 4: Generic - label elements
    document.querySelectorAll('label').forEach(el => {
      if (!el.querySelector('input') && !el.querySelector('textarea')) {
        addField(el.innerText);
      }
    });

    // Strategy 5: fieldset legend
    document.querySelectorAll('legend').forEach(el => addField(el.innerText));

    // Strategy 6: aria-label on inputs
    document.querySelectorAll('input[aria-label], textarea[aria-label], select[aria-label], [role="textbox"][aria-label]').forEach(el => {
      addField(el.getAttribute('aria-label'), el);
    });

    // Strategy 7: placeholder text
    document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(el => {
      addField(el.getAttribute('placeholder'), el);
    });

    // Strategy 8: ContentEditable detection
    document.querySelectorAll('[contenteditable="true"]').forEach(el => {
        // Try to find a label nearby
        const parent = el.closest('[class*="field"], [class*="question"]');
        if (parent) {
            const labelEl = parent.querySelector('label, [class*="label"], [class*="title"]');
            if (labelEl) addField(labelEl.innerText, el);
        }
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

  function extractNumber(value) {
    if (!value) return '';
    const match = value.toString().match(/\d+(\.\d+)?/);
    return match ? match[0] : '';
  }

  function fillForm(matchedData) {
    console.log('AutoFill AI: Starting fill with:', matchedData);
    const filledFields = [];

    // Find all potential input elements (Standard + Modern Custom)
    const allInputs = document.querySelectorAll(
      'input:not([type="hidden"]), textarea, select, [role="textbox"], [contenteditable="true"]'
    );

    allInputs.forEach(input => {
      let label = input.getAttribute('data-autofill-label') || '';
      
      // Resolve label if not already found
      if (!label) {
        const labelledById = input.getAttribute('aria-labelledby');
        if (labelledById) {
          const ids = labelledById.split(' ');
          for (const id of ids) {
            const labelEl = document.getElementById(id);
            if (labelEl) { label = labelEl.innerText.trim(); break; }
          }
        }
      }
      if (!label) label = input.getAttribute('aria-label') || '';
      if (!label && input.id) label = document.querySelector(`label[for="${input.id}"]`)?.innerText?.trim() || '';
      if (!label) label = input.placeholder || '';
      if (!label) {
        const parent = input.closest('[class*="question"], [class*="field"], [class*="form-group"], .Qr7Oae, .office-form-question');
        if (parent) {
          const labelEl = parent.querySelector('label, [class*="title"], [class*="label"], .M7eMe');
          if (labelEl) label = labelEl.innerText.trim();
        }
      }

      if (!label) return;

      // Normalize label for matching
      label = label.replace(/^\d+\.\s*/, '').replace(/\s*\*$/, '').replace(/Required$/, '').replace(/:$/, '').trim();

      // Find value
      let value = matchedData[label];
      if (!value) {
        const key = Object.keys(matchedData).find(k => 
          k.trim().toLowerCase() === label.toLowerCase() || label.toLowerCase().includes(k.toLowerCase())
        );
        if (key) value = matchedData[key];
      }

      if (value) {
        const finalValue = isNumberField(input, label) ? extractNumber(value) : value.toString();
        
        console.log(`AutoFill AI: Attempting to fill: "${label}" with "${finalValue}"`);
        
        if (input.tagName === 'SELECT') {
            fillSelect(input, finalValue);
        } else {
            setNativeValue(input, finalValue);
        }
        
        filledFields.push(label);
      }
    });

    // Special Radio/Checkbox Handling
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

  /**
   * BULLETPROOF SETTER
   * Bypasses React/Vue by using the native prototype setter.
   */
  function setNativeValue(element, value) {
    try {
      // 1. Target the correct prototype
      let prototype;
      if (element instanceof HTMLTextAreaElement) prototype = window.HTMLTextAreaElement.prototype;
      else if (element instanceof HTMLInputElement) prototype = window.HTMLInputElement.prototype;
      else prototype = window.HTMLElement.prototype;

      // 2. Use the native setter to bypass framework interception
      const nativeSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
      
      if (nativeSetter && element.tagName !== 'DIV') {
        nativeSetter.call(element, value);
      } else {
        // Fallback for contenteditable or missing native setter
        element.value = value;
        if (element.tagName === 'DIV' || element.getAttribute('contenteditable')) {
            element.innerText = value;
        }
      }

      // 3. React _valueTracker hack
      const tracker = element._valueTracker;
      if (tracker) {
        tracker.setValue(''); // Reset tracker to force React to see the change
      }

      // 4. Dispatch Events
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.dispatchEvent(new Event('blur', { bubbles: true }));

      // 5. Final Typing Fallback for stubborn React state
      if (element.focus && (element.value !== value && element.innerText !== value)) {
          element.focus();
          document.execCommand('insertText', false, value);
      }

    } catch (e) {
      console.error('AutoFill AI: Error in setNativeValue:', e);
    }
  }

  /**
   * PROACTIVE LEARNING logic
   * Captures field data and sends to backend for learning.
   */
  function captureAndLearn(el) {
    if (!el) return;
    
    // 1. Resolve Label (Same priority logic as detection)
    let label = el.getAttribute('data-autofill-label') || el.getAttribute('aria-label') || el.placeholder;
    if (!label && el.id) label = document.querySelector(`label[for="${el.id}"]`)?.innerText;
    
    // Fallback for parents
    if (!label) {
        const parent = el.closest('[class*="question"], [class*="field"], .Qr7Oae');
        const labelEl = parent?.querySelector('label, [class*="title"], [class*="label"], .M7eMe');
        if (labelEl) label = labelEl.innerText;
    }

    // 2. Resolve Value
    let value = el.value;
    if (el.tagName === 'DIV' || el.getAttribute('contenteditable')) {
        value = el.innerText;
    }

    if (label && value && value.trim().length > 0) {
      // Clean label consistently (strip numbers, dots, stars)
      const cleanLabel = label.replace(/^\d+\.\s*/, '').replace('*','').replace('Required', '').replace(':', '').trim();
      
      try {
        chrome.runtime.sendMessage({ 
          action: 'LEARN_FIELD', 
          field: cleanLabel, 
          value: value.trim() 
        });
        console.log(`AutoFill AI: Proactively learning: "${cleanLabel}" -> "${value.trim()}"`);
      } catch (e) {
         // Extension context might be invalidated on navigation, ignore.
      }
    }
  }

  // 1. Real-Time Learning: Capture data whenever focus leaves a field
  document.addEventListener('blur', (e) => {
    const el = e.target;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.hasAttribute('contenteditable') || el.getAttribute('role') === 'textbox') {
        captureAndLearn(el);
    }
  }, true);

  // 2. Submit Interception: Capture everything when a submit button is clicked
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button, input[type="submit"], [role="button"]');
    if (!btn) return;

    const btnText = (btn.innerText || btn.value || '').toLowerCase();
    const isSubmit = btn.type === 'submit' || 
                     btnText.includes('submit') || 
                     btnText.includes('next') || 
                     btnText.includes('save') || 
                     btnText.includes('finish') ||
                     btnText.includes('done');

    if (isSubmit) {
        console.log('AutoFill AI: Submit detected via click, performing final capture...');
        const allFillables = document.querySelectorAll('input:not([type="hidden"]), textarea, select, [role="textbox"], [contenteditable="true"]');
        allFillables.forEach(input => captureAndLearn(input));
    }
  }, true);
}
