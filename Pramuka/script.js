/* =====================================================
   KALKULATOR HPP UMKM MANDIRI — script.js
   Vanilla JS | Real-time | Canvas Pie Chart
   ===================================================== */

'use strict';

/* =====================================================
   1. DATA PRESET UMKM
   ===================================================== */
const PRESETS = {
  sate: {
    label: '🥩 Warung Sate Ponorogo — Contoh produksi 50 porsi/hari',
    bahan: 1250000,
    tenaga: 450000,
    overhead: 200000,
    produksi: 50,
    margin: 35,
  },
  reog: {
    label: '🎭 Kerajinan Reog — Contoh produksi 10 unit topeng/bulan',
    bahan: 850000,
    tenaga: 1200000,
    overhead: 150000,
    produksi: 10,
    margin: 50,
  },
  cafe: {
    label: '☕ Cafe Jajan — Contoh produksi 80 minuman/hari',
    bahan: 640000,
    tenaga: 350000,
    overhead: 300000,
    produksi: 80,
    margin: 40,
  },
};

/* =====================================================
   2. ELEMENT REFERENCES
   ===================================================== */
const el = {
  preset:         document.getElementById('presetSelect'),
  presetBadge:    document.getElementById('presetBadge'),
  bahan:          document.getElementById('bahanBaku'),
  tenaga:         document.getElementById('tenagaKerja'),
  overhead:       document.getElementById('overhead'),
  produksi:       document.getElementById('jumlahProduksi'),
  slider:         document.getElementById('marginSlider'),
  marginInput:    document.getElementById('marginInput'),

  // Results
  totalBiaya:     document.getElementById('totalBiaya'),
  totalPerUnit:   document.getElementById('totalPerUnit'),
  hppPerUnit:     document.getElementById('hppPerUnit'),
  hargaJual:      document.getElementById('hargaJual'),
  keuntunganPU:   document.getElementById('keuntunganPerUnit'),

  // Explorer
  exMargin:       document.getElementById('exMargin'),
  exProfit:       document.getElementById('exProfit'),
  exTotalProfit:  document.getElementById('exTotalProfit'),
  exRevenue:      document.getElementById('exRevenue'),

  // Chart legend
  pctBahan:       document.getElementById('pctBahan'),
  pctTK:          document.getElementById('pctTK'),
  pctOH:          document.getElementById('pctOH'),
  amtBahan:       document.getElementById('amtBahan'),
  amtTK:          document.getElementById('amtTK'),
  amtOH:          document.getElementById('amtOH'),
  centerPct:      document.getElementById('centerPct'),
  legendTip:      document.getElementById('legendTip'),

  canvas:         document.getElementById('pieChart'),
};

const ctx = el.canvas.getContext('2d');

/* =====================================================
   3. FORMAT RUPIAH
   ===================================================== */
function formatRupiah(value) {
  if (isNaN(value) || value === null) return 'Rp 0';
  return 'Rp ' + Math.round(value).toLocaleString('id-ID');
}

function formatPct(value) {
  return Math.round(value) + '%';
}

/* =====================================================
   4. CORE CALCULATION
   ===================================================== */
function getValues() {
  return {
    bahan:    parseFloat(el.bahan.value)    || 0,
    tenaga:   parseFloat(el.tenaga.value)   || 0,
    overhead: parseFloat(el.overhead.value) || 0,
    produksi: Math.max(1, parseFloat(el.produksi.value) || 1),
    margin:   parseFloat(el.marginInput.value) ?? 30,
  };
}

function calculate() {
  const v = getValues();

  const totalBiaya    = v.bahan + v.tenaga + v.overhead;
  const hppPerUnit    = totalBiaya / v.produksi;
  const keuntunganPU  = hppPerUnit * (v.margin / 100);
  const hargaJual     = hppPerUnit + keuntunganPU;
  const totalPendapatan = hargaJual * v.produksi;
  const totalKeuntungan = keuntunganPU * v.produksi;

  return {
    totalBiaya,
    hppPerUnit,
    keuntunganPU,
    hargaJual,
    totalPendapatan,
    totalKeuntungan,
    margin: v.margin,
    produksi: v.produksi,
    bahan: v.bahan,
    tenaga: v.tenaga,
    overhead: v.overhead,
  };
}

/* =====================================================
   5. UPDATE UI
   ===================================================== */
function animateValue(el, newText) {
  if (el.textContent !== newText) {
    el.textContent = newText;
    el.classList.remove('changed');
    void el.offsetWidth; // reflow
    el.classList.add('changed');
  }
}

function updateUI() {
  const r = calculate();

  // Result tiles
  animateValue(el.totalBiaya,  formatRupiah(r.totalBiaya));
  el.totalPerUnit.textContent = r.produksi > 1
    ? formatRupiah(r.hppPerUnit) + ' per unit'
    : '—';

  animateValue(el.hppPerUnit,  formatRupiah(r.hppPerUnit));
  animateValue(el.hargaJual,   formatRupiah(r.hargaJual));
  el.keuntunganPU.textContent = 'Keuntungan: ' + formatRupiah(r.keuntunganPU) + ' per unit';

  // Margin Explorer
  el.exMargin.textContent     = formatPct(r.margin);
  el.exProfit.textContent     = formatRupiah(r.keuntunganPU);
  el.exTotalProfit.textContent = formatRupiah(r.totalKeuntungan);
  el.exRevenue.textContent    = formatRupiah(r.totalPendapatan);

  // Update pie chart
  updatePieChart(r);
  updateSliderTrack();
}

/* =====================================================
   6. PIE CHART (Canvas API)
   ===================================================== */
const CHART_COLORS = ['#E8763A', '#4A8C8A', '#2C4F4E'];
const CHART_LABELS = ['Bahan Baku', 'Tenaga Kerja', 'Overhead'];

function drawPie(data, total) {
  const w = el.canvas.width;
  const h = el.canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const r  = Math.min(w, h) / 2 - 16;
  const rInner = r * 0.52; // donut hole

  ctx.clearRect(0, 0, w, h);

  if (total <= 0) {
    // Empty state — draw grey ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.arc(cx, cy, rInner, Math.PI * 2, 0, true);
    ctx.fillStyle = '#E8E8E8';
    ctx.fill();
    return;
  }

  let startAngle = -Math.PI / 2;

  data.forEach((val, i) => {
    const slice = (val / total) * (Math.PI * 2);
    const endAngle = startAngle + slice;

    if (val <= 0) { startAngle = endAngle; return; }

    // Shadow for each slice
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.12)';
    ctx.shadowBlur  = 6;

    // Draw sector
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = CHART_COLORS[i];
    ctx.fill();
    ctx.restore();

    // White separator line
    ctx.save();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    startAngle = endAngle;
  });

  // Donut hole
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.restore();
}

function updatePieChart(r) {
  const total = r.totalBiaya;
  const data  = [r.bahan, r.tenaga, r.overhead];

  drawPie(data, total);

  // Update legend amounts
  el.amtBahan.textContent = formatRupiah(r.bahan);
  el.amtTK.textContent    = formatRupiah(r.tenaga);
  el.amtOH.textContent    = formatRupiah(r.overhead);

  if (total <= 0) {
    el.pctBahan.textContent = '0%';
    el.pctTK.textContent    = '0%';
    el.pctOH.textContent    = '0%';
    el.centerPct.textContent = '—';
    el.legendTip.style.display = 'block';
    return;
  }

  el.legendTip.style.display = 'none';

  const pcts = data.map(v => total > 0 ? Math.round((v / total) * 100) : 0);
  el.pctBahan.textContent = pcts[0] + '%';
  el.pctTK.textContent    = pcts[1] + '%';
  el.pctOH.textContent    = pcts[2] + '%';

  // Center label — dominant category
  const maxIdx = pcts.indexOf(Math.max(...pcts));
  el.centerPct.textContent = pcts[maxIdx] + '%';
  el.centerPct.style.color  = CHART_COLORS[maxIdx];
  document.querySelector('.center-desc').textContent = CHART_LABELS[maxIdx];
}

/* =====================================================
   7. SLIDER SYNC
   ===================================================== */
function updateSliderTrack() {
  const max = parseFloat(el.slider.max);
  const val = parseFloat(el.slider.value);
  const pct = ((val / max) * 100).toFixed(1) + '%';
  el.slider.style.setProperty('--slider-pct', pct);
}

/* =====================================================
   8. PRESET HANDLER
   ===================================================== */
function applyPreset(key) {
  const p = PRESETS[key];
  if (!p) {
    el.presetBadge.classList.add('hidden');
    return;
  }

  // Fill inputs with smooth visual feedback
  function setVal(input, val) {
    input.value = val;
    input.classList.add('fade-in');
    setTimeout(() => input.classList.remove('fade-in'), 400);
  }

  setVal(el.bahan,    p.bahan);
  setVal(el.tenaga,   p.tenaga);
  setVal(el.overhead, p.overhead);
  setVal(el.produksi, p.produksi);

  el.slider.value     = p.margin;
  el.marginInput.value = p.margin;
  updateSliderTrack();

  // Show badge
  el.presetBadge.classList.remove('hidden');
  el.presetBadge.innerHTML = `✅ ${p.label}`;

  updateUI();
}

/* =====================================================
   9. EVENT LISTENERS
   ===================================================== */

// Preset selection
el.preset.addEventListener('change', (e) => {
  applyPreset(e.target.value);
});

// All number inputs → real-time recalc
[el.bahan, el.tenaga, el.overhead, el.produksi].forEach(input => {
  input.addEventListener('input', updateUI);
  input.addEventListener('change', updateUI);
});

// Slider ↔ number input sync
el.slider.addEventListener('input', () => {
  const val = el.slider.value;
  el.marginInput.value = val;
  updateSliderTrack();
  updateUI();
});

el.marginInput.addEventListener('input', () => {
  let val = parseFloat(el.marginInput.value) || 0;
  val = Math.max(0, Math.min(200, val));
  el.slider.value = val;
  updateSliderTrack();
  updateUI();
});

// Also trigger update on blur to clean stale values
el.marginInput.addEventListener('blur', () => {
  let val = parseFloat(el.marginInput.value);
  if (isNaN(val) || val < 0) val = 0;
  if (val > 200) val = 200;
  el.marginInput.value = val;
  el.slider.value      = val;
  updateSliderTrack();
  updateUI();
});

/* =====================================================
   10. INIT
   ===================================================== */
(function init() {
  updateSliderTrack();
  updateUI();

  // Stagger card animations based on scroll position
  const cards = document.querySelectorAll('.card');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  cards.forEach(card => observer.observe(card));

  // Initial pie draw (empty)
  drawPie([0, 0, 0], 0);
})();