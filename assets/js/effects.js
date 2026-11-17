(function (global) {
  'use strict';

  const LOVE = (global.LOVE = global.LOVE || {});
  const config = global.LOVE_CONFIG;

  const randomBetween = (min, max) => min + Math.random() * (max - min);

  function heartImage(color) {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
      `<path fill="${color}" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>` +
      '</svg>';
    return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
  }

  function createHeart(colors) {
    const heart = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    heart.style.backgroundImage = heartImage(color);
    return heart;
  }

  function onTreeScreen() {
    return document.body.dataset.screen === 'tree';
  }

  function lettersOpen() {
    const panel = document.getElementById('letters-panel');
    return Boolean(panel && !panel.hidden);
  }

  function mountCounterUnit(container, value, singular, plural) {
    const unit = document.createElement('span');
    unit.className = 'counter-unit';

    const number = document.createElement('span');
    number.className = 'counter-num';
    number.textContent = String(value);

    const word = document.createElement('span');
    word.className = 'counter-word';
    word.textContent = value === 1 ? singular : plural;

    unit.append(number, word);
    container.append(unit);
  }

  function initCounter(startTimestamp) {
    const container = document.getElementById('love-counter');
    if (!container) return () => {};

    const start = Number(startTimestamp) || new Date(config.fallbackStartDate).getTime();

    const update = () => {
      const diff = Math.max(Date.now() - start, 0);

      const days = Math.floor(diff / 86400000);
      const hours = Math.floor(diff / 3600000) % 24;
      const minutes = Math.floor(diff / 60000) % 60;
      const seconds = Math.floor(diff / 1000) % 60;

      container.textContent = '';
      mountCounterUnit(container, days, 'día', 'días');
      mountCounterUnit(container, hours, 'hora', 'horas');
      mountCounterUnit(container, minutes, 'min', 'min');
      mountCounterUnit(container, seconds, 'seg', 'seg');
    };

    update();
    const timer = global.setInterval(update, 1000);
    return () => global.clearInterval(timer);
  }

  const IGNORED_SELECTOR = '.carta-button, .letters, .player, .fullscreen-control, .gate';

  function initClickEffects() {
    const reducedMotion = global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let phraseIndex = 0;

    const onDocumentClick = (event) => {
      if (!onTreeScreen() || lettersOpen()) return;
      if (event.target.closest(IGNORED_SELECTOR)) return;

      if (reducedMotion) return;

      const phrase = document.createElement('div');
      phrase.className = 'floating-phrase';
      const phrases = config.clickPhrases && config.clickPhrases.length
        ? config.clickPhrases
        : ['Te quiero'];
      phrase.textContent = phrases[phraseIndex % phrases.length];
      phrase.style.left = `${event.clientX}px`;
      phrase.style.top = `${event.clientY}px`;
      document.body.appendChild(phrase);
      phraseIndex += 1;
      global.setTimeout(() => phrase.remove(), 4000);

      const duration = config.animation.clickFallDuration;
      for (let i = 0; i < config.clickBurstCount; i += 1) {
        const heart = createHeart(config.palette.hearts);
        heart.classList.add('click-heart');
        heart.style.left = `${event.clientX}px`;
        heart.style.top = `${event.clientY}px`;

        const angle = Math.random() * Math.PI * 2;
        const burst =
          Math.random() * (config.clickBurst.distance.max - config.clickBurst.distance.min) +
          config.clickBurst.distance.min;
        const wind =
          Math.random() * (config.clickBurst.wind.max - config.clickBurst.wind.min) +
          config.clickBurst.wind.min;

        heart.style.setProperty('--burst-x', `${Math.cos(angle) * burst}px`);
        heart.style.setProperty('--burst-y', `${Math.sin(angle) * burst}px`);
        heart.style.setProperty('--wind-x', `${wind}px`);
        heart.style.setProperty('--fall-duration', `${duration}s`);

        document.body.appendChild(heart);
        global.setTimeout(() => heart.remove(), duration * 1000);
      }
    };

    document.addEventListener('click', onDocumentClick);
    return () => document.removeEventListener('click', onDocumentClick);
  }

  function initPetals() {
    const reducedMotion = global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return () => {};

    let intervalId = 0;

    const spawnPetal = () => {
      if (document.hidden || !onTreeScreen() || lettersOpen()) return;

      const petal = createHeart(config.palette.petals);
      petal.classList.add('petal');

      const startX = randomBetween(-10, 20);
      const endX = startX + randomBetween(30, 80);

      petal.style.setProperty('--start-x', `${startX}vw`);
      petal.style.setProperty('--end-x', `${endX}vw`);
      petal.style.left = '0';

      const duration = randomBetween(config.petal.duration.min, config.petal.duration.max);
      petal.style.animationDuration = `${duration}s`;

      document.body.appendChild(petal);
      global.setTimeout(() => petal.remove(), duration * 1000);
    };

    const startId = global.setTimeout(() => {
      spawnPetal();
      intervalId = global.setInterval(spawnPetal, config.petal.frequency);
    }, config.initialDelay);

    return () => {
      global.clearTimeout(startId);
      global.clearInterval(intervalId);
    };
  }

  LOVE.effects = { initCounter, initClickEffects, initPetals, createHeart };
})(window);
