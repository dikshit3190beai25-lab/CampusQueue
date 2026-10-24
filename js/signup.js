wireAuthForm({
  formId: 'signupForm',
  submitId: 'submitBtn',
  errorId: 'formError',
  action: 'signup',
  submitLabel: 'Create account',
  loadingLabel: 'Creating account…',
  validate: () => {
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirm').value;
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (password !== confirm) return 'Passwords do not match.';
    return null;
  },
  buildPayload: () => ({
    name: document.getElementById('name').value.trim(),
    email: document.getElementById('email').value.trim(),
    password: document.getElementById('password').value,
  }),
});

const quickFillBtn = document.getElementById('quickFillSignupBtn');
if (quickFillBtn) {
  quickFillBtn.addEventListener('click', () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    document.getElementById('name').value = 'Taylor Swift ' + randomSuffix;
    document.getElementById('email').value = `taylor.${randomSuffix}@campus.edu`;
    document.getElementById('password').value = 'campuspass123';
    document.getElementById('confirm').value = 'campuspass123';
    window.showToast('Sample student details populated! Enter CAPTCHA to finish.', '⚡');
    const cap = document.getElementById('captchaInput');
    if (cap) cap.focus();
  });
}

