(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Buttons: sanft zur Textstelle gleiten ---- */
  var litTimer, arrTimer;
  document.querySelectorAll('[data-go]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      var target = document.querySelector(el.getAttribute('data-go'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      document.querySelectorAll('.arrived').forEach(function (s) { s.classList.remove('arrived'); });
      document.querySelectorAll('.key.lit').forEach(function (k) { k.classList.remove('lit'); });
      clearTimeout(arrTimer); clearTimeout(litTimer);
      var delay = reduce ? 0 : 650;
      arrTimer = setTimeout(function () {
        if (target.id !== 'top') target.classList.add('arrived');
        var m = el.getAttribute('data-mark');
        if (m) { var k = target.querySelector('.key[data-k="' + m + '"]'); if (k) k.classList.add('lit'); }
      }, delay);
      litTimer = setTimeout(function () {
        target.classList.remove('arrived');
        document.querySelectorAll('.key.lit').forEach(function (k) { k.classList.remove('lit'); });
      }, delay + 3200);
    });
  });

  /* ---- Button-Hover folgt dem Finger bzw. Mauszeiger ---- */
  document.querySelectorAll('.btn').forEach(function (b) {
    function pos(e) {
      var r = b.getBoundingClientRect();
      b.style.setProperty('--x', (e.clientX - r.left) + 'px');
      b.style.setProperty('--y', (e.clientY - r.top) + 'px');
    }
    b.addEventListener('pointerenter', pos);
    b.addEventListener('pointermove', pos);
    b.addEventListener('pointerdown', pos);
  });

  /* ---- Einblend-Animationen: Buchstaben steigen auf, Bilder öffnen sich ---- */
  (function () {
    var targets = document.querySelectorAll('.photo, .cine-wrap, .arch, .title, .big, .join, .sub');
    if (reduce || !('IntersectionObserver' in window)) {
      targets.forEach(function (t) { t.classList.add('in'); });
      return;
    }
    var n = 0;
    function splitNode(node, mode, step) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span');
            w.className = 'w'; w.setAttribute('aria-hidden', 'true');
            var chars = mode === 'chars' ? Array.from(part) : [part];
            chars.forEach(function (ch) {
              var s = document.createElement('span');
              s.className = 'ch'; s.textContent = ch;
              s.style.setProperty('--d', (n * step) + 'ms');
              n++; w.appendChild(s);
            });
            frag.appendChild(w);
          });
          node.replaceChild(frag, c);
        } else if (c.nodeType === 1 && c.tagName !== 'SMALL' && c.tagName !== 'SUP') {
          splitNode(c, mode, step);
        }
      });
    }
    function prep(el, mode, step) {
      var label = Array.prototype.slice.call(el.childNodes)
        .filter(function (x) { return !(x.nodeType === 1 && x.tagName === 'SMALL'); })
        .map(function (x) { return x.textContent; }).join('').replace(/\s+/g, ' ').trim();
      n = 0;
      splitNode(el, mode, step);
      var sr = document.createElement('span');
      sr.className = 'sr'; sr.textContent = label;
      el.insertBefore(sr, el.firstChild);
    }
    document.querySelectorAll('.title').forEach(function (el) { prep(el, 'chars', 38); });
    document.querySelectorAll('.big, .join, .sub').forEach(function (el) { prep(el, 'words', 85); });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: .2, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (t) { io.observe(t); });
  })();

  /* ---- Fotos: einfügen, sanft einbinden, im Browser merken ---- */
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function setImage(fig, src) {
    var img = fig.querySelector('img');
    img.src = src;
    fig.classList.add('has-img');
  }
  document.querySelectorAll('.photo').forEach(function (fig) {
    var id = fig.getAttribute('data-photo');
    var input = fig.querySelector('input[type=file]');
    var slot = fig.querySelector('.slot');
    var saved = load('sd-photo-' + id);
    if (saved) setImage(fig, saved);
    slot.addEventListener('click', function () { input.click(); });
    input.addEventListener('change', function () {
      var f = input.files && input.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        var im = new Image();
        im.onload = function () {
          var max = 1800, s = Math.min(1, max / Math.max(im.width, im.height));
          var c = document.createElement('canvas');
          c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
          c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
          var data = c.toDataURL('image/jpeg', 0.85);
          setImage(fig, data);
          store('sd-photo-' + id, data);
        };
        im.src = reader.result;
      };
      reader.readAsDataURL(f);
      input.value = '';
    });
  });

  var toggle = document.getElementById('editToggle');
  toggle.addEventListener('click', function () {
    var on = document.body.classList.toggle('edit');
    toggle.textContent = on ? 'Fertig' : 'Fotos verwalten';
    document.querySelectorAll('.photo.has-img .slot').forEach(function (s) { s.textContent = 'Foto ändern'; });
  });
})();