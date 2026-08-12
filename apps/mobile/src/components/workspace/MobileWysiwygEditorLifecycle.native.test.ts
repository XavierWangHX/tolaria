import { afterEach, describe, expect, it, vi } from 'vitest'
import { scheduleInitialContentRetries } from './MobileWysiwygEditorLifecycle.native'

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
})
