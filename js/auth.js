/* auth.js — shared form-wiring and CAPTCHA logic for login and signup pages.
   Provides interactive visual CAPTCHA generation, canvas drawing with distortion/noise,
   and client-side verification to confirm human interaction.
*/

/**
 * Initializes a canvas-based CAPTCHA verification component.
 * @param {string} canvasId
 * @param {string} refreshBtnId
 * @param {string} inputId
 */
function initCaptcha(canvasId = 'captchaCanvas', refreshBtnId = 'captchaRefreshBtn', inputId = 'captchaInput') {
  const canvas = document.getElementById(canvasId);
  const refreshBtn = document.getElementById(refreshBtnId);
  const input = document.getElementById(inputId);

  if (!canvas) return null;

  // Non-ambiguous character set (no 0/O, 1/l/I)
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
  let currentCaptcha = '';

  function generateCode(length = 5) {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  function drawCaptcha() {
    currentCaptcha = generateCode(5);
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Theme-aware background
    const isDark = document.body.getAttribute('data-theme') !== 'light';
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    if (isDark) {
      bgGrad.addColorStop(0, '#151519');
      bgGrad.addColorStop(0.5, '#1e1e26');
      bgGrad.addColorStop(1, '#151519');
    } else {
      bgGrad.addColorStop(0, '#e4e7ef');
      bgGrad.addColorStop(0.5, '#f4f5f9');
      bgGrad.addColorStop(1, '#e4e7ef');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Noise lines
    const lineColors = isDark 
      ? ['rgba(77,107,254,0.38)', 'rgba(47,212,165,0.38)', 'rgba(255,107,122,0.32)', 'rgba(245,184,78,0.32)']
      : ['rgba(77,107,254,0.48)', 'rgba(47,212,165,0.48)', 'rgba(255,107,122,0.42)', 'rgba(245,184,78,0.42)'];

    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = lineColors[i % lineColors.length];
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(Math.random() * (width * 0.2), Math.random() * height);
      ctx.bezierCurveTo(
        Math.random() * width, Math.random() * height,
        Math.random() * width, Math.random() * height,
        width - Math.random() * (width * 0.2), Math.random() * height
      );
      ctx.stroke();
    }

    // Noise dots / specks
    for (let i = 0; i < 28; i++) {
      ctx.fillStyle = lineColors[Math.floor(Math.random() * lineColors.length)];
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 1.6 + 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Distorted character drawing
    const charSpacing = width / (currentCaptcha.length + 1);
    const textColors = isDark
      ? ['#7b8fff', '#3de2b4', '#ff7a88', '#f8c366', '#a78bfa', '#38bdf8']
      : ['#3552d6', '#0d9468', '#dc2626', '#d97706', '#7c3aed', '#0284c7'];

    for (let i = 0; i < currentCaptcha.length; i++) {
      const char = currentCaptcha[i];
      ctx.save();
      const x = charSpacing * (i + 0.85) + (Math.random() * 4 - 2);
      const y = height / 2 + (Math.random() * 4 - 2);
      const angle = (Math.random() * 30 - 15) * Math.PI / 180;

      ctx.translate(x, y);
      ctx.rotate(angle);

      ctx.font = `800 ${Math.floor(Math.random() * 3 + 21)}px "JetBrains Mono", "Plus Jakarta Sans", monospace`;
      ctx.fillStyle = textColors[Math.floor(Math.random() * textColors.length)];
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Drop shadow for depth
      ctx.shadowColor = isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      ctx.fillText(char, 0, 0);
      ctx.restore();
    }
  }

  // Draw initial CAPTCHA
  drawCaptcha();

  // Redraw if theme changes
  window.addEventListener('themechange', drawCaptcha);

  // Attach refresh events
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      drawCaptcha();
      if (input) {
        input.value = '';
        input.focus();
      }
    });
  }

  canvas.addEventListener('click', () => {
    drawCaptcha();
    if (input) {
      input.value = '';
      input.focus();
    }
  });

  return {
    getCode: () => currentCaptcha,
    refresh: () => {
      drawCaptcha();
      if (input) input.value = '';
    },
    validate: () => {
      if (!input) return { valid: true };
      const val = input.value.trim();
      if (!val) {
        return { valid: false, message: 'Please enter the verification code to verify you are not a robot.' };
      }
      if (val.toLowerCase() !== currentCaptcha.toLowerCase()) {
        return { valid: false, message: 'Incorrect verification code. Please try again.' };
      }
      return { valid: true };
    }
  };
}

/**
 * Wires up show/hide password toggle buttons on the current page.
 * Looks for `.password-toggle-btn[data-toggle-for]` and flips the
 * type of the matching input between 'password' and 'text'.
 */
function initPasswordToggles() {
  document.querySelectorAll('.password-toggle-btn[data-toggle-for]').forEach((btn) => {
    const input = document.getElementById(btn.getAttribute('data-toggle-for'));
    if (!input) return;
    btn.addEventListener('click', () => {
      const isVisible = input.type === 'text';
      input.type = isVisible ? 'password' : 'text';
      btn.classList.toggle('is-visible', !isVisible);
      const label = isVisible ? 'Show password' : 'Hide password';
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
    });
  });
}
initPasswordToggles();

/**
 * Handles form wiring, CAPTCHA validation, and submission for login and signup forms.
 */
function wireAuthForm(options) {
  const {
    formId,
    submitId,
    errorId,
    action,      // 'login' | 'signup' — which CQAuth method to call
    submitLabel,
    loadingLabel,
    buildPayload,
    validate,
  } = options;

  const form = document.getElementById(formId);
  const submitBtn = document.getElementById(submitId);
  const errorEl = document.getElementById(errorId);

  if (!form) return;

  // Initialize CAPTCHA if available on this form
  const captchaHandler = initCaptcha('captchaCanvas', 'captchaRefreshBtn', 'captchaInput');

  function showError(msg) {
    if (!errorEl) return;
    errorEl.textContent = msg;
    errorEl.classList.add('show');
    errorEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function clearError() {
    if (!errorEl) return;
    errorEl.textContent = '';
    errorEl.classList.remove('show');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearError();

    // 1. Validate CAPTCHA first to ensure user is not a robot
    if (captchaHandler) {
      const captchaResult = captchaHandler.validate();
      if (!captchaResult.valid) {
        showError(captchaResult.message);
        captchaHandler.refresh();
        const input = document.getElementById('captchaInput');
        if (input) input.focus();
        return;
      }
    }

    // 2. Custom validation (e.g. password match)
    if (typeof validate === 'function') {
      const validationError = validate();
      if (validationError) {
        showError(validationError);
        return;
      }
    }

    const payload = typeof buildPayload === 'function' ? buildPayload() : {};

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = loadingLabel || 'Please wait…';
    }

    // Local-storage backed auth — no server involved.
    const result = action === 'signup'
      ? window.CQAuth.signup(payload)
      : window.CQAuth.login(payload);

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = submitLabel || 'Submit';
    }

    if (!result.ok) {
      showError(result.message);
      if (captchaHandler) captchaHandler.refresh();
      return;
    }

    window.location.href = 'home.html';
  });
}
