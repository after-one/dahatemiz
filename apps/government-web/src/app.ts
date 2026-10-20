type Organization = {
  id: string;
  name: string;
  slug: string;
  city: string;
  role: 'ORG_ADMIN' | 'OFFICER';
};
type CaseSummary = {
  id: string;
  reportId: string;
  category: string;
  status: string;
  location: { city: string; district?: string };
  createdAt: string;
  forwardedAt: string;
  assignedTo?: string;
};
type CaseDetail = CaseSummary & {
  description?: string;
  preciseLocation: { latitude: number; longitude: number };
  statusHistory: { status: string; publicMessage?: string; createdAt: string }[];
  internalNotes: { id: string; body: string; author: string; createdAt: string }[];
  evidence: { uploadId: string; mediaType: string; attachedAt: string }[];
};
type Config = { api: string; key: string; project: string; emulator: string; token: string };
const root = document.querySelector<HTMLElement>('#app')!;
const sessionKey = 'dahamiz.gov.session';
const config = readConfig();
let organizationId = '';
let organizationRole: Organization['role'] = 'OFFICER';
let caseItems: CaseSummary[] = [];

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
        showMessage(error instanceof Error ? error.message : 'İşlem tamamlanamadı.', true),
      ),
  );
  return element;
}
function showMessage(text: string, error = false) {
  const current = document.querySelector<HTMLElement>('#message');
  if (current) {
    current.textContent = text;
    current.className = error ? 'message error' : 'message';
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
function label(text: string, input: HTMLElement) {
  const item = node('label');
  item.append(node('span', '', text), input);
  return item;
}
function textInput(name: string, value = '', type = 'text', placeholder = '') {
  const input = node('input');
  input.name = name;
  input.value = value;
  input.type = type;
  input.placeholder = placeholder;
  input.autocomplete = name === 'password' ? 'current-password' : 'off';
  return input;
}
function renderLogin() {
  root.replaceChildren();
  const top = node('div', 'topbar');
  top.append(node('div', 'brand', 'DahaMiz · Kurum alanı'));
  root.append(
    top,
    node('h1', '', 'Kurum çalışma alanı'),
    node(
      'p',
      'lede',
      'Sadece hesabınıza atanmış kurum vakalarını inceleyin. Vaka ve kanıt erişimleri denetim kaydına alınır.',
    ),
  );
  const card = node('form', 'card grid');
  card.append(node('h2', '', 'Güvenli giriş'));
  const apiInput = textInput('api', config.api || 'http://localhost:3002/api/v1');
  const projectInput = textInput('project', config.project || 'demo-dahamiz');
  const keyInput = textInput('key', config.key || 'local-test-key');
  const emulatorInput = textInput('emulator', config.emulator || 'http://127.0.0.1:9099');
  const emailInput = textInput('email', '', 'email', 'kurum hesabı e-posta');
  const passwordInput = textInput('password', '', 'password', 'şifre');
  const grid = node('div', 'form-grid');
  grid.append(
    label('API adresi', apiInput),
    label('Firebase proje kimliği', projectInput),
    label('Firebase Web API anahtarı', keyInput),
    label('Auth Emulator adresi (yerelse)', emulatorInput),
    label('E-posta', emailInput),
    label('Şifre', passwordInput),
  );
  const submit = node('button', '', 'Giriş yap');
  card.append(grid, submit);
  card.addEventListener('submit', async (event) => {
    event.preventDefault();
    submit.disabled = true;
    showMessage('Hesap doğrulanıyor…');
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
          email: emailInput.value.trim(),
          password: passwordInput.value,
          returnSecureToken: true,
        }),
      });
      const result = (await response.json()) as { idToken?: string; error?: { message?: string } };
      if (!response.ok || !result.idToken)
        throw new Error(result.error?.message ?? 'Giriş başarısız.');
      config.token = result.idToken;
      persist();
      await renderWorkspace();
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Giriş yapılamadı.', true);
    } finally {
      submit.disabled = false;
    }
  });
  const message = node('p', 'message');
  message.id = 'message';
  root.append(card, message);
}
async function renderWorkspace() {
  root.replaceChildren();
  const top = node('div', 'topbar');
  top.append(
    node('div', 'brand', 'DahaMiz · Kurum alanı'),
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
    node('h1', '', 'Kurum vakaları'),
    node(
      'p',
      'lede',
      'Vaka ayrıntıları ve kesin konumlar kurum üyeliğiyle korunur. Her açılış denetlenir.',
    ),
  );
  const toolbar = node('section', 'card toolbar');
  const selector = node('select');
  selector.setAttribute('aria-label', 'Kurum seçin');
  const reload = button('Yenile', async () => loadCases(selector.value), true);
  const exportCases = button(
    'CSV indir',
    async () => {
      const response = await fetch(
        `${config.api.replace(/\/$/, '')}/government/organizations/${encodeURIComponent(selector.value)}/cases-export`,
        { headers: { Authorization: `Bearer ${config.token}` } },
      );
      if (!response.ok) {
        const result: unknown = await response.json();
        throw new Error((result as { message?: string }).message ?? 'Dışa aktarma başarısız.');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = node('a');
      link.href = url;
      link.download = 'dahamiz-kurum-vakalari.csv';
      link.click();
      URL.revokeObjectURL(url);
      showMessage('Kurum vaka özeti CSV olarak indirildi. Dışa aktarma denetlendi.');
    },
    true,
  );
  toolbar.append(label('Kurum', selector), reload, exportCases);
  root.append(toolbar);
  const message = node('p', 'message');
  message.id = 'message';
  root.append(message);
  const list = node('section', 'grid case-list');
  list.id = 'case-list';
  root.append(list);
  const detail = node('section', 'card detail');
  detail.id = 'case-detail';
  root.append(detail);
  try {
    const result = await api<{ data: Organization[] }>('/government/organizations');
    selector.replaceChildren();
    for (const org of result.data) {
      const option = node('option', '', `${org.name} · ${org.city}`);
      option.value = org.id;
      selector.append(option);
    }
    if (!result.data.length) {
      showMessage('Bu hesap için kurum erişimi tanımlı değil.', true);
      return;
    }
    organizationId = result.data[0]?.id ?? '';
    organizationRole = result.data[0]?.role ?? 'OFFICER';
    selector.addEventListener('change', () => {
      organizationId = selector.value;
      organizationRole = result.data.find((org) => org.id === organizationId)?.role ?? 'OFFICER';
      void loadCases(organizationId);
    });
    await loadCases(organizationId);
  } catch (error) {
    showMessage(error instanceof Error ? error.message : 'Kurumlar yüklenemedi.', true);
  }
}
async function loadCases(orgId: string) {
  organizationId = orgId;
  const list = document.querySelector<HTMLElement>('#case-list');
  if (!list) return;
  list.replaceChildren(node('p', 'muted', 'Vakalar yükleniyor…'));
  try {
    const result = await api<{ data: CaseSummary[] }>(
      `/government/organizations/${encodeURIComponent(orgId)}/cases`,
    );
    caseItems = result.data;
    list.replaceChildren();
    if (!caseItems.length) {
      list.append(node('article', 'card', 'Bu kurumda açık vaka bulunmuyor.'));
      return;
    }
    for (const item of caseItems) {
      const card = node('article', 'card case-card');
      const info = node('div');
      info.append(
        node('strong', '', item.category.replaceAll('_', ' ')),
        node(
          'p',
          'muted',
          `${item.location.district ? `${item.location.district}, ` : ''}${item.location.city} · ${item.status}`,
        ),
        node('small', '', `İletim: ${new Date(item.forwardedAt).toLocaleDateString('tr-TR')}`),
      );
      card.append(
        info,
        button('Vakayı aç', () => loadCase(item.id)),
      );
      list.append(card);
    }
    showMessage(`${caseItems.length} vaka listelendi.`);
  } catch (error) {
    list.replaceChildren();
    showMessage(error instanceof Error ? error.message : 'Vakalar yüklenemedi.', true);
  }
}
async function loadCase(caseId: string) {
  const panel = document.querySelector<HTMLElement>('#case-detail');
  if (!panel) return;
  panel.replaceChildren(node('p', 'muted', 'Vaka ayrıntıları yükleniyor…'));
  try {
    const item = await api<CaseDetail>(
      `/government/organizations/${encodeURIComponent(organizationId)}/cases/${encodeURIComponent(caseId)}`,
    );
    panel.replaceChildren(node('h2', '', `Vaka · ${item.category.replaceAll('_', ' ')}`));
    panel.append(
      node('p', 'tag', item.status),
      node(
        'p',
        'muted',
        `${item.location.district ? `${item.location.district}, ` : ''}${item.location.city} · ${item.preciseLocation.latitude.toFixed(5)}, ${item.preciseLocation.longitude.toFixed(5)}`,
      ),
    );
    if (item.description) panel.append(node('p', '', item.description));
    const timeline = node('div', 'timeline');
    for (const event of item.statusHistory)
      timeline.append(
        node(
          'div',
          '',
          `${event.status} · ${new Date(event.createdAt).toLocaleString('tr-TR')}${event.publicMessage ? ` — ${event.publicMessage}` : ''}`,
        ),
      );
    panel.append(node('h3', '', 'Raporlayana gösterilen durum geçmişi'), timeline);
    const notes = node('div', 'grid');
    for (const entry of item.internalNotes)
      notes.append(node('div', 'note', `${entry.author} · ${entry.body}`));
    panel.append(node('h3', '', 'Kurum içi notlar'), notes);
    const noteForm = node('form', 'form-grid');
    const note = node('textarea');
    note.name = 'body';
    note.required = true;
    note.placeholder = 'Kurum içi not';
    const addNote = node('button', '', 'Not ekle');
    noteForm.append(label('Not', note), addNote);
    noteForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      await api(`/government/organizations/${organizationId}/cases/${caseId}/notes`, 'POST', {
        body: note.value,
      });
      await loadCase(caseId);
    });
    panel.append(noteForm);
    if (organizationRole === 'ORG_ADMIN') {
      const assignmentForm = node('form', 'row');
      const officerUid = textInput(
        'firebaseUid',
        '',
        'text',
        'Atanacak görevlinin Firebase UID değeri',
      );
      const assign = node('button', '', 'Görevliye ata');
      assignmentForm.append(label('Kurum görevlisi', officerUid), assign);
      assignmentForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        await api(
          `/government/organizations/${organizationId}/cases/${caseId}/assignment`,
          'POST',
          {
            firebaseUid: officerUid.value.trim(),
          },
        );
        await loadCase(caseId);
        await loadCases(organizationId);
        showMessage('Vaka kurum görevlisine atandı.');
      });
      panel.append(node('h3', '', 'Vaka ataması'), assignmentForm);
    }
    const status = node('select');
    for (const value of ['UNDER_INVESTIGATION', 'RESOLVED', 'CLOSED']) {
      const option = node('option', '', value);
      option.value = value;
      status.append(option);
    }
    const update = node('button', '', 'Durumu güncelle');
    update.addEventListener('click', async () => {
      await api(`/government/organizations/${organizationId}/cases/${caseId}/status`, 'PATCH', {
        status: status.value,
      });
      await loadCase(caseId);
      await loadCases(organizationId);
    });
    const statusRow = node('div', 'row');
    statusRow.append(status, update);
    panel.append(node('h3', '', 'Güvenli durum bildirimi'), statusRow);
    panel.append(node('h3', '', 'Özel kanıt dosyaları'));
    if (item.evidence.length) {
      const evidenceList = node('div', 'row');
      for (const file of item.evidence) {
        const evidenceButton = button(
          `${file.mediaType} kanıtını incele`,
          async () => {
            const purpose = window.prompt('Kanıtı inceleme gerekçesi');
            if (!purpose?.trim()) return;
            const result = await api<{ url: string }>(
              `/government/organizations/${organizationId}/cases/${caseId}/evidence-access`,
              'POST',
              { uploadId: file.uploadId, purpose },
            );
            window.open(result.url, '_blank', 'noopener,noreferrer');
          },
          true,
        );
        evidenceList.append(evidenceButton);
      }
      panel.append(
        node(
          'p',
          'muted',
          'Bağlantılar 5 dakika geçerlidir; her dosya erişimi gerekçeyle denetlenir.',
        ),
        evidenceList,
      );
    } else panel.append(node('p', 'muted', 'Bu vakaya özel kanıt dosyası eklenmemiş.'));
  } catch (error) {
    panel.replaceChildren(
      node('p', 'error', error instanceof Error ? error.message : 'Vaka açılamadı.'),
    );
  }
}

if (config.token) void renderWorkspace();
else renderLogin();
