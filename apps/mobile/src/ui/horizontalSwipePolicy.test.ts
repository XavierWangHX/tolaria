import { describe, expect, it } from 'vitest'

import { shouldStartHorizontalSwipe } from './horizontalSwipePolicy'

describe('shouldStartHorizontalSwipe', () => {
  it('claims an enabled edge reveal gesture at touch-down', () => {
    expect(shouldStartHorizontalSwipe({ captureOnStart: true, disabled: false })).toBe(true)
  })

  it('does not claim ordinary surface swipes or disabled gestures at touch-down', () => {
    expect(shouldStartHorizontalSwipe({ captureOnStart: false, disabled: false })).toBe(false)
    expect(shouldStartHorizontalSwipe({ captureOnStart: true, disabled: true })).toBe(false)
  })
})
