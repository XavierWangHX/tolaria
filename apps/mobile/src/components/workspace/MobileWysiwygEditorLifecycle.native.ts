import type { EditorBridge } from '@10play/tentap-editor'
import { type MutableRefObject, useCallback, useEffect, useRef } from 'react'
import { mobileNoteEditableContent } from '../../workspace/mobileDocumentContent'
import type { MobileEditorBlock, MobileNote } from '../../workspace/mobileWorkspaceModel'
import { mobileTentapEditorCss } from './MobileWysiwygMarkdownEditorCss'

type TimerHandle = ReturnType<typeof setTimeout>

export type NativeTentapEditorRefs = {
  acceptsEditorChangesRef: MutableRefObject<boolean>
  contentRef: MutableRefObject<string>
  editorReadyTimerRef: MutableRefObject<TimerHandle | null>
  editorRef: MutableRefObject<EditorBridge | null>
  firstEditorSerializationRef: MutableRefObject<boolean>
  hasAcceptedEditorChangeRef: MutableRefObject<boolean>
  initialContentRetryTimerRefs: MutableRefObject<TimerHandle[]>
  inlineAutocompleteTimerRef: MutableRefObject<TimerHandle | null>
  markdownBlockProofReadyRef: MutableRefObject<boolean>
  markdownBlockRenderProofRef: MutableRefObject<boolean>
  saveTimerRef: MutableRefObject<TimerHandle | null>
  tableCommandMutationProofReadyRef: MutableRefObject<boolean>
}

type ContentSettableEditorBridge = EditorBridge & {
  setContent: (content: unknown) => void
}

type CssInjectableEditorBridge = EditorBridge & {
  injectCSS: (css: string, tag?: string) => void
}

const nativeInitialContentRetryDelaysMs = [80, 240, 520] as const

export function useEditorCssInjection({
  compact,
  initialContent,
  noteWidth,
  refs,
}: {
  compact: boolean
  initialContent: string
  noteWidth: MobileNote['noteWidth']
  refs: NativeTentapEditorRefs
}) {
  const { editorRef } = refs

  return useCallback(() => {
    if (isCssInjectableEditorBridge(editorRef.current)) {
      editorRef.current.injectCSS(mobileTentapEditorCss(compact, noteWidth), 'tolaria-editor')
    }
    syncNativeInitialEditorContent({ initialContent, readyDelayMs: 750, refs })
  }, [compact, editorRef, initialContent, noteWidth, refs])
}

export function useEditorBridgeRef(editorRef: MutableRefObject<EditorBridge | null>, editor: EditorBridge) {
  useEffect(() => {
    editorRef.current = editor
  }, [editor, editorRef])
}

export function useEditableContentRef({
  blocks,
  bullets,
  note,
  refs,
}: {
  blocks: MobileEditorBlock[]
  bullets: string[]
  note: MobileNote
  refs: NativeTentapEditorRefs
}) {
  const { contentRef } = refs

  useEffect(() => {
    contentRef.current = mobileNoteEditableContent({
      ...note,
      editorBlocks: note.editorBlocks ?? blocks,
      editorBullets: bullets,
    })
  }, [blocks, bullets, contentRef, note])
}

export function useResetEditorChangeGate({ noteId, refs }: { noteId: string; refs: NativeTentapEditorRefs }) {
  useEffect(() => resetEditorChangeGate(noteId, refs), [noteId, refs])
}

export function useSyncInitialEditorContent({
  initialContent,
  noteId,
  refs,
}: {
  initialContent: string
  noteId: string
  refs: NativeTentapEditorRefs
}) {
  const syncedContentRef = useRef<{ content: string; noteId: string } | null>(null)

  useEffect(() => {
    syncInitialEditorContent({
      initialContent,
      noteId,
      refs,
      syncedContentRef,
    })
  }, [initialContent, noteId, refs])
}

export function useFlushOnUnmount(refs: NativeTentapEditorRefs, flushEditorDocument: () => void) {
  useEffect(
    () => () => {
      clearNativeInitialEditorContentTimers(refs)
      clearTimer(refs.inlineAutocompleteTimerRef.current)
      clearTimer(refs.saveTimerRef.current)
      if (refs.hasAcceptedEditorChangeRef.current) flushEditorDocument()
    },
    [flushEditorDocument, refs],
  )
}

export function isContentSettableEditorBridge(editor: EditorBridge | null): editor is ContentSettableEditorBridge {
  return typeof (editor as Partial<ContentSettableEditorBridge> | null)?.setContent === 'function'
}

function syncNativeInitialEditorContent({
  initialContent,
  readyDelayMs,
  refs,
}: {
  initialContent: string
  readyDelayMs: number
  refs: NativeTentapEditorRefs
}) {
  if (refs.hasAcceptedEditorChangeRef.current) return

  clearNativeInitialEditorContentTimers(refs)
  refs.acceptsEditorChangesRef.current = false
  setNativeInitialEditorContent(initialContent, refs)
  scheduleInitialContentRetries(initialContent, refs)
  refs.editorReadyTimerRef.current = setTimeout(() => finishInitialContentSync(refs), readyDelayMs)
}

function scheduleInitialContentRetries(initialContent: string, refs: NativeTentapEditorRefs) {
  for (const delayMs of nativeInitialContentRetryDelaysMs) {
    const timer = setTimeout(() => {
      if (!refs.hasAcceptedEditorChangeRef.current) setNativeInitialEditorContent(initialContent, refs)
    }, delayMs)
    refs.initialContentRetryTimerRefs.current.push(timer)
  }
}

function finishInitialContentSync(refs: NativeTentapEditorRefs) {
  clearNativeInitialContentRetryTimers(refs)
  refs.acceptsEditorChangesRef.current = true
}

function setNativeInitialEditorContent(initialContent: string, refs: NativeTentapEditorRefs) {
  const editor = refs.editorRef.current
  if (isContentSettableEditorBridge(editor)) editor.setContent(initialContent)
}

function clearNativeInitialEditorContentTimers(refs: NativeTentapEditorRefs) {
  clearTimer(refs.editorReadyTimerRef.current)
  refs.editorReadyTimerRef.current = null
  clearNativeInitialContentRetryTimers(refs)
}

function clearNativeInitialContentRetryTimers(refs: NativeTentapEditorRefs) {
  for (const timer of refs.initialContentRetryTimerRefs.current) clearTimeout(timer)
  refs.initialContentRetryTimerRefs.current = []
}

function clearTimer(timer: TimerHandle | null) {
  if (timer) clearTimeout(timer)
}

function resetEditorChangeGate(_noteId: string, refs: NativeTentapEditorRefs) {
  refs.acceptsEditorChangesRef.current = false
  refs.firstEditorSerializationRef.current = true
  refs.hasAcceptedEditorChangeRef.current = false
  refs.markdownBlockProofReadyRef.current = false
  refs.markdownBlockRenderProofRef.current = false
  refs.tableCommandMutationProofReadyRef.current = false
}

function syncInitialEditorContent({
  initialContent,
  noteId,
  refs,
  syncedContentRef,
}: {
  initialContent: string
  noteId: string
  refs: NativeTentapEditorRefs
  syncedContentRef: MutableRefObject<{
    content: string
    noteId: string
  } | null>
}) {
  if (!shouldSyncInitialContent(initialContent, noteId, refs, syncedContentRef.current)) return

  clearTimer(refs.saveTimerRef.current)
  refs.firstEditorSerializationRef.current = true
  syncNativeInitialEditorContent({ initialContent, readyDelayMs: 750, refs })
  syncedContentRef.current = { content: initialContent, noteId }
}

function shouldSyncInitialContent(
  initialContent: string,
  noteId: string,
  refs: NativeTentapEditorRefs,
  syncedContent: { content: string; noteId: string } | null,
) {
  if (!isContentSettableEditorBridge(refs.editorRef.current)) return false
  if (syncedContent?.noteId === noteId && syncedContent.content === initialContent) return false
  return !refs.hasAcceptedEditorChangeRef.current
}

function isCssInjectableEditorBridge(editor: EditorBridge | null): editor is CssInjectableEditorBridge {
  return typeof (editor as Partial<CssInjectableEditorBridge> | null)?.injectCSS === 'function'
}
