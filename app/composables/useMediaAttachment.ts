import { useToast } from 'vue-toastification';
import { getEmbedVideoUrl, isValidImageUrl } from '~/utils/formatters';

/**
 * Shared image/video attachment state for create & edit forms.
 * Pasting a video link or image file replaces any previous media.
 */
export function useMediaAttachment(textContent: Ref<string>) {
  const toast = useToast();

  const imageFile = ref<File | null>(null);
  const imagePreviewUrl = ref<string | null>(null);
  const existingImagePath = ref<string | null>(null);
  const videoUrlToSave = ref<string | null>(null);
  const embedVideoUrl = ref<string | null>(null);
  const isDraggingOver = ref(false);
  const fileInputRef = ref<HTMLInputElement | null>(null);

  const hasImage = computed(() => !!(imageFile.value || existingImagePath.value));
  const hasVideo = computed(() => !!videoUrlToSave.value);
  const hasMedia = computed(() => hasImage.value || hasVideo.value);
  const canSubmitWith = (extraText?: string) => {
    const text = (extraText ?? textContent.value).trim();
    return text !== '' || hasImage.value || hasVideo.value;
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

  function removeImage() {
    clearImage();
  }

  function removeVideo() {
    clearVideo();
  }

  function resetMedia() {
    clearImage();
    clearVideo();
  }

  function setVideoFromUrl(url: string): boolean {
    const embed = getEmbedVideoUrl(url.trim());
    if (!embed) return false;
    clearImage();
    embedVideoUrl.value = embed;
    videoUrlToSave.value = url.trim();
    return true;
  }

  function setImageFromFile(file: File) {
    clearVideo();
    revokePreviewIfBlob();
    imageFile.value = file;
    existingImagePath.value = null;
    imagePreviewUrl.value = URL.createObjectURL(file);
  }

  function initMedia(opts: {
    imagePath?: string | null;
    imagePublicUrl?: string | null;
    videoUrl?: string | null;
  }) {
    resetMedia();
    if (opts.videoUrl) {
      setVideoFromUrl(opts.videoUrl);
    } else if (opts.imagePath) {
      existingImagePath.value = opts.imagePath;
      imagePreviewUrl.value = opts.imagePublicUrl || null;
    }
  }

  function processPastedOrDroppedData(data: string | File) {
    if (typeof data === 'string') {
      if (setVideoFromUrl(data)) {
        textContent.value = textContent.value.split(data).join('').replace(/\n{3,}/g, '\n\n').trim();
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
    if (pastedData && getEmbedVideoUrl(pastedData.trim())) {
      // Prevent the raw URL from lingering in the textarea
      event.preventDefault();
      processPastedOrDroppedData(pastedData.trim());
      return;
    }
    if (pastedData) {
      setTimeout(() => processPastedOrDroppedData(pastedData), 0);
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
      processPastedOrDroppedData(target.files[0]);
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
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    if (file.type.startsWith('image/')) {
      processPastedOrDroppedData(file);
    } else {
      toast.error('Apenas arquivos de imagem podem ser arrastados.');
    }
  }

  /** Final image path for DB: new upload path, existing path, or null. */
  function resolveImagePath(uploadedPath: string | null): string | null {
    if (videoUrlToSave.value) return null;
    if (uploadedPath) return uploadedPath;
    return existingImagePath.value;
  }

  return {
    imageFile,
    imagePreviewUrl,
    existingImagePath,
    videoUrlToSave,
    embedVideoUrl,
    isDraggingOver,
    fileInputRef,
    hasImage,
    hasVideo,
    hasMedia,
    canSubmitWith,
    removeImage,
    removeVideo,
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
