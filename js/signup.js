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
