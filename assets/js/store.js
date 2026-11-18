(function (global) {
  'use strict';

  const LOVE = (global.LOVE = global.LOVE || {});

  const KEY_STATE = 'kiara.state.v1';
  const KEY_LETTERS = 'kiara.letters.v1';
  const API = '/api/state';
  const TIMEOUT = 1500;

  const memory = {};
  let storageOk = true;
  let preview = false;
  let previewState = { answered: false, startedAt: null, noCount: 0 };

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

  function localState() {
    const state = read(KEY_STATE, null) || {};
    return {
      answered: state.answered === true,
      startedAt: typeof state.startedAt === 'number' ? state.startedAt : null,
      noCount: typeof state.noCount === 'number' ? state.noCount : 0,
    };
  }

  function saveState(patch) {
    const next = { ...localState(), ...patch };
    write(KEY_STATE, next);
    return next;
  }

  async function post(body) {
    const controller = new AbortController();
    const timer = global.setTimeout(() => controller.abort(), TIMEOUT);
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const error = new Error(`http ${res.status}`);
        error.status = res.status;
        throw error;
      }
      return data;
    } finally {
      global.clearTimeout(timer);
    }
  }

  const store = {
    get available() {
      return storageOk;
    },

    configure(options = {}) {
      preview = options.preview === true;
    },

    get preview() {
      return preview;
    },

    /** Lee el estado: primero el servidor, y si no hay, el de este navegador. */
    async load() {
      const local = localState();
      if (preview) return { ...previewState, noCount: local.noCount };

      const controller = new AbortController();
      const timer = global.setTimeout(() => controller.abort(), TIMEOUT);
      try {
        const res = await fetch(API, {
          headers: { accept: 'application/json' },
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`http ${res.status}`);
        const data = await res.json();
        const state = {
          answered: data.answered === true,
          startedAt: typeof data.startedAt === 'number' ? data.startedAt : null,
        };
        saveState(state);
        return { ...state, noCount: local.noCount };
      } catch (error) {
        return local;
      } finally {
        global.clearTimeout(timer);
      }
    },

    getState() {
      if (preview) return { ...previewState, noCount: localState().noCount };
      return localState();
    },

    /** Marca el «sí» y devuelve la hora. Sincrónico para no perder el gesto. */
    answer() {
      const startedAt = Date.now();

      if (preview) {
        previewState = { answered: true, startedAt };
        return startedAt;
      }

      saveState({ answered: true, startedAt });
      post({ action: 'answer' })
        .then((data) => {
          if (data && typeof data.startedAt === 'number') {
            saveState({ answered: true, startedAt: data.startedAt });
          }
        })
        .catch(() => {});

      return startedAt;
    },

    bumpNo() {
      const state = localState();
      const next = state.noCount + 1;
      saveState({ noCount: next });
      if (preview) previewState.noCount = next;
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

    /** Borra el estado en el servidor (necesita la clave) y aquí. */
    async resetRemote(key) {
      const result = { ok: false, reason: 'offline' };

      if (!preview) {
        try {
          await post({ action: 'reset', key });
          result.ok = true;
          result.reason = 'ok';
        } catch (error) {
          result.reason = error.status === 403 ? 'bad-key' : 'offline';
        }
      } else {
        previewState = { answered: false, startedAt: null, noCount: 0 };
        result.ok = true;
        result.reason = 'ok';
      }

      store.reset();
      return result;
    },

    /** Borra sólo lo guardado en este navegador. */
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
      previewState = { answered: false, startedAt: null, noCount: 0 };
    },
  };

  LOVE.store = store;
})(window);
