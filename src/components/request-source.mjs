const sources = new Set(['home', 'pricing', 'pricing-faq', 'faq', 'footer', 'agencies', 'developers', 'creators', 'customer-support']);

export function setRequestSource(form, search) {
  const requested = new URLSearchParams(search).get('from');
  const field = form.querySelector('input[name="source"]');
  if (field) field.value = sources.has(requested) ? requested : 'direct';
}
