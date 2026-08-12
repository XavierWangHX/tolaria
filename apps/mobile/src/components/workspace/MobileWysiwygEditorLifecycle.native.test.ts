import { afterEach, describe, expect, it, vi } from 'vitest'
import type { EditorBridge } from '@10play/tentap-editor'
import {
  activateNativeEditorChanges,
  type NativeTentapEditorRefs,
  scheduleInitialContentRetries,
  setNativeEditorContentSilently,
} from './MobileWysiwygEditorLifecycle.native'

describe('native WYSIWYG initial content sync', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('retries until a cold native bridge can receive the initial document', () => {
    vi.useFakeTimers()
    let bridgeReady = false
    let renderedContent = ''

    scheduleInitialContentRetries({
      initialContent: '<h1>Cold start note</h1>',
      setContent: (content) => {
        if (bridgeReady) renderedContent = content
      },
      shouldRetry: () => true,
    })
    globalThis.setTimeout(() => {
      bridgeReady = true
    }, 900)

    vi.runAllTimers()

    expect(renderedContent).toBe('<h1>Cold start note</h1>')
  })

  it('never falls back to an update-emitting content setter during hydration', () => {
    const setContent = vi.fn()
    const setContentSilently = vi.fn()

    expect(setNativeEditorContentSilently({ setContent } as unknown as EditorBridge, '<p>Legacy bridge</p>')).toBe(false)
    expect(setContent).not.toHaveBeenCalled()
    expect(setNativeEditorContentSilently({ setContentSilently } as unknown as EditorBridge, '<p>Silent bridge</p>')).toBe(true)
    expect(setContentSilently).toHaveBeenCalledWith('<p>Silent bridge</p>')
  })

  it('accepts editor changes only after explicit user interaction', () => {
    const acceptsEditorChangesRef = { current: false }

    activateNativeEditorChanges({ acceptsEditorChangesRef } as NativeTentapEditorRefs)

    expect(acceptsEditorChangesRef.current).toBe(true)
  })
})
