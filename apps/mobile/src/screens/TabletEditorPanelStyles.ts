import { StyleSheet } from 'react-native'
import { desktopEditorParity } from '../ui/desktopParity'
import { mobileColors, mobileSpace, mobileType } from '../ui/tokens'

export const panelStyles = StyleSheet.create({
  content: {
    alignSelf: 'center',
    maxWidth: desktopEditorParity.contentMaxWidth,
    paddingHorizontal: desktopEditorParity.contentPaddingHorizontal,
    paddingVertical: desktopEditorParity.contentPaddingVertical,
    width: '100%',
  },
  contentCompact: {
    paddingHorizontal: mobileSpace.xl,
  },
  contentWide: {
    alignSelf: 'stretch',
    maxWidth: '100%',
    paddingHorizontal: 56,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: mobileSpace.xxl,
  },
  emptyTitle: {
    color: mobileColors.textMuted,
    fontSize: mobileType.title,
    fontWeight: '600',
    textAlign: 'center',
  },
  editorHost: {
    flex: 1,
  },
  filePreviewContent: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    padding: mobileSpace.xxl,
  },
  filePreviewDescription: {
    maxWidth: 360,
    color: mobileColors.textMuted,
    fontSize: mobileType.body,
    lineHeight: 22,
    textAlign: 'center',
  },
  filePreviewFallback: {
    alignItems: 'center',
    gap: mobileSpace.md,
  },
  filePreviewTitle: {
    color: mobileColors.text,
    fontSize: mobileType.title,
    fontWeight: '600',
  },
  panel: {
    flex: 1,
  },
})
