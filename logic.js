// ── Tabs ─────────────────────────────────────────────────────────────────────
function switchTab(name) {
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));
  document
    .querySelectorAll(".tab-panel")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelector(`[onclick="switchTab('${name}')"]`)
    .classList.add("active");
  document.getElementById("tab-" + name).classList.add("active");
}

const input1 = document.getElementById("buttonimage1");
const input2 = document.getElementById("buttonimage2");

const preview1 = document.getElementById("preview1");
const preview2 = document.getElementById("preview2");

const canvas = document.getElementById("resultCanvas");
const ctx = canvas.getContext("2d");

let currentImageData = null;

// preview imagem 1
input1.addEventListener("change", function () {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      preview1.src = e.target.result;
      currentImageData = null;
    };
    reader.readAsDataURL(file);
  }
});

// preview imagem 2
input2.addEventListener("change", function () {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      preview2.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function getSourceData(requireBoth = false) {
  if (requireBoth) {
    if (preview1.naturalWidth === 0 || preview2.naturalWidth === 0) {
      alert("Selecione as duas imagens.");
      return null;
    }
    if (
      preview1.naturalWidth !== preview2.naturalWidth ||
      preview1.naturalHeight !== preview2.naturalHeight
    ) {
      alert("As imagens devem ter a mesma resolução!");
      return null;
    }
  } else {
    if (preview1.naturalWidth === 0) {
      alert("Selecione a imagem 1.");
      return null;
    }
  }

  const width = preview1.naturalWidth;
  const height = preview1.naturalHeight;
  canvas.width = width;
  canvas.height = height;

  // Canvas offscreen para leitura — nunca toca o canvas de resultado
  const offscreen = document.createElement("canvas");
  offscreen.width = width;
  offscreen.height = height;
  const offCtx = offscreen.getContext("2d");

  // data1: usa currentImageData se existir, senão lê do preview1
  let data1;
  if (currentImageData) {
    data1 = currentImageData;
  } else {
    offCtx.drawImage(preview1, 0, 0);
    data1 = offCtx.getImageData(0, 0, width, height);
  }

  // data2: SEMPRE lê do preview2 via offscreen (nunca do canvas principal)
  let data2 = null;
  if (requireBoth) {
    offCtx.clearRect(0, 0, width, height);
    offCtx.drawImage(preview2, 0, 0);
    data2 = offCtx.getImageData(0, 0, width, height);
  }

  return { width, height, data1, data2 };
}

function commitResult(result) {
  ctx.putImageData(result, 0, 0);
  currentImageData = result;
}

// ─── Operações entre Imagens ─────────────────────────────────────────────────

function processImages(mode) {
  const src = getSourceData(true);
  if (!src) return;
  const { width, height, data1, data2 } = src;
  const result = ctx.createImageData(width, height);

  for (let i = 0; i < data1.data.length; i += 4) {
    let r1 = data1.data[i],
      g1 = data1.data[i + 1],
      b1 = data1.data[i + 2];
    let r2 = data2.data[i],
      g2 = data2.data[i + 1],
      b2 = data2.data[i + 2];

    if (mode === "add") {
      result.data[i] = Math.min(255, r1 + r2);
      result.data[i + 1] = Math.min(255, g1 + g2);
      result.data[i + 2] = Math.min(255, b1 + b2);
    } else if (mode === "subtract") {
      result.data[i] = Math.max(0, r1 - r2);
      result.data[i + 1] = Math.max(0, g1 - g2);
      result.data[i + 2] = Math.max(0, b1 - b2);
    } else if (mode === "difference") {
      result.data[i] = Math.abs(r1 - r2);
      result.data[i + 1] = Math.abs(g1 - g2);
      result.data[i + 2] = Math.abs(b1 - b2);
    }
    result.data[i + 3] = 255;
  }

  commitResult(result);
}

function addImages() {
  processImages("add");
}
function subtractImages() {
  processImages("subtract");
}
function differenceImages() {
  processImages("difference");
}

// ─── Blending ────────────────────────────────────────────────────────────────
function blendImages() {
  const src = getSourceData(true);
  if (!src) return;
  const { width, height, data1, data2 } = src;

  const alpha = parseFloat(document.getElementById("blendAlpha").value);
  const beta = parseFloat(document.getElementById("blendBeta").value);

  if (isNaN(alpha) || isNaN(beta)) {
    alert("Valores de α e β inválidos!");
    return;
  }

  const result = ctx.createImageData(width, height);

  for (let i = 0; i < data1.data.length; i += 4) {
    result.data[i] = Math.min(
      255,
      Math.max(0, alpha * data1.data[i] + beta * data2.data[i]),
    );
    result.data[i + 1] = Math.min(
      255,
      Math.max(0, alpha * data1.data[i + 1] + beta * data2.data[i + 1]),
    );
    result.data[i + 2] = Math.min(
      255,
      Math.max(0, alpha * data1.data[i + 2] + beta * data2.data[i + 2]),
    );
    result.data[i + 3] = 255;
  }

  commitResult(result);
}

// ─── Média das duas imagens ───────────────────────────────────────────────────
function averageImages() {
  const src = getSourceData(true);
  if (!src) return;
  const { width, height, data1, data2 } = src;
  const result = ctx.createImageData(width, height);

  for (let i = 0; i < data1.data.length; i += 4) {
    result.data[i] = Math.round((data1.data[i] + data2.data[i]) / 2);
    result.data[i + 1] = Math.round(
      (data1.data[i + 1] + data2.data[i + 1]) / 2,
    );
    result.data[i + 2] = Math.round(
      (data1.data[i + 2] + data2.data[i + 2]) / 2,
    );
    result.data[i + 3] = 255;
  }

  commitResult(result);
}

// ─── Operações Lógicas ───────────────────────────────────────────────────────
function toBinary(data) {
  const out = new Uint8ClampedArray(data.data.length);
  for (let i = 0; i < data.data.length; i += 4) {
    const gray =
      data.data[i] * 0.299 +
      data.data[i + 1] * 0.587 +
      data.data[i + 2] * 0.114;
    const val = gray > 127 ? 255 : 0;
    out[i] = out[i + 1] = out[i + 2] = val;
    out[i + 3] = 255;
  }
  return out;
}

function logicalOperation(mode) {
  const needsBoth = mode !== "not";
  const src = getSourceData(needsBoth);
  if (!src) return;
  const { width, height, data1, data2 } = src;

  const bin1 = toBinary(data1);
  const bin2 = needsBoth ? toBinary(data2) : null;

  const result = ctx.createImageData(width, height);

  for (let i = 0; i < bin1.length; i += 4) {
    const a = bin1[i];
    const b = needsBoth ? bin2[i] : 0;

    let val;
    if (mode === "and") val = a === 255 && b === 255 ? 255 : 0;
    if (mode === "or") val = a === 255 || b === 255 ? 255 : 0;
    if (mode === "not") val = a === 255 ? 0 : 255;
    if (mode === "xor") val = a !== b ? 255 : 0;

    result.data[i] = result.data[i + 1] = result.data[i + 2] = val;
    result.data[i + 3] = 255;
  }

  commitResult(result);
}

// ─── Limiarização ─────────────────────────────────────────────────────────────
function thresholdImage() {
  const src = getSourceData();
  if (!src) return;
  const { width, height, data1 } = src;

  const threshold = parseInt(document.getElementById("thresholdValue").value);
  if (isNaN(threshold) || threshold < 0 || threshold > 255) {
    alert("Limiar deve estar entre 0 e 255.");
    return;
  }

  const result = ctx.createImageData(width, height);

  for (let i = 0; i < data1.data.length; i += 4) {
    const gray =
      data1.data[i] * 0.299 +
      data1.data[i + 1] * 0.587 +
      data1.data[i + 2] * 0.114;
    const val = gray > threshold ? 255 : 0;
    result.data[i] = result.data[i + 1] = result.data[i + 2] = val;
    result.data[i + 3] = 255;
  }

  commitResult(result);
}

// ─── Negativo ─────────────────────────────────────────────────────────────────
function negativeImage() {
  const src = getSourceData();
  if (!src) return;
  const { width, height, data1 } = src;
  const result = ctx.createImageData(width, height);

  for (let i = 0; i < data1.data.length; i += 4) {
    result.data[i] = 255 - data1.data[i];
    result.data[i + 1] = 255 - data1.data[i + 1];
    result.data[i + 2] = 255 - data1.data[i + 2];
    result.data[i + 3] = 255;
  }

  commitResult(result);
}

// ─── Equalização de Histograma ───────────────────────────────────────────────
function equalizeHistogram() {
  const src = getSourceData();
  if (!src) return;
  const { width, height, data1 } = src;
  const total = width * height;

  const gray = new Uint8Array(total);
  const hist = new Array(256).fill(0);

  for (let i = 0, p = 0; i < data1.data.length; i += 4, p++) {
    const g = Math.round(
      data1.data[i] * 0.299 +
        data1.data[i + 1] * 0.587 +
        data1.data[i + 2] * 0.114,
    );
    gray[p] = g;
    hist[g]++;
  }

  const cdf = new Array(256).fill(0);
  cdf[0] = hist[0];
  for (let k = 1; k < 256; k++) cdf[k] = cdf[k - 1] + hist[k];

  const cdfMin = cdf.find((v) => v > 0);

  const map = new Array(256).fill(0);
  for (let k = 0; k < 256; k++) {
    map[k] = Math.round(((cdf[k] - cdfMin) / (total - cdfMin)) * 255);
  }

  const result = ctx.createImageData(width, height);
  for (let i = 0, p = 0; i < data1.data.length; i += 4, p++) {
    const eq = map[gray[p]];
    result.data[i] = eq;
    result.data[i + 1] = eq;
    result.data[i + 2] = eq;
    result.data[i + 3] = 255;
  }

  commitResult(result);
  drawHistograms(hist, map, gray, total);
}

function drawHistograms(histBefore, map, grayPixels, total) {
  const hCanvas = document.getElementById("histogramCanvas");
  if (!hCanvas) return;
  const hCtx = hCanvas.getContext("2d");
  const W = hCanvas.width;
  const H = hCanvas.height;

  const histAfter = new Array(256).fill(0);
  for (let p = 0; p < grayPixels.length; p++) histAfter[map[grayPixels[p]]]++;

  hCtx.clearRect(0, 0, W, H);

  const drawHist = (hist, xOffset, color, label) => {
    const panelW = W / 2 - 10;
    const maxVal = Math.max(...hist);
    hCtx.fillStyle = "#1e293b";
    hCtx.fillRect(xOffset, 0, panelW, H - 20);

    hCtx.fillStyle = color;
    for (let k = 0; k < 256; k++) {
      const barH = Math.round((hist[k] / maxVal) * (H - 25));
      const x = xOffset + Math.round((k / 256) * panelW);
      const barW = Math.max(1, Math.round(panelW / 256));
      hCtx.fillRect(x, H - 20 - barH, barW, barH);
    }

    hCtx.fillStyle = "#94a3b8";
    hCtx.font = "11px monospace";
    hCtx.fillText(label, xOffset + 4, H - 4);
  };

  drawHist(histBefore, 0, "#60a5fa", "Antes");
  drawHist(histAfter, W / 2 + 5, "#34d399", "Depois");
}

// ─── Operações com Constante ─────────────────────────────────────────────────
function processConstant(mode) {
  const src = getSourceData();
  if (!src) return;
  const { width, height, data1 } = src;

  const c = parseFloat(document.getElementById("constantValue").value);
  if (isNaN(c)) {
    alert("Valor inválido!");
    return;
  }
  if (mode === "divide" && c === 0) {
    alert("Divisão por zero!");
    return;
  }

  const result = ctx.createImageData(width, height);

  for (let i = 0; i < data1.data.length; i += 4) {
    let r = data1.data[i],
      g = data1.data[i + 1],
      b = data1.data[i + 2];

    if (mode === "add") {
      r = Math.min(255, r + c);
      g = Math.min(255, g + c);
      b = Math.min(255, b + c);
    } else if (mode === "subtract") {
      r = Math.max(0, r - c);
      g = Math.max(0, g - c);
      b = Math.max(0, b - c);
    } else if (mode === "multiply") {
      r = Math.min(255, r * c);
      g = Math.min(255, g * c);
      b = Math.min(255, b * c);
    } else if (mode === "divide") {
      r = Math.min(255, r / c);
      g = Math.min(255, g / c);
      b = Math.min(255, b / c);
    }

    result.data[i] = Math.max(0, r);
    result.data[i + 1] = Math.max(0, g);
    result.data[i + 2] = Math.max(0, b);
    result.data[i + 3] = 255;
  }

  commitResult(result);
}

// ─── Transformações ──────────────────────────────────────────────────────────
function transformImage(mode) {
  const src = getSourceData();
  if (!src) return;
  const { width, height, data1 } = src;
  const result = ctx.createImageData(width, height);

  if (mode === "grayscale") {
    for (let i = 0; i < data1.data.length; i += 4) {
      const gray =
        data1.data[i] * 0.299 +
        data1.data[i + 1] * 0.587 +
        data1.data[i + 2] * 0.114;
      result.data[i] = result.data[i + 1] = result.data[i + 2] = gray;
      result.data[i + 3] = data1.data[i + 3];
    }
  } else if (mode === "flipH") {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const s = (y * width + (width - 1 - x)) * 4;
        result.data[i] = data1.data[s];
        result.data[i + 1] = data1.data[s + 1];
        result.data[i + 2] = data1.data[s + 2];
        result.data[i + 3] = data1.data[s + 3];
      }
    }
  } else if (mode === "flipV") {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const s = ((height - 1 - y) * width + x) * 4;
        result.data[i] = data1.data[s];
        result.data[i + 1] = data1.data[s + 1];
        result.data[i + 2] = data1.data[s + 2];
        result.data[i + 3] = data1.data[s + 3];
      }
    }
  }

  commitResult(result);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── FILTROS ESPACIAIS (Tarefa 15–19) ────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ── Utilitários de vizinhança ─────────────────────────────────────────────────

/**
 * Retorna os valores de cinza (ou canal) de uma janela MxN centrada em (cx, cy).
 * Usa padding por replicação de borda (clamp).
 */
function getNeighborhood(data, width, height, cx, cy, maskW, maskH, channel) {
  const half_w = Math.floor(maskW / 2);
  const half_h = Math.floor(maskH / 2);
  const values = [];

  for (let dy = -half_h; dy <= half_h; dy++) {
    for (let dx = -half_w; dx <= half_w; dx++) {
      const nx = Math.min(Math.max(cx + dx, 0), width - 1);
      const ny = Math.min(Math.max(cy + dy, 0), height - 1);
      values.push(data[(ny * width + nx) * 4 + channel]);
    }
  }
  return values;
}

/** Lê tamanho da máscara do slider: posição 1→3, 2→5, 3→7 */
function getMaskSize(sliderId) {
  const pos = parseInt(document.getElementById(sliderId).value);
  return pos * 2 + 1; // 1→3, 2→5, 3→7
}

/** Atualiza o label do slider de máscara */
function updateMaskLabel(sliderId, labelId) {
  const size = getMaskSize(sliderId);
  document.getElementById(labelId).textContent = size + "×" + size;
}

/** Atualiza range e label do slider k do filtro ORDEM */
function updateOrderKRange() {
  const m = getMaskSize("maskSizeOrder");
  const total = m * m;
  const input = document.getElementById("orderK");
  input.max = total;
  if (parseInt(input.value) > total) input.value = Math.ceil(total / 2);
  updateOrderKLabel();
}

function updateOrderKLabel() {
  const v = document.getElementById("orderK").value;
  document.getElementById("orderKVal").textContent = v;
  document.getElementById("orderKLabel").textContent = "k = " + v;
}

// ─── 15a) Filtro MAX ──────────────────────────────────────────────────────────
// Substitui o pixel pelo valor máximo da vizinhança → realça regiões claras.
function filterMax() {
  const src = getSourceData();
  if (!src) return;
  const { width, height, data1 } = src;
  const m = getMaskSize("maskSizeMax");
  const result = ctx.createImageData(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        const nb = getNeighborhood(data1.data, width, height, x, y, m, m, c);
        result.data[idx + c] = Math.max(...nb);
      }
      result.data[idx + 3] = 255;
    }
  }
  commitResult(result);
}

// ─── 15b) Filtro MIN ──────────────────────────────────────────────────────────
// Substitui o pixel pelo valor mínimo da vizinhança → realça regiões escuras.
function filterMin() {
  const src = getSourceData();
  if (!src) return;
  const { width, height, data1 } = src;
  const m = getMaskSize("maskSizeMin");
  const result = ctx.createImageData(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        const nb = getNeighborhood(data1.data, width, height, x, y, m, m, c);
        result.data[idx + c] = Math.min(...nb);
      }
      result.data[idx + 3] = 255;
    }
  }
  commitResult(result);
}

// ─── 15c) Filtro MEAN (Média) ─────────────────────────────────────────────────
// Substitui o pixel pela média aritmética da vizinhança → suavização linear.
function filterMean() {
  const src = getSourceData();
  if (!src) return;
  const { width, height, data1 } = src;
  const m = getMaskSize("maskSizeMean");
  const result = ctx.createImageData(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        const nb = getNeighborhood(data1.data, width, height, x, y, m, m, c);
        const avg = nb.reduce((a, b) => a + b, 0) / nb.length;
        result.data[idx + c] = Math.round(avg);
      }
      result.data[idx + 3] = 255;
    }
  }
  commitResult(result);
}

// ─── 16) Filtro MEDIANA ───────────────────────────────────────────────────────
// Remove ruído sal-e-pimenta: substitui pixel pela mediana da vizinhança.
// Preserva bordas melhor que a média.
function filterMedian() {
  const src = getSourceData();
  if (!src) return;
  const { width, height, data1 } = src;
  const m = getMaskSize("maskSizeMedian");
  const result = ctx.createImageData(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        const nb = getNeighborhood(
          data1.data,
          width,
          height,
          x,
          y,
          m,
          m,
          c,
        ).sort((a, b) => a - b);
        const mid = Math.floor(nb.length / 2);
        result.data[idx + c] = nb[mid];
      }
      result.data[idx + 3] = 255;
    }
  }
  commitResult(result);
}

// ─── 17) Filtro ORDEM ─────────────────────────────────────────────────────────
// Ordena os pixels da vizinhança e seleciona o k-ésimo valor.
// k=1 → mínimo, k=N²/2 → mediana, k=N² → máximo.
function filterOrder() {
  const src = getSourceData();
  if (!src) return;
  const { width, height, data1 } = src;
  const m = getMaskSize("maskSizeOrder");
  const k = parseInt(document.getElementById("orderK").value);
  const total = m * m;

  if (isNaN(k) || k < 1 || k > total) {
    alert(`k deve estar entre 1 e ${total} para uma máscara ${m}×${m}.`);
    return;
  }

  const result = ctx.createImageData(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        const nb = getNeighborhood(
          data1.data,
          width,
          height,
          x,
          y,
          m,
          m,
          c,
        ).sort((a, b) => a - b);
        result.data[idx + c] = nb[k - 1]; // k é 1-indexado
      }
      result.data[idx + 3] = 255;
    }
  }
  commitResult(result);
}

// ─── 18) Suavização Conservativa ─────────────────────────────────────────────
// Preserva o pixel central se ele já estiver entre min e max da vizinhança.
// Se cp > max → cp = max; se cp < min → cp = min.
// Implementado conforme o algoritmo do slide (imagem 1 da tarefa).
function filterConservative() {
  const src = getSourceData();
  if (!src) return;
  const { width, height, data1 } = src;
  const m = getMaskSize("maskSizeConservative");
  const result = ctx.createImageData(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        // Vizinhança exclui o pixel central (apenas os vizinhos ao redor)
        const nb = getNeighborhood(data1.data, width, height, x, y, m, m, c);
        const cp = data1.data[idx + c];
        const half = Math.floor(m / 2);
        // Remove o centro da lista para calcular min/max apenas dos vizinhos
        const centerIdx = half * m + half;
        const neighbors = nb.filter((_, i) => i !== centerIdx);

        const mn = Math.min(...neighbors);
        const mx = Math.max(...neighbors);

        let newVal = cp;
        if (cp > mx) newVal = mx;
        else if (cp < mn) newVal = mn;

        result.data[idx + c] = newVal;
      }
      result.data[idx + 3] = 255;
    }
  }
  commitResult(result);
}

// ─── 19) Filtro Gaussiano ─────────────────────────────────────────────────────
// Convolução com kernel Gaussiano de tamanho NxN e desvio padrão σ.
// kernel(x,y) = exp(-(x²+y²) / (2σ²))  →  normalizado para somar 1.

function buildGaussianKernel(size, sigma) {
  const half = Math.floor(size / 2);
  const kernel = [];
  let sum = 0;

  for (let y = -half; y <= half; y++) {
    const row = [];
    for (let x = -half; x <= half; x++) {
      const val = Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
      row.push(val);
      sum += val;
    }
    kernel.push(row);
  }

  // Normaliza
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) kernel[y][x] /= sum;

  return kernel;
}

function filterGaussian() {
  const src = getSourceData();
  if (!src) return;
  const { width, height, data1 } = src;

  const size = getMaskSize("maskSizeGaussian");
  const sigma = parseFloat(document.getElementById("gaussianSigma").value);

  if (isNaN(sigma) || sigma <= 0) {
    alert("σ deve ser um número positivo.");
    return;
  }

  const kernel = buildGaussianKernel(size, sigma);
  const half = Math.floor(size / 2);
  const result = ctx.createImageData(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        let acc = 0;
        for (let ky = 0; ky < size; ky++) {
          for (let kx = 0; kx < size; kx++) {
            const nx = Math.min(Math.max(x + kx - half, 0), width - 1);
            const ny = Math.min(Math.max(y + ky - half, 0), height - 1);
            acc += data1.data[(ny * width + nx) * 4 + c] * kernel[ky][kx];
          }
        }
        result.data[idx + c] = Math.round(Math.min(255, Math.max(0, acc)));
      }
      result.data[idx + 3] = 255;
    }
  }
  commitResult(result);
}

// ─── Exportar ────────────────────────────────────────────────────────────────
function exportImage() {
  if (!currentImageData) {
    alert("Nada para exportar.");
    return;
  }
  const link = document.createElement("a");
  link.download = "imagem.png";
  link.href = canvas.toDataURL();
  link.click();
}
