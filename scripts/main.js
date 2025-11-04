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
  // EXISTANTS
  banane: { classe: 'Esters (acétates)', composés: 'Acétate d’isoamyle', origine: 'Fermentation longue et chaude favorisant les esters fruités ; reflux doux à la distillation.', fut: 'Fûts bourbon 1er remplissage préservent ces esters ; trop d’extraction peut les estomper.', tips: 'Très fréquent dans certains single malts non tourbés.', styles: 'Irish Pot Still, Speyside jeune.' },
  pomme: { classe: 'Esters (hexanoates/acétates)', composés: 'Hexanoate d’éthyle, acétate d’éthyle', origine: 'Levures produisant acides gras + éthanol ⇒ esters ; têtes larges accentuent l’acétate.', fut: 'Refill bourbon conserve la verdeur.', tips: 'S’apaise avec l’oxydation ; revient avec un trait d’eau.', styles: 'Lowlands, Speyside légers.' },
  poire: { classe: 'Esters', composés: 'Acétate d’hexyle, butyrate d’éthyle', origine: 'Fermentation à basse T°, levures très estérifiantes.', fut: 'Refill bourbon ; certains vins doux renforcent la poire.', tips: 'Très volatil : ressenti surtout au nez.', styles: 'Speyside, Irish' },
  ananas: { classe: 'Esters', composés: 'Butyrate/hexanoate d’éthyle', origine: 'Fermentation riche en acides gras ; distillation avec reflux.', fut: 'Bourbon & ex-rum finish amplifient.', tips: 'Avec noix de coco (lactones) ⇒ “pina colada”.', styles: 'Highlands fruités' },
  citron: { classe: 'Terpènes / Aldéhydes', composés: 'Limonène, citral', origine: 'Congénères légers captés en têtes ; distillation propre.', fut: 'Refill/fort toast pour garder la vivacité.', tips: 'Parfois avec “pierre à fusil”.', styles: 'Maritime, Highlands' },
  lavande: { classe: 'Terpènes', composés: 'Linalol', origine: 'Fermentation “propre”, distillation douce.', fut: 'Refill bourbon, sherry masque souvent ces notes.', tips: 'Fragile à l’oxydation en verre.', styles: 'Speyside' },
  menthe: { classe: 'Terpènes / Phénols légers', composés: 'Menthol, eucalyptol', origine: 'Reflux + coupe serrée.', fut: 'American oak → “menthe-chocolat” avec cacao/furfural.', tips: 'Sensation fraîche.', styles: 'Bourbon cask' },
  chocolat: { classe: 'Furannes / Pyrazines', composés: '5-Méthylfurfural, pyrazines', origine: 'Toast/char élevé ; Maillard des douelles.', fut: 'American oak fortement bousiné ; rechar/STR.', tips: 'Souvent avec café/cacao/biscuit.', styles: 'Sherry butt, STR' },
  biscuit: { classe: 'Maillard', composés: 'Maltol, cyclotène', origine: 'Kilning/concassage ; distillation peu réductrice.', fut: 'Bourbon cask, toasts moyens.', tips: 'Texture maltée.', styles: 'Highlands' },
  fumé: { classe: 'Phénols', composés: 'Gaïacol, crésols, syringol', origine: 'Malt séché à la tourbe ; ppm + coupe “cœur” = intensité.', fut: 'Rechar → fumé-sucré ; refill atténue.', tips: 'Fumée sèche (gaïacol) vs médicinal (p-crésol).', styles: 'Islay, Orkney' },
  tourbe: { classe: 'Phénols / Terpènes', composés: 'Crésols, phénol, 4-éthylgaïacol', origine: 'Kilning tourbé ; distillation courte/huileuse.', fut: 'Refill pour pureté ; sherry = tourbe “gourmande”.', tips: 'Persistance rétro-olfactive longue.', styles: 'Islay, peated Highlands' },
  médicinal: { classe: 'Phénols', composés: 'p-Crésol, gaïacol', origine: 'Tourbe côtière + worm tub ⇒ notes lourdes.', fut: 'Refill maintient l’aspect hôpital ; sherry arrondit.', tips: 'Souvent indice de coupe légèrement basse.', styles: 'South Islay' },
  vanille: { classe: 'Aldéhydes phénoliques', composés: 'Vanilline', origine: 'Dégradation lignine (chauffe du chêne).', fut: 'Quercus alba 1er remplissage = boost vanille.', tips: 'Adoucit et arrondit.', styles: 'Bourbon cask & bourbon' },
  caramel: { classe: 'Furannes', composés: 'Furfural, HMF', origine: 'Toast/char ; Maillard des sucres.', fut: 'Rechar/char élevé.', tips: 'Peut virer “brûlé” si sur-extraction.', styles: 'Bourbon & sherry' },
  'noix de coco': { classe: 'Lactones', composés: 'β-methyl-γ-octalactone (cis/trans)', origine: 'Chêne américain riche en lactones.', fut: 'Bourbon 1er remplissage = coco/crème.', tips: 'Avec ananas ⇒ pina colada.', styles: 'Bourbon cask' },
  cannelle: { classe: 'Aldéhydes / Phénols épicés', composés: 'Cinnamaldéhyde, eugénol', origine: 'Chêne européen + toast modéré.', fut: 'Sherry butt/hogshead européens.', tips: 'Épice sèche en finale.', styles: 'Sherry cask' },
  noix: { classe: 'Aldéhydes oxydatifs', composés: 'Acétaldéhyde, sotolon', origine: 'Maturation oxydative (sherry) ; long vieillissement.', fut: 'Oloroso/PX ⇒ fruits secs & noix.', tips: 'Rancio si très âgé.', styles: 'Sherry matured' },

  // AJOUTS (tout ATLAS manquant)
  'citron vert': { classe: 'Terpènes / Aldéhydes', composés: 'Limonène, citral (géranial/néral)', origine: 'Congénères très volatils captés en têtes de distillation ; fermentation “propre” et reflux modéré favorisent la netteté.', fut: 'Refill bourbon ou toast léger pour préserver la fraîcheur ; fûts très extractifs l’estompent.', tips: 'Plus vif et “tranchant” que citron ; souvent perçu dès l’ouverture.', styles: 'Highlands maritimes, Lowlands légers.' },
  orange: { classe: 'Terpènes / Esters légers', composés: 'd-Limonène, acétate d’hexyle', origine: 'Fermentations nettes + coupe plutôt haute (têtes) ; oxydation douce → écorce d’orange/confite.', fut: 'Sherry/porto → orange confite ; bourbon refill → zestes frais.', tips: 'Souvent avec miel/vanille en bouche.', styles: 'Highlands, Speyside doux.' },
  mandarine: { classe: 'Terpènes', composés: 'Limonène, γ-terpinène', origine: 'Distillation propre avec forte proportion de composés de tête ; fermentation à faible soufre.', fut: 'Bourbon 1er remplissage pour le côté juteux ; refill pour plus de finesse.', tips: 'Plus douce et sucrée que l’orange.', styles: 'Speyside jeune, Irish pot still léger.' },
  pamplemousse: { classe: 'Terpènes / Cétone sesquiterpénique', composés: 'Nootkatone, limonène', origine: 'Composés de tête + oxydation contrôlée créent l’amertume typique.', fut: 'Refill (peu d’extraction) pour garder l’amertume fraîche.', tips: 'Peut tirer vers “zeste amer” en finale.', styles: 'Côtiers, Highlands secs.' },

  mangue: { classe: 'Esters d’acides gras', composés: 'Butyrate d’éthyle, caproate d’éthyle', origine: 'Fermentation riche et longue (levures très estérifiantes) + reflux à la distillation.', fut: 'Bourbon 1er remplissage, ex-rum finish → mangue juteuse.', tips: 'Souvent accompagnée de pêche/abricot.', styles: 'Highlands fruités, quelques Irish.' },
  papaye: { classe: 'Esters légers', composés: 'Butyrate d’éthyle, hexanoate d’éthyle', origine: 'Fermentation chaude et nutritive ; coupes propres pour garder la note exotique.', fut: 'Bourbon doux ; fûts très oxydatifs l’effacent.', tips: 'Arôme surtout au nez, très volatil.', styles: 'Malts jeunes et non tourbés.' },
  'fruit de la passion': { classe: 'Esters / traces de thiols', composés: 'Acétate/Butyrate d’éthyle, traces de 3-MH/3-MHA', origine: 'Fermentation expressive ; distillation avec bon reflux.', fut: 'Bourbon neutre ou ex-vin blanc doux pour le côté tropical.', tips: 'Souvent perçu comme “tropical acidulé”.', styles: 'Highlands doux, certaines finitions vin.' },
  melon: { classe: 'Esters / Alcools « verts »', composés: 'Hexanol, acétate d’hexyle', origine: 'Fermentation propre ; coupes hautes pour les arômes “verts”.', fut: 'Refill bourbon pour conserver la délicatesse.', tips: 'Peut rappeler melon miel/cantaloup.', styles: 'Speyside léger.' },

  'pomme verte': { classe: 'Esters (acétate/caproate)', composés: 'Acétate d’éthyle, hexanoate d’éthyle', origine: 'Levures produisant acides gras + coupes hautes (têtes larges).', fut: 'Refill bourbon pour garder la verdeur croquante.', tips: 'Tendance à s’atténuer avec l’oxydation en verre.', styles: 'Lowlands, Speyside.' },
  coing: { classe: 'Esters / Aldéhydes oxydatifs', composés: 'Hexanoate d’éthyle, sotolon (trace)', origine: 'Évolution fruitée → confite avec l’âge (oxydation lente).', fut: 'Sherry/Oloroso pour pâte de coing ; bourbon refill pour coing frais.', tips: 'Souvent avec miel/épices douces.', styles: 'Sherry matured âgés, Irish.' },

  pêche: { classe: 'Esters d’acides gras', composés: 'Octanoate d’éthyle, butyrate d’éthyle, δ-décalactone', origine: 'Fermentation riche ; reflux modéré pour douceur juteuse.', fut: 'Bourbon 1er remplissage → pêche mûre ; sherry → pêche confite.', tips: 'Très fréquent dans malts fruités non tourbés.', styles: 'Highlands, Speyside.' },
  abricot: { classe: 'Esters / Lactones', composés: 'Octanoate d’éthyle, δ-décalactone', origine: 'Fermentation expressive + distillation propre.', fut: 'Bourbon (frais) ; Oloroso (abricot sec/confit).', tips: 'Volatil, surtout au nez.', styles: 'Speyside fruité.' },
  prune: { classe: 'Oxydation / Esters lourds', composés: 'Sotolon, éthyl lactate', origine: 'Vieillissement prolongé et/ou sherry riche.', fut: 'Oloroso/PX → pruneau/prune confite.', tips: 'Souvent avec cacao/noix.', styles: 'Sherry matured âgés.' },
  mirabelle: { classe: 'Esters / Lactones', composés: 'Octanoate d’éthyle, δ-décalactone', origine: 'Fermentation fruitée ; coupes nettes.', fut: 'Bourbon neutre pour la délicatesse.', tips: 'Entre abricot et pomme jaune.', styles: 'Malts doux, parfois continentaux.' },

  fraise: { classe: 'Esters / Furaneones', composés: 'Butyrate d’éthyle, furaneol', origine: 'Fermentations très estérifiantes ; distillation propre.', fut: 'Finitions vin rouge/porto → fraise confite.', tips: 'Note de tête sucrée.', styles: 'Finishes “wine cask”, Speyside jeunes.' },
  framboise: { classe: 'Cétones aromatiques / Esters', composés: 'Frambinone (raspberry ketone), acétate d’hexyle', origine: 'Fermentation nette ; peu d’influence de queue.', fut: 'Refill ou vin rouge léger.', tips: 'Souvent avec pétales de rose.', styles: 'Malts légers, finitions vin.' },
  cassis: { classe: 'Esters / Thiols traces', composés: 'β-damascénone, 4MMP (traces)', origine: 'Fermentation expressive ; élevage modéré.', fut: 'Vin rouge/sherry pour cassis confit.', tips: 'Parfois “ribena” au nez.', styles: 'Finishes vin rouge, sherry fruité.' },
  'mûre': { classe: 'Esters / Norisoprénoïdes', composés: 'Ethyl butyrate, β-damascénone', origine: 'Fermentation riche ; coupes nettes.', fut: 'Vin rouge/porto.', tips: 'Donne un fondu de fruits noirs.', styles: 'Highlands/Speyside en finish.' },
  myrtille: { classe: 'Esters / Norisoprénoïdes', composés: 'Ethyl caproate, β-ionone (trace)', origine: 'Fermentation expressive ; distillation “propre”.', fut: 'Refill pour garder le côté bleuet.', tips: 'Nuance plus sombre que mûre.', styles: 'Malts légers.' },

  'raisin sec': { classe: 'Aldéhydes oxydatifs / Lactones', composés: 'Sotolon, furfural', origine: 'Maturation oxydative prolongée (sherry, vins doux).', fut: 'Oloroso/PX → raisins secs prononcés.', tips: 'Souvent avec noix/caramel.', styles: 'Sherry matured.' },
  pruneau: { classe: 'Aldéhydes / Esters lourds', composés: 'Sotolon, éthyl lactate', origine: 'Vieillissement long en fûts oxydatifs.', fut: 'PX/Oloroso.', tips: 'Texture sirupeuse en bouche.', styles: 'Malts très âgés, sherry.' },
  'figue sèche': { classe: 'Oxydation / Maillard', composés: 'Furfural, HMF, sotolon', origine: 'Interaction bois-alcool + oxygène (longue maturation).', fut: 'Sherry (oloroso/PX).', tips: 'Va souvent avec dattes/miel.', styles: 'Sherry matured.' },
  'abricot sec': { classe: 'Esters / Oxydation', composés: 'Octanoate d’éthyle, sotolon', origine: 'Évolution des esters en élevage oxydatif.', fut: 'Oloroso, parfois Sauternes.', tips: 'Souvent avec amande.', styles: 'Finitions vins doux.' },
  dattes: { classe: 'Oxydation / Caramélisation', composés: 'Sotolon, HMF', origine: 'Vieillissement prolongé en fûts très actifs.', fut: 'PX / vins doux naturels.', tips: 'Gourmandise “pâte de dattes”.', styles: 'Sherry très marqué.' },

  'fleur d’oranger': { classe: 'Terpènes', composés: 'Linalol, nérol, géraniol', origine: 'Fermentation “propre” ; coupes hautes.', fut: 'Refill bourbon ; sherry peut masquer.', tips: 'Florale + zeste d’agrume.', styles: 'Speyside, Irish légers.' },
  rose: { classe: 'Alcool/ester aromatique', composés: 'Alcool phényléthylique, acétate de phényléthyle', origine: 'Métabolites de levures ; distillation douce.', fut: 'Bourbon neutre ; éviter les toasts lourds.', tips: 'Avec miel/litchi parfois.', styles: 'Speyside délicat.' },
  bruyère: { classe: 'Notes florales/miellées', composés: 'Sotolon (trace), phénols légers', origine: 'Vieillissement tempéré ; chais humides.', fut: 'Sherry doux ou bourbon ancien.', tips: 'Souvent associée aux malts côtiers d’Orkney.', styles: 'Highlands/Orkney.' },
  géranium: { classe: 'Terpènes', composés: 'Géraniol, citronellol', origine: 'Fermentation nette ; coupes hautes.', fut: 'Refill pour conserver la délicatesse.', tips: 'Peut virer savonneux si trop extrait.', styles: 'Malts très légers.' },
  violette: { classe: 'Norisoprénoïdes', composés: 'Ionones (α/β-ionone)', origine: 'Traces issues de la fermentation et du vieillissement.', fut: 'Bourbon neutre ; éviter rechar fort.', tips: 'Nuance poudrée très subtile.', styles: 'Speyside élégant.' },

  'herbe coupée': { classe: 'Alcools « verts »', composés: 'cis-3-hexénol, cis-3-hexényl acétate', origine: 'Fermentation courte ; coupes très hautes (têtes).', fut: 'Refill/bois peu actif.', tips: 'Donne fraîcheur végétale au nez.', styles: 'Lowlands, malts jeunes.' },
  eucalyptus: { classe: 'Terpènes / Oxydation', composés: '1,8-cinéole (eucalyptol)', origine: 'Distillation à fort reflux ; coupe serrée.', fut: 'Bourbon toasté moyen.', tips: 'Fraîcheur camphrée.', styles: 'Bourbon cask, quelques tourbés.' },
  genévrier: { classe: 'Terpènes résineux', composés: 'α-pinène, sabinène', origine: 'Congénères résineux captés en têtes.', fut: 'Refill ; bois neuf atténue.', tips: 'Rappelle le gin (légèrement).', styles: 'Malts secs, parfois rye.' },
  'feuille de tabac': { classe: 'Phénols / Pyrazines', composés: 'Pyridines, pyrazines, phénols méthoxylés', origine: 'Queue légère + maturation oxydative.', fut: 'Sherry/Oloroso, vieux fûts.', tips: 'Souvent avec cuir/boîte à cigare.', styles: 'Sherry âgés.' },
  foin: { classe: 'Lactones / Coumarine', composés: 'Coumarine, vanilline (trace)', origine: 'Oxydation douce durant l’élevage.', fut: 'Refill/bourbon ancien.', tips: 'Herbacé sec, miel léger.', styles: 'Highlands, Speyside.' },
  thym: { classe: 'Terpènes', composés: 'Thymol, carvacrol', origine: 'Coupe propre + reflux ; peu de queue.', fut: 'Refill ; bois neuf peut masquer.', tips: 'Parfois avec pin/romarin.', styles: 'Malts herbacés.' },
  pin: { classe: 'Terpènes résineux', composés: 'α/β-pinène', origine: 'Composés de tête ; distillation propre.', fut: 'Refill ; chêne européen peut ajouter “cèdre”.', tips: 'Sensation résineuse fraîche.', styles: 'Côtiers/herbacés.' },

  toast: { classe: 'Produits de Maillard', composés: 'Maltol, cyclotène', origine: 'Séchage du malt + toast des douelles.', fut: 'Toasts moyens à forts (bourbon, rechar).', tips: 'Entre biscuit et pain grillé.', styles: 'Highlands, bourbons.' },
  café: { classe: 'Furannes / Pyrazines', composés: '5-méthylfurfural, pyrazines torréfiées', origine: 'Bois fortement bousiné (char), Maillard.', fut: 'Rechar/STR, chêne neuf.', tips: 'Souvent avec cacao/chocolat.', styles: 'Sherry/STR.' },
  cacao: { classe: 'Furannes / Pyrazines', composés: 'Furfural, 2-furfurylthiol (trace)', origine: 'Toast/char élevé ; Maillard du bois.', fut: 'Rechar, chêne neuf.', tips: 'Amertume élégante en finale.', styles: 'Bourbon & sherry.' },

  'pain frais': { classe: 'Esters / Aldéhydes légers', composés: 'Acétate d’éthyle, acétaldéhyde', origine: 'Fermentation active ; levures “boulangères”.', fut: 'Refill pour conserver la brioche/pain.', tips: 'Très marqué sur new make.', styles: 'Irish pot still, Speyside jeune.' },
  'pâte levée': { classe: 'Esters / Diacétyle (trace)', composés: 'Acétate d’hexyle, diacétyle', origine: 'Fermentation riche ; repos de moût.', fut: 'Refill ; sherry masque.', tips: 'Impression de boulange.', styles: 'Malts très jeunes.' },
  brioche: { classe: 'Esters lactiques', composés: 'Éthyl lactate, acétate d’hexyle', origine: 'Fermentation + élevage doux (peu d’oxydation).', fut: 'Bourbon refill → brioché sucré.', tips: 'Souvent avec vanille.', styles: 'Speyside, Irish.' },
  'yaourt/fromage frais': { classe: 'Acides/esters lactiques', composés: 'Acide lactique, éthyl lactate', origine: 'Bactéries lactiques/levures ; ferments laitiers dans le moût.', fut: 'Refill ; bois neuf atténue.', tips: 'Acidité crémeuse agréable.', styles: 'Malts fermiers, quelques craft.' },

  'huile minérale': { classe: 'Alcools/esters lourds (queue)', composés: 'Acides gras C8–C12, alcools supérieurs', origine: 'Coupes basses (queue) ou distillation très huileuse.', fut: 'Refill long réduit la sensation ; rechar peut la “nettoyer”.', tips: 'Peut rappeler “paraffine/minéral”.', styles: 'Alambics à worm tub, styles “waxy”.' },
  'cire de bougie / paraffine': { classe: 'Esters/alcools à longue chaîne', composés: 'Esters cireux C18+, alcools gras', origine: 'Distillats “waxy” + maturation modérée.', fut: 'Bourbon refill ; trop d’extraction la masque.', tips: 'Signature de certaines distilleries (ex. style Clynelish).', styles: 'Highlands cireux.' },
  'beurre rance': { classe: 'Acides gras volatils', composés: 'Acide butyrique, isobutyrique', origine: 'Queue/contamination lactique ; vieillissement trop chaud.', fut: 'Refill long ou recoupe stricte pour l’éviter.', tips: 'Défaut au-delà d’un seuil.', styles: 'Occasionnel, new make imparfait.' },
  savon: { classe: 'Saponification', composés: 'Sels d’acides gras, acides gras libres', origine: 'Réaction acides gras/ions (eau dure) ; excès de queue.', fut: 'Filtration/purge ; éviter fûts contaminés.', tips: 'Défaut net au palais.', styles: '—' },
  métallique: { classe: 'Ions métalliques / Aldéhydes', composés: 'Fer/Cuivre (traces), aldéhydes réactifs', origine: 'Contact métal/coupe basse ; eau de réduction riche en Fe.', fut: 'Aucun fût ne “corrige” totalement ; aération peut aider.', tips: 'Sensation sang/monnaie.', styles: '—' },
  cuir: { classe: 'Tannins / Phénols oxydés', composés: 'Tannins hydrolysables, aldéhydes phénoliques', origine: 'Extraction de chêne européen + oxydation longue.', fut: 'Sherry/Oloroso, vieux fûts.', tips: 'Souvent avec tabac/boîte à cigare.', styles: 'Sherry âgés.' },
  'sac de jute': { classe: 'Phénols / Aldéhydes', composés: 'Géosmine (trace), aldéhydes “poussiéreux”', origine: 'Vieux fûts (sherry) ou stockage humide.', fut: 'Fûts très anciens ; refill propre pour l’éviter.', tips: 'Note “hessian” typique de certains lots.', styles: 'Sherry traditionnels.' },

  'terre humide': { classe: 'Composés terreux', composés: 'Géosmine, 2-méthylisobornéol (trace)', origine: 'Tourbe + chais humides ; coupe un peu basse.', fut: 'Refill pour garder la pureté de la tourbe.', tips: 'Souvent avec mousse d’arbre.', styles: 'Islay, Highlands tourbés.' },
  "mousse d’arbre": { classe: 'Terpènes/Phénols', composés: 'Ionones (trace), phénols légers', origine: 'Tourbe + maturation humide.', fut: 'Refill ; sherry l’adoucit.', tips: 'Rappelle sous-bois humide.', styles: 'Côtiers tourbés.' },
  'vieux bandage': { classe: 'Phénols', composés: 'p-crésol, gaïacol', origine: 'Tourbe côtière + coupe basse.', fut: 'Refill maintient l’aspect médicinal.', tips: 'Marqueurs typiques de certains Islay.', styles: 'Sud Islay.' },
  bacon: { classe: 'Phénols & phénols alkylés', composés: '4-éthylgaïacol, 4-éthylphénol', origine: 'Combustion de tourbe/char ; distillation huileuse.', fut: 'Rechar → fumé-sucré “bacon”.', tips: 'Souvent perçu au nez + rétro.', styles: 'Islay, peated Highlands.' },
  goudron: { classe: 'Phénols lourds', composés: 'Crésols, naphtols (trace)', origine: 'Tourbe riche en résines + coupe basse.', fut: 'Refill ; sherry arrondit.', tips: 'Fumé sombre et collant.', styles: 'Islay puissants.' },
  caoutchouc: { classe: 'Soufrés / Phénols', composés: 'Thiols, phénols méthylés', origine: 'Réduction/soufre en fûts de sherry mal préparés ou coupes basses.', fut: 'Conditionnement soigné ; aération atténue.', tips: 'Peut être défaut si dominant.', styles: 'Certains sherry casks.' },
  'kérosène': { classe: 'Hydrocarbures aromatiques (trace) / Réduction', composés: 'Composés aromatiques réduits, phénols lourds', origine: 'Tourbe intense + réduction ; coupes basses.', fut: 'Refill pour limiter, rechar sucrant.', tips: 'Note extrême, rare.', styles: 'Islay très tourbés.' },
  silex: { classe: 'Soufrés réduits', composés: 'H₂S/thiols (traces) → impression “pierre à fusil”', origine: 'Réduction en fût/fermentation ; distillation très propre.', fut: 'Refill/bois peu actif pour le garder subtil.', tips: 'Souvent avec citron/zeste.', styles: 'Maritime, Highlands.' },
  'poisson / fruits de mer': { classe: 'Soufrés / Phénols marins', composés: 'DMS (diméthylsulfure), phénols iodés (perçus)', origine: 'Tourbe côtière + maturation en chai marin.', fut: 'Refill → profil marin net.', tips: '“Coquillage/huître” au nez.', styles: 'Islay, îles.' },
  iode: { classe: 'Perception phénolique marine', composés: 'p-crésol et phénols associés (perçus iodés)', origine: 'Tourbe côtière ; environnement salin.', fut: 'Refill ; sherry adoucit.', tips: 'Signature de malts marins.', styles: 'Islay, îles.' },
  algue: { classe: 'Phénols / Terpènes marins', composés: 'Phénols iodés, sesquiterpènes d’algues (trace)', origine: 'Tourbe côtière + chais au bord de mer.', fut: 'Refill pour salinité/algue nette.', tips: 'Parfois “nori/kelp”.', styles: 'Islay, Campbeltown.' },
  soufre: { classe: 'Composés soufrés réduits', composés: 'H₂S, mercaptans (trace)', origine: 'Réduction/assainissement au soufre de fûts ; fermentation réductrice.', fut: 'Aération/re-racking ; sherry mal rincé l’accentue.', tips: 'Peut virer allumette/caoutchouc.', styles: 'Cas ponctuels.' },

  chêne: { classe: 'Lactones / Tannins / Aldéhydes', composés: 'β-methyl-γ-octalactone, vanilline, ellagitannins', origine: 'Extraction du bois (espèce, toast, chauffe).', fut: 'Quercus alba → coco/vanille ; Quercus robur → tanins/épices.', tips: 'Structure, astringence et douceur.', styles: 'Tous selon fût.' },
  cèdre: { classe: 'Sesquiterpènes boisés', composés: 'Cédrol, thujopsène', origine: 'Chêne européen très toasté/âgé.', fut: 'Sherry européen ; long élevage.', tips: 'Boîte à cigare, épices sèches.', styles: 'Sherry âgés.' },
  'bois de santal': { classe: 'Sesquiterpènes', composés: 'Santalol (α/β)', origine: 'Évolution des lactones + composés boisés.', fut: 'Chêne européen, long élevage.', tips: 'Crémeux, enveloppant.', styles: 'Malts très âgés.' },
  miel: { classe: 'Esters aromatiques / Norisoprénoïdes', composés: 'Acétate de phényléthyle, β-damascénone', origine: 'Oxydation douce + esters floraux.', fut: 'Sherry doux, bourbon 1er remplissage.', tips: 'Souvent avec cire/bruyère.', styles: 'Speyside, Orkney.' },
  girofle: { classe: 'Phénols épicés', composés: 'Eugénol', origine: 'Extraction du chêne (toast modéré/fort).', fut: 'Chêne européen/sherry.', tips: 'Picotement épicé en finale.', styles: 'Sherry casks.' },
  gingembre: { classe: 'Cétones épicées', composés: 'Zingérone', origine: 'Toast/char ; oxydation des sucres du bois.', fut: 'Rechar/STR.', tips: 'Chaleur épicée, bouche sèche.', styles: 'Bourbon & sherry.' },
  poivre: { classe: 'Phénols/terpènes épicés', composés: 'Eugénol, sabinène (perception poivrée)', origine: 'Extraction du chêne + alcool fort.', fut: 'Chêne neuf/fortement toasté.', tips: 'Plus tactile qu’aromatique.', styles: 'Rye/bourbon, certains malts boisés.' },
  'noix de muscade': { classe: 'Phénylpropanoïdes', composés: 'Myristicine, safrole (trace)', origine: 'Chêne européen bien toasté.', fut: 'Sherry européen.', tips: 'Épice douce et chaude.', styles: 'Sherry casks.' },
  cardamome: { classe: 'Terpènes épicés', composés: '1,8-cinéole, terpinyl acétate', origine: 'Interaction esters/terpènes du bois.', fut: 'Fûts actifs (neuf/rechar).', tips: 'Fraîcheur épicée mentholée.', styles: 'Bourbon actifs.' },

  'sherry / xérès': { classe: 'Oxydation / Esters', composés: 'Sotolon, acétaldéhyde, éthyl lactate', origine: 'Transfert du vin + oxydation en fût.', fut: 'Oloroso/PX/Amontillado.', tips: 'Fruits secs, noix, épices.', styles: 'Sherry matured/finish.' },
  madère: { classe: 'Oxydation / Caramélisation', composés: 'HMF, sotolon', origine: 'Fûts ex-Madère (chauffage/madérisation).', fut: 'Casks ex-Madeira.', tips: 'Zeste d’orange, caramel, rancio.', styles: 'Finishes Madère.' },
  porto: { classe: 'Esters fruités / Tanins', composés: 'Esters de fruits rouges, acétate d’éthyle', origine: 'Fûts ex-Porto (Ruby/Tawny).', fut: 'Port pipes.', tips: 'Fruits rouges, chocolat au lait.', styles: 'Finishes port cask.' },
  'vin rouge': { classe: 'Tanins / Esters', composés: 'Tanins condensés, β-damascénone', origine: 'Transfert de vin + extraction du chêne.', fut: 'Barriques de Bordeaux/Bourgogne.', tips: 'Baies rouges, structure tannique.', styles: 'Wine cask finishes.' },
  sauternes: { classe: 'Oxydation douce / Botrytisation', composés: 'Sotolon, acétate de phényléthyle, miel', origine: 'Fûts ex-Sauternes (vins botrytisés).', fut: 'Casks de Sauternes.', tips: 'Miel/abricot confit.', styles: 'Finishes Sauternes.' },

  noisette: { classe: 'Aldéhydes oxydatifs', composés: 'Sotolon (faible), furfural', origine: 'Vieillissement oxydatif (sherry).', fut: 'Oloroso/PX.', tips: 'Souvent avec toffee/noix.', styles: 'Sherry matured.' },
  amande: { classe: 'Aromas benzylés', composés: 'Benzaldéhyde', origine: 'Oxydation/interaction bois ; parfois influence de noyaux des vins fortifiés.', fut: 'Sherry/PX, vins doux.', tips: 'Peut rappeler massepain.', styles: 'Sherry casks.' },
  pralin: { classe: 'Maillard + Fruits à coque', composés: 'Furfural, HMF, lactones', origine: 'Caramélisation du bois + notes noix/noisette.', fut: 'Rechar/bois actif.', tips: 'Gourmand, sucré-noisette.', styles: 'Bourbon & sherry.' },
  nougat: { classe: 'Sucre cuit / Lactones', composés: 'HMF, vanilline, lactones', origine: 'Toast du bois + esters lactiques.', fut: 'Bourbon 1er remplissage.', tips: 'Crémeux, vanillé-mielleux.', styles: 'Bourbon cask.' }
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