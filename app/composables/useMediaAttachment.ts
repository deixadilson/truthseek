import { useToast } from 'vue-toastification';
import { getEmbedVideoUrl, isValidImageUrl } from '~/utils/formatters';
import {
  isStandaloneHttpUrl,
  normalizeLinkPreview,
  type LinkPreview,
} from '~/types/linkPreview';

/**
 * Shared image/video/link-preview attachment state for create & edit forms.
 * Pasting a video link, generic URL, or image file replaces any previous media.
 */
export function useMediaAttachment(textContent: Ref<string>) {
  const toast = useToast();

  const imageFile = ref<File | null>(null);
  const imagePreviewUrl = ref<string | null>(null);
  const existingImagePath = ref<string | null>(null);
  const videoUrlToSave = ref<string | null>(null);
  const embedVideoUrl = ref<string | null>(null);
  const linkPreview = ref<LinkPreview | null>(null);
  const isLinkPreviewLoading = ref(false);
  const isDraggingOver = ref(false);
  const fileInputRef = ref<HTMLInputElement | null>(null);

  const hasImage = computed(() => !!(imageFile.value || existingImagePath.value));
  const hasVideo = computed(() => !!videoUrlToSave.value);
  const hasLinkPreview = computed(() => !!linkPreview.value);
  const hasMedia = computed(() => hasImage.value || hasVideo.value || hasLinkPreview.value);
  const canSubmitWith = (extraText?: string) => {
    const text = (extraText ?? textContent.value).trim();
    return text !== '' || hasImage.value || hasVideo.value || hasLinkPreview.value;
  };

  function revokePreviewIfBlob() {
    if (imagePreviewUrl.value?.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl.value);
    }
  }

  function clearImage() {
    revokePreviewIfBlob();
    imageFile.value = null;
    imagePreviewUrl.value = null;
    existingImagePath.value = null;
    if (fileInputRef.value) fileInputRef.value.value = '';
  }

  function clearVideo() {
    videoUrlToSave.value = null;
    embedVideoUrl.value = null;
  }

  function clearLinkPreview() {
    linkPreview.value = null;
  }

  function removeImage() {
    clearImage();
  }

  function removeVideo() {
    clearVideo();
  }

  function removeLinkPreview() {
    clearLinkPreview();
  }

  function resetMedia() {
    clearImage();
    clearVideo();
    clearLinkPreview();
  }

  function stripUrlFromText(url: string) {
    textContent.value = textContent.value
      .split(url)
      .join('')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function setVideoFromUrl(url: string): boolean {
    const embed = getEmbedVideoUrl(url.trim());
    if (!embed) return false;
    clearImage();
    clearLinkPreview();
    embedVideoUrl.value = embed;
    videoUrlToSave.value = url.trim();
    return true;
  }

  function setImageFromFile(file: File) {
    clearVideo();
    clearLinkPreview();
    revokePreviewIfBlob();
    imageFile.value = file;
    existingImagePath.value = null;
    imagePreviewUrl.value = URL.createObjectURL(file);
  }

  function setLinkPreviewData(preview: LinkPreview) {
    clearImage();
    clearVideo();
    linkPreview.value = preview;
  }

  async function setLinkPreviewFromUrl(url: string): Promise<boolean> {
    const trimmed = url.trim();
    if (!isStandaloneHttpUrl(trimmed)) return false;
    if (getEmbedVideoUrl(trimmed)) return false;

    clearImage();
    clearVideo();
    isLinkPreviewLoading.value = true;
    try {
      const data = await $fetch<LinkPreview>('/api/link-preview', {
        query: { url: trimmed },
      });
      const normalized = normalizeLinkPreview(data) || {
        url: trimmed,
        title: null,
        description: null,
        image: null,
        site_name: null,
      };
      if (!normalized.title) {
        try {
          normalized.title = new URL(trimmed).hostname;
        } catch {
          normalized.title = trimmed;
        }
      }
      linkPreview.value = normalized;
      return true;
    } catch (e: any) {
      // Minimal card so the media slot is kept (per product UX).
      let hostname: string | null = null;
      try {
        hostname = new URL(trimmed).hostname;
      } catch {
        hostname = null;
      }
      linkPreview.value = {
        url: trimmed,
        title: hostname || trimmed,
        description: null,
        image: null,
        site_name: hostname,
      };
      if (e?.statusCode && e.statusCode < 500) {
        toast.info(e.statusMessage || e.message || 'Prévia limitada para este link.');
      }
      return true;
    } finally {
      isLinkPreviewLoading.value = false;
    }
  }

  function initMedia(opts: {
    imagePath?: string | null;
    imagePublicUrl?: string | null;
    videoUrl?: string | null;
    linkPreview?: LinkPreview | null | unknown;
  }) {
    resetMedia();
    const preview = normalizeLinkPreview(opts.linkPreview);
    if (opts.videoUrl) {
      setVideoFromUrl(opts.videoUrl);
    } else if (preview) {
      setLinkPreviewData(preview);
    } else if (opts.imagePath) {
      existingImagePath.value = opts.imagePath;
      imagePreviewUrl.value = opts.imagePublicUrl || null;
    }
  }

  async function processPastedOrDroppedData(data: string | File) {
    if (typeof data === 'string') {
      if (setVideoFromUrl(data)) {
        stripUrlFromText(data);
        return;
      }
      if (isStandaloneHttpUrl(data) && !isValidImageUrl(data)) {
        const ok = await setLinkPreviewFromUrl(data);
        if (ok) stripUrlFromText(data);
        return;
      }
      if (isValidImageUrl(data)) {
        toast.info('Para adicionar uma imagem de um link, use o botão ou arraste o arquivo.');
      }
      return;
    }
    setImageFromFile(data);
  }

  function handlePaste(event: ClipboardEvent) {
    const pastedData = event.clipboardData?.getData('text');
    const trimmed = pastedData?.trim() || '';
    if (trimmed && (getEmbedVideoUrl(trimmed) || isStandaloneHttpUrl(trimmed))) {
      event.preventDefault();
      void processPastedOrDroppedData(trimmed);
      return;
    }
    if (pastedData) {
      setTimeout(() => {
        void processPastedOrDroppedData(pastedData);
      }, 0);
    }
    const items = event.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          event.preventDefault();
          setImageFromFile(blob);
          break;
        }
      }
    }
  }

  function handleImageFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files?.[0]) {
      void processPastedOrDroppedData(target.files[0]);
    }
  }

  function handleDragOver() {
    isDraggingOver.value = true;
  }

  function handleDragLeave() {
    isDraggingOver.value = false;
  }

  function handleDrop(event: DragEvent) {
    isDraggingOver.value = false;
    const text = event.dataTransfer?.getData('text')?.trim();
    if (text && (getEmbedVideoUrl(text) || isStandaloneHttpUrl(text))) {
      void processPastedOrDroppedData(text);
      return;
    }
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    if (file.type.startsWith('image/')) {
      void processPastedOrDroppedData(file);
    } else {
      toast.error('Apenas arquivos de imagem podem ser arrastados.');
    }
  }

  /** Final image path for DB: new upload path, existing path, or null. */
  function resolveImagePath(uploadedPath: string | null): string | null {
    if (videoUrlToSave.value || linkPreview.value) return null;
    if (uploadedPath) return uploadedPath;
    return existingImagePath.value;
  }

  return {
    imageFile,
    imagePreviewUrl,
    existingImagePath,
    videoUrlToSave,
    embedVideoUrl,
    linkPreview,
    isLinkPreviewLoading,
    isDraggingOver,
    fileInputRef,
    hasImage,
    hasVideo,
    hasLinkPreview,
    hasMedia,
    canSubmitWith,
    removeImage,
    removeVideo,
    removeLinkPreview,
    resetMedia,
    initMedia,
    processPastedOrDroppedData,
    handlePaste,
    handleImageFileSelected,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    resolveImagePath,
  };
}
