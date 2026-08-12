import { StyleSheet } from 'react-native'
import { desktopPanelParity, desktopPropertyParity, desktopRelationshipParity } from '../../ui/desktopParity'
import { mobileColors, mobileRadius, mobileSpace, mobileType } from '../../ui/tokens'
import {
  mobileInspectorPlaceholderRowLayoutContract,
  mobileInspectorReferenceRowLayoutContract,
} from './MobilePropertiesPanelModel'

export const panelStyles = StyleSheet.create({
  content: { padding: desktopPropertyParity.panelPadding },
  emptyContent: { flexGrow: 1 },
  panel: {
    alignSelf: 'stretch',
    borderLeftWidth: StyleSheet.hairlineWidth,
    height: '100%',
    width: desktopPanelParity.inspectorWidth,
  },
  panelCompact: { width: 280 },
  panelFullWidth: { width: '100%' },
})

export const emptyStateStyles = StyleSheet.create({
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: mobileSpace.xxl,
  },
  emptyText: {
    marginTop: mobileSpace.sm,
    color: mobileColors.textMuted,
    fontSize: mobileType.body,
    textAlign: 'center',
  },
  emptyTitle: {
    color: mobileColors.text,
    fontSize: mobileType.title,
    fontWeight: '600',
    textAlign: 'center',
  },
})

export const relationshipStyles = StyleSheet.create({
  remove: {
    minHeight: desktopRelationshipParity.removeIconSize,
    minWidth: desktopRelationshipParity.removeIconSize,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: mobileRadius.pill,
  },
  row: {
    minHeight: desktopPropertyParity.rowMinHeight,
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: desktopRelationshipParity.rowRadius,
    paddingHorizontal: desktopRelationshipParity.rowPaddingHorizontal,
    paddingVertical: desktopRelationshipParity.rowPaddingVertical,
    width: '100%',
  },
  openTarget: {
    minWidth: 0,
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    gap: desktopRelationshipParity.rowGap,
  },
  text: {
    flex: 1,
    fontSize: desktopRelationshipParity.textFontSize,
    fontWeight: desktopRelationshipParity.textFontWeight,
  },
  values: { alignItems: 'stretch', gap: mobileSpace.xs },
})

export const referenceStyles = StyleSheet.create({
  container: {
    marginTop: mobileSpace.sm,
    borderTopColor: mobileColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    minHeight: mobileInspectorReferenceRowLayoutContract.minHeight,
    minWidth: 0,
    alignItems: 'center',
    flexDirection: 'row',
    gap: desktopRelationshipParity.rowGap,
    borderRadius: mobileInspectorReferenceRowLayoutContract.radius,
    paddingHorizontal: mobileInspectorReferenceRowLayoutContract.paddingHorizontal,
    paddingVertical: mobileInspectorReferenceRowLayoutContract.paddingVertical,
    width: '100%',
  },
  text: {
    minWidth: 0,
    flex: 1,
    fontSize: mobileInspectorReferenceRowLayoutContract.textFontSize,
    fontWeight: mobileInspectorReferenceRowLayoutContract.textFontWeight,
  },
})

const propertySectionStyles = StyleSheet.create({
  sectionLabel: {
    color: mobileColors.textMuted,
    fontSize: desktopPropertyParity.labelTextSize,
  },
  sectionRow: {
    minHeight: desktopPropertyParity.rowMinHeight,
    borderBottomColor: mobileColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: mobileSpace.sm,
    paddingHorizontal: desktopPropertyParity.rowPaddingHorizontal,
    paddingVertical: mobileSpace.sm,
  },
  sectionValue: { alignSelf: 'stretch', minWidth: 0 },
  placeholderButton: {
    minHeight: desktopPropertyParity.rowMinHeight,
    alignItems: 'center',
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: mobileSpace.xs,
    borderRadius: desktopPropertyParity.actionRowRadius,
    paddingHorizontal: desktopPropertyParity.rowPaddingHorizontal,
    width: '100%',
  },
  placeholderRelationshipButton: {
    minHeight: desktopPropertyParity.rowMinHeight,
    alignItems: 'center',
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: mobileSpace.xs,
    borderRadius: desktopRelationshipParity.rowRadius,
    paddingHorizontal: 0,
    width: '100%',
  },
  placeholderButtonText: {
    minWidth: 0,
    flex: 1,
    color: mobileColors.textFaint,
    fontSize: desktopPropertyParity.labelTextSize,
  },
  placeholderLabel: {
    color: mobileColors.textFaint,
    fontSize: desktopPropertyParity.labelTextSize,
  },
  placeholderAddValue: {
    minHeight: mobileInspectorPlaceholderRowLayoutContract.minHeight,
    minWidth: 0,
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: mobileSpace.xs,
    justifyContent: 'flex-end',
    borderRadius: 4,
    paddingHorizontal: mobileSpace.xs,
  },
  placeholderValue: {
    minWidth: 0,
    flex: 1,
    color: mobileColors.textFaint,
    fontSize: mobileType.caption,
    textAlign: 'right',
  },
})

const propertyEditableStyles = StyleSheet.create({
  editableText: {
    minWidth: 0,
    flexShrink: 1,
    color: mobileColors.text,
    fontSize: mobileType.caption,
  },
  emptyEditableText: {
    color: mobileColors.textFaint,
    fontSize: mobileType.caption,
  },
  emptyEditableValue: {
    minHeight: desktopPropertyParity.rowMinHeight,
    minWidth: 0,
    alignItems: 'center',
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderRadius: 4,
    paddingHorizontal: mobileSpace.xs,
    paddingVertical: 2,
  },
  editableValue: {
    maxHeight: 96,
    minWidth: 0,
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.xs,
    justifyContent: 'flex-end',
    borderRadius: 4,
    paddingHorizontal: mobileSpace.xs,
    paddingVertical: 2,
    width: '100%',
  },
  editableValuePressed: { backgroundColor: mobileColors.graySoft },
  tagWrap: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mobileSpace.xs,
  },
  workspaceBadge: {
    overflow: 'hidden',
    borderRadius: mobileRadius.pill,
    backgroundColor: mobileColors.graySoft,
    color: mobileColors.textMuted,
    fontSize: mobileType.micro,
    fontWeight: '400',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
})

export const propertyStyles = {
  ...propertySectionStyles,
  ...propertyEditableStyles,
}

export const typeStyles = StyleSheet.create({
  value: {
    minWidth: 0,
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mobileSpace.xs,
    justifyContent: 'flex-end',
  },
  missingButton: {
    minHeight: desktopPropertyParity.chipHeight,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
    borderRadius: desktopPropertyParity.chipRadius,
    backgroundColor: mobileColors.orangeSoft,
    paddingHorizontal: desktopPropertyParity.chipPaddingHorizontal,
  },
  missingText: {
    color: mobileColors.orange,
    fontSize: desktopPropertyParity.chipTextSize,
    fontWeight: '500',
    lineHeight: desktopPropertyParity.chipHeight,
  },
})

export const propertyDisplayStyles = StyleSheet.create({
  colorSwatch: {
    height: 12,
    width: 12,
    borderColor: mobileColors.borderStrong,
    borderRadius: mobileRadius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  colorValue: {
    minWidth: 0,
    alignItems: 'center',
    flexShrink: 1,
    flexDirection: 'row',
    gap: mobileSpace.xs,
    justifyContent: 'flex-end',
  },
  listValue: {
    minWidth: 0,
    alignItems: 'center',
    flexShrink: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mobileSpace.xs,
    justifyContent: 'flex-end',
  },
  numberText: { fontVariant: ['tabular-nums'] },
  urlText: { color: mobileColors.primary },
})

export const actionStyles = StyleSheet.create({
  iconSlot: {
    width: desktopPropertyParity.labelIconSlot,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    minWidth: 0,
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: mobileSpace.xs,
    marginRight: mobileSpace.sm,
    zIndex: 1,
  },
  row: {
    height: desktopPropertyParity.rowMinHeight,
    minHeight: desktopPropertyParity.rowMinHeight,
    flexShrink: 0,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 0,
    alignSelf: 'stretch',
    borderRadius: desktopPropertyParity.actionRowRadius,
    paddingHorizontal: desktopPropertyParity.rowPaddingHorizontal,
    position: 'relative',
  },
  text: {
    minWidth: 0,
    flex: 1,
    color: mobileColors.textFaint,
    fontSize: desktopPropertyParity.labelTextSize,
  },
  value: { flex: 1, zIndex: 1 },
})
