export function timeAgo(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 5) return 'agora';
  if (seconds < 60) return `há ${seconds} seg`;
  if (minutes < 60) return `há ${minutes} min`;
  if (hours < 24) return `há ${hours} h`;
  if (days === 1) return 'ontem';
  if (days < 7) return `há ${days} d`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatGender(genderCode: string | null | undefined): string {
  if (genderCode === 'm') return 'Masculino';
  if (genderCode === 'f') return 'Feminino';
  return 'Não informado';
}

/** Minimum influence points required to enter a closed (bias-specific) group. */
export const MIN_INFLUENCE_TO_ENTER_GROUP = 20;

/**
 * Parse date strings without UTC shift for date-only values (YYYY-MM-DD),
 * which otherwise become the previous day in timezones west of UTC (e.g. Brazil).
 */
function parseDisplayDate(dateString: string, includeTime: boolean): Date | null {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateString.trim());
  if (dateOnlyMatch && !includeTime) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]) - 1;
    const day = Number(dateOnlyMatch[3]);
    const local = new Date(year, month, day);
    return isNaN(local.getTime()) ? null : local;
  }
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

export function formatDate(dateString: string | null | undefined, includeTime: boolean = false): string {
  if (!dateString) return 'Não informada';
  try {
    const date = parseDisplayDate(dateString, includeTime);
    if (!date) return 'Data inválida';
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return date.toLocaleDateString('pt-BR', options);
  } catch (error) {
    console.error("Erro ao formatar data:", dateString, error);
    return dateString;
  }
}

export function formatCountryName(countryCode: string | null | undefined): string {
  const names: Record<string, string> = {
    br: 'Brasil',
    pt: 'Portugal',
    us: 'Estados Unidos',
  };
  if (!countryCode) return 'Não informado';
  return names[countryCode.toLowerCase()] || countryCode.toUpperCase();
}

const LOCAL_FLAG_CODES = new Set(['br', 'pt', 'us']);

/** Local SVG flag path (sharp at any size). */
export function countryFlagUrl(countryCode: string | null | undefined): string | null {
  if (!countryCode) return null;
  const code = countryCode.toLowerCase();
  if (!LOCAL_FLAG_CODES.has(code)) return null;
  return `/images/flags/${code}.svg`;
}

/** Relative membership duration: "há X dias/meses/anos". */
export function formatMembershipDuration(dateString: string | null | undefined): string {
  if (!dateString) return 'Não informado';
  const joined = new Date(dateString);
  if (isNaN(joined.getTime())) return 'Data inválida';

  const now = new Date();
  let years = now.getFullYear() - joined.getFullYear();
  let months = now.getMonth() - joined.getMonth();
  let days = now.getDate() - joined.getDate();

  if (days < 0) {
    months -= 1;
    const daysInPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    days += daysInPrevMonth;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years > 0) {
    return years === 1 ? 'há 1 ano' : `há ${years} anos`;
  }
  if (months > 0) {
    return months === 1 ? 'há 1 mês' : `há ${months} meses`;
  }
  if (days <= 0) return 'há menos de 1 dia';
  return days === 1 ? 'há 1 dia' : `há ${days} dias`;
}

// Formatar texto para exibir quebras de linha e detectar links
export function formatTextToHtml(text: string | null): string {
  if (!text) return '';
  return text
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/\n/g, '<br />')
    .replace(/(https?:\/\/[^\s!"'<>()]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
}

// Transformar URL de vídeo em URL de embed
export function getEmbedVideoUrl(videoUrl: string | null): string | undefined {
  if (!videoUrl) return undefined;
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]+)/;
  const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:channels\/.+\/|groups\/.+\/videos\/|album\/.+\/video\/|video\/)?(\d+)/;
  let match = videoUrl.match(youtubeRegex);
  if (match && match[1]) return `https://www.youtube.com/embed/${match[1]}`;
  match = videoUrl.match(vimeoRegex);
  if (match && match[1]) return `https://player.vimeo.com/video/${match[1]}`;
  return undefined;
}

export function isValidImageUrl(url: string): boolean {
  return /\.(jpeg|jpg|gif|png|webp)$/i.test(url);
}
