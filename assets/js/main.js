(function (global) {
  'use strict';

  const LOVE = (global.LOVE = global.LOVE || {});
  const config = global.LOVE_CONFIG;

  function handleResetParam() {
    let url;
    try {
      url = new URL(global.location.href);
    } catch (error) {
      return;
    }

    if (!url.searchParams.has('reset')) return;

    LOVE.store.reset();

    url.searchParams.delete('reset');
    try {
      global.history.replaceState(null, '', url.toString());
    } catch (error) {
      // file:// no siempre deja reescribir la URL
    }
  }

  function boot() {
    handleResetParam();

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

    function startTree() {
      if (treeStarted || !canvas || !LOVE.LoveTree) return;
      treeStarted = true;

      LOVE.flow.showScreen('tree');

      const state = LOVE.store.getState();
      const startAt = state.startedAt || global.Date.now();
      LOVE.effects.initCounter(startAt);

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

    const state = LOVE.store.getState();

    if (state.answered) {
      startTree();
      music.reveal();
      return;
    }

    LOVE.flow.init({
      onAnswered: () => {
        music.reveal();
        startTree();
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
