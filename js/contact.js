/* =========================================================
   contact.js
   Handles contact form submission, office hours modal,
   FAQ accordion expand/collapse, and multi-submission.
   ========================================================= */

const contactForm = document.getElementById('contactForm');
const formError = document.getElementById('formError');
const submitBtn = document.getElementById('submitBtn');
const contactSuccess = document.getElementById('contactSuccess');
const sendAnotherBtn = document.getElementById('sendAnotherBtn');
const officeInfoRow = document.getElementById('officeInfoRow');

function showError(msg) {
  if (!formError) return;
  formError.textContent = msg;
  formError.classList.add('show');
}

function clearError() {
  if (!formError) return;
  formError.textContent = '';
  formError.classList.remove('show');
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value) {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearError();

    const name = document.getElementById('cName').value.trim();
    const phone = document.getElementById('cPhone').value.trim();
    const email = document.getElementById('cEmail').value.trim();
    const message = document.getElementById('cMessage').value.trim();

    if (!name) {
      showError('Please enter your full name.');
      return;
    }
    if (!phone || !isValidPhone(phone)) {
      showError('Please enter a valid phone number (at least 7 digits).');
      return;
    }
    if (!email || !isValidEmail(email)) {
      showError('Please enter a valid academic or personal email address.');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending message…';
    }

    const submission = { name, phone, email, message, submittedAt: new Date().toISOString() };

    try {
      const existing = JSON.parse(localStorage.getItem('cq_contact_submissions') || '[]');
      existing.push(submission);
      localStorage.setItem('cq_contact_submissions', JSON.stringify(existing));
    } catch (err) {}

    setTimeout(() => {
      contactForm.style.display = 'none';
      if (contactSuccess) contactSuccess.classList.add('show');
      if (window.cqAudio) window.cqAudio.playSuccess();
      window.showToast('Message sent to campus support!', '✉');
    }, 400);
  });
}

// "Send Another Message" button
if (sendAnotherBtn) {
  sendAnotherBtn.addEventListener('click', () => {
    if (contactForm) {
      contactForm.reset();
      contactForm.style.display = 'block';
    }
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send message';
    }
    if (contactSuccess) {
      contactSuccess.classList.remove('show');
    }
    clearError();
  });
}

// Office Information Modal
if (officeInfoRow) {
  officeInfoRow.addEventListener('click', () => {
    window.openModal({
      title: 'CampusQueue Support Office',
      subtitle: 'Student Union Building · Room 304',
      contentHtml: `
        <div style="display:flex; flex-direction:column; gap:14px; font-size:13.5px; line-height:1.6;">
          <div style="background:var(--bg-input); padding:14px; border-radius:12px; border:1px solid var(--border-soft);">
            <div style="font-size:12px; color:var(--text-3); font-weight:700; text-transform:uppercase; margin-bottom:4px;">Weekly Office Hours</div>
            <div>• <strong>Monday – Thursday:</strong> 9:00 AM – 5:00 PM</div>
            <div>• <strong>Friday:</strong> 9:00 AM – 3:30 PM</div>
            <div>• <strong>Saturday & Sunday:</strong> Closed (Online ticket queue active)</div>
          </div>
          <div>
            <strong>Walk-in Assistance:</strong> No appointment needed for student account access, password verification, or coursework schedule audits.
          </div>
          <div style="display:flex; justify-content:flex-end; margin-top:6px;">
            <button type="button" class="cq-btn cq-btn-primary" id="closeOfficeModalBtn">Understood</button>
          </div>
        </div>
      `,
      onOpen: (modal, close) => {
        const btn = modal.querySelector('#closeOfficeModalBtn');
        if (btn) btn.addEventListener('click', close);
      }
    });
  });
}

// FAQ Accordion logic
document.querySelectorAll('.faq-question').forEach(q => {
  q.addEventListener('click', () => {
    const item = q.closest('.faq-item');
    const wasOpen = item.classList.contains('open');

    // Close others for clean single-open accordion
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));

    if (!wasOpen) {
      item.classList.add('open');
      if (window.cqAudio) window.cqAudio.playPop();
    }
  });
});
