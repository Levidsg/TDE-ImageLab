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

  let data1;
  if (currentImageData) {
    data1 = currentImageData;
  } else {
    ctx.drawImage(preview1, 0, 0);
    data1 = ctx.getImageData(0, 0, width, height);
  }

  let data2 = null;
  if (requireBoth) {
    ctx.drawImage(preview2, 0, 0);
    data2 = ctx.getImageData(0, 0, width, height);
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

// ─── 9) Combinação Linear (Blending) ────────────────────────────────────────
// f(x,y) = α·I1(x,y) + β·I2(x,y)   onde α e β são livres

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

// ─── 10) Combinação Linear — Média das duas imagens ───────────────────────
// f(x,y) = 0.5·I1(x,y) + 0.5·I2(x,y)

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

// ─── 11) Operações Lógicas em Imagens Binárias ───────────────────────────────
// Binariza primeiro (pixel > 127 → 255, senão → 0) e depois aplica lógica.

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
  // NOT só precisa de imagem 1
  const needsBoth = mode !== "not";
  const src = getSourceData(needsBoth);
  if (!src) return;
  const { width, height, data1, data2 } = src;

  const bin1 = toBinary(data1);
  const bin2 = needsBoth ? toBinary(data2) : null;

  const result = ctx.createImageData(width, height);

  for (let i = 0; i < bin1.length; i += 4) {
    const a = bin1[i]; // 0 ou 255
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

// ─── 12) Limiarização (Threshold) ────────────────────────────────────────────
// Pixels com intensidade > limiar → 255 (branco), caso contrário → 0 (preto)

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

// ─── 13) Negativo da Imagem ───────────────────────────────────────────────────
// f(x,y) = 255 − I(x,y)

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

// ─── 14) Equalização de Histograma ───────────────────────────────────────────
// Opera em escala de cinza. Calcula histograma → CDF → mapeamento de níveis.

function equalizeHistogram() {
  const src = getSourceData();
  if (!src) return;
  const { width, height, data1 } = src;
  const total = width * height;

  // 1. Converter para escala de cinza e coletar histograma
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

  // 2. CDF (função de distribuição acumulada)
  const cdf = new Array(256).fill(0);
  cdf[0] = hist[0];
  for (let k = 1; k < 256; k++) cdf[k] = cdf[k - 1] + hist[k];

  // Encontra o primeiro valor não-zero da CDF
  const cdfMin = cdf.find((v) => v > 0);

  // 3. Tabela de mapeamento
  const map = new Array(256).fill(0);
  for (let k = 0; k < 256; k++) {
    map[k] = Math.round(((cdf[k] - cdfMin) / (total - cdfMin)) * 255);
  }

  // 4. Aplicar mapeamento
  const result = ctx.createImageData(width, height);
  for (let i = 0, p = 0; i < data1.data.length; i += 4, p++) {
    const eq = map[gray[p]];
    result.data[i] = eq;
    result.data[i + 1] = eq;
    result.data[i + 2] = eq;
    result.data[i + 3] = 255;
  }

  commitResult(result);

  // Desenha histograma antes/depois no canvas auxiliar
  drawHistograms(hist, map, gray, total);
}

function drawHistograms(histBefore, map, grayPixels, total) {
  const hCanvas = document.getElementById("histogramCanvas");
  if (!hCanvas) return;
  const hCtx = hCanvas.getContext("2d");
  const W = hCanvas.width;
  const H = hCanvas.height;

  // Histograma após
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
        const src = (y * width + (width - 1 - x)) * 4;
        result.data[i] = data1.data[src];
        result.data[i + 1] = data1.data[src + 1];
        result.data[i + 2] = data1.data[src + 2];
        result.data[i + 3] = data1.data[src + 3];
      }
    }
  } else if (mode === "flipV") {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const src = ((height - 1 - y) * width + x) * 4;
        result.data[i] = data1.data[src];
        result.data[i + 1] = data1.data[src + 1];
        result.data[i + 2] = data1.data[src + 2];
        result.data[i + 3] = data1.data[src + 3];
      }
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
