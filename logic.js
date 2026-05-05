const input1 = document.getElementById("buttonimage1");
const input2 = document.getElementById("buttonimage2");

const preview1 = document.getElementById("preview1");
const preview2 = document.getElementById("preview2");

const canvas = document.getElementById("resultCanvas");
const ctx = canvas.getContext("2d");

// 🔥 NOVO: guarda o estado atual da imagem
let currentImageData = null;

// preview imagem 1
input1.addEventListener("change", function () {
  const file = this.files[0];

  if (file) {
    const reader = new FileReader();

    reader.onload = function (e) {
      preview1.src = e.target.result;
      currentImageData = null; // reset
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

// soma
function addImages() {
  processImages("add");
}

// subtração
function subtractImages() {
  processImages("subtract");
}

// diferença
function differenceImages() {
  processImages("difference");
}

// processar duas imagens
function processImages(mode) {
  if (preview1.naturalWidth === 0 || preview2.naturalWidth === 0) {
    alert("Selecione as duas imagens.");
    return;
  }

  if (
    preview1.naturalWidth !== preview2.naturalWidth ||
    preview1.naturalHeight !== preview2.naturalHeight
  ) {
    alert("As imagens devem ter a mesma resolução!");
    return;
  }

  const width = preview1.naturalWidth;
  const height = preview1.naturalHeight;

  canvas.width = width;
  canvas.height = height;

  ctx.drawImage(preview1, 0, 0);
  const data1 = ctx.getImageData(0, 0, width, height);

  ctx.drawImage(preview2, 0, 0);
  const data2 = ctx.getImageData(0, 0, width, height);

  const result = ctx.createImageData(width, height);

  for (let i = 0; i < data1.data.length; i += 4) {
    let r1 = data1.data[i];
    let g1 = data1.data[i + 1];
    let b1 = data1.data[i + 2];

    let r2 = data2.data[i];
    let g2 = data2.data[i + 1];
    let b2 = data2.data[i + 2];

    if (mode === "add") {
      result.data[i] = Math.min(255, r1 + r2);
      result.data[i + 1] = Math.min(255, g1 + g2);
      result.data[i + 2] = Math.min(255, b1 + b2);
    }

    if (mode === "subtract") {
      result.data[i] = Math.max(0, r1 - r2);
      result.data[i + 1] = Math.max(0, g1 - g2);
      result.data[i + 2] = Math.max(0, b1 - b2);
    }

    if (mode === "difference") {
      result.data[i] = Math.abs(r1 - r2);
      result.data[i + 1] = Math.abs(g1 - g2);
      result.data[i + 2] = Math.abs(b1 - b2);
    }

    result.data[i + 3] = 255;
  }

  ctx.putImageData(result, 0, 0);
  currentImageData = result; // 🔥 salva estado
}

// operações com constante
function processConstant(mode) {
  if (preview1.naturalWidth === 0) {
    alert("Selecione a imagem 1.");
    return;
  }

  const c = parseFloat(document.getElementById("constantValue").value);

  if (isNaN(c)) {
    alert("Valor inválido!");
    return;
  }

  if (mode === "divide" && c === 0) {
    alert("Divisão por zero!");
    return;
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

  const result = ctx.createImageData(width, height);

  for (let i = 0; i < data1.data.length; i += 4) {
    let r = data1.data[i];
    let g = data1.data[i + 1];
    let b = data1.data[i + 2];

    if (mode === "add") {
      r = Math.min(255, r + c);
      g = Math.min(255, g + c);
      b = Math.min(255, b + c);
    } else if (mode === "subtract") {
      r = Math.max(0, r - c);
      g = Math.max(0, g - c);
      b = Math.max(0, b - c);
    } else if (mode === "multiply") {
      r = Math.max(0, Math.min(255, r * c));
      g = Math.max(0, Math.min(255, g * c));
      b = Math.max(0, Math.min(255, b * c));
    } else if (mode === "divide") {
      r = Math.max(0, Math.min(255, r / c));
      g = Math.max(0, Math.min(255, g / c));
      b = Math.max(0, Math.min(255, b / c));
    }

    result.data[i] = r;
    result.data[i + 1] = g;
    result.data[i + 2] = b;
    result.data[i + 3] = 255;
  }

  ctx.putImageData(result, 0, 0);
  currentImageData = result;
}

// exportar
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

// 🔥 TRANSFORMAÇÕES (CORRIGIDO)
function transformImage(mode) {
  if (preview1.naturalWidth === 0) {
    alert("Selecione a imagem.");
    return;
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

  const result = ctx.createImageData(width, height);

  if (mode === "grayscale") {
    for (let i = 0; i < data1.data.length; i += 4) {
      let r = data1.data[i];
      let g = data1.data[i + 1];
      let b = data1.data[i + 2];

      let gray = r * 0.299 + g * 0.587 + b * 0.114;

      result.data[i] = gray;
      result.data[i + 1] = gray;
      result.data[i + 2] = gray;
      result.data[i + 3] = data1.data[i + 3];
    }
  }

  if (mode === "flipH") {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let i = (y * width + x) * 4;
        let srcX = width - 1 - x;
        let src = (y * width + srcX) * 4;

        result.data[i] = data1.data[src];
        result.data[i + 1] = data1.data[src + 1];
        result.data[i + 2] = data1.data[src + 2];
        result.data[i + 3] = data1.data[src + 3];
      }
    }
  }

  if (mode === "flipV") {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let i = (y * width + x) * 4;
        let srcY = height - 1 - y;
        let src = (srcY * width + x) * 4;

        result.data[i] = data1.data[src];
        result.data[i + 1] = data1.data[src + 1];
        result.data[i + 2] = data1.data[src + 2];
        result.data[i + 3] = data1.data[src + 3];
      }
    }
  }

  ctx.putImageData(result, 0, 0);
  currentImageData = result;
}
