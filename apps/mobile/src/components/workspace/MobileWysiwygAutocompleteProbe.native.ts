import { useEffect, type MutableRefObject } from 'react'
import type { EditorBridge } from '@10play/tentap-editor'
import {
  nativeWysiwygAutocompleteLogLine,
  nativeWysiwygAutocompleteProbeSteps,
  nativeWysiwygAutocompleteProof,
} from '../../qa/nativeWysiwygAutocompleteProbe'
import type { NativeWysiwygInlineAutocomplete } from './MobileWysiwygWikilinkBridgeModel'

type TimerHandle = ReturnType<typeof setTimeout>
type AutocompleteProbeRefs = {
  acceptsEditorChangesRef: MutableRefObject<boolean>
  editorRef: MutableRefObject<EditorBridge | null>
}
type ProbeEditorBridge = EditorBridge & {
  setContent: (content: unknown) => void
  setSelection: (from: number, to: number) => void
}

export function useNativeWysiwygAutocompleteProbe({
  detectAutocomplete,
  enabled,
  refs,
}: {
  detectAutocomplete: (editor: EditorBridge) => Promise<NativeWysiwygInlineAutocomplete | null>
  enabled: boolean
  refs: AutocompleteProbeRefs
}) {
  useEffect(() => {
    if (!enabled) return undefined

    const timers = new Set<TimerHandle>()
    const schedule = (callback: () => void, delayMs: number) => {
      const timer = setTimeout(() => {
        timers.delete(timer)
        callback()
      }, delayMs)
      timers.add(timer)
    }
    const runProbe = (stepIndex = 0) => {
      if (!refs.acceptsEditorChangesRef.current) {
        schedule(() => runProbe(stepIndex), 250)
        return
      }

      const editor = refs.editorRef.current
      if (!isProbeEditorBridge(editor)) return
      const step = nativeWysiwygAutocompleteProbeSteps()[stepIndex]
      if (!step) return

      editor.setContent(step.content)
      editor.setSelection(step.selection.from, step.selection.to)
      schedule(() => {
        void detectAutocomplete(editor)
          .then((match) => {
            console.info(nativeWysiwygAutocompleteLogLine(nativeWysiwygAutocompleteProof(match, step.scenario)))
            schedule(() => runProbe(stepIndex + 1), 250)
          })
          .catch((error: unknown) => {
            console.warn('[mobile-editor] Failed to run native WYSIWYG autocomplete probe:', error)
          })
      }, 500)
    }

    schedule(runProbe, 500)
    return () => timers.forEach(clearTimeout)
  }, [detectAutocomplete, enabled, refs])
}

function isProbeEditorBridge(editor: EditorBridge | null): editor is ProbeEditorBridge {
  const candidate = editor as Partial<ProbeEditorBridge> | null
  return typeof candidate?.setContent === 'function' && typeof candidate.setSelection === 'function'
}
