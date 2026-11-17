(function (global) {
  'use strict';

  const LOVE = (global.LOVE = global.LOVE || {});
  const config = global.LOVE_CONFIG;

  const HEART_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path fill="url(#grad-heart)" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>' +
    '</svg>';

  const MAX_STORAGE = 4200000; // ~4 MB, con margen bajo el límite del navegador

  function customLetters() {
    return LOVE.store.getLetters();
  }

  function allLetters() {
    return LOVE.lettersData.defaults.concat(customLetters());
  }

  function findLetter(id) {
    return allLetters().find((letter) => letter.id === id) || null;
  }

  function isCustom(id) {
    return customLetters().some((letter) => letter.id === id);
  }

  function formatDate(value) {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return 'Para ti';
    return date
      .toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
      .replace(/ de (\d{4})$/, ' · $1');
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  async function compressImage(file) {
    const dataUrl = await readFileAsDataUrl(file);
    const image = await loadImage(dataUrl);

    const max = 1200;
    const scale = Math.min(1, max / Math.max(image.naturalWidth, image.naturalHeight));
    if (scale === 1 && dataUrl.length < 240000) return dataUrl;

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.8);
  }

  function init() {
    const panel = document.getElementById('letters-panel');
    const list = document.getElementById('letters-list');
    const empty = document.getElementById('letters-empty');
    const view = document.getElementById('letter-view');
    const form = document.getElementById('letter-form');
    const titleEl = document.getElementById('letter-title');
    const dateEl = document.getElementById('letter-date');
    const textEl = document.getElementById('letter-text');
    const photosEl = document.getElementById('letter-photos');
    const deleteBtn = document.getElementById('letter-delete');
    const closeBtn = document.getElementById('letters-close');
    const addBtn = document.getElementById('letters-add');

    const formTitle = document.getElementById('letter-form-title');
    const formText = document.getElementById('letter-form-text');
    const formPhotos = document.getElementById('letter-form-photos');
    const thumbs = document.getElementById('letter-form-thumbs');
    const formError = document.getElementById('letter-form-error');
    const cancelBtn = document.getElementById('letter-form-cancel');
    const formHeading = document.getElementById('letter-form-heading');

    if (!panel || !list || !view || !form) {
      return { open() {}, close() {}, isOpen: () => false };
    }

    const editable = Boolean(config.letters && config.letters.editable);
    if (addBtn) addBtn.hidden = !editable;

    let activeId = null;
    let draftPhotos = [];
    let lastFocused = null;
    let lightbox = null;

    function renderList() {
      list.textContent = '';
      const letters = allLetters();

      letters.forEach((letter) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'letter-card' + (letter.id === activeId ? ' is-active' : '');
        card.dataset.id = letter.id;
        card.setAttribute('aria-current', letter.id === activeId ? 'true' : 'false');

        const icon = document.createElement('span');
        icon.className = 'letter-card__icon';
        icon.innerHTML = HEART_ICON;

        const body = document.createElement('span');
        body.className = 'letter-card__body';

        const title = document.createElement('span');
        title.className = 'letter-card__title';
        title.textContent = letter.title || 'Carta';

        const preview = document.createElement('span');
        preview.className = 'letter-card__preview';
        preview.textContent = LOVE.lettersData.previewOf(letter);

        body.append(title, preview);
        card.append(icon, body);
        card.addEventListener('click', () => select(letter.id));

        list.appendChild(card);
      });

      empty.hidden = letters.length > 0;
    }

    function openLightbox(src) {
      if (!lightbox) {
        lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        lightbox.hidden = true;
        lightbox.setAttribute('role', 'dialog');
        lightbox.setAttribute('aria-label', 'Foto ampliada');
        const image = document.createElement('img');
        lightbox.appendChild(image);
        lightbox.addEventListener('click', () => {
          lightbox.hidden = true;
          image.removeAttribute('src');
        });
        document.body.appendChild(lightbox);
      }

      const image = lightbox.querySelector('img');
      image.src = src;
      lightbox.hidden = false;
    }

    function renderPhotos(letter) {
      photosEl.textContent = '';
      const photos = Array.isArray(letter.photos) ? letter.photos : [];
      const count = photos.length;

      photos.forEach((src, index) => {
        const image = document.createElement('img');
        image.className = 'photo-stack__item';
        image.src = src;
        image.alt = `Recuerdo ${index + 1}`;
        image.loading = 'lazy';
        image.decoding = 'async';

        const center = (count - 1) / 2;
        const offset = index - center;
        const step = count > 1 ? Math.min(54, 240 / (count - 1)) : 0;
        const rotation = count > 1 ? Math.min(9, 24 / (count - 1)) : 0;

        image.style.setProperty('--shift', `${offset * step}px`);
        image.style.setProperty('--rot', `${offset * rotation}deg`);
        image.style.zIndex = String(index + 1);

        image.addEventListener('click', () => openLightbox(src));
        image.addEventListener('error', () => image.remove());
        photosEl.appendChild(image);
      });
    }

    function renderLetter(letter) {
      if (!letter) {
        view.hidden = true;
        return;
      }

      view.hidden = false;
      form.hidden = true;

      dateEl.textContent = formatDate(letter.createdAt);
      titleEl.textContent = letter.title || 'Carta';

      textEl.textContent = '';
      String(letter.text || '')
        .split(/\n+/)
        .forEach((block) => {
          const trimmed = block.trim();
          if (!trimmed) return;
          const paragraph = document.createElement('p');
          paragraph.textContent = trimmed;
          textEl.appendChild(paragraph);
        });

      renderPhotos(letter);
      deleteBtn.hidden = !editable || !isCustom(letter.id);
    }

    function select(id) {
      const letter = findLetter(id);
      if (!letter) return;

      activeId = id;
      renderList();
      renderLetter(letter);

      const main = document.querySelector('.letters__main');
      if (main) main.scrollTop = 0;
    }

    function renderThumbs() {
      thumbs.textContent = '';
      draftPhotos.forEach((src, index) => {
        const thumb = document.createElement('div');
        thumb.className = 'thumb';

        const image = document.createElement('img');
        image.src = src;
        image.alt = `Foto ${index + 1}`;

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'thumb__remove';
        remove.setAttribute('aria-label', `Quitar la foto ${index + 1}`);
        remove.textContent = '×';
        remove.addEventListener('click', () => {
          draftPhotos.splice(index, 1);
          renderThumbs();
        });

        thumb.append(image, remove);
        thumbs.appendChild(thumb);
      });
    }

    function openForm() {
      if (!editable) return;
      view.hidden = true;
      form.hidden = false;
      formHeading.textContent = 'Nueva carta';
      formError.textContent = '';
      formTitle.value = '';
      formText.value = '';
      draftPhotos = [];
      renderThumbs();
      formTitle.focus({ preventScroll: true });
    }

    function closeForm() {
      const letter = findLetter(activeId) || allLetters()[allLetters().length - 1];
      if (letter) renderLetter(letter);
      else view.hidden = false;
      form.hidden = true;
    }

    async function handleFiles(files) {
      const list = Array.from(files || []).filter((file) => file.type.startsWith('image/'));
      if (!list.length) return;

      formError.textContent = 'Procesando fotos...';

      for (const file of list) {
        try {
          draftPhotos.push(await compressImage(file));
        } catch (error) {
          formError.textContent = 'No se pudo leer una de las fotos.';
        }
      }

      renderThumbs();
      formError.textContent = '';
      formPhotos.value = '';
    }

    function save(event) {
      event.preventDefault();
      if (!editable) return;

      const title = formTitle.value.trim() || 'Para ti';
      const text = formText.value.trim();

      if (!text && !draftPhotos.length) {
        formError.textContent = 'Escribe un mensaje o añade al menos una foto.';
        return;
      }

      const letter = {
        id: `c-${Date.now()}`,
        title,
        text,
        photos: draftPhotos.slice(),
        createdAt: new Date().toISOString(),
      };

      const payloadSize = JSON.stringify(customLetters().concat(letter)).length;
      if (payloadSize > MAX_STORAGE) {
        formError.textContent =
          'No hay espacio para guardar más fotos en este navegador. Quita alguna foto o escribe la carta sin fotos.';
        return;
      }

      const saved = LOVE.store.addLetter(letter);
      if (!saved) {
        formError.textContent =
          'No se pudo guardar la carta en este navegador. Prueba con menos fotos.';
        return;
      }

      activeId = letter.id;
      form.hidden = true;
      view.hidden = false;
      renderList();
      renderLetter(letter);
      const main = document.querySelector('.letters__main');
      if (main) main.scrollTop = 0;
    }

    function removeActive() {
      if (!editable) return;
      if (!activeId || !isCustom(activeId)) return;
      const letter = findLetter(activeId);
      const label = letter ? letter.title : 'esta carta';
      if (!global.confirm(`¿Borrar «${label}»? No se puede deshacer.`)) return;

      LOVE.store.removeLetter(activeId);
      activeId = null;

      const remaining = allLetters();
      renderList();
      if (remaining.length) select(remaining[remaining.length - 1].id);
      else {
        view.hidden = true;
        photosEl.textContent = '';
      }
    }

    function open() {
      if (!panel.hidden) return;

      lastFocused = document.activeElement;
      panel.hidden = false;
      panel.setAttribute('aria-hidden', 'false');
      document.body.classList.add('is-locked');

      if (!activeId) {
        const letters = allLetters();
        activeId = letters.length ? letters[letters.length - 1].id : null;
      }

      renderList();
      select(activeId);

      const activeCard = list.querySelector('.letter-card.is-active') || closeBtn;
      if (activeCard) activeCard.focus({ preventScroll: true });
    }

    function close() {
      if (panel.hidden) return;

      panel.hidden = true;
      panel.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-locked');
      form.hidden = true;

      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus({ preventScroll: true });
      }
    }

    closeBtn.addEventListener('click', close);
    addBtn.addEventListener('click', openForm);
    deleteBtn.addEventListener('click', removeActive);
    cancelBtn.addEventListener('click', closeForm);
    form.addEventListener('submit', save);
    formPhotos.addEventListener('change', (event) => handleFiles(event.target.files));

    panel.addEventListener('click', (event) => {
      if (event.target === panel) close();
    });

    document.addEventListener('keydown', (event) => {
      if (panel.hidden) return;

      if (event.key === 'Escape') {
        if (lightbox && !lightbox.hidden) {
          lightbox.hidden = true;
        } else if (!form.hidden) {
          closeForm();
        } else {
          close();
        }
        return;
      }

      if (event.key === 'Tab') {
        const focusable = panel.querySelectorAll(
          'button:not([hidden]), input:not([hidden]), textarea:not([hidden]), [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    renderList();

    return {
      open,
      close,
      isOpen: () => !panel.hidden,
      select,
    };
  }

  LOVE.letters = { init };
})(window);
