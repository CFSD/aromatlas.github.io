/*
  Script principal pour la nouvelle fiche de dégustation Aromatlas.
  Ce code gère l’état de l’application (arômes sélectionnés, valeurs
  métriques, notes de notation), met à jour le radar via Chart.js et
  prépare un aperçu imprimable. Les éléments DOM sont générés et
  mis à jour dynamiquement afin de réduire la duplication et
  simplifier la maintenance.
*/

(function () {
  // Définition des métriques du profil sensoriel avec leurs clés et labels
  const METRICS = [
    { key: 'douceur', label: 'Douceur' },
    { key: 'fruit', label: 'Fruits' },
    { key: 'bois', label: 'Bois' },
    { key: 'fumee', label: 'Fumée' },
    { key: 'epices', label: 'Épices' },
    { key: 'amertume', label: 'Amertume' },
    { key: 'salinite', label: 'Salinité' }
  ];

  // Définition des catégories de notation avec leurs identifiants, labels et maximums
  const SCORE_CATEGORIES = [
    { id: 'attrait', label: 'Attrait visuel', max: 5 },
    { id: 'nezInt', label: 'Intensité & complexité (nez)', max: 15 },
    { id: 'nezDist', label: 'Distinction des arômes', max: 10 },
    { id: 'nezEq', label: 'Équilibre des arômes', max: 10 },
    { id: 'palAlc', label: 'Harmonie de l\'alcool', max: 5 },
    { id: 'palCorps', label: 'Corps en bouche', max: 5 },
    { id: 'palEq', label: 'Équilibre des saveurs', max: 10 },
    { id: 'palComplex', label: 'Complexité des saveurs', max: 10 },
    { id: 'palDist', label: 'Distinction des saveurs', max: 10 },
    { id: 'finLen', label: 'Longueur de la finale', max: 10 },
    { id: 'finQual', label: 'Qualité de la finale', max: 10 }
  ];

  // État global de l’application
  const state = {
    picks: [],
    metrics: {},
    scores: {}
  };
  METRICS.forEach((m) => (state.metrics[m.key] = 5));
  SCORE_CATEGORIES.forEach((c) => (state.scores[c.id] = 0));

  // Créer les contrôles de métriques (sliders) dynamiquement
  const metricContainer = document.getElementById('metricControls');
  METRICS.forEach((m) => {
    const row = document.createElement('div');
    row.className = 'metric-row';
    const label = document.createElement('label');
    label.textContent = m.label;
    const rangeWrap = document.createElement('div');
    rangeWrap.className = 'range-wrap';
    const input = document.createElement('input');
    input.type = 'range';
    input.min = 0;
    input.max = 10;
    input.step = 1;
    input.value = state.metrics[m.key];
    input.id = 'm-' + m.key;
    const output = document.createElement('output');
    output.textContent = state.metrics[m.key];
    rangeWrap.appendChild(input);
    rangeWrap.appendChild(output);
    row.appendChild(label);
    row.appendChild(rangeWrap);
    metricContainer.appendChild(row);
    // Mettre à jour la valeur et le radar lorsque l’utilisateur interagit
    input.addEventListener('input', () => {
      state.metrics[m.key] = parseInt(input.value);
      output.textContent = input.value;
      updateChart();
      updatePreview();
    });
  });

  // Créer les contrôles de notation dynamiquement
  const scoreContainer = document.getElementById('scoreControls');
  SCORE_CATEGORIES.forEach((c) => {
    const wrap = document.createElement('div');
    wrap.className = 'score-item';
    const label = document.createElement('label');
    label.textContent = `${c.label} (${c.max})`;
    const input = document.createElement('input');
    input.type = 'number';
    input.min = 0;
    input.max = c.max;
    input.step = 1;
    input.value = 0;
    input.id = 's-' + c.id;
    wrap.appendChild(label);
    wrap.appendChild(input);
    scoreContainer.appendChild(wrap);
    input.addEventListener('input', () => {
      let val = parseInt(input.value);
      if (isNaN(val)) val = 0;
      if (val < 0) val = 0;
      if (val > c.max) val = c.max;
      input.value = val;
      state.scores[c.id] = val;
      updateTotal();
      updatePreview();
    });
  });

  // Initialiser le radar Chart.js
  const ctx = document.getElementById('radarChart').getContext('2d');
  let radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: METRICS.map((m) => m.label),
      datasets: [
        {
          label: 'Profil sensoriel',
          data: METRICS.map((m) => state.metrics[m.key]),
          backgroundColor: 'rgba(0, 122, 255, 0.2)',
          borderColor: 'rgba(0, 122, 255, 0.9)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(0, 122, 255, 1)'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: false,
      scales: {
        r: {
          beginAtZero: true,
          min: 0,
          max: 10,
          ticks: {
            stepSize: 2,
            font: { size: 10 },
            color: getComputedStyle(document.body).getPropertyValue('--muted') || '#666'
          },
          grid: {
            color: '#e5e7eb'
          },
          angleLines: {
            color: '#e5e7eb'
          },
          pointLabels: {
            font: { size: 12 },
            color: getComputedStyle(document.body).getPropertyValue('--text') || '#333'
          }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });

  // Mettre à jour le radar et la version imprimée
  function updateChart() {
    radarChart.data.datasets[0].data = METRICS.map((m) => state.metrics[m.key]);
    radarChart.update();
    // Mettre à jour l’image du radar pour le PDF
    const imgPdf = document.getElementById('pdfRadar');
    if (imgPdf) {
      imgPdf.src = radarChart.toBase64Image('image/png', 1);
    }
  }

  // Calcul du total des notes et mise à jour de l’affichage
  function updateTotal() {
    let sum = 0;
    SCORE_CATEGORIES.forEach((c) => {
      sum += state.scores[c.id] || 0;
    });
    document.getElementById('totalScore').textContent = `${sum} / 100`;
    const pdfTotalEl = document.getElementById('pdfTotal');
    if (pdfTotalEl) {
      pdfTotalEl.textContent = `${sum} / 100`;
    }
  }

  // Rendu des arômes sélectionnés (pastilles) et mise à jour du print
  function renderPicks() {
    const host = document.getElementById('selectedAromas');
    host.innerHTML = '';
    state.picks.forEach((label) => {
      const chip = document.createElement('span');
      // Déterminer la famille pour appliquer une classe de couleur
      const fam = labelToFam[label] || '';
      chip.className = 'chip' + (fam ? ' fam-' + fam : '');
      chip.textContent = label;
      chip.title = 'Supprimer';
      chip.addEventListener('click', () => {
        const idx = state.picks.indexOf(label);
        if (idx >= 0) {
          state.picks.splice(idx, 1);
          renderPicks();
          updatePreview();
        }
      });
      host.appendChild(chip);
    });
    // Mettre à jour la version imprimée
    const pdfHost = document.getElementById('pdfAromas');
    if (pdfHost) {
      pdfHost.innerHTML = '';
      state.picks.forEach((label) => {
        const chipPdf = document.createElement('span');
        const fam = labelToFam[label] || '';
        chipPdf.className = 'chip' + (fam ? ' fam-' + fam : '');
        chipPdf.textContent = label;
        pdfHost.appendChild(chipPdf);
      });
    }
  }

  // Mise à jour de l’aperçu imprimable avec les valeurs du formulaire
  function updatePreview() {
    // Mettre à jour le gabarit PDF avec les valeurs du formulaire
    const getVal = (id) => document.getElementById(id).value || '';
    const setTxt = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };
    setTxt('pdfDate', getVal('fDate'));
    setTxt('pdfName', getVal('fName'));
    setTxt('pdfDistillery', getVal('fDistillery'));
    setTxt('pdfBottler', getVal('fBottler'));
    setTxt('pdfAge', getVal('fAge'));
    setTxt('pdfVintage', getVal('fVintage'));
    setTxt('pdfColor', getVal('fColor'));
    const abvVal = document.getElementById('fAbv').value;
    setTxt('pdfAbv', abvVal ? `${abvVal} %` : '');
    // Notes
    const notes = document.getElementById('fNotes').value || '';
    const notesEl = document.getElementById('pdfNotes');
    if (notesEl) notesEl.textContent = notes;
    // Flags
    const flagsEl = document.getElementById('pdfFlags');
    if (flagsEl) {
      flagsEl.innerHTML = '';
      const labels = {
        Cask: 'Brut de fût',
        Single: 'Fût unique',
        Ncf: 'Non filtré à froid',
        NoCol: 'Non coloré'
      };
      ['Cask', 'Single', 'Ncf', 'NoCol'].forEach((flag) => {
        if (document.getElementById('f' + flag).checked) {
          const span = document.createElement('span');
          span.className = 'flag';
          span.textContent = labels[flag];
          flagsEl.appendChild(span);
        }
      });
    }
    // Scores table
    // Construction des sections de notation pour le PDF (par type)
    const sectionsHost = document.getElementById('pdfNoteSections');
    if (sectionsHost) {
      sectionsHost.innerHTML = '';
      const GROUPS = [
        {
          title: 'Apparence',
          desc: 'Évaluer la viscosité (larmes), la brillance, et la limpidité du whisky.',
          items: ['attrait']
        },
        {
          title: 'Nez',
          desc: 'Juger l\'intensité, la complexité et l\'équilibre des arômes.',
          items: ['nezInt', 'nezDist', 'nezEq']
        },
        {
          title: 'Palais',
          desc: 'Évaluer l\'équilibre des saveurs, la structure en bouche et la complexité.',
          items: ['palAlc', 'palCorps', 'palEq', 'palComplex', 'palDist']
        },
        {
          title: 'Finale',
          desc: 'Mesurer la longueur et la qualité des saveurs après dégustation.',
          items: ['finLen', 'finQual']
        }
      ];
      GROUPS.forEach((grp) => {
        const sec = document.createElement('div');
        sec.className = 'pdf-section';
        const h3 = document.createElement('h3');
        h3.textContent = grp.title;
        sec.appendChild(h3);
        const p = document.createElement('p');
        p.className = 'pdf-desc';
        p.textContent = grp.desc;
        sec.appendChild(p);
        // Critères
        grp.items.forEach((id) => {
          const cat = SCORE_CATEGORIES.find((c) => c.id === id);
          if (!cat) return;
          const row = document.createElement('div');
          row.className = 'criteria-row';
          const spLabel = document.createElement('span');
          spLabel.textContent = cat.label;
          const spVal = document.createElement('span');
          const val = state.scores[cat.id] || 0;
          spVal.textContent = `${val} / ${cat.max}`;
          row.appendChild(spLabel);
          row.appendChild(spVal);
          sec.appendChild(row);
        });
        sectionsHost.appendChild(sec);
      });
    }
    // Mise à jour des totaux et du radar dans le PDF
    updateTotal();
    updateChart();
  }

  // Construction de la liste aplatie pour la recherche d’arômes
  const ATLAS = {
    'FRUITÉ': {
      _fam: 'fruite',
      Agrumes: ['citron', 'citron vert', 'orange', 'mandarine', 'pamplemousse'],
      'Fruits tropicaux': ['ananas', 'mangue', 'banane', 'papaye', 'fruit de la passion', 'melon'],
      'Fruits à pépins': ['pomme', 'pomme verte', 'poire', 'coing'],
      'Fruits à noyau': ['pêche', 'abricot', 'prune', 'mirabelle'],
      'Baies rouges': ['fraise', 'framboise', 'cassis', 'mûre', 'myrtille'],
      'Fruits secs': ['raisin sec', 'pruneau', 'figue sèche', 'abricot sec', 'dattes']
    },
    FLORAL: {
      _fam: 'floral',
      'Notes florales': ['fleur d’oranger', 'rose', 'bruyère', 'géranium', 'lavande', 'violette']
    },
    HERBACÉ: {
      _fam: 'herbace',
      'Notes herbacées': ['herbe coupée', 'menthe', 'eucalyptus', 'genévrier', 'feuille de tabac', 'foin', 'thym', 'pin']
    },
    CÉRÉALE: {
      _fam: 'cereale',
      Torréfié: ['biscuit', 'toast', 'café', 'cacao', 'chocolat'],
      Levures: ['pain frais', 'pâte levée', 'brioche', 'yaourt/fromage frais']
    },
    'QUEUE DE DISTILLATION': {
      _fam: 'queue',
      'Queue de distillation': ['huile minérale', 'cire de bougie / paraffine', 'beurre rance', 'savon', 'métallique', 'cuir', 'sac de jute']
    },
    TOURBÉ: {
      _fam: 'tourbe',
      Tourbé: ['fumé', 'tourbe', 'terre humide', 'mousse d’arbre', 'médicinal', 'vieux bandage', 'bacon', 'goudron', 'caoutchouc', 'kérosène', 'silex', 'poisson / fruits de mer', 'iode', 'algue', 'soufre']
    },
    'ÉLEVAGE EN FÛT DE CHÊNE': {
      _fam: 'elevage',
      Boisé: ['chêne', 'cèdre', 'bois de santal', 'vanille', 'caramel', 'miel'],
      Épicé: ['cannelle', 'girofle', 'gingembre', 'poivre', 'noix de muscade', 'cardamome'],
      Vineux: ['sherry / xérès', 'madère', 'porto', 'vin rouge', 'sauternes'],
      Noix: ['noix', 'noisette', 'amande', 'noix de coco', 'pralin', 'nougat']
    }
  };

  const INFO = {
    banane: { classe: 'Esters (acétates)', composés: 'Acétate d’isoamyle', origine: 'Fermentation longue et chaude favorisant les esters fruités ; reflux doux à la distillation.', fut: 'Fûts bourbon 1er remplissage préservent ces esters ; trop d’extraction peut les estomper.', tips: 'Très fréquent dans certains single malts non tourbés.', styles: 'Irish Pot Still, Speyside jeune.' },
    pomme: { classe: 'Esters (hexanoates/acétates)', composés: 'Hexanoate d’éthyle, acétate d’éthyle', origine: 'Levures produisant acides gras + éthanol ⇒ esters ; têtes larges accentuent l’acétate.', fut: 'Refill bourbon conserve la verdeur.', tips: 'S’apaise avec l’oxydation ; revient avec un trait d’eau.', styles: 'Lowlands, Speyside légers.' },
    poire: { classe: 'Esters', composés: 'Acétate d’hexyle, butyrate d’éthyle', origine: 'Fermentation à basse T°, levures très estérifiantes.', fut: 'Refill bourbon ; certains vins doux renforcent la poire.', tips: 'Très volatil : ressenti surtout au nez.', styles: 'Speyside, Irish' },
    ananas: { classe: 'Esters', composés: 'Butyrate/hexanoate d’éthyle', origine: 'Fermentation riche en acides gras ; distillation avec reflux.', fut: 'Bourbon & ex-rum finish amplifient.', tips: 'Avec noix de coco (lactones) ⇒ ‘pina colada’.', styles: 'Highlands fruités' },
    citron: { classe: 'Terpènes / Aldéhydes', composés: 'Limonène, citral', origine: 'Congénères légers captés en têtes ; distillation propre.', fut: 'Refill/fort toast pour garder la vivacité.', tips: 'Parfois avec ‘pierre à fusil’.', styles: 'Maritime, Highlands' },
    lavande: { classe: 'Terpènes', composés: 'Linalol', origine: 'Fermentation ‘propre’, distillation douce.', fut: 'Refill bourbon, sherry masque souvent ces notes.', tips: 'Fragile à l’oxydation en verre.', styles: 'Speyside' },
    menthe: { classe: 'Terpènes / Phénols légers', composés: 'Menthol, eucalyptol', origine: 'Reflux + coupe serrée.', fut: 'American oak → ‘menthe‑chocolat’ avec cacao/furfural.', tips: 'Sensation fraîche.', styles: 'Bourbon cask' },
    chocolat: { classe: 'Furannes / Pyrazines', composés: '5-Méthylfurfural, pyrazines', origine: 'Toast/char élevé ; Maillard des douelles.', fut: 'American oak fortement bousiné ; rechar/STR.', tips: 'Souvent avec café/cacao/biscuit.', styles: 'Sherry butt, STR' },
    biscuit: { classe: 'Maillard', composés: 'Maltol, cyclotène', origine: 'Kilning/concassage ; distillation peu réductrice.', fut: 'Bourbon cask, toasts moyens.', tips: 'Texture maltée.', styles: 'Highlands' },
    fumé: { classe: 'Phénols', composés: 'Gaïacol, crésols, syringol', origine: 'Malt séché à la tourbe ; ppm + coupe ‘cœur’ = intensité.', fut: 'Rechar → fumé‑sucré ; refill atténue.', tips: 'Fumée sèche (gaïacol) vs médicinal (p‑crésol).', styles: 'Islay, Orkney' },
    tourbe: { classe: 'Phénols / Terpènes', composés: 'Crésols, phénol, 4‑éthylgaïacol', origine: 'Kilning tourbé ; distillation courte/huileuse.', fut: 'Refill pour pureté ; sherry = tourbe ‘gourmande’.', tips: 'Persistance rétro‑olfactive longue.', styles: 'Islay, peated Highlands' },
    médicinal: { classe: 'Phénols', composés: 'p‑Crésol, gaïacol', origine: 'Tourbe côtière + worm tub ⇒ notes lourdes.', fut: 'Refill maintient l’aspect hôpital ; sherry arrondit.', tips: 'Souvent indice de coupe légèrement basse.', styles: 'South Islay' },
    vanille: { classe: 'Aldéhydes phénoliques', composés: 'Vanilline', origine: 'Dégradation lignine (chauffe du chêne).', fut: 'Quercus alba 1er remplissage = boost vanille.', tips: 'Adoucit et arrondit.', styles: 'Bourbon cask & bourbon' },
    caramel: { classe: 'Furannes', composés: 'Furfural, HMF', origine: 'Toast/char ; Maillard des sucres.', fut: 'Rechar/char élevé.', tips: 'Peut virer ‘brûlé’ si sur‑extraction.', styles: 'Bourbon & sherry' },
    'noix de coco': { classe: 'Lactones', composés: 'β‑methyl‑γ‑octalactone (cis/trans)', origine: 'Chêne américain riche en lactones.', fut: 'Bourbon 1er remplissage = coco/crème.', tips: 'Avec ananas ⇒ pina colada.', styles: 'Bourbon cask' },
    cannelle: { classe: 'Aldéhydes / Phénols épicés', composés: 'Cinnamaldéhyde, eugénol', origine: 'Chêne européen + toast modéré.', fut: 'Sherry butt/hogshead européens.', tips: 'Épice sèche en finale.', styles: 'Sherry cask' },
    noix: { classe: 'Aldéhydes oxydatifs', composés: 'Acétaldéhyde, sotolon', origine: 'Maturation oxydative (sherry) ; long vieillissement.', fut: 'Oloroso/PX ⇒ fruits secs & noix.', tips: 'Rancio si très âgé.', styles: 'Sherry matured' }
  };

  const FLAT = [];
  Object.entries(ATLAS).forEach(([fam, groups]) => {
    Object.entries(groups).forEach(([grp, items]) => {
      if (grp === '_fam') return;
      items.forEach((label) => {
        FLAT.push({ fam, group: grp, label, path: `${fam} › ${grp}` });
      });
    });
  });

  // Crée un mappage label → code de famille (fam) pour appliquer
  // des classes de couleur aux pastilles. Le code est extrait du
  // champ _fam défini dans ATLAS ou dérivé du nom de la famille.
  const labelToFam = {};
  Object.entries(ATLAS).forEach(([familyName, groups]) => {
    const famCode = groups._fam || familyName.toLowerCase();
    Object.entries(groups).forEach(([grp, items]) => {
      if (grp === '_fam') return;
      items.forEach((lbl) => {
        labelToFam[lbl] = famCode;
      });
    });
  });
  function normalize(s) {
    return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  // Contrôles et interactions de l’overlay
  const overlay = document.getElementById('paletteOverlay');
  const palSearch = document.getElementById('palSearch');
  const palResults = document.getElementById('palResults');
  const palClose = document.getElementById('palClose');
  const openPaletteBtn = document.getElementById('openPalette');
  const tooltip = document.getElementById('tooltip');

  function openOverlay() {
    overlay.setAttribute('aria-hidden', 'false');
    // Ajoute une classe pour forcer l’affichage de l’overlay (voir atlas.css)
    overlay.classList.add('open');
    palSearch.value = '';
    renderList('');
    setTimeout(() => palSearch.focus(), 0);
  }
  function closeOverlay() {
    overlay.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('open');
    hideTip();
  }
  if (openPaletteBtn) openPaletteBtn.addEventListener('click', openOverlay);
  if (palClose) palClose.addEventListener('click', closeOverlay);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeOverlay();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.getAttribute('aria-hidden') === 'false') {
      closeOverlay();
    }
  });

  function renderList(q) {
    const query = normalize(q);
    palResults.innerHTML = '';
    const items = FLAT.filter((x) => !query || normalize(x.label).includes(query) || normalize(x.path).includes(query));
    items.forEach((x) => {
      const row = document.createElement('div');
      row.className = 'row';
      row.setAttribute('role', 'option');
      row.dataset.label = x.label;
      // Récupérer le code de famille pour le badge
      const famCode = labelToFam[x.label] || '';
      const famClass = famCode ? ' fam-' + famCode : '';
      row.innerHTML = `<span class="leaf-badge${famClass}">${x.label}</span><span class="path">— ${x.path}</span>`;
      if (state.picks.includes(x.label)) {
        row.setAttribute('aria-selected', 'true');
      }
      row.addEventListener('click', () => {
        const idx = state.picks.indexOf(x.label);
        if (idx >= 0) {
          state.picks.splice(idx, 1);
        } else {
          state.picks.push(x.label);
        }
        renderPicks();
        updatePreview();
        if (state.picks.includes(x.label)) {
          row.setAttribute('aria-selected', 'true');
        } else {
          row.removeAttribute('aria-selected');
        }
      });
      row.addEventListener('mouseenter', (ev) => showTip(x.label, ev.clientX, ev.clientY));
      row.addEventListener('mousemove', (ev) => moveTip(ev.clientX, ev.clientY));
      row.addEventListener('mouseleave', hideTip);
      palResults.appendChild(row);
    });
  }
  palSearch.addEventListener('input', (e) => {
    renderList(e.target.value);
  });

  // Fonctions de tooltip
  function showTip(label, x, y) {
    const d = INFO[label] || { classe: '—', composés: '—', origine: '—', fut: '—', tips: '—', styles: '—' };
    tooltip.innerHTML = `<h4>${label} <small>• ${d.classe}</small></h4>` +
      `<div class="line"><div class="k">Composés</div><div class="v">${d.composés}</div></div>` +
      `<div class="line"><div class="k">Origine</div><div class="v">${d.origine}</div></div>` +
      `<div class="line"><div class="k">Fût</div><div class="v">${d.fut}</div></div>` +
      `<div class="line"><div class="k">Dégustation</div><div class="v">${d.tips}</div></div>` +
      `<div class="line"><div class="k">Styles</div><div class="v">${d.styles}</div></div>`;
    tooltip.style.display = 'block';
    tooltip.style.left = x + 16 + 'px';
    tooltip.style.top = y - 20 + 'px';
    tooltip.setAttribute('aria-hidden', 'false');
  }
  function moveTip(x, y) {
    if (tooltip.style.display === 'block') {
      tooltip.style.left = x + 16 + 'px';
      tooltip.style.top = y - 20 + 'px';
    }
  }
  function hideTip() {
    tooltip.style.display = 'none';
    tooltip.setAttribute('aria-hidden', 'true');
  }

  // Afficher l’infobulle lors du survol des pastilles sélectionnées
  document.getElementById('selectedAromas').addEventListener('mousemove', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) {
      hideTip();
      return;
    }
    const label = chip.textContent.trim();
    const rect = chip.getBoundingClientRect();
    showTip(label, rect.right, rect.top);
  });
  document.getElementById('selectedAromas').addEventListener('mouseleave', hideTip);

  // Exportation PDF
  document.getElementById('exportPdf').addEventListener('click', () => {
    // Préparer le gabarit PDF et mettre à jour les valeurs
    updatePreview();
    try {
      window.scrollTo(0, 0);
    } catch (err) {}
    const pdfWrapper = document.getElementById('pdfTemplate');
    // Afficher temporairement le gabarit pour la capture
    const previousDisplay = pdfWrapper.style.display;
    pdfWrapper.style.display = 'block';
    const targetEl = pdfWrapper;
    const opt = {
      // Pas de marge supplémentaire, la largeur du conteneur PDF est déjà définie en mm
      margin: 0,
      filename: (() => {
        const nameVal = document.getElementById('fName').value.trim();
        const slug = normalize(nameVal).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'fiche';
        const dateVal = document.getElementById('fDate').value;
        const datePart = dateVal || new Date().toISOString().split('T')[0];
        return `fiche-degustation-${datePart}-${slug}.pdf`;
      })(),
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 4, useCORS: true, scrollX: 0, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    html2pdf()
      .set(opt)
      .from(targetEl)
      .save()
      .then(() => {
        // Rétablir l’affichage initial
        pdfWrapper.style.display = previousDisplay;
      })
      .catch(() => {
        pdfWrapper.style.display = previousDisplay;
      });
  });

  // Réinitialisation de tous les champs
  document.getElementById('resetAll').addEventListener('click', () => {
    if (!confirm('Effacer tous les champs et arômes ?')) return;
    // Réinitialiser les champs de texte
    document.querySelectorAll('.input').forEach((inp) => {
      inp.value = '';
    });
    document.getElementById('fAbv').value = '';
    document.getElementById('fNotes').value = '';
    ['Cask', 'Single', 'Ncf', 'NoCol'].forEach((flag) => {
      document.getElementById('f' + flag).checked = false;
    });
    // Réinitialiser les métriques
    METRICS.forEach((m) => {
      state.metrics[m.key] = 5;
      const slider = document.getElementById('m-' + m.key);
      slider.value = 5;
      slider.nextSibling.textContent = '5';
    });
    // Réinitialiser les notes
    SCORE_CATEGORIES.forEach((c) => {
      state.scores[c.id] = 0;
      const input = document.getElementById('s-' + c.id);
      input.value = 0;
    });
    // Vider la liste des arômes
    state.picks = [];
    renderPicks();
    updatePreview();
    updateChart();
  });

  // Rendu initial
  renderPicks();
  updatePreview();
  updateChart();
})();