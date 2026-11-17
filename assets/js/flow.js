(function (global) {
  'use strict';

  const LOVE = (global.LOVE = global.LOVE || {});
  const config = global.LOVE_CONFIG;

  const SCREENS = ['intro', 'gate', 'tree'];

  function showScreen(name) {
    SCREENS.forEach((key) => {
      const screen = document.getElementById(`screen-${key}`);
      if (!screen) return;
      const active = key === name;
      screen.hidden = !active;
      screen.setAttribute('aria-hidden', String(!active));
    });
    document.body.dataset.screen = name;
  }

  function renderParagraphs(element, text) {
    element.textContent = '';
    String(text || '')
      .split(/\n+/)
      .forEach((block) => {
        const trimmed = block.trim();
        if (!trimmed) return;
        const paragraph = document.createElement('p');
        paragraph.textContent = trimmed;
        element.appendChild(paragraph);
      });
  }

  function init(options = {}) {
    const intro = document.getElementById('intro-trigger');
    const gate = document.getElementById('gate-card');
    const gateEyebrow = document.getElementById('gate-eyebrow');
    const gateTitle = document.getElementById('gate-title');
    const gateText = document.getElementById('gate-text');
    const yesButton = document.getElementById('gate-yes');
    const noButton = document.getElementById('gate-no');
    const reply = document.getElementById('gate-reply');
    const introLabel = document.getElementById('intro-label');
    const introHint = document.getElementById('intro-hint');

    const letter = LOVE.lettersData.gate();
    const dodgeFrom = Number(config.gate.noDodgeFrom) || 4;
    const vanishAfter = Number(config.gate.noVanishAfter) || 8;

    if (introLabel && config.intro.label) introLabel.textContent = config.intro.label;
    if (introHint && config.intro.hint) introHint.textContent = config.intro.hint;
    if (gateEyebrow) gateEyebrow.textContent = config.gate.eyebrow;
    if (gateTitle) gateTitle.textContent = letter.title || '¿Sí o no?';
    if (gateText) renderParagraphs(gateText, letter.text);
    if (yesButton) yesButton.textContent = config.gate.yes;
    if (noButton) noButton.textContent = config.gate.no;

    let answered = false;
    let vanished = false;
    let escaping = false;
    let noCount = LOVE.store.getState().noCount || 0;

    function moveNoSomewhere() {
      if (!noButton) return;

      if (!escaping) {
        escaping = true;

        const rect = noButton.getBoundingClientRect();
        noButton.style.width = `${rect.width}px`;
        noButton.style.height = `${rect.height}px`;
        noButton.style.left = `${rect.left}px`;
        noButton.style.top = `${rect.top}px`;
        noButton.classList.add('is-escaping');

        // fuera de la tarjeta: position fixed se mide contra la ventana, no
        // contra el backdrop-filter del panel
        if (noButton.parentNode !== document.body) {
          document.body.appendChild(noButton);
        }

        void noButton.offsetWidth;
      }

      const margin = 12;
      const width = noButton.offsetWidth;
      const height = noButton.offsetHeight;
      const maxX = Math.max(margin, global.innerWidth - width - margin);
      const maxY = Math.max(margin, global.innerHeight - height - margin);

      const yesRect = yesButton ? yesButton.getBoundingClientRect() : null;
      const gap = 16;

      const currentX = parseFloat(noButton.style.left) || 0;
      const currentY = parseFloat(noButton.style.top) || 0;

      const candidates = [];
      const minDistance = Math.hypot(maxX, maxY) * 0.3;

      for (let attempt = 0; attempt < 20; attempt += 1) {
        const candidateX = margin + Math.random() * (maxX - margin);
        const candidateY = margin + Math.random() * (maxY - margin);

        const onTopOfYes =
          yesRect &&
          candidateX < yesRect.right + gap &&
          candidateX + width > yesRect.left - gap &&
          candidateY < yesRect.bottom + gap &&
          candidateY + height > yesRect.top - gap;

        if (onTopOfYes) continue;

        candidates.push({
          x: candidateX,
          y: candidateY,
          distance: Math.hypot(candidateX - currentX, candidateY - currentY),
        });
      }

      const far = candidates.filter((candidate) => candidate.distance >= minDistance);
      const chosen = far.length
        ? far[Math.floor(Math.random() * far.length)]
        : candidates.sort((a, b) => b.distance - a.distance)[0];

      const x = chosen ? chosen.x : margin;
      const y = chosen ? chosen.y : margin;

      noButton.style.left = `${x}px`;
      noButton.style.top = `${y}px`;
      noButton.style.setProperty('--tilt', `${(Math.random() * 18 - 9).toFixed(1)}deg`);
    }

    function keepNoOnScreen() {
      if (!escaping || !noButton) return;

      const width = noButton.offsetWidth;
      const height = noButton.offsetHeight;
      const maxX = Math.max(12, global.innerWidth - width - 12);
      const maxY = Math.max(12, global.innerHeight - height - 12);

      const x = Math.min(Math.max(parseFloat(noButton.style.left) || 0, 12), maxX);
      const y = Math.min(Math.max(parseFloat(noButton.style.top) || 0, 12), maxY);

      noButton.style.left = `${x}px`;
      noButton.style.top = `${y}px`;
    }

    function stopEscaping() {
      if (!noButton) return;
      escaping = false;
      global.removeEventListener('resize', keepNoOnScreen);
      noButton.hidden = true;
      noButton.classList.remove('is-escaping');
      noButton.remove();
    }

    // ojo: window.open(url, '_blank', 'noopener') devuelve null siempre, así
    // que no sirve para saber si el navegador lo bloqueó
    function openOnce(url) {
      let opened = null;
      try {
        opened = global.open(url, '_blank');
      } catch (error) {
        opened = null;
      }

      if (opened) {
        try {
          opened.opener = null;
        } catch (error) {
          // sin permiso para tocar la ventana abierta
        }
        return;
      }

      global.location.href = url;
    }

    function vanish() {
      if (!noButton || vanished) return;
      vanished = true;

      noButton.classList.add('is-vanishing');
      if (reply) reply.textContent = config.gate.noVanishMessage || '';

      global.setTimeout(() => {
        noButton.hidden = true;
        noButton.classList.remove('is-vanishing');
        if (yesButton) yesButton.focus({ preventScroll: true });
      }, 420);

      const url = config.gate.noVanishUrl;
      if (url) openOnce(url);
    }

    if (noCount > vanishAfter) {
      vanished = true;
      if (noButton) noButton.hidden = true;
      if (reply) reply.textContent = config.gate.noVanishMessage || '';
    }

    global.addEventListener('resize', keepNoOnScreen);

    if (intro) {
      intro.addEventListener('click', () => {
        showScreen('gate');
        if (yesButton) yesButton.focus({ preventScroll: true });
      });
    }

    if (yesButton) {
      yesButton.addEventListener('click', () => {
        if (answered) return;
        answered = true;

        // si venía escapándose, se recoge antes de salir de la pregunta
        stopEscaping();

        LOVE.store.answer(Date.now());
        showScreen('tree');

        if (typeof options.onAnswered === 'function') options.onAnswered();
      });
    }

    if (noButton) {
      noButton.addEventListener('click', () => {
        if (answered || vanished) return;

        noCount = LOVE.store.bumpNo();

        if (noCount > vanishAfter) {
          vanish();
          return;
        }

        const replies = config.gate.noReplies || [];
        if (reply) {
          reply.textContent = replies.length
            ? replies[Math.min(noCount - 1, replies.length - 1)]
            : 'Inténtalo otra vez.';
        }

        if (noCount >= dodgeFrom) {
          moveNoSomewhere();
        } else if (gate) {
          gate.classList.remove('is-shaking');
          void gate.offsetWidth;
          gate.classList.add('is-shaking');
        }
      });
    }

    showScreen('intro');
  }

  LOVE.flow = { init, showScreen };
})(window);
