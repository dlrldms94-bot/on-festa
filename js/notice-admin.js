(function () {
  const API_BASE = window.ONFESTA_API_BASE || '';

  async function fetchJson(url, options = {}) {
    let res;
    try {
      res = await fetch(`${API_BASE}${url}`, {
        credentials: 'same-origin',
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });
    } catch {
      throw new Error('서버에 연결할 수 없습니다. server 폴더에서 npm run dev 로 실행해 주세요.');
    }
    const text = await res.text();
    let data = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('API 응답 오류입니다. Node 서버로 admin 페이지를 열어 주세요.');
      }
    }
    if (!res.ok) throw new Error(data.error || res.statusText);
    return data;
  }

  function $(sel) {
    return document.querySelector(sel);
  }

  function setView(mode) {
    const shell = $('.admin-shell');
    const loginView = $('#admin-login');
    const appView = $('#admin-app');
    const isApp = mode === 'app';
    if (shell) shell.classList.toggle('admin-shell--authenticated', isApp);
    if (loginView) loginView.hidden = isApp;
    if (appView) appView.hidden = !isApp;
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('ko-KR');
  }

  async function checkSession() {
    try {
      const data = await fetchJson('/api/admin/session');
      return data.authenticated;
    } catch {
      return false;
    }
  }

  function init() {
    const loginForm = $('#admin-login-form');
    const loginError = $('#admin-login-error');
    const listEl = $('#admin-notice-list');
    const form = $('#admin-notice-form');
    const formTitle = $('#admin-form-title');
    const idInput = $('#admin-notice-id');
    const titleInput = $('#admin-notice-title');
    const bodyInput = $('#admin-notice-body');
    const pinInput = $('#admin-notice-pin');
    const formError = $('#admin-form-error');
    const logoutBtn = $('#admin-logout');
    const newBtn = $('#admin-new');

    async function showApp() {
      setView('app');
      await loadList();
    }

    function showLogin() {
      setView('login');
    }

    loginForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginError.hidden = true;
      const password = $('#admin-password').value;
      try {
        await fetchJson('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }) });
        $('#admin-password').value = '';
        showApp();
      } catch (err) {
        loginError.hidden = false;
        loginError.textContent =
          err.message && err.message.includes('서버')
            ? err.message
            : '비밀번호가 올바르지 않습니다.';
      }
    });

    logoutBtn?.addEventListener('click', async () => {
      try {
        await fetchJson('/api/admin/logout', { method: 'POST' });
      } catch {
        /* ignore */
      }
      showLogin();
    });

    newBtn?.addEventListener('click', () => {
      idInput.value = '';
      titleInput.value = '';
      bodyInput.value = '';
      pinInput.checked = false;
      formTitle.textContent = '새 공지 작성';
      formError.hidden = true;
    });

    async function loadList() {
      listEl.innerHTML = '<li class="admin-notice-list__loading">불러오는 중…</li>';
      try {
        const data = await fetchJson('/api/notices?page=1&limit=100');
        if (!data.items.length) {
          listEl.innerHTML = '<li class="admin-notice-list__empty">등록된 공지가 없습니다.</li>';
          return;
        }
        listEl.innerHTML = data.items
          .map(
            (item) => `<li class="admin-notice-list__item">
              <button type="button" class="admin-notice-list__edit" data-id="${item.id}">
                <strong>${escapeHtml(item.title)}</strong>
                <span>${item.is_pinned ? '[고정] ' : ''}${formatDate(item.created_at)}</span>
              </button>
              <button type="button" class="admin-notice-list__delete" data-id="${item.id}" aria-label="삭제">×</button>
            </li>`
          )
          .join('');

        listEl.querySelectorAll('.admin-notice-list__edit').forEach((btn) => {
          btn.addEventListener('click', () => openEdit(btn.dataset.id));
        });
        listEl.querySelectorAll('.admin-notice-list__delete').forEach((btn) => {
          btn.addEventListener('click', () => removeNotice(btn.dataset.id));
        });
      } catch {
        listEl.innerHTML = '<li class="admin-notice-list__empty">목록을 불러오지 못했습니다.</li>';
      }
    }

    function escapeHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    async function openEdit(id) {
      try {
        const item = await fetchJson(`/api/notices/${id}`);
        idInput.value = item.id;
        titleInput.value = item.title;
        bodyInput.value = item.body;
        pinInput.checked = item.is_pinned;
        formTitle.textContent = '공지 수정';
        formError.hidden = true;
      } catch {
        formError.hidden = false;
        formError.textContent = '공지를 불러오지 못했습니다.';
      }
    }

    async function removeNotice(id) {
      if (!window.confirm('이 공지를 삭제할까요?')) return;
      try {
        await fetch(`${API_BASE}/api/notices/${id}`, { method: 'DELETE', credentials: 'same-origin' }).then(
          (res) => {
            if (!res.ok && res.status !== 204) throw new Error('delete failed');
          }
        );
        if (idInput.value === String(id)) newBtn.click();
        await loadList();
      } catch {
        window.alert('삭제에 실패했습니다.');
      }
    }

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      formError.hidden = true;
      const payload = {
        title: titleInput.value.trim(),
        body: bodyInput.value.trim(),
        is_pinned: pinInput.checked,
      };
      const id = idInput.value;
      try {
        if (id) {
          await fetchJson(`/api/notices/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
        } else {
          await fetchJson('/api/notices', { method: 'POST', body: JSON.stringify(payload) });
        }
        newBtn.click();
        await loadList();
      } catch (err) {
        formError.hidden = false;
        formError.textContent = err.message || '저장에 실패했습니다.';
      }
    });

    showLogin();

    checkSession().then((ok) => {
      if (ok) showApp();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
