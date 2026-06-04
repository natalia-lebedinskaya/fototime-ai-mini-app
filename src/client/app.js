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
    priceRub: 99,
    description: 'Для первой пробы'
  },
  {
    id: 'event',
    title: 'Гости',
    credits: 120,
    priceRub: 199,
    description: 'Оптимально для мероприятия'
  },
  {
    id: 'popular',
    title: 'Популярный',
    credits: 300,
    priceRub: 449,
    description: 'Больше генераций за выгодную цену'
  },
  {
    id: 'max',
    title: 'Максимум',
    credits: 700,
    priceRub: 899,
    description: 'Для активного использования'
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
      throw new Error(data.message || 'Не удалось получить конфигурацию мероприятия');
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
  formData.append('styleTitle', state.selectedStyle?.title || getStyleTitleById(state.selectedStyleId) || '');
  formData.append('styleProvider', state.selectedStyle?.providers?.[0] || '');
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
  errorText.textContent = text || 'Не удалось загрузить данные мероприятия. Попробуйте повторить запрос.';
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
    previewUrl: style.previewUrl || null,
    modes: Array.isArray(style.modes) ? style.modes : [],
    participantType: state.selectedParticipantId || 'male',
    isAvailable: true,
    price: '0.34',
    source: style.source || 'cyberphotobooth'
  };
}

async function loadCyberStylesCatalog() {
  try {
    const response = await fetch('/api/styles');

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

function getStyleProviders(style) {
  const rawModes = Array.isArray(style.modes) ? style.modes : [];

  const providers = rawModes
    .map((mode) => {
      if (typeof mode === 'string') {
        return mode;
      }

      return (
        mode.display_name ||
        mode.displayName ||
        mode.name ||
        mode.provider ||
        mode.engine ||
        mode.model ||
        mode.type ||
        ''
      );
    })
    .filter(Boolean)
    .map((item) => String(item).trim());

  return [...new Set(providers)];
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
    emptyStylesState.textContent = 'Сначала выберите участника мероприятия.';

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

  const totalPages = Math.max(1, Math.ceil(filteredStyles.length / INITIAL_VISIBLE_STYLES));
  visibleStylesPage = Math.min(visibleStylesPage, totalPages - 1);

  const startIndex = visibleStylesPage * INITIAL_VISIBLE_STYLES;
  const endIndex = startIndex + INITIAL_VISIBLE_STYLES;
  const visibleStyles = filteredStyles.slice(startIndex, endIndex);

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

  if (filteredStyles.length > INITIAL_VISIBLE_STYLES) {
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
      button.addEventListener('click', () => {
        const action = button.dataset.pageAction;

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
      });
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

