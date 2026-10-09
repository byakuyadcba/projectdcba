// 商品の正本はevent-playmats.htmlのproducts。表示フィルターに関係なく全柄を出力する。
(() => {
  const button = document.getElementById('export-catalog');
  const status = document.getElementById('export-status');
  const result = document.getElementById('export-result');
  const preview = document.getElementById('export-preview');
  const download = document.getElementById('export-download');
  const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans JP", Meiryo, sans-serif';
  let imageUrl = null;

  function loadImage(code) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const timeout = setTimeout(() => {
        image.src = '';
        reject(new Error(`${code}の画像読み込みがタイムアウトしました。`));
      }, 30000);
      image.onload = () => { clearTimeout(timeout); resolve(image); };
      image.onerror = () => {
        clearTimeout(timeout);
        reject(new Error(`${code}の画像を読み込めませんでした。`));
      };
      image.src = `images/items/${code}.png`;
    });
  }

  function drawText(ctx, text, x, y, size, color = '#203c34', weight = 400, maxWidth) {
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px ${fontFamily}`;
    while (maxWidth && ctx.measureText(text).width > maxWidth && size > 16) {
      size--;
      ctx.font = `${weight} ${size}px ${fontFamily}`;
    }
    ctx.fillText(text, x, y);
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight, size, color) {
    ctx.font = `400 ${size}px ${fontFamily}`;
    ctx.fillStyle = color;
    let line = '';
    for (const character of text) {
      if (character === '\n' || (line && ctx.measureText(line + character).width > maxWidth)) {
        ctx.fillText(line, x, y);
        y += lineHeight;
        line = character === '\n' ? '' : character;
      } else {
        line += character;
      }
    }
    if (line) ctx.fillText(line, x, y);
    return y + lineHeight;
  }

  // Canvasの標準出力は96dpi。PNGのpHYsチャンクだけを300dpiに設定する。
  async function setPrintResolution(blob) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const view = new DataView(bytes.buffer);
    const chunk = new Uint8Array(21);
    const chunkView = new DataView(chunk.buffer);
    chunkView.setUint32(0, 9);
    chunk.set([112, 72, 89, 115], 4); // pHYs
    chunkView.setUint32(8, 11811);
    chunkView.setUint32(12, 11811);
    chunk[16] = 1;
    let crc = 0xffffffff;
    for (const byte of chunk.subarray(4, 17)) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
    chunkView.setUint32(17, (crc ^ 0xffffffff) >>> 0);
    const parts = [bytes.subarray(0, 8)];
    let inserted = false;
    for (let offset = 8; offset < bytes.length;) {
      const length = view.getUint32(offset);
      const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
      const end = offset + length + 12;
      if (type !== 'pHYs') parts.push(bytes.subarray(offset, end));
      if (type === 'IHDR' && !inserted) { parts.push(chunk); inserted = true; }
      offset = end;
    }
    return new Blob(parts, { type: 'image/png' });
  }

  button.addEventListener('click', async () => {
    if (button.disabled) return;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    result.hidden = true;
    status.textContent = '画像を準備しています…';
    const canvas = document.createElement('canvas');
    try {
      if (document.fonts) await document.fonts.ready;
      canvas.width = 2480;
      canvas.height = 3508;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('このブラウザでは画像を生成できません。');
      ctx.fillStyle = '#fffefa';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.textBaseline = 'top';
      const margin = 120;
      const contentWidth = canvas.width - margin * 2;
      drawText(ctx, document.querySelector('.brand').textContent, margin, 110, 36, '#69746b', 650);
      drawText(ctx, document.querySelector('h1').textContent, margin, 185, 82, '#203c34', 700);
      drawText(ctx, `全 ${products.length} 柄`, canvas.width - margin - 250, 215, 38, '#69746b');
      ctx.fillStyle = '#d9ddd2';
      ctx.fillRect(margin, 305, contentWidth, 2);
      const notice = document.querySelector('.stock-notice').innerText;
      wrapText(ctx, notice, margin, 340, contentWidth, 44, 32, '#665638');
      const columns = 3;
      const rows = Math.ceil(products.length / columns);
      const gap = 40;
      const cardWidth = (contentWidth - gap * (columns - 1)) / columns;
      const gridTop = 490;
      const gridBottom = 3200;
      const rowGap = 30;
      const cardHeight = (gridBottom - gridTop - rowGap * (rows - 1)) / rows;
      const imageHeight = Math.min(cardWidth * 0.608, cardHeight - 110);
      if (imageHeight < 120) throw new Error('掲載数が多いためA4一枚に収まりません。');
      for (let index = 0; index < products.length; index++) {
        const product = products[index];
        status.textContent = `画像を生成しています… ${index + 1} / ${products.length}`;
        const image = await loadImage(product.code);
        const x = margin + (index % columns) * (cardWidth + gap);
        const y = gridTop + Math.floor(index / columns) * (cardHeight + rowGap);
        const scale = Math.min(cardWidth / image.naturalWidth, imageHeight / image.naturalHeight);
        const width = image.naturalWidth * scale;
        const height = image.naturalHeight * scale;
        ctx.fillStyle = '#e8e8df';
        ctx.fillRect(x, y, cardWidth, imageHeight);
        ctx.drawImage(image, x + (cardWidth - width) / 2, y + (imageHeight - height) / 2, width, height);
        drawText(ctx, `No. ${product.number}`, x, y + imageHeight + 13, 27, '#69746b', 650);
        drawText(ctx, product.name, x + 105, y + imageHeight + 10, 32, '#203c34', 600, cardWidth - 105);
        if (product.consignment) drawText(ctx, product.consignment, x, y + imageHeight + 58, 27, '#69746b', 500);
        image.src = '';
        await new Promise(resolve => requestAnimationFrame(resolve));
      }
      ctx.fillStyle = '#d9ddd2';
      ctx.fillRect(margin, 3240, contentWidth, 2);
      drawText(ctx, 'ご注文・頒布状況・価格のご確認は、売り場のスタッフへ。', margin, 3270, 31);
      drawText(ctx, '最新の一覧：https://project-dcba.com/event-playmats.html', margin, 3322, 28, '#69746b');
      drawText(ctx, '© Project-D.C.B.A', margin, 3390, 26, '#69746b');
      const stamp = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      drawText(ctx, `作成日：${stamp}`, canvas.width - margin - 370, 3390, 26, '#69746b');
      const raw = await new Promise((resolve, reject) => {
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNGの生成に失敗しました。')), 'image/png');
      });
      const png = await setPrintResolution(raw);
      // プレビューは通常の画像として扱えるdata URLにし、長押し保存にも対応する。
      const previewUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('プレビューの準備に失敗しました。'));
        reader.readAsDataURL(png);
      });
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      imageUrl = URL.createObjectURL(png);
      preview.src = previewUrl;
      download.href = imageUrl;
      download.download = `playmats-A4-${stamp}.png`;
      result.hidden = false;
      status.textContent = `全${products.length}柄のPNGを生成しました。「PNGを保存」から保存できます。`;
      download.focus({ preventScroll: true });
    } catch (error) {
      status.textContent = `${error.message || '画像を生成できませんでした。'} 通信状況を確認して、もう一度お試しください。`;
    } finally {
      canvas.width = canvas.height = 1;
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  });
})();
