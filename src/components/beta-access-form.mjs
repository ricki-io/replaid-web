export function initBetaAccessForm({ form, status, success, send = fetch, readForm = element => new FormData(element), resetCaptcha = () => window.hcaptcha?.reset() }) {
  const button = form.querySelector('button[type="submit"]');
  const label = button.textContent;
  let pending = false;
  const showError = message => {
    status.textContent = message;
    status.hidden = false;
    status.focus();
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || !form.reportValidity()) return;
    const data = readForm(form);
    const channels = data.getAll('channel');
    if (channels.length === 0) {
      showError('Select at least one channel.');
      return;
    }
    data.set('channel', channels.join(', '));
    if (!String(data.get('h-captcha-response') ?? '').trim()) {
      showError('Complete the spam check before sending your request.');
      return;
    }
    if (data.get('botcheck')) return;
    data.delete('redirect');
    pending = true;
    button.disabled = true;
    button.textContent = 'Sending…';
    form.setAttribute('aria-busy', 'true');
    status.hidden = true;
    status.textContent = '';
    try {
      const response = await send(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(data)),
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) throw new Error('Request was not accepted');
      form.hidden = true;
      success.hidden = false;
      success.querySelector('h2').focus();
      form.reset();
    } catch {
      showError('We could not confirm your request. Try again, or email hi@replaid.pro.');
      resetCaptcha();
    } finally {
      pending = false;
      button.disabled = false;
      button.textContent = label;
      form.removeAttribute('aria-busy');
    }
  });
}


export function initBetaSelect(details, { placeholder = 'Choose channels', closeOnSelect = false } = {}) {
  const summary = details.querySelector('summary');
  const label = details.querySelector('[data-selected-value]');
  const updateLabel = () => {
    const selected = Array.from(details.querySelectorAll('input:checked'), input => input.value);
    label.textContent = selected.filter(Boolean).join(', ') || placeholder;
    summary.title = selected.join(', ');
  };
  updateLabel();
  details.addEventListener('change', updateLabel);
  details.addEventListener('click', event => {
    if (!closeOnSelect || event.target.type !== 'radio' || event.detail === 0) return;
    updateLabel();
    details.open = false;
    summary.focus();
  });
  details.addEventListener('keydown', event => {
    const isSelection = closeOnSelect && event.key === 'Enter' && event.target.type === 'radio';
    if ((event.key !== 'Escape' && !isSelection) || !details.open) return;
    event.preventDefault();
    details.open = false;
    summary.focus();
  });
  details.addEventListener('focusout', event => {
    if (event.relatedTarget && !details.contains(event.relatedTarget)) details.open = false;
  });
  details.ownerDocument.addEventListener('pointerdown', event => {
    if (!details.contains(event.target)) details.open = false;
  });
}
