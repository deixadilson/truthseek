const POST_MEDIA_PUBLIC =
  'https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/post-media';

/** Crawlers (WhatsApp/Facebook/X) often reject SVG and non-image media. */
const OG_IMAGE_EXT = /\.(jpe?g|png|webp|gif)(\?.*)?$/i;

export function plainTextFromPostMarkdown(
  markdown: string | null | undefined,
  maxLength = 160
): string {
  if (!markdown) return '';

  let text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    .replace(/\\+\n/g, '\n')
    .replace(/\\/g, '')
    .replace(/[*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function absolutePostMediaUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  const path = imagePath.replace(/^\/+/, '');
  if (!OG_IMAGE_EXT.test(path)) return null;
  return `${POST_MEDIA_PUBLIC}/${path}`;
}

export function buildPostOgMeta(input: {
  siteOrigin: string;
  postId: string;
  textContent: string | null | undefined;
  imagePath: string | null | undefined;
  isAnonymous: boolean | null | undefined;
  authorUsername: string | null | undefined;
  groupName: string | null | undefined;
  visible: boolean;
}): {
  title: string;
  description: string;
  url: string;
  image: string;
  imageAlt: string;
} {
  const site = 'TruthSeek Network';
  const url = `${input.siteOrigin.replace(/\/$/, '')}/post/${input.postId}`;
  const defaultImage = `${input.siteOrigin.replace(/\/$/, '')}/images/og-default.png`;

  if (!input.visible) {
    return {
      title: `Post · ${site}`,
      description: 'Este post não está disponível publicamente no TruthSeek Network.',
      url,
      image: defaultImage,
      imageAlt: site,
    };
  }

  const excerpt = plainTextFromPostMarkdown(input.textContent, 160);
  const authorLabel = input.isAnonymous
    ? 'Anônimo'
    : input.authorUsername
      ? `@${input.authorUsername}`
      : null;

  const titleParts = [
    authorLabel,
    input.groupName ? input.groupName : null,
  ].filter(Boolean);
  const title = titleParts.length
    ? `${titleParts.join(' · ')} · ${site}`
    : `Post · ${site}`;

  const description =
    excerpt ||
    (input.groupName
      ? `Post no grupo ${input.groupName} no TruthSeek Network.`
      : 'Veja este post no TruthSeek Network.');

  const image = absolutePostMediaUrl(input.imagePath) || defaultImage;

  return {
    title,
    description,
    url,
    image,
    imageAlt: excerpt ? plainTextFromPostMarkdown(excerpt, 80) : site,
  };
}
