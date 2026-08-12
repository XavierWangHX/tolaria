type HorizontalSwipeStartPolicy = {
  captureOnStart: boolean
  disabled: boolean
}

export function shouldStartHorizontalSwipe({
  captureOnStart,
  disabled,
}: HorizontalSwipeStartPolicy) {
  return captureOnStart && !disabled
}
