import { FileText } from 'phosphor-react-native'
import { View } from 'react-native'
import { MobileTypeIcon } from '../components/workspace/MobileWorkspaceIcons'
import { Text } from '../components/ui/text'
import { mobileText } from '../i18n/mobileText'
import { MobilePanel, MobileToolbar, MobileToolbarTitle } from '../ui/MobilePanel'
import { desktopToolbarActionParity } from '../ui/desktopParity'
import { mobileColors } from '../ui/tokens'
import type { MobileNote, MobileTypeDefinitions } from '../workspace/mobileWorkspaceModel'
import { panelStyles } from './TabletEditorPanelStyles'

export function MobileFilePreviewFallback({
  note,
  typeDefinitions,
}: {
  note: MobileNote
  typeDefinitions?: MobileTypeDefinitions
}) {
  return (
    <View style={panelStyles.filePreviewFallback} testID="file-preview-fallback">
      <MobileTypeIcon
        fileKind={note.fileKind}
        size={32}
        tone={note.typeTone}
        type={note.type}
        typeDefinitions={typeDefinitions}
      />
      <Text style={panelStyles.filePreviewTitle}>{mobileText('filePreview.previewUnavailable')}</Text>
      <Text style={panelStyles.filePreviewDescription}>{mobileText('filePreview.previewUnavailableDescription')}</Text>
    </View>
  )
}

export function EmptyEditorPanel() {
  return (
    <MobilePanel style={panelStyles.panel} testID="editor-panel">
      <MobileToolbar testID="editor-toolbar">
        <FileText color={mobileColors.textMuted} size={desktopToolbarActionParity.iconSize} />
        <MobileToolbarTitle testID="editor-toolbar-title" title={mobileText('inspector.empty.noNoteSelected')} />
      </MobileToolbar>
      <View style={panelStyles.emptyState}>
        <Text style={panelStyles.emptyTitle}>{mobileText('editor.empty.selectNote')}</Text>
      </View>
    </MobilePanel>
  )
}
