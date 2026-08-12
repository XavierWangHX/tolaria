import { useMemo } from 'react'
import { PanResponder, type PanResponderGestureState } from 'react-native'

import {
  horizontalSwipeCapturesMovement,
  horizontalSwipeCommitted,
  shouldStartHorizontalSwipe,
  type HorizontalSwipeOffset,
} from './horizontalSwipePolicy'

type HorizontalSwipeProgress = {
  dx: number
  dy: number
}

type HorizontalSwipeOptions = {
  captureOnStart?: boolean
  disabled?: boolean
  onSwipeEnd?: (committed: boolean) => void
  onSwipeLeft?: () => void
  onSwipeProgress?: (progress: HorizontalSwipeProgress) => void
  onSwipeRight?: () => void
}

type NormalizedHorizontalSwipeOptions = HorizontalSwipeOptions & {
  captureOnStart: boolean
  disabled: boolean
}

export function useHorizontalSwipe({
  captureOnStart = false,
  disabled = false,
  onSwipeEnd,
  onSwipeLeft,
  onSwipeProgress,
  onSwipeRight,
}: HorizontalSwipeOptions) {
  const options = useMemo(
    () => ({ captureOnStart, disabled, onSwipeEnd, onSwipeLeft, onSwipeProgress, onSwipeRight }),
    [captureOnStart, disabled, onSwipeEnd, onSwipeLeft, onSwipeProgress, onSwipeRight],
  )

  return useMemo(
    () => createHorizontalSwipeHandlers(options),
    [options],
  )
}

function createHorizontalSwipeHandlers(options: NormalizedHorizontalSwipeOptions) {
  return PanResponder.create({
    onStartShouldSetPanResponder: () => shouldStartHorizontalSwipe(options),
    onMoveShouldSetPanResponder: (_, gesture) => shouldCapture(gesture, options.disabled),
    onMoveShouldSetPanResponderCapture: (_, gesture) => shouldCapture(gesture, options.disabled),
    onPanResponderRelease: (_, gesture) => releaseHorizontalSwipe(gesture, options),
    onPanResponderTerminationRequest: () => true,
    ...moveResponder(options.onSwipeProgress),
    ...terminateResponder(options.onSwipeEnd),
  }).panHandlers
}

function moveResponder(onSwipeProgress: HorizontalSwipeOptions['onSwipeProgress']) {
  return onSwipeProgress
    ? {
      onPanResponderMove: (_: unknown, gesture: PanResponderGestureState) => {
        onSwipeProgress({ dx: gesture.dx, dy: gesture.dy })
      },
    }
    : {}
}

function terminateResponder(onSwipeEnd: HorizontalSwipeOptions['onSwipeEnd']) {
  return onSwipeEnd
    ? {
      onPanResponderTerminate: () => {
        onSwipeEnd(false)
      },
    }
    : {}
}

function releaseHorizontalSwipe(
  gesture: HorizontalSwipeOffset,
  options: NormalizedHorizontalSwipeOptions,
  allowCommit = true,
) {
  const committed = allowCommit && horizontalSwipeCommitted(gesture)
  if (committed) commitHorizontalSwipe(gesture, options)
  options.onSwipeEnd?.(committed)
}

function commitHorizontalSwipe(
  gesture: HorizontalSwipeOffset,
  options: Pick<HorizontalSwipeOptions, 'onSwipeLeft' | 'onSwipeRight'>,
) {
  const action = gesture.dx < 0 ? options.onSwipeLeft : options.onSwipeRight
  action?.()
}

function shouldCapture(gesture: PanResponderGestureState, disabled: boolean) {
  if (disabled) return false
  return horizontalSwipeCapturesMovement(gesture)
}
