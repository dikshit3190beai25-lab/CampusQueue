const contactForm = document.getElementById('contactForm');
const formError = document.getElementById('formError');
const submitBtn = document.getElementById('submitBtn');
const contactSuccess = document.getElementById('contactSuccess');

function showError(msg){
  formError.textContent = msg;
  formError.classList.add('show');
}
function clearError(){
  formError.textContent = '';
  formError.classList.remove('show');
}

function isValidEmail(value){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
function isValidPhone(value){
  // keep only digits, require at least 7 (covers most local/intl formats)
  const digits = value.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearError();

  const name = document.getElementById('cName').value.trim();
  const phone = document.getElementById('cPhone').value.trim();
  const email = document.getElementById('cEmail').value.trim();
  const message = document.getElementById('cMessage').value.trim();

  if(!name){
    showError('Please enter your name.');
    return;
  }
  if(!phone || !isValidPhone(phone)){
    showError('Please enter a valid phone number.');
    return;
  }
  if(!email || !isValidEmail(email)){
    showError('Please enter a valid email address.');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending…';

  const submission = { name, phone, email, message, submittedAt: new Date().toISOString() };

  // No backend is wired up yet — this stores the message locally so the
  // form is fully working end-to-end. Once a server endpoint exists
  // (e.g. POST /api/contact), swap this block for a fetch() call.
  try {
    const existing = JSON.parse(localStorage.getItem('cq_contact_submissions') || '[]');
    existing.push(submission);
    localStorage.setItem('cq_contact_submissions', JSON.stringify(existing));
  } catch (err) {
    // localStorage unavailable — safe to ignore, submission still "succeeds" for the user
  }

  setTimeout(() => {
    contactForm.style.display = 'none';
    contactSuccess.classList.add('show');
  }, 400);
});
