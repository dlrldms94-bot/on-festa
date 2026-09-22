(function () {
  const API_BASE = window.ONFESTA_API_BASE || '';

  function t(key) {
    if (window.ONFESTA_I18N) {
      return window.ONFESTA_I18N.t(key, window.ONFESTA_I18N.getLang());
    }
    return key;
  }

  function formatDate(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const lang = window.ONFESTA_I18N?.getLang() || 'ko';
    if (lang === 'en') {
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}.${m}.${day}`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderBody(text) {
    return escapeHtml(text).replace(/\n/g, '<br>');
  }

  async function fetchJson(url, options) {
    const res = await fetch(`${API_BASE}${url}`, {
      credentials: 'same-origin',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || res.statusText);
    }
    return data;
  }

  function initList() {
    const root = document.getElementById('notice-board');
    if (!root) return;

    const tbody = root.querySelector('[data-notice-list]');
    const emptyEl = root.querySelector('[data-notice-empty]');
    const errorEl = root.querySelector('[data-notice-error]');
    const pagination = root.querySelector('[data-notice-pagination]');

    let page = 1;

    async function load() {
      errorEl.hidden = true;
      tbody.innerHTML = '';
      try {
        const data = await fetchJson(`/api/notices?page=${page}&limit=10`);
        if (!data.items.length) {
          emptyEl.hidden = false;
          pagination.innerHTML = '';
          return;
        }
        emptyEl.hidden = true;
        const total = data.total;
        tbody.innerHTML = data.items
          .map((item, index) => {
            const num = total - (data.page - 1) * data.limit - index;
            const numCell = item.is_pinned
              ? `<span class="notice-board__pin">${escapeHtml(t('noticePage.pinLabel'))}</span>`
              : String(num);
            return `<tr>
              <td class="notice-board__num">${numCell}</td>
              <td class="notice-board__title">
                <a href="notice-detail.html?id=${item.id}">${escapeHtml(item.title)}</a>
              </td>
              <td class="notice-board__date">${formatDate(item.created_at)}</td>
            </tr>`;
          })
          .join('');

        renderPagination(data);
      } catch (err) {
        console.error(err);
        emptyEl.hidden = true;
        errorEl.hidden = false;
        errorEl.textContent = t('noticePage.loadError');
        pagination.innerHTML = '';
      }
    }

    function renderPagination(data) {
      if (data.totalPages <= 1) {
        pagination.innerHTML = '';
        return;
      }
      const prevDisabled = data.page <= 1 ? ' disabled' : '';
      const nextDisabled = data.page >= data.totalPages ? ' disabled' : '';
      pagination.innerHTML = `
        <button type="button" class="notice-board__page-btn" data-page="prev"${prevDisabled}>${escapeHtml(t('noticePage.prev'))}</button>
        <span class="notice-board__page-info">${data.page} / ${data.totalPages}</span>
        <button type="button" class="notice-board__page-btn" data-page="next"${nextDisabled}>${escapeHtml(t('noticePage.next'))}</button>`;
      pagination.querySelector('[data-page="prev"]')?.addEventListener('click', () => {
        if (page > 1) {
          page -= 1;
          load();
        }
      });
      pagination.querySelector('[data-page="next"]')?.addEventListener('click', () => {
        if (page < data.totalPages) {
          page += 1;
          load();
        }
      });
    }

    load();
    window.addEventListener('onfesta:lang', load);
  }

  function initDetail() {
    const root = document.getElementById('notice-detail');
    if (!root) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const titleEl = root.querySelector('[data-notice-title]');
    const dateEl = root.querySelector('[data-notice-date]');
    const bodyEl = root.querySelector('[data-notice-body]');
    const errorEl = root.querySelector('[data-notice-error]');

    if (!id) {
      errorEl.hidden = false;
      errorEl.textContent = t('noticePage.notFound');
      return;
    }

    fetchJson(`/api/notices/${id}`)
      .then((item) => {
        titleEl.textContent = item.title;
        dateEl.textContent = formatDate(item.created_at);
        bodyEl.innerHTML = renderBody(item.body);
        document.title = `${item.title} | ${document.title.split('|').pop()?.trim() || ''}`;
      })
      .catch(() => {
        errorEl.hidden = false;
        errorEl.textContent = t('noticePage.notFound');
        titleEl.textContent = '';
        bodyEl.innerHTML = '';
      });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initList();
    initDetail();
  });
})();
