(function (global) {
  'use strict';

  const LOVE = (global.LOVE = global.LOVE || {});

  const KEY_STATE = 'kiara.state.v1';
  const KEY_LETTERS = 'kiara.letters.v1';

  const memory = {};
  let storageOk = true;

  try {
    const probe = '__kiara_probe__';
    global.localStorage.setItem(probe, '1');
    global.localStorage.removeItem(probe);
  } catch (error) {
    storageOk = false;
  }

  function read(key, fallback) {
    try {
      const raw = storageOk ? global.localStorage.getItem(key) : memory[key];
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      const raw = JSON.stringify(value);
      if (storageOk) global.localStorage.setItem(key, raw);
      else memory[key] = raw;
      return true;
    } catch (error) {
      return false;
    }
  }

  const store = {
    get available() {
      return storageOk;
    },

    getState() {
      const state = read(KEY_STATE, null) || {};
      return {
        answered: state.answered === true,
        startedAt: typeof state.startedAt === 'number' ? state.startedAt : null,
        noCount: typeof state.noCount === 'number' ? state.noCount : 0,
      };
    },

    answer(startedAt) {
      const state = read(KEY_STATE, null) || {};
      return write(KEY_STATE, { ...state, answered: true, startedAt });
    },

    bumpNo() {
      const state = read(KEY_STATE, null) || {};
      const next = (typeof state.noCount === 'number' ? state.noCount : 0) + 1;
      write(KEY_STATE, { ...state, noCount: next });
      return next;
    },

    getLetters() {
      const list = read(KEY_LETTERS, []);
      return Array.isArray(list) ? list : [];
    },

    setLetters(list) {
      return write(KEY_LETTERS, list);
    },

    addLetter(letter) {
      const list = store.getLetters();
      list.push(letter);
      return store.setLetters(list) ? list : null;
    },

    removeLetter(id) {
      const list = store.getLetters().filter((letter) => letter.id !== id);
      return store.setLetters(list);
    },

    reset() {
      try {
        if (storageOk) {
          global.localStorage.removeItem(KEY_STATE);
          global.localStorage.removeItem(KEY_LETTERS);
        }
      } catch (error) {
        // si el navegador no deja borrar, tampoco pasa nada
      }
      Object.keys(memory).forEach((key) => delete memory[key]);
    },
  };

  LOVE.store = store;
})(window);
