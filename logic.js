// Processador Digital de Imagens
// Interface adaptada para o HTML/CSS novo e cálculos mantidos em JavaScript puro.

const sourceCanvas1 = document.getElementById("sourceCanvas1");
const sourceCtx1 = sourceCanvas1.getContext("2d", { willReadFrequently: true });
const sourceCanvas2 = document.getElementById("sourceCanvas2");
const sourceCtx2 = sourceCanvas2.getContext("2d", { willReadFrequently: true });
const resultCanvas = document.getElementById("resultCanvas");
const resultCtx = resultCanvas.getContext("2d", { willReadFrequently: true });
const histogramCanvas = document.getElementById("histogramCanvas");
const histogramCtx = histogramCanvas ? histogramCanvas.getContext("2d") : null;

let imgDataA = null;
let imgDataB = null;
let imgDataResult = null;

// Matrizes solicitadas no trabalho: matriz[y][x] = { r, g, b, a }
let matrizA = null;
let matrizB = null;
let matrizResultado = null;

function clamp(value) {
  if (!Number.isFinite(value)) return 0;
  if (value > 255) return 255;
  if (value < 0) return 0;
  return Math.round(value);
}

function getIndex(x, y, width) {
  return (y * width + x) * 4;
}

function getClampedIndex(x, y, width, height) {
  const cx = Math.min(Math.max(x, 0), width - 1);
  const cy = Math.min(Math.max(y, 0), height - 1);
  return getIndex(cx, cy, width);
}

function luminance(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function imageDataToMatrix(imageData) {
  const matrix = [];
  const { width, height, data } = imageData;

  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      const i = getIndex(x, y, width);
      row.push({ r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] });
    }
    matrix.push(row);
  }

  return matrix;
}

function getNumericValue(id, fallback) {
  const element = document.getElementById(id);
  if (!element) return fallback;
  const value = parseFloat(element.value);
  return Number.isFinite(value) ? value : fallback;
}

function getIntValue(id, fallback) {
  const element = document.getElementById(id);
  if (!element) return fallback;
  const value = parseInt(element.value, 10);
  return Number.isFinite(value) ? value : fallback;
}

function setInfo(id, text) {
  const element = document.getElementById(id);
  if (element) element.textContent = text;
}

function ensureImageA() {
  if (!imgDataA) {
    alert("Carregue a Imagem 1 primeiro.");
    return false;
  }
  return true;
}

function ensureImageB() {
  if (!imgDataB) {
    alert("Esta operação precisa da Imagem 2 carregada.");
    return false;
  }
  return true;
}

function loadImageFromInput(fileInput, preview, canvas, ctx, isA) {
  const file = fileInput.files && fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    const img = new Image();

    img.onload = function () {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      if (isA) {
        imgDataA = imageData;
        matrizA = imageDataToMatrix(imgDataA);
        setInfo("info1", `${file.name} - ${img.width} × ${img.height} pixels`);
        resetPreview(false);
      } else {
        imgDataB = imageData;
        matrizB = imageDataToMatrix(imgDataB);
        setInfo("info2", `${file.name} - ${img.width} × ${img.height} pixels`);
      }

      preview.src = event.target.result;
    };

    img.onerror = function () {
      alert(
        "Não foi possível carregar a imagem. Teste outro arquivo PNG, JPG/JPEG ou BMP.",
      );
    };

    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function putResult(imageData) {
  resultCanvas.width = imageData.width;
  resultCanvas.height = imageData.height;
  resultCtx.putImageData(imageData, 0, 0);
  imgDataResult = resultCtx.getImageData(
    0,
    0,
    resultCanvas.width,
    resultCanvas.height,
  );
  matrizResultado = imageDataToMatrix(imgDataResult);
  drawHistogram(imgDataResult);
}

function createResultImageData(width, height) {
  return resultCtx.createImageData(width, height);
}

function getImageBAlignedToA(width, height) {
  if (!imgDataB) return null;

  if (imgDataB.width === width && imgDataB.height === height) {
    return imgDataB;
  }

  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true });
  tempCanvas.width = width;
  tempCanvas.height = height;
  tempCtx.drawImage(sourceCanvas2, 0, 0, width, height);
  return tempCtx.getImageData(0, 0, width, height);
}

function switchTab(tabName) {
  document
    .querySelectorAll(".tab-btn")
    .forEach((btn) => btn.classList.remove("active"));
  document
    .querySelectorAll(".tab-panel")
    .forEach((panel) => panel.classList.remove("active"));

  const panel = document.getElementById(`tab-${tabName}`);
  if (panel) panel.classList.add("active");

  const clickedButton = Array.from(document.querySelectorAll(".tab-btn")).find(
    (btn) =>
      btn.getAttribute("onclick") &&
      btn.getAttribute("onclick").includes(`'${tabName}'`),
  );
  if (clickedButton) clickedButton.classList.add("active");
}

function processTwoImages(operation) {
  if (!ensureImageA() || !ensureImageB()) return;

  const width = imgDataA.width;
  const height = imgDataA.height;
  const imageBAligned = getImageBAlignedToA(width, height);
  const dataA = imgDataA.data;
  const dataB = imageBAligned.data;
  const result = createResultImageData(width, height);
  const res = result.data;

  for (let i = 0; i < dataA.length; i += 4) {
    if (operation === "add") {
      res[i] = clamp(dataA[i] + dataB[i]);
      res[i + 1] = clamp(dataA[i + 1] + dataB[i + 1]);
      res[i + 2] = clamp(dataA[i + 2] + dataB[i + 2]);
    }

    if (operation === "subtract") {
      res[i] = clamp(dataA[i] - dataB[i]);
      res[i + 1] = clamp(dataA[i + 1] - dataB[i + 1]);
      res[i + 2] = clamp(dataA[i + 2] - dataB[i + 2]);
    }

    if (operation === "difference") {
      res[i] = Math.abs(dataA[i] - dataB[i]);
      res[i + 1] = Math.abs(dataA[i + 1] - dataB[i + 1]);
      res[i + 2] = Math.abs(dataA[i + 2] - dataB[i + 2]);
    }

    // Multiplicação normalizada para evitar que tudo sature imediatamente.
    if (operation === "multiply") {
      res[i] = clamp((dataA[i] * dataB[i]) / 255);
      res[i + 1] = clamp((dataA[i + 1] * dataB[i + 1]) / 255);
      res[i + 2] = clamp((dataA[i + 2] * dataB[i + 2]) / 255);
    }

    // Divisão normalizada. O +1 evita divisão por zero no canal da segunda imagem.
    if (operation === "divide") {
      res[i] = clamp((dataA[i] / (dataB[i] + 1)) * 255);
      res[i + 1] = clamp((dataA[i + 1] / (dataB[i + 1] + 1)) * 255);
      res[i + 2] = clamp((dataA[i + 2] / (dataB[i + 2] + 1)) * 255);
    }

    res[i + 3] = dataA[i + 3];
  }

  putResult(result);
}

function addImages() {
  processTwoImages("add");
}
function subtractImages() {
  processTwoImages("subtract");
}
function differenceImages() {
  processTwoImages("difference");
}
function multiplyImages() {
  processTwoImages("multiply");
}
function divideImages() {
  processTwoImages("divide");
}

function blendImages() {
  if (!ensureImageA() || !ensureImageB()) return;

  const width = imgDataA.width;
  const height = imgDataA.height;
  const imageBAligned = getImageBAlignedToA(width, height);
  const dataA = imgDataA.data;
  const dataB = imageBAligned.data;
  const result = createResultImageData(width, height);
  const res = result.data;
  const alpha = getNumericValue("blendAlpha", 0.5);
  const beta = getNumericValue("blendBeta", 0.5);

  for (let i = 0; i < dataA.length; i += 4) {
    res[i] = clamp(dataA[i] * alpha + dataB[i] * beta);
    res[i + 1] = clamp(dataA[i + 1] * alpha + dataB[i + 1] * beta);
    res[i + 2] = clamp(dataA[i + 2] * alpha + dataB[i + 2] * beta);
    res[i + 3] = dataA[i + 3];
  }

  putResult(result);
}

function averageImages() {
  if (!ensureImageA() || !ensureImageB()) return;

  const oldAlpha = document.getElementById("blendAlpha").value;
  const oldBeta = document.getElementById("blendBeta").value;
  document.getElementById("blendAlpha").value = "0.5";
  document.getElementById("blendBeta").value = "0.5";
  blendImages();
  document.getElementById("blendAlpha").value = oldAlpha;
  document.getElementById("blendBeta").value = oldBeta;
}

function processConstant(operation) {
  if (!ensureImageA()) return;

  const c = getNumericValue("constantValue", 0);
  if (operation === "divide" && c === 0) {
    alert(
      "Não é possível dividir os pixels por zero. Informe uma constante diferente de 0.",
    );
    return;
  }

  const width = imgDataA.width;
  const height = imgDataA.height;
  const dataA = imgDataA.data;
  const result = createResultImageData(width, height);
  const res = result.data;

  for (let i = 0; i < dataA.length; i += 4) {
    if (operation === "add") {
      res[i] = clamp(dataA[i] + c);
      res[i + 1] = clamp(dataA[i + 1] + c);
      res[i + 2] = clamp(dataA[i + 2] + c);
    }
    if (operation === "subtract") {
      res[i] = clamp(dataA[i] - c);
      res[i + 1] = clamp(dataA[i + 1] - c);
      res[i + 2] = clamp(dataA[i + 2] - c);
    }
    if (operation === "multiply") {
      res[i] = clamp(dataA[i] * c);
      res[i + 1] = clamp(dataA[i + 1] * c);
      res[i + 2] = clamp(dataA[i + 2] * c);
    }
    if (operation === "divide") {
      res[i] = clamp(dataA[i] / c);
      res[i + 1] = clamp(dataA[i + 1] / c);
      res[i + 2] = clamp(dataA[i + 2] / c);
    }
    res[i + 3] = dataA[i + 3];
  }

  putResult(result);
}

function transformImage(type) {
  if (!ensureImageA()) return;

  const width = imgDataA.width;
  const height = imgDataA.height;
  const dataA = imgDataA.data;
  const result = createResultImageData(width, height);
  const res = result.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = getIndex(x, y, width);

      if (type === "grayscale") {
        const gray = clamp(luminance(dataA[i], dataA[i + 1], dataA[i + 2]));
        res[i] = gray;
        res[i + 1] = gray;
        res[i + 2] = gray;
        res[i + 3] = dataA[i + 3];
      }

      if (type === "flipH") {
        const source = getIndex(width - 1 - x, y, width);
        res[i] = dataA[source];
        res[i + 1] = dataA[source + 1];
        res[i + 2] = dataA[source + 2];
        res[i + 3] = dataA[source + 3];
      }

      if (type === "flipV") {
        const source = getIndex(x, height - 1 - y, width);
        res[i] = dataA[source];
        res[i + 1] = dataA[source + 1];
        res[i + 2] = dataA[source + 2];
        res[i + 3] = dataA[source + 3];
      }
    }
  }

  putResult(result);
}

function thresholdImage() {
  if (!ensureImageA()) return;

  const threshold = Math.min(
    Math.max(getIntValue("thresholdValue", 127), 0),
    255,
  );
  const width = imgDataA.width;
  const height = imgDataA.height;
  const dataA = imgDataA.data;
  const result = createResultImageData(width, height);
  const res = result.data;

  for (let i = 0; i < dataA.length; i += 4) {
    const gray = luminance(dataA[i], dataA[i + 1], dataA[i + 2]);
    const value = gray >= threshold ? 255 : 0;
    res[i] = value;
    res[i + 1] = value;
    res[i + 2] = value;
    res[i + 3] = dataA[i + 3];
  }

  putResult(result);
}

function negativeImage() {
  if (!ensureImageA()) return;

  const width = imgDataA.width;
  const height = imgDataA.height;
  const dataA = imgDataA.data;
  const result = createResultImageData(width, height);
  const res = result.data;

  for (let i = 0; i < dataA.length; i += 4) {
    res[i] = 255 - dataA[i];
    res[i + 1] = 255 - dataA[i + 1];
    res[i + 2] = 255 - dataA[i + 2];
    res[i + 3] = dataA[i + 3];
  }

  putResult(result);
}

function equalizeHistogram() {
  if (!ensureImageA()) return;

  const width = imgDataA.width;
  const height = imgDataA.height;
  const dataA = imgDataA.data;
  const result = createResultImageData(width, height);
  const eqData = getEqualizedData(dataA, width, height);
  result.data.set(eqData);
  putResult(result);
}

function getEqualizedData(data, width, height) {
  const result = new Uint8ClampedArray(data.length);
  const totalPixels = width * height;
  const histogram = new Array(256).fill(0);
  const grayValues = new Uint8ClampedArray(totalPixels);

  for (let p = 0, i = 0; i < data.length; i += 4, p++) {
    const gray = clamp(luminance(data[i], data[i + 1], data[i + 2]));
    grayValues[p] = gray;
    histogram[gray]++;
  }

  const cdf = new Array(256).fill(0);
  cdf[0] = histogram[0];
  for (let i = 1; i < 256; i++) cdf[i] = cdf[i - 1] + histogram[i];

  const cdfMin = cdf.find((value) => value > 0) || 0;
  const denominator = totalPixels - cdfMin;
  const map = new Array(256).fill(0);

  for (let i = 0; i < 256; i++) {
    map[i] =
      denominator === 0 ? i : clamp(((cdf[i] - cdfMin) / denominator) * 255);
  }

  for (let p = 0, i = 0; i < data.length; i += 4, p++) {
    const value = map[grayValues[p]];
    result[i] = value;
    result[i + 1] = value;
    result[i + 2] = value;
    result[i + 3] = data[i + 3];
  }

  return result;
}

function logicalOperation(type) {
  if (!ensureImageA()) return;
  if (type !== "not" && !ensureImageB()) return;

  const threshold = Math.min(
    Math.max(getIntValue("thresholdValue", 127), 0),
    255,
  );
  const width = imgDataA.width;
  const height = imgDataA.height;
  const imageBAligned =
    type === "not" ? null : getImageBAlignedToA(width, height);
  const dataA = imgDataA.data;
  const dataB = imageBAligned ? imageBAligned.data : null;
  const result = createResultImageData(width, height);
  const res = result.data;

  for (let i = 0; i < dataA.length; i += 4) {
    const binA =
      luminance(dataA[i], dataA[i + 1], dataA[i + 2]) >= threshold ? 255 : 0;
    const binB = dataB
      ? luminance(dataB[i], dataB[i + 1], dataB[i + 2]) >= threshold
        ? 255
        : 0
      : 0;
    let value = 0;

    if (type === "and") value = binA === 255 && binB === 255 ? 255 : 0;
    if (type === "or") value = binA === 255 || binB === 255 ? 255 : 0;
    if (type === "xor") value = binA !== binB ? 255 : 0;
    if (type === "not") value = binA === 255 ? 0 : 255;

    res[i] = value;
    res[i + 1] = value;
    res[i + 2] = value;
    res[i + 3] = dataA[i + 3];
  }

  putResult(result);
}

function getSpatialFilterData(data, width, height, filterType, orderIndex = 5) {
  const result = new Uint8ClampedArray(data.length);
  const targetOrder = Math.min(Math.max(orderIndex - 1, 0), 8);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const rArr = [];
      const gArr = [];
      const bArr = [];
      let rSum = 0,
        gSum = 0,
        bSum = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = getClampedIndex(x + kx, y + ky, width, height);
          const r = data[idx],
            g = data[idx + 1],
            b = data[idx + 2];

          if (filterType === "mean") {
            rSum += r;
            gSum += g;
            bSum += b;
          } else {
            rArr.push(r);
            gArr.push(g);
            bArr.push(b);
          }
        }
      }

      const out = getIndex(x, y, width);
      if (filterType === "mean") {
        result[out] = clamp(rSum / 9);
        result[out + 1] = clamp(gSum / 9);
        result[out + 2] = clamp(bSum / 9);
      } else {
        rArr.sort((a, b) => a - b);
        gArr.sort((a, b) => a - b);
        bArr.sort((a, b) => a - b);
        let index = 4;
        if (filterType === "min") index = 0;
        if (filterType === "max") index = 8;
        if (filterType === "median") index = 4;
        if (filterType === "order") index = targetOrder;
        result[out] = rArr[index];
        result[out + 1] = gArr[index];
        result[out + 2] = bArr[index];
      }
      result[out + 3] = data[out + 3];
    }
  }

  return result;
}

function spatialFilter(type) {
  if (!ensureImageA()) return;
  const width = imgDataA.width;
  const height = imgDataA.height;
  const orderValue = Math.min(Math.max(getIntValue("orderValue", 5), 1), 9);
  const filtered = getSpatialFilterData(
    imgDataA.data,
    width,
    height,
    type,
    orderValue,
  );
  const result = createResultImageData(width, height);
  result.data.set(filtered);
  putResult(result);
}

function conservativeFilter() {
  if (!ensureImageA()) return;
  const width = imgDataA.width;
  const height = imgDataA.height;
  const filtered = getConservativeSmoothingData(imgDataA.data, width, height);
  const result = createResultImageData(width, height);
  result.data.set(filtered);
  putResult(result);
}

function getConservativeSmoothingData(data, width, height) {
  const result = new Uint8ClampedArray(data.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const center = getIndex(x, y, width);

      for (const channel of [0, 1, 2]) {
        const neighbors = [];
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            if (kx === 0 && ky === 0) continue;
            const idx = getClampedIndex(x + kx, y + ky, width, height);
            neighbors.push(data[idx + channel]);
          }
        }

        const minValue = Math.min(...neighbors);
        const maxValue = Math.max(...neighbors);
        const centerValue = data[center + channel];
        if (centerValue < minValue) result[center + channel] = minValue;
        else if (centerValue > maxValue) result[center + channel] = maxValue;
        else result[center + channel] = centerValue;
      }
      result[center + 3] = data[center + 3];
    }
  }

  return result;
}

function createGaussianKernel(size, sigma) {
  const kernel = [];
  const half = Math.floor(size / 2);
  let sum = 0;

  for (let y = -half; y <= half; y++) {
    const row = [];
    for (let x = -half; x <= half; x++) {
      const value = Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
      row.push(value);
      sum += value;
    }
    kernel.push(row);
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) kernel[y][x] /= sum;
  }

  return kernel;
}

function getGaussianData(data, width, height, size, sigma) {
  const result = new Uint8ClampedArray(data.length);
  const kernel = createGaussianKernel(size, sigma);
  const half = Math.floor(size / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0;
      for (let ky = -half; ky <= half; ky++) {
        for (let kx = -half; kx <= half; kx++) {
          const idx = getClampedIndex(x + kx, y + ky, width, height);
          const weight = kernel[ky + half][kx + half];
          r += data[idx] * weight;
          g += data[idx + 1] * weight;
          b += data[idx + 2] * weight;
        }
      }
      const out = getIndex(x, y, width);
      result[out] = clamp(r);
      result[out + 1] = clamp(g);
      result[out + 2] = clamp(b);
      result[out + 3] = data[out + 3];
    }
  }

  return result;
}

function gaussianFilter() {
  if (!ensureImageA()) return;
  const width = imgDataA.width;
  const height = imgDataA.height;
  const sizeRaw = getIntValue("gaussianSize", 5);
  const size = [3, 5, 7].includes(sizeRaw) ? sizeRaw : 5;
  const sigma = Math.max(getNumericValue("gaussianSigma", 1), 0.1);
  const filtered = getGaussianData(imgDataA.data, width, height, size, sigma);
  const result = createResultImageData(width, height);
  result.data.set(filtered);
  putResult(result);
}

function getEdgeData(data, width, height, edgeType) {
  const result = new Uint8ClampedArray(data.length);
  let kernelX = null,
    kernelY = null;

  if (edgeType === "prewitt") {
    kernelX = [
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1],
    ];
    kernelY = [
      [1, 1, 1],
      [0, 0, 0],
      [-1, -1, -1],
    ];
  }

  if (edgeType === "sobel") {
    kernelX = [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1],
    ];
    kernelY = [
      [1, 2, 1],
      [0, 0, 0],
      [-1, -2, -1],
    ];
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let gx = 0,
        gy = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = getClampedIndex(x + kx, y + ky, width, height);
          const gray = luminance(data[idx], data[idx + 1], data[idx + 2]);
          gx += gray * kernelX[ky + 1][kx + 1];
          gy += gray * kernelY[ky + 1][kx + 1];
        }
      }
      const magnitude = clamp(Math.sqrt(gx * gx + gy * gy));
      const out = getIndex(x, y, width);
      result[out] = magnitude;
      result[out + 1] = magnitude;
      result[out + 2] = magnitude;
      result[out + 3] = data[out + 3];
    }
  }

  return result;
}

function getLaplacianData(data, width, height) {
  const result = new Uint8ClampedArray(data.length);
  const kernel = [
    [0, -1, 0],
    [-1, 4, -1],
    [0, -1, 0],
  ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = getClampedIndex(x + kx, y + ky, width, height);
          const gray = luminance(data[idx], data[idx + 1], data[idx + 2]);
          sum += gray * kernel[ky + 1][kx + 1];
        }
      }
      const value = clamp(Math.abs(sum));
      const out = getIndex(x, y, width);
      result[out] = value;
      result[out + 1] = value;
      result[out + 2] = value;
      result[out + 3] = data[out + 3];
    }
  }

  return result;
}

function edgeFilter(type) {
  if (!ensureImageA()) return;
  const width = imgDataA.width;
  const height = imgDataA.height;
  const edge =
    type === "laplacian"
      ? getLaplacianData(imgDataA.data, width, height)
      : getEdgeData(imgDataA.data, width, height, type);
  const result = createResultImageData(width, height);
  result.data.set(edge);
  putResult(result);
}

function imageDataToBinaryArray(data, width, height, threshold) {
  const binary = new Uint8ClampedArray(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = getIndex(x, y, width);
      const gray = luminance(data[i], data[i + 1], data[i + 2]);
      binary[y * width + x] = gray >= threshold ? 255 : 0;
    }
  }
  return binary;
}

function binaryArrayToImageData(binary, sourceData, width, height) {
  const result = new Uint8ClampedArray(sourceData.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      const i = p * 4;
      const value = binary[p];
      result[i] = value;
      result[i + 1] = value;
      result[i + 2] = value;
      result[i + 3] = sourceData[i + 3];
    }
  }
  return result;
}

function dilateBinary(binary, width, height, size) {
  const output = new Uint8ClampedArray(binary.length);
  const half = Math.floor(size / 2);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let hasWhite = false;
      for (let ky = -half; ky <= half; ky++) {
        for (let kx = -half; kx <= half; kx++) {
          const nx = x + kx,
            ny = y + ky;
          if (
            nx >= 0 &&
            nx < width &&
            ny >= 0 &&
            ny < height &&
            binary[ny * width + nx] === 255
          ) {
            hasWhite = true;
          }
        }
      }
      output[y * width + x] = hasWhite ? 255 : 0;
    }
  }
  return output;
}

function erodeBinary(binary, width, height, size) {
  const output = new Uint8ClampedArray(binary.length);
  const half = Math.floor(size / 2);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let allWhite = true;
      for (let ky = -half; ky <= half; ky++) {
        for (let kx = -half; kx <= half; kx++) {
          const nx = x + kx,
            ny = y + ky;
          if (
            nx < 0 ||
            nx >= width ||
            ny < 0 ||
            ny >= height ||
            binary[ny * width + nx] !== 255
          ) {
            allWhite = false;
          }
        }
      }
      output[y * width + x] = allWhite ? 255 : 0;
    }
  }
  return output;
}

function getMorphologyData(operation) {
  if (!ensureImageA()) return null;

  const width = imgDataA.width;
  const height = imgDataA.height;
  const threshold = Math.min(
    Math.max(getIntValue("thresholdValue", 127), 0),
    255,
  );
  const sizeRaw = getIntValue("m-size", 3);
  const size = Math.min(Math.max(sizeRaw % 2 === 1 ? sizeRaw : 3, 3), 11);
  const binary = imageDataToBinaryArray(
    imgDataA.data,
    width,
    height,
    threshold,
  );
  let output = null;

  if (operation === "dilation")
    output = dilateBinary(binary, width, height, size);
  if (operation === "erosion")
    output = erodeBinary(binary, width, height, size);
  if (operation === "opening")
    output = dilateBinary(
      erodeBinary(binary, width, height, size),
      width,
      height,
      size,
    );
  if (operation === "closing")
    output = erodeBinary(
      dilateBinary(binary, width, height, size),
      width,
      height,
      size,
    );
  if (operation === "contour") {
    const eroded = erodeBinary(binary, width, height, size);
    output = new Uint8ClampedArray(binary.length);
    for (let i = 0; i < binary.length; i++)
      output[i] = binary[i] === 255 && eroded[i] === 0 ? 255 : 0;
  }

  const result = createResultImageData(width, height);
  result.data.set(binaryArrayToImageData(output, imgDataA.data, width, height));
  return result;
}

function morphDilate() {
  const data = getMorphologyData("dilation");
  if (data) putResult(data);
}
function morphErode() {
  const data = getMorphologyData("erosion");
  if (data) putResult(data);
}
function morphOpen() {
  const data = getMorphologyData("opening");
  if (data) putResult(data);
}
function morphClose() {
  const data = getMorphologyData("closing");
  if (data) putResult(data);
}
function morphContour() {
  const data = getMorphologyData("contour");
  if (data) putResult(data);
}

function drawHistogram(imageData) {
  if (!histogramCtx || !histogramCanvas || !imageData) return;

  const histogram = new Array(256).fill(0);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = clamp(luminance(data[i], data[i + 1], data[i + 2]));
    histogram[gray]++;
  }

  const maxCount = Math.max(...histogram, 1);
  const w = histogramCanvas.width;
  const h = histogramCanvas.height;
  histogramCtx.clearRect(0, 0, w, h);
  histogramCtx.fillStyle = "#020617";
  histogramCtx.fillRect(0, 0, w, h);
  histogramCtx.fillStyle = "#38bdf8";

  const barWidth = w / 256;
  for (let i = 0; i < 256; i++) {
    const barHeight = (histogram[i] / maxCount) * h;
    histogramCtx.fillRect(
      i * barWidth,
      h - barHeight,
      Math.max(barWidth, 1),
      barHeight,
    );
  }
}

function exportImage() {
  if (!imgDataResult) {
    alert("Nenhum resultado foi gerado ainda.");
    return;
  }

  const link = document.createElement("a");
  link.download = "resultado_processamento.png";
  link.href = resultCanvas.toDataURL("image/png");
  link.click();
}

function resetPreview(clearSources = true) {
  resultCtx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
  resultCanvas.width = 0;
  resultCanvas.height = 0;
  imgDataResult = null;
  matrizResultado = null;

  if (histogramCtx && histogramCanvas)
    histogramCtx.clearRect(0, 0, histogramCanvas.width, histogramCanvas.height);

  if (clearSources) {
    document.getElementById("buttonimage1").value = "";
    document.getElementById("buttonimage2").value = "";
    document.getElementById("preview1").removeAttribute("src");
    document.getElementById("preview2").removeAttribute("src");
    sourceCtx1.clearRect(0, 0, sourceCanvas1.width, sourceCanvas1.height);
    sourceCtx2.clearRect(0, 0, sourceCanvas2.width, sourceCanvas2.height);
    sourceCanvas1.width = 0;
    sourceCanvas1.height = 0;
    sourceCanvas2.width = 0;
    sourceCanvas2.height = 0;
    imgDataA = null;
    imgDataB = null;
    matrizA = null;
    matrizB = null;
    setInfo("info1", "Nenhuma imagem carregada.");
    setInfo("info2", "Nenhuma imagem carregada.");
  }
}

function useResultAsImage1() {
  if (!imgDataResult) {
    alert("Ainda não existe imagem resultante para usar como Imagem 1.");
    return;
  }

  sourceCanvas1.width = resultCanvas.width;
  sourceCanvas1.height = resultCanvas.height;
  sourceCtx1.putImageData(imgDataResult, 0, 0);
  imgDataA = sourceCtx1.getImageData(
    0,
    0,
    sourceCanvas1.width,
    sourceCanvas1.height,
  );
  matrizA = imageDataToMatrix(imgDataA);

  document.getElementById("preview1").src =
    sourceCanvas1.toDataURL("image/png");
  setInfo(
    "info1",
    `Resultado atual - ${sourceCanvas1.width} × ${sourceCanvas1.height} pixels`,
  );
}

function updateSliderLabels() {
  document
    .querySelectorAll('input[type="range"][data-out]')
    .forEach((slider) => {
      const output = document.getElementById(slider.dataset.out);
      const update = () => {
        if (output) output.textContent = `${slider.value}×${slider.value}`;
      };
      slider.addEventListener("input", update);
      update();
    });
}

document.getElementById("buttonimage1").addEventListener("change", function () {
  loadImageFromInput(
    this,
    document.getElementById("preview1"),
    sourceCanvas1,
    sourceCtx1,
    true,
  );
});

document.getElementById("buttonimage2").addEventListener("change", function () {
  loadImageFromInput(
    this,
    document.getElementById("preview2"),
    sourceCanvas2,
    sourceCtx2,
    false,
  );
});

updateSliderLabels();
