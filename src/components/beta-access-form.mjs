export { initRequestForm as initBetaAccessForm } from './request-form.mjs';

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
