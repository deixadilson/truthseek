export type QuizShareImageInput = {
  ideologyName: string;
  scorePercent: number;
  flagUrl?: string | null;
  quizTitle?: string;
};

const SIZE = 1080;
const PRIMARY = '#008fa1';
const PRIMARY_DARK = '#006d7a';
const PRIMARY_LIGHT = '#b2ebf2';
const TEXT = '#333333';
const MUTED = '#666666';
const WHITE = '#ffffff';
const LOGO_PATH = '/images/logo.svg';

function logoUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${LOGO_PATH}`;
  }
  return LOGO_PATH;
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawCircularImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  radius: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  const size = radius * 2;
  const scale = Math.max(size / img.width, size / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = PRIMARY_LIGHT;
  ctx.lineWidth = 6;
  ctx.stroke();
}

/** Fake perspective watermark: rotate + skew + non-uniform scale. */
function drawPerspectiveLogo(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement,
  opts: {
    x: number;
    y: number;
    width: number;
    rotate: number;
    skewX: number;
    skewY: number;
    scaleY: number;
    alpha: number;
  }
) {
  const aspect = logo.height / Math.max(logo.width, 1);
  const w = opts.width;
  const h = w * aspect;

  ctx.save();
  ctx.globalAlpha = opts.alpha;
  ctx.translate(opts.x, opts.y);
  ctx.rotate(opts.rotate);
  // a c e / b d f — skew + vertical squash for a vanishing-point feel
  ctx.transform(1, opts.skewY, opts.skewX, opts.scaleY, 0, 0);
  ctx.drawImage(logo, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function drawLogoWatermarks(ctx: CanvasRenderingContext2D, logo: HTMLImageElement) {
  drawPerspectiveLogo(ctx, logo, {
    x: SIZE * 0.72,
    y: SIZE * 0.38,
    width: 520,
    rotate: -0.42,
    skewX: -0.28,
    skewY: 0.12,
    scaleY: 0.72,
    alpha: 0.11,
  });
  drawPerspectiveLogo(ctx, logo, {
    x: SIZE * 0.22,
    y: SIZE * 0.78,
    width: 380,
    rotate: 0.55,
    skewX: 0.22,
    skewY: -0.08,
    scaleY: 0.78,
    alpha: 0.09,
  });
  drawPerspectiveLogo(ctx, logo, {
    x: SIZE * 0.88,
    y: SIZE * 0.88,
    width: 260,
    rotate: -0.18,
    skewX: -0.15,
    skewY: 0.05,
    scaleY: 0.85,
    alpha: 0.07,
  });
}

export function buildQuizShareCaption(input: {
  ideologyName: string;
  scorePercent: number;
  quizUrl: string;
  quizTitle?: string;
}): string {
  const title = input.quizTitle || 'Quiz Ideologias Políticas';
  const pct = `${input.scorePercent}%`;
  return [
    `Obtive o resultado ${pct} ${input.ideologyName} no ${title} de TruthSeek Network.`,
    'Faça você também e descubra com qual ideologia suas convicções mais se alinham:',
    input.quizUrl,
  ].join('\n');
}

export async function renderQuizResultImage(input: QuizShareImageInput): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas não suportado neste navegador.');

  const quizTitle = input.quizTitle || 'Quiz Ideologias Políticas';
  const scoreLabel = `${input.scorePercent}%`;
  const logo = await loadImage(logoUrl());

  // Background
  const gradient = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  gradient.addColorStop(0, '#f4f7f6');
  gradient.addColorStop(0.45, WHITE);
  gradient.addColorStop(1, PRIMARY_LIGHT);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, SIZE, SIZE);

  if (logo) {
    drawLogoWatermarks(ctx, logo);
  }

  // Top brand bar
  ctx.fillStyle = PRIMARY;
  ctx.fillRect(0, 0, SIZE, 120);

  let brandTextX = 64;
  if (logo) {
    const logoH = 72;
    const logoW = logoH * (logo.width / Math.max(logo.height, 1));
    const logoX = 48;
    const logoY = (120 - logoH) / 2;
    ctx.drawImage(logo, logoX, logoY, logoW, logoH);
    brandTextX = logoX + logoW + 22;
  }

  ctx.fillStyle = WHITE;
  ctx.font = '700 42px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('TruthSeek Network', brandTextX, 60);
  ctx.textBaseline = 'alphabetic';

  // Card
  const cardX = 64;
  const cardY = 180;
  const cardW = SIZE - 128;
  const cardH = 720;
  ctx.fillStyle = WHITE;
  roundRect(ctx, cardX, cardY, cardW, cardH, 28);
  ctx.fill();
  ctx.strokeStyle = '#dee2e6';
  ctx.lineWidth = 2;
  roundRect(ctx, cardX, cardY, cardW, cardH, 28);
  ctx.stroke();

  // Quiz subtitle
  ctx.fillStyle = PRIMARY_DARK;
  ctx.font = '600 34px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(quizTitle, SIZE / 2, cardY + 70);

  // Flag
  let flagDrawn = false;
  if (input.flagUrl) {
    const flag = await loadImage(input.flagUrl);
    if (flag) {
      drawCircularImage(ctx, flag, SIZE / 2, cardY + 220, 88);
      flagDrawn = true;
    }
  }
  if (!flagDrawn) {
    ctx.beginPath();
    ctx.arc(SIZE / 2, cardY + 220, 88, 0, Math.PI * 2);
    ctx.fillStyle = PRIMARY_LIGHT;
    ctx.fill();
    ctx.fillStyle = PRIMARY_DARK;
    ctx.font = '700 64px system-ui, -apple-system, Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(input.ideologyName.substring(0, 1).toUpperCase(), SIZE / 2, cardY + 220);
    ctx.textBaseline = 'alphabetic';
  }

  // Score
  ctx.fillStyle = PRIMARY;
  ctx.font = '800 120px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(scoreLabel, SIZE / 2, cardY + 400);

  // Ideology name
  ctx.fillStyle = TEXT;
  ctx.font = '700 56px system-ui, -apple-system, Segoe UI, sans-serif';
  const nameLines = wrapText(ctx, input.ideologyName, cardW - 80);
  let nameY = cardY + 480;
  for (const line of nameLines.slice(0, 2)) {
    ctx.fillText(line, SIZE / 2, nameY);
    nameY += 66;
  }

  // Result sentence
  const sentence = `Obtive o resultado ${scoreLabel} ${input.ideologyName} no ${quizTitle} de TruthSeek Network`;
  ctx.fillStyle = MUTED;
  ctx.font = '500 30px system-ui, -apple-system, Segoe UI, sans-serif';
  const sentenceLines = wrapText(ctx, sentence, cardW - 100);
  let sentenceY = cardY + 620;
  for (const line of sentenceLines.slice(0, 3)) {
    ctx.fillText(line, SIZE / 2, sentenceY);
    sentenceY += 40;
  }

  // Footer
  ctx.fillStyle = PRIMARY_DARK;
  ctx.font = '600 28px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillText('truthseek.network', SIZE / 2, SIZE - 48);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Falha ao gerar a imagem.'));
    }, 'image/png');
  });
}
