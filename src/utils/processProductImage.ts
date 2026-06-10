/**
 * processProductImage
 * --------------------
 * 1. Samples the four corners of the image to detect the background color.
 * 2. Removes pixels whose color is within `tolerance` distance of the background
 *    (with a soft feathering zone for smooth edges).
 * 3. Converts the result to WebP (quality 0.92) and returns a new File.
 *
 * Works best on product photos shot against white/plain backgrounds.
 */
export async function processProductImage(
  file: File,
  options: { tolerance?: number; feather?: number; webpQuality?: number } = {}
): Promise<File> {
  const {
    tolerance = 45,
    feather = 25,
    webpQuality = 0.92,
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas 2D context unavailable'));

      ctx.drawImage(img, 0, 0);

      const { width, height } = canvas;
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      // ── Detect background color from the four corners ──────────────────────
      const samplePixel = (x: number, y: number) => {
        const i = (y * width + x) * 4;
        return { r: data[i], g: data[i + 1], b: data[i + 2] };
      };

      const corners = [
        samplePixel(0, 0),
        samplePixel(width - 1, 0),
        samplePixel(0, height - 1),
        samplePixel(width - 1, height - 1),
      ];

      const bg = {
        r: Math.round(corners.reduce((s, c) => s + c.r, 0) / 4),
        g: Math.round(corners.reduce((s, c) => s + c.g, 0) / 4),
        b: Math.round(corners.reduce((s, c) => s + c.b, 0) / 4),
      };

      // ── Remove background pixels using Flood Fill ──────────────────────────
      // Flood fill from all edges to safely remove background without touching
      // product internals (e.g. white text on a label).
      const maxPixels = width * height;
      const stackX = new Int32Array(maxPixels);
      const stackY = new Int32Array(maxPixels);
      let stackPtr = 0;
      
      const visited = new Uint8Array(maxPixels);

      const push = (x: number, y: number) => {
        if (x < 0 || x >= width || y < 0 || y >= height) return;
        const idx = y * width + x;
        if (visited[idx]) return;
        visited[idx] = 1;
        stackX[stackPtr] = x;
        stackY[stackPtr] = y;
        stackPtr++;
      };

      // Add all borders to start
      for (let x = 0; x < width; x++) { push(x, 0); push(x, height - 1); }
      for (let y = 0; y < height; y++) { push(0, y); push(width - 1, y); }

      // Higher tolerance defaults since we are using flood fill
      const effTolerance = options.tolerance ?? 80;
      const effFeather = options.feather ?? 40;

      while (stackPtr > 0) {
        stackPtr--;
        const x = stackX[stackPtr];
        const y = stackY[stackPtr];
        const idx = y * width + x;
        const i = idx * 4;
        
        // Skip if already transparent
        if (data[i + 3] === 0) {
          push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
          continue;
        }

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const dist = Math.sqrt(
          (r - bg.r) ** 2 + (g - bg.g) ** 2 + (b - bg.b) ** 2
        );

        if (dist <= effTolerance) {
          // Fully transparent
          data[i + 3] = 0;
          push(x + 1, y);
          push(x - 1, y);
          push(x, y + 1);
          push(x, y - 1);
        } else if (dist <= effTolerance + effFeather) {
          // Feathered edge - do not push neighbors (stop flood here)
          const alpha = Math.round(((dist - effTolerance) / effFeather) * 255);
          // Only lower alpha, never increase it
          data[i + 3] = Math.min(data[i + 3], alpha);
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // ── Export as WebP ─────────────────────────────────────────────────────
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Failed to generate WebP blob'));
          const baseName = file.name.replace(/\.[^/.]+$/, '');
          const webpFile = new File([blob], `${baseName}.webp`, {
            type: 'image/webp',
            lastModified: Date.now(),
          });
          resolve(webpFile);
        },
        'image/webp',
        webpQuality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}
