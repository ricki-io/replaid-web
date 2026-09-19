export const CONSENT_KEY = 'replaid-analytics-consent-v1';
export const CONSENT_DURATION = 180 * 24 * 60 * 60 * 1000;
export const MEASUREMENT_ID = 'G-T2C7LJY6CL';

export function readConsent(raw, now = Date.now()) {
  try {
    const value = JSON.parse(raw);
    return value?.version === 1 && ['accepted', 'rejected'].includes(value.analytics)
      && Number.isFinite(value.expiresAt) && value.expiresAt > now && value.expiresAt <= now + CONSENT_DURATION
      ? value : null;
  } catch { return null; }
}

export function initAnalyticsConsent({ win = window, doc = document, enabled = false, now = Date.now } = {}) {
  const banner = doc.querySelector('[data-cookie-banner]');
  const statuses = doc.querySelectorAll('[data-cookie-status]');
  const choices = doc.querySelectorAll('[data-analytics-choice]');
  let consent;
  let loaded = false;
  let timer;
  let persistenceFailed = false;
  const stored = () => { try { return readConsent(win.localStorage.getItem(CONSENT_KEY), now()); } catch { return null; } };

  function clearAnalyticsCookies() {
    const domains = ['', win.location.hostname];
    if (win.location.hostname === 'replaid.pro' || win.location.hostname.endsWith('.replaid.pro')) domains.push('replaid.pro');
    for (const name of ['_ga', '_ga_T2C7LJY6CL']) {
      for (const domain of new Set(domains)) {
        const suffix = domain ? `; Domain=${domain}` : '';
        doc.cookie = `${name}=; Max-Age=0; Path=/${suffix}; SameSite=Lax`;
      }
    }
  }

  function stopAnalytics() {
    win[`ga-disable-${MEASUREMENT_ID}`] = true;
    clearAnalyticsCookies();
  }

  function startAnalytics() {
    if (!enabled) return;
    win[`ga-disable-${MEASUREMENT_ID}`] = false;
    if (loaded) return;
    loaded = true;
    win.dataLayer = win.dataLayer || [];
    win.gtag = function () { win.dataLayer.push(arguments); };
    win.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    win.gtag('js', new Date(now()));
    win.gtag('config', MEASUREMENT_ID, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_expires: CONSENT_DURATION / 1000,
      cookie_path: '/',
      page_location: `${win.location.origin}${win.location.pathname}`,
      page_referrer: '',
    });
    const script = doc.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    doc.head.append(script);
  }

  function render() {
    const text = consent?.analytics === 'accepted' ? 'Analytics is allowed.' : consent?.analytics === 'rejected' ? 'Analytics is off.' : 'Analytics is off. No choice has been saved.';
    statuses.forEach(status => { status.textContent = text + (persistenceFailed ? ' Your browser could not save this choice. It applies to this page only.' : ''); });
    if (banner) banner.hidden = Boolean(consent);
  }

  function apply() {
    win.clearTimeout(timer);
    if (consent?.analytics === 'accepted') startAnalytics(); else stopAnalytics();
    render();
    if (consent) {
      timer = win.setTimeout(() => {
        if (consent && consent.expiresAt <= now()) {
          consent = null;
          try { win.localStorage.removeItem(CONSENT_KEY); } catch { /* Browsers can block storage. */ }
        }
        apply();
      }, Math.min(consent.expiresAt - now(), 2147483647));
    }
  }

  function choose(value) {
    if (!['accepted', 'rejected'].includes(value)) return;
    consent = { version: 1, analytics: value, expiresAt: now() + CONSENT_DURATION };
    persistenceFailed = false;
    try { win.localStorage.setItem(CONSENT_KEY, JSON.stringify(consent)); } catch { persistenceFailed = true; }
    apply();
  }

  choices.forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => choose(button.dataset.analyticsChoice));
  });
  win.addEventListener('storage', event => {
    if (event.key !== CONSENT_KEY && event.key !== null) return;
    consent = stored();
    persistenceFailed = false;
    apply();
  });
  consent = stored();
  apply();
}
