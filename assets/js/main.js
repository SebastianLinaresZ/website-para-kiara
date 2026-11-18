(function (global) {
  'use strict';

  const LOVE = (global.LOVE = global.LOVE || {});
  const config = global.LOVE_CONFIG;

  const RESET_KEY = '61039286';

  function param(name) {
    try {
      return new URL(global.location.href).searchParams.get(name);
    } catch (error) {
      return null;
    }
  }

  function dropParam(name) {
    try {
      const url = new URL(global.location.href);
      url.searchParams.delete(name);
      global.history.replaceState(null, '', url.toString());
    } catch (error) {
      // file:// no siempre deja reescribir la URL
    }
  }

  function banner(text) {
    let el = document.getElementById('kiara-banner');
    if (!el) {
      el = document.createElement('div');
      el.id = 'kiara-banner';
      el.className = 'kiara-banner';
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.classList.add('is-visible');
    global.clearTimeout(el.timer);
    el.timer = global.setTimeout(() => el.classList.remove('is-visible'), 3200);
  }

  async function boot() {
    const preview = param('ensayo') === RESET_KEY;
    LOVE.store.configure({ preview });

    if (preview) banner('modo ensayo · no se guarda nada');

    const resetKey = param('reset');
    if (resetKey !== null) {
      const result = await LOVE.store.resetRemote(resetKey);
      dropParam('reset');
      banner(
        result.reason === 'bad-key'
          ? 'clave incorrecta'
          : result.reason === 'offline'
            ? 'sin conexión: reiniciado solo aquí'
            : 'página reiniciada',
      );
    }

    const state = await LOVE.store.load();

    const canvas = document.getElementById('love-tree-canvas');
    const counterBox = document.querySelector('.counter-container');
    const lettersButton = document.getElementById('letters-button');

    const menu = LOVE.letters.init();
    LOVE.fullscreen.initFullscreenControl();
    const music = LOVE.audio.setupPlayer();

    LOVE.effects.initClickEffects();
    LOVE.effects.initPetals();

    let tree = null;
    let treeStarted = false;

    function startTree(startedAt) {
      if (treeStarted || !canvas || !LOVE.LoveTree) return;
      treeStarted = true;

      LOVE.flow.showScreen('tree');
      LOVE.effects.initCounter(startedAt || state.startedAt || global.Date.now());

      tree = new LOVE.LoveTree(canvas, {
        withSeed: false,
        width: config.tree.width,
        height: config.tree.height,
        seed: config.tree.seed,
        branch: config.tree.branch,
        bloom: config.tree.bloom,
        footer: config.tree.footer,
        desktopShift: config.tree.desktopShift,
        trunkColor: config.palette.trunk,
        groundColor: config.palette.ground,
        bloomColors: config.palette.blooms,
      });

      tree.start({
        onReady: () => {
          if (counterBox) counterBox.classList.add('is-visible');
          if (lettersButton) lettersButton.classList.add('is-visible');
        },
      });
    }

    if (lettersButton) {
      lettersButton.addEventListener('click', (event) => {
        event.stopPropagation();
        menu.open();
      });
    }

    if (state.answered) {
      startTree(state.startedAt);
      music.reveal();
      return;
    }

    LOVE.flow.init({
      onAnswered: (startedAt) => {
        music.reveal();
        startTree(startedAt);
      },
    });
  }

  LOVE.restart = () => {
    LOVE.store.reset();
    global.location.reload();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})(window);
