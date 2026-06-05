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

  if (url.startsWith('/api/')) {
    init.headers = {
      ...(init.headers || {}),
      'x-telegram-init-data': getTelegramInitData()
    };
  }

  return originalFetch(input, init);
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
    { title: 'Старт', tokens: 50, price: '99 ₽', note: 'Для первой пробы и тестирования.' },
    { title: 'Гости', tokens: 120, price: '199 ₽', note: 'Для небольшого мероприятия.' },
    { title: 'Популярный', tokens: 300, price: '449 ₽', note: 'Оптимально для активного использования.' },
    { title: 'Максимум', tokens: 700, price: '899 ₽', note: 'Для большого события или промо.' }
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
  const ADMIN_PIN = '3230';

  const PACKAGES = [
    { title: 'Старт', tokens: 50, price: '49 ₽', generations: 1, note: 'Для первой пробы' },
    { title: 'Гости', tokens: 120, price: '99 ₽', generations: 3, note: 'Для небольшого мероприятия' },
    { title: 'Популярный', tokens: 300, price: '249 ₽', generations: 7, note: 'Для активного использования' },
    { title: 'Максимум', tokens: 700, price: '499 ₽', generations: 17, note: 'Для большого события или промо' }
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
            <p class="section-subtitle">Фотобудка, нейрофото и интерактивные решения для мероприятий.</p>
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
        message: 'Telegram authorization required'
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
