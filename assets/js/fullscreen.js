(function (global) {
  'use strict';

  const LOVE = (global.LOVE = global.LOVE || {});

  function getFullscreenElement() {
    return (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement ||
      null
    );
  }

  function isSupported() {
    const root = document.documentElement;
    return Boolean(
      document.fullscreenEnabled ||
        document.webkitFullscreenEnabled ||
        document.msFullscreenEnabled ||
        root.requestFullscreen ||
        root.webkitRequestFullscreen ||
        root.msRequestFullscreen,
    );
  }

  function initFullscreenControl() {
    const wrapper = document.getElementById('fullscreen-control');
    const button = document.getElementById('fullscreen-btn');
    const enterIcon = document.getElementById('fullscreen-enter-icon');
    const exitIcon = document.getElementById('fullscreen-exit-icon');

    if (!wrapper || !button || !enterIcon || !exitIcon) return () => {};
    if (!isSupported()) {
      wrapper.classList.add('is-hidden');
      return () => {};
    }

    const sync = () => {
      const active = Boolean(getFullscreenElement());
      enterIcon.classList.toggle('is-hidden', active);
      exitIcon.classList.toggle('is-hidden', !active);

      const label = active ? 'Salir de pantalla completa' : 'Entrar en pantalla completa';
      button.setAttribute('aria-label', label);
      button.title = label;
    };

    const toggle = async () => {
      const active = getFullscreenElement();
      try {
        if (active) {
          const exit =
            document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
          if (exit) await exit.call(document);
        } else {
          const root = document.documentElement;
          const request =
            root.requestFullscreen || root.webkitRequestFullscreen || root.msRequestFullscreen;
          if (request) await request.call(root);
        }
      } catch (error) {
        // el navegador puede denegar la petición
      } finally {
        sync();
      }
    };

    const onClick = (event) => {
      event.stopPropagation();
      toggle();
    };

    sync();
    button.addEventListener('click', onClick);
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    document.addEventListener('msfullscreenchange', sync);

    return () => {
      button.removeEventListener('click', onClick);
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
      document.removeEventListener('msfullscreenchange', sync);
    };
  }

  LOVE.fullscreen = { initFullscreenControl };
})(window);
