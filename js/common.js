(function () {
  const I18N = window.ONFESTA_I18N;

  function logos(base) {
    const b = base || '';
    return {
      festa: `${b}img/m-tit.png`,
      headerPartner1: `${b}img/m-logo-1.png`,
      headerPartner2: `${b}img/m-logo-2.png`,
      footerPartner: `${b}img/f-logo.png`,
    };
  }

  function basePath() {
    return document.body.dataset.base || '';
  }

  function navConfig() {
    const b = basePath();
    return [
      {
        key: 'intro',
        href: `${b}intro/overview.html`,
        children: [
          { key: 'overview', href: `${b}intro/overview.html` },
          { key: 'timetable', href: `${b}intro/timetable.html` },
          { key: 'venue', href: `${b}intro/venue.html` },
          { key: 'sponsor', href: `${b}intro/sponsor.html` },
        ],
      },
      {
        key: 'program',
        href: `${b}program/sponsor-zone.html`,
        children: [
          { key: 'sponsorZone', href: `${b}program/sponsor-zone.html` },
          { key: 'experience', href: `${b}program/experience.html` },
          { key: 'kPlay', href: `${b}program/k-play.html` },
          { key: 'soulSpot', href: `${b}program/soul-spot.html` },
          { key: 'stampTour', href: `${b}program/stamp-tour.html` },
          { key: 'exhibition', href: `${b}program/exhibition.html` },
          { key: 'participate', href: `${b}program/participate.html` },
        ],
      },
      {
        key: 'performance',
        href: `${b}performance/index.html`,
        children: [],
      },
      {
        key: 'community',
        href: `${b}community/notice.html`,
        children: [
          { key: 'notice', href: `${b}community/notice.html` },
          { key: 'faq', href: `${b}community/faq.html` },
        ],
      },
      {
        key: 'directions',
        href: `${b}directions/index.html`,
        children: [],
      },
    ];
  }

  function renderHeader(activeNav, lang) {
    const t = (k) => I18N.t(k, lang);
    const b = basePath();
    const items = navConfig()
      .map((item) => {
        const isActive = item.key === activeNav ? ' is-active' : '';
        const label = t(`nav.${item.key}`);
        const children = item.children
          .map((c) => {
            const subLabel = t(`sub.${c.key}`);
            return `<li><a href="${c.href}">${subLabel}</a></li>`;
          })
          .join('');
        const subHtml = children
          ? `<ul class="gnb-sub">${children}</ul>`
          : '';
        return `
          <li class="gnb-item${isActive}">
            <a class="gnb-link" href="${item.href}">${label}</a>
            ${subHtml}
          </li>`;
      })
      .join('');

    const krActive = lang === 'ko' ? ' is-active' : '';
    const enActive = lang === 'en' ? ' is-active' : '';
    const logo = logos(b);

    return `
      <header class="site-header">
        <div class="header-inner">
          <div class="header-left">
            <a class="header-brand" href="${b}index.html">
              <img src="${logo.festa}" alt="${t('siteName')}">
            </a>
          </div>
          <div class="header-aside">
            <div class="lang-switch" role="group" aria-label="${t('langLabel')}">
              <button type="button" class="lang-switch__btn${krActive}" data-lang="ko" aria-pressed="${lang === 'ko'}">KR</button>
              <button type="button" class="lang-switch__btn${enActive}" data-lang="en" aria-pressed="${lang === 'en'}">EN</button>
            </div>
            <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-gnb" aria-label="${t('menuOpen')}">
              <span class="menu-toggle__bar" aria-hidden="true"></span>
              <span class="menu-toggle__bar" aria-hidden="true"></span>
              <span class="menu-toggle__bar" aria-hidden="true"></span>
            </button>
            <div class="header-partner header-partner--seoul">
              <img class="header-partner__seoul" src="${logo.headerPartner1}" alt="동행·매력 특별시 서울">
              <img class="header-partner__mysoul" src="${logo.headerPartner2}" alt="SEOUL MY SOUL">
            </div>
          </div>
        </div>
        <div class="header-nav-wrap" id="site-gnb">
          <nav class="header-nav" aria-label="${t('siteName')}">
            <ul class="gnb">${items}</ul>
          </nav>
        </div>
      </header>`;
  }

  function renderFooter(lang) {
    const t = (k) => I18N.t(k, lang);
    const b = basePath();
    const logo = logos(b);

    return `
      <footer class="site-footer">
        <div class="footer-top">
          <div class="footer-top-inner">
            <div class="footer-top-left">
              <a class="footer-logo" href="${b}index.html">
                <img src="${logo.festa}" alt="${t('siteName')}">
              </a>
              <div class="footer-info">
                <p>${t('footer.addressLabel')} : ${t('footer.address')}</p>
                <p>${t('footer.phoneLabel')} : ${t('footer.phone')}</p>
              </div>
            </div>
            <div class="footer-partner">
              <img src="${logo.footerPartner}" alt="SEOUL MY SOUL">
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <div class="footer-bottom-inner">
            <div class="footer-links">
              <a href="${b}legal/privacy.html">${t('footer.privacy')}</a>
              <span class="footer-dot">|</span>
              <a href="${b}legal/email-deny.html">${t('footer.emailDeny')}</a>
            </div>
            <p class="footer-copy">${t('footer.copy')}</p>
          </div>
        </div>
      </footer>`;
  }

  function renderBreadcrumb(items, lang) {
    if (!items || !items.length) return '';
    const t = (k) => I18N.t(k, lang);
    const html = items
      .map((item, i) => {
        const isLast = i === items.length - 1;
        let label = item.labelKey ? t(item.labelKey) : item.label;
        if (isLast) {
          return `<span class="current">${label}</span>`;
        }
        return `<a href="${item.href}">${label}</a><span class="sep">&gt;</span>`;
      })
      .join('');

    return `
      <nav class="sub-hero__breadcrumb" aria-label="breadcrumb">
        ${html}
      </nav>`;
  }

  function applyI18nTexts(lang) {
    const t = (k) => I18N.t(k, lang);
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      if (el.closest('[data-i18n-skip]')) return;
      const key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      if (el.closest('[data-i18n-skip]')) return;
      const key = el.getAttribute('data-i18n-html');
      el.innerHTML = t(key);
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
      if (el.closest('[data-i18n-skip]')) return;
      const key = el.getAttribute('data-i18n-aria-label');
      el.setAttribute('aria-label', t(key));
    });
    document.querySelectorAll('[data-i18n-alt]').forEach((el) => {
      if (el.closest('[data-i18n-skip]')) return;
      const key = el.getAttribute('data-i18n-alt');
      const text = t(key);
      if (el.tagName === 'IFRAME') {
        el.setAttribute('title', text);
      } else {
        el.setAttribute('alt', text);
      }
    });
    const skip = document.querySelector('.skip-link');
    if (skip) skip.textContent = t('skipMain');
  }

  function bindMobileNav() {
    const toggle = document.querySelector('.menu-toggle');
    const wrap = document.querySelector('.header-nav-wrap');
    if (!toggle || !wrap) return;

    const MOBILE_NAV_MAX = 960;

    function setMobileNavOpen(open) {
      wrap.classList.toggle('is-open', open);
      document.body.classList.toggle('mobile-nav-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? I18N.t('menuClose') : I18N.t('menuOpen'));
    }

    toggle.addEventListener('click', () => {
      setMobileNavOpen(!wrap.classList.contains('is-open'));
    });

    document.querySelectorAll('.gnb-item').forEach((item) => {
      const sub = item.querySelector('.gnb-sub');
      if (!sub) return;
      const link = item.querySelector('.gnb-link');
      link.addEventListener('click', (e) => {
        if (window.innerWidth <= MOBILE_NAV_MAX) {
          e.preventDefault();
          item.classList.toggle('is-open');
        }
      });
    });

    wrap.querySelectorAll('.gnb-sub a').forEach((link) => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= MOBILE_NAV_MAX) setMobileNavOpen(false);
      });
    });

    wrap.querySelectorAll('.gnb-item').forEach((item) => {
      if (item.querySelector('.gnb-sub')) return;
      const link = item.querySelector('.gnb-link');
      link?.addEventListener('click', () => {
        if (window.innerWidth <= MOBILE_NAV_MAX) setMobileNavOpen(false);
      });
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > MOBILE_NAV_MAX && wrap.classList.contains('is-open')) {
        setMobileNavOpen(false);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && wrap.classList.contains('is-open')) {
        setMobileNavOpen(false);
      }
    });
  }

  let revealObserver = null;

  const REVEAL_SELECTORS = [
    '.page-inner > .overview-panel',
    '.page-inner > .content-card',
    '.page-inner > section',
    '.page-inner > article',
    '.sponsor-layout > .content-card',
    '.performance-day',
  ].join(', ');

  function initSubReveal() {
    if (document.body.dataset.page !== 'sub') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    document.querySelectorAll('.reveal-up').forEach((el) => {
      el.classList.remove('reveal-up', 'is-revealed');
      el.style.removeProperty('--reveal-delay');
    });

    if (revealObserver) {
      revealObserver.disconnect();
      revealObserver = null;
    }

    const nodes = document.querySelectorAll(REVEAL_SELECTORS);
    nodes.forEach((el, i) => {
      el.classList.add('reveal-up');
      el.style.setProperty('--reveal-delay', `${Math.min(i * 0.1, 0.55)}s`);
    });

    if (!nodes.length) return;

    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          revealObserver.unobserve(entry.target);
        });
      },
      { root: null, rootMargin: '0px 0px -5% 0px', threshold: 0.06 }
    );

    nodes.forEach((el) => revealObserver.observe(el));
  }

  function bindLangSwitch() {
    document.querySelectorAll('[data-lang]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        I18N.setLang(lang);
        mountLayout();
      });
    });
  }

  function mountLayout() {
    const lang = I18N.getLang();
    document.documentElement.lang = lang;

    const activeNav = document.body.dataset.nav || '';
    const headerMount = document.getElementById('site-header');
    const footerMount = document.getElementById('site-footer');
    const crumbMount = document.getElementById('sub-breadcrumb');

    if (headerMount) {
      headerMount.innerHTML = renderHeader(activeNav, lang);
    }
    if (footerMount) {
      footerMount.innerHTML = renderFooter(lang);
    }

    if (crumbMount) {
      const crumbs = document.body.dataset.breadcrumb
        ? JSON.parse(document.body.dataset.breadcrumb)
        : [];
      crumbMount.innerHTML = renderBreadcrumb(crumbs, lang);
    }

    const titleMount = document.getElementById('sub-title');
    if (titleMount && document.body.dataset.titleKey) {
      titleMount.textContent = I18N.t(document.body.dataset.titleKey, lang);
    }

    applyI18nTexts(lang);
    bindMobileNav();
    bindLangSwitch();

    if (document.body.dataset.page === 'home') {
      document.body.classList.add('is-home');
    }
    if (document.body.dataset.page === 'sub') {
      document.body.classList.add('is-sub');
    }

    initSubReveal();
  }

  document.addEventListener('DOMContentLoaded', mountLayout);
  window.addEventListener('onfesta:lang', mountLayout);

  window.ONFESTA = { mountLayout, basePath };
})();
