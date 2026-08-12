import { useEffect, useMemo, useState } from 'react'
import { FilePlus } from 'phosphor-react-native'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native'
import { Text } from '../ui/text'
import { mobileText } from '../../i18n/mobileText'
import { MobileChip } from '../../ui/MobileChip'
import { MobileListRow } from '../../ui/MobileListRow'
import { MobileTextInput } from '../../ui/MobileTextInput'
import { desktopToolbarActionParity } from '../../ui/desktopParity'
import { mobileColors, mobileSpace, mobileType } from '../../ui/tokens'
import {
  mobileQuickOpenMoveIndex,
  mobileQuickOpenResults,
  mobileQuickOpenSelectedNote,
} from '../../workspace/mobileQuickOpen'
import type { MobileNote, MobileTypeDefinitions } from '../../workspace/mobileWorkspaceModel'
import { MobileTypeIcon } from './MobileWorkspaceIcons'
import { chipTone, noteTypeSoftColor, statusTone, tagTone } from './mobileWorkspaceTone'

type MobileQuickOpenSheetProps = {
  notes: MobileNote[]
  onClearWorkspaceSearch: () => void
  onClose: () => void
  onCreateNote: (titleOverride?: string) => void
  onSelectNote: (noteId: string) => void
  typeDefinitions?: MobileTypeDefinitions
}

export function MobileQuickOpenSheet(props: MobileQuickOpenSheetProps) {
  const [query, setQuery] = useState('')
  const results = useMemo(() => mobileQuickOpenResults(props.notes, query), [props.notes, query])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const createTitle = query.trim()
  const canCreate = createTitle.length > 0 && results.length === 0

  useEffect(() => setSelectedIndex(0), [query, results.length]) // eslint-disable-line react-hooks/set-state-in-effect -- reset when quick-open results change

  const close = () => {
    props.onClearWorkspaceSearch()
    props.onClose()
  }
  const selectNote = (note: MobileNote) => {
    props.onSelectNote(note.id)
    close()
  }
  const createNote = () => {
    if (!canCreate) return
    props.onCreateNote(createTitle)
    close()
  }
  const submit = () => {
    const note = mobileQuickOpenSelectedNote(results, selectedIndex)
    if (note) selectNote(note)
    else createNote()
  }
  const handleKeyPress = (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (event.nativeEvent.key === 'ArrowDown') setSelectedIndex((index) => mobileQuickOpenMoveIndex(index, results.length, 'next'))
    else if (event.nativeEvent.key === 'ArrowUp') setSelectedIndex((index) => mobileQuickOpenMoveIndex(index, results.length, 'previous'))
    else if (event.nativeEvent.key === 'Enter') submit()
    else if (event.nativeEvent.key === 'Escape') close()
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" style={styles.scrollArea}>
      <MobileTextInput autoCorrect={false} autoFocus label={mobileText('noteList.searchAction')} placeholder={mobileText('noteList.searchPlaceholder')} testID="workspace-search-input" value={query} onChangeText={setQuery} onKeyPress={handleKeyPress} onSubmitEditing={submit} />
      <QuickOpenResults canCreate={canCreate} createTitle={createTitle} notes={results} selectedIndex={selectedIndex} typeDefinitions={props.typeDefinitions} onCreate={createNote} onSelect={selectNote} />
    </ScrollView>
  )
}

function QuickOpenResults({ canCreate, createTitle, notes, onCreate, onSelect, selectedIndex, typeDefinitions }: {
  canCreate: boolean
  createTitle: string
  notes: MobileNote[]
  onCreate: () => void
  onSelect: (note: MobileNote) => void
  selectedIndex: number
  typeDefinitions?: MobileTypeDefinitions
}) {
  return (
    <ScrollView contentContainerStyle={styles.resultList} keyboardShouldPersistTaps="handled" testID="workspace-search-results">
      {notes.length === 0 ? <QuickOpenEmptyState canCreate={canCreate} createTitle={createTitle} onCreate={onCreate} /> : null}
      {notes.map((note, index) => (
        <MobileListRow key={note.id} chips={<QuickOpenNoteChips note={note} />} selected={index === selectedIndex} selectedBackgroundColor={noteTypeSoftColor(note.typeTone)} subtitle={note.snippet} testID={`workspace-search-result-${note.id}`} title={note.title} trailing={<MobileTypeIcon size={16} tone={note.typeTone} type={note.type} typeDefinitions={typeDefinitions} />} onPress={() => onSelect(note)} />
      ))}
    </ScrollView>
  )
}

function QuickOpenEmptyState({ canCreate, createTitle, onCreate }: { canCreate: boolean; createTitle: string; onCreate: () => void }) {
  return (
    <>
      <View style={styles.emptyState}><Text style={styles.emptyText}>{mobileText('noteList.empty.noMatching')}</Text></View>
      {canCreate ? <QuickOpenCreateAction title={createTitle} onPress={onCreate} /> : null}
    </>
  )
}

function QuickOpenCreateAction({ onPress, title }: { onPress: () => void; title: string }) {
  const label = mobileText('noteList.quickOpenCreate').replace('{title}', title)
  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" style={({ pressed }) => [styles.actionRow, pressed ? styles.actionRowPressed : null]} testID="workspace-search-create-note" onPress={onPress}>
      <FilePlus color={mobileColors.textMuted} size={desktopToolbarActionParity.iconSize} />
      <Text numberOfLines={1} style={styles.actionText}>{label}</Text>
    </Pressable>
  )
}

function QuickOpenNoteChips({ note }: { note: MobileNote }) {
  return (
    <View style={styles.chipRow}>
      <MobileChip density="list" label={note.type} tone={chipTone(note.typeTone)} />
      {note.status ? <MobileChip density="list" label={note.status} tone={statusTone(note.status)} /> : null}
      {note.tags.slice(0, 1).map((tag) => <MobileChip density="list" key={tag} label={tag} tone={tagTone(tag)} />)}
    </View>
  )
}

const styles = StyleSheet.create({
  actionRow: { alignItems: 'center', alignSelf: 'stretch', flexDirection: 'row', gap: mobileSpace.sm, minWidth: 0, paddingHorizontal: mobileSpace.sm, paddingVertical: mobileSpace.sm, width: '100%' },
  actionRowPressed: { backgroundColor: mobileColors.control },
  actionText: { color: mobileColors.text, flex: 1, flexShrink: 1, fontSize: mobileType.body, minWidth: 0 },
  chipRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: mobileSpace.xs },
  content: { alignSelf: 'stretch', gap: mobileSpace.md, padding: mobileSpace.lg },
  emptyState: { alignItems: 'center', justifyContent: 'center', minHeight: 96 },
  emptyText: { color: mobileColors.textMuted, fontSize: mobileType.body },
  resultList: { borderColor: mobileColors.border, borderTopWidth: StyleSheet.hairlineWidth },
  scrollArea: { flexShrink: 1, minHeight: 0 },
})
