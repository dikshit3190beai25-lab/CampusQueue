/* =========================================================
   login.js
   Handles login form submission, quick demo login,
   and forgot password recovery.
   ========================================================= */

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

// Quick 1-Click Demo Login
const demoLoginBtn = document.getElementById('demoLoginBtn');
if (demoLoginBtn) {
  demoLoginBtn.addEventListener('click', () => {
    const user = window.CQAuth.demoLogin();
    if (window.cqAudio) window.cqAudio.playSuccess();
    window.showToast(`Logged in as ${user.name}! Redirecting…`, '⚡');
    setTimeout(() => {
      window.location.href = 'home.html';
    }, 400);
  });
}

// Forgot Password Modal
const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
if (forgotPasswordBtn) {
  forgotPasswordBtn.addEventListener('click', () => {
    window.openModal({
      title: 'Reset Password',
      subtitle: 'Enter your student email to receive recovery instructions',
      contentHtml: `
        <form id="forgotPassForm">
          <div class="cq-form-group">
            <label class="cq-label" for="resetEmail">Campus Email</label>
            <input type="email" id="resetEmail" class="cq-input" placeholder="you@campus.edu" required>
          </div>
          <div style="font-size:12px; color:var(--text-3); margin-bottom:14px;">
            A one-time secure login code will be dispatched to your student inbox.
          </div>
          <div style="display:flex; justify-content:flex-end; gap:10px;">
            <button type="submit" class="cq-btn cq-btn-primary">Send Reset Instructions</button>
          </div>
        </form>
      `,
      onOpen: (modal, close) => {
        const form = modal.querySelector('#forgotPassForm');
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const email = modal.querySelector('#resetEmail').value.trim();
          close();
          window.showToast(`Reset email sent to ${email}!`, '✉');
        });
      }
    });
  });
}
