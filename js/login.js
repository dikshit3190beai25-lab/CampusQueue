wireAuthForm({
  formId: 'loginForm',
  submitId: 'submitBtn',
  errorId: 'formError',
  action: 'login',
  submitLabel: 'Log in',
  loadingLabel: 'Logging in…',
  buildPayload: () => ({
    email: document.getElementById('email').value.trim(),
    password: document.getElementById('password').value,
  }),
});
