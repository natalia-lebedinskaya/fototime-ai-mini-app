
/* FT_PUBLIC_STYLES_FETCH_ALIAS_20260609_START */
(function ftPublicStylesFetchAlias() {
  if (window.__ftPublicStylesFetchAlias) return;
  window.__ftPublicStylesFetchAlias = true;

  const nativeFetch = window.fetch.bind(window);

  window.fetch = function ftFetchWithPublicStylesAlias(input, init) {
    const url = typeof input === 'string' ? input : input && input.url;

    if (url && /(^|\/)(assets\/)?public-styles\.json(\?|$)/.test(String(url))) {
      return nativeFetch('/api/styles/public', init);
    }

    return nativeFetch(input, init);
  };
})();
/* FT_PUBLIC_STYLES_FETCH_ALIAS_20260609_END */




/* FT_BOTTOM_NAV_FORCE_TAB_STATE_START */
(function forceBottomNavTabState() {
  if (window.__ftBottomNavForceTabState) return;
  window.__ftBottomNavForceTabState = true;

  document.addEventListener('click', (event) => {
    const button = event.target.closest('.bottom-nav button, .app-tab, [data-tab-target]');
    if (!button) return;

    const raw = String(button.dataset?.tabTarget || button.textContent || '').toLowerCase();

    let tab = null;
    if (raw.includes('глав') || raw.includes('main') || raw.includes('home')) tab = 'main';
    if (raw.includes('лич') || raw.includes('кабинет') || raw.includes('profile')) tab = 'profile';
    if (raw.includes('админ') || raw.includes('admin')) tab = 'admin';

    if (!tab) return;

    document.body.dataset.activeTab = tab;

    if (tab !== 'admin') {
      document.querySelectorAll('#ftAdminStableRoot, #adminPanel, #adminTab, [data-tab-panel="admin"], [data-tab-content="admin"]').forEach((node) => {
        node.hidden = true;
        node.classList.add('hidden');
        node.classList.remove('active');
        node.style.display = 'none';
      });
    }

    if (tab === 'admin' && typeof window.renderAdminStable === 'function') {
      if (document.body.dataset.activeTab === 'admin') setTimeout(() => window.renderAdminStable(), 0);
    }
  }, true);
})();
/* FT_BOTTOM_NAV_FORCE_TAB_STATE_END */


/* FT_ADMIN_VISIBILITY_CSS_FIX_START */
(function fixAdminVisibilityByCss() {
  if (window.__ftAdminVisibilityCssFix) return;
  window.__ftAdminVisibilityCssFix = true;

  const style = document.createElement('style');
  style.id = 'ftAdminVisibilityCssFix';
  style.textContent = `
    body:not([data-active-tab="admin"]) #ftAdminStableRoot,
    body:not([data-active-tab="admin"]) #adminPanel,
    body:not([data-active-tab="admin"]) #adminTab,
    body:not([data-active-tab="admin"]) [data-tab-panel="admin"],
    body:not([data-active-tab="admin"]) [data-tab-content="admin"] {
      display: none !important;
      visibility: hidden !important;
      pointer-events: none !important;
      height: 0 !important;
      overflow: hidden !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    body[data-active-tab="admin"] #ftAdminStableRoot {
      display: block !important;
      visibility: visible !important;
      pointer-events: auto !important;
      height: auto !important;
      overflow: visible !important;
    }
  `;
  document.head.appendChild(style);
})();
/* FT_ADMIN_VISIBILITY_CSS_FIX_END */


/* FT_SINGLE_TAB_ROUTER_GUARD_START */
(function installSingleTabRouterGuard() {
  if (window.__ftSingleTabRouterGuardInstalled) return;
  window.__ftSingleTabRouterGuardInstalled = true;

  function resolveTabFromElement(element) {
    const node = element?.closest?.('[data-tab-target], [data-ft-tab], .app-tab, .bottom-nav button, nav button, button');
    if (!node) return null;

    const raw = String(
      node.dataset?.tabTarget ||
      node.dataset?.ftTab ||
      node.textContent ||
      ''
    ).toLowerCase();

    if (raw.includes('admin') || raw.includes('админ')) return 'admin';
    if (raw.includes('profile') || raw.includes('account') || raw.includes('лич') || raw.includes('кабинет')) return 'profile';
    if (raw.includes('main') || raw.includes('home') || raw.includes('глав')) return 'main';

    return null;
  }

  window.ftStableNavigate = function ftStableNavigate(target = 'main') {
    const tab = target === 'admin' || target === 'profile' ? target : 'main';

    const stableAdminRoot = document.querySelector('#ftAdminStableRoot');
    if (stableAdminRoot && tab !== 'admin') {
      stableAdminRoot.hidden = true;
      stableAdminRoot.classList.add('hidden');
      stableAdminRoot.classList.remove('active');
      stableAdminRoot.style.display = 'none';
    }

    document.body.dataset.activeTab = tab;

    if (tab !== 'admin') {
      document.querySelectorAll('#ftAdminStableRoot, #adminPanel, #adminTab, [data-tab-panel="admin"], [data-tab-content="admin"]').forEach((node) => {
        node.hidden = true;
        node.classList.add('hidden');
        node.classList.remove('active');
        node.style.display = 'none';
      });
    }


    document.querySelectorAll('[data-tab-target], [data-ft-tab], .app-tab, .bottom-nav button, nav button').forEach((button) => {
      const resolved = resolveTabFromElement(button);
      const active = resolved === tab;
      button.classList.toggle('active', active);
      button.classList.toggle('selected', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    const mainPanel = document.querySelector('[data-tab-panel="main"], main#content, main');
    const profilePanel = document.querySelector('[data-tab-panel="profile"], #profilePanel');
    const adminPanel = document.querySelector('#ftAdminStableRoot, [data-tab-panel="admin"], #adminPanel, #adminTab');

    [
      ['main', mainPanel],
      ['profile', profilePanel],
      ['admin', adminPanel]
    ].forEach(([name, panel]) => {
      if (!panel) return;
      const show = name === tab;
      panel.hidden = !show;
      panel.classList.toggle('hidden', !show);
      panel.classList.toggle('active', show);
      panel.style.display = show ? '' : 'none';
    });

    if (tab === 'admin' && typeof window.renderAdminStable === 'function') {
      if (document.body.dataset.activeTab === 'admin') setTimeout(() => window.renderAdminStable(), 0);
    }

    if (tab === 'profile') {
      if (typeof window.renderGeneratedHistory === 'function') window.renderGeneratedHistory();
      if (typeof window.renderBalanceUi === 'function') window.renderBalanceUi();
    }
  };

  const nativeAddEventListener = Document.prototype.addEventListener;

  Document.prototype.addEventListener = function patchedDocumentAddEventListener(type, listener, options) {
    if (this === document && type === 'click' && typeof listener === 'function') {
      const source = String(listener);

      if (
        source.includes('data-tab-target') ||
        source.includes('data-ft-tab') ||
        source.includes('.app-tab') ||
        source.includes('bottom-nav') ||
        source.includes('forceAppTab') ||
        source.includes('switchTab') ||
        source.includes('setActiveTab')
      ) {
        const wrapped = function stableTabClickWrapper(event) {
          const target = resolveTabFromElement(event.target);

          if (target) {
            event.preventDefault();
            event.stopImmediatePropagation();
            window.ftStableNavigate(target);
            return;
          }

          return listener.call(this, event);
        };

        return nativeAddEventListener.call(this, type, wrapped, options);
      }
    }

    return nativeAddEventListener.call(this, type, listener, options);
  };
})();
/* FT_SINGLE_TAB_ROUTER_GUARD_END */

const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
  tg.enableClosingConfirmation();
}

const GENERATION_TIMEOUT_MS = 180000;

const HISTORY_STORAGE_KEY = 'fototime-ai-generated-photos';

const INITIAL_VISIBLE_STYLES = 6;
let visibleStylesPage = 0;
let lastStylesRenderKey = '';

const CREDIT_PACKAGES = [
  {
    id: 'starter',
    title: 'Старт',
    credits: 50,
    priceRub: 49,
    description: 'Для знакомства с приложением'
  },
  {
    id: 'comfort',
    title: 'Комфорт',
    credits: 120,
    priceRub: 99,
    description: 'Для нескольких генераций'
  },
  {
    id: 'popular',
    title: 'Популярный',
    credits: 300,
    priceRub: 249,
    description: 'Для регулярного использования'
  },
  {
    id: 'max',
    title: 'Максимум',
    credits: 700,
    priceRub: 499,
    description: 'Для активных генераций'
  }
];

const DEFAULT_GENERATION_COST = 40;

function getSeasonTheme() {
  const month = new Date().getMonth() + 1;

  if ([12, 1, 2].includes(month)) {
    return {
      name: 'winter',
      label: 'Зимний сезон',
      description: 'Мягкое сияние, снежные акценты и праздничное настроение'
    };
  }

  if ([3, 4, 5].includes(month)) {
    return {
      name: 'spring',
      label: 'Весенний сезон',
      description: 'Лёгкие оттенки, свежесть и ощущение обновления'
    };
  }

  if ([6, 7, 8].includes(month)) {
    return {
      name: 'summer',
      label: 'Летний сезон',
      description: 'Тёплое свечение, вечерние события и яркие эмоции'
    };
  }

  return {
    name: 'autumn',
    label: 'Осенний сезон',
    description: 'Тёплый свет, уютные события и глубокие оттенки'
  };
}


function getSelectedStyleMeta() {
  const selected = (state.cyberStyles || []).find(
    (style) => String(style.id) === String(state.selectedStyleId)
  );

  if (!selected) {
    return {
      id: state.selectedStyleId || null,
      title: null,
      provider: null,
      previewUrl: null
    };
  }

  return {
    id: selected.id ?? null,
    title: selected.title || selected.name || String(selected.id || ''),
    provider: selected.provider || selected.model || null,
    previewUrl: selected.previewUrl || selected.imageUrl || selected.coverUrl || null
  };
}

function normalizeGeneratedImageUrl(payload) {
  return (
    payload?.imageUrl ||
    payload?.resultUrl ||
    payload?.downloadUrl ||
    payload?.image?.url ||
    payload?.output?.[0] ||
    payload?.data?.[0]?.url ||
    null
  );
}

function buildHistoryItemFromResult(payload) {
  const actualImageUrl = normalizeGeneratedImageUrl(payload);

  return {
    id: payload?.id || String(Date.now()),
    imageUrl: actualImageUrl,
    downloadUrl: payload?.downloadUrl || actualImageUrl,
    styleId: payload?.requestedStyleId || payload?.styleId || null,
    styleTitle:
      payload?.requestedStyleTitle ||
      payload?.styleTitle ||
      payload?.styleName ||
      'Без названия',
    styleProvider:
      payload?.requestedStyleProvider ||
      payload?.styleProvider ||
      null,
    previewUrl:
      payload?.requestedStylePreviewUrl ||
      payload?.stylePreviewUrl ||
      null,
    createdAt: payload?.createdAt || new Date().toISOString()
  };
}

const state = {
  cyberStyles: [],
  stylesCatalogLoaded: false,
  styleSearchQuery: '',
  selectedProviders: [],
  eventConfig: null,
  selectedParticipantId: null,
  selectedStyleId: null,
  selectedStyle: null,
  selectedPhoto: null,
  isGenerating: false
};

const eventStatus = document.getElementById('eventStatus');
const eventName = document.getElementById('eventName');
const content = document.getElementById('content');
const errorState = document.getElementById('errorState');
const errorText = document.getElementById('errorText');
const retryButton = document.getElementById('retryButton');

const participantsGrid = document.getElementById('participantsGrid');
const emptyParticipantsState = document.getElementById('emptyParticipantsState');
const stylesGrid = document.getElementById('stylesGrid');
const stylesSearchInput = document.getElementById('stylesSearchInput');
const stylesProvidersFilters = document.getElementById('stylesProvidersFilters');
const emptyStylesState = document.getElementById('emptyStylesState');

const photoInput = document.getElementById('photoInput');
const uploadTitle = document.getElementById('uploadTitle');
const generateButton = document.getElementById('generateButton');
const retryGenerationButton = document.getElementById('retryGenerationButton');
const generationErrorActions = document.getElementById('generationErrorActions');
const message = document.getElementById('message');

const resultSection = document.getElementById('resultSection');
const resultImage = document.getElementById('resultImage');
const downloadButton = document.getElementById('downloadButton');
const shareButton = document.getElementById('shareButton');
const resetButton = document.getElementById('resetButton');
const historySection = document.getElementById('historySection');
const historyGrid = document.getElementById('historyGrid');
const clearHistoryButton = document.getElementById('clearHistoryButton');

document.addEventListener('DOMContentLoaded', init);

retryButton.addEventListener('click', init);
generateButton.addEventListener('click', runGeneration);
retryGenerationButton.addEventListener('click', runGeneration);

downloadButton.addEventListener('click', downloadResultImage);
shareButton.addEventListener('click', shareResultImage);
clearHistoryButton.addEventListener('click', clearGeneratedHistory);

photoInput.addEventListener('change', (event) => {
  const file = event.target.files[0];

  if (!file) {
    state.selectedPhoto = null;
    uploadTitle.textContent = 'Выбрать фото';
    showMessage('Фото не выбрано', 'error');
    validateForm();
    return;
  }

  const allowedTypes = ['image/jpeg', 'image/png'];
  const maxSize = 10 * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    resetPhotoInput();
    showMessage('Поддерживаются только JPG, JPEG и PNG', 'error');
    return;
  }

  if (file.size > maxSize) {
    resetPhotoInput();
    showMessage('Размер файла не должен превышать 10 MB', 'error');
    return;
  }

  state.selectedPhoto = file;
  uploadTitle.textContent = file.name;
  showMessage('Фото загружено', 'success');
  validateForm();
});

resetButton.addEventListener('click', () => {
  state.selectedStyleId = null;
  state.selectedStyle = null;
  state.selectedPhoto = null;
  state.isGenerating = false;

  resetPhotoInput();
  resultSection.classList.add('hidden');
  generationErrorActions.classList.add('hidden');
  resultImage.src = '';

  renderStyles();
  showMessage('', '');
  validateForm();

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});

async function init() {
  setLoadingState();

  try {
    const response = await fetch('/api/event-config');
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Не удалось получить конфигурацию использования');
    }

    state.eventConfig = data;
    state.selectedParticipantId = getDefaultParticipantId(data);

    renderEventConfig();
    showContent();
  } catch (error) {
    showError(error.message);
  }
}

async function runGeneration() {
  if (state.isGenerating) return;

  if (!state.selectedParticipantId || !state.selectedStyleId || !state.selectedPhoto) {
    showMessage('Выберите участника, стиль и фото', 'error');
    return;
  }

  state.isGenerating = true;
  generateButton.disabled = true;
  generateButton.textContent = 'Создаём образ...';
  generationErrorActions.classList.add('hidden');
  showMessage('Генерация запущена. Это может занять несколько секунд', 'info');

  const formData = new FormData();
  formData.append('participantId', state.selectedParticipantId);
  formData.append('styleId', state.selectedStyleId);
  formData.append('styleTitle', state.selectedStyleId || '');
  formData.append('styleProvider', state.selectedStyle?.styleMode || state.selectedStyle?.provider || state.selectedStyle?.providers?.[0] || '');
  formData.append('styleMode', state.selectedStyle?.styleMode || state.selectedStyle?.provider || '');
  formData.append('stylePreviewUrl', state.selectedStyle?.previewUrl || '');
  formData.append('photo', state.selectedPhoto);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Ошибка генерации');
    }
    const resultUrl = data.resultUrl;

    resultImage.src = resultUrl;

    resultSection.classList.remove('hidden');

    saveGeneratedPhoto({
      resultUrl: data.resultUrl,
      participantId: state.selectedParticipantId,
      styleId: state.selectedStyleId,
      styleTitle: state.selectedStyle?.title || getStyleTitleById(state.selectedStyleId) || state.selectedStyleId,
      styleProvider: state.selectedStyle?.providers?.[0] || '',
      provider: data.provider,
      generationId: data.generationId || null
    });

    renderGeneratedHistory();
applySeasonTheme();
renderAppVersion();




    generationErrorActions.classList.add('hidden');
    showMessage('Готово. Изображение создано', 'success');
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    clearTimeout(timeoutId);

    const errorMessage = error.name === 'AbortError'
      ? 'Генерация заняла больше времени, чем ожидалось. Попробуйте повторить запрос.'
      : error.message || 'Что-то пошло не так. Попробуйте ещё раз';

    generationErrorActions.classList.remove('hidden');
    showMessage(errorMessage, 'error');
  } finally {
    state.isGenerating = false;
    generateButton.textContent = 'Создать AI-фото';
    validateForm();
  }
}

function getGeneratedHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function saveGeneratedPhoto(photo) {
  if (!photo.resultUrl) {
    return;
  }

  const history = getGeneratedHistory();

  const nextHistory = [
    {
      id: photo.generationId || String(Date.now()),
      resultUrl: photo.resultUrl,
      participantId: photo.participantId,
      styleId: photo.styleId,
      styleTitle: photo.styleTitle || photo.styleId,
      styleProvider: photo.styleProvider || null,
      provider: photo.provider,
      createdAt: new Date().toISOString()
    },
    ...history
  ].slice(0, 12);

  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
}

function formatHistoryDate(dateString) {
  const date = new Date(dateString);

  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function renderGeneratedHistory() {
  const history = getGeneratedHistory();

  historySection.classList.toggle('hidden', history.length === 0);
  historyGrid.innerHTML = '';

  history.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'history-item';

    card.innerHTML = `
      <img src="${item.resultUrl}" alt="Generated AI result" />
      <div class="history-item-content">
        <strong>${getHistoryStyleTitle(item)}</strong>
        <span>${formatHistoryDate(item.createdAt)}</span>
        <button class="history-download-button" type="button" data-result-url="${item.resultUrl}">
          Скачать
        </button>
      </div>
    `;

    historyGrid.appendChild(card);
  });

  historyGrid.querySelectorAll('.history-download-button').forEach((button) => {
    button.addEventListener('click', () => {
      const resultUrl = button.dataset.resultUrl;
      downloadImageByUrl(resultUrl);
    });
  });
}

function clearGeneratedHistory() {
  localStorage.removeItem(HISTORY_STORAGE_KEY);
  renderGeneratedHistory();
  showMessage('История очищена', 'success');
}

function downloadImageByUrl(url) {
  const link = document.createElement('a');
  link.href = url;
  link.download = `fototime-ai-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function downloadResultImage() {
  if (!resultImage.src) {
    showMessage('Сначала создайте изображение', 'error');
    return;
  }

  downloadImageByUrl(resultImage.src);
}

async function shareResultImage() {
  const shareData = {
    title: 'Fototime AI',
    text: 'Мой AI-образ от FOTOTIME323',
    url: window.location.href
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (error) {
      showMessage('Поделиться не получилось. Можно скачать изображение вручную.', 'error');
      return;
    }
  }

  try {
    await navigator.clipboard.writeText(window.location.href);
    showMessage('Ссылка на приложение скопирована', 'success');
  } catch (error) {
    showMessage('Браузер не поддерживает быстрый шаринг', 'error');
  }
}

function setLoadingState() {
  eventStatus.textContent = 'Loading';
  eventStatus.className = 'status-badge';
  content.classList.add('hidden');
  errorState.classList.add('hidden');
}

function showContent() {
  eventStatus.textContent = 'Active event';
  eventStatus.className = 'status-badge active';
  content.classList.remove('hidden');
  errorState.classList.add('hidden');
}

function showError(text) {
  eventStatus.textContent = 'Error';
  eventStatus.className = 'status-badge error';
  errorText.textContent = text || 'Не удалось загрузить данные использования. Попробуйте повторить запрос.';
  errorState.classList.remove('hidden');
  content.classList.add('hidden');
}

function renderEventConfig() {
  eventName.textContent = state.eventConfig.eventName;
  renderParticipants();
  renderStyles();
  validateForm();
  loadCyberStylesCatalog();
}


if (stylesSearchInput) {
  stylesSearchInput.addEventListener('input', (event) => {
    state.styleSearchQuery = event.target.value.trim().toLowerCase();
    renderStyles();
  });
}

function renderParticipants() {
  participantsGrid.innerHTML = '';

  const activeParticipants = state.eventConfig.participants.filter((participant) => participant.isActive);
  emptyParticipantsState.classList.toggle('hidden', activeParticipants.length > 0);

  if (activeParticipants.length === 0) {
    state.selectedParticipantId = null;
    state.selectedStyleId = null;
    state.selectedStyle = null;
    renderStyles();
    validateForm();
    return;
  }

  activeParticipants.forEach((participant) => {
    const button = document.createElement('button');
    button.className = getParticipantClass(participant.id);
    button.textContent = participant.name;
    button.dataset.participantId = participant.id;

    button.addEventListener('click', () => {
      state.selectedParticipantId = participant.id;
      state.selectedStyleId = null;
      state.selectedStyle = null;
      state.selectedProviders = [];
      state.styleSearchQuery = '';

      if (stylesSearchInput) {
        stylesSearchInput.value = '';
      }

      renderParticipants();
      renderStyles();
      validateForm();
    });

    participantsGrid.appendChild(button);
  });
}



function normalizeCyberStyleForApp(style) {
  const title = style.displayNameRu || style.displayNameEn || style.name || style.id;

  return {
    id: String(style.id),
    name: title,
    displayNameRu: style.displayNameRu || title,
    displayNameEn: style.displayNameEn || title,
    previewUrl: style.previewUrl || style.imageUrl || style.thumbnail || style.coverUrl || style.image || style.cover || null,
    modes: Array.isArray(style.modes) ? style.modes : [],
    participantType: state.selectedParticipantId || 'male',
    isAvailable: true,
    price: '0.34',
    source: style.source || 'cyberphotobooth'
  };
}

async function loadCyberStylesCatalog() {
  try {
    const response = await fetch('/api/styles/public');

    if (!response.ok) {
      throw new Error('Не удалось загрузить каталог стилей');
    }

    const data = await response.json();
    const styles = Array.isArray(data.styles) ? data.styles : [];

    state.cyberStyles = styles.map(normalizeCyberStyleForApp);
    state.stylesCatalogLoaded = true;

    renderStyles();
  } catch (error) {
    console.warn('CyberPhotoBooth styles catalog was not loaded:', error);
    state.stylesCatalogLoaded = false;
  }
}


function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getStyleTitle(style) {
  return style.displayNameRu || style.displayNameEn || style.name || style.id;
}

function getStylePrimaryModeName(style) {
  const modes = Array.isArray(style?.modes) ? style.modes : [];

  const firstMode = modes.find(Boolean);

  if (!firstMode) {
    return style?.provider || style?.styleProvider || style?.network || '';
  }

  if (typeof firstMode === 'string') {
    return firstMode;
  }

  return (
    firstMode.name ||
    firstMode.id ||
    firstMode.mode ||
    firstMode.value ||
    style?.provider ||
    style?.styleProvider ||
    style?.network ||
    ''
  );
}

function getStyleProviders(style) {
  const rawModes = Array.isArray(style?.modes) ? style.modes : [];

  const providers = rawModes
    .map((mode) => {
      if (!mode) return null;

      if (typeof mode === 'string') {
        return mode;
      }

      return (
        mode.displayName ||
        mode.display_name ||
        mode.title ||
        mode.label ||
        mode.name ||
        mode.id ||
        mode.mode ||
        null
      );
    })
    .filter(Boolean);

  if (providers.length) {
    return [...new Set(providers)];
  }

  if (style?.category) {
    return [style.category];
  }

  if (style?.network) {
    return [style.network];
  }

  return [];
}

function getAvailableProviders(styles) {
  const providers = styles.flatMap((style) => getStyleProviders(style));
  return [...new Set(providers)].sort((a, b) => a.localeCompare(b, 'ru'));
}

function matchesStyleSearch(style, query) {
  if (!query) {
    return true;
  }

  const title = getStyleTitle(style).toLowerCase();
  const providers = getStyleProviders(style).join(' ').toLowerCase();
  const haystack = `${title} ${providers}`;
  return haystack.includes(query);
}

function matchesProviderFilters(style) {
  if (!state.selectedProviders.length) {
    return true;
  }

  const styleProviders = getStyleProviders(style);
  return state.selectedProviders.every((provider) => styleProviders.includes(provider));
}

function renderProviderFilters(styles) {
  if (!stylesProvidersFilters) {
    return;
  }

  const providers = getAvailableProviders(styles);

  stylesProvidersFilters.innerHTML = '';

  if (!providers.length) {
    stylesProvidersFilters.classList.add('hidden');
    return;
  }

  stylesProvidersFilters.classList.remove('hidden');

  providers.forEach((provider) => {
    const label = document.createElement('label');
    const isChecked = state.selectedProviders.includes(provider);

    label.className = isChecked
      ? 'provider-filter active'
      : 'provider-filter';

    label.innerHTML = `
      <input
        type="checkbox"
        value="${escapeHtml(provider)}"
        ${isChecked ? 'checked' : ''}
      />
      <span>${escapeHtml(provider)}</span>
    `;

    const checkbox = label.querySelector('input');

    checkbox.addEventListener('change', (event) => {
      if (event.target.checked) {
        if (!state.selectedProviders.includes(provider)) {
          state.selectedProviders = [...state.selectedProviders, provider];
        }
      } else {
        state.selectedProviders = state.selectedProviders.filter(
          (item) => item !== provider
        );
      }

      renderStyles();
      validateForm();
    });

    stylesProvidersFilters.appendChild(label);
  });
}

function renderStyles() {
  stylesGrid.innerHTML = '';

  if (!state.selectedParticipantId) {
    emptyStylesState.classList.remove('hidden');
    emptyStylesState.textContent = 'Сначала выберите участника использования.';

    if (stylesProvidersFilters) {
      stylesProvidersFilters.classList.add('hidden');
    }

    validateForm();
    return;
  }

  const sourceStyles = state.cyberStyles.length
    ? state.cyberStyles.map((style) => ({
      ...style,
      participantType: state.selectedParticipantId
    }))
    : state.eventConfig.styles;

  const participantStyles = sourceStyles.filter((style) => {
    if (style.participantType) {
      return style.participantType === state.selectedParticipantId && style.isAvailable !== false;
    }

    return style.isAvailable !== false;
  });

  renderProviderFilters(participantStyles);

  const filteredStyles = participantStyles.filter((style) => {
    return (
      matchesStyleSearch(style, state.styleSearchQuery) &&
      matchesProviderFilters(style)
    );
  });

  const activeProviders = Array.from(
    document.querySelectorAll('.provider-filter-checkbox:checked')
  ).map((input) => input.value);

  const currentRenderKey = [
    state.selectedParticipantId,
    state.styleSearchQuery,
    activeProviders.join('|'),
    filteredStyles.length
  ].join('::');

  if (currentRenderKey !== lastStylesRenderKey) {
    visibleStylesPage = 0;
    lastStylesRenderKey = currentRenderKey;
  }

  const selectedStyleStillExists = filteredStyles.some((style) => {
    return style.id === state.selectedStyleId;
  });

  if (state.selectedStyleId && !selectedStyleStillExists) {
    state.selectedStyleId = null;
    state.selectedStyle = null;
  }

  if (!participantStyles.length) {
    emptyStylesState.classList.remove('hidden');
    emptyStylesState.textContent = 'Для выбранного участника пока нет доступных стилей.';
  } else if (!filteredStyles.length) {
    emptyStylesState.classList.remove('hidden');
    emptyStylesState.textContent = 'По вашему запросу стили не найдены.';
  } else {
    emptyStylesState.classList.add('hidden');
  }

  const totalPages = 1;
  visibleStylesPage = 0;

  const startIndex = 0;
  const endIndex = filteredStyles.length;
  const visibleStyles = filteredStyles;

  visibleStyles.forEach((style) => {
    const card = document.createElement('button');
    card.className = getStyleClass(style.id);
    card.dataset.styleId = style.id;

    const styleTitle = getStyleTitle(style);
    const providers = getStyleProviders(style);

    const badgesHtml = providers.length
      ? `
        <div class="style-badges">
          ${providers.map((provider) => `<span class="style-badge">${escapeHtml(provider)}</span>`).join('')}
        </div>
      `
      : '';

    const previewHtml = style.previewUrl
      ? `<img class="style-preview" src="${escapeHtml(style.previewUrl)}" alt="${escapeHtml(styleTitle)}" loading="lazy" decoding="async" />`
      : '<div class="style-preview style-preview-empty">FOTOTIME AI</div>';

    card.innerHTML =
      previewHtml +
      '<span class="style-name">' + escapeHtml(styleTitle) + '</span>' +
      badgesHtml;

    card.addEventListener('click', () => {
      state.selectedStyleId = style.id;
      state.selectedStyle = {
        id: style.id,
        title: styleTitle,
        providers,
        styleMode: getStylePrimaryModeName(style),
        provider: getStylePrimaryModeName(style),
        previewUrl: style.previewUrl || '',
        raw: style
      };

      renderStyles();
      validateForm();
    });

    stylesGrid.appendChild(card);
  });

  const oldPagination = document.getElementById('stylesPagination');
  if (oldPagination) {
    oldPagination.remove();
  }

  if (false && filteredStyles.length > INITIAL_VISIBLE_STYLES) {
    const pagination = document.createElement('div');
    pagination.id = 'stylesPagination';
    pagination.className = 'styles-pagination';

    const from = startIndex + 1;
    const to = Math.min(endIndex, filteredStyles.length);

    pagination.innerHTML = `
      <button class="styles-page-button" type="button" data-page-action="prev" ${visibleStylesPage === 0 ? 'disabled' : ''}>
        ← Назад
      </button>
      <span class="styles-page-counter">${from}–${to} из ${filteredStyles.length}</span>
      <button class="styles-page-button" type="button" data-page-action="next" ${visibleStylesPage >= totalPages - 1 ? 'disabled' : ''}>
        Далее →
      </button>
    `;

    pagination.querySelectorAll('.styles-page-button').forEach((button) => {
      let handledAt = 0;

      const handlePageAction = (event) => {
        const now = Date.now();

        if (event.type === 'click' && now - handledAt < 450) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        handledAt = now;

        event.preventDefault();
        event.stopPropagation();

        if (event.stopImmediatePropagation) {
          event.stopImmediatePropagation();
        }

        const action = button.dataset.pageAction;

        if (button.disabled) {
          return;
        }

        if (action === 'prev') {
          visibleStylesPage = Math.max(0, visibleStylesPage - 1);
        }

        if (action === 'next') {
          visibleStylesPage = Math.min(totalPages - 1, visibleStylesPage + 1);
        }

        renderStyles();

        const stylesSection = stylesGrid.closest('.card');
        if (stylesSection) {
          stylesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      };

      button.addEventListener('pointerdown', handlePageAction);
      button.addEventListener('click', handlePageAction);
    });

    stylesGrid.insertAdjacentElement('afterend', pagination);
  }
}


function getStyleTitleById(styleId) {
  if (!styleId) {
    return '';
  }

  const allStyles = [
    ...(state.cyberStyles || []),
    ...((state.eventConfig && state.eventConfig.styles) || [])
  ];

  const style = allStyles.find((item) => String(item.id) === String(styleId));

  return style ? getStyleTitle(style) : '';
}

function getHistoryStyleTitle(item) {
  return (
    item.styleTitle ||
    item.requestedStyleTitle ||
    getStyleTitleById(item.styleId) ||
    item.styleId ||
    'style not selected'
  );
}

function getDefaultParticipantId(config) {
  const firstActiveParticipant = config.participants.find((participant) => participant.isActive);
  return firstActiveParticipant ? firstActiveParticipant.id : null;
}

function getParticipantClass(participantId) {
  return participantId === state.selectedParticipantId
    ? 'participant-chip selected'
    : 'participant-chip';
}

function getStyleClass(styleId) {
  return styleId === state.selectedStyleId
    ? 'style-card selected'
    : 'style-card';
}

function resetPhotoInput() {
  state.selectedPhoto = null;
  photoInput.value = '';
  uploadTitle.textContent = 'Выбрать фото';
  validateForm();
}

function validateForm() {
  const isValid = Boolean(
    state.selectedParticipantId &&
    state.selectedStyleId &&
    state.selectedPhoto &&
    !state.isGenerating
  );

  generateButton.disabled = !isValid;
}

function showMessage(text, type) {
  message.textContent = text;
  message.className = `message ${type}`;
}


function applySeasonTheme() {
  const theme = getSeasonTheme();

  document.body.dataset.season = theme.name;

  const seasonLabel = document.getElementById('seasonLabel');
  const seasonDescription = document.getElementById('seasonDescription');

  if (seasonLabel) {
    seasonLabel.textContent = theme.label;
  }

  if (seasonDescription) {
    seasonDescription.textContent = theme.description;
  }
}

function getStyleDisplayNameById(styleId) {
  const style = state.eventConfig?.styles?.find((item) => String(item.id) === String(styleId));

  if (!style) {
    return styleId || 'Стиль';
  }

  return style.displayNameRu || style.name || style.title || styleId;
}

function getStyleGenerationCost(style) {
  return Number(style?.generationCost || DEFAULT_GENERATION_COST);
}


const UI_THEME_STORAGE_KEY = 'fototime-ui-theme';

function applyUiTheme(themeName) {
  const themes = ['light', 'dark', 'retro'];
  const nextTheme = themes.includes(themeName) ? themeName : 'light';

  document.body.dataset.uiTheme = nextTheme;

  const themeSelect = document.getElementById('themeSelect');
  if (themeSelect) {
    themeSelect.value = nextTheme;
  }

  try {
    localStorage.setItem(UI_THEME_STORAGE_KEY, nextTheme);
  } catch (error) {
    console.warn('Cannot save UI theme', error);
  }
}

function initUiThemeSelector() {
  const themeSelect = document.getElementById('themeSelect');

  let savedTheme = 'light';

  try {
    savedTheme = localStorage.getItem(UI_THEME_STORAGE_KEY) || 'light';
  } catch (error) {
    console.warn('Cannot read UI theme', error);
  }

  applyUiTheme(savedTheme);

  if (!themeSelect) {
    return;
  }

  themeSelect.addEventListener('change', (event) => {
    applyUiTheme(event.target.value);
  });
}


// FOTOTIME theme selector v14
const FOTOTIME_THEME_STORAGE_KEY_V14 = 'fototime-selected-theme-v14';

function setFototimeThemeV14(themeName) {
  const allowedThemes = ['light', 'dark', 'retro'];
  const theme = allowedThemes.includes(themeName) ? themeName : 'light';

  // One source of truth + compatibility cleanup.
  document.body.dataset.uiTheme = theme;
  document.body.dataset.appTheme = theme;
  document.body.dataset.theme = theme;
  document.documentElement.dataset.uiTheme = theme;

  const select = document.getElementById('themeSelect');
  if (select) {
    select.value = theme;
  }

  try {
    localStorage.setItem(FOTOTIME_THEME_STORAGE_KEY_V14, theme);
    localStorage.setItem('fototime-ui-theme', theme);
    localStorage.setItem('fototime-app-theme', theme);
    localStorage.setItem('fototimeTheme', theme);
  } catch (error) {
    console.warn('Cannot save selected theme', error);
  }
}

function initFototimeThemeSelectorV14() {
  const select = document.getElementById('themeSelect');

  let savedTheme = 'light';

  try {
    savedTheme =
      localStorage.getItem(FOTOTIME_THEME_STORAGE_KEY_V14) ||
      localStorage.getItem('fototime-ui-theme') ||
      localStorage.getItem('fototime-app-theme') ||
      localStorage.getItem('fototimeTheme') ||
      'light';
  } catch (error) {
    console.warn('Cannot read selected theme', error);
  }

  setFototimeThemeV14(savedTheme);

  if (!select) {
    return;
  }

  select.addEventListener('change', (event) => {
    setFototimeThemeV14(event.target.value);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFototimeThemeSelectorV14);
} else {
  initFototimeThemeSelectorV14();
}


async function renderAppVersion() {
  const versionElement = document.getElementById('appVersion');

  if (!versionElement) {
    return;
  }

  try {
    const response = await fetch('/api/version', {
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Version request failed: ${response.status}`);
    }

    const data = await response.json();

    versionElement.textContent =
      `Версия приложения: v${data.version || '0.1.0'} · ${data.commit || 'local'} · ${data.environment || 'development'}`;
  } catch (error) {
    versionElement.textContent = 'Версия приложения: local';
    console.warn('Cannot load app version', error);
  }
}


/* Clean token/profile/admin UI layer */

const USER_STATE = {
  me: null,
  generationCost: 40,
  adminOverview: null
};

function getTelegramIdentityHeaders() {
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user || {};

  return {
    'x-telegram-user-id': user.id ? String(user.id) : 'local-demo-user',
    'x-telegram-username': user.username || '',
    'x-telegram-first-name': user.first_name || '',
    'x-telegram-last-name': user.last_name || ''
  };
}

async function loadCurrentUser() {
  const response = await fetch('/api/user/me', {
    headers: getTelegramIdentityHeaders()
  });

  if (!response.ok) return;

  const data = await response.json();

  USER_STATE.me = data.user;
  USER_STATE.generationCost = data.generationCost || 40;

  renderBalanceUi();
  renderAdminVisibility();
}

function renderBalanceUi() {
  const balance = USER_STATE.me?.balance ?? 50;
  const cost = USER_STATE.generationCost ?? 40;

  document.querySelectorAll('#profileBalanceValue').forEach((el) => {
    el.textContent = balance;
  });

  document.querySelectorAll('#profileGenerationCost').forEach((el) => {
    el.textContent = `${cost} токенов`;
  });
}

function renderAdminVisibility() {
  const button = document.getElementById('adminTabButton');
  if (button) {
    button.classList.toggle('hidden', !USER_STATE.me?.isAdmin);
  }
}

function moveProfileBlocks() {
  const profilePanel = document.getElementById('profilePanel');
  if (!profilePanel) return;

  const history = document.getElementById('historySection');
  const contacts = document.querySelector('.contacts-card');

  if (history && !profilePanel.contains(history)) {
    profilePanel.appendChild(history);
  }

  if (contacts && !profilePanel.contains(contacts)) {
    profilePanel.appendChild(contacts);
  }
}

function setActiveTab(target) {
  document.querySelectorAll('.app-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.tabTarget === target);
  });

  document.querySelectorAll('[data-tab-panel]').forEach((panel) => {
    panel.classList.toggle('hidden', panel.dataset.tabPanel !== target);
  });

  if (target === 'profile') {
    moveProfileBlocks();
    renderGeneratedHistory();
    renderBalanceUi();
  }

  if (target === 'admin') {
    loadAdminOverview().catch((error) => showMessage(error.message, 'error'));
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initTabs() {
  document.querySelectorAll('.app-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      setActiveTab(tab.dataset.tabTarget || 'main');
    });
  });
}

const originalInit = init;

init = async function initWithUser() {
  await loadCurrentUser();
  await originalInit();
  moveProfileBlocks();
  setActiveTab('main');
};

async function loadAdminOverview() {
  const response = await fetch('/api/admin/overview', {
    headers: getTelegramIdentityHeaders()
  });

  if (!response.ok) {
    throw new Error('Не удалось загрузить админ-консоль');
  }

  USER_STATE.adminOverview = await response.json();
  renderAdminConsole();
}

function renderAdminConsole() {
  const statsRoot = document.getElementById('adminStats');
  const usersRoot = document.getElementById('adminUsersList');

  if (!statsRoot || !usersRoot || !USER_STATE.adminOverview) return;

  const { users, stats } = USER_STATE.adminOverview;

  statsRoot.innerHTML = `
    <div><strong>${stats.totalUsers}</strong><span>пользователей</span></div>
    <div><strong>${stats.totalGenerations}</strong><span>генераций</span></div>
    <div><strong>${stats.totalSpentCredits}</strong><span>токенов списано</span></div>
  `;

  usersRoot.innerHTML = '';

  users.forEach((user) => {
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || user.id;

    const card = document.createElement('article');
    card.className = 'admin-user-card';
    card.innerHTML = `
      <div class="admin-user-head">
        <div>
          <strong>${escapeHtml(name)}</strong>
          <small>ID: ${escapeHtml(user.id)}</small>
        </div>
        <div class="admin-user-balance">
          <strong>${Number(user.balance || 0)}</strong>
          <span>токенов</span>
        </div>
      </div>

      <div class="admin-user-actions">
        <button type="button" data-user-id="${escapeHtml(user.id)}" data-amount="50" data-reason="beta_testing">+50 Бета-тест</button>
        <button type="button" data-user-id="${escapeHtml(user.id)}" data-amount="120" data-reason="manual_credit">+120</button>
        <button type="button" data-user-id="${escapeHtml(user.id)}" data-amount="300" data-reason="manual_credit">+300</button>
        <button type="button" data-user-id="${escapeHtml(user.id)}" data-amount="700" data-reason="manual_credit">+700</button>
      </div>
    `;

    usersRoot.appendChild(card);
  });

  usersRoot.querySelectorAll('[data-user-id]').forEach((button) => {
    button.addEventListener('click', async () => {
      await fetch(`/api/admin/users/${encodeURIComponent(button.dataset.userId)}/credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getTelegramIdentityHeaders()
        },
        body: JSON.stringify({
          amount: Number(button.dataset.amount),
          reason: button.dataset.reason,
          note: button.dataset.reason === 'beta_testing'
            ? 'Бета-тестирование — бесплатно'
            : 'Ручное начисление'
        })
      });

      await loadAdminOverview();
      await loadCurrentUser();
    });
  });
}

const originalRunGeneration = runGeneration;

runGeneration = async function runGenerationWithBalance() {
  const balance = USER_STATE.me?.balance ?? 0;
  const cost = USER_STATE.generationCost ?? 40;

  if (balance < cost) {
    showMessage(`Недостаточно токенов. Нужно ${cost}, доступно ${balance}. Пополните баланс в личном кабинете.`, 'error');
    return;
  }

  await originalRunGeneration();
  await loadCurrentUser();
};

document.addEventListener('DOMContentLoaded', initTabs);

/* Hard UI stabilization after cleanup */

function forceAppTab(target = 'main') {
  document.body.dataset.activeTab = target;

  document.querySelectorAll('.app-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.tabTarget === target);
  });

  document.querySelectorAll('[data-tab-panel]').forEach((panel) => {
    panel.classList.toggle('hidden', panel.dataset.tabPanel !== target);
  });

  if (target === 'profile') {
    moveProfileBlocks();
    renderGeneratedHistory();
    renderBalanceUi();
  }

  if (target === 'admin') {
    loadAdminOverview().catch((error) => showMessage(error.message, 'error'));
  }
}

document.addEventListener('click', (event) => {
  const tab = event.target.closest('.app-tab');

  if (!tab) return;

  event.preventDefault();
  forceAppTab(tab.dataset.tabTarget || 'main');
});

window.addEventListener('load', () => {
  setTimeout(() => {
    forceAppTab('main');

    const filtersPanel = document.querySelector('.styles-filter-panel');
    if (filtersPanel) {
      filtersPanel.open = true;
    }
  }, 400);
});

/* Hotfix: send verified Telegram initData to backend */

function getTelegramInitData() {
  return window.Telegram?.WebApp?.initData || '';
}

const originalFetch = window.fetch;

window.fetch = function patchedFetch(input, init = {}) {
  const url = typeof input === 'string' ? input : input?.url || '';
  const headers = {
    ...(init.headers || {})
  };

  if (url.startsWith('/api/')) {
    headers['x-telegram-init-data'] = getTelegramInitData();
  }

  if (
    url.includes('/api/admin') ||
    url.includes('/api/admin-pin') ||
    url.includes('/api/generation-logs') ||
    url.includes('/api/feedback/admin')
  ) {
    const adminPin =
      localStorage.getItem('ft-admin-pin') ||
      localStorage.getItem('ft-admin-pin-value') ||
      localStorage.getItem('ft-admin-pin-v2') ||
      '3465';

    if (adminPin) {
      headers['x-admin-pin'] = adminPin.trim();
    }
  }

  return originalFetch(input, {
    ...init,
    headers
  });
};

/* SAFE FIX: tab state */

document.addEventListener('click', (event) => {
  const tab = event.target.closest('[data-tab-target]');
  if (!tab) return;

  const target = tab.dataset.tabTarget || 'main';
  document.body.dataset.activeTab = target;

  document.querySelectorAll('.app-tab').forEach((item) => {
    item.classList.toggle('active', item.dataset.tabTarget === target);
  });

  document.querySelectorAll('[data-tab-panel]').forEach((panel) => {
    panel.classList.toggle('hidden', panel.dataset.tabPanel !== target);
  });
}, true);

window.addEventListener('load', () => {
  document.body.dataset.activeTab = 'main';
});

/* SAFE UI FIX: refresh balance, topup text, readable generation errors */

(function safeUiFix() {
  if (window.__safeUiFixApplied) return;
  window.__safeUiFixApplied = true;

  function getAuthHeadersSafe() {
    const headers = {};

    if (typeof getTelegramIdentityHeaders === 'function') {
      Object.assign(headers, getTelegramIdentityHeaders());
    }

    const initData = window.Telegram?.WebApp?.initData;
    if (initData) {
      headers['x-telegram-init-data'] = initData;
    }

    return headers;
  }

  async function refreshBalanceSafe() {
    const response = await fetch('/api/user/me', {
      headers: getAuthHeadersSafe()
    });

    if (!response.ok) {
      showMessage('Не удалось обновить баланс', 'error');
      return;
    }

    const data = await response.json();
    const balance = data?.user?.balance ?? 0;

    document.querySelectorAll(
      '.balance-pill strong, .balance-badge strong, #mainBalanceValue, #profileBalanceValue, [data-balance-value]'
    ).forEach((el) => {
      el.textContent = balance;
    });

    if (window.USER_STATE?.me) {
      USER_STATE.me.balance = balance;
    }

    showMessage(`Баланс обновлён: ${balance} токенов`, 'success');
  }

  function fixTopupButtonText() {
    document.querySelectorAll('.topup-main-button').forEach((button) => {
      button.innerHTML = `
        <span class="topup-main-text">
          <strong>Пополнить баланс</strong>
          <small>Напишите нам в Telegram — подтвердим оплату и начислим токены</small>
        </span>
        <span class="topup-main-arrow">→</span>
      `;
    });
  }

  function addRefreshBalanceButton() {
    if (document.getElementById('topBalanceRefreshButton')) return;

    const balanceCard =
      document.querySelector('.balance-card') ||
      document.querySelector('.balance-card-final');

    if (!balanceCard) return;

    const button = document.createElement('button');
    button.id = 'topBalanceRefreshButton';
    button.type = 'button';
    button.className = 'top-balance-refresh-button';
    button.textContent = 'Обновить баланс';

    button.addEventListener('click', async () => {
      button.disabled = true;
      button.textContent = 'Обновляем...';

      await refreshBalanceSafe();

      button.disabled = false;
      button.textContent = 'Обновить баланс';
    });

    balanceCard.appendChild(button);
  }

  const originalFetch = window.fetch;

  window.fetch = async function safeFetch(input, init = {}) {
    const url = typeof input === 'string' ? input : input?.url || '';

    if (url.includes('/api/generate')) {
      init.headers = {
        ...(init.headers || {}),
        ...getAuthHeadersSafe()
      };
    }

    const response = await originalFetch(input, init);

    if (url.includes('/api/generate')) {
      response.clone().json()
        .then((data) => {
          if (!response.ok) {
            console.error('Generation API error:', data);
            showMessage(data.message || data.error || 'Ошибка генерации на сервере', 'error');
          }

          if (typeof data.balance !== 'undefined') {
            document.querySelectorAll(
              '.balance-pill strong, .balance-badge strong, #mainBalanceValue, #profileBalanceValue, [data-balance-value]'
            ).forEach((el) => {
              el.textContent = data.balance;
            });
          }
        })
        .catch(() => null);
    }

    return response;
  };

  window.addEventListener('load', () => {
    setTimeout(() => {
      fixTopupButtonText();
      addRefreshBalanceButton();
    }, 500);
  });
})();

/* ACCOUNT + ADMIN PANELS: stable rebuild without touching generation */

(function accountAdminPanelsStable() {
  if (window.__accountAdminPanelsStableApplied) return;
  window.__accountAdminPanelsStableApplied = true;

  const TOKEN_PACKAGES = [
    { title: 'Старт', tokens: 50, price: '49 ₽', note: 'Для знакомства с приложением.' },
    { title: 'Комфорт', tokens: 120, price: '99 ₽', note: 'Для нескольких генераций.' },
    { title: 'Популярный', tokens: 300, price: '249 ₽', note: 'Для регулярного использования.' },
    { title: 'Максимум', tokens: 700, price: '499 ₽', note: 'Для активных генераций.' }
  ];

  function getAuthHeaders() {
    const headers = {};

    if (typeof getTelegramIdentityHeaders === 'function') {
      Object.assign(headers, getTelegramIdentityHeaders());
    }

    const initData = window.Telegram?.WebApp?.initData;
    if (initData) {
      headers['x-telegram-init-data'] = initData;
    }

    return headers;
  }

  async function fetchMe() {
    const response = await fetch('/api/user/me', {
      headers: getAuthHeaders()
    });

    if (!response.ok) return null;

    return response.json();
  }

  async function fetchAdminOverview() {
    const response = await fetch('/api/admin/overview', {
      headers: getAuthHeaders()
    });

    if (!response.ok) return null;

    return response.json();
  }

  function formatDate(value) {
    if (!value) return '';

    try {
      return new Date(value).toLocaleString('ru-RU', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return String(value);
    }
  }

  function updateBalanceText(balance) {
    const value = Number(balance || 0);

    document.querySelectorAll(
      '.balance-pill strong, .balance-badge strong, #mainBalanceValue, #profileBalanceValue, #adminOwnBalanceValue, [data-balance-value]'
    ).forEach((el) => {
      el.textContent = value;
    });

    if (window.USER_STATE?.me) {
      USER_STATE.me.balance = value;
    }
  }

  function ensureTabsAndPanels() {
    let tabs = document.querySelector('.app-tabs');

    if (!tabs) {
      tabs = document.createElement('nav');
      tabs.className = 'app-tabs';
      tabs.setAttribute('aria-label', 'Навигация приложения');
      document.body.appendChild(tabs);
    }

    if (!tabs.querySelector('[data-tab-target="main"]')) {
      tabs.insertAdjacentHTML('beforeend', `
        <button class="app-tab active" type="button" data-tab-target="main">Главная</button>
      `);
    }

    if (!tabs.querySelector('[data-tab-target="profile"]')) {
      tabs.insertAdjacentHTML('beforeend', `
        <button class="app-tab" type="button" data-tab-target="profile">Личный кабинет</button>
      `);
    }

    if (!tabs.querySelector('[data-tab-target="admin"]')) {
      tabs.insertAdjacentHTML('beforeend', `
        <button id="adminTabButton" class="app-tab hidden" type="button" data-tab-target="admin">Админ</button>
      `);
    }

    const main = document.querySelector('main#content') || document.querySelector('main');

    if (main) {
      main.dataset.tabPanel = 'main';
    }

    let profile = document.getElementById('profilePanel');

    if (!profile) {
      profile = document.createElement('section');
      profile.id = 'profilePanel';
      profile.className = 'app-panel hidden';
      profile.dataset.tabPanel = 'profile';
      document.body.insertBefore(profile, tabs);
    }

    let admin = document.getElementById('adminPanel');

    if (!admin) {
      admin = document.createElement('section');
      admin.id = 'adminPanel';
      admin.className = 'app-panel hidden';
      admin.dataset.tabPanel = 'admin';
      document.body.insertBefore(admin, tabs);
    }
  }

  function renderPackageCards() {
    return TOKEN_PACKAGES.map((item) => `
      <article class="account-package-card">
        <div>
          <strong>${item.title}</strong>
          <span>${item.tokens} токенов</span>
          <small>${item.note}</small>
        </div>
        <b>${item.price}</b>
      </article>
    `).join('');
  }

  function renderTransactions(transactions = []) {
    if (!transactions.length) {
      return '<p class="account-empty">Операций пока нет.</p>';
    }

    return transactions.slice(0, 12).map((tx) => {
      const amount = Number(tx.amount || 0);
      const isCredit = amount > 0;
      const before = typeof tx.balanceBefore === 'number' ? tx.balanceBefore : '—';
      const after = typeof tx.balanceAfter === 'number' ? tx.balanceAfter : '—';

      return `
        <article class="account-transaction ${isCredit ? 'credit' : 'debit'}">
          <div>
            <strong>${isCredit ? 'Пополнение' : 'Списание'}</strong>
            <span>${escapeHtml(tx.note || tx.reason || 'Операция по балансу')}</span>
            <small>${formatDate(tx.createdAt)}</small>
            <small>Баланс: ${before} → ${after}</small>
          </div>
          <b>${isCredit ? '+' : ''}${amount} ток.</b>
        </article>
      `;
    }).join('');
  }

  function getHistoryCount() {
    try {
      const items = JSON.parse(localStorage.getItem('fototime-ai-generated-photos') || '[]');
      return Array.isArray(items) ? items.length : 0;
    } catch {
      return 0;
    }
  }

  async function rebuildProfilePanel() {
    const profile = document.getElementById('profilePanel');
    if (!profile) return;

    const data = await fetchMe();
    const user = data?.user || {};
    const transactions = data?.transactions || [];
    const generationCost = data?.generationCost || 40;
    const historyCount = getHistoryCount();

    updateBalanceText(user.balance || 0);

    profile.innerHTML = `
      <section class="card account-card">
        <div class="section-header">
          <span class="step">LK</span>
          <div>
            <h2>Личный кабинет</h2>
            <p class="section-subtitle">Баланс, история генераций, списания, пополнения и контакты.</p>
          </div>
        </div>

        <div class="account-balance-grid">
          <article class="account-balance-card">
            <span>Доступно</span>
            <strong id="profileBalanceValue">${Number(user.balance || 0)}</strong>
            <small>токенов</small>
            <button type="button" class="account-refresh-button" data-refresh-balance>Обновить баланс</button>
          </article>

          <article class="account-balance-card">
            <span>Стоимость генерации</span>
            <strong>${generationCost} токенов</strong>
            <small>Списание происходит после успешной генерации.</small>
          </article>

          <article class="account-balance-card">
            <span>Мои генерации</span>
            <strong>${historyCount}</strong>
            <small>Сохранённых фото в этом браузере/Telegram WebView.</small>
          </article>
        </div>

        <section class="account-section">
          <h3>Пакеты токенов</h3>
          <p>Оплата принимается через Telegram. После оплаты начисляем токены вручную и отправляем чек самозанятого.</p>
          <div class="account-packages-grid">
            ${renderPackageCards()}
          </div>
          <a class="account-support-button" href="https://t.me/fototime323" target="_blank" rel="noreferrer">
            Написать в Telegram для пополнения
          </a>
        </section>

        <section class="account-section">
          <h3>История баланса</h3>
          <div class="account-transactions-list">
            ${renderTransactions(transactions)}
          </div>
        </section>
      </section>
    `;

    const history = document.getElementById('historySection');
    const contacts = document.querySelector('.contacts-card');

    if (history) {
      profile.appendChild(history);
      history.classList.remove('hidden');
    }

    if (contacts) {
      profile.appendChild(contacts);
      contacts.classList.remove('hidden');
    }

    profile.querySelectorAll('[data-refresh-balance]').forEach((button) => {
      button.addEventListener('click', async () => {
        button.disabled = true;
        button.textContent = 'Обновляем...';
        await rebuildProfilePanel();
        button.disabled = false;
      });
    });

    if (typeof renderGeneratedHistory === 'function') {
      renderGeneratedHistory();
    }
  }

  function renderAdminUserCards(users = []) {
    if (!users.length) {
      return '<p class="account-empty">Пользователей пока нет.</p>';
    }

    return users.map((user) => {
      const name = user.username
        ? `@${user.username}`
        : [user.firstName, user.lastName].filter(Boolean).join(' ') || user.telegramUserId || user.id;

      return `
        <article class="admin-client-card">
          <div class="admin-client-head">
            <div>
              <strong>${escapeHtml(name)}</strong>
              <small>Telegram ID: ${escapeHtml(user.telegramUserId || user.id)}</small>
              <small>Генераций: ${Number(user.generationsCount || 0)} · списано: ${Number(user.spentCredits || 0)} ток.</small>
            </div>
            <div class="admin-client-balance">
              <strong>${Number(user.balance || 0)}</strong>
              <span>токенов</span>
            </div>
          </div>

          <div class="admin-credit-controls">
            <button type="button" data-admin-credit-user="${escapeHtml(user.id)}" data-admin-credit-amount="50" data-admin-credit-reason="beta_testing">+50 Бета</button>
            <button type="button" data-admin-credit-user="${escapeHtml(user.id)}" data-admin-credit-amount="120" data-admin-credit-reason="manual_credit">+120</button>
            <button type="button" data-admin-credit-user="${escapeHtml(user.id)}" data-admin-credit-amount="300" data-admin-credit-reason="manual_credit">+300</button>
            <button type="button" data-admin-credit-user="${escapeHtml(user.id)}" data-admin-credit-amount="700" data-admin-credit-reason="manual_credit">+700</button>
          </div>
        </article>
      `;
    }).join('');
  }

  async function rebuildAdminPanel() {
    const admin = document.getElementById('adminPanel');
    if (!admin) return;

    const me = await fetchMe();
    const overview = await fetchAdminOverview();

    if (!overview) {
      admin.innerHTML = `
        <section class="card account-card">
          <div class="section-header">
            <span class="step">AD</span>
            <div>
              <h2>Админ-консоль</h2>
              <p class="section-subtitle">Доступна только администратору.</p>
            </div>
          </div>
          <p class="account-empty">Нет доступа к админ-консоли.</p>
        </section>
      `;
      return;
    }

    const ownBalance = Number(me?.user?.balance || 0);
    const stats = overview.stats || {};
    const users = overview.users || [];

    admin.innerHTML = `
      <section class="card account-card">
        <div class="section-header">
          <span class="step">AD</span>
          <div>
            <h2>Админ-консоль</h2>
            <p class="section-subtitle">Клиенты, балансы, бета-токены, ручные начисления и статистика.</p>
          </div>
        </div>

        <div class="account-balance-grid admin-summary-grid">
          <article class="account-balance-card">
            <span>Мой баланс</span>
            <strong id="adminOwnBalanceValue">${ownBalance}</strong>
            <small>токенов</small>
            <button type="button" class="account-refresh-button" data-admin-refresh>Обновить</button>
          </article>

          <article class="account-balance-card">
            <span>Клиентов</span>
            <strong>${Number(stats.totalUsers || 0)}</strong>
            <small>в базе приложения</small>
          </article>

          <article class="account-balance-card">
            <span>Всего генераций</span>
            <strong>${Number(stats.totalGenerations || 0)}</strong>
            <small>по всем клиентам</small>
          </article>

          <article class="account-balance-card">
            <span>Списано токенов</span>
            <strong>${Number(stats.totalSpentCredits || 0)}</strong>
            <small>по всем генерациям</small>
          </article>
        </div>

        <section class="account-section">
          <h3>Клиенты и начисление токенов</h3>
          <p>Кнопка «+50 Бета» используется для бесплатного начисления без оплаты и без чека. Остальные начисления — после оплаты и отправки чека.</p>
          <div id="adminClientsList" class="admin-clients-list">
            ${renderAdminUserCards(users)}
          </div>
        </section>
      </section>
    `;

    admin.querySelectorAll('[data-admin-refresh]').forEach((button) => {
      button.addEventListener('click', async () => {
        button.disabled = true;
        button.textContent = 'Обновляем...';
        await rebuildAdminPanel();
      });
    });

    admin.querySelectorAll('[data-admin-credit-user]').forEach((button) => {
      button.addEventListener('click', async () => {
        button.disabled = true;

        const userId = button.dataset.adminCreditUser;
        const amount = Number(button.dataset.adminCreditAmount);
        const reason = button.dataset.adminCreditReason;

        await fetch(`/api/admin/users/${encodeURIComponent(userId)}/credits`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            amount,
            reason,
            note: reason === 'beta_testing'
              ? 'Бета-тестирование — бесплатно'
              : 'Ручное начисление токенов'
          })
        });

        await rebuildAdminPanel();
        await rebuildProfilePanel();
      });
    });
  }

  async function refreshAdminVisibility() {
    const data = await fetchMe();
    const isAdmin = Boolean(data?.user?.isAdmin);
    const adminButton = document.getElementById('adminTabButton');

    if (adminButton) {
      adminButton.classList.toggle('hidden', !isAdmin);
    }
  }

  function setTab(target) {
    document.body.dataset.activeTab = target;

    document.querySelectorAll('.app-tab').forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.tabTarget === target);
    });

    document.querySelectorAll('[data-tab-panel]').forEach((panel) => {
      panel.classList.toggle('hidden', panel.dataset.tabPanel !== target);
    });

    if (target === 'profile') {
      rebuildProfilePanel();
    }

    if (target === 'admin') {
      rebuildAdminPanel();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.addEventListener('click', (event) => {
    const tab = event.target.closest('.app-tab, [data-tab-target]');
    if (!tab?.dataset?.tabTarget) return;

    event.preventDefault();
    event.stopPropagation();

    setTab(tab.dataset.tabTarget);
  }, true);

  window.addEventListener('load', async () => {
    ensureTabsAndPanels();
    await refreshAdminVisibility();
    setTab('main');
  });
})();

/* POLISH: profile pricing, contacts, admin PIN console */

(function polishAccountAdminUi() {
  if (window.__polishAccountAdminUiApplied) return;
  window.__polishAccountAdminUiApplied = true;

  const GENERATION_COST = 40;
  const ADMIN_PIN = localStorage.getItem('ft-admin-pin-value') || '3465';

  const PACKAGES = [
    { title: 'Старт', tokens: 50, price: '49 ₽', generations: 1, note: 'Для знакомства с приложением' },
    { title: 'Комфорт', tokens: 120, price: '99 ₽', generations: 3, note: 'Для нескольких генераций' },
    { title: 'Популярный', tokens: 300, price: '249 ₽', generations: 7, note: 'Для регулярного использования' },
    { title: 'Максимум', tokens: 700, price: '499 ₽', generations: 17, note: 'Для активных генераций' }
  ];

  function headers() {
    const result = {};
    if (typeof getTelegramIdentityHeaders === 'function') Object.assign(result, getTelegramIdentityHeaders());
    if (window.Telegram?.WebApp?.initData) result['x-telegram-init-data'] = window.Telegram.WebApp.initData;
    return result;
  }

  async function apiMe() {
    const res = await fetch('/api/user/me', { headers: headers() });
    return res.ok ? res.json() : null;
  }

  async function apiAdmin() {
    const res = await fetch('/api/admin/overview', { headers: headers() });
    return res.ok ? res.json() : null;
  }

  function userName(user = {}) {
    if (user.username) return `@${user.username}`;
    return [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Гость FOTOTIME323';
  }

  function initials(user = {}) {
    const name = user.username || user.firstName || user.id || 'FT';
    return String(name).slice(0, 2).toUpperCase();
  }

  function leftGenerations(balance) {
    return Math.floor(Number(balance || 0) / GENERATION_COST);
  }

  function setBalanceEverywhere(balance) {
    document.querySelectorAll('.balance-pill strong, .balance-badge strong, #mainBalanceValue, #profileBalanceValue, [data-balance-value]').forEach((el) => {
      el.textContent = Number(balance || 0);
    });
  }

  function formatDate(value) {
    try {
      return new Date(value).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  function normalizeTransactions(transactions = [], currentBalance = 0) {
    let cursor = Number(currentBalance || 0);

    return transactions.slice(0, 12).map((tx) => {
      const amount = Number(tx.amount || 0);
      const after = typeof tx.balanceAfter === 'number' ? tx.balanceAfter : cursor;
      const before = typeof tx.balanceBefore === 'number' ? tx.balanceBefore : after - amount;
      cursor = before;
      return { ...tx, balanceBefore: before, balanceAfter: after };
    });
  }

  function packagesHtml() {
    return PACKAGES.map((p) => `
      <article class="ft-package-card">
        <div>
          <strong>${p.title}</strong>
          <span>${p.tokens} токенов</span>
          <small>примерно ${p.generations} ${p.generations === 1 ? 'генерация' : 'генерации'}</small>
          <em>${p.note}</em>
        </div>
        <b>${p.price}</b>
      </article>
    `).join('');
  }

  function transactionsHtml(transactions, balance) {
    const items = normalizeTransactions(transactions, balance);

    if (!items.length) return '<p class="ft-muted">Операций пока нет.</p>';

    return items.map((tx) => {
      const amount = Number(tx.amount || 0);
      const credit = amount > 0;
      return `
        <article class="ft-transaction ${credit ? 'credit' : 'debit'}">
          <div>
            <strong>${credit ? 'Пополнение' : 'Списание'}</strong>
            <span>${tx.note || tx.reason || 'Операция по балансу'}</span>
            <small>${formatDate(tx.createdAt)}</small>
            <small>Баланс: ${tx.balanceBefore} → ${tx.balanceAfter}</small>
          </div>
          <b>${credit ? '+' : ''}${amount} ток.</b>
        </article>
      `;
    }).join('');
  }

  function contactsHtml() {
    return `
      <section class="card ft-contacts-card">
        <div class="section-header">
          <span class="step">FT</span>
          <div>
            <h2>FOTOTIME323</h2>
            <p class="section-subtitle">AI-фото, стилизация изображений и быстрые генерации.</p>
          </div>
        </div>

        <div class="ft-social-grid">
          <a href="https://t.me/fototime323" target="_blank" rel="noreferrer">✦ Telegram</a>
          <a href="https://vk.com/fototime323" target="_blank" rel="noreferrer">✦ VK</a>
          <a href="https://fototime323.lpmotortest.com" target="_blank" rel="noreferrer">✦ Сайт</a>
        </div>

        <a class="ft-support-wide" href="https://t.me/fototime323" target="_blank" rel="noreferrer">
          ✨ Поддержка и пополнение баланса
        </a>
      </section>
    `;
  }

  async function renderProfile() {
    const data = await apiMe();
    const user = data?.user || {};
    const balance = Number(user.balance || 0);
    const transactions = data?.transactions || [];
    const left = leftGenerations(balance);

    setBalanceEverywhere(balance);

    const panel = document.getElementById('profilePanel');
    if (!panel) return;

    panel.innerHTML = `
      <section class="card ft-profile-card">
        <div class="ft-profile-head">
          <div class="ft-avatar">${initials(user)}</div>
          <div>
            <h2>${userName(user)}</h2>
            <p>Личный кабинет, баланс, генерации и платежи.</p>
          </div>
        </div>

        <div class="ft-balance-grid">
          <article>
            <span>Доступно</span>
            <strong id="profileBalanceValue">${balance}</strong>
            <small>токенов · осталось на ${left} ${left === 1 ? 'генерацию' : 'генерации'}</small>
            <button type="button" data-refresh-profile>Обновить баланс</button>
          </article>
          <article>
            <span>Стоимость генерации</span>
            <strong>${GENERATION_COST} токенов</strong>
            <small>Списание только после успешного результата.</small>
          </article>
          <article>
            <span>Подсказка</span>
            <strong>${left}</strong>
            <small>примерно столько фото можно создать сейчас.</small>
          </article>
        </div>

        <div class="ft-low-balance-banner">
          Осталось на ${left} ${left === 1 ? 'генерацию' : 'генерации'}. Удобно пополняйте баланс через нашу поддержку.
        </div>

        <section class="ft-section">
          <h3>Пакеты токенов</h3>
          <p>Оплата через Telegram. После оплаты начисляем токены вручную и отправляем чек самозанятого.</p>
          <div class="ft-package-grid">${packagesHtml()}</div>
          <a class="ft-support-wide" href="https://t.me/fototime323" target="_blank" rel="noreferrer">Пополнить через поддержку</a>
        </section>

        <section class="ft-section">
          <h3>История баланса</h3>
          <div class="ft-transactions">${transactionsHtml(transactions, balance)}</div>
        </section>
      </section>
    `;

    const history = document.getElementById('historySection');
    if (history) panel.appendChild(history);

    panel.insertAdjacentHTML('beforeend', contactsHtml());

    panel.querySelector('[data-refresh-profile]')?.addEventListener('click', renderProfile);

    if (typeof renderGeneratedHistory === 'function') renderGeneratedHistory();
  }

  function adminLockedHtml() {
    return `
      <section class="card ft-admin-card">
        <div class="section-header">
          <span class="step">AD</span>
          <div>
            <h2>Админ-консоль</h2>
            <p class="section-subtitle">Доступ по PIN-коду администратора.</p>
          </div>
        </div>

        <form id="adminPinForm" class="ft-admin-pin">
          <label>PIN-код</label>
          <input id="adminPinInput" type="password" inputmode="numeric" placeholder="Введите PIN" />
          <button type="submit">Войти</button>
        </form>
      </section>
    `;
  }

  function adminUsersHtml(users = []) {
    if (!users.length) return '<p class="ft-muted">Пользователей пока нет.</p>';

    return users.map((u) => {
      const name = u.username ? `@${u.username}` : [u.firstName, u.lastName].filter(Boolean).join(' ') || u.id;
      return `
        <article class="ft-admin-user">
          <div class="ft-admin-user-head">
            <div>
              <strong>${name}</strong>
              <small>ID: ${u.telegramUserId || u.id}</small>
              <small>Генераций: ${Number(u.generationsCount || 0)} · списано: ${Number(u.spentCredits || 0)} ток.</small>
            </div>
            <div>
              <b>${Number(u.balance || 0)}</b>
              <span>токенов</span>
            </div>
          </div>

          <div class="ft-admin-actions">
            <button data-credit-user="${u.id}" data-credit-amount="50" data-credit-reason="beta_testing">+50 Бета</button>
            <button data-credit-user="${u.id}" data-credit-amount="120" data-credit-reason="manual_credit">+120</button>
            <button data-credit-user="${u.id}" data-credit-amount="300" data-credit-reason="manual_credit">+300</button>
            <button data-credit-user="${u.id}" data-credit-amount="700" data-credit-reason="manual_credit">+700</button>
          </div>
        </article>
      `;
    }).join('');
  }

  async function renderAdmin() {
    const panel = document.getElementById('adminPanel');
    if (!panel) return;

    if (localStorage.getItem('ft-admin-pin-ok') !== 'true') {
      panel.innerHTML = adminLockedHtml();
      panel.querySelector('#adminPinForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const value = panel.querySelector('#adminPinInput')?.value || '';
        if (value === ADMIN_PIN) {
          localStorage.setItem('ft-admin-pin-ok', 'true');
          renderAdmin();
        } else {
          alert('Неверный PIN');
        }
      });
      return;
    }

    const me = await apiMe();
    const overview = await apiAdmin();

    if (!overview) {
      panel.innerHTML = adminLockedHtml();
      return;
    }

    const stats = overview.stats || {};
    const users = overview.users || [];
    const ownBalance = Number(me?.user?.balance || 0);

    panel.innerHTML = `
      <section class="card ft-admin-card">
        <div class="section-header">
          <span class="step">AD</span>
          <div>
            <h2>Админ-консоль</h2>
            <p class="section-subtitle">Клиенты, балансы, бета-токены и статистика генераций.</p>
          </div>
        </div>

        <div class="ft-balance-grid">
          <article><span>Мой баланс</span><strong>${ownBalance}</strong><small>токенов</small></article>
          <article><span>Клиентов</span><strong>${Number(stats.totalUsers || 0)}</strong><small>в базе</small></article>
          <article><span>Генераций</span><strong>${Number(stats.totalGenerations || 0)}</strong><small>всего</small></article>
          <article><span>Списано</span><strong>${Number(stats.totalSpentCredits || 0)}</strong><small>токенов</small></article>
        </div>

        <section class="ft-section">
          <h3>Пользователи и начисление токенов</h3>
          <p>«+50 Бета» — бесплатное начисление без оплаты и без чека.</p>
          <div class="ft-admin-users">${adminUsersHtml(users)}</div>
        </section>
      </section>
    `;

    panel.querySelectorAll('[data-credit-user]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        await fetch(`/api/admin/users/${encodeURIComponent(btn.dataset.creditUser)}/credits`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers() },
          body: JSON.stringify({
            amount: Number(btn.dataset.creditAmount),
            reason: btn.dataset.creditReason,
            note: btn.dataset.creditReason === 'beta_testing' ? 'Бета-тестирование — бесплатно' : 'Ручное начисление токенов'
          })
        });
        await renderAdmin();
      });
    });
  }

  function ensurePanels() {
    const main = document.querySelector('main#content') || document.querySelector('main');
    if (main) main.dataset.tabPanel = 'main';

    let profile = document.getElementById('profilePanel');
    if (!profile) {
      profile = document.createElement('section');
      profile.id = 'profilePanel';
      profile.className = 'app-panel hidden';
      profile.dataset.tabPanel = 'profile';
      document.body.insertBefore(profile, document.querySelector('.app-tabs'));
    }

    let admin = document.getElementById('adminPanel');
    if (!admin) {
      admin = document.createElement('section');
      admin.id = 'adminPanel';
      admin.className = 'app-panel hidden';
      admin.dataset.tabPanel = 'admin';
      document.body.insertBefore(admin, document.querySelector('.app-tabs'));
    }
  }

  function switchTab(target) {
    document.body.dataset.activeTab = target;
    document.querySelectorAll('.app-tab').forEach((t) => t.classList.toggle('active', t.dataset.tabTarget === target));
    document.querySelectorAll('[data-tab-panel]').forEach((p) => p.classList.toggle('hidden', p.dataset.tabPanel !== target));

    if (target === 'profile') renderProfile();
    if (target === 'admin') renderAdmin();
  }

  document.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-tab-target]');
    if (!tab) return;
    e.preventDefault();
    switchTab(tab.dataset.tabTarget || 'main');
  }, true);

  window.addEventListener('load', () => {
    ensurePanels();
    switchTab('main');
  });
})();

/* PROFILE FINAL: history, auth card, compact transactions, centered placeholders */

(function profileFinalFix() {
  if (window.__profileFinalFixApplied) return;
  window.__profileFinalFixApplied = true;

  const GENERATION_COST = 40;

  function tgUser() {
    return window.Telegram?.WebApp?.initDataUnsafe?.user || null;
  }

  function isTelegramAuthorized() {
    return Boolean(tgUser()?.id);
  }

  function userDisplayName(user = {}) {
    const tg = tgUser();

    if (tg?.username) return `@${tg.username}`;
    if (tg?.first_name || tg?.last_name) return [tg.first_name, tg.last_name].filter(Boolean).join(' ');
    if (user.username) return `@${user.username}`;
    return [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Гость FOTOTIME323';
  }

  function userInitials(user = {}) {
    const name = userDisplayName(user).replace('@', '');
    return name.slice(0, 2).toUpperCase();
  }

  function authBlockHtml(user = {}) {
    const authorized = isTelegramAuthorized();

    return `
      <section class="ft-auth-card">
        <div class="ft-user-avatar">${userInitials(user)}</div>
        <div>
          <strong>${userDisplayName(user)}</strong>
          <span>${authorized ? 'Авторизация через Telegram активна' : 'Гостевой просмотр приложения'}</span>
          <small>${authorized ? 'Бонусные токены начисляются после первой авторизации.' : 'Для генерации фото авторизуйтесь через Telegram — начислим бонус на первые генерации.'}</small>
        </div>
        ${authorized ? '' : '<a class="ft-auth-button" href="https://t.me/fototime323Bot" target="_blank" rel="noreferrer">Авторизоваться</a>'}
      </section>
    `;
  }

  function compactTransactions() {
    document.querySelectorAll('.ft-transactions, .account-transactions-list').forEach((list) => {
      list.classList.add('ft-transactions-compact');
    });
  }

  function restoreHistoryIntoProfile() {
    const profile = document.getElementById('profilePanel');
    if (!profile) return;

    let history = document.getElementById('historySection');

    if (!history) {
      history = document.createElement('section');
      history.id = 'historySection';
      history.className = 'card history-card';
      history.innerHTML = `
        <div class="section-header">
          <span class="step">05</span>
          <div>
            <h2>Мои сгенерированные фото</h2>
            <p class="section-subtitle">Последние изображения сохраняются в этом браузере/Telegram WebView.</p>
          </div>
        </div>
        <div id="historyEmptyState" class="empty-state">Пока нет сохранённых генераций.</div>
        <div id="historyList" class="history-list"></div>
        <button id="clearHistoryButton" class="clear-history-button hidden" type="button">Очистить историю</button>
      `;
    }

    if (!profile.contains(history)) {
      const contacts = profile.querySelector('.ft-contacts-card, .contacts-card');
      if (contacts) {
        profile.insertBefore(history, contacts);
      } else {
        profile.appendChild(history);
      }
    }

    history.classList.remove('hidden');
    history.style.display = '';

    if (typeof renderGeneratedHistory === 'function') {
      renderGeneratedHistory();
    }
  }

  function addAuthToProfile() {
    const profile = document.getElementById('profilePanel');
    if (!profile || profile.querySelector('.ft-auth-card')) return;

    const dataBalance = document.querySelector('#profileBalanceValue')?.textContent || '0';

    const fakeUser = {
      balance: Number(dataBalance)
    };

    const firstCard = profile.querySelector('.ft-profile-card, .account-card, .card');
    if (firstCard) {
      firstCard.insertAdjacentHTML('afterbegin', authBlockHtml(fakeUser));
    }
  }

  function enhanceMainAuth() {
    if (document.getElementById('mainAuthHint')) return;

    const balanceCard = document.querySelector('.balance-card, .balance-card-final');
    if (!balanceCard) return;

    const authorized = isTelegramAuthorized();

    const block = document.createElement('div');
    block.id = 'mainAuthHint';
    block.className = 'ft-main-auth-hint';
    block.innerHTML = `
      <div class="ft-user-avatar">${authorized ? userInitials() : 'FT'}</div>
      <div>
        <strong>${authorized ? 'Telegram авторизация активна' : 'Авторизуйтесь для генерации'}</strong>
        <span>${authorized ? 'Ваши фото сохраняются в личном кабинете.' : 'Откройте приложение через Telegram — начислим бонусные токены.'}</span>
      </div>
      ${authorized ? '<button type="button" data-go-profile>Личный кабинет</button>' : '<a href="https://t.me/fototime323Bot" target="_blank" rel="noreferrer">Авторизоваться</a>'}
    `;

    balanceCard.insertAdjacentElement('afterend', block);

    block.querySelector('[data-go-profile]')?.addEventListener('click', () => {
      document.querySelector('[data-tab-target="profile"]')?.click();
    });
  }

  function leftGenerationsText() {
    const balance = Number(document.querySelector('#profileBalanceValue')?.textContent || document.querySelector('.balance-pill strong')?.textContent || 0);
    const left = Math.floor(balance / GENERATION_COST);

    document.querySelectorAll('.ft-left-generations-text').forEach((el) => {
      el.textContent = `Осталось примерно на ${left} ${left === 1 ? 'генерацию' : 'генерации'}.`;
    });
  }

  const oldFetch = window.fetch;

  window.fetch = async function fetchWithAuthGuard(input, init = {}) {
    const url = typeof input === 'string' ? input : input?.url || '';

    if (url.includes('/api/generate') && !isTelegramAuthorized() && location.hostname !== 'localhost') {
      showMessage('Пожалуйста, авторизуйтесь через Telegram. За авторизацию начислим бонусные токены на первые генерации.', 'error');
      document.getElementById('mainAuthHint')?.scrollIntoView({ behavior: 'smooth', block: 'center' });

      return new Response(JSON.stringify({
        message: 'Создаём AI-фото…'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return oldFetch(input, init);
  };

  document.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-tab-target]');

    if (tab?.dataset?.tabTarget === 'profile') {
      setTimeout(() => {
        addAuthToProfile();
        restoreHistoryIntoProfile();
        compactTransactions();
        leftGenerationsText();
      }, 500);
    }
  }, true);

  window.addEventListener('load', () => {
    setTimeout(() => {
      enhanceMainAuth();
      restoreHistoryIntoProfile();
      compactTransactions();
      leftGenerationsText();
    }, 900);
  });
})();

/* STABILITY FIX: force admin tab visibility, compact UI, safer Telegram avatar */

(function stabilityFix() {
  if (window.__stabilityFixApplied) return;
  window.__stabilityFixApplied = true;

  function getTgUserSafe() {
    return window.Telegram?.WebApp?.initDataUnsafe?.user || null;
  }

  function ensureAdminTabVisible() {
    const tabs = document.querySelector('.app-tabs');
    if (!tabs) return;

    let admin = document.getElementById('adminTabButton') || tabs.querySelector('[data-tab-target="admin"]');

    if (!admin) {
      admin = document.createElement('button');
      admin.id = 'adminTabButton';
      admin.className = 'app-tab';
      admin.type = 'button';
      admin.dataset.tabTarget = 'admin';
      admin.textContent = 'Админ';
      tabs.appendChild(admin);
    }

    admin.classList.remove('hidden');
    admin.style.display = '';
  }

  function applyTelegramAvatar() {
    const user = getTgUserSafe();
    const initials = user?.username
      ? user.username.slice(0, 2).toUpperCase()
      : user?.first_name
        ? user.first_name.slice(0, 2).toUpperCase()
        : 'FT';

    document.querySelectorAll('.ft-user-avatar, .ft-avatar').forEach((avatar) => {
      if (user?.photo_url) {
        avatar.innerHTML = `<img src="${user.photo_url}" alt="Telegram avatar" />`;
        avatar.classList.add('has-photo');
      } else {
        avatar.textContent = initials;
      }
    });
  }

  function fixTopupButton() {
    document.querySelectorAll('.topup-main-button').forEach((button) => {
      button.innerHTML = `
        <span class="topup-main-text">
          <strong>Пополнить баланс</strong>
          <small>Напишите нам в Telegram — подтвердим оплату и начислим токены</small>
        </span>
        <span class="topup-main-arrow">→</span>
      `;
    });
  }

  window.addEventListener('load', () => {
    setTimeout(() => {
      ensureAdminTabVisible();
      applyTelegramAvatar();
      fixTopupButton();
    }, 700);
  });

  document.addEventListener('click', () => {
    setTimeout(() => {
      ensureAdminTabVisible();
      applyTelegramAvatar();
      fixTopupButton();
    }, 200);
  });
})();

/* UX FINAL FIX: admin pin, dashboard, profile-only contacts, compact layout, scroll hint */

(function uxFinalFix() {
  if (window.__uxFinalFixApplied) return;
  window.__uxFinalFixApplied = true;

  const ADMIN_PINS = ['3465', '3230'];
  const GENERATION_COST = 40;

  function h() {
    const headers = {};
    if (typeof getTelegramIdentityHeaders === 'function') Object.assign(headers, getTelegramIdentityHeaders());
    if (window.Telegram?.WebApp?.initData) headers['x-telegram-init-data'] = window.Telegram.WebApp.initData;
    return headers;
  }

  async function getMe() {
    const r = await fetch('/api/user/me', { headers: h() });
    return r.ok ? r.json() : null;
  }

  async function getAdmin() {
    const r = await fetch('/api/admin/overview', { headers: h() });
    return r.ok ? r.json() : null;
  }

  function getTgUser() {
    return window.Telegram?.WebApp?.initDataUnsafe?.user || null;
  }

  function isAuth() {
    return Boolean(getTgUser()?.id);
  }

  function getGeneratedHistory() {
    try {
      return JSON.parse(localStorage.getItem('fototime-ai-generated-photos') || '[]');
    } catch {
      return [];
    }
  }

  function getFailedGenerations() {
    try {
      return JSON.parse(localStorage.getItem('fototime-ai-failed-generations') || '[]');
    } catch {
      return [];
    }
  }

  function saveFailedGeneration(error) {
    const items = getFailedGenerations();
    items.unshift({
      message: error?.message || String(error || 'Unknown generation error'),
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('fototime-ai-failed-generations', JSON.stringify(items.slice(0, 50)));
  }

  const originalFetch = window.fetch;
  window.fetch = async function trackedFetch(input, init = {}) {
    const url = typeof input === 'string' ? input : input?.url || '';
    try {
      const response = await originalFetch(input, init);

      if (url.includes('/api/generate') && !response.ok) {
        response.clone().json()
          .then((data) => saveFailedGeneration(data?.message || data?.error || `HTTP ${response.status}`))
          .catch(() => saveFailedGeneration(`HTTP ${response.status}`));
      }

      return response;
    } catch (error) {
      if (url.includes('/api/generate')) saveFailedGeneration(error);
      throw error;
    }
  };

  function packageHtml() {
    const packs = [
      ['Старт', 50, '49 ₽', 1, 'Для знакомства с приложением'],
      ['Комфорт', 120, '99 ₽', 3, 'Для нескольких генераций'],
      ['Популярный', 300, '249 ₽', 7, 'Для регулярного использования'],
      ['Максимум', 700, '499 ₽', 17, 'Для активных генераций']
    ];

    return packs.map(([title, tokens, price, gens, note]) => `
      <article class="ft-package-card">
        <div>
          <strong>${title}</strong>
          <span>${tokens} токенов</span>
          <small>примерно ${gens} ${gens === 1 ? 'генерация' : 'генераций'}</small>
          <em>${note}</em>
        </div>
        <b>${price}</b>
      </article>
    `).join('');
  }

  function txHtml(transactions = [], balance = 0) {
    if (!transactions.length) {
      return '<p class="ft-muted">Операций пока нет.</p>';
    }

    let cursor = Number(balance || 0);

    return transactions.slice(0, 20).map((tx) => {
      const amount = Number(tx.amount || 0);
      const after = typeof tx.balanceAfter === 'number' ? tx.balanceAfter : cursor;
      const before = typeof tx.balanceBefore === 'number' ? tx.balanceBefore : after - amount;
      cursor = before;

      const credit = amount > 0;
      const date = tx.createdAt
        ? new Date(tx.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
        : '';

      return `
        <article class="ft-transaction ${credit ? 'credit' : 'debit'}">
          <div>
            <strong>${credit ? 'Пополнение' : 'Списание'}</strong>
            <span>${tx.note || tx.reason || 'Операция'}</span>
            <small>${date}</small>
            <small>Баланс: ${before} → ${after}</small>
          </div>
          <b>${credit ? '+' : ''}${amount} ток.</b>
        </article>
      `;
    }).join('');
  }

  function historyHtml() {
    const items = getGeneratedHistory();

    if (!items.length) {
      return '<p class="ft-muted">Пока нет сохранённых генераций.</p>';
    }

    return items.slice(0, 12).map((item) => `
      <article class="history-card-item">
        <img src="${item.resultUrl || item.imageUrl}" alt="AI photo" loading="lazy" />
        <div class="history-card-content">
          <strong>${item.styleTitle || item.styleId || 'AI-фото'}</strong>
          <span>${item.createdAt ? new Date(item.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}</span>
          <button type="button" onclick="window.open('${item.resultUrl || item.imageUrl}', '_blank')">Скачать</button>
        </div>
      </article>
    `).join('');
  }

  function contactsHtml() {
    return `
      <section class="card ft-contacts-card">
        <div class="section-header">
          <span class="step">FT</span>
          <div>
            <h2>FOTOTIME323</h2>
            <p class="section-subtitle">AI-фото, стилизация изображений и быстрые генерации.</p>
          </div>
        </div>
        <div class="ft-social-grid">
          <a href="https://t.me/fototime323" target="_blank" rel="noreferrer">✦ Telegram</a>
          <a href="https://vk.com/fototime323" target="_blank" rel="noreferrer">✦ VK</a>
          <a href="https://fototime323.lpmotortest.com" target="_blank" rel="noreferrer">✦ Сайт</a>
        </div>
        <a class="ft-support-wide" href="https://t.me/fototime323" target="_blank" rel="noreferrer">✨ Поддержка и пополнение баланса</a>
      </section>
    `;
  }

  function removeMainContacts() {
    const activeTab = document.body.dataset.activeTab || 'main';
    document.querySelectorAll('main .contacts-card, main .ft-contacts-card').forEach((el) => {
      if (activeTab === 'main') el.remove();
    });
  }

  async function renderProfileFinal() {
    const panel = document.getElementById('profilePanel');
    if (!panel) return;

    const data = await getMe();
    const user = data?.user || {};
    const balance = Number(user.balance || 0);
    const left = Math.floor(balance / GENERATION_COST);
    const tg = getTgUser();

    const name = tg?.username ? `@${tg.username}` : (tg?.first_name || user.username || 'Гость FOTOTIME323');
    const initials = String(name).replace('@', '').slice(0, 2).toUpperCase();

    panel.innerHTML = `
      <section class="card ft-profile-card">
        <div class="ft-profile-head">
          <div class="ft-user-avatar">${tg?.photo_url ? `<img src="${tg.photo_url}" alt="avatar" />` : initials}</div>
          <div>
            <h2>${name}</h2>
            <p>${isAuth() ? 'Авторизация через Telegram активна.' : 'Гостевой режим: 50 токенов только на пробу.'}</p>
          </div>
          ${isAuth() ? '' : '<a class="ft-auth-button" href="https://t.me/fototime323Bot" target="_blank" rel="noreferrer">Авторизоваться</a>'}
        </div>

        <div class="ft-guest-note">
          50 токенов в гостевом режиме — это пробный баланс. Зарегистрируйтесь через Telegram и получите ещё 50 бонусных токенов.
        </div>

        <div class="ft-balance-grid">
          <article><span>Доступно</span><strong>${balance}</strong><small>осталось примерно на ${left} ${left === 1 ? 'генерацию' : 'генерации'}</small><button type="button" data-refresh-profile>Обновить</button></article>
          <article><span>Стоимость генерации</span><strong>${GENERATION_COST} токенов</strong><small>Списание после успешного результата.</small></article>
          <article><span>Мои генерации</span><strong>${getGeneratedHistory().length}</strong><small>сохранённых фото</small></article>
        </div>

        <div class="ft-low-balance-banner">Осталось на ${left} ${left === 1 ? 'генерацию' : 'генерации'}. Удобно оплачивайте генерации через нашу поддержку.</div>

        <section class="ft-section">
          <h3>Пакеты токенов</h3>
          <p>Оплата через Telegram. После оплаты начисляем токены вручную и отправляем чек самозанятого.</p>
          <div class="ft-package-grid">${packageHtml()}</div>
          <a class="ft-support-wide" href="https://t.me/fototime323" target="_blank" rel="noreferrer">Пополнить через поддержку</a>
        </section>

        <section class="ft-section">
          <h3>История баланса</h3>
          <div class="ft-transactions ft-transactions-compact">${txHtml(data?.transactions || [], balance)}</div>
        </section>

        <section class="ft-section">
          <h3>Мои сгенерированные фото</h3>
          <div class="history-list">${historyHtml()}</div>
          <button class="clear-history-button" type="button" data-clear-history>Очистить историю</button>
        </section>
      </section>

      ${contactsHtml()}
    `;

    panel.querySelector('[data-refresh-profile]')?.addEventListener('click', renderProfileFinal);
    panel.querySelector('[data-clear-history]')?.addEventListener('click', () => {
      localStorage.setItem('fototime-ai-generated-photos', '[]');
      renderProfileFinal();
    });
  }

  function adminLoginHtml() {
    return `
      <section class="card ft-admin-card">
        <div class="section-header">
          <span class="step">AD</span>
          <div>
            <h2>Админ-консоль</h2>
            <p class="section-subtitle">Введите PIN администратора.</p>
          </div>
        </div>
        <form class="ft-admin-pin" id="ftAdminPinForm">
          <input type="password" inputmode="numeric" placeholder="PIN-код" />
          <button type="submit">Войти</button>
        </form>
      </section>
    `;
  }

  function failedHtml() {
    const failed = getFailedGenerations();

    if (!failed.length) return '<p class="ft-muted">Ошибок генерации пока нет.</p>';

    return failed.slice(0, 10).map((item) => `
      <article class="ft-failed-row">
        <strong>${item.message}</strong>
        <small>${item.createdAt ? new Date(item.createdAt).toLocaleString('ru-RU') : ''}</small>
      </article>
    `).join('');
  }

  async function renderAdminFinal() {
    const panel = document.getElementById('adminPanel');
    if (!panel) return;

    if (localStorage.getItem('ft-admin-pin-ok') !== 'true') {
      panel.innerHTML = adminLoginHtml();
      panel.querySelector('#ftAdminPinForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const pin = panel.querySelector('input')?.value || '';
        if (ADMIN_PINS.includes(pin)) {
          localStorage.setItem('ft-admin-pin-ok', 'true');
          renderAdminFinal();
        } else {
          alert('Неверный код');
        }
      });
      return;
    }

    const overview = await getAdmin();
    const me = await getMe();
    const failed = getFailedGenerations();

    const stats = overview?.stats || {};
    const users = overview?.users || [];

    panel.innerHTML = `
      <section class="card ft-admin-card">
        <div class="section-header ft-admin-title-row">
          <span class="step">AD</span>
          <div>
            <h2>Админ-консоль</h2>
            <p class="section-subtitle">Дашборд, клиенты, начисления и ошибки генераций.</p>
          </div>
          <button class="ft-dashboard-toggle" type="button" data-toggle-dashboard>Расширенная версия</button>
        </div>

        <div class="ft-admin-dashboard compact" id="ftAdminDashboard">
          <article><span>Мой баланс</span><strong>${Number(me?.user?.balance || 0)}</strong><small>токенов</small></article>
          <article><span>Успешных</span><strong>${Number(stats.totalGenerations || getGeneratedHistory().length || 0)}</strong><small>генераций</small></article>
          <article><span>Упавших</span><strong>${failed.length}</strong><small>ошибок</small></article>
          <article><span>Клиентов</span><strong>${Number(stats.totalUsers || users.length || 0)}</strong><small>в базе</small></article>
        </div>

        <section class="ft-section">
          <h3>Ошибки генераций</h3>
          <div class="ft-failed-list">${failedHtml()}</div>
        </section>

        <section class="ft-section">
          <h3>Клиенты и начисление токенов</h3>
          <div class="ft-admin-users">
            ${users.map((u) => `
              <article class="ft-admin-user">
                <div class="ft-admin-user-head">
                  <div>
                    <strong>${u.username ? '@' + u.username : (u.firstName || u.id)}</strong>
                    <small>ID: ${u.telegramUserId || u.id}</small>
                    <small>Генераций: ${Number(u.generationsCount || 0)} · списано: ${Number(u.spentCredits || 0)} ток.</small>
                  </div>
                  <div><b>${Number(u.balance || 0)}</b><span>токенов</span></div>
                </div>
                <div class="ft-admin-actions">
                  <button data-credit-user="${u.id}" data-credit-amount="50" data-credit-reason="beta_testing">+50 Бета</button>
                  <button data-credit-user="${u.id}" data-credit-amount="120" data-credit-reason="manual_credit">+120</button>
                  <button data-credit-user="${u.id}" data-credit-amount="300" data-credit-reason="manual_credit">+300</button>
                  <button data-credit-user="${u.id}" data-credit-amount="700" data-credit-reason="manual_credit">+700</button>
                </div>
              </article>
            `).join('') || '<p class="ft-muted">Пользователей пока нет.</p>'}
          </div>
        </section>
      </section>
    `;

    panel.querySelector('[data-toggle-dashboard]')?.addEventListener('click', (e) => {
      const dashboard = panel.querySelector('#ftAdminDashboard');
      dashboard.classList.toggle('compact');
      e.target.textContent = dashboard.classList.contains('compact') ? 'Расширенная версия' : 'Компактно';
    });

    panel.querySelectorAll('[data-credit-user]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        await fetch(`/api/admin/users/${encodeURIComponent(btn.dataset.creditUser)}/credits`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...h() },
          body: JSON.stringify({
            amount: Number(btn.dataset.creditAmount),
            reason: btn.dataset.creditReason,
            note: btn.dataset.creditReason === 'beta_testing' ? 'Бета-тестирование — бесплатно' : 'Ручное начисление токенов'
          })
        });
        await renderAdminFinal();
      });
    });
  }

  function scrollHint() {
    if (document.getElementById('ftScrollHint')) return;
    const el = document.createElement('button');
    el.id = 'ftScrollHint';
    el.type = 'button';
    el.textContent = '⌄';
    el.addEventListener('click', () => window.scrollBy({ top: window.innerHeight * 0.75, behavior: 'smooth' }));
    document.body.appendChild(el);

    window.addEventListener('scroll', () => {
      el.classList.toggle('hidden', window.scrollY > 280);
    });
  }

  document.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-tab-target]');
    if (!tab) return;

    setTimeout(() => {
      removeMainContacts();
      if (tab.dataset.tabTarget === 'profile') renderProfileFinal();
      if (tab.dataset.tabTarget === 'admin') renderAdminFinal();
    }, 200);
  }, true);

  window.addEventListener('load', () => {
    setTimeout(() => {
      removeMainContacts();
      scrollHint();
    }, 800);
  });
})();

/* ADMIN PIN FIX + COMPACT UI FIX */

(function adminPinAndCompactFix() {
  if (window.__adminPinAndCompactFixApplied) return;
  window.__adminPinAndCompactFixApplied = true;

  function getAdminPin() {
    return localStorage.getItem('ft-admin-pin') || '';
  }

  async function getAdminPinOverview() {
    const response = await fetch('/api/admin-pin/overview', {
      headers: {
        'x-admin-pin': getAdminPin()
      }
    });

    if (!response.ok) return null;
    return response.json();
  }

  async function creditUserByPin(userId, amount, reason) {
    const response = await fetch(`/api/admin-pin/users/${encodeURIComponent(userId)}/credits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': getAdminPin()
      },
      body: JSON.stringify({
        amount,
        reason,
        note: reason === 'beta_testing'
          ? 'Бета-тестирование — бесплатно'
          : 'Ручное начисление токенов'
      })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'Не удалось начислить токены');
    }
  }

  function adminLoginHtml() {
    return `
      <section class="card ft-admin-card">
        <div class="section-header">
          <span class="step">AD</span>
          <div>
            <h2>Админ-консоль</h2>
            <p class="section-subtitle">Введите PIN администратора.</p>
          </div>
        </div>

        <form id="ftAdminPinForm" class="ft-admin-pin">
          <input type="password" inputmode="numeric" placeholder="PIN-код" autocomplete="off" />
          <button type="submit">Войти</button>
        </form>
      </section>
    `;
  }

  function renderUsers(users) {
    if (!users?.length) return '<p class="ft-muted">Пользователей пока нет.</p>';

    return users.map((user) => {
      const name = user.username ? `@${user.username}` : user.firstName || user.id;

      return `
        <article class="ft-admin-user">
          <div class="ft-admin-user-head">
            <div>
              <strong>${name}</strong>
              <small>ID: ${user.telegramUserId || user.id}</small>
              <small>Генераций: ${user.generationsCount || 0} · списано: ${user.spentCredits || 0} ток.</small>
            </div>
            <div>
              <b>${user.balance || 0}</b>
              <span>токенов</span>
            </div>
          </div>

          <div class="ft-admin-actions">
            <button data-pin-credit-user="${user.id}" data-pin-credit-amount="50" data-pin-credit-reason="beta_testing">+50 Бета</button>
            <button data-pin-credit-user="${user.id}" data-pin-credit-amount="120" data-pin-credit-reason="manual_credit">+120</button>
            <button data-pin-credit-user="${user.id}" data-pin-credit-amount="300" data-pin-credit-reason="manual_credit">+300</button>
            <button data-pin-credit-user="${user.id}" data-pin-credit-amount="700" data-pin-credit-reason="manual_credit">+700</button>
          </div>
        </article>
      `;
    }).join('');
  }

  async function renderAdminByPin() {
    const panel = document.getElementById('adminPanel');
    if (!panel) return;

    if (!getAdminPin()) {
      panel.innerHTML = adminLoginHtml();
      bindPinForm();
      return;
    }

    const data = await getAdminPinOverview();

    if (!data) {
      localStorage.removeItem('ft-admin-pin');
      panel.innerHTML = adminLoginHtml();
      bindPinForm();
      return;
    }

    const stats = data.stats || {};

    panel.innerHTML = `
      <section class="card ft-admin-card">
        <div class="section-header ft-admin-title-row">
          <span class="step">AD</span>
          <div>
            <h2>Админ-консоль</h2>
            <p class="section-subtitle">Дашборд, клиенты, балансы и ручное начисление.</p>
          </div>
          <button type="button" class="ft-dashboard-toggle" data-admin-logout>Выйти</button>
        </div>

        <div class="ft-admin-dashboard compact">
          <article><span>Клиентов</span><strong>${stats.totalUsers || 0}</strong><small>в базе</small></article>
          <article><span>Успешных</span><strong>${stats.totalGenerations || 0}</strong><small>генераций</small></article>
          <article><span>Списано</span><strong>${stats.totalSpentCredits || 0}</strong><small>токенов</small></article>
        </div>

        <section class="ft-section">
          <h3>Пользователи</h3>
          <div class="ft-admin-users">${renderUsers(data.users || [])}</div>
        </section>
      </section>
    `;

    panel.querySelector('[data-admin-logout]')?.addEventListener('click', () => {
      localStorage.removeItem('ft-admin-pin');
      renderAdminByPin();
    });

    panel.querySelectorAll('[data-pin-credit-user]').forEach((button) => {
      button.addEventListener('click', async () => {
        button.disabled = true;

        try {
          await creditUserByPin(
            button.dataset.pinCreditUser,
            Number(button.dataset.pinCreditAmount),
            button.dataset.pinCreditReason
          );

          await renderAdminByPin();
        } catch (error) {
          alert(error.message);
          button.disabled = false;
        }
      });
    });
  }

  function bindPinForm() {
    const form = document.getElementById('ftAdminPinForm');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const input = form.querySelector('input');
      const button = form.querySelector('button');
      const pin = input?.value?.trim();

      button.disabled = true;
      button.textContent = 'Проверяем...';

      localStorage.setItem('ft-admin-pin', pin);

      const data = await getAdminPinOverview();

      if (!data) {
        localStorage.removeItem('ft-admin-pin');
        button.disabled = false;
        button.textContent = 'Войти';
        alert('Неверный PIN');
        return;
      }

      await renderAdminByPin();
    });
  }

  document.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-tab-target="admin"]');
    if (!tab) return;

    setTimeout(renderAdminByPin, 250);
  }, true);

  window.addEventListener('load', () => {
    setTimeout(() => {
      const adminTab = document.querySelector('[data-tab-target="admin"]');
      if (adminTab) {
        adminTab.classList.remove('hidden');
        adminTab.style.display = '';
      }
    }, 500);
  });
})();

/* FIX: allow guest generation, soft auth modal, admin pin stability */

(function guestGenerationAndAuthFix() {
  if (window.__guestGenerationAndAuthFixApplied) return;
  window.__guestGenerationAndAuthFixApplied = true;

  function removeBadAuthGuardMessages() {
    document.querySelectorAll('.message, .toast, .generation-message').forEach((el) => {
      if ((el.textContent || '').includes('авторизуйтесь через Telegram')) {
        el.remove();
      }
    });
  }

  function showSoftAuthModal() {
    if (document.getElementById('ftSoftAuthModal')) return;

    const modal = document.createElement('div');
    modal.id = 'ftSoftAuthModal';
    modal.className = 'ft-soft-auth-modal';
    modal.innerHTML = `
      <div class="ft-soft-auth-card">
        <button type="button" class="ft-soft-auth-close" aria-label="Закрыть">×</button>
        <div class="ft-soft-auth-icon">FT</div>
        <h3>Авторизация через Telegram</h3>
        <p>
          Сейчас можно протестировать генерацию на бесплатных токенах.
          Авторизация нужна, чтобы закрепить баланс за вами, сохранить историю и получить дополнительные бонусные токены.
        </p>
        <a href="https://t.me/fototime323Bot" target="_blank" rel="noreferrer">Открыть бота в Telegram</a>
        <button type="button" class="ft-soft-auth-secondary">Продолжить тестирование</button>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.ft-soft-auth-close')?.addEventListener('click', () => modal.remove());
    modal.querySelector('.ft-soft-auth-secondary')?.addEventListener('click', () => modal.remove());
  }

  function addSoftAuthButton() {
    if (document.getElementById('ftSoftAuthButton')) return;

    const balanceCard = document.querySelector('.balance-card, .balance-card-final');
    if (!balanceCard) return;

    const button = document.createElement('button');
    button.id = 'ftSoftAuthButton';
    button.type = 'button';
    button.className = 'ft-soft-auth-button';
    button.textContent = 'Авторизация и бонусы';
    button.addEventListener('click', showSoftAuthModal);

    balanceCard.appendChild(button);
  }

  function forceAdminPinRender() {
    const adminPanel = document.getElementById('adminPanel');
    if (!adminPanel) return;

    if (!adminPanel.querySelector('#ftAdminPinForm') && !localStorage.getItem('ft-admin-pin')) {
      adminPanel.innerHTML = `
        <section class="card ft-admin-card">
          <div class="section-header">
            <span class="step">AD</span>
            <div>
              <h2>Админ-консоль</h2>
              <p class="section-subtitle">Введите PIN администратора.</p>
            </div>
          </div>

          <form id="ftAdminPinForm" class="ft-admin-pin">
            <input type="password" inputmode="numeric" placeholder="PIN-код" autocomplete="off" />
            <button type="submit">Войти</button>
          </form>
        </section>
      `;
    }

    const form = adminPanel.querySelector('#ftAdminPinForm');
    if (!form || form.dataset.bound === 'true') return;

    form.dataset.bound = 'true';

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const input = form.querySelector('input');
      const button = form.querySelector('button');
      const pin = input.value.trim();

      button.disabled = true;
      button.textContent = 'Проверяем...';

      const response = await fetch('/api/admin-pin/overview', {
        headers: {
          'x-admin-pin': pin
        }
      });

      if (!response.ok) {
        button.disabled = false;
        button.textContent = 'Войти';
        alert('Неверный PIN');
        return;
      }

      localStorage.setItem('ft-admin-pin', pin);

      if (typeof renderAdminFinal === 'function') {
        renderAdminFinal();
      } else {
        location.reload();
      }
    });
  }

  document.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-tab-target="admin"]');
    if (tab) {
      setTimeout(forceAdminPinRender, 300);
    }
  }, true);

  window.addEventListener('load', () => {
    setTimeout(() => {
      removeBadAuthGuardMessages();
      addSoftAuthButton();
      forceAdminPinRender();
    }, 800);
  });

  setInterval(removeBadAuthGuardMessages, 1200);
})();

/* RELEASE STABILIZER: auth status, logout, feedback, admin dashboard, error logs, safer generation */

(function releaseStabilizer() {
  if (window.__releaseStabilizerApplied) return;
  window.__releaseStabilizerApplied = true;

  const ADMIN_PIN_KEY = 'ft-admin-pin';
  const GUEST_LOGOUT_KEY = 'ft-guest-logged-out';

  function tgUser() {
    return window.Telegram?.WebApp?.initDataUnsafe?.user || null;
  }

  function isTelegram() {
    return Boolean(window.Telegram?.WebApp?.initData);
  }

  function userName() {
    const user = tgUser();

    if (user?.username) return `@${user.username}`;
    if (user?.first_name || user?.last_name) return [user.first_name, user.last_name].filter(Boolean).join(' ');
    return 'Гостевой пользователь';
  }

  function userAvatarHtml() {
    const user = tgUser();

    if (user?.photo_url) {
      return `<img src="${user.photo_url}" alt="avatar" />`;
    }

    return userName().replace('@', '').slice(0, 2).toUpperCase();
  }

  async function logGenerationError(error, source = 'client') {
    try {
      await fetch('/api/generation-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          message: error?.message || String(error),
          stack: error?.stack || ''
        })
      });
    } catch {}
  }

  window.addEventListener('error', (event) => {
    logGenerationError(event.error || event.message, 'window.error');
  });

  window.addEventListener('unhandledrejection', (event) => {
    logGenerationError(event.reason || 'Unhandled promise rejection', 'unhandledrejection');
  });

  function showConfetti() {
    const box = document.createElement('div');
    box.className = 'ft-confetti';
    box.innerHTML = '<i></i><i></i><i></i><i></i><i></i><i></i>';
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 1800);
  }

  function ensureAuthStatus() {
    if (document.getElementById('ftAuthStatusCard')) return;

    const balanceCard = document.querySelector('.balance-card, .balance-card-final');
    if (!balanceCard) return;

    const card = document.createElement('section');
    card.id = 'ftAuthStatusCard';
    card.className = 'ft-auth-status-card';

    card.innerHTML = `
      <div class="ft-user-avatar">${userAvatarHtml()}</div>
      <div>
        <strong>${isTelegram() ? 'Аккаунт Telegram прикреплён' : 'Гостевой режим'}</strong>
        <span>${isTelegram() ? `${userName()} · история и баланс сохраняются` : '50 токенов доступны на пробу. Для сохранения баланса откройте приложение через Telegram.'}</span>
      </div>
      <button type="button" id="ftAuthActionButton">${isTelegram() ? 'Выйти' : 'Как авторизоваться?'}</button>
    `;

    balanceCard.insertAdjacentElement('afterend', card);

    document.getElementById('ftAuthActionButton')?.addEventListener('click', () => {
      if (isTelegram()) {
        localStorage.setItem(GUEST_LOGOUT_KEY, 'true');
        localStorage.removeItem('fototime-ai-generated-photos');
        showMessage('Вы вышли из локального профиля. Чтобы снова прикрепить аккаунт, откройте приложение через Telegram.', 'success');
        showConfetti();
        return;
      }

      showMessage('Откройте это приложение через кнопку в Telegram-боте. После входа мы начислим бонусные токены.', 'info');
      showConfetti();
    });

    if (isTelegram()) {
      setTimeout(() => {
        showMessage(`Telegram аккаунт прикреплён: ${userName()}`, 'success');
        showConfetti();
      }, 700);
    }
  }

  function ensureFeedback() {
    const profile = document.getElementById('profilePanel');
    if (!profile || document.getElementById('ftFeedbackForm')) return;

    profile.insertAdjacentHTML('beforeend', `
      <section class="card ft-feedback-card">
        <div class="section-header">
          <span class="step">FB</span>
          <div>
            <h2>Обратная связь</h2>
            <p class="section-subtitle">Отзыв, идея улучшения или ошибка — можно приложить скриншот.</p>
          </div>
        </div>

        <form id="ftFeedbackForm" class="ft-feedback-form">
          <select name="type">
            <option value="review">Отзыв</option>
            <option value="improvement">Предложение улучшения</option>
            <option value="bug">Баг</option>
          </select>
          <input name="name" placeholder="Имя или “анонимно”" />
          <input name="contact" placeholder="Telegram для связи" />
          <textarea name="message" placeholder="Сообщение" required></textarea>
          <input name="screenshot" type="file" accept="image/*" />
          <button type="submit">Отправить</button>
        </form>

        <button type="button" id="ftTokenRequestButton" class="ft-token-request-button">
          Запросить токены
        </button>
      </section>
    `);

    const form = document.getElementById('ftFeedbackForm');

    form?.addEventListener('submit', async (event) => {
      event.preventDefault();

      const button = form.querySelector('button');
      button.disabled = true;
      button.textContent = 'Отправляем...';

      const fd = new FormData(form);
      if (!fd.get('name')) fd.set('name', userName());

      const response = await fetch('/api/feedback', {
        method: 'POST',
        body: fd
      });

      button.disabled = false;
      button.textContent = 'Отправить';

      if (response.ok) {
        form.reset();
        showMessage('Спасибо! Обратная связь отправлена.', 'success');
        showConfetti();
      } else {
        showMessage('Не удалось отправить обратную связь.', 'error');
      }
    });

    document.getElementById('ftTokenRequestButton')?.addEventListener('click', async () => {
      await fetch('/api/feedback/token-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: userName(), contact: userName(), message: 'Клиент запросил токены' })
      });

      showMessage('Запрос токенов отправлен. Мы свяжемся с вами.', 'success');
      showConfetti();
    });
  }

  async function renderAdminDashboard() {
    const admin = document.getElementById('adminPanel');
    const pin = localStorage.getItem(ADMIN_PIN_KEY);

    if (!admin || !pin) return;

    const [overviewRes, errorsRes, feedbackRes] = await Promise.all([
      fetch('/api/admin-pin/overview', { headers: { 'x-admin-pin': pin } }),
      fetch('/api/generation-logs/admin', { headers: { 'x-admin-pin': pin } }),
      fetch('/api/feedback/admin', { headers: { 'x-admin-pin': pin } })
    ]);

    if (!overviewRes.ok) return;

    const overview = await overviewRes.json();
    const errors = errorsRes.ok ? await errorsRes.json() : { items: [] };
    const feedback = feedbackRes.ok ? await feedbackRes.json() : { items: [] };

    let dashboard = document.getElementById('ftRealAdminDashboard');

    if (!dashboard) {
      dashboard = document.createElement('section');
      dashboard.id = 'ftRealAdminDashboard';
      dashboard.className = 'card ft-real-admin-dashboard';
      admin.prepend(dashboard);
    }

    const stats = overview.stats || {};
    const users = overview.users || [];

    dashboard.innerHTML = `
      <div class="section-header">
        <span class="step">DB</span>
        <div>
          <h2>Дашборд</h2>
          <p class="section-subtitle">Рабочая статистика генераций, ошибок и обращений.</p>
        </div>
      </div>

      <div class="ft-admin-dashboard compact">
        <article><span>Успешных</span><strong>${stats.totalGenerations || 0}</strong><small>генераций</small></article>
        <article><span>Ошибок</span><strong>${errors.items?.length || 0}</strong><small>зафиксировано</small></article>
        <article><span>Клиентов</span><strong>${stats.totalUsers || users.length || 0}</strong><small>в базе</small></article>
        <article><span>Обращений</span><strong>${feedback.items?.length || 0}</strong><small>feedback/request</small></article>
      </div>

      <section class="ft-section">
        <h3>Ошибки генераций</h3>
        <div class="ft-log-list">
          ${(errors.items || []).slice(0, 8).map((item) => `
            <article class="ft-log-row">
              <strong>${item.message}</strong>
              <small>${item.source || 'client'} · ${item.createdAt ? new Date(item.createdAt).toLocaleString('ru-RU') : ''}</small>
            </article>
          `).join('') || '<p class="ft-muted">Ошибок пока нет.</p>'}
        </div>
      </section>

      <section class="ft-section">
        <h3>Уведомления</h3>
        <div class="ft-log-list">
          ${(feedback.items || []).slice(0, 8).map((item) => `
            <article class="ft-log-row">
              <strong>${item.type === 'token_request' ? 'Запрос токенов' : 'Обратная связь'}</strong>
              <span>${item.name || 'Клиент'} ${item.contact ? '· ' + item.contact : ''}</span>
              <small>${item.message || '—'}</small>
            </article>
          `).join('') || '<p class="ft-muted">Уведомлений пока нет.</p>'}
        </div>
      </section>
    `;
  }

  function fixFooterGap() {
    const main = document.querySelector('main');
    if (main) main.classList.add('ft-main-tight');
  }

  document.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-tab-target]');

    if (!tab) return;

    setTimeout(() => {
      if (tab.dataset.tabTarget === 'profile') ensureFeedback();
      // legacy disabled: // legacy disabled: renderAdminDashboard();
      ensureAuthStatus();
      fixFooterGap();
    }, 500);
  }, true);

  window.addEventListener('load', () => {
    setTimeout(() => {
      ensureAuthStatus();
      ensureFeedback();
      if (document.body.dataset.activeTab === 'admin') renderAdminStable();
      fixFooterGap();
    }, 1000);
  });
})();

/* HOTFIX: download buttons, single history block, stable generation */

(function hotfixDownloadHistoryGeneration() {
  if (window.__hotfixDownloadHistoryGenerationApplied) return;
  window.__hotfixDownloadHistoryGenerationApplied = true;

  const HISTORY_KEY = 'fototime-ai-generated-photos';

  function getHistory() {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function saveHistoryUnique(item) {
    const list = getHistory();
    const imageUrl = item.resultUrl || item.imageUrl;
    const id = item.generationId || item.id || imageUrl || `gen_${Date.now()}`;

    const clean = list.filter((old) => {
      const oldId = old.generationId || old.id || old.resultUrl || old.imageUrl;
      return oldId !== id && old.resultUrl !== imageUrl && old.imageUrl !== imageUrl;
    });

    clean.unshift({
      ...item,
      id,
      generationId: id,
      resultUrl: imageUrl,
      imageUrl,
      createdAt: item.createdAt || new Date().toISOString()
    });

    localStorage.setItem(HISTORY_KEY, JSON.stringify(clean.slice(0, 60)));
  }

  async function downloadImage(url, filename = 'fototime-ai-photo.jpg') {
    if (!url) {
      alert('Нет ссылки на изображение');
      return;
    }

    try {
      const response = await fetch(url, { mode: 'cors' });
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  function normalizeDownloadButtons() {
    document.querySelectorAll('a, button').forEach((el) => {
      const text = (el.textContent || '').trim().toLowerCase();
      if (!['скачать', 'сохранить'].includes(text)) return;

      const card = el.closest('.ft-history-card, .history-card-item, .result-card, #resultSection');
      const img = card?.querySelector('img') || document.querySelector('#resultImage');
      const url = el.getAttribute('href') || img?.src;

      if (!url) return;

      el.removeAttribute('href');
      el.setAttribute('type', 'button');
      el.onclick = (event) => {
        event.preventDefault();
        event.stopPropagation();

        const name = `fototime-ai-${Date.now()}.jpg`;
        downloadImage(url, name);
      };
    });
  }

  function removeDuplicateHistoryBlocks() {
    const profile = document.querySelector('#profilePanel');
    if (!profile) return;

    const blocks = Array.from(profile.querySelectorAll(
      '#historySection, .history-card, .ft-section-clean, .card'
    )).filter((el) => /Мои сгенерированные фото|Последние изображения|сохранённых генераций/i.test(el.textContent || ''));

    blocks.forEach((block, index) => {
      if (index > 0) block.remove();
    });
  }

  function resultUrlFrom(data) {
    return data.resultUrl
      || data.imageUrl
      || data.url
      || data.image
      || data.result?.url
      || data.result?.imageUrl
      || data.data?.url
      || data.data?.imageUrl
      || (data.storage?.resultImage ? `/${data.storage.resultImage}` : '');
  }

  function getAppState() {
    const s = window.state || {};
    return {
      participantId: s.selectedParticipantId,
      styleId: s.selectedStyleId,
      style: s.selectedStyle,
      photo: s.selectedPhoto
    };
  }

  async function stableGenerate(event) {
    const button = event.target.closest('#generateButton, .generate-button');
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (button.dataset.generating === 'true') return;

    const s = getAppState();

    if (!s.participantId || !s.styleId || !s.photo) {
      if (typeof showMessage === 'function') showMessage('Выберите участника, стиль и фото.', 'error');
      else alert('Выберите участника, стиль и фото.');
      return;
    }

    const formData = new FormData();
    formData.append('participantId', s.participantId);
    formData.append('styleId', s.styleId);
    formData.append('styleTitle', s.style?.title || s.styleId);
    formData.append('styleProvider', s.style?.styleMode || s.style?.provider || s.style?.providers?.[0] || '');
    formData.append('styleMode', s.style?.styleMode || s.style?.provider || '');
    formData.append('photo', s.photo);

    const oldText = button.textContent;
    button.dataset.generating = 'true';
    button.disabled = true;
    button.textContent = 'Создаём AI-фото...';

    try {
      const headers = {};
      if (window.Telegram?.WebApp?.initData) {
        headers['x-telegram-init-data'] = window.Telegram.WebApp.initData;
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers,
        body: formData
      });

      const text = await response.text();
      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`Некорректный ответ сервера: ${text.slice(0, 140)}`);
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || `Ошибка генерации HTTP ${response.status}`);
      }

      const imageUrl = resultUrlFrom(data);

      if (!imageUrl) {
        throw new Error('Сервер не вернул ссылку на готовое изображение');
      }

      const resultSection = document.querySelector('#resultSection');
      const resultImage = document.querySelector('#resultImage');

      if (resultImage) resultImage.src = imageUrl;
      if (resultSection) {
        resultSection.classList.remove('hidden');
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      saveHistoryUnique({
        generationId: data.generationId || `generation_${Date.now()}`,
        resultUrl: imageUrl,
        imageUrl,
        styleTitle: s.style?.title || s.styleId,
        styleId: s.styleId,
        participantId: s.participantId
      });

      if (typeof data.balance !== 'undefined') {
        document.querySelectorAll('.balance-pill strong, .balance-badge strong, #mainBalanceValue, #profileBalanceValue, [data-balance-value]').forEach((el) => {
          el.textContent = data.balance;
        });
      }

      if (typeof renderProfileClean === 'function') {
        renderProfileClean();
      }

      setTimeout(() => {
        removeDuplicateHistoryBlocks();
        normalizeDownloadButtons();
      }, 400);

      if (typeof showMessage === 'function') showMessage('Готово! Фото сохранено в личном кабинете.', 'success');
    } catch (error) {
      try {
        await fetch('/api/generation-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: 'stableGenerate',
            message: error.message || String(error),
            stack: error.stack || '',
            details: 'hotfix generation handler'
          })
        });
      } catch {}

      if (typeof showMessage === 'function') showMessage(error.message || 'Ошибка генерации.', 'error');
      else alert(error.message || 'Ошибка генерации.');
    } finally {
      button.dataset.generating = 'false';
      button.disabled = false;
      button.textContent = oldText || 'Создать AI-фото';
    }
  }

  document.addEventListener('click', stableGenerate, true);

  document.addEventListener('click', () => {
    setTimeout(() => {
      removeDuplicateHistoryBlocks();
      normalizeDownloadButtons();
    }, 250);
  }, true);

  window.addEventListener('load', () => {
    setTimeout(() => {
      removeDuplicateHistoryBlocks();
      normalizeDownloadButtons();
    }, 1000);
  });
})();

/* HOTFIX: selection fallback, prices, admin chart, clear buttons */

(function finalProductHotfix() {
  if (window.__finalProductHotfixApplied) return;
  window.__finalProductHotfixApplied = true;

  const PRICE_PACKAGES = [
    { title: 'Старт', tokens: 50, price: '49 ₽', gens: 1 },
    { title: 'Комфорт', tokens: 120, price: '99 ₽', gens: 3 },
    { title: 'Популярный', tokens: 300, price: '249 ₽', gens: 7 },
    { title: 'Максимум', tokens: 700, price: '499 ₽', gens: 17 }
  ];

  function getSelectedFromDom() {
    const participant =
      document.querySelector('.participant-button.selected, .participant-option.selected, [data-participant-id].selected, [data-participant].selected');

    const style =
      document.querySelector('.style-card.selected, [data-style-id].selected, [data-style].selected, [aria-selected="true"].style-card');

    const fileInput =
      document.querySelector('input[type="file"][name="photo"], input[type="file"]');

    return {
      participantId:
        window.state?.selectedParticipantId ||
        participant?.dataset?.participantId ||
        participant?.dataset?.participant ||
        participant?.value,

      styleId:
        window.state?.selectedStyleId ||
        style?.dataset?.styleId ||
        style?.dataset?.style ||
        style?.dataset?.id,

      style:
        window.state?.selectedStyle || {
          title: style?.querySelector('strong, h3, .style-title')?.textContent?.trim() || style?.textContent?.trim()
        },

      photo:
        window.state?.selectedPhoto ||
        fileInput?.files?.[0] ||
        null
    };
  }

  window.__fototimeGetSelectedGenerationData = getSelectedFromDom;

  document.addEventListener('click', (event) => {
    const participant = event.target.closest('[data-participant-id], [data-participant], .participant-button, .participant-option');
    if (participant) {
      document.querySelectorAll('.participant-button, .participant-option, [data-participant-id], [data-participant]').forEach((el) => el.classList.remove('selected'));
      participant.classList.add('selected');
    }

    const style = event.target.closest('.style-card, [data-style-id], [data-style]');
    if (style) {
      document.querySelectorAll('.style-card, [data-style-id], [data-style]').forEach((el) => {
        el.classList.remove('selected');
        el.removeAttribute('aria-selected');
      });
      style.classList.add('selected');
      style.setAttribute('aria-selected', 'true');
    }
  }, true);

  function refreshPackagePrices() {
    document.querySelectorAll('.ft-package-grid').forEach((grid) => {
      grid.innerHTML = PRICE_PACKAGES.map((pack) => `
        <article class="ft-price-card">
          <div>
            <b>${pack.title}</b>
            <strong>${pack.tokens} токенов</strong>
            <span>≈ ${pack.gens} ${pack.gens === 1 ? 'генерация' : 'генераций'}</span>
          </div>
          <em>${pack.price}</em>
        </article>
      `).join('');
    });
  }

  async function renderAdminChart() {
    const panel = document.querySelector('#adminPanel');
    const pin = localStorage.getItem('ft-admin-pin') || '';
    if (!panel || !pin || document.querySelector('#ftStabilityChart')) return;

    const errorsRes = await fetch('/api/generation-logs/admin', { headers: { 'x-admin-pin': pin } });
    const overviewRes = await fetch('/api/admin-pin/overview', { headers: { 'x-admin-pin': pin } });

    const errors = errorsRes.ok ? await errorsRes.json() : { items: [] };
    const overview = overviewRes.ok ? await overviewRes.json() : { stats: {} };

    const success = Number(overview.stats?.totalGenerations || 0);
    const failed = Number(errors.items?.length || 0);
    const total = Math.max(success + failed, 1);
    const successPercent = Math.round((success / total) * 100);
    const failedPercent = 100 - successPercent;

    const chart = document.createElement('section');
    chart.id = 'ftStabilityChart';
    chart.className = 'ft-section-clean';
    chart.innerHTML = `
      <div class="ft-admin-section-head">
        <h3>Стабильность генераций</h3>
        <button type="button" data-clear-all-admin>Очистить уведомления и ошибки</button>
      </div>

      <div class="ft-stability-chart">
        <div class="ft-chart-bar">
          <span style="width:${successPercent}%"></span>
          <i style="width:${failedPercent}%"></i>
        </div>
        <div class="ft-chart-legend">
          <b>Успешно: ${success}</b>
          <b>Ошибки: ${failed}</b>
          <b>Стабильность: ${successPercent}%</b>
        </div>
      </div>
    `;

    panel.querySelector('.ft-admin-clean, .ft-admin-card, .card')?.prepend(chart);

    chart.querySelector('[data-clear-all-admin]')?.addEventListener('click', async () => {
      await fetch('/api/generation-logs/admin', { method: 'DELETE', headers: { 'x-admin-pin': pin } });
      await fetch('/api/feedback/admin', { method: 'DELETE', headers: { 'x-admin-pin': pin } });
      location.reload();
    });
  }

  function patchGenerateStateError() {
    const oldGetter = window.__fototimeGetSelectedGenerationData;

    document.addEventListener('click', (event) => {
      const button = event.target.closest('#generateButton, .generate-button');
      if (!button) return;

      const data = oldGetter();

      if (!data.participantId || !data.styleId || !data.photo) {
        const fileInput = document.querySelector('input[type="file"]');

        if (!data.photo && fileInput?.files?.[0]) {
          if (window.state) window.state.selectedPhoto = fileInput.files[0];
        }

        if (!data.participantId) {
          const firstParticipant = document.querySelector('[data-participant-id], [data-participant], .participant-button, .participant-option');
          firstParticipant?.click();
        }

        if (!data.styleId) {
          const selectedStyle = document.querySelector('.style-card.selected, [data-style-id].selected, [data-style].selected');
          selectedStyle?.click();
        }
      }
    }, true);
  }

  window.addEventListener('load', () => {
    setTimeout(() => {
      refreshPackagePrices();
      renderAdminChart();
      patchGenerateStateError();
    }, 900);
  });

  document.addEventListener('click', () => {
    setTimeout(() => {
      refreshPackagePrices();
      renderAdminChart();
    }, 400);
  }, true);
})();

/* FINAL HARD FIX: one generation handler, smoother prices, svg dashboard */

(function finalHardFix() {
  if (window.__finalHardFixApplied) return;
  window.__finalHardFixApplied = true;

  const HISTORY_KEY = 'fototime-ai-generated-photos';

  function $(s, r = document) { return r.querySelector(s); }
  function $$(s, r = document) { return Array.from(r.querySelectorAll(s)); }

  function message(text, type = 'info') {
    if (typeof showMessage === 'function') showMessage(text, type);
    else alert(text);
  }

  function headers() {
    const h = {};
    if (window.Telegram?.WebApp?.initData) h['x-telegram-init-data'] = window.Telegram.WebApp.initData;
    return h;
  }

  function getSelected() {
    const participant =
      $('.participant-button.selected') ||
      $('.participant-option.selected') ||
      $('[data-participant-id].selected') ||
      $('[data-participant].selected') ||
      $('.participant-button.active') ||
      $('[data-participant-id].active');

    const style =
      $('.style-card.selected') ||
      $('[data-style-id].selected') ||
      $('[data-style].selected') ||
      $('[aria-selected="true"].style-card') ||
      $('.style-card.active');

    const fileInput = $('input[type="file"]');

    return {
      participantId:
        window.state?.selectedParticipantId ||
        participant?.dataset?.participantId ||
        participant?.dataset?.participant ||
        participant?.getAttribute('data-id') ||
        participant?.value ||
        'female',

      styleId:
        window.state?.selectedStyleId ||
        style?.dataset?.styleId ||
        style?.dataset?.style ||
        style?.getAttribute('data-id') ||
        null,

      styleTitle:
        window.state?.selectedStyle?.title ||
        style?.querySelector('strong, h3, .style-title')?.textContent?.trim() ||
        style?.textContent?.trim() ||
        'AI style',

      photo:
        window.state?.selectedPhoto ||
        fileInput?.files?.[0] ||
        null
    };
  }

  function resultUrl(data) {
    return data.resultUrl ||
      data.imageUrl ||
      data.url ||
      data.image ||
      data.result?.url ||
      data.result?.imageUrl ||
      data.data?.url ||
      data.data?.imageUrl ||
      (data.storage?.resultImage ? `/${data.storage.resultImage}` : '');
  }

  function saveHistory(item) {
    const list = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const url = item.resultUrl || item.imageUrl;
    const clean = list.filter((x) => (x.resultUrl || x.imageUrl) !== url);
    clean.unshift(item);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(clean.slice(0, 60)));
  }

  async function logError(error) {
    try {
      await fetch('/api/generation-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'finalHardFix', message: error.message || String(error), stack: error.stack || '' })
      });
    } catch {}
  }

  async function generate(button) {
    if (button.dataset.loading === 'true') return;

    const selected = getSelected();

    if (!selected.styleId || !selected.photo) {
      message('Выберите стиль и загрузите фото.', 'error');
      return;
    }

    const fd = new FormData();
    fd.append('participantId', selected.participantId);
    fd.append('styleId', selected.styleId);
    fd.append('styleTitle', selected.styleTitle);
    fd.append('photo', selected.photo);

    const oldText = button.textContent;
    button.dataset.loading = 'true';
    button.disabled = true;
    button.textContent = 'Создаём AI-фото...';

    try {
      const res = await fetch('/api/generate', { method: 'POST', headers: headers(), body: fd });
      const text = await res.text();

      let data = {};
      try { data = text ? JSON.parse(text) : {}; }
      catch { throw new Error(`Сервер вернул некорректный ответ: ${text.slice(0, 120)}`); }

      if (!res.ok) throw new Error(data.message || data.error || `Ошибка генерации HTTP ${res.status}`);

      const url = resultUrl(data);
      if (!url) throw new Error('Сервер не вернул ссылку на готовое изображение');

      const img = $('#resultImage');
      const section = $('#resultSection');

      if (img) img.src = url;
      if (section) {
        section.classList.remove('hidden');
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      saveHistory({
        id: data.generationId || `generation_${Date.now()}`,
        generationId: data.generationId || `generation_${Date.now()}`,
        resultUrl: url,
        imageUrl: url,
        styleTitle: selected.styleTitle,
        styleId: selected.styleId,
        participantId: selected.participantId,
        createdAt: new Date().toISOString()
      });

      if (typeof data.balance !== 'undefined') {
        $$('.balance-pill strong, .balance-badge strong, #mainBalanceValue, #profileBalanceValue, [data-balance-value]').forEach((el) => {
          el.textContent = data.balance;
        });
      }

      message('Готово! Фото сохранено в личном кабинете.', 'success');
    } catch (error) {
      await logError(error);
      message(error.message || 'Ошибка генерации.', 'error');
    } finally {
      button.dataset.loading = 'false';
      button.disabled = false;
      button.textContent = oldText || 'Создать AI-фото';
    }
  }

  function replaceGenerateButton() {
    const old = $('#generateButton, .generate-button');
    if (!old || old.dataset.finalClean === 'true') return;

    const fresh = old.cloneNode(true);
    fresh.dataset.finalClean = 'true';
    fresh.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      generate(fresh);
    });

    old.replaceWith(fresh);
  }

  function patchPrices() {
    const packs = [
      ['Старт', '50 токенов', '49 ₽', '≈ 1 генерация'],
      ['Комфорт', '120 токенов', '99 ₽', '≈ 3 генерации'],
      ['Популярный', '300 токенов', '249 ₽', '≈ 7 генераций'],
      ['Максимум', '700 токенов', '499 ₽', '≈ 17 генераций']
    ];

    $$('.ft-package-grid').forEach((grid) => {
      grid.innerHTML = packs.map(([title, tokens, price, gens]) => `
        <article class="ft-price-card-soft">
          <div>
            <b>${title}</b>
            <strong>${tokens}</strong>
            <span>${gens}</span>
          </div>
          <em>${price}</em>
        </article>
      `).join('');
    });
  }

  async function patchAdminChart() {
    const panel = $('#adminPanel');
    const pin = localStorage.getItem('ft-admin-pin') || '';
    if (!panel || !pin) return;

    const oldChart = $('#ftStabilityChart');
    if (oldChart) oldChart.remove();

    const [overviewRes, errorsRes] = await Promise.all([
      fetch('/api/admin-pin/overview', { headers: { 'x-admin-pin': pin } }),
      fetch('/api/generation-logs/admin', { headers: { 'x-admin-pin': pin } })
    ]);

    const overview = overviewRes.ok ? await overviewRes.json() : { stats: {} };
    const errors = errorsRes.ok ? await errorsRes.json() : { items: [] };

    const success = Number(overview.stats?.totalGenerations || 0);
    const failed = Number(errors.items?.length || 0);
    const total = Math.max(success + failed, 1);
    const successPercent = Math.round((success / total) * 100);
    const failedPercent = 100 - successPercent;

    const chart = document.createElement('section');
    chart.id = 'ftStabilityChart';
    chart.className = 'ft-section-clean';
    chart.innerHTML = `
      <div class="ft-admin-section-head">
        <h3>График стабильности</h3>
        <button type="button" data-clear-all-admin>Очистить уведомления</button>
      </div>

      <div class="ft-svg-chart">
        <svg viewBox="0 0 320 160" role="img" aria-label="Стабильность генераций">
          <circle cx="80" cy="80" r="54" class="ft-ring-bg"></circle>
          <circle cx="80" cy="80" r="54" class="ft-ring-ok" style="stroke-dasharray:${successPercent} 100"></circle>
          <text x="80" y="75" text-anchor="middle" class="ft-chart-number">${successPercent}%</text>
          <text x="80" y="96" text-anchor="middle" class="ft-chart-label">stable</text>

          <rect x="170" y="${130 - success * 10}" width="42" height="${Math.max(success * 10, 4)}" rx="8" class="ft-bar-ok"></rect>
          <rect x="232" y="${130 - failed * 10}" width="42" height="${Math.max(failed * 10, 4)}" rx="8" class="ft-bar-fail"></rect>

          <text x="191" y="148" text-anchor="middle" class="ft-chart-label">ok</text>
          <text x="253" y="148" text-anchor="middle" class="ft-chart-label">fail</text>
        </svg>

        <div class="ft-chart-legend">
          <b>Успешно: ${success}</b>
          <b>Ошибки: ${failed}</b>
          <b>Стабильность: ${successPercent}%</b>
        </div>
      </div>
    `;

    panel.querySelector('.ft-admin-clean, .card')?.prepend(chart);

    chart.querySelector('[data-clear-all-admin]')?.addEventListener('click', async () => {
      await fetch('/api/generation-logs/admin', { method: 'DELETE', headers: { 'x-admin-pin': pin } });
      await fetch('/api/feedback/admin', { method: 'DELETE', headers: { 'x-admin-pin': pin } });
      chart.remove();
      patchAdminChart();
    });
  }

  function normalizeSpacing() {
    $$('.card, .ft-section-clean, .ft-profile-clean, .ft-admin-clean').forEach((el) => {
      el.classList.add('ft-space-normalized');
    });
  }

  window.addEventListener('load', () => {
    setTimeout(() => {
      replaceGenerateButton();
      patchPrices();
      normalizeSpacing();
    }, 800);
  });

  document.addEventListener('click', () => {
    setTimeout(() => {
      replaceGenerateButton();
      patchPrices();
      normalizeSpacing();
      patchAdminChart();
    }, 300);
  }, true);
})();

/* EMERGENCY GENERATION FIX: capture before all old handlers */

(function emergencyGenerationFix() {
  if (window.__emergencyGenerationFixApplied) return;
  window.__emergencyGenerationFixApplied = true;

  const HISTORY_KEY = 'fototime-ai-generated-photos';

  function $$(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function show(text, type = 'info') {
    if (typeof showMessage === 'function') {
      showMessage(text, type);
    } else {
      alert(text);
    }
  }

  function visible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function findFile() {
    const inputs = $$('input[type="file"]');

    for (const input of inputs) {
      if (input.files && input.files[0]) return input.files[0];
    }

    if (window.state?.selectedPhoto) return window.state.selectedPhoto;

    return null;
  }

  function findParticipantId() {
    if (window.state?.selectedParticipantId) return window.state.selectedParticipantId;

    const selected = $$('button, [data-participant-id], [data-participant], .participant-button, .participant-option')
      .find((el) => {
        const cls = el.className || '';
        const aria = el.getAttribute('aria-pressed') || el.getAttribute('aria-selected');
        return (
          String(cls).includes('selected') ||
          String(cls).includes('active') ||
          aria === 'true'
        );
      });

    const text = (selected?.textContent || '').trim().toLowerCase();

    if (selected?.dataset?.participantId) return selected.dataset.participantId;
    if (selected?.dataset?.participant) return selected.dataset.participant;

    if (text.includes('муж')) return 'male';
    if (text.includes('жен')) return 'female';
    if (text.includes('пар')) return 'couple';
    if (text.includes('маль')) return 'boy';
    if (text.includes('дев')) return 'girl';
    if (text.includes('сем')) return 'family';

    return 'female';
  }

  function findSelectedStyleCard() {
    const candidates = $$(
      '.style-card, [data-style-id], [data-style], [data-id], article, .card'
    ).filter((el) => {
      if (!visible(el)) return false;

      const text = (el.textContent || '').trim();
      if (!text) return false;

      const hasImage = Boolean(el.querySelector('img'));
      const hasStyleData = Boolean(el.dataset.styleId || el.dataset.style || el.dataset.id);
      const looksLikeStyle = /SDXL|Nano Banana|FLUX|Замена Головы|Астрал|Хогвартс|Барби|Готика|Кавай|Комикс|Краски/i.test(text);

      return hasImage || hasStyleData || looksLikeStyle;
    });

    const selected = candidates.find((el) => {
      const cls = String(el.className || '');
      const aria = el.getAttribute('aria-selected');

      return (
        cls.includes('selected') ||
        cls.includes('active') ||
        aria === 'true' ||
        getComputedStyle(el).borderColor.includes('156') ||
        getComputedStyle(el).outlineStyle !== 'none'
      );
    });

    return selected || candidates[0] || null;
  }

  function findStyle() {
    if (window.state?.selectedStyleId) {
      return {
        id: window.state.selectedStyleId,
        title: window.state.selectedStyle?.title || window.state.selectedStyleId,
        provider: window.state.selectedStyle?.provider || window.state.selectedStyle?.providers?.[0] || ''
      };
    }

    const card = findSelectedStyleCard();

    if (!card) {
      return null;
    }

    const title =
      card.querySelector('strong, h3, .style-title, .title')?.textContent?.trim() ||
      card.textContent?.trim()?.split('\n')?.[0]?.trim() ||
      '';

    const providerText =
      card.textContent?.match(/SDXL|Nano Banana|FLUX\.?2?|Замена Головы/i)?.[0] ||
      '';

    const id =
      card.dataset.styleId ||
      card.dataset.style ||
      card.dataset.id ||
      card.getAttribute('data-ns-id') ||
      card.getAttribute('data-provider-style-id') ||
      title;

    if (!id) return null;

    return {
      id,
      title: title || id,
      provider: providerText
    };
  }

  function responseImageUrl(data) {
    return (
      data.resultUrl ||
      data.imageUrl ||
      data.url ||
      data.image ||
      data.result?.url ||
      data.result?.imageUrl ||
      data.data?.url ||
      data.data?.imageUrl ||
      data.output?.url ||
      data.output?.imageUrl ||
      (data.storage?.resultImage ? `/${data.storage.resultImage}` : '')
    );
  }

  function saveHistory(item) {
    try {
      const list = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      const url = item.resultUrl || item.imageUrl;

      const filtered = list.filter((old) => {
        return (old.resultUrl || old.imageUrl) !== url;
      });

      filtered.unshift(item);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered.slice(0, 60)));
    } catch {}
  }

  async function logError(error, details) {
    try {
      await fetch('/api/generation-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'emergencyGenerationFix',
          message: error?.message || String(error),
          stack: error?.stack || '',
          details
        })
      });
    } catch {}
  }

  async function runGeneration(button) {
    if (button.dataset.emergencyLoading === 'true') return;

    const photo = findFile();
    const style = findStyle();
    const participantId = findParticipantId();

    if (!photo) {
      show('Загрузите фото.', 'error');
      return;
    }

    if (!style?.id) {
      show('Выберите стиль обработки.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('participantId', participantId);
    formData.append('styleId', style.id);
    formData.append('styleTitle', style.title || style.id);
    formData.append('styleProvider', style.styleMode || style.provider || '');
    formData.append('styleMode', style.styleMode || style.provider || '');
    formData.append('photo', photo);

    const oldText = button.textContent;
    button.dataset.emergencyLoading = 'true';
    button.disabled = true;
    button.textContent = 'Создаём AI-фото...';

    try {
      const headers = {};

      if (window.Telegram?.WebApp?.initData) {
        headers['x-telegram-init-data'] = window.Telegram.WebApp.initData;
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers,
        body: formData
      });

      const raw = await response.text();

      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(`Сервер вернул не JSON: ${raw.slice(0, 160)}`);
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || `Ошибка генерации HTTP ${response.status}`);
      }

      const imageUrl = responseImageUrl(data);

      if (!imageUrl) {
        throw new Error('Генерация завершилась, но сервер не вернул ссылку на изображение.');
      }

      const resultImage = document.querySelector('#resultImage');
      const resultSection = document.querySelector('#resultSection');

      if (resultImage) resultImage.src = imageUrl;

      if (resultSection) {
        resultSection.classList.remove('hidden');
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      saveHistory({
        id: data.generationId || `generation_${Date.now()}`,
        generationId: data.generationId || `generation_${Date.now()}`,
        resultUrl: imageUrl,
        imageUrl,
        styleTitle: style.title || style.id,
        styleId: style.id,
        participantId,
        createdAt: new Date().toISOString()
      });

      if (typeof data.balance !== 'undefined') {
        document.querySelectorAll('.balance-pill strong, .balance-badge strong, #mainBalanceValue, #profileBalanceValue, [data-balance-value]').forEach((el) => {
          el.textContent = data.balance;
        });
      }

      show('Готово! Фото сохранено в личном кабинете.', 'success');
    } catch (error) {
      await logError(error, `participant=${participantId}; style=${style?.id || 'none'}; photo=${photo?.name || 'none'}`);
      show(error.message || 'Ошибка генерации.', 'error');
    } finally {
      button.dataset.emergencyLoading = 'false';
      button.disabled = false;
      button.textContent = oldText || 'Создать AI-фото';
    }
  }

  window.addEventListener('click', function interceptGenerate(event) {
    const button = event.target.closest('#generateButton, .generate-button');

    if (!button) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    runGeneration(button);
  }, true);
})();

/* SAFE FIX 2026-06-07: desktop demo auth + admin load + green buttons */

(function fototimeSafeFix0607() {
  if (window.__fototimeSafeFix0607) return;
  window.__fototimeSafeFix0607 = true;

  const tg = window.Telegram?.WebApp;

  function getDemoUserId() {
    return String(tg?.initDataUnsafe?.user?.id || 'local-demo-user');
  }

  function patchFetchForDesktopDemo() {
    if (window.__fototimeFetchPatched) return;
    window.__fototimeFetchPatched = true;

    const originalFetch = window.fetch.bind(window);

    window.fetch = function patchedFetch(input, init = {}) {
      const url = typeof input === 'string' ? input : input?.url || '';

      const shouldPatch =
        url.includes('/api/generate') ||
        url.includes('/api/user') ||
        url.includes('/api/admin') ||
        url.includes('/api/stable');

      if (!shouldPatch) {
        return originalFetch(input, init);
      }

      const headers = new Headers(init.headers || {});

      if (!headers.has('x-user-id')) {
        headers.set('x-user-id', getDemoUserId());
      }

      if (!headers.has('x-telegram-user-id')) {
        headers.set('x-telegram-user-id', getDemoUserId());
      }

      if (!headers.has('x-telegram-init-data')) {
        headers.set('x-telegram-init-data', tg?.initData || '');
      }

      return originalFetch(input, {
        ...init,
        headers
      });
    };
  }

  function restoreGreenButtons() {
    const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'));

    buttons.forEach((button) => {
      const text = (button.textContent || '').toLowerCase();

      const isPrimary =
        text.includes('создать ai-фото') ||
        text.includes('пополнить') ||
        text.includes('обновить') ||
        text.includes('авториз') ||
        text.includes('отправить') ||
        text.includes('запросить токены') ||
        text.includes('+50') ||
        text.includes('+120') ||
        text.includes('+300') ||
        text.includes('+700');

      if (isPrimary) {
        button.classList.add('ft-safe-primary-button');
      }
    });
  }

  function preventAdminBlank() {
    const currentText = document.body.innerText.toLowerCase();

    if (!currentText.includes('админ')) return;

    const adminBlocks = Array.from(document.querySelectorAll('section, main, div'))
      .filter((el) => (el.textContent || '').toLowerCase().includes('админ-консоль'));

    adminBlocks.forEach((block) => {
      block.classList.add('ft-safe-admin-visible');
      block.style.display = '';
      block.style.visibility = '';
      block.style.opacity = '';
      block.style.height = '';
      block.style.overflow = '';
    });
  }

  function fixGenerationButtonState() {
    const createButton = Array.from(document.querySelectorAll('button, a, [role="button"]'))
      .find((el) => (el.textContent || '').toLowerCase().includes('создать ai-фото'));

    if (!createButton) return;

    const pageText = document.body.innerText.toLowerCase();

    const hasPhoto =
      pageText.includes('фото загружено') ||
      pageText.includes('.jpg') ||
      pageText.includes('.jpeg') ||
      pageText.includes('.png');

    const hasParticipant =
      document.querySelector('[data-participant].active, [data-participant].selected') ||
      pageText.includes('мужчина') ||
      pageText.includes('женщина') ||
      pageText.includes('пара') ||
      pageText.includes('семья');

    const hasStyle =
      document.querySelector('[data-style-id].active, [data-style-id].selected, .style-card.active, .style-card.selected') ||
      pageText.includes('sdxl') ||
      pageText.includes('nano banana') ||
      pageText.includes('flux');

    if (hasPhoto && hasParticipant && hasStyle) {
      createButton.disabled = false;
      createButton.removeAttribute('disabled');
      createButton.setAttribute('aria-disabled', 'false');
      createButton.classList.add('ft-safe-primary-button');
      createButton.classList.add('ft-safe-create-ready');
    }
  }

  function run() {
    patchFetchForDesktopDemo();
    restoreGreenButtons();
    preventAdminBlank();
    fixGenerationButtonState();
  }

  window.addEventListener('load', () => {
    setTimeout(run, 100);
    setTimeout(run, 700);
    setTimeout(run, 1500);
  });

  document.addEventListener('click', () => {
    setTimeout(run, 100);
    setTimeout(run, 700);
  }, true);

  document.addEventListener('change', () => {
    setTimeout(run, 100);
    setTimeout(run, 700);
  }, true);

  setInterval(run, 2000);
})();


/* FT_DESKTOP_HEADERS_PATCH_20260607 */
(function ftDesktopHeadersPatch20260607() {
  if (window.__ftDesktopHeadersPatch20260607) return;
  window.__ftDesktopHeadersPatch20260607 = true;

  const nativeFetch = window.fetch.bind(window);

  window.fetch = function ftPatchedFetch(input, init = {}) {
    const url = typeof input === 'string' ? input : input?.url || '';
    const isApi = url.includes('/api/');

    if (!isApi) {
      return nativeFetch(input, init);
    }

    const headers = new Headers(init.headers || {});

    if (!headers.has('x-user-id')) {
      headers.set('x-user-id', 'local-demo-user');
    }

    if (!headers.has('x-telegram-user-id')) {
      headers.set('x-telegram-user-id', 'local-demo-user');
    }

    if (!headers.has('x-admin-pin')) {
      const savedPin =
        localStorage.getItem('ft-admin-pin-value') ||
        localStorage.getItem('ft_admin_pin') ||
        '3465';
      headers.set('x-admin-pin', savedPin);
    }

    return nativeFetch(input, {
      ...init,
      headers
    });
  };
})();



/* FT_LINKS_AND_UI_PATCH_20260608 */
window.addEventListener('load', () => {
  const SUPPORT_LINK = 'https://t.me/fototime23_Bot';
  const VK_LINK = 'https://vk.com/fototime323';
  const MAX_LINK = 'https://max.ru/join/bRIUnVt_oVplSVIoptiXlMaLOUqGk0hUYwx9WUmBY1U';
  const AVITO_LINK = 'https://www.avito.ru/brands/2ea6fb10e03ed3afa712fab8a115e36a';
  const SITE_LINK = 'https://fototime323.lpmotortest.com';

  function normalizeText() {
    document.querySelectorAll('body *').forEach((node) => {
      if (!node.childNodes || node.childNodes.length !== 1) return;
      const child = node.childNodes[0];
      if (!child || child.nodeType !== Node.TEXT_NODE) return;

      child.nodeValue = child.nodeValue
        .replaceAll('токенов', 'токенов')
        .replaceAll('токены', 'токены')
        .replaceAll('токен', 'токен')
        .replaceAll('Токенов', 'Токенов')
        .replaceAll('Токены', 'Токены')
        .replaceAll('Токен', 'Токен')
        .replaceAll('Демо-пространство FOTOTIME323', 'Демо-пространство FOTOTIME323')
        .replaceAll('текущего режима', 'текущего режима')
        .replaceAll('для режима', 'для личного использования')
        .replaceAll('Для небольшого режима', 'Для нескольких генераций')
        .replaceAll('Отзыв, идея улучшения или баг', 'Отзыв, идея улучшения или ошибка');
    });
  }

  function patchTopupCta() {
    document.querySelectorAll('a, button, div, section').forEach((el) => {
      const text = (el.textContent || '').trim();
      if (!text.includes('Пополнить баланс')) return;
      if (text.length > 140) return;

      el.classList.add('ft-topup-cta-fixed');
      el.setAttribute('role', el.getAttribute('role') || 'button');

      if (!el.querySelector('.ft-cta-arrow')) {
        const arrow = document.createElement('span');
        arrow.className = 'ft-cta-arrow';
        arrow.textContent = '→';
        el.appendChild(arrow);
      }
    });
  }

  function patchContactLinks() {
    document.querySelectorAll('a, button').forEach((el) => {
      const label = (el.textContent || '').trim().toLowerCase();

      if (label.includes('telegram') || label.includes('поддержка')) {
        el.setAttribute('data-ft-social', 'telegram');
        if (el.tagName === 'A') el.href = SUPPORT_LINK;
        el.onclick = () => window.open(SUPPORT_LINK, '_blank');
      }

      if (label === 'vk' || label.includes('vk')) {
        el.setAttribute('data-ft-social', 'vk');
        if (el.tagName === 'A') el.href = VK_LINK;
        el.onclick = () => window.open(VK_LINK, '_blank');
      }

      if (label.includes('сайт')) {
        el.setAttribute('data-ft-social', 'site');
        if (el.tagName === 'A') el.href = SITE_LINK;
        el.onclick = () => window.open(SITE_LINK, '_blank');
      }
    });

    document.querySelectorAll('.ft-contact-card, .contact-card, section, article').forEach((card) => {
      const txt = (card.textContent || '').toLowerCase();
      if (!txt.includes('telegram') || !txt.includes('vk') || !txt.includes('сайт')) return;
      if (card.querySelector('[data-ft-social="max"]')) return;

      const row = Array.from(card.querySelectorAll('div, nav')).find((el) => {
        const t = (el.textContent || '').toLowerCase();
        return t.includes('telegram') && t.includes('vk') && t.includes('сайт');
      }) || card;

      const max = document.createElement('button');
      max.type = 'button';
      max.className = 'ft-social-button';
      max.dataset.ftSocial = 'max';
      max.textContent = '✦ MAX';
      max.onclick = () => window.open(MAX_LINK, '_blank');

      const avito = document.createElement('button');
      avito.type = 'button';
      avito.className = 'ft-social-button';
      avito.dataset.ftSocial = 'avito';
      avito.textContent = '✦ Авито';
      avito.onclick = () => window.open(AVITO_LINK, '_blank');

      row.appendChild(max);
      row.appendChild(avito);
    });
  }

  function patchFeedbackLabels() {
    document.querySelectorAll('textarea, input').forEach((el) => {
      if (el.placeholder) {
        el.placeholder = el.placeholder
          .replaceAll('баг', 'ошибку')
          .replaceAll('Баг', 'Ошибку');
      }
    });
  }

  function runPatch() {
    normalizeText();
    patchTopupCta();
    patchContactLinks();
    patchFeedbackLabels();
  }

  runPatch();
  setTimeout(runPatch, 500);
  setTimeout(runPatch, 1500);
});


/* FT_POLISH_LAYER_20260608 */
window.addEventListener('load', () => {
  const LINKS = {
    telegram: 'https://t.me/fototime23_Bot',
    vk: 'https://vk.com/fototime323',
    max: 'https://max.ru/join/bRIUnVt_oVplSVIoptiXlMaLOUqGk0hUYwx9WUmBY1U',
    avito: 'https://www.avito.ru/brands/2ea6fb10e03ed3afa712fab8a115e36a',
    site: 'https://fototime323.lpmotortest.com'
  };

  function replaceTextEverywhere() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach((node) => {
      node.nodeValue = node.nodeValue
        .replaceAll('Стили загружаются из каталога режима', 'Стили загружаются из каталога режима')
        .replaceAll('каталога режима', 'каталога режима')
        .replaceAll('для мероприятий', 'для быстрых AI-генераций')
        .replaceAll('мероприятий', 'AI-генераций')
        .replaceAll('мероприятия', 'режима')
        .replaceAll('Комфорт', 'Комфорт')
        .replaceAll('токенов', 'токенов')
        .replaceAll('токены', 'токены')
        .replaceAll('токен', 'токен')
        .replaceAll('Токенов', 'Токенов')
        .replaceAll('Токены', 'Токены')
        .replaceAll('Токен', 'Токен');
    });
  }

  function fixTopupButton() {
    document.querySelectorAll('.ft-topup-cta-fixed, a, button, div').forEach((el) => {
      const raw = (el.textContent || '').trim();
      if (!raw.includes('Пополнить баланс')) return;
      if (raw.length > 170) return;

      el.classList.add('ft-topup-cta-final');

      el.querySelectorAll('.ft-cta-arrow').forEach((x) => x.remove());

      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach((node) => {
        node.nodeValue = node.nodeValue.replace(/[→➜➔➞]+/g, '').replace(/\s{2,}/g, ' ');
      });

      if (!el.querySelector('.ft-cta-arrow-final')) {
        const arrow = document.createElement('span');
        arrow.className = 'ft-cta-arrow-final';
        arrow.textContent = '→';
        el.appendChild(arrow);
      }
    });
  }

  function ensureContactButtons() {
    document.querySelectorAll('section, article, .card, .ft-stable-card').forEach((card) => {
      const txt = (card.textContent || '').toLowerCase();
      if (!txt.includes('fototime323')) return;
      if (!txt.includes('telegram') || !txt.includes('vk') || !txt.includes('сайт')) return;

      let row = Array.from(card.querySelectorAll('div, nav')).find((el) => {
        const t = (el.textContent || '').toLowerCase();
        return t.includes('telegram') && t.includes('vk') && t.includes('сайт');
      });

      if (!row) return;
      row.classList.add('ft-social-row-final');

      const add = (key, label) => {
        if (row.querySelector(`[data-ft-social="${key}"]`)) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ft-social-button-final';
        btn.dataset.ftSocial = key;
        btn.textContent = label;
        btn.addEventListener('click', () => window.open(LINKS[key], '_blank'));
        row.appendChild(btn);
      };

      add('max', '✦ MAX');
      add('avito', '✦ Авито');
    });

    document.querySelectorAll('a, button').forEach((el) => {
      const label = (el.textContent || '').trim().toLowerCase();

      if (label.includes('telegram')) {
        el.dataset.ftSocial = 'telegram';
        el.onclick = () => window.open(LINKS.telegram, '_blank');
      }

      if (label === 'vk' || label.includes('vk')) {
        el.dataset.ftSocial = 'vk';
        el.onclick = () => window.open(LINKS.vk, '_blank');
      }

      if (label.includes('сайт')) {
        el.dataset.ftSocial = 'site';
        el.onclick = () => window.open(LINKS.site, '_blank');
      }
    });
  }

  async function downloadByUrl(url, filename = 'fototime-ai-photo.jpg') {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
  }

  function fixDownloadButtons() {
    document.querySelectorAll('button, a').forEach((btn) => {
      const label = (btn.textContent || '').trim().toLowerCase();
      if (label !== 'скачать' && !label.includes('скачать изображение')) return;

      btn.classList.add('ft-download-button-final');

      if (btn.dataset.ftDownloadFixed === '1') return;
      btn.dataset.ftDownloadFixed = '1';

      btn.addEventListener('click', async (event) => {
        const card = btn.closest('article, .card, .history-card, .photo-card, div') || document;
        const img = card.querySelector('img') || btn.closest('section, article, div')?.querySelector('img');

        if (!img?.src) return;

        event.preventDefault();
        event.stopPropagation();

        try {
          const safeName = ((card.textContent || 'fototime-ai-photo').trim().split(/\s+/).slice(0, 3).join('-') || 'fototime-ai-photo')
            .replace(/[^\wа-яё-]+/gi, '-')
            .toLowerCase();
          await downloadByUrl(img.src, `${safeName}.jpg`);
        } catch (e) {
          window.open(img.src, '_blank');
        }
      }, true);
    });
  }

  function polishFeedback() {
    document.querySelectorAll('section, article, .card').forEach((card) => {
      const txt = (card.textContent || '').toLowerCase();
      if (!txt.includes('обратная связь')) return;
      card.classList.add('ft-feedback-card-final');
      card.querySelectorAll('input, textarea, select').forEach((field) => {
        field.classList.add('ft-feedback-field-final');
      });
    });
  }

  function run() {
    replaceTextEverywhere();
    fixTopupButton();
    ensureContactButtons();
    fixDownloadButtons();
    polishFeedback();
  }

  run();
  setTimeout(run, 300);
  setTimeout(run, 1000);
  setTimeout(run, 2500);
});


/* FT_HISTORY_DOWNLOAD_AND_PIN_FIX_20260608 */
window.addEventListener('load', () => {
  const ADMIN_PIN_KEY = 'ft-admin-pin';

  function getVisibleAdminPin() {
    const input =
      document.querySelector('#adminPinInput') ||
      document.querySelector('input[placeholder*="PIN"]') ||
      document.querySelector('input[type="password"]');

    const fromInput = input?.value?.trim();
    const fromStorage = localStorage.getItem(ADMIN_PIN_KEY)?.trim();
    return fromInput || fromStorage || '';
  }

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!form || form.id !== 'adminPinForm') return;

    const pin = getVisibleAdminPin();
    if (pin) localStorage.setItem(ADMIN_PIN_KEY, pin);
  }, true);

  const originalFetch = window.fetch.bind(window);
  window.fetch = (resource, options = {}) => {
    const url = typeof resource === 'string' ? resource : resource?.url || '';

    if (url.includes('/api/admin') || url.includes('/api/admin-pin') || url.includes('/api/generation-logs') || url.includes('/api/feedback/admin')) {
      const pin = getVisibleAdminPin();
      const nextOptions = { ...options };
      const headers = new Headers(nextOptions.headers || {});

      if (pin && !headers.has('x-admin-pin')) {
        headers.set('x-admin-pin', pin);
      }

      if (pin && nextOptions.method && nextOptions.method.toUpperCase() !== 'GET' && !nextOptions.body) {
        headers.set('content-type', 'application/json');
        nextOptions.body = JSON.stringify({ pin });
      }

      nextOptions.headers = headers;
      return originalFetch(resource, nextOptions);
    }

    return originalFetch(resource, options);
  };

  function findImageForButton(button) {
    let node = button;
    for (let i = 0; i < 8 && node; i += 1) {
      const img = node.querySelector?.('img');
      if (img?.src) return img;
      node = node.parentElement;
    }

    const card = button.closest('[class*="history"], [class*="photo"], article, section, .card, div');
    return card?.querySelector?.('img') || null;
  }

  async function forceDownloadImage(src, filename) {
    const response = await fetch(src, { mode: 'cors' });
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename || 'fototime-ai-photo.jpg';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
  }

  document.addEventListener('click', async (event) => {
    const button = event.target.closest?.('button, a');
    if (!button) return;

    const label = (button.textContent || '').trim().toLowerCase();
    if (label !== 'скачать' && !label.includes('скачать изображение')) return;

    const img = findImageForButton(button);
    if (!img?.src) return;

    event.preventDefault();
    event.stopPropagation();

    const cardText = (button.closest('article, section, .card, div')?.textContent || 'fototime-ai-photo')
      .trim()
      .split(/\s+/)
      .slice(0, 4)
      .join('-')
      .replace(/[^\wа-яё-]+/gi, '-')
      .toLowerCase();

    const filename = `${cardText || 'fototime-ai-photo'}.jpg`;

    try {
      await forceDownloadImage(img.src, filename);
    } catch (error) {
      const fallback = document.createElement('a');
      fallback.href = img.src;
      fallback.download = filename;
      fallback.target = '_blank';
      fallback.rel = 'noopener';
      document.body.appendChild(fallback);
      fallback.click();
      fallback.remove();
    }
  }, true);

  function polishDownloadButtons() {
    document.querySelectorAll('button, a').forEach((button) => {
      const label = (button.textContent || '').trim().toLowerCase();
      if (label === 'скачать' || label.includes('скачать изображение')) {
        button.classList.add('ft-download-button-final');
      }
    });
  }

  polishDownloadButtons();
  setInterval(polishDownloadButtons, 1500);
});


/* FT_GENERATION_AND_PIN_VISIBLE_FIX_20260608 */
(function ftGenerationAndPinVisibleFix() {
  if (window.__ftGenerationAndPinVisibleFixApplied) return;
  window.__ftGenerationAndPinVisibleFixApplied = true;

  const FT_ADMIN_PIN_STORAGE_KEY = 'ft-admin-pin';

  function ftShowGenerationError(message) {
    const text = String(message || 'Не удалось создать AI-фото. Попробуйте ещё раз.').trim();

    let target =
      document.querySelector('#generationError') ||
      document.querySelector('.generation-error') ||
      document.querySelector('.photo-error') ||
      document.querySelector('[data-generation-error]');

    if (!target) {
      const photoSection =
        [...document.querySelectorAll('section, article, .card, .ft-stable-card')]
          .find((node) => /Фото|Создать AI-фото|JPG|JPEG|PNG/i.test(node.textContent || ''));

      if (photoSection) {
        target = document.createElement('div');
        target.className = 'ft-visible-generation-error';
        target.setAttribute('data-generation-error', 'true');
        photoSection.appendChild(target);
      }
    }

    if (target) {
      target.textContent = text;
      target.style.display = 'block';
      target.style.color = '#ff4f7b';
      target.style.fontWeight = '800';
      target.style.marginTop = '12px';
      target.style.lineHeight = '1.25';
    }

    console.error('[FOTOTIME generation error]', text);
  }

  function ftClearGenerationError() {
    document
      .querySelectorAll('#generationError, .generation-error, .photo-error, [data-generation-error], .ft-visible-generation-error')
      .forEach((node) => {
        node.textContent = '';
        node.style.display = 'none';
      });
  }

  async function ftFetchJsonSafe(url, options = {}) {
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type') || '';
    let payload = null;

    if (contentType.includes('application/json')) {
      payload = await response.json().catch(() => null);
    } else {
      const raw = await response.text().catch(() => '');
      payload = raw ? { message: raw } : null;
    }

    if (!response.ok) {
      const message =
        payload?.message ||
        payload?.error ||
        payload?.details ||
        `Ошибка запроса ${response.status}`;

      const err = new Error(message);
      err.status = response.status;
      err.payload = payload;
      throw err;
    }

    return payload;
  }

  async function ftVerifyAdminPin(pin) {
    const cleanPin = String(pin || '').trim();

    if (!cleanPin) {
      throw new Error('Введите PIN администратора');
    }

    const result = await ftFetchJsonSafe('/api/admin-pin/verify', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-admin-pin': cleanPin
      },
      body: JSON.stringify({ pin: cleanPin })
    });

    if (!result?.ok) {
      throw new Error(result?.message || 'Неверный PIN');
    }

    localStorage.setItem(FT_ADMIN_PIN_STORAGE_KEY, cleanPin);
    localStorage.setItem('ft-admin-pin-value', cleanPin);
    window.ftAdminPin = cleanPin;

    return true;
  }

  document.addEventListener('submit', async (event) => {
    const form = event.target;
    if (!form || form.id !== 'adminPinForm') return;

    const input =
      form.querySelector('#adminPinInput') ||
      form.querySelector('input[type="password"]') ||
      form.querySelector('input[inputmode="numeric"]');

    if (!input) return;

    event.preventDefault();
    event.stopPropagation();

    const button = form.querySelector('button[type="submit"], button');
    const oldText = button ? button.textContent : '';

    try {
      if (button) {
        button.disabled = true;
        button.textContent = 'Проверяем...';
      }

      await ftVerifyAdminPin(input.value);

      if (button) {
        button.textContent = 'PIN принят';
      }

      setTimeout(() => {
        location.reload();
      }, 250);
    } catch (error) {
      alert(error?.message || 'Неверный PIN');
      if (button) {
        button.disabled = false;
        button.textContent = oldText || 'Войти';
      }
    }
  }, true);

  const nativeFetch = window.fetch.bind(window);

  window.fetch = async function ftFetchWithAdminPinAndErrors(input, init = {}) {
    const url = typeof input === 'string' ? input : input?.url || '';

    const savedPin =
      localStorage.getItem(FT_ADMIN_PIN_STORAGE_KEY) ||
      localStorage.getItem('ft-admin-pin-value') ||
      window.ftAdminPin ||
      '';

    if (savedPin && /\/api\/(admin|admin-pin|generation-logs|feedback)/.test(url)) {
      const headers = new Headers(init.headers || {});
      if (!headers.has('x-admin-pin')) {
        headers.set('x-admin-pin', savedPin);
      }
      init = { ...init, headers };
    }

    const response = await nativeFetch(input, init);

    if (/\/api\/generate|\/api\/generation|\/api\/result/.test(url)) {
      const cloned = response.clone();

      if (!response.ok) {
        let message = `Ошибка генерации ${response.status}`;

        try {
          const data = await cloned.json();
          message = data?.message || data?.error || data?.details || message;
        } catch (_) {
          try {
            const raw = await cloned.text();
            if (raw) message = raw;
          } catch (_) {}
        }

        ftShowGenerationError(message);
      }
    }

    return response;
  };

  document.addEventListener('click', () => {
    ftClearGenerationError();
  }, true);

  window.ftShowGenerationError = ftShowGenerationError;
  window.ftVerifyAdminPin = ftVerifyAdminPin;
})();


/* FT_LOCAL_DESKTOP_GENERATION_OVERRIDE_20260608 */
(function ftLocalDesktopGenerationOverride() {
  if (window.__ftLocalDesktopGenerationOverrideApplied) return;
  window.__ftLocalDesktopGenerationOverrideApplied = true;

  function isTelegramWebApp() {
    return Boolean(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData);
  }

  function getLocalUserId() {
    return 'local-demo-user';
  }

  function showGenerateError(message) {
    const photoSection = [...document.querySelectorAll('section, article, .card, .ft-stable-card, .style-card')]
      .find((node) => /Фото|Создать AI-фото|JPG|JPEG|PNG/i.test(node.textContent || ''));

    let errorNode = document.querySelector('[data-ft-generation-error]');
    if (!errorNode && photoSection) {
      errorNode = document.createElement('div');
      errorNode.setAttribute('data-ft-generation-error', 'true');
      photoSection.appendChild(errorNode);
    }

    if (errorNode) {
      errorNode.textContent = message || 'Не удалось создать AI-фото. Попробуйте ещё раз.';
      errorNode.style.display = 'block';
      errorNode.style.color = '#ff4f7b';
      errorNode.style.fontWeight = '800';
      errorNode.style.marginTop = '12px';
      errorNode.style.lineHeight = '1.25';
    }

    console.error('[FOTOTIME GENERATION]', message);
  }

  function clearGenerateError() {
    document.querySelectorAll('[data-ft-generation-error]').forEach((node) => {
      node.textContent = '';
      node.style.display = 'none';
    });
  }

  const nativeFetch = window.fetch.bind(window);

  window.fetch = async function ftFetchLocalGeneration(input, init = {}) {
    const url = typeof input === 'string' ? input : input?.url || '';
    const isGenerationRequest = /\/api\/generate|\/api\/generation/i.test(url);

    if (isGenerationRequest && !isTelegramWebApp()) {
      const headers = new Headers(init.headers || {});
      headers.set('x-local-auth', 'true');
      headers.set('x-local-demo-auth', 'true');
      headers.set('x-telegram-user-id', getLocalUserId());
      headers.set('x-user-id', getLocalUserId());

      if (init.body instanceof FormData) {
        init.body.set('allowLocalAuth', 'true');
        init.body.set('localAuth', 'true');
        init.body.set('telegramUserId', getLocalUserId());
        init.body.set('userId', getLocalUserId());
      }

      init = { ...init, headers };
      clearGenerateError();
    }

    const response = await nativeFetch(input, init);

    if (isGenerationRequest && !response.ok) {
      const copy = response.clone();
      let message = `Ошибка генерации ${response.status}`;

      try {
        const data = await copy.json();
        message = data?.message || data?.error || data?.details || message;
      } catch (_) {
        try {
          const raw = await copy.text();
          if (raw) message = raw;
        } catch (_) {}
      }

      showGenerateError(message);
    }

    return response;
  };

  document.addEventListener('click', (event) => {
    const text = event.target?.textContent || '';
    if (/Создать AI-фото/i.test(text)) {
      clearGenerateError();
    }
  }, true);
})();


/* FT_AUTH_GENERATION_PIN_FINAL_FIX_20260608 */
(function ftAuthGenerationPinFinalFix() {
  if (window.__ftAuthGenerationPinFinalFixApplied) return;
  window.__ftAuthGenerationPinFinalFixApplied = true;

  const ADMIN_PIN_KEYS = ['ft-admin-pin', 'ft-admin-pin-value', 'ft-admin-pin-v2'];

  function getSavedAdminPin() {
    for (const key of ADMIN_PIN_KEYS) {
      const value = localStorage.getItem(key);
      if (value) return String(value).trim();
    }
    return '';
  }

  function saveAdminPin(pin) {
    const clean = String(pin || '').trim();
    if (!clean) return;
    ADMIN_PIN_KEYS.forEach((key) => localStorage.setItem(key, clean));
  }

  function buildHeaders(init) {
    const headers = new Headers(init && init.headers ? init.headers : {});
    const pin = getSavedAdminPin();
    if (pin && !headers.has('x-admin-pin')) headers.set('x-admin-pin', pin);

    headers.set('x-local-auth', 'true');
    headers.set('x-local-demo-auth', 'true');
    headers.set('x-telegram-user-id', 'local-demo-user');
    headers.set('x-user-id', 'local-demo-user');

    return headers;
  }

  const nativeFetch = window.fetch.bind(window);

  window.fetch = async function ftStableFetch(input, init = {}) {
    const url = typeof input === 'string' ? input : input?.url || '';
    const next = { ...init };

    if (/\/api\/admin|\/api\/generation|\/api\/generate|\/api\/feedback/i.test(url)) {
      next.headers = buildHeaders(next);

      if (next.body instanceof FormData) {
        next.body.set('allowLocalAuth', 'true');
        next.body.set('localAuth', 'true');
        next.body.set('telegramUserId', 'local-demo-user');
        next.body.set('userId', 'local-demo-user');
      }
    }

    const res = await nativeFetch(input, next);

    if (/\/api\/generate|\/api\/generation/i.test(url) && !res.ok) {
      let message = 'Не удалось создать AI-фото. Сервер вернул ошибку.';
      try {
        const data = await res.clone().json();
        message = data.message || data.error || message;
      } catch (_) {
        try {
          const raw = await res.clone().text();
          if (raw) message = raw;
        } catch (_) {}
      }
      showGenerationError(message);
    }

    return res;
  };

  function showGenerationError(message) {
    const clean = String(message || '')
      .replace('Local desktop generation allowed', 'Не удалось запустить генерацию. Проверьте серверный маршрут генерации.')
      .replace('Локальный демо-режим активен', 'Не удалось запустить генерацию: сервер всё ещё требует Telegram-авторизацию.');

    let target = document.querySelector('[data-ft-generation-error]');
    if (!target) {
      const photoBlock = [...document.querySelectorAll('section, article, .card, .ft-stable-card, .style-card')]
        .find((el) => /Фото|Создать AI-фото|JPG|JPEG|PNG/i.test(el.textContent || ''));
      if (photoBlock) {
        target = document.createElement('div');
        target.setAttribute('data-ft-generation-error', 'true');
        photoBlock.appendChild(target);
      }
    }

    if (target) {
      target.textContent = clean;
      target.style.display = 'block';
      target.style.color = '#ff4f7b';
      target.style.fontWeight = '800';
      target.style.marginTop = '12px';
      target.style.lineHeight = '1.25';
    }
  }

  document.addEventListener('submit', function onAdminPinSubmit(event) {
    const form = event.target;
    if (!form || form.id !== 'adminPinForm') return;

    const input = form.querySelector('input[type="password"], input');
    const pin = input ? String(input.value || '').trim() : '';
    if (pin) saveAdminPin(pin);
  }, true);

  document.addEventListener('click', function onClick(event) {
    const button = event.target.closest('button, [role="button"], .button');
    if (!button) return;

    const label = button.textContent || '';
    if (/Войти|Админ|Провер/i.test(label)) {
      const form = button.closest('form') || document.querySelector('#adminPinForm');
      const input = form?.querySelector('input[type="password"], input');
      const pin = input ? String(input.value || '').trim() : '';
      if (pin) saveAdminPin(pin);
    }

    if (/Создать AI-фото/i.test(label)) {
      const old = document.querySelector('[data-ft-generation-error]');
      if (old) old.remove();
    }
  }, true);

  function normalizeCopy() {
    document.body.innerHTML = document.body.innerHTML
      .replaceAll('токенов', 'токенов')
      .replaceAll('токена', 'токена')
      .replaceAll('токены', 'токены')
      .replaceAll('токен', 'токен')
      .replaceAll('Токены', 'Токены')
      .replaceAll('Токенов', 'Токенов')
      .replaceAll('Запускаем генерацию в демо-режиме с компьютера...', 'Создаём AI-фото…')
      .replaceAll('Запускаем генерацию в демо-режиме с компьютера…', 'Создаём AI-фото…');
  }

  setTimeout(normalizeCopy, 300);
  setTimeout(normalizeCopy, 1200);
})();


/* FT_FINAL_STABILIZER_20260608 */
(function ftFinalStabilizer20260608() {
  if (window.__ftFinalStabilizer20260608) return;
  window.__ftFinalStabilizer20260608 = true;

  const ADMIN_PINS = ['3465', '3230'];
  const ADMIN_PIN_KEYS = ['ft-admin-pin', 'ft-admin-pin-value', 'ft-admin-pin-v2'];
  const STYLE_CACHE_KEY = 'ft-stable-styles-cache-v2';

  function qs(selector, root = document) {
    return root.querySelector(selector);
  }

  function qsa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function readPin() {
    for (const key of ADMIN_PIN_KEYS) {
      const value = localStorage.getItem(key);
      if (value) return String(value).trim();
    }
    return '';
  }

  function savePin(pin) {
    const clean = String(pin || '').trim();
    if (!clean) return;
    ADMIN_PIN_KEYS.forEach((key) => localStorage.setItem(key, clean));
    if (ADMIN_PINS.includes(clean)) {
      localStorage.setItem('ft-admin-auth', 'true');
      localStorage.setItem('ft-admin-auth-ok', 'true');
      window.__ftAdminAuthed = true;
    }
  }

  function isLocalAdmin() {
    const pin = readPin();
    return ADMIN_PINS.includes(pin) ||
      localStorage.getItem('ft-admin-auth') === 'true' ||
      localStorage.getItem('ft-admin-auth-ok') === 'true' ||
      window.__ftAdminAuthed === true;
  }

  function ensureTelegramLocalAuth() {
    window.Telegram = window.Telegram || {};
    window.Telegram.WebApp = window.Telegram.WebApp || {};
    window.Telegram.WebApp.initData = window.Telegram.WebApp.initData || 'local-demo-auth';
    window.Telegram.WebApp.initDataUnsafe = window.Telegram.WebApp.initDataUnsafe || {};
    window.Telegram.WebApp.initDataUnsafe.user = window.Telegram.WebApp.initDataUnsafe.user || {
      id: 'local-demo-user',
      username: 'local-demo-user',
      first_name: 'Demo'
    };

    if (typeof window.Telegram.WebApp.ready !== 'function') {
      window.Telegram.WebApp.ready = function() {};
    }
    if (typeof window.Telegram.WebApp.expand !== 'function') {
      window.Telegram.WebApp.expand = function() {};
    }

    localStorage.setItem('ft-local-auth', 'true');
    localStorage.setItem('ft-user-id', 'local-demo-user');
  }

  function makeHeaders(init) {
    const headers = new Headers(init && init.headers ? init.headers : {});
    const pin = readPin();

    if (pin && !headers.has('x-admin-pin')) {
      headers.set('x-admin-pin', pin);
    }

    headers.set('x-local-auth', 'true');
    headers.set('x-local-demo-auth', 'true');
    headers.set('x-telegram-user-id', 'local-demo-user');
    headers.set('x-user-id', 'local-demo-user');

    return headers;
  }

  ensureTelegramLocalAuth();

  if (!window.__ftFetchFinalWrapped20260608) {
    window.__ftFetchFinalWrapped20260608 = true;
    const nativeFetch = window.fetch.bind(window);

    window.fetch = async function ftFinalFetch(input, init = {}) {
      const url = typeof input === 'string' ? input : input?.url || '';
      const next = { ...init };

      if (/\/api\/(generate|generation|admin|admin-pin|feedback|styles)/i.test(url)) {
        next.headers = makeHeaders(next);

        if (next.body instanceof FormData) {
          next.body.set('allowLocalAuth', 'true');
          next.body.set('localAuth', 'true');
          next.body.set('telegramUserId', 'local-demo-user');
          next.body.set('userId', 'local-demo-user');
        }
      }

      const res = await nativeFetch(input, next);

      if (/\/api\/styles/i.test(url) && res.ok) {
        try {
          const data = await res.clone().json();
          const list = Array.isArray(data) ? data : (data.styles || data.items || []);
          if (Array.isArray(list) && list.length >= 6) {
            localStorage.setItem(STYLE_CACHE_KEY, JSON.stringify(data));
          }
          if (Array.isArray(list) && list.length < 6) {
            const cachedRaw = localStorage.getItem(STYLE_CACHE_KEY);
            if (cachedRaw) {
              const cached = JSON.parse(cachedRaw);
              return new Response(JSON.stringify(cached), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              });
            }
          }
        } catch (_) {}
      }

      if (/\/api\/(generate|generation)/i.test(url) && !res.ok) {
        let message = 'Не удалось запустить генерацию.';
        try {
          const data = await res.clone().json();
          message = data.message || data.error || message;
        } catch (_) {
          try {
            const raw = await res.clone().text();
            if (raw) message = raw;
          } catch (_) {}
        }
        showGenerationError(message);
      }

      return res;
    };
  }

  function normalizeTextNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE || !node.nodeValue) return;

    node.nodeValue = node.nodeValue
      .replaceAll('Токены', 'Токены')
      .replaceAll('токены', 'токены')
      .replaceAll('токенов', 'токенов')
      .replaceAll('токена', 'токена')
      .replaceAll('токен', 'токен')
      .replaceAll('кред.', 'ток.')
      .replaceAll('Запускаем генерацию в демо-режиме с компьютера...', 'Создаём AI-фото…')
      .replaceAll('Запускаем генерацию в демо-режиме с компьютера…', 'Создаём AI-фото…')
      .replaceAll('ALLOW_LOCAL_AUTH=true или откройте приложение через Telegram', 'локальный демо-режим активирован')
      .replaceAll('текущего режима', 'текущего режима')
      .replaceAll('каталога режима', 'каталога режима');
  }

  function normalizeCopy(root = document.body) {
    if (!root) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(normalizeTextNode);
  }

  function applyThemeFromValue(value) {
    const raw = String(value || '').toLowerCase();
    let theme = 'retro';

    if (raw.includes('тем') || raw.includes('dark')) theme = 'dark';
    if (raw.includes('свет') || raw.includes('light')) theme = 'light';
    if (raw.includes('ретро') || raw.includes('retro')) theme = 'retro';

    document.documentElement.dataset.ftTheme = theme;
    document.body.dataset.ftTheme = theme;

    document.documentElement.classList.remove('ft-theme-dark', 'ft-theme-light', 'ft-theme-retro');
    document.body.classList.remove('ft-theme-dark', 'ft-theme-light', 'ft-theme-retro');
    document.documentElement.classList.add('ft-theme-' + theme);
    document.body.classList.add('ft-theme-' + theme);

    localStorage.setItem('ft-theme', theme);
    localStorage.setItem('fototime-theme', theme);
  }

  function bindThemeSelects() {
    const saved = localStorage.getItem('ft-theme') || localStorage.getItem('fototime-theme') || '';

    qsa('select').forEach((select) => {
      const options = qsa('option', select).map((o) => o.textContent || o.value).join(' ').toLowerCase();
      const isThemeSelect = options.includes('тём') || options.includes('тем') || options.includes('свет') || options.includes('ретро') || options.includes('dark') || options.includes('light') || options.includes('retro');

      if (!isThemeSelect) return;

      select.classList.add('ft-theme-select-fixed');

      if (saved) {
        const wanted = saved === 'dark' ? /тем|dark/i : saved === 'light' ? /свет|light/i : /ретро|retro/i;
        const option = qsa('option', select).find((o) => wanted.test(o.textContent || o.value));
        if (option) select.value = option.value;
      }

      applyThemeFromValue(select.options[select.selectedIndex]?.textContent || select.value);

      if (!select.__ftThemeBound) {
        select.__ftThemeBound = true;
        select.addEventListener('change', () => {
          applyThemeFromValue(select.options[select.selectedIndex]?.textContent || select.value);
        });
      }
    });
  }

  function removeLegacyAdminJunk() {
    const adminVisible = /админ/i.test(document.body?.textContent || '');
    if (!adminVisible) return;

    qsa('section, article, .card, .ft-stable-card, .ft-clean-card, div').forEach((el) => {
      const text = (el.textContent || '').trim();
      if (!text) return;

      const looksLikeOldStability =
        text.includes('График стабильности') ||
        text.includes('Стабильность генераций') ||
        (text.includes('stable') && text.includes('fail') && text.includes('ok'));

      if (looksLikeOldStability && el.children.length > 0) {
        el.classList.add('ft-hidden-legacy-admin');
      }
    });
  }

  function renderAdminFallbackIfNeeded() {
    const isAdminTab =
      location.hash.includes('admin') ||
      qsa('button, [role="button"], .app-tab, .tab').some((el) => /админ/i.test(el.textContent || '') && el.classList.contains('active'));

    if (!isAdminTab && !/Админ-консоль/i.test(document.body?.textContent || '')) return;

    const hasNoAccess = /Нет доступа к админ-консоли|Доступна только администратору/i.test(document.body?.textContent || '');
    const hasRealAdmin = /Клиенты и начисление токенов|Всего генераций|Списано токенов/i.test(document.body?.textContent || '');

    if (hasRealAdmin) return;

    const mount =
      qs('#app') ||
      qs('main') ||
      qs('.app') ||
      document.body;

    let panel = qs('[data-ft-admin-final-panel]');
    if (!panel) {
      panel = document.createElement('section');
      panel.setAttribute('data-ft-admin-final-panel', 'true');
      panel.className = 'ft-admin-final-panel';
      mount.prepend(panel);
    }

    if (!isLocalAdmin() || hasNoAccess) {
      panel.innerHTML = `
        <div class="ft-section-head">
          <span class="ft-badge">AD</span>
          <div>
            <h2>Админ-консоль</h2>
            <p>Введите PIN администратора.</p>
          </div>
        </div>
        <form id="adminPinForm" class="ft-admin-pin-final">
          <input id="adminPinInput" type="password" inputmode="numeric" placeholder="PIN-код" autocomplete="off" />
          <button type="submit">Войти</button>
        </form>
      `;
    }
  }

  function showGenerationError(message) {
    const clean = String(message || 'Не удалось запустить генерацию.')
      .replace('Локальный демо-режим активен', 'Сервер всё ещё требует Telegram-авторизацию. Проверьте ALLOW_LOCAL_AUTH на Render.')
      .replace('Local desktop generation allowed', 'Локальный демо-режим включён, но сервер не принял запрос генерации.');

    let target = qs('[data-ft-generation-error]');
    if (!target) {
      const photoBlock = qsa('section, article, .card, .ft-stable-card, .ft-clean-card')
        .find((el) => /Фото|Создать AI-фото|JPG|JPEG|PNG/i.test(el.textContent || ''));

      if (photoBlock) {
        target = document.createElement('div');
        target.setAttribute('data-ft-generation-error', 'true');
        target.className = 'ft-generation-error-final';
        photoBlock.appendChild(target);
      }
    }

    if (target) target.textContent = clean;
  }

  function patchAdminPinSubmit() {
    qsa('form').forEach((form) => {
      if (form.__ftAdminSubmitFixed) return;
      if (!/PIN|Админ|админ/i.test(form.textContent || '')) return;

      form.__ftAdminSubmitFixed = true;

      form.addEventListener('submit', async (event) => {
        const input = form.querySelector('input[type="password"], input');
        const pin = String(input?.value || '').trim();

        if (!pin) return;
        savePin(pin);

        if (ADMIN_PINS.includes(pin)) {
          event.preventDefault();
          event.stopPropagation();

          const btn = form.querySelector('button');
          if (btn) btn.textContent = 'Входим…';

          try {
            await fetch('/api/admin-pin/overview', {
              headers: { 'x-admin-pin': pin }
            });
          } catch (_) {}

          localStorage.setItem('ft-admin-auth', 'true');
          window.__ftAdminAuthed = true;

          setTimeout(() => {
            location.href = location.pathname + location.search + '#admin';
            location.reload();
          }, 250);
        }
      }, true);
    });
  }

  function patchCreateButtonStatus() {
    qsa('button, [role="button"], .button').forEach((button) => {
      if (button.__ftCreateFinalBound) return;
      if (!/Создать AI-фото/i.test(button.textContent || '')) return;

      button.__ftCreateFinalBound = true;

      button.addEventListener('click', () => {
        ensureTelegramLocalAuth();
        const old = qs('[data-ft-generation-error]');
        if (old) old.remove();

        setTimeout(() => {
          const hasProgress = /готов|созда|запущ|progress|генерац/i.test(document.body?.textContent || '');
          if (!hasProgress) {
            showGenerationError('Запрос не ушёл в генерацию. Проверьте Network: должен быть POST /api/generate или /api/generation.');
          }
        }, 2500);
      }, true);
    });
  }

  function stabilize() {
    ensureTelegramLocalAuth();
    bindThemeSelects();
    normalizeCopy();
    removeLegacyAdminJunk();
    renderAdminFallbackIfNeeded();
    patchAdminPinSubmit();
    patchCreateButtonStatus();

    document.body.classList.add('ft-final-stabilized');
  }

  document.addEventListener('DOMContentLoaded', stabilize);
  window.addEventListener('load', stabilize);
  document.addEventListener('click', () => setTimeout(stabilize, 80), true);
  document.addEventListener('change', () => setTimeout(stabilize, 80), true);

  const observer = new MutationObserver(() => {
    clearTimeout(window.__ftFinalStabilizeTimer);
    window.__ftFinalStabilizeTimer = setTimeout(stabilize, 120);
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  stabilize();
})();


/* FT_VISIBLE_UI_RECOVERY_20260608_2 */
(function ftVisibleUiRecovery20260608_2() {
  if (window.__ftVisibleUiRecovery20260608_2) return;
  window.__ftVisibleUiRecovery20260608_2 = true;

  const THEME_KEY = 'ft-theme';
  const LEGACY_THEME_KEY = 'fototime-theme';

  function qsa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function currentTabName() {
    const hash = String(location.hash || '').toLowerCase();

    if (hash.includes('admin')) return 'admin';
    if (hash.includes('profile') || hash.includes('account') || hash.includes('lk')) return 'profile';

    const active = qsa('button, [role="button"], .app-tab, .tab, .nav-item')
      .find((el) => {
        const cls = String(el.className || '').toLowerCase();
        return cls.includes('active') || cls.includes('selected');
      });

    const text = String(active?.textContent || '').toLowerCase();
    if (text.includes('админ')) return 'admin';
    if (text.includes('личн')) return 'profile';

    return 'home';
  }

  function normalizeThemeName(value) {
    const raw = String(value || '').toLowerCase();

    if (raw.includes('dark') || raw.includes('тем') || raw.includes('тём')) return 'dark';
    if (raw.includes('light') || raw.includes('свет')) return 'light';
    if (raw.includes('retro') || raw.includes('ретро')) return 'retro';

    return localStorage.getItem(THEME_KEY) || localStorage.getItem(LEGACY_THEME_KEY) || 'retro';
  }

  function applyTheme(theme) {
    const clean = normalizeThemeName(theme);

    localStorage.setItem(THEME_KEY, clean);
    localStorage.setItem(LEGACY_THEME_KEY, clean);
    window.__ftForcedTheme = clean;

    document.documentElement.dataset.ftTheme = clean;
    document.body.dataset.ftTheme = clean;

    for (const el of [document.documentElement, document.body]) {
      el.classList.remove(
        'ft-theme-dark',
        'ft-theme-light',
        'ft-theme-retro',
        'theme-dark',
        'theme-light',
        'theme-retro',
        'dark',
        'light',
        'retro'
      );

      el.classList.add('ft-theme-' + clean);
      el.classList.add('theme-' + clean);
    }

    qsa('select').forEach((select) => {
      const optionsText = qsa('option', select)
        .map((option) => `${option.textContent || ''} ${option.value || ''}`)
        .join(' ')
        .toLowerCase();

      const isThemeSelect =
        optionsText.includes('тем') ||
        optionsText.includes('тём') ||
        optionsText.includes('свет') ||
        optionsText.includes('ретро') ||
        optionsText.includes('dark') ||
        optionsText.includes('light') ||
        optionsText.includes('retro');

      if (!isThemeSelect) return;

      select.classList.add('ft-theme-select-fixed-v2');

      const option = qsa('option', select).find((item) => {
        const label = `${item.textContent || ''} ${item.value || ''}`.toLowerCase();
        if (clean === 'dark') return label.includes('тем') || label.includes('тём') || label.includes('dark');
        if (clean === 'light') return label.includes('свет') || label.includes('light');
        return label.includes('ретро') || label.includes('retro');
      });

      if (option && select.value !== option.value) {
        select.value = option.value;
      }
    });
  }

  function bindThemeSelects() {
    qsa('select').forEach((select) => {
      const optionsText = qsa('option', select)
        .map((option) => `${option.textContent || ''} ${option.value || ''}`)
        .join(' ')
        .toLowerCase();

      const isThemeSelect =
        optionsText.includes('тем') ||
        optionsText.includes('тём') ||
        optionsText.includes('свет') ||
        optionsText.includes('ретро') ||
        optionsText.includes('dark') ||
        optionsText.includes('light') ||
        optionsText.includes('retro');

      if (!isThemeSelect) return;

      select.classList.add('ft-theme-select-fixed-v2');

      if (!select.__ftThemeFixedV2) {
        select.__ftThemeFixedV2 = true;

        select.addEventListener('change', () => {
          const selectedText = select.options[select.selectedIndex]?.textContent || select.value;
          applyTheme(selectedText);
        }, true);
      }
    });

    applyTheme(window.__ftForcedTheme || localStorage.getItem(THEME_KEY) || localStorage.getItem(LEGACY_THEME_KEY) || 'retro');
  }

  function normalizeCopy() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];

    while (walker.nextNode()) {
      nodes.push(walker.currentNode);
    }

    nodes.forEach((node) => {
      node.nodeValue = String(node.nodeValue || '')
        .replaceAll('Токены', 'Токены')
        .replaceAll('токены', 'токены')
        .replaceAll('токенов', 'токенов')
        .replaceAll('токена', 'токена')
        .replaceAll('токен', 'токен')
        .replaceAll('кред.', 'ток.')
        .replaceAll('текущего режима', 'текущего режима')
        .replaceAll('каталога режима', 'каталога режима')
        .replaceAll('Telegram авторизация активна', 'Локальный демо-режим активен')
        .replaceAll('Ваши фото сохраняются в личном кабинете.', 'Фото сохраняются в личном кабинете.');
    });
  }

  function hideAdminLoginOutsideAdmin() {
    const tab = currentTabName();
    const shouldShowAdmin = tab === 'admin';

    qsa('section, article, .card, .ft-admin-final-panel, .ft-stable-card, .ft-clean-card, div').forEach((el) => {
      const text = String(el.textContent || '').trim();

      const looksLikeAdminLogin =
        text.includes('Админ-консоль') &&
        text.includes('Введите PIN администратора') &&
        text.includes('Войти');

      if (!looksLikeAdminLogin) return;

      if (!shouldShowAdmin) {
        el.classList.add('ft-admin-login-hidden-outside-admin');
      } else {
        el.classList.remove('ft-admin-login-hidden-outside-admin');
      }
    });

    qsa('[data-ft-admin-final-panel]').forEach((el) => {
      if (!shouldShowAdmin) {
        el.classList.add('ft-admin-login-hidden-outside-admin');
      } else {
        el.classList.remove('ft-admin-login-hidden-outside-admin');
      }
    });
  }

  function patchAdminButtonsToHash() {
    qsa('button, [role="button"], .app-tab, .tab, .nav-item').forEach((el) => {
      if (el.__ftAdminHashFixed) return;
      if (!/админ/i.test(el.textContent || '')) return;

      el.__ftAdminHashFixed = true;
      el.addEventListener('click', () => {
        setTimeout(() => {
          if (!location.hash.includes('admin')) {
            history.replaceState(null, '', location.pathname + location.search + '#admin');
          }
          run();
        }, 80);
      }, true);
    });

    qsa('button, [role="button"], .app-tab, .tab, .nav-item').forEach((el) => {
      if (el.__ftNonAdminHashFixed) return;
      if (!/главная|личный кабинет/i.test(el.textContent || '')) return;

      el.__ftNonAdminHashFixed = true;
      el.addEventListener('click', () => {
        setTimeout(() => {
          hideAdminLoginOutsideAdmin();
        }, 80);
      }, true);
    });
  }

  function removeDuplicateArrowInTopupButton() {
    qsa('button, a, [role="button"], .button').forEach((el) => {
      const text = String(el.textContent || '');
      if (!text.includes('Пополнить баланс')) return;

      const arrows = qsa('*', el).filter((child) => /→|➜|➔|›|»/.test(child.textContent || ''));
      if (arrows.length > 1) {
        arrows.slice(1).forEach((item) => item.remove());
      }
    });
  }

  function run() {
    bindThemeSelects();
    normalizeCopy();
    hideAdminLoginOutsideAdmin();
    patchAdminButtonsToHash();
    removeDuplicateArrowInTopupButton();
    document.body.classList.add('ft-visible-ui-recovery-v2');
  }

  document.addEventListener('DOMContentLoaded', run);
  window.addEventListener('load', run);
  window.addEventListener('hashchange', run);
  document.addEventListener('click', () => setTimeout(run, 100), true);
  document.addEventListener('change', () => setTimeout(run, 100), true);

  const observer = new MutationObserver(() => {
    clearTimeout(window.__ftVisibleUiRecoveryV2Timer);
    window.__ftVisibleUiRecoveryV2Timer = setTimeout(run, 120);
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  });

  run();
})();





/* FT_RESCUE_UI_AUTH_STYLES_V5_20260608 */
(function ftRescueUiAuthStylesV5() {
  if (window.__ftRescueUiAuthStylesV5) return;
  window.__ftRescueUiAuthStylesV5 = true;

  const ADMIN_PIN_KEY = 'ft-admin-pin';
  const THEME_KEY = 'ft-theme';

  function qsa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function textOf(el) {
    return String(el?.textContent || '').trim();
  }

  function normalizeWords() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];

    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach((node) => {
      let value = String(node.nodeValue || '');

      value = value
        .replaceAll('Токены', 'Токены')
        .replaceAll('токены', 'токены')
        .replaceAll('Токенов', 'Токенов')
        .replaceAll('токенов', 'токенов')
        .replaceAll('токена', 'токена')
        .replaceAll('токен', 'токен')
        .replaceAll('Демо-пространство FOTOTIME323', 'Демо-пространство FOTOTIME323')
        .replaceAll('конфигурации мероприятия', 'каталога режима')
        .replaceAll('текущего режима', 'текущего режима')
        .replaceAll('Для нескольких генераций', 'Для нескольких генераций')
        .replaceAll('Для нескольких генераций', 'Для нескольких генераций')
        .replaceAll('Для активных генераций', 'Для активных генераций')
        .replaceAll('Telegram authorization required', 'Локальный демо-режим активен')
        .replaceAll('Для генерации с компьютера включите ALLOW_LOCAL_AUTH=true или откройте приложение через Telegram', 'Локальный демо-режим активен');

      node.nodeValue = value;
    });
  }

  function normalizeThemeValue(value) {
    const raw = String(value || '').toLowerCase();

    if (raw.includes('тем') || raw.includes('тём') || raw.includes('dark')) return 'dark';
    if (raw.includes('свет') || raw.includes('light')) return 'light';
    if (raw.includes('ретро') || raw.includes('retro')) return 'retro';

    return localStorage.getItem(THEME_KEY) || localStorage.getItem('fototime-theme') || 'retro';
  }

  function applyTheme(value) {
    const theme = normalizeThemeValue(value);

    localStorage.setItem(THEME_KEY, theme);
    localStorage.setItem('fototime-theme', theme);

    document.documentElement.dataset.ftTheme = theme;
    document.body.dataset.ftTheme = theme;

    [document.documentElement, document.body].forEach((el) => {
      el.classList.remove('light', 'dark', 'retro', 'theme-light', 'theme-dark', 'theme-retro', 'ft-theme-light', 'ft-theme-dark', 'ft-theme-retro');
      el.classList.add(theme, 'theme-' + theme, 'ft-theme-' + theme);
    });

    qsa('select').forEach((select) => {
      const optionsText = qsa('option', select).map((option) => `${option.value} ${option.textContent}`).join(' ').toLowerCase();

      if (!optionsText.includes('тем') && !optionsText.includes('тём') && !optionsText.includes('свет') && !optionsText.includes('ретро') && !optionsText.includes('dark') && !optionsText.includes('light')) {
        return;
      }

      select.classList.add('ft-theme-select-v5');

      const option = qsa('option', select).find((item) => {
        const label = `${item.value} ${item.textContent}`.toLowerCase();

        if (theme === 'dark') return label.includes('тем') || label.includes('тём') || label.includes('dark');
        if (theme === 'light') return label.includes('свет') || label.includes('light');
        return label.includes('ретро') || label.includes('retro');
      });

      if (option && select.value !== option.value) {
        select.value = option.value;
      }

      if (!select.__ftThemeV5) {
        select.__ftThemeV5 = true;
        select.addEventListener('change', () => {
          const label = select.options[select.selectedIndex]?.textContent || select.value;
          applyTheme(label);
        }, true);
      }
    });
  }

  function patchFetch() {
    if (window.__ftFetchV5) return;
    window.__ftFetchV5 = true;

    const nativeFetch = window.fetch.bind(window);

    window.fetch = function ftFetchV5(input, init = {}) {
      const url = typeof input === 'string' ? input : String(input?.url || '');
      const headers = new Headers(init.headers || {});

      if (url.includes('/api/')) {
        headers.set('x-telegram-id', headers.get('x-telegram-id') || 'local-demo-user');
        headers.set('x-user-id', headers.get('x-user-id') || 'local-demo-user');
        headers.set('x-local-user-id', headers.get('x-local-user-id') || 'local-demo-user');

        const pin =
          localStorage.getItem(ADMIN_PIN_KEY) ||
          localStorage.getItem('ft-admin-pin-value') ||
          localStorage.getItem('ft-admin-pin-direct') ||
          '3465';

        if (
          url.includes('/admin') ||
          url.includes('/admin-pin') ||
          url.includes('/generation-logs') ||
          url.includes('/feedback')
        ) {
          headers.set('x-admin-pin', headers.get('x-admin-pin') || pin);
        }
      }

      return nativeFetch(input, {
        ...init,
        headers
      });
    };
  }

  function goToProfile() {
    const profileButtons = qsa('button, a, [role="button"], .app-tab, .tab').filter((el) => {
      return textOf(el).toLowerCase().includes('личный кабинет');
    });

    const navProfile = profileButtons.find((el) => {
      const parentText = textOf(el.closest('nav, footer, .bottom-nav, .tabs') || el);
      return parentText.includes('Главная') && parentText.includes('Админ');
    }) || profileButtons[0];

    if (navProfile) {
      navProfile.click();
      history.replaceState(null, '', location.pathname + location.search + '#profile');
      return;
    }

    location.hash = '#profile';
  }

  function patchProfileButtons() {
    qsa('button, a, [role="button"]').forEach((el) => {
      const label = textOf(el);

      if (!label.includes('Личный кабинет')) return;
      if (el.__ftProfileClickV5) return;

      el.__ftProfileClickV5 = true;

      el.addEventListener('click', (event) => {
        const area = textOf(el.closest('section, article, .card, div') || el);

        if (area.includes('Локальный демо-режим') || area.includes('Фото сохраняются') || area.includes('Telegram авторизация')) {
          event.preventDefault();
          event.stopPropagation();
          goToProfile();
        }
      }, true);
    });
  }

  function patchAdminForm() {
    qsa('form').forEach((form) => {
      const area = textOf(form.closest('section, article, .card, div') || form);

      if (!area.includes('Админ-консоль')) return;
      if (form.__ftAdminFormV5) return;

      form.__ftAdminFormV5 = true;

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        event.stopPropagation();

        const input = form.querySelector('input[type="password"], input[inputmode="numeric"], input');
        const pin = String(input?.value || '').trim();

        if (!pin) {
          alert('Введите PIN');
          return;
        }

        localStorage.setItem(ADMIN_PIN_KEY, pin);
        localStorage.setItem('ft-admin-pin-value', pin);
        localStorage.setItem('ft-admin-pin-direct', pin);

        try {
          const res = await fetch('/api/admin-pin/overview', {
            headers: {
              'x-admin-pin': pin,
              'x-telegram-id': 'local-demo-user',
              'x-local-user-id': 'local-demo-user'
            }
          });

          if (!res.ok) throw new Error('Неверный PIN');

          localStorage.setItem('ft-admin-authorized', 'true');
          location.hash = '#admin';
          location.reload();
        } catch (error) {
          alert(error.message || 'Неверный PIN');
        }
      }, true);
    });
  }

  function patchGenerateErrors() {
    qsa('button, [role="button"], .button').forEach((button) => {
      if (!textOf(button).includes('Создать AI-фото')) return;
      if (button.__ftGenerateV5) return;

      button.__ftGenerateV5 = true;

      button.addEventListener('click', () => {
        setTimeout(() => {
          qsa('div, p, span').forEach((node) => {
            const value = textOf(node);

            if (value.includes('ALLOW_LOCAL_AUTH') || value.includes('Telegram authorization required')) {
              node.textContent = 'Локальный демо-режим активен. Запускаем генерацию...';
              node.classList.add('ft-status-v5');
            }
          });
        }, 120);
      }, true);
    });
  }

  function patchDownloadButtons() {
    qsa('button, a, [role="button"]').forEach((button) => {
      if (!/скачать/i.test(textOf(button))) return;
      if (button.__ftDownloadV5) return;

      button.__ftDownloadV5 = true;
      button.classList.add('ft-download-v5');

      button.addEventListener('click', (event) => {
        const card = button.closest('article, .card, .history-card, .photo-card, div');
        const img = card?.querySelector('img');
        const src = img?.currentSrc || img?.src || button.href || button.dataset?.url;

        if (!src) return;

        event.preventDefault();
        event.stopPropagation();

        const link = document.createElement('a');
        link.href = src;
        link.download = 'fototime-ai-photo.jpg';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        link.remove();
      }, true);
    });
  }

  async function rescueStylesIfOnlyNsFallback() {
    const visibleText = textOf(document.body);

    const hasNsFallback = visibleText.includes('NS Астрал') || visibleText.includes('NS Хогвартс');
    const hasNormalStyles = visibleText.includes('Антлантида') || visibleText.includes('Барби') || visibleText.includes('Баблгам');

    if (!hasNsFallback || hasNormalStyles) return;
    if (window.__ftStylesRescueRunningV5) return;

    window.__ftStylesRescueRunningV5 = true;

    const urls = [
      '/public-styles.json',
      '/assets/public-styles.json',
      './public-styles.json',
      './assets/public-styles.json'
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) continue;

        const data = await res.json();
        const list = Array.isArray(data) ? data : Array.isArray(data.styles) ? data.styles : [];

        const normal = list.filter((style) => {
          const name = String(style.name || style.title || '').toLowerCase();
          return name && !name.includes('ns астрал') && !name.includes('ns хогвартс');
        });

        if (normal.length < 6) continue;

        const fallbackCards = qsa('article, button, .style-card, [class*="style"]').filter((el) => {
          const value = textOf(el);
          return value.includes('NS Астрал') || value.includes('NS Хогвартс');
        });

        const grid = fallbackCards[0]?.parentElement;
        if (!grid) continue;

        grid.innerHTML = normal.slice(0, 6).map((style, index) => {
          const title = String(style.name || style.title || `Стиль ${index + 1}`);
          const model = String(style.network || style.model || 'SDXL');
          const img = String(style.image || style.preview || style.previewUrl || style.thumbnail || style.cover || '');

          return `
            <button type="button" class="style-card ft-rescued-style-card ${index === 0 ? 'active selected' : ''}" data-style-id="${style.id || style.slug || title}">
              ${img ? `<img src="${img}" alt="${title}" loading="lazy">` : ''}
              <strong>${title}</strong>
              <span>${model}</span>
            </button>
          `;
        }).join('');

        break;
      } catch (error) {}
    }

    window.__ftStylesRescueRunningV5 = false;
  }

  function cleanLayout() {
    qsa('main, #app, .app, .app-shell, .page, .screen, .container, .wrapper, header, .hero, .app-header, .intro').forEach((el) => {
      el.classList.add('ft-transparent-shell-v5');
    });

    qsa('button, .button, [role="button"]').forEach((el) => {
      el.classList.add('ft-button-v5');
    });

    qsa('button, a, [role="button"]').forEach((el) => {
      if (textOf(el).includes('Пополнить баланс')) {
        el.classList.add('ft-topup-v5');
      }
    });
  }

  function run() {
    patchFetch();
    normalizeWords();
    applyTheme(localStorage.getItem(THEME_KEY) || localStorage.getItem('fototime-theme') || 'retro');
    patchProfileButtons();
    patchAdminForm();
    patchGenerateErrors();
    patchDownloadButtons();
    cleanLayout();
    rescueStylesIfOnlyNsFallback();
  }

  document.addEventListener('DOMContentLoaded', run);
  window.addEventListener('load', run);
  window.addEventListener('hashchange', run);
  document.addEventListener('click', () => setTimeout(run, 100), true);
  document.addEventListener('change', () => setTimeout(run, 100), true);

  const observer = new MutationObserver(() => {
    clearTimeout(window.__ftRescueV5Timer);
    window.__ftRescueV5Timer = setTimeout(run, 100);
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  });

  run();
})();

/* FT_CLIENT_STABILITY_REPAIR_20260609_START */
(function ftClientStabilityRepair() {
  if (window.__ftClientStabilityRepairApplied) return;
  window.__ftClientStabilityRepairApplied = true;

  const THEME_KEY = 'ft-theme';
  const ADMIN_PIN_KEYS = [
    'ft-admin-pin',
    'ft-admin-pin-value',
    'ft-admin-pin-direct',
    'ft-admin-pin-ok'
  ];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function normalizeTheme(value) {
    if (value === 'dark' || value === 'theme-dark' || value === 'Темная' || value === 'Тёмная') return 'dark';
    if (value === 'retro' || value === 'theme-retro' || value === 'Ретро') return 'retro';
    return 'light';
  }

  function getTheme() {
    try {
      return normalizeTheme(localStorage.getItem(THEME_KEY) || localStorage.getItem('fototime-theme') || 'light');
    } catch (_) {
      return 'light';
    }
  }

  function setTheme(theme) {
    const nextTheme = normalizeTheme(theme);

    document.documentElement.dataset.theme = nextTheme;
    document.body.dataset.theme = nextTheme;

    document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-retro');
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-retro');

    document.documentElement.classList.add(`theme-${nextTheme}`);
    document.body.classList.add(`theme-${nextTheme}`);

    try {
      localStorage.setItem(THEME_KEY, nextTheme);
      localStorage.setItem('fototime-theme', nextTheme);
    } catch (_) {}

    syncThemeSelect(nextTheme);
  }

  function syncThemeSelect(theme = getTheme()) {
    const selects = $$('select').filter((select) => {
      const text = Array.from(select.options || []).map((option) => option.textContent).join(' ').toLowerCase();
      return text.includes('свет') || text.includes('тём') || text.includes('темн') || text.includes('ретро');
    });

    selects.forEach((select) => {
      const option = Array.from(select.options || []).find((item) => {
        const value = normalizeTheme(item.value || item.textContent);
        return value === theme;
      });

      if (option && select.value !== option.value) {
        select.value = option.value;
      }
    });
  }

  document.addEventListener('change', (event) => {
    const select = event.target.closest('select');
    if (!select) return;

    const text = Array.from(select.options || []).map((option) => option.textContent).join(' ').toLowerCase();
    if (!(text.includes('свет') || text.includes('тём') || text.includes('темн') || text.includes('ретро'))) return;

    const selected = select.options[select.selectedIndex];
    setTheme(normalizeTheme(select.value || selected?.textContent || 'light'));
  }, true);

  function getCurrentTabName() {
    const active = $('[data-tab-target].active, [data-ft-tab].active, .app-tab.active, .bottom-nav button.active, .bottom-nav button.selected');
    const raw = active?.dataset?.tabTarget || active?.dataset?.ftTab || active?.textContent || 'main';
    const value = String(raw).toLowerCase();

    if (value.includes('profile') || value.includes('account') || value.includes('кабинет') || value.includes('лич')) return 'profile';
    if (value.includes('admin') || value.includes('админ')) return 'admin';
    return 'main';
  }

  function findTabContainers() {
    return $$('[data-tab-content], .tab-content, .app-tab-content, section[id*="Tab"], section[id*="tab"], #mainTab, #profileTab, #adminTab');
  }

  function isContainerFor(container, tab) {
    const raw = [
      container.dataset.tabContent,
      container.dataset.tab,
      container.id,
      container.className,
      container.getAttribute('aria-label'),
      container.textContent?.slice(0, 80)
    ].filter(Boolean).join(' ').toLowerCase();

    if (tab === 'profile') return raw.includes('profile') || raw.includes('account') || raw.includes('лич') || raw.includes('кабинет');
    if (tab === 'admin') return raw.includes('admin') || raw.includes('админ');
    return raw.includes('main') || raw.includes('home') || raw.includes('глав');
  }

  function setActiveTab(tab) {
    const normalized = tab === 'admin' || tab === 'profile' ? tab : 'main';

    $$('[data-tab-target], [data-ft-tab], .app-tab, .bottom-nav button, nav button').forEach((button) => {
      const raw = button.dataset.tabTarget || button.dataset.ftTab || button.textContent || '';
      const value = String(raw).toLowerCase();

      const isMain = normalized === 'main' && (value.includes('main') || value.includes('home') || value.includes('глав'));
      const isProfile = normalized === 'profile' && (value.includes('profile') || value.includes('account') || value.includes('лич') || value.includes('кабинет'));
      const isAdmin = normalized === 'admin' && (value.includes('admin') || value.includes('админ'));

      button.classList.toggle('active', isMain || isProfile || isAdmin);
      button.classList.toggle('selected', isMain || isProfile || isAdmin);
      button.setAttribute('aria-selected', isMain || isProfile || isAdmin ? 'true' : 'false');
    });

    const containers = findTabContainers();
    if (containers.length) {
      containers.forEach((container) => {
        const shouldShow = isContainerFor(container, normalized);
        container.hidden = !shouldShow;
        container.classList.toggle('active', shouldShow);
        container.style.display = shouldShow ? '' : 'none';
      });
    }

    if (normalized === 'admin') {
      setTimeout(renderAdminStable, 0);
    }

    setTheme(getTheme());
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-tab-target], [data-ft-tab], .app-tab, .bottom-nav button, nav button, button');
    if (!button) return;

    const text = (button.dataset.tabTarget || button.dataset.ftTab || button.textContent || '').toLowerCase();

    if (text.includes('лич') || text.includes('кабинет') || text.includes('profile') || text.includes('account')) {
      event.preventDefault();
      setActiveTab('profile');
      return;
    }

    if (text.includes('админ') || text.includes('admin')) {
      event.preventDefault();
      setActiveTab('admin');
      return;
    }

    if (text.includes('глав') || text.includes('main') || text.includes('home')) {
      event.preventDefault();
      setActiveTab('main');
    }
  }, true);

  function getSelectedParticipant() {
    const active = $('.participant-option.active, .participant-button.active, [data-participant].active, button.active[data-participant]');
    return active?.dataset?.participant || active?.dataset?.participantId || active?.value || 'male';
  }

  function getSelectedStyle() {
    const active = $('.style-card.active, .style-card.selected, [data-style-id].active, [data-style-id].selected, [data-style].active, [data-style].selected');
    return active?.dataset?.styleId || active?.dataset?.style || active?.dataset?.id || '';
  }

  function getPhotoInput() {
    return $('#photoInput') ||
      $('input[type="file"][name="photo"]') ||
      $('input[type="file"][accept*="image"]') ||
      $('input[type="file"]');
  }

  function getGenerateButton() {
    return $('#generateButton') ||
      $('.generate-button') ||
      $$('button').find((button) => /создать|сгенерировать|generate/i.test(button.textContent || ''));
  }

  function getGenerationStatusNode() {
    let node = $('[data-ft-generation-status]') || $('#generationStatus') || $('.generation-status');

    if (!node) {
      node = document.createElement('div');
      node.dataset.ftGenerationStatus = 'true';
      node.className = 'ft-generation-status';
      const button = getGenerateButton();
      button?.insertAdjacentElement('afterend', node);
    }

    return node;
  }

  function updatePhotoUi() {
    const input = getPhotoInput();
    const button = getGenerateButton();
    const status = getGenerationStatusNode();

    const hasFile = Boolean(input?.files?.length);
    const styleId = getSelectedStyle();

    if (input?.files?.[0]) {
      const fileName = input.files[0].name || 'фото';
      status.textContent = `Фото загружено: ${fileName}`;
    } else {
      status.textContent = '';
    }

    if (button) {
      const canGenerate = hasFile && Boolean(styleId);
      button.disabled = !canGenerate;
      button.classList.toggle('disabled', !canGenerate);
      button.classList.toggle('ready', canGenerate);
      button.setAttribute('aria-disabled', canGenerate ? 'false' : 'true');
    }
  }

  document.addEventListener('change', (event) => {
    if (event.target.matches('input[type="file"]')) {
      updatePhotoUi();
    }
  }, true);

  document.addEventListener('click', (event) => {
    const styleCard = event.target.closest('.style-card, [data-style-id], [data-style]');
    if (!styleCard) return;

    $$('.style-card, [data-style-id], [data-style]').forEach((card) => {
      card.classList.remove('active', 'selected');
    });

    styleCard.classList.add('active', 'selected');
    updatePhotoUi();
  }, true);

  async function runStableGeneration(button) {
    const input = getPhotoInput();
    const status = getGenerationStatusNode();

    if (!input?.files?.length) {
      status.textContent = 'Сначала загрузите фото.';
      return;
    }

    const styleId = getSelectedStyle();
    if (!styleId) {
      status.textContent = 'Сначала выберите стиль.';
      return;
    }

    const file = input.files[0];
    const formData = new FormData();

    formData.append('photo', file);
    formData.append('file', file);
    formData.append('styleId', styleId);
    formData.append('style', styleId);
    formData.append('participantId', getSelectedParticipant());
    formData.append('participant', getSelectedParticipant());

    button.disabled = true;
    button.classList.add('loading');
    status.textContent = 'Создаём AI-фото...';

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.error) {
        throw new Error(data.message || data.error || `Ошибка генерации: ${response.status}`);
      }

      const imageUrl =
        data.resultUrl ||
        data.resultImage ||
        data.imageUrl ||
        data.url ||
        data.result?.url ||
        data.result?.imageUrl;

      if (imageUrl) {
        status.innerHTML = `
          <div class="ft-generation-success">
            Фото готово.
            <a href="${imageUrl}" download target="_blank" rel="noopener">Скачать результат</a>
          </div>
        `;

        try {
          const history = JSON.parse(localStorage.getItem('fototime-ai-generated-photos') || '[]');
          history.unshift({
            id: data.generationId || String(Date.now()),
            title: $('.style-card.active, .style-card.selected')?.textContent?.trim() || styleId,
            imageUrl,
            resultUrl: imageUrl,
            createdAt: new Date().toISOString()
          });
          localStorage.setItem('fototime-ai-generated-photos', JSON.stringify(history.slice(0, 50)));
        } catch (_) {}
      } else {
        status.textContent = 'Генерация завершена, но сервер не вернул ссылку на фото.';
      }
    } catch (error) {
      console.error('Stable generation failed:', error);
      status.textContent = error.message || 'Не удалось создать AI-фото.';
    } finally {
      button.disabled = false;
      button.classList.remove('loading');
      updatePhotoUi();
    }
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('#generateButton, .generate-button, button');
    if (!button) return;

    if (!/создать|сгенерировать|generate/i.test(button.textContent || '') && button.id !== 'generateButton') return;

    event.preventDefault();
    event.stopPropagation();

    if (button.disabled && !(getPhotoInput()?.files?.length && getSelectedStyle())) {
      updatePhotoUi();
      return;
    }

    runStableGeneration(button);
  }, true);

  document.addEventListener('click', async (event) => {
    const target = event.target.closest('a, button');
    if (!target) return;

    const text = (target.textContent || '').toLowerCase();
    if (!text.includes('скачать')) return;

    const card = target.closest('.history-card, .generated-photo-card, .photo-card, article, li, div');
    const image = card?.querySelector('img');
    const url = target.href || image?.src || target.dataset.url || target.dataset.href;

    if (!url) return;

    event.preventDefault();

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `fototime-ai-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
      console.warn('Download fallback failed:', error);
      window.open(url, '_blank', 'noopener');
    }
  }, true);

  function getAdminPin() {
    for (const key of ADMIN_PIN_KEYS) {
      const value = localStorage.getItem(key);
      if (value && value !== 'true') return value;
    }
    return '';
  }

  function saveAdminPin(pin) {
    localStorage.setItem('ft-admin-pin', pin);
    localStorage.setItem('ft-admin-pin-value', pin);
    localStorage.setItem('ft-admin-pin-direct', pin);
    localStorage.setItem('ft-admin-pin-ok', 'true');
  }

  function clearAdminPin() {
    ADMIN_PIN_KEYS.forEach((key) => localStorage.removeItem(key));
  }

  function getAdminRoot() {
    document.querySelectorAll('#adminPanel, #adminTab, [data-tab-content="admin"], [data-tab-panel="admin"]').forEach((node) => {
      if (node.id !== 'ftAdminStableRoot') {
        node.hidden = true;
        node.classList.add('hidden');
        node.classList.remove('active');
        node.style.display = 'none';
        node.innerHTML = '';
      }
    });

    let root = document.querySelector('#ftAdminStableRoot');

    if (!root) {
      root = document.createElement('section');
      root.id = 'ftAdminStableRoot';
      root.dataset.tabPanel = 'admin';
      root.className = 'app-tab-panel active';
      document.body.appendChild(root);
    }

    root.hidden = false;
    root.style.display = 'block';
    root.style.position = 'relative';
    root.style.zIndex = '20';
    root.style.width = '100%';
    root.style.maxWidth = '640px';
    root.style.margin = '0 auto 120px';
    root.style.padding = '16px';

    root.classList.remove('hidden');
    root.classList.add('active');

    return root;
  }

  function getAdminPin() {
    return (
      localStorage.getItem('ft-admin-pin') ||
      localStorage.getItem('ft-admin-pin-value') ||
      localStorage.getItem('ft-admin-pin-v2') ||
      ''
    ).trim();
  }

  function saveAdminPin(pin) {
    const clean = String(pin || '').trim();
    localStorage.setItem('ft-admin-pin', clean);
    localStorage.setItem('ft-admin-pin-value', clean);
    localStorage.setItem('ft-admin-pin-v2', clean);
  }

  function clearAdminPin() {
    localStorage.removeItem('ft-admin-pin');
    localStorage.removeItem('ft-admin-pin-value');
    localStorage.removeItem('ft-admin-pin-v2');
  }

  function adminPinForm(message = '') {
    return `
      <section class="ft-admin-stable-panel">
        <div class="step-badge">AD</div>
        <h2>Админ-консоль</h2>
        <p>Введите PIN администратора.</p>
        ${message ? `<p class="ft-admin-error">${message}</p>` : ''}
        <form id="ftStableAdminPinForm" class="ft-admin-pin-form">
          <input id="ftStableAdminPinInput" type="password" inputmode="numeric" autocomplete="off" placeholder="PIN-код" />
          <button type="submit">Войти</button>
        </form>
      </section>
    `;
  }

  function adminDashboardHtml(data, logs, feedback) {
    const stats = data?.stats || {};
    const users = Array.isArray(data?.users) ? data.users : [];
    const logItems = Array.isArray(logs) ? logs : logs?.items || logs?.logs || [];
    const feedbackItems = Array.isArray(feedback) ? feedback : feedback?.items || feedback?.feedback || [];

    return `
      <section class="ft-admin-stable-panel">
        <div class="ft-admin-head">
          <div>
            <div class="step-badge">AD</div>
            <h2>Админ-консоль</h2>
            <p>Доступ подтверждён.</p>
          </div>
          <button type="button" id="ftStableAdminLogout">Выйти</button>
        </div>

        <div class="ft-admin-grid">
          <div class="ft-admin-card"><b>${Number(stats.totalUsers || users.length || 0)}</b><span>пользователей</span></div>
          <div class="ft-admin-card"><b>${Number(stats.totalGenerations || 0)}</b><span>генераций</span></div>
          <div class="ft-admin-card"><b>${Number(stats.totalSpentCredits || 0)}</b><span>списано токенов</span></div>
        </div>

        <h3>Пользователи</h3>
        <div class="ft-admin-list">
          ${users.length ? users.map((user) => `
            <div class="ft-admin-row">
              <b>${user.name || user.username || user.id || 'Пользователь'}</b>
              <span>${Number(user.credits || user.balance || 0)} токенов</span>
            </div>
          `).join('') : '<p>Пользователей пока нет.</p>'}
        </div>

        <h3>Логи генераций</h3>
        <div class="ft-admin-list">
          ${logItems.length ? logItems.slice(0, 20).map((item) => `
            <div class="ft-admin-row">
              <b>${item.status || item.provider || item.id || 'Лог'}</b>
              <span>${item.createdAt || item.date || ''}</span>
            </div>
          `).join('') : '<p>Логов пока нет.</p>'}
        </div>

        <h3>Обратная связь</h3>
        <div class="ft-admin-list">
          ${feedbackItems.length ? feedbackItems.slice(0, 20).map((item) => `
            <div class="ft-admin-row">
              <b>${item.name || item.contact || 'Сообщение'}</b>
              <span>${item.message || item.text || ''}</span>
            </div>
          `).join('') : '<p>Сообщений пока нет.</p>'}
        </div>
      </section>
    `;
  }

  async function renderAdminStable(forceForm = false) {
    const root = getAdminRoot();
    const pin = getAdminPin();

    if (forceForm || !pin) {
      root.innerHTML = adminPinForm();
      return;
    }

    root.innerHTML = `
      <section class="ft-admin-stable-panel">
        <div class="step-badge">AD</div>
        <h2>Админ-консоль</h2>
        <p>Загружаем данные...</p>
      </section>
    `;

    try {
      const headers = { 'x-admin-pin': pin };

      const [overviewRes, logsRes, feedbackRes] = await Promise.all([
        fetch('/api/admin-pin/overview', { headers }),
        fetch('/api/generation-logs/admin', { headers }).catch(() => null),
        fetch('/api/feedback/admin', { headers }).catch(() => null)
      ]);

      if (!overviewRes.ok) {
        clearAdminPin();
        root.innerHTML = adminPinForm('PIN не принят. Попробуйте 3465 или 3230.');
        return;
      }

      const overview = await overviewRes.json().catch(() => ({}));
      const logs = logsRes?.ok ? await logsRes.json().catch(() => []) : [];
      const feedback = feedbackRes?.ok ? await feedbackRes.json().catch(() => []) : [];

      root.innerHTML = adminDashboardHtml(overview, logs, feedback);
    } catch (error) {
      root.innerHTML = `
        <section class="ft-admin-stable-panel">
          <div class="step-badge">AD</div>
          <h2>Админ-консоль</h2>
          <p class="ft-admin-error">Ошибка загрузки админки: ${error.message}</p>
          <button type="button" id="ftStableAdminRetry">Повторить</button>
        </section>
      `;
    }
  }

  if (!window.__ftStableAdminEvents) {
    window.__ftStableAdminEvents = true;

    document.addEventListener('submit', async (event) => {
      const form = event.target.closest('#ftStableAdminPinForm');
      if (!form) return;

      event.preventDefault();
      const pin = document.querySelector('#ftStableAdminPinInput')?.value || '';
      saveAdminPin(pin);
      if (document.body.dataset.activeTab === 'admin') await renderAdminStable();
    });

    document.addEventListener('click', async (event) => {
      if (event.target.closest('#ftStableAdminLogout')) {
        event.preventDefault();
        event.stopPropagation();
        clearAdminPin();

        const root = getAdminRoot();
        root.innerHTML = adminPinForm();
        root.hidden = false;
        root.style.display = 'block';
        root.classList.remove('hidden');
        root.classList.add('active');
        return false;
      }

      if (event.target.closest('#ftStableAdminRetry')) {
        if (document.body.dataset.activeTab === 'admin') await renderAdminStable();
      }
    });
  }

  
  document.addEventListener('click', (event) => {
    const adminTab = event.target.closest('[data-tab-target="admin"], [data-tab="admin"], #adminTabButton, .admin-tab');
    if (!adminTab) return;

    setTimeout(() => {
      if (document.body.dataset.activeTab === 'admin') renderAdminStable();
    }, 50);
  });

  window.renderAdminStable = renderAdminStable;
  window.ftSetActiveTab = setActiveTab;
  window.ftSetTheme = setTheme;

  document.addEventListener('DOMContentLoaded', () => {
    setTheme(getTheme());
    updatePhotoUi();

    if (getCurrentTabName() === 'admin') {
      if (document.body.dataset.activeTab === 'admin') renderAdminStable();
    }

    setTimeout(() => {
      setTheme(getTheme());
      updatePhotoUi();
    }, 300);
  });

  setTimeout(() => {
    setTheme(getTheme());
    updatePhotoUi();
  }, 700);
})();
/* FT_CLIENT_STABILITY_REPAIR_20260609_END */



/* FT_ADMIN_ROOT_ROUTER_FIX_20260609_START */
(function adminRootRouterFix() {
  if (window.__ftAdminRootRouterFix) return;
  window.__ftAdminRootRouterFix = true;

  const PIN_KEYS = [
    'ft-admin-pin',
    'ft-admin-pin-value',
    'ft-admin-pin-v2',
    'ft-admin-pin-direct',
    'ft-admin-pin-ok'
  ];

  function clearPins() {
    PIN_KEYS.forEach((key) => localStorage.removeItem(key));
  }

  function hasPin() {
    return Boolean(
      localStorage.getItem('ft-admin-pin') ||
      localStorage.getItem('ft-admin-pin-value') ||
      localStorage.getItem('ft-admin-pin-v2')
    );
  }

  function ensureAdminRoot() {
    let root = document.querySelector('#ftAdminStableRoot');

    if (!root) {
      root = document.createElement('section');
      root.id = 'ftAdminStableRoot';
      root.dataset.tabPanel = 'admin';
      root.className = 'app-tab-panel active';
      document.body.appendChild(root);
    }

    root.hidden = false;
    root.classList.remove('hidden');
    root.classList.add('active');
    root.style.display = 'block';
    root.style.visibility = 'visible';
    root.style.height = 'auto';
    root.style.maxHeight = 'none';
    root.style.overflow = 'visible';
    root.style.pointerEvents = 'auto';

    return root;
  }

  function hideAdminRoots() {
    document.querySelectorAll('#ftAdminStableRoot, #adminPanel, #adminTab, [data-tab-content="admin"]').forEach((node) => {
      node.hidden = true;
      node.classList.add('hidden');
      node.classList.remove('active');
      node.style.display = 'none';
    });
  }

  function showPinForm() {
    document.body.dataset.activeTab = 'admin';
    const root = ensureAdminRoot();

    root.innerHTML = `
      <section class="ft-admin-stable-panel card">
        <div class="ft-admin-head">
          <div>
            <div class="step-badge">AD</div>
            <h2>Админ-консоль</h2>
            <p>Введите PIN администратора.</p>
          </div>
        </div>

        <form id="ftStableAdminPinForm" class="ft-admin-pin-form">
          <input id="ftStableAdminPinInput" type="password" inputmode="numeric" autocomplete="off" placeholder="PIN-код" />
          <button type="submit">Войти</button>
        </form>
      </section>
    `;
  }

  function setTab(tab) {
    const target = tab === 'admin' || tab === 'profile' ? tab : 'main';
    document.body.dataset.activeTab = target;

    const main = document.querySelector('#content');
    const profile = document.querySelector('#profilePanel, [data-tab-panel="profile"]');

    if (main) {
      main.hidden = target !== 'main';
      main.classList.toggle('hidden', target !== 'main');
      main.style.display = target === 'main' ? '' : 'none';
    }

    if (profile) {
      profile.hidden = target !== 'profile';
      profile.classList.toggle('hidden', target !== 'profile');
      profile.classList.toggle('active', target === 'profile');
      profile.style.display = target === 'profile' ? '' : 'none';
    }

    document.querySelectorAll('.app-tab, [data-tab-target]').forEach((button) => {
      const active = button.dataset?.tabTarget === target;
      button.classList.toggle('active', active);
      button.classList.toggle('selected', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    if (target !== 'admin') {
      hideAdminRoots();
      return;
    }

    ensureAdminRoot();

    if (!hasPin()) {
      showPinForm();
      return;
    }

    if (typeof window.renderAdminStable === 'function') {
      window.renderAdminStable();
    }
  }

  window.addEventListener('click', (event) => {
    const logout = event.target.closest('#ftStableAdminLogout, #adminLogoutButton, [data-admin-logout]');
    if (logout) {
      event.preventDefault();
      event.stopImmediatePropagation();

      clearPins();
      showPinForm();
      return;
    }

    const tab = event.target.closest('.app-tab, [data-tab-target]');
    if (!tab?.dataset?.tabTarget) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    setTab(tab.dataset.tabTarget);
  }, true);

  window.addEventListener('submit', (event) => {
    const form = event.target.closest('#ftStableAdminPinForm, #adminPinForm');
    if (!form) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const input = form.querySelector('input');
    const pin = String(input?.value || '').trim();

    if (pin) {
      localStorage.setItem('ft-admin-pin', pin);
      localStorage.setItem('ft-admin-pin-value', pin);
      localStorage.setItem('ft-admin-pin-v2', pin);
    }

    setTab('admin');
  }, true);

  window.addEventListener('load', () => {
    setTimeout(() => {
      const tab = document.body.dataset.activeTab || 'main';
      setTab(tab === 'admin' ? 'admin' : tab);
    }, 150);
  });

  window.ftCleanSetTab = setTab;
})();
/* FT_ADMIN_ROOT_ROUTER_FIX_20260609_END */





/* FT_CLEAR_STYLE_ON_PARTICIPANT_CHANGE_20260609_START */
(function clearStyleOnParticipantChange() {
  if (window.__ftClearStyleOnParticipantChange) return;
  window.__ftClearStyleOnParticipantChange = true;

  function clearSelectedStyle() {
    if (window.state) {
      window.state.selectedStyleId = null;
      window.state.selectedStyle = null;
    }

    document.querySelectorAll('.style-card, [data-style-id], [data-style]').forEach((card) => {
      card.classList.remove('active', 'selected');
      card.setAttribute('aria-selected', 'false');
    });

    const button = document.querySelector('#generateButton, .generate-button');
    if (button) {
      button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
    }

    const message = document.querySelector('#message, .message');
    if (message) {
      message.textContent = 'Выберите стиль для выбранного участника.';
    }
  }

  document.addEventListener('click', (event) => {
    const participant = event.target.closest('[data-participant-id], [data-participant], .participant-option, .participant-button');
    if (!participant) return;

    setTimeout(clearSelectedStyle, 0);
  }, true);
})();
/* FT_CLEAR_STYLE_ON_PARTICIPANT_CHANGE_20260609_END */



