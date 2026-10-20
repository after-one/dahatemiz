type ModerationReport = {
  id: string;
  category: string;
  status: string;
  description?: string;
  location: { city: string; district?: string };
  createdAt: string;
  hasMedia: boolean;
};
type ContentReport = {
  id: string;
  postId: string;
  reason: string;
  details?: string;
  status: string;
  title: string;
  category: string;
  createdAt: string;
};
type Organization = { id: string; name: string; city: string };
type Config = { api: string; key: string; project: string; emulator: string; token: string };
const root = document.querySelector<HTMLElement>('#app')!;
const sessionKey = 'dahamiz.admin.session';
const config = readConfig();
let organizations: Organization[] = [];
function readConfig(): Config {
  try {
    return JSON.parse(sessionStorage.getItem(sessionKey) ?? '{}') as Config;
  } catch {
    return { api: '', key: '', project: '', emulator: '', token: '' };
  }
}
function persist() {
  sessionStorage.setItem(sessionKey, JSON.stringify(config));
}
function node<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = '',
  text = '',
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}
function button(text: string, action: () => void | Promise<void>, secondary = false) {
  const element = node('button', secondary ? 'secondary' : '', text);
  element.addEventListener(
    'click',
    () =>
      void Promise.resolve(action()).catch((error: unknown) =>
        message(error instanceof Error ? error.message : 'İşlem tamamlanamadı.', true),
      ),
  );
  return element;
}
function label(text: string, input: HTMLElement) {
  const item = node('label');
  item.append(node('span', '', text), input);
  return item;
}
function field(name: string, value = '', type = 'text', placeholder = '') {
  const input = node('input');
  input.name = name;
  input.value = value;
  input.type = type;
  input.placeholder = placeholder;
  input.autocomplete = name === 'password' ? 'current-password' : 'off';
  return input;
}
function message(text: string, error = false) {
  const item = document.querySelector<HTMLElement>('#message');
  if (item) {
    item.textContent = text;
    item.className = error ? 'message error' : 'message';
  }
}
async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(`${config.api.replace(/\/$/, '')}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${config.token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result: unknown = await response.json();
  if (!response.ok)
    throw new Error(
      (result as { message?: string }).message ?? `İstek başarısız (${response.status}).`,
    );
  return result as T;
}
function renderLogin() {
  root.replaceChildren();
  const top = node('div', 'topbar');
  top.append(node('div', 'brand', 'DahaMiz · Moderasyon'));
  root.append(
    top,
    node('h1', '', 'İçerik denetimi'),
    node(
      'p',
      'lede',
      'Kuyruklar yalnızca moderatör ve platform yöneticilerine açıktır. Her karar audit kaydına alınır.',
    ),
  );
  const form = node('form', 'card grid');
  form.append(node('h2', '', 'Güvenli giriş'));
  const apiInput = field('api', config.api || 'http://localhost:3002/api/v1');
  const projectInput = field('project', config.project || 'demo-dahamiz');
  const keyInput = field('key', config.key || 'local-test-key');
  const emulatorInput = field('emulator', config.emulator || 'http://127.0.0.1:9099');
  const email = field('email', '', 'email', 'moderator e-posta');
  const password = field('password', '', 'password', 'şifre');
  const grid = node('div', 'form-grid');
  grid.append(
    label('API adresi', apiInput),
    label('Firebase proje kimliği', projectInput),
    label('Firebase Web API anahtarı', keyInput),
    label('Auth Emulator adresi (yerelse)', emulatorInput),
    label('E-posta', email),
    label('Şifre', password),
  );
  const submit = node('button', '', 'Giriş yap');
  form.append(grid, submit);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    submit.disabled = true;
    message('Hesap doğrulanıyor…');
    config.api = apiInput.value.trim();
    config.project = projectInput.value.trim();
    config.key = keyInput.value.trim();
    config.emulator = emulatorInput.value.trim();
    try {
      const authUrl = config.emulator
        ? `${config.emulator.replace(/\/$/, '')}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword`
        : 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword';
      const response = await fetch(`${authUrl}?key=${encodeURIComponent(config.key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.value.trim(),
          password: password.value,
          returnSecureToken: true,
        }),
      });
      const result = (await response.json()) as { idToken?: string; error?: { message?: string } };
      if (!response.ok || !result.idToken)
        throw new Error(result.error?.message ?? 'Giriş başarısız.');
      config.token = result.idToken;
      persist();
      await renderQueues();
    } catch (error) {
      message(error instanceof Error ? error.message : 'Giriş yapılamadı.', true);
    } finally {
      submit.disabled = false;
    }
  });
  root.append(form);
  const status = node('p', 'message');
  status.id = 'message';
  root.append(status);
}
async function renderQueues() {
  root.replaceChildren();
  const top = node('div', 'topbar');
  top.append(
    node('div', 'brand', 'DahaMiz · Moderasyon'),
    button(
      'Oturumu kapat',
      () => {
        sessionStorage.removeItem(sessionKey);
        config.token = '';
        renderLogin();
      },
      true,
    ),
  );
  root.append(
    top,
    node('h1', '', 'Moderasyon kuyrukları'),
    node(
      'p',
      'lede',
      'Raporları ve topluluk içeriği bildirimlerini insan incelemesiyle yönetin. Kurumlara iletim ve raporlayan kişiye gösterilen mesajlar kontrollüdür.',
    ),
  );
  const status = node('p', 'message');
  status.id = 'message';
  root.append(status);
  const columns = node('div', 'columns');
  const reportPanel = node('section', 'grid');
  const contentPanel = node('section', 'grid');
  reportPanel.append(node('h2', '', 'Yeni çevre raporları'));
  contentPanel.append(node('h2', '', 'Topluluk içeriği bildirimleri'));
  const reportList = node('div', 'grid');
  const contentList = node('div', 'grid');
  reportPanel.append(reportList);
  contentPanel.append(contentList);
  columns.append(reportPanel, contentPanel);
  root.append(columns);
  try {
    organizations = (await api<{ data: Organization[] }>('/government/available-organizations'))
      .data;
  } catch {
    organizations = [];
  }
  try {
    const reports = (await api<{ data: ModerationReport[] }>('/moderation/reports')).data;
    reportList.replaceChildren();
    if (!reports.length) reportList.append(node('article', 'card', 'İnceleme bekleyen rapor yok.'));
    for (const report of reports) {
      const card = node('article', 'card item');
      card.append(
        node('span', 'tag', report.status),
        node('strong', '', report.category.replaceAll('_', ' ')),
        node(
          'p',
          'muted',
          `${report.location.district ? `${report.location.district}, ` : ''}${report.location.city} · ${report.hasMedia ? 'Kanıt dosyası var' : 'Kanıt dosyası yok'}`,
        ),
        node('small', '', report.description ?? 'Açıklama eklenmemiş.'),
      );
      const actions = node('div', 'actions');
      if (report.status === 'SUBMITTED')
        actions.append(
          button(
            'Ön incelemeye al',
            async () => {
              await api(`/moderation/reports/${report.id}/review`, 'POST', {
                status: 'UNDER_REVIEW',
              });
              await renderQueues();
            },
            true,
          ),
        );
      actions.append(
        button(
          'Reddet',
          async () => {
            await api(`/moderation/reports/${report.id}/review`, 'POST', { status: 'REJECTED' });
            await renderQueues();
          },
          true,
        ),
      );
      const org = node('select');
      org.setAttribute('aria-label', 'Kurum seç');
      org.append(node('option', '', 'İlgili kurumu seç'));
      for (const item of organizations) {
        const option = node('option', '', `${item.name} · ${item.city}`);
        option.value = item.id;
        org.append(option);
      }
      const forward = button(
        'Kuruma ilet',
        async () => {
          if (!org.value) {
            message('Önce bir kurum seçin.', true);
            return;
          }
          const selected = organizations.find((item) => item.id === org.value);
          if (
            !selected ||
            selected.city.toLocaleLowerCase('tr-TR') !==
              report.location.city.toLocaleLowerCase('tr-TR')
          ) {
            message('Rapor yalnızca aynı şehirdeki kuruma iletilebilir.', true);
            return;
          }
          await api(`/government/organizations/${org.value}/reports/${report.id}`, 'POST');
          await renderQueues();
        },
        true,
      );
      actions.append(org, forward);
      card.append(actions);
      reportList.append(card);
    }
    const contentReports = (
      await api<{ data: ContentReport[] }>('/moderation/content-reports?status=OPEN')
    ).data;
    contentList.replaceChildren();
    if (!contentReports.length)
      contentList.append(node('article', 'card', 'Açık içerik bildirimi yok.'));
    for (const report of contentReports) {
      const card = node('article', 'card item');
      card.append(
        node('strong', '', report.title),
        node('p', 'muted', `${report.category.replaceAll('_', ' ')} · ${report.reason}`),
      );
      if (report.details) card.append(node('p', '', report.details));
      const actions = node('div', 'actions');
      actions.append(
        button('İçeriği yayından kaldır', async () => {
          await api(`/moderation/content-reports/${report.id}/review`, 'POST', {
            status: 'ACTIONED',
          });
          await renderQueues();
        }),
        button(
          'Bildirimi kapat',
          async () => {
            await api(`/moderation/content-reports/${report.id}/review`, 'POST', {
              status: 'DISMISSED',
            });
            await renderQueues();
          },
          true,
        ),
      );
      card.append(actions);
      contentList.append(card);
    }
    message(`${contentReports.length} açık içerik bildirimi.`);
  } catch (error) {
    message(error instanceof Error ? error.message : 'Kuyruklar yüklenemedi.', true);
  }
}
if (config.token) void renderQueues();
else renderLogin();
