// Module to drive the Aromatlas palette for the tasting sheet.
// This script loads the aroma hierarchy and information from JS modules,
// populates the overlay palette, and wires up search, selection and
// tooltip functionality. It relies on the HTML structure defined in
// index.html (an overlay with id="overlay", a search input with
// id="palQ", a container for results with id="palResults", a
// close button with id="palClose", and a separate tooltip element
// with id="tip"). It also interfaces with the global object
// `window.AromaSheet` provided by index.html to add selected
// aromas to the tasting sheet and to query whether an aroma is
// already selected.

/* eslint-env browser */

// Import the atlas and info data statically. Using ES module imports
// avoids the need for dynamic import, which can fail on some
// browsers when running from the file:// scheme. These modules
// export default objects containing the hierarchical structure and
// the descriptive metadata for each aroma.
// Embed the atlas and info data directly in this module. By
// bundling the data here we avoid having to load external modules
// via import(), which can be blocked by some browsers when the
// application is opened over the file:// scheme.
const ATLAS = {
  "FRUITÉ": {
    _fam: "fruite",
    "Agrumes": ["citron","citron vert","orange","mandarine","pamplemousse"],
    "Fruits tropicaux": ["ananas","mangue","banane","papaye","fruit de la passion","melon"],
    "Fruits à pépins": ["pomme","pomme verte","poire","coing"],
    "Fruits à noyau": ["pêche","abricot","prune","mirabelle"],
    "Baies rouges": ["fraise","framboise","cassis","mûre","myrtille"],
    "Fruits secs": ["raisin sec","pruneau","figue sèche","abricot sec","dattes"]
  },
  "FLORAL": {
    _fam: "floral",
    "Notes florales": ["fleur d’oranger","rose","bruyère","géranium","lavande","violette"]
  },
  "HERBACÉ": {
    _fam: "herbace",
    "Notes herbacées": ["herbe coupée","menthe","eucalyptus","genévrier","feuille de tabac","foin","thym","pin"]
  },
  "CÉRÉALE": {
    _fam: "cereale",
    "Torréfié": ["biscuit","toast","café","cacao","chocolat"],
    "Levures": ["pain frais","pâte levée","brioche","yaourt/fromage frais"]
  },
  "QUEUE DE DISTILLATION": {
    _fam: "queue",
    "Queue de distillation": ["huile minérale","cire de bougie / paraffine","beurre rance","savon","métallique","cuir","sac de jute"]
  },
  "TOURBÉ": {
    _fam: "tourbe",
    "Tourbé": ["fumé","tourbe","terre humide","mousse d’arbre","médicinal","vieux bandage","bacon","goudron","caoutchouc","kérosène","silex","poisson / fruits de mer","iode","algue","soufre"]
  },
  "ÉLEVAGE EN FÛT DE CHÊNE": {
    _fam: "elevage",
    "Boisé": ["chêne","cèdre","bois de santal","vanille","caramel","miel"],
    "Épicé": ["cannelle","girofle","gingembre","poivre","noix de muscade","cardamome"],
    "Vineux": ["sherry / xérès","madère","porto","vin rouge","sauternes"],
    "Noix": ["noix","noisette","amande","noix de coco","pralin","nougat"]
  }
};

const INFO = {
  "banane": {classe:"Esters (acétates)", composés:"Acétate d’isoamyle", origine:"Fermentation longue et chaude favorisant les esters fruités ; reflux doux à la distillation.", fut:"Fûts bourbon 1er remplissage préservent ces esters ; trop d’extraction peut les estomper.", tips:"Très fréquent dans certains single malts non tourbés.", styles:"Irish Pot Still, Speyside jeune."},
  "pomme": {classe:"Esters (hexanoates/acétates)", composés:"Hexanoate d’éthyle, acétate d’éthyle", origine:"Levures produisant acides gras + éthanol ⇒ esters ; têtes larges accentuent l’acétate.", fut:"Refill bourbon conserve la verdeur.", tips:"S’apaise avec l’oxydation ; revient avec un trait d’eau.", styles:"Lowlands, Speyside légers."},
  "poire": {classe:"Esters", composés:"Acétate d’hexyle, butyrate d’éthyle", origine:"Fermentation à basse T°, levures très estérifiantes.", fut:"Refill bourbon ; certains vins doux renforcent la poire.", tips:"Très volatil : ressenti surtout au nez.", styles:"Speyside, Irish"},
  "ananas": {classe:"Esters", composés:"Butyrate/hexanoate d’éthyle", origine:"Fermentation riche en acides gras ; distillation avec reflux.", fut:"Bourbon & ex-rum finish amplifient.", tips:"Avec noix de coco (lactones) ⇒ ‘pina colada’.", styles:"Highlands fruités"},
  "citron": {classe:"Terpènes / Aldéhydes", composés:"Limonène, citral", origine:"Congénères légers captés en têtes ; distillation propre.", fut:"Refill/fort toast pour garder la vivacité.", tips:"Parfois avec ‘pierre à fusil’.", styles:"Maritime, Highlands"},
  "lavande": {classe:"Terpènes", composés:"Linalol", origine:"Fermentation ‘propre’, distillation douce.", fut:"Refill bourbon, sherry masque souvent ces notes.", tips:"Fragile à l’oxydation en verre.", styles:"Speyside"},
  "menthe": {classe:"Terpènes / Phénols légers", composés:"Menthol, eucalyptol", origine:"Reflux + coupe serrée.", fut:"American oak → ‘menthe-chocolat’ avec cacao/furfural.", tips:"Sensation fraîche.", styles:"Bourbon cask"},
  "chocolat": {classe:"Furannes / Pyrazines", composés:"5-Méthylfurfural, pyrazines", origine:"Toast/char élevé ; Maillard des douelles.", fut:"American oak fortement bousiné ; rechar/STR.", tips:"Souvent avec café/cacao/biscuit.", styles:"Sherry butt, STR"},
  "biscuit": {classe:"Maillard", composés:"Maltol, cyclotène", origine:"Kilning/concassage ; distillation peu réductrice.", fut:"Bourbon cask, toasts moyens.", tips:"Texture maltée.", styles:"Highlands"},
  "fumé": {classe:"Phénols", composés:"Gaïacol, crésols, syringol", origine:"Malt séché à la tourbe ; ppm + coupe ‘cœur’ = intensité.", fut:"Rechar → fumé-sucré ; refill atténue.", tips:"Fumée sèche (gaïacol) vs médicinal (p-crésol).", styles:"Islay, Orkney"},
  "tourbe": {classe:"Phénols / Terpènes", composés:"Crésols, phénol, 4-éthylgaïacol", origine:"Kilning tourbé ; distillation courte/huileuse.", fut:"Refill pour pureté ; sherry = tourbe ‘gourmande’.", tips:"Persistance rétro-olfactive longue.", styles:"Islay, peated Highlands"},
  "médicinal": {classe:"Phénols", composés:"p-Crésol, gaïacol", origine:"Tourbe côtière + worm tub ⇒ notes lourdes.", fut:"Refill maintient l’aspect hôpital ; sherry arrondit.", tips:"Souvent indice de coupe légèrement basse.", styles:"South Islay"},
  "vanille": {classe:"Aldéhydes phénoliques", composés:"Vanilline", origine:"Dégradation lignine (chauffe du chêne).", fut:"Quercus alba 1er remplissage = boost vanille.", tips:"Adoucit et arrondit.", styles:"Bourbon cask & bourbon"},
  "caramel": {classe:"Furannes", composés:"Furfural, HMF", origine:"Toast/char ; Maillard des sucres.", fut:"Rechar/char élevé.", tips:"Peut virer ‘brûlé’ si sur-extraction.", styles:"Bourbon & sherry"},
  "noix de coco": {classe:"Lactones", composés:"β-methyl-γ-octalactone (cis/trans)", origine:"Chêne américain riche en lactones.", fut:"Bourbon 1er remplissage = coco/crème.", tips:"Avec ananas ⇒ pina colada.", styles:"Bourbon cask"},
  "cannelle": {classe:"Aldéhydes / Phénols épicés", composés:"Cinnamaldéhyde, eugénol", origine:"Chêne européen + toast modéré.", fut:"Sherry butt/hogshead européens.", tips:"Épice sèche en finale.", styles:"Sherry cask"},
  "noix": {classe:"Aldéhydes oxydatifs", composés:"Acétaldéhyde, sotolon", origine:"Maturation oxydative (sherry) ; long vieillissement.", fut:"Oloroso/PX ⇒ fruits secs & noix.", tips:"Rancio si très âgé.", styles:"Sherry matured"}
};

// Shortcuts for DOM queries.
const $  = (q, el=document) => el.querySelector(q);
const $$ = (q, el=document) => Array.from(el.querySelectorAll(q));

// Normalize strings by removing diacritics and converting to lower case.
const norm = s => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// Grab references to palette elements in the DOM. These IDs and
// classes must match those defined in index.html.
const overlay    = $('#overlay');
const palQ       = $('#palQ');
const palResults = $('#palResults');
const openBtn    = $('#openPal');
const closeBtn   = $('#palClose');
const tip        = $('#tip');
const pickedHost = $('#picked');

// Containers for loaded data. ATLAS holds the hierarchical data
// mapping families and groups to lists of labels. INFO holds the
// descriptive metadata keyed by individual label. We build FLAT
// (a flattened list of all labels with their family/group path)
// based on the static ATLAS defined above. No dynamic imports are
// used here so the script functions correctly when loaded via
// file://.
const FLAT = [];
// Immediately build the flat list of entries from our static ATLAS.
Object.entries(ATLAS).forEach(([fam, groups]) => {
  Object.entries(groups).forEach(([group, items]) => {
    if (group === '_fam') return;
    items.forEach(label => {
      FLAT.push({ fam, group, label, path: `${fam} › ${group}` });
    });
  });
});

// Build a mapping of individual labels to their family code (_fam) so
// that we can assign colour classes in the UI. The family code is
// defined under the _fam property of each top-level family in ATLAS.
const labelToFam = {};
Object.entries(ATLAS).forEach(([famName, groups]) => {
  const famCode = groups._fam || famName.toLowerCase();
  Object.entries(groups).forEach(([grp, items]) => {
    if (grp === '_fam') return;
    items.forEach(lbl => {
      labelToFam[lbl] = famCode;
    });
  });
});

/**
 * Open the palette overlay. Ensures data is loaded, resets the
 * search input and renders the full list. Also focuses the search
 * input for immediate typing.
 */
async function openOverlay() {
  // Data is pre-loaded when the module is imported; no need for
  // ensureData(). Simply show the overlay and render the list.
  overlay.setAttribute('aria-hidden', 'false');
  palQ.value = '';
  renderList('');
  palQ.focus();
}

/**
 * Close the palette overlay and hide the tooltip.
 */
function closeOverlay() {
  overlay.setAttribute('aria-hidden', 'true');
  hideTip();
}

/**
 * Render the list of aroma entries into the results container based
 * on a search query. The query is normalized and matched against
 * both the label and its path (family/group). Matching entries are
 * shown. Each entry is represented as a row with the label badge
 * and its path. Entries already selected (per AromaSheet.has)
 * are marked via aria-selected for styling. Each row has click and
 * hover handlers for selection and tooltip display.
 *
 * @param {string} query Search term entered by the user
 */
function renderList(query) {
  const q = norm(query);
  palResults.innerHTML = '';
  const items = FLAT.filter(x => !q || norm(x.label).includes(q) || norm(x.path).includes(q));
  items.forEach(x => {
    const row = document.createElement('div');
    row.className = 'row';
    row.setAttribute('role', 'option');
    row.dataset.label = x.label;
    // Determine family code to assign a colour class to the badge
    const famCode = labelToFam[x.label] || '';
    const famClass = famCode ? ' fam-' + famCode : '';
    // Use a badge for the label and a path annotation
    row.innerHTML = `\n      <span class="leaf-badge${famClass}">${x.label}</span>\n      <span class="path">— ${x.path}</span>\n    `;
    // Indicate selection state for styling
    if (window.AromaSheet && window.AromaSheet.has(x.label)) {
      row.setAttribute('aria-selected', 'true');
    }
    // Clicking toggles the aroma in the sheet (add or remove) and updates the selection state
    row.addEventListener('click', () => {
      if (window.AromaSheet) {
        // Toggle the aroma: add if not present, remove if already selected
        window.AromaSheet.toggle(x.label);
        // Reflect the new selection state on the row
        if (window.AromaSheet.has(x.label)) {
          row.setAttribute('aria-selected', 'true');
        } else {
          row.removeAttribute('aria-selected');
        }
      }
    });
    // Hover shows tooltip
    row.addEventListener('mouseenter', (e) => showTip(x.label, e.clientX, e.clientY));
    row.addEventListener('mousemove', (e) => moveTip(e.clientX, e.clientY));
    row.addEventListener('mouseleave', hideTip);
    palResults.appendChild(row);
  });
}

/**
 * Populate and display the tooltip at a specified position for a
 * given aroma label. Looks up the details in the INFO object
 * (falling back to placeholder values). Sets display and
 * positioning CSS properties accordingly.
 *
 * @param {string} label The aroma label to describe
 * @param {number} x Horizontal screen coordinate for the tooltip
 * @param {number} y Vertical screen coordinate for the tooltip
 */
function showTip(label, x, y) {
  const d = INFO[label] || {
    classe: '—',
    composés: '—',
    origine: '—',
    fut: '—',
    tips: '—',
    styles: '—'
  };
  tip.innerHTML = `<h4>${label} <small>• ${d.classe}</small></h4>\n    <div class="line"><div class="k">Composés</div><div class="v">${d.composés}</div></div>\n    <div class="line"><div class="k">Origine</div><div class="v">${d.origine}</div></div>\n    <div class="line"><div class="k">Fût</div><div class="v">${d.fut}</div></div>\n    <div class="line"><div class="k">Dégustation</div><div class="v">${d.tips}</div></div>\n    <div class="line"><div class="k">Styles</div><div class="v">${d.styles}</div></div>`;
  tip.style.display = 'block';
  // Position the tooltip with an offset so it does not obscure the cursor
  tip.style.left = (x + 16) + 'px';
  tip.style.top  = (y - 20) + 'px';
  tip.setAttribute('aria-hidden', 'false');
}

/**
 * Move the tooltip to follow the cursor during hover. Only
 * adjusts position if the tooltip is currently visible.
 *
 * @param {number} x Horizontal screen coordinate
 * @param {number} y Vertical screen coordinate
 */
function moveTip(x, y) {
  if (tip.style.display === 'block') {
    tip.style.left = (x + 16) + 'px';
    tip.style.top  = (y - 20) + 'px';
  }
}

/**
 * Hide the tooltip and set aria-hidden accordingly.
 */
function hideTip() {
  tip.style.display = 'none';
  tip.setAttribute('aria-hidden', 'true');
}

// Event listeners for opening and closing the palette. The overlay
// is hidden by default (aria-hidden=true). Opening loads data and
// renders the list. Closing hides overlay and tooltip.
if (openBtn) {
  openBtn.addEventListener('click', openOverlay);
}
if (closeBtn) {
  closeBtn.addEventListener('click', closeOverlay);
}
// Clicking outside the palette container should close it as well.
if (overlay) {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeOverlay();
  });
}
// Update results as the user types
if (palQ) {
  palQ.addEventListener('input', e => renderList(e.target.value));
}
// Close palette on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && overlay.getAttribute('aria-hidden') === 'false') {
    closeOverlay();
  }
});

// Provide a keyboard shortcut to open the palette even if the
// trigger button is not visible. Pressing Ctrl+Alt+A (or Cmd+Alt+A
// on macOS) will open the Aromatlas overlay. The event is
// prevented from triggering other browser shortcuts.
document.addEventListener('keydown', (e) => {
  const meta = e.metaKey || e.ctrlKey;
  if (meta && e.altKey && (e.key === 'a' || e.key === 'A')) {
    e.preventDefault();
    // Only open if currently closed
    if (overlay.getAttribute('aria-hidden') !== 'false') {
      openOverlay();
    }
  }
});
// Show tooltips for chips in the tasting sheet (for selected aromas). The
// chips are spans with class "chip" inside the container with id
// "picked". On hover, display the tooltip; on mouse leave hide.
if (pickedHost) {
  pickedHost.addEventListener('mousemove', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) { hideTip(); return; }
    const label = chip.textContent.trim();
    showTip(label, e.clientX, e.clientY);
  });
  pickedHost.addEventListener('mouseleave', hideTip);
}
