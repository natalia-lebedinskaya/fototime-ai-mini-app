const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
  tg.enableClosingConfirmation();
}

const GENERATION_TIMEOUT_MS = 15000;

const state = {
  eventConfig: null,
  selectedParticipantId: null,
  selectedStyleId: null,
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
const emptyStylesState = document.getElementById('emptyStylesState');

const photoInput = document.getElementById('photoInput');
const uploadTitle = document.getElementById('uploadTitle');
const generateButton = document.getElementById('generateButton');
const retryGenerationButton = document.getElementById('retryGenerationButton');
const generationErrorActions = document.getElementById('generationErrorActions');
const message = document.getElementById('message');

const resultSection = document.getElementById('resultSection');
const resultImage = document.getElementById('resultImage');
const resetButton = document.getElementById('resetButton');

document.addEventListener('DOMContentLoaded', init);

retryButton.addEventListener('click', init);
generateButton.addEventListener('click', runGeneration);
retryGenerationButton.addEventListener('click', runGeneration);

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

    resultImage.src = data.resultUrl;
    resultSection.classList.remove('hidden');
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
}

function renderParticipants() {
  participantsGrid.innerHTML = '';

  const activeParticipants = state.eventConfig.participants.filter((participant) => participant.isActive);
  emptyParticipantsState.classList.toggle('hidden', activeParticipants.length > 0);

  if (activeParticipants.length === 0) {
    state.selectedParticipantId = null;
    state.selectedStyleId = null;
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

      renderParticipants();
      renderStyles();
      validateForm();
    });

    participantsGrid.appendChild(button);
  });
}

function renderStyles() {
  stylesGrid.innerHTML = '';

  if (!state.selectedParticipantId) {
    emptyStylesState.classList.remove('hidden');
    emptyStylesState.textContent = 'Сначала выберите участника мероприятия.';
    validateForm();
    return;
  }

  const filteredStyles = state.eventConfig.styles.filter((style) => {
    return style.participantType === state.selectedParticipantId && style.isAvailable;
  });

  emptyStylesState.classList.toggle('hidden', filteredStyles.length > 0);
  emptyStylesState.textContent = 'Для выбранного участника пока нет доступных стилей.';

  filteredStyles.forEach((style) => {
    const card = document.createElement('button');
    card.className = getStyleClass(style.id);
    card.dataset.styleId = style.id;

    card.innerHTML =
      '<img src="' + style.previewUrl + '" alt="' + style.name + '" class="style-preview" />' +
      '<span class="style-name">' + style.name + '</span>' +
      '<span class="style-price">' + style.price + '</span>';

    card.addEventListener('click', () => {
      state.selectedStyleId = style.id;

      renderStyles();
      validateForm();
    });

    stylesGrid.appendChild(card);
  });
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
