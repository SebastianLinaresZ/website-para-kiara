(function (global) {
  'use strict';

  const LOVE = (global.LOVE = global.LOVE || {});
  const config = global.LOVE_CONFIG;

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const total = Math.floor(seconds);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  }

  function setupPlayer() {
    const root = document.getElementById('player');
    const audio = document.getElementById('background-music');
    const titleEl = document.getElementById('player-title');
    const timeEl = document.getElementById('player-time');
    const toggleBtn = document.getElementById('player-toggle');
    const prevBtn = document.getElementById('player-prev');
    const nextBtn = document.getElementById('player-next');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    const bar = document.getElementById('player-bar');
    const fill = document.getElementById('player-fill');
    const volumeBtn = document.getElementById('player-volume-btn');
    const volumeBox = document.getElementById('player-volume');
    const volumeRange = document.getElementById('player-volume-range');
    const empty = { reveal() {}, play() {} };

    if (!root || !audio || !bar || !fill) return empty;

    const list = Array.isArray(config.music.tracks)
      ? config.music.tracks.filter((track) => track && track.src)
      : [];
    if (!list.length) return empty;

    let index = 0;
    let revealed = false;
    let dragging = false;
    let failures = 0;

    const initialVolume = Number(config.music.volume);
    audio.volume = Number.isFinite(initialVolume)
      ? Math.min(Math.max(initialVolume, 0), 1)
      : 0.5;
    volumeRange.value = String(audio.volume);

    function setPlayingUi(playing) {
      playIcon.classList.toggle('is-hidden', playing);
      pauseIcon.classList.toggle('is-hidden', !playing);
      toggleBtn.setAttribute('aria-pressed', String(playing));
      toggleBtn.setAttribute('aria-label', playing ? 'Pausar' : 'Reproducir');
    }

    function paint() {
      const duration = audio.duration;
      const ratio = Number.isFinite(duration) && duration > 0 ? audio.currentTime / duration : 0;
      fill.style.width = `${Math.min(ratio * 100, 100)}%`;
      timeEl.textContent = `${formatTime(audio.currentTime)} / ${formatTime(duration)}`;
      bar.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
      bar.setAttribute('aria-valuetext', timeEl.textContent);
    }

    function load(nextIndex, autoplay) {
      index = (nextIndex + list.length) % list.length;
      const track = list[index];
      titleEl.textContent = track.title || `Canción ${index + 1}`;
      audio.src = track.src;
      fill.style.width = '0%';
      timeEl.textContent = '0:00';
      if (autoplay) play();
    }

    function play() {
      const attempt = audio.play();
      if (attempt && typeof attempt.catch === 'function') {
        attempt.catch(() => setPlayingUi(false));
      }
    }

    function step(delta) {
      if (delta < 0 && audio.currentTime > 3) {
        audio.currentTime = 0;
        return;
      }
      load(index + delta, true);
    }

    function seek(clientX) {
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
      audio.currentTime = ratio * audio.duration;
      paint();
    }

    toggleBtn.addEventListener('click', () => {
      if (audio.paused) play();
      else audio.pause();
    });

    prevBtn.addEventListener('click', () => step(-1));
    nextBtn.addEventListener('click', () => step(1));

    bar.addEventListener('pointerdown', (event) => {
      dragging = true;
      bar.setPointerCapture(event.pointerId);
      seek(event.clientX);
    });

    bar.addEventListener('pointermove', (event) => {
      if (dragging) seek(event.clientX);
    });

    bar.addEventListener('pointerup', (event) => {
      dragging = false;
      bar.releasePointerCapture(event.pointerId);
    });

    bar.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const delta = event.key === 'ArrowLeft' ? -5 : 5;
      audio.currentTime = Math.min(Math.max(audio.currentTime + delta, 0), audio.duration || 0);
      paint();
    });

    volumeBtn.addEventListener('click', () => {
      const visible = volumeBox.classList.toggle('visible');
      volumeBtn.setAttribute('aria-expanded', String(visible));
    });

    volumeRange.addEventListener('input', () => {
      audio.volume = Number(volumeRange.value);
    });

    audio.addEventListener('timeupdate', paint);
    audio.addEventListener('loadedmetadata', paint);
    audio.addEventListener('play', () => setPlayingUi(true));
    audio.addEventListener('pause', () => setPlayingUi(false));
    audio.addEventListener('ended', () => load(index + 1, true));

    audio.addEventListener('canplay', () => {
      failures = 0;
    });

    audio.addEventListener('error', () => {
      failures += 1;
      if (failures < list.length) {
        load(index + 1, true);
      } else {
        setPlayingUi(false);
        titleEl.textContent = 'No se pudo cargar la música';
      }
    });

    load(0, false);

    return {
      reveal() {
        if (revealed) return;
        revealed = true;
        root.classList.add('is-visible');
        if (audio.paused) play();
      },
      play,
    };
  }

  LOVE.audio = { setupPlayer };
})(window);
