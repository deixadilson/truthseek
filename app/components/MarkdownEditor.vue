<template>
  <ClientOnly>
    <div
      class="markdown-editor"
      :class="{ 'drag-over': dragOver, 'is-invalid': overLimit }"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
    >
      <div v-if="editor" class="markdown-toolbar" role="toolbar" aria-label="Formatação">
        <button
          type="button"
          class="toolbar-btn"
          title="Negrito"
          :class="{ active: editor.isActive('bold') }"
          @click="editor.chain().focus().toggleBold().run()"
        >
          <Icon name="lucide:bold" :size="15" />
        </button>
        <button
          type="button"
          class="toolbar-btn"
          title="Itálico"
          :class="{ active: editor.isActive('italic') }"
          @click="editor.chain().focus().toggleItalic().run()"
        >
          <Icon name="lucide:italic" :size="15" />
        </button>
        <button
          type="button"
          class="toolbar-btn"
          title="Tachado"
          :class="{ active: editor.isActive('strike') }"
          @click="editor.chain().focus().toggleStrike().run()"
        >
          <Icon name="lucide:strikethrough" :size="15" />
        </button>

        <span class="toolbar-sep" aria-hidden="true" />

        <button
          type="button"
          class="toolbar-btn"
          title="Título"
          :class="{ active: editor.isActive('heading', { level: 2 }) }"
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        >
          <Icon name="lucide:heading-2" :size="15" />
        </button>
        <button
          type="button"
          class="toolbar-btn"
          title="Subtítulo"
          :class="{ active: editor.isActive('heading', { level: 3 }) }"
          @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
        >
          <Icon name="lucide:heading-3" :size="15" />
        </button>

        <span class="toolbar-sep" aria-hidden="true" />

        <button
          type="button"
          class="toolbar-btn"
          title="Lista"
          :class="{ active: editor.isActive('bulletList') }"
          @click="editor.chain().focus().toggleBulletList().run()"
        >
          <Icon name="lucide:list" :size="15" />
        </button>
        <button
          type="button"
          class="toolbar-btn"
          title="Lista numerada"
          :class="{ active: editor.isActive('orderedList') }"
          @click="editor.chain().focus().toggleOrderedList().run()"
        >
          <Icon name="lucide:list-ordered" :size="15" />
        </button>
        <button
          type="button"
          class="toolbar-btn"
          title="Citação"
          :class="{ active: editor.isActive('blockquote') }"
          @click="editor.chain().focus().toggleBlockquote().run()"
        >
          <Icon name="lucide:quote" :size="15" />
        </button>

        <span class="toolbar-sep" aria-hidden="true" />

        <button
          type="button"
          class="toolbar-btn"
          title="Código"
          :class="{ active: editor.isActive('code') }"
          @click="editor.chain().focus().toggleCode().run()"
        >
          <Icon name="lucide:code" :size="15" />
        </button>
        <button
          type="button"
          class="toolbar-btn"
          title="Bloco de código"
          :class="{ active: editor.isActive('codeBlock') }"
          @click="editor.chain().focus().toggleCodeBlock().run()"
        >
          <Icon name="lucide:square-code" :size="15" />
        </button>
        <button
          type="button"
          class="toolbar-btn"
          title="Link"
          :class="{ active: editor.isActive('link') }"
          @click="toggleLink"
        >
          <Icon name="lucide:link" :size="15" />
        </button>
      </div>

      <EditorContent :editor="editor" class="markdown-editor-content" />

      <div class="markdown-footer">
        <span class="char-count" :class="{ over: overLimit }">
          {{ markdownLength }} / {{ maxLength }}
        </span>
      </div>
    </div>

    <Dialog :open="linkDialogOpen" @close="closeLinkDialog" class="link-dialog-root">
      <div class="link-backdrop" aria-hidden="true" />
      <div class="link-dialog-container">
        <DialogPanel class="link-panel" as="form" @submit.prevent="confirmLink">
          <div class="link-header">
            <DialogTitle class="link-title">Adicionar link</DialogTitle>
            <button
              type="button"
              class="link-close-icon"
              title="Fechar"
              @click="closeLinkDialog"
            >
              <Icon name="lucide:x" :size="18" />
            </button>
          </div>

          <label class="link-field">
            <span class="link-label">URL</span>
            <input
              ref="linkInputRef"
              v-model="linkUrl"
              type="url"
              class="link-input"
              placeholder="https://"
              autocomplete="url"
              @keydown.enter.prevent="confirmLink"
            />
          </label>
          <p v-if="linkError" class="link-error">{{ linkError }}</p>

          <div class="link-actions">
            <button type="button" class="button-secondary link-btn" @click="closeLinkDialog">
              Cancelar
            </button>
            <button type="submit" class="button-primary link-btn" :disabled="!linkUrl.trim()">
              Aplicar
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>

    <template #fallback>
      <textarea
        class="markdown-fallback"
        :value="modelValue"
        :placeholder="placeholder"
        rows="4"
        readonly
      />
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { EditorContent, useEditor } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue';
import { getEmbedVideoUrl } from '~/utils/formatters';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
    maxLength?: number;
    mediaPaste?: (event: ClipboardEvent) => void;
    mediaDrop?: (event: DragEvent) => void;
    mediaDragOver?: (event: DragEvent) => void;
    mediaDragLeave?: (event: DragEvent) => void;
  }>(),
  {
    placeholder: 'O que você tem em mente?',
    maxLength: 5000,
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const dragOver = ref(false);
const lastValidMarkdown = ref(props.modelValue || '');
const linkDialogOpen = ref(false);
const linkUrl = ref('https://');
const linkError = ref('');
const linkInputRef = ref<HTMLInputElement | null>(null);

function getMarkdownFromEditor(ed: NonNullable<typeof editor.value>): string {
  return (ed.storage as { markdown?: { getMarkdown: () => string } }).markdown?.getMarkdown() ?? '';
}

function clipboardHasMedia(event: ClipboardEvent): boolean {
  const text = event.clipboardData?.getData('text')?.trim();
  if (text && getEmbedVideoUrl(text)) return true;
  const items = event.clipboardData?.items;
  if (!items) return false;
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) return true;
  }
  return false;
}

function dropHasMedia(event: DragEvent): boolean {
  const text = event.dataTransfer?.getData('text')?.trim();
  if (text && getEmbedVideoUrl(text)) return true;
  const files = event.dataTransfer?.files;
  if (files) {
    for (let i = 0; i < files.length; i++) {
      if (files[i].type.startsWith('image/')) return true;
    }
  }
  return false;
}

const editor = useEditor({
  content: props.modelValue || '',
  extensions: [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      horizontalRule: false,
    }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      defaultProtocol: 'https',
      protocols: ['http', 'https'],
      HTMLAttributes: {
        rel: 'noopener noreferrer',
        target: '_blank',
      },
    }),
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
    Markdown.configure({
      html: false,
      linkify: true,
      breaks: true,
      transformPastedText: true,
      transformCopiedText: true,
    }),
  ],
  editorProps: {
    attributes: {
      class: 'markdown-prose',
      'aria-label': 'Texto da postagem',
    },
    handlePaste(_view, event) {
      if (props.mediaPaste && clipboardHasMedia(event)) {
        props.mediaPaste(event);
        return true;
      }
      return false;
    },
    handleDrop(_view, event, _slice, moved) {
      if (moved) return false;
      if (props.mediaDrop && dropHasMedia(event)) {
        props.mediaDrop(event);
        return true;
      }
      return false;
    },
  },
  onUpdate: ({ editor: ed }) => {
    const markdown = getMarkdownFromEditor(ed);
    if (markdown.length > props.maxLength) {
      ed.commands.setContent(lastValidMarkdown.value || '', { emitUpdate: false });
      return;
    }
    lastValidMarkdown.value = markdown;
    emit('update:modelValue', markdown);
  },
});

const markdownLength = computed(() => (props.modelValue || '').length);
const overLimit = computed(() => markdownLength.value > props.maxLength);

watch(
  () => props.modelValue,
  (value) => {
    if (!editor.value) return;
    const current = getMarkdownFromEditor(editor.value);
    if ((value || '') === current) return;
    lastValidMarkdown.value = value || '';
    editor.value.commands.setContent(value || '', { emitUpdate: false });
  }
);

function toggleLink() {
  if (!editor.value) return;
  if (editor.value.isActive('link')) {
    editor.value.chain().focus().unsetLink().run();
    return;
  }
  const previous = editor.value.getAttributes('link').href as string | undefined;
  linkUrl.value = previous || 'https://';
  linkError.value = '';
  linkDialogOpen.value = true;
  nextTick(() => {
    linkInputRef.value?.focus();
    linkInputRef.value?.select();
  });
}

function closeLinkDialog() {
  linkDialogOpen.value = false;
  linkError.value = '';
  nextTick(() => editor.value?.chain().focus().run());
}

function confirmLink() {
  if (!editor.value) return;
  const trimmed = linkUrl.value.trim();
  if (!trimmed) {
    linkError.value = 'Informe a URL do link.';
    return;
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    linkError.value = 'Use um link começando com http:// ou https://';
    return;
  }
  editor.value.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run();
  linkDialogOpen.value = false;
  linkError.value = '';
}

function onDragOver(event: DragEvent) {
  dragOver.value = true;
  props.mediaDragOver?.(event);
}

function onDragLeave(event: DragEvent) {
  dragOver.value = false;
  props.mediaDragLeave?.(event);
}

function onDrop(event: DragEvent) {
  dragOver.value = false;
  props.mediaDrop?.(event);
}

onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<style scoped>
.markdown-editor {
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: #fff;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.markdown-editor:focus-within {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color) 20%, transparent);
}

.markdown-editor.drag-over {
  border-color: var(--primary-color);
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--primary-color) 30%, transparent),
    inset 0 0 10px color-mix(in srgb, var(--primary-color) 10%, transparent);
}

.markdown-editor.is-invalid {
  border-color: #c0392b;
}

.markdown-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.15rem;
  padding: 0.35rem 0.45rem;
  border-bottom: 1px solid var(--border-color);
  background: color-mix(in srgb, var(--primary-color-light) 55%, #fff);
}

.toolbar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.85rem;
  height: 1.85rem;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: #444;
  cursor: pointer;
}

.toolbar-btn:hover {
  background: #fff;
  border-color: var(--border-color);
}

.toolbar-btn.active {
  background: #fff;
  color: var(--primary-color);
  border-color: color-mix(in srgb, var(--primary-color) 35%, var(--border-color));
}

.toolbar-sep {
  width: 1px;
  height: 1.1rem;
  margin: 0 0.25rem;
  background: var(--border-color);
}

.markdown-editor-content {
  min-height: 100px;
}

.markdown-editor-content :deep(.tiptap),
.markdown-editor-content :deep(.ProseMirror) {
  min-height: 100px;
  padding: 0.75rem;
  outline: none;
  font-size: 1rem;
  line-height: 1.55;
  word-wrap: break-word;
}

.markdown-editor-content :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: #999;
  pointer-events: none;
  height: 0;
}

.markdown-editor-content :deep(h2) {
  font-size: 1.25rem;
  margin: 0.6rem 0 0.35rem;
}

.markdown-editor-content :deep(h3) {
  font-size: 1.1rem;
  margin: 0.5rem 0 0.3rem;
}

.markdown-editor-content :deep(ul),
.markdown-editor-content :deep(ol) {
  padding-left: 1.4rem;
  margin: 0.4rem 0;
}

.markdown-editor-content :deep(blockquote) {
  margin: 0.5rem 0;
  padding: 0.25rem 0.75rem;
  border-left: 3px solid var(--border-color);
  color: #555;
}

.markdown-editor-content :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.9em;
  background: #f3f4f6;
  padding: 0.1em 0.35em;
  border-radius: 3px;
}

.markdown-editor-content :deep(pre) {
  background: #f3f4f6;
  padding: 0.65rem 0.75rem;
  border-radius: 4px;
  overflow-x: auto;
  margin: 0.5rem 0;
}

.markdown-editor-content :deep(pre code) {
  background: transparent;
  padding: 0;
}

.markdown-editor-content :deep(a) {
  color: var(--primary-color);
  text-decoration: underline;
}

.markdown-footer {
  display: flex;
  justify-content: flex-end;
  padding: 0.25rem 0.55rem 0.4rem;
  border-top: 1px solid color-mix(in srgb, var(--border-color) 70%, transparent);
}

.char-count {
  font-size: 0.75rem;
  color: #888;
}

.char-count.over {
  color: #c0392b;
  font-weight: 600;
}

.markdown-fallback {
  width: 100%;
  min-height: 100px;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.5;
  resize: vertical;
}

.link-dialog-root {
  position: relative;
  z-index: 1100;
}

.link-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 32, 0.45);
}

.link-dialog-container {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.link-panel {
  width: min(100%, 24rem);
  padding: 1.25rem 1.35rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--card-bg);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
}

.link-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.link-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-color);
}

.link-close-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #666;
  cursor: pointer;
}

.link-close-icon:hover {
  background: var(--primary-color-light);
  color: var(--primary-color);
}

.link-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.link-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #555;
}

.link-input {
  width: 100%;
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font: inherit;
  font-size: 0.95rem;
  box-sizing: border-box;
}

.link-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color) 20%, transparent);
}

.link-error {
  margin: 0.45rem 0 0;
  font-size: 0.82rem;
  color: #b81727;
}

.link-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.1rem;
}

.link-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 2.25rem;
  padding: 0 0.9em;
  margin: 0;
  font-size: 0.85rem;
  font-weight: 500;
  line-height: 1;
  box-sizing: border-box;
}
</style>
