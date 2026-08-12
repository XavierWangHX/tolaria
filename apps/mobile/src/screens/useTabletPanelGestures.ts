import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated as NativeAnimated } from 'react-native'
import { desktopPanelParity } from '../ui/desktopParity'
import { useHorizontalSwipe } from '../ui/useHorizontalSwipe'
import {
  restoreTabletPanelVisibility,
  tabletLeftChromeDragOffset,
  tabletLeftChromeLayout,
  tabletPanelTransitionDurationMs,
  tabletPropertiesDragOffset,
} from './tabletWorkspacePanelTransitions'
import type { TabletPanel } from './tabletWorkspaceTypes'

export type TabletPanelGestureOptions = {
  compactTablet: boolean
  defaultPropertiesVisible: boolean
  defaultSidebarVisible: boolean
  exclusiveSidePanels: boolean
  propertiesReplaceSidebar: boolean
}

type PanelVisibilityDefaults = Pick<
  TabletPanelGestureOptions,
  'defaultPropertiesVisible' | 'defaultSidebarVisible'
>

function useTabletPanelVisibility(defaults: PanelVisibilityDefaults) {
  const [panelOverrides, setPanelOverrides] = useState<Partial<Record<TabletPanel, boolean>>>({})
  const setPanelVisibility = useCallback((panel: TabletPanel, visible: boolean) => {
    setPanelOverrides((current) => current[panel] === visible ? current : { ...current, [panel]: visible })
  }, [])

  return {
    hidePanel: useCallback((panel: TabletPanel) => setPanelVisibility(panel, false), [setPanelVisibility]),
    noteListVisible: panelOverrides.noteList ?? true,
    propertiesVisible: panelOverrides.properties ?? defaults.defaultPropertiesVisible,
    showPanel: useCallback((panel: TabletPanel) => setPanelVisibility(panel, true), [setPanelVisibility]),
    sidebarVisible: panelOverrides.sidebar ?? defaults.defaultSidebarVisible,
  }
}

function usePanelAnimation() {
  const [offset] = useState(() => new NativeAnimated.Value(0))
  const animate = useCallback((toValue: number, onDone?: () => void) => {
    offset.stopAnimation()
    NativeAnimated.timing(offset, {
      duration: tabletPanelTransitionDurationMs,
      toValue,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) onDone?.()
    })
  }, [offset])
  const reset = useCallback(() => {
    offset.stopAnimation()
    offset.setValue(0)
  }, [offset])

  useEffect(() => () => offset.stopAnimation(), [offset])

  return { animate, offset, reset }
}

type PanelVisibility = ReturnType<typeof useTabletPanelVisibility>

function usePropertiesPanelGestures({
  exclusiveSidePanels,
  propertiesReplaceSidebar,
  visibility,
}: {
  exclusiveSidePanels: boolean
  propertiesReplaceSidebar: boolean
  visibility: PanelVisibility
}) {
  const [previewVisible, setPreviewVisible] = useState(false)
  const restoreLeftPanels = useRef<{ noteList: boolean; sidebar: boolean } | null>(null)
  const motion = usePanelAnimation()
  const panelWidth = desktopPanelParity.inspectorWidth
  const actions = usePropertiesPanelActions({
    exclusiveSidePanels,
    propertiesReplaceSidebar,
    motion,
    panelWidth,
    restoreLeftPanelsRef: restoreLeftPanels,
    setPreviewVisible,
    visibility,
  })
  const drag = usePropertiesPanelDrag({
    motion,
    panelWidth,
    propertiesVisible: visibility.propertiesVisible,
    setPreviewVisible,
    showProperties: actions.showProperties,
  })

  return {
    dismissForLeftChrome: actions.dismissForLeftChrome,
    hideProperties: actions.hideProperties,
    motionStyle: drag.motionStyle,
    panelVisible: visibility.propertiesVisible || previewVisible,
    propertiesVisible: visibility.propertiesVisible,
    revealSwipe: drag.revealSwipe,
    showProperties: actions.showProperties,
    swipe: useHorizontalSwipe({ ...drag.swipeConfig, onSwipeRight: actions.hideProperties }),
  }
}

type PanelMotion = ReturnType<typeof usePanelAnimation>
type RestoreLeftPanels = { current: { noteList: boolean; sidebar: boolean } | null }

function usePropertiesPanelActions({
  exclusiveSidePanels,
  motion,
  panelWidth,
  propertiesReplaceSidebar,
  restoreLeftPanelsRef,
  setPreviewVisible,
  visibility,
}: {
  exclusiveSidePanels: boolean
  motion: PanelMotion
  panelWidth: number
  propertiesReplaceSidebar: boolean
  restoreLeftPanelsRef: RestoreLeftPanels
  setPreviewVisible: (visible: boolean) => void
  visibility: PanelVisibility
}) {
  const dismissForLeftChrome = useCallback(() => {
    restoreLeftPanelsRef.current = null
    visibility.hidePanel('properties')
    setPreviewVisible(false)
    motion.reset()
  }, [motion, restoreLeftPanelsRef, setPreviewVisible, visibility])
  const showProperties = useCallback((fromGesture = false) => {
    if (propertiesReplaceSidebar && !visibility.propertiesVisible) {
      restoreLeftPanelsRef.current = {
        noteList: visibility.noteListVisible,
        sidebar: visibility.sidebarVisible,
      }
      visibility.hidePanel('sidebar')
      if (exclusiveSidePanels) visibility.hidePanel('noteList')
    }
    setPreviewVisible(true)
    if (!fromGesture) motion.offset.setValue(panelWidth)
    motion.animate(0, () => {
      visibility.showPanel('properties')
      setPreviewVisible(false)
      motion.reset()
    })
  }, [exclusiveSidePanels, motion, panelWidth, propertiesReplaceSidebar, restoreLeftPanelsRef, setPreviewVisible, visibility])
  const hideProperties = useCallback(() => {
    motion.animate(panelWidth, () => {
      visibility.hidePanel('properties')
      setPreviewVisible(false)
      motion.reset()
      restoreTabletPanelVisibility(restoreLeftPanelsRef.current, visibility.showPanel)
      restoreLeftPanelsRef.current = null
    })
  }, [motion, panelWidth, restoreLeftPanelsRef, setPreviewVisible, visibility])

  return { dismissForLeftChrome, hideProperties, showProperties }
}

function usePropertiesPanelDrag({
  motion,
  panelWidth,
  propertiesVisible,
  setPreviewVisible,
  showProperties,
}: {
  motion: PanelMotion
  panelWidth: number
  propertiesVisible: boolean
  setPreviewVisible: (visible: boolean) => void
  showProperties: (fromGesture?: boolean) => void
}) {
  const handleProgress = useCallback(({ dx }: { dx: number }) => {
    if (!propertiesVisible && dx < 0) setPreviewVisible(true)
    motion.offset.stopAnimation()
    motion.offset.setValue(tabletPropertiesDragOffset({ dx, visible: propertiesVisible, width: panelWidth }))
  }, [motion.offset, panelWidth, propertiesVisible, setPreviewVisible])
  const handleEnd = useCallback((committed: boolean) => {
    if (committed) return
    if (propertiesVisible) {
      motion.animate(0)
      return
    }
    motion.animate(panelWidth, () => {
      setPreviewVisible(false)
      motion.reset()
    })
  }, [motion, panelWidth, propertiesVisible, setPreviewVisible])
  const motionStyle = useMemo(() => ({
    marginLeft: NativeAnimated.multiply(motion.offset, -1),
    transform: [{ translateX: motion.offset }],
  }), [motion.offset])
  const swipeConfig = {
    disabled: !propertiesVisible,
    onSwipeEnd: handleEnd,
    onSwipeProgress: handleProgress,
  }

  return {
    motionStyle,
    revealSwipe: useHorizontalSwipe({
      disabled: propertiesVisible,
      onSwipeEnd: handleEnd,
      onSwipeLeft: () => showProperties(true),
      onSwipeProgress: handleProgress,
    }),
    swipeConfig,
  }
}

function useLeftChromeGestures({
  compactTablet,
  dismissProperties,
  visibility,
}: {
  compactTablet: boolean
  dismissProperties: () => void
  visibility: PanelVisibility
}) {
  const [previewVisible, setPreviewVisible] = useState(false)
  const motion = usePanelAnimation()
  const layout = tabletLeftChromeLayout({
    compactTablet,
    noteListVisible: visibility.noteListVisible,
    previewVisible,
    sidebarVisible: visibility.sidebarVisible,
  })
  const actions = useLeftChromeActions({
    compactTablet,
    currentWidth: layout.currentWidth,
    dismissProperties,
    motion,
    revealWidth: layout.revealWidth,
    setPreviewVisible,
    visibility,
  })
  const drag = useLeftChromeDrag({
    actions,
    currentWidth: layout.currentWidth,
    motion,
    rendered: layout.rendered,
    revealWidth: layout.revealWidth,
    setPreviewVisible,
  })

  return {
    hideLeftChrome: actions.hideLeftChrome,
    leftChromeVisible: layout.rendered || previewVisible,
    motionStyle: drag.motionStyle,
    noteListVisible: visibility.noteListVisible,
    renderNoteList: layout.renderNoteList,
    renderSidebar: layout.renderSidebar,
    revealSwipe: drag.revealSwipe,
    showLeftChrome: actions.showLeftChrome,
    showSidebar: layout.showSidebar,
    swipe: drag.swipe,
  }
}

function useLeftChromeActions({
  compactTablet,
  currentWidth,
  dismissProperties,
  motion,
  revealWidth,
  setPreviewVisible,
  visibility,
}: {
  compactTablet: boolean
  currentWidth: number
  dismissProperties: () => void
  motion: PanelMotion
  revealWidth: number
  setPreviewVisible: (visible: boolean) => void
  visibility: PanelVisibility
}) {
  const showLeftChrome = useCallback((fromGesture = false) => {
    dismissProperties()
    setPreviewVisible(true)
    if (!fromGesture) motion.offset.setValue(-revealWidth)
    motion.animate(0, () => {
      if (!compactTablet) visibility.showPanel('sidebar')
      visibility.showPanel('noteList')
      setPreviewVisible(false)
      motion.reset()
    })
  }, [compactTablet, dismissProperties, motion, revealWidth, setPreviewVisible, visibility])
  const hideLeftChrome = useCallback(() => {
    if (currentWidth <= 0) return
    motion.animate(-currentWidth, () => {
      visibility.hidePanel('sidebar')
      visibility.hidePanel('noteList')
      setPreviewVisible(false)
      motion.reset()
    })
  }, [currentWidth, motion, setPreviewVisible, visibility])

  return { hideLeftChrome, showLeftChrome }
}

type LeftChromeActions = ReturnType<typeof useLeftChromeActions>

function useLeftChromeDrag({
  actions,
  currentWidth,
  motion,
  rendered,
  revealWidth,
  setPreviewVisible,
}: {
  actions: LeftChromeActions
  currentWidth: number
  motion: PanelMotion
  rendered: boolean
  revealWidth: number
  setPreviewVisible: (visible: boolean) => void
}) {
  const handleProgress = useCallback(({ dx }: { dx: number }) => {
    const width = rendered ? currentWidth : revealWidth
    if (width <= 0) return
    if (!rendered && dx > 0) setPreviewVisible(true)
    motion.offset.stopAnimation()
    motion.offset.setValue(tabletLeftChromeDragOffset({ dx, visible: rendered, width }))
  }, [currentWidth, motion.offset, rendered, revealWidth, setPreviewVisible])
  const handleEnd = useCallback((committed: boolean) => {
    if (committed) return
    if (rendered) {
      motion.animate(0)
      return
    }
    motion.animate(-revealWidth, () => {
      setPreviewVisible(false)
      motion.reset()
    })
  }, [motion, rendered, revealWidth, setPreviewVisible])
  const motionStyle = useMemo(() => ({
    marginRight: motion.offset,
    transform: [{ translateX: motion.offset }],
  }), [motion.offset])

  return {
    motionStyle,
    revealSwipe: useHorizontalSwipe({
      disabled: rendered,
      onSwipeEnd: handleEnd,
      onSwipeProgress: handleProgress,
      onSwipeRight: () => actions.showLeftChrome(true),
    }),
    swipe: useHorizontalSwipe({
      disabled: !rendered,
      onSwipeEnd: handleEnd,
      onSwipeLeft: actions.hideLeftChrome,
      onSwipeProgress: handleProgress,
    }),
  }
}

export function useTabletPanelGestures(options: TabletPanelGestureOptions) {
  const visibility = useTabletPanelVisibility(options)
  const properties = usePropertiesPanelGestures({
    exclusiveSidePanels: options.exclusiveSidePanels,
    propertiesReplaceSidebar: options.propertiesReplaceSidebar,
    visibility,
  })
  const leftChrome = useLeftChromeGestures({
    compactTablet: options.compactTablet,
    dismissProperties: properties.dismissForLeftChrome,
    visibility,
  })
  const { hidePanel, showPanel } = visibility

  return {
    showAllPanels: useCallback(() => {
      properties.dismissForLeftChrome()
      showPanel('sidebar')
      showPanel('noteList')
      if (!options.propertiesReplaceSidebar) showPanel('properties')
    }, [options.propertiesReplaceSidebar, properties, showPanel]),
    showEditorList: useCallback(() => {
      hidePanel('sidebar')
      showPanel('noteList')
      properties.dismissForLeftChrome()
    }, [hidePanel, properties, showPanel]),
    showEditorOnly: useCallback(() => {
      hidePanel('sidebar')
      hidePanel('noteList')
      properties.dismissForLeftChrome()
    }, [hidePanel, properties]),
    toggleSidebar: useCallback(() => {
      if (leftChrome.showSidebar) hidePanel('sidebar')
      else {
        properties.dismissForLeftChrome()
        showPanel('sidebar')
      }
    }, [hidePanel, leftChrome.showSidebar, properties, showPanel]),
    toggleSidebarAndNoteList: useCallback(() => {
      if (leftChrome.showSidebar || leftChrome.noteListVisible) leftChrome.hideLeftChrome()
      else leftChrome.showLeftChrome()
    }, [leftChrome]),
    hideLeftChrome: leftChrome.hideLeftChrome,
    showLeftChrome: useCallback(() => leftChrome.showLeftChrome(), [leftChrome]),
    leftChromeMotionStyle: leftChrome.motionStyle,
    leftChromeRevealSwipe: leftChrome.revealSwipe,
    leftChromeSwipe: leftChrome.swipe,
    leftChromeVisible: leftChrome.leftChromeVisible,
    noteListVisible: leftChrome.noteListVisible,
    propertiesMotionStyle: properties.motionStyle,
    hideProperties: properties.hideProperties,
    propertiesPanelVisible: properties.panelVisible,
    showProperties: useCallback(() => properties.showProperties(), [properties]),
    toggleProperties: useCallback(() => {
      if (properties.propertiesVisible) properties.hideProperties()
      else properties.showProperties()
    }, [properties]),
    propertiesRevealSwipe: properties.revealSwipe,
    propertiesSwipe: properties.swipe,
    propertiesVisible: properties.propertiesVisible,
    renderNoteList: leftChrome.renderNoteList,
    renderSidebar: leftChrome.renderSidebar,
    showSidebar: leftChrome.showSidebar,
  }
}
