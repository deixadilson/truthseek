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

export function formatDate(dateString: string | null | undefined, includeTime: boolean = false): string {
  if (!dateString) return 'Não informada';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Data inválida';
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
    return dateString; // Retorna a string original em caso de erro
  }
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
