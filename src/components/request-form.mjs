export function initRequestForm({ form, status, success, send = fetch, readForm = element => new FormData(element), resetCaptcha = () => window.hcaptcha?.reset() }) {
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
    const channels = data.getAll('channel').filter(value => String(value).trim());
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
