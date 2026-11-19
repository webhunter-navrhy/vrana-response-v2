/* Vrána Response v2 – úniková cesta, ciferník roku, tabule, formulář */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- trasa „Jste zde“ ---------- */
  var sekce = $$('[data-sekce]');
  var trasa = $('.trasa');
  var stanice = $$('.trasa-linka a[data-stanice]');
  var menuOdkazy = $$('.plan-menu a[data-stanice]');
  var ujeto = $('[data-ujeto]');
  var tecka = $('[data-tecka]');
  var mobUjeto = $('[data-mob-ujeto]');
  var jsteZde = $('[data-jste-zde]');
  var stredy = [];
  var aktualni = -1;
  var cekam = false;

  function nazevStanice(i) {
    var a = stanice[i];
    var n = a && $('.st-nazev', a);
    return n ? n.textContent.trim() : '';
  }
  function zmerTrasu() {
    if (!trasa || !trasa.offsetWidth) { stredy = []; return; }
    var t = trasa.getBoundingClientRect();
    stredy = stanice.map(function (a) { var r = a.getBoundingClientRect(); return r.left + r.width / 2 - t.left; });
  }
  function polohaScrollu() {
    var vh = window.innerHeight;
    var hranice = vh * 0.4;
    var idx = 0;
    var tops = sekce.map(function (s) { return s.getBoundingClientRect().top; });
    for (var i = 0; i < tops.length; i++) { if (tops[i] <= hranice) idx = i; }
    var frac = 0;
    if (idx < tops.length - 1) {
      var d = tops[idx + 1] - tops[idx];
      frac = d > 0 ? Math.min(1, Math.max(0, (hranice - tops[idx]) / d)) : 0;
    }
    var konec = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (konec) { idx = sekce.length - 1; frac = 0; }
    return { idx: idx, frac: frac };
  }
  function prekresli() {
    cekam = false;
    if (!sekce.length) return;
    var p = polohaScrollu();
    if (p.idx !== aktualni) {
      aktualni = p.idx;
      sekce.forEach(function (s, i) { if (i === p.idx) s.setAttribute('data-aktivni', ''); else s.removeAttribute('data-aktivni'); });
      stanice.forEach(function (a, i) {
        a.classList.toggle('prosel', i < p.idx);
        if (i === p.idx) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
      });
      menuOdkazy.forEach(function (a, i) { if (i === p.idx) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
      if (jsteZde) jsteZde.textContent = nazevStanice(p.idx) || jsteZde.textContent;
      if (tecka) tecka.parentNode.classList.toggle('u-cile', p.idx === sekce.length - 1);
    }
    if (stredy.length === stanice.length && stredy.length) {
      var a = stredy[p.idx];
      var b = p.idx < stredy.length - 1 ? stredy[p.idx + 1] : a;
      var x = a + (b - a) * p.frac;
      if (tecka) tecka.style.transform = 'translateX(' + x.toFixed(1) + 'px)';
      if (ujeto) { ujeto.style.left = stredy[0] + 'px'; ujeto.style.width = Math.max(0, x - stredy[0]).toFixed(1) + 'px'; }
    }
    if (mobUjeto) mobUjeto.style.transform = 'scaleX(' + ((p.idx + p.frac) / Math.max(1, sekce.length - 1)).toFixed(4) + ')';
  }
  function naplanuj() { if (!cekam) { cekam = true; requestAnimationFrame(prekresli); } }
  window.addEventListener('scroll', naplanuj, { passive: true });
  window.addEventListener('resize', function () { zmerTrasu(); naplanuj(); });
  window.addEventListener('load', function () { zmerTrasu(); naplanuj(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { zmerTrasu(); naplanuj(); });
  zmerTrasu(); prekresli();

  /* ---------- menu „Plán“ ---------- */
  var menuTl = $('.menu-tl');
  var menu = $('#plan-menu');
  function zavriMenu() { if (!menu) return; menu.classList.remove('otevreno'); menuTl.setAttribute('aria-expanded', 'false'); }
  if (menuTl && menu) {
    menuTl.addEventListener('click', function () {
      var ot = menu.classList.toggle('otevreno');
      menuTl.setAttribute('aria-expanded', ot ? 'true' : 'false');
    });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', zavriMenu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('otevreno')) { zavriMenu(); menuTl.focus(); } });
    document.addEventListener('click', function (e) { if (!e.target.closest('.hlavicka')) zavriMenu(); });
  }

  /* ---------- zájem z tlačítek → formulář ---------- */
  function zaskrtni(hodnota) {
    $$('input[name="zajem"]').forEach(function (i) { if (i.value === hodnota) i.checked = true; });
  }
  $$('[data-zajem]').forEach(function (a) {
    a.addEventListener('click', function () { zaskrtni(a.getAttribute('data-zajem')); });
  });

  /* ---------- ciferník ročního programu ---------- */
  var MESICE = ['leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'];
  var MESICE_2 = ['ledna', 'února', 'března', 'dubna', 'května', 'června', 'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'];
  var ZKRATKY = ['led', 'úno', 'bře', 'dub', 'kvě', 'čvn', 'čvc', 'srp', 'zář', 'říj', 'lis', 'pro'];
  var planovac = $('[data-planovac]');
  if (planovac) {
    var okruhy = [];
    try { okruhy = JSON.parse($('#okruhy-data').textContent); } catch (e) { okruhy = []; }
    var nazevOkruhu = function (c) { for (var i = 0; i < okruhy.length; i++) if (okruhy[i].c === c) return okruhy[i].nazev; return ''; };
    var svg = $('[data-cifernik]', planovac);
    var velke = $('[data-cif-velke]', planovac);
    var male = $('[data-cif-male]', planovac);
    var napoveda = $('[data-napoveda]', planovac);
    var souhrn = $('[data-souhrn]', planovac);
    var startSel = $('[data-start]', planovac);
    var prepinace = $$('.prepinac [role="radio"]', planovac);
    var okruhTl = $$('.okruh', planovac);
    var rezim = 12;
    var start = 0;
    var vybrane6 = [1, 2, 3, 4, 5, 6];
    var NS = 'http://www.w3.org/2000/svg';
    var d2 = function (n) { return (n < 10 ? '0' : '') + n; };

    // výchozí start: příští měsíc
    var dnes = new Date();
    start = (dnes.getMonth() + 1) % 12;
    if (startSel) startSel.value = String(start);

    function plan() {
      var vysl = [];
      var serazene = vybrane6.slice().sort(function (a, b) { return a - b; });
      for (var i = 0; i < 12; i++) {
        var m = (start + i) % 12;
        if (rezim === 12) vysl.push({ m: m, kurz: i + 1, o: i + 1 });
        else if (i % 2 === 0) vysl.push({ m: m, kurz: i / 2 + 1, o: serazene[i / 2] || null });
        else vysl.push({ m: m, volno: true });
      }
      return vysl;
    }
    function bod(r, uhel) { var a = uhel * Math.PI / 180; return [(r * Math.cos(a)).toFixed(2), (r * Math.sin(a)).toFixed(2)]; }
    function oblouk(i) {
      var s = -90 + i * 30 - 14, e = -90 + i * 30 + 14, R = 150, r = 98;
      var p1 = bod(R, s), p2 = bod(R, e), p3 = bod(r, e), p4 = bod(r, s);
      return 'M' + p1 + 'A' + R + ' ' + R + ' 0 0 1 ' + p2 + 'L' + p3 + 'A' + r + ' ' + r + ' 0 0 0 ' + p4 + 'Z';
    }
    function el(tag, attrs, rodic) {
      var x = document.createElementNS(NS, tag);
      for (var k in attrs) x.setAttribute(k, attrs[k]);
      if (rodic) rodic.appendChild(x);
      return x;
    }
    // jednorázová stavba
    var titulek = $('title', svg);
    el('circle', { 'class': 'kruh-v', r: 186 }, svg);
    el('circle', { 'class': 'kruh-v', r: 86 }, svg);
    var dily = [], popisky = [];
    for (var i = 0; i < 12; i++) {
      var g = el('g', { 'class': 'dil', tabindex: '0', role: 'button', 'data-i': i }, svg);
      el('path', { d: oblouk(i) }, g);
      var st = bod(124, -90 + i * 30);
      var t = el('text', { 'class': 'dil-c', x: st[0], y: st[1] }, g);
      dily.push({ g: g, t: t });
      var lp = bod(172, -90 + i * 30);
      popisky.push(el('text', { 'class': 'mesic-t', x: lp[0], y: lp[1] }, svg));
    }
    el('path', { 'class': 'start-znak', d: 'M0 -198 L7 -186 L-7 -186 Z' }, svg);
    if (titulek) svg.insertBefore(titulek, svg.firstChild);

    function vychoziStred() {
      velke.classList.remove('text');
      if (rezim === 12) { velke.textContent = '12'; male.innerHTML = 'kurzů za rok<br>jeden každý měsíc'; }
      else { velke.textContent = '6'; male.innerHTML = 'kurzů za rok<br>každý druhý měsíc'; }
    }
    function ukazDil(i) {
      var p = plan()[i];
      velke.classList.add('text');
      velke.textContent = MESICE[p.m];
      if (p.volno) male.textContent = 'volný měsíc';
      else if (p.o) male.textContent = p.kurz + '. kurz · ' + d2(p.o) + ' ' + nazevOkruhu(p.o);
      else male.textContent = p.kurz + '. kurz · okruh zatím nevybrán';
    }
    function zvyrazniOkruh(c, zap) {
      var pl = plan();
      dily.forEach(function (d, i) { d.g.classList.toggle('zvyrazneny', !!(zap && pl[i].o === c)); });
      okruhTl.forEach(function (b) { b.classList.toggle('zvyrazneny', !!(zap && +b.getAttribute('data-c') === c)); });
    }
    function sklon(n) { return n === 1 ? 'okruh' : (n >= 2 && n <= 4 ? 'okruhy' : 'okruhů'); }

    function vykresli() {
      planovac.setAttribute('data-rezim', String(rezim));
      var pl = plan();
      var hotovo = 0;
      pl.forEach(function (p, i) {
        var d = dily[i];
        d.g.classList.toggle('aktivni', !p.volno && !!p.o);
        d.g.classList.toggle('prazdny', !p.volno && !p.o);
        d.t.textContent = p.volno ? '' : (p.o ? d2(p.o) : '?');
        var lab = MESICE[p.m] + ': ' + (p.volno ? 'volný měsíc' : (p.o ? p.kurz + '. kurz, okruh ' + p.o + ' ' + nazevOkruhu(p.o) : p.kurz + '. kurz, okruh nevybrán'));
        d.g.setAttribute('aria-label', lab);
        popisky[i].textContent = ZKRATKY[p.m];
        popisky[i].setAttribute('class', 'mesic-t' + (i === 0 ? ' start' : ''));
        if (p.o) hotovo++;
      });
      okruhTl.forEach(function (b) {
        var c = +b.getAttribute('data-c');
        var mesic = '';
        pl.forEach(function (p) { if (p.o === c) mesic = MESICE[p.m]; });
        var zapnuto = rezim === 12 || vybrane6.indexOf(c) >= 0;
        b.setAttribute('aria-pressed', zapnuto ? 'true' : 'false');
        var mEl = $('[data-okruh-mesic]', b);
        if (mEl) mEl.textContent = mesic;
      });
      prepinace.forEach(function (b) {
        var on = +b.getAttribute('data-rezim') === rezim;
        b.setAttribute('aria-checked', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;
      });
      napoveda.classList.remove('varovani');
      if (rezim === 12) {
        napoveda.textContent = 'Každý měsíc jeden okruh, všech 12 za rok.';
        souhrn.innerHTML = '12 kurzů · všech 12 okruhů · od ' + MESICE_2[start];
      } else {
        var zbyva = 6 - vybrane6.length;
        napoveda.textContent = zbyva > 0 ? 'Vyberte ještě ' + zbyva + ' ' + sklon(zbyva) + '.' : 'Máte vybráno 6 okruhů. Jiný vyměníte tak, že nejdřív jeden odškrtnete.';
        souhrn.innerHTML = '6 kurzů · <em>' + vybrane6.length + ' / 6</em> okruhů vybráno · od ' + MESICE_2[start];
      }
      vychoziStred();
    }

    dily.forEach(function (d, i) {
      d.g.addEventListener('mouseenter', function () { ukazDil(i); });
      d.g.addEventListener('focus', function () { ukazDil(i); });
      d.g.addEventListener('mouseleave', vychoziStred);
      d.g.addEventListener('blur', vychoziStred);
      d.g.addEventListener('click', function () { ukazDil(i); });
    });
    okruhTl.forEach(function (b) {
      var c = +b.getAttribute('data-c');
      b.addEventListener('mouseenter', function () { zvyrazniOkruh(c, true); });
      b.addEventListener('mouseleave', function () { zvyrazniOkruh(c, false); });
      b.addEventListener('focus', function () { zvyrazniOkruh(c, true); });
      b.addEventListener('blur', function () { zvyrazniOkruh(c, false); });
      b.addEventListener('click', function () {
        if (rezim === 12) {
          napoveda.textContent = 'Při kurzu každý měsíc projdete všech 12 okruhů. Vlastní výběr má varianta „každý druhý měsíc“.';
          napoveda.classList.add('varovani');
          return;
        }
        var k = vybrane6.indexOf(c);
        if (k >= 0) vybrane6.splice(k, 1);
        else if (vybrane6.length < 6) vybrane6.push(c);
        else {
          napoveda.textContent = 'Už máte 6 okruhů. Nejdřív jeden odškrtněte.';
          napoveda.classList.add('varovani');
          return;
        }
        vykresli();
        zvyrazniOkruh(c, true);
      });
    });
    function nastavRezim(r) { rezim = r; vykresli(); }
    prepinace.forEach(function (b, i) {
      b.addEventListener('click', function () { nastavRezim(+b.getAttribute('data-rezim')); });
      b.addEventListener('keydown', function (e) {
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(e.key) < 0) return;
        e.preventDefault();
        var dalsi = prepinace[(i + 1) % prepinace.length];
        nastavRezim(+dalsi.getAttribute('data-rezim'));
        dalsi.focus();
      });
    });
    if (startSel) startSel.addEventListener('change', function () { start = +startSel.value; vykresli(); });

    var poptat = $('[data-poptat-plan]', planovac);
    if (poptat) poptat.addEventListener('click', function () {
      var ta = $('textarea[name="plan"]');
      if (!ta) return;
      var radky = ['Roční program – ' + (rezim === 12 ? 'každý měsíc (12 kurzů)' : 'každý druhý měsíc (6 kurzů)') + ', začátek: ' + MESICE[start]];
      plan().forEach(function (p) {
        if (p.volno) return;
        radky.push(MESICE[p.m] + ': ' + (p.o ? d2(p.o) + ' ' + nazevOkruhu(p.o) : 'okruh upřesníme'));
      });
      ta.value = radky.join('\n');
      ta.rows = Math.min(radky.length, 13);
      var pole = ta.closest('.pole-plan');
      if (pole) pole.hidden = false;
      $$('input[name="zajem"][data-plan]').forEach(function (i) { i.checked = +i.getAttribute('data-plan') === rezim; });
    });
    vykresli();
  }
  var zrusit = $('.plan-zrusit');
  if (zrusit) zrusit.addEventListener('click', function () {
    var pole = zrusit.closest('.pole-plan');
    var ta = pole && $('textarea', pole);
    if (ta) ta.value = '';
    if (pole) pole.hidden = true;
    $$('input[name="zajem"][data-plan]').forEach(function (i) { i.checked = false; });
  });

  /* ---------- orientační tabule (záložky) ---------- */
  var taby = $$('.tabule [role="tab"]');
  function vyberTab(t, fokus) {
    taby.forEach(function (x) {
      var on = x === t;
      x.setAttribute('aria-selected', on ? 'true' : 'false');
      x.tabIndex = on ? 0 : -1;
      var p = document.getElementById(x.getAttribute('aria-controls'));
      if (p) p.hidden = !on;
    });
    if (fokus) t.focus();
    if (t.scrollIntoView && t.parentElement.scrollWidth > t.parentElement.clientWidth) {
      var rodic = t.parentElement;
      rodic.scrollTo({ left: t.offsetLeft - 16, behavior: 'smooth' });
    }
  }
  taby.forEach(function (t, i) {
    t.addEventListener('click', function () { vyberTab(t, false); });
    t.addEventListener('keydown', function (e) {
      var n = null;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = taby[(i + 1) % taby.length];
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = taby[(i - 1 + taby.length) % taby.length];
      else if (e.key === 'Home') n = taby[0];
      else if (e.key === 'End') n = taby[taby.length - 1];
      if (n) { e.preventDefault(); vyberTab(n, true); }
    });
  });

  /* ---------- formulář (demo) ---------- */
  $$('form.formular').forEach(function (f) {
    var stav = $('.formular-stav', f);
    f.addEventListener('submit', function (e) {
      var past = $('input[name="_gotcha"]', f);
      if (past && past.value) { e.preventDefault(); return; }
      if (f.getAttribute('data-demo') === '1') {
        e.preventDefault();
        if (stav) stav.textContent = 'Ukázka formuláře: nic se neodesílá. Po spuštění webu bude poptávka doručena na e-mail.';
        return;
      }
      var endpoint = f.getAttribute('data-endpoint');
      if (!endpoint || !window.fetch) return;
      e.preventDefault();
      if (stav) stav.textContent = 'Odesílám…';
      fetch(endpoint, { method: 'POST', body: new FormData(f), headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error();
          f.reset();
          if (stav) stav.textContent = 'Děkujeme, poptávka dorazila. Brzy se Vám ozveme.';
        })
        .catch(function () { if (stav) stav.textContent = 'Odeslání se nepovedlo. Napište nám prosím na e-mail.'; });
    });
  });
})();
