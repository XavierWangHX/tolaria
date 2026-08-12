import { Plus, WarningCircle, X } from 'phosphor-react-native'
import type { ReactNode } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { mobileCopy, mobileText } from '../../i18n/mobileText'
import { type MobileLayoutProbe, probeProps, useMobileLayoutProbe } from '../../qa/mobileLayoutProbe'
import { desktopRelationshipParity } from '../../ui/desktopParity'
import { MobileChip } from '../../ui/MobileChip'
import { MobilePanel, MobileToolbar, MobileToolbarTitle } from '../../ui/MobilePanel'
import { MobilePropertyRow } from '../../ui/MobilePropertyRow'
import { mobileColors } from '../../ui/tokens'
import { mobileFrontmatterState, needsMobileFrontmatterNotice } from '../../workspace/mobileFrontmatterState'
import {
  type MobileInspectorPropertySlot,
  type MobileInspectorRelationshipSlot,
  mobileInspectorPropertySlots,
  mobileInspectorRelationshipSlots,
} from '../../workspace/mobileInspectorSchema'
import { resolveMobileMissingTypeName } from '../../workspace/mobileMissingType'
import type { MobileNeighborhoodGroup } from '../../workspace/mobileNeighborhood'
import { type MobilePropertyDisplay, mobilePropertyDisplay } from '../../workspace/mobilePropertyDisplay'
import type {
  MobileNote,
  MobileProperty,
  MobilePropertyDisplayMode,
  MobilePropertyValue,
  MobileRelationship,
  MobileTone,
  MobileTypeDefinitions,
} from '../../workspace/mobileWorkspaceModel'
import { Text } from '../ui/text'
import { MobileFrontmatterStateNotice } from './MobileFrontmatterStateNotice'
import {
  actionStyles,
  emptyStateStyles,
  panelStyles,
  propertyDisplayStyles,
  propertyStyles,
  referenceStyles,
  relationshipStyles,
  typeStyles,
} from './MobilePropertiesPanel.styles'
import {
  mobileInspectorPlaceholderActionLabel,
  mobileInspectorReferenceRowLayoutContract,
  mobileRelationshipValueMetricSegments,
} from './MobilePropertiesPanelModel'
import { MobileTypeIcon } from './MobileWorkspaceIcons'
import { chipTone, noteTypeColor, noteTypeSoftColor, statusTone, tagTone } from './mobileWorkspaceTone'

type MobilePropertiesPanelProps = {
  compact: boolean
  fullWidth?: boolean
  layoutProbe?: boolean
  note: MobileNote | null
  onAddProperty: (key?: string) => void
  onAddRelationship: (key?: string) => void
  onDeleteProperty: (noteId: string, key: string) => void
  onEditProperty: (noteId: string, key: string, value: MobilePropertyValue) => void
  onEnterNeighborhood?: (noteId: string) => void
  onFixInvalidFrontmatter?: () => void
  onInitializeProperties: (noteId: string) => void
  onCreateMissingType: (typeName: string) => void
  onOpenChangeNoteType: () => void
  onRemoveRelationship: (noteId: string, key: string, ref: string) => void
  onSelectNote: (noteId: string) => void
  propertyDisplayModes?: Record<string, MobilePropertyDisplayMode> | null
  referenceGroups?: MobileNeighborhoodGroup[]
  typeDefinitions?: MobileTypeDefinitions
}

export function MobilePropertiesPanel(props: MobilePropertiesPanelProps) {
  const {
    compact,
    fullWidth = false,
    layoutProbe = false,
  } = props
  const propertyLayoutProbe = useMobileLayoutProbe(layoutProbe)

  return (
    <MobilePanel
      {...probeProps(propertyLayoutProbe.probe, 'properties.panel')}
      style={[
        panelStyles.panel,
        compact ? panelStyles.panelCompact : null,
        fullWidth ? panelStyles.panelFullWidth : null,
      ]}
      testID="properties-panel"
    >
      <MobileToolbar testID="properties-toolbar">
        <MobileToolbarTitle testID="properties-toolbar-title" title={mobileCopy.properties} variant="inspector" />
      </MobileToolbar>
      <ScrollView
        {...probeProps(propertyLayoutProbe.probe, 'properties.scroll')}
        contentContainerStyle={[panelStyles.content, props.note ? null : panelStyles.emptyContent]}
        keyboardShouldPersistTaps="handled"
      >
        <PropertiesPanelContent layoutProbe={propertyLayoutProbe.probe} props={props} />
      </ScrollView>
    </MobilePanel>
  )
}

function PropertiesPanelContent({
  layoutProbe,
  props,
}: {
  layoutProbe: MobileLayoutProbe
  props: MobilePropertiesPanelProps
}) {
  if (!props.note) return <PropertiesEmptyState />

  return (
    <NoteProperties
      layoutProbe={layoutProbe}
      {...notePropertiesProps(props)}
    />
  )
}

function notePropertiesProps(props: MobilePropertiesPanelProps): Omit<NotePropertiesProps, 'layoutProbe'> {
  if (!props.note) throw new Error('A selected note is required to build property rows')

  return {
    note: props.note,
    onAddProperty: props.onAddProperty,
    onAddRelationship: props.onAddRelationship,
    onEditProperty: props.onEditProperty,
    onEnterNeighborhood: props.onEnterNeighborhood,
    onFixInvalidFrontmatter: props.onFixInvalidFrontmatter,
    onInitializeProperties: props.onInitializeProperties,
    onCreateMissingType: props.onCreateMissingType,
    onOpenChangeNoteType: props.onOpenChangeNoteType,
    onRemoveRelationship: props.onRemoveRelationship,
    onSelectNote: props.onSelectNote,
    propertyDisplayModes: props.propertyDisplayModes,
    referenceGroups: props.referenceGroups ?? [],
    typeDefinitions: props.typeDefinitions,
  }
}

type NotePropertiesProps = {
  layoutProbe: MobileLayoutProbe
  note: MobileNote
  onAddProperty: (key?: string) => void
  onAddRelationship: (key?: string) => void
  onEditProperty: (noteId: string, key: string, value: MobilePropertyValue) => void
  onEnterNeighborhood?: (noteId: string) => void
  onFixInvalidFrontmatter?: () => void
  onInitializeProperties: (noteId: string) => void
  onCreateMissingType: (typeName: string) => void
  onOpenChangeNoteType: () => void
  onRemoveRelationship: (noteId: string, key: string, ref: string) => void
  onSelectNote: (noteId: string) => void
  propertyDisplayModes?: Record<string, MobilePropertyDisplayMode> | null
  referenceGroups: MobileNeighborhoodGroup[]
  typeDefinitions?: MobileTypeDefinitions
}

function NoteProperties(props: NotePropertiesProps) {
  const { layoutProbe, note, onFixInvalidFrontmatter, onInitializeProperties, onSelectNote, referenceGroups, typeDefinitions } = props
  const frontmatterState = mobileFrontmatterState(note)
  const propertySlots = mobileInspectorPropertySlots(note, typeDefinitions)
  const relationshipSlots = mobileInspectorRelationshipSlots(note, typeDefinitions)
  const missingTypeName = resolveMobileMissingTypeName(note, typeDefinitions)

  if (needsMobileFrontmatterNotice(frontmatterState)) {
    return (
      <>
        <MobileFrontmatterStateNotice
          state={frontmatterState}
          onFixInvalidFrontmatter={onFixInvalidFrontmatter}
          onInitializeProperties={() => onInitializeProperties(note.id)}
        />
        <ReferenceGroups
          groups={referenceGroups}
          layoutProbe={layoutProbe}
          typeDefinitions={typeDefinitions}
          onSelectNote={onSelectNote}
        />
      </>
    )
  }

  return (
    <>
      <StandardPropertyRows missingTypeName={missingTypeName} props={props} />
      <CustomPropertyRows propertySlots={propertySlots} props={props} />
      <RelationshipPropertyRows relationshipSlots={relationshipSlots} props={props} />
      <PropertyActionsAndReferences props={props} />
    </>
  )
}

function StandardPropertyRows({ missingTypeName, props }: { missingTypeName: string | null; props: NotePropertiesProps }) {
  const { layoutProbe, note, onCreateMissingType, onEditProperty, onOpenChangeNoteType } = props

  return (
    <>
      <TypePropertyRow
        layoutProbe={layoutProbe}
        missingTypeName={missingTypeName}
        note={note}
        onCreateMissingType={onCreateMissingType}
        onOpenChangeNoteType={onOpenChangeNoteType}
      />
      {note.status ? (
        <MobilePropertyRow
          label={mobileText('noteList.sort.status')}
          testID="property-row-status"
          value={
            <EditableChipValue
              label={note.status}
              testID="property-row-status-edit"
              tone={statusTone(note.status)}
              onPress={() => onEditProperty(note.id, 'Status', note.status)}
            />
          }
          layoutProbe={layoutProbe}
          layoutProbeId="properties.row.status"
        />
      ) : null}
      <MobilePropertyRow label={mobileText('noteList.sort.created')} layoutProbe={layoutProbe} layoutProbeId="properties.row.created" testID="property-row-created" value={note.created} />
      <MobilePropertyRow label={mobileCopy.modified} layoutProbe={layoutProbe} layoutProbeId="properties.row.modified" testID="property-row-modified" value={note.modified} />
      <MobilePropertyRow
        label={mobileText('inspector.properties.workspace')}
        layoutProbe={layoutProbe}
        layoutProbeId="properties.row.workspace"
        testID="property-row-workspace"
        value={<WorkspaceBadge label={note.workspace} />}
      />
      <PropertySection label="Tags" layoutProbe={layoutProbe} layoutProbeId="properties.section.tags" testID="property-section-tags">
        <EditableTagsValue labels={note.tags} onPress={() => onEditProperty(note.id, 'tags', note.tags)} />
      </PropertySection>
      <MobilePropertyRow label="Links" layoutProbe={layoutProbe} layoutProbeId="properties.row.links" testID="property-row-links" value={`${note.links}`} />
    </>
  )
}

function CustomPropertyRows({ propertySlots, props }: { propertySlots: MobileInspectorPropertySlot[]; props: NotePropertiesProps }) {
  const { layoutProbe, note, onAddProperty, onEditProperty, propertyDisplayModes } = props

  return (
    <>
      {note.icon ? (
        <EditablePropertyRow
          layoutProbe={layoutProbe}
          noteId={note.id}
          property={{ key: 'icon', label: 'Icon', value: note.icon }}
          onEditProperty={onEditProperty}
        />
      ) : null}
      {note.properties?.map((property) => (
        <EditablePropertyRow
          key={property.key}
          layoutProbe={layoutProbe}
          noteId={note.id}
          property={property}
          propertyDisplayModes={propertyDisplayModes}
          onEditProperty={onEditProperty}
        />
      ))}
      {propertySlots.map((slot) => (
        <PlaceholderPropertyRow key={`${slot.source}:${slot.key}`} layoutProbe={layoutProbe} slot={slot} onPress={() => onAddProperty(slot.key)} />
      ))}
    </>
  )
}

function RelationshipPropertyRows({ relationshipSlots, props }: { relationshipSlots: MobileInspectorRelationshipSlot[]; props: NotePropertiesProps }) {
  const { layoutProbe, note, onAddRelationship, onEnterNeighborhood, onRemoveRelationship, onSelectNote, typeDefinitions } = props

  return (
    <>
      {note.relationships.map((relationship) => (
        <PropertySection
          key={`${relationship.kind}-${relationship.label ?? relationship.values.map((value) => value.title).join('-')}`}
          label={relationshipHeading(relationship)}
          layoutProbe={layoutProbe}
          layoutProbeId={`properties.section.${testIdSegment(relationshipHeading(relationship))}`}
          testID={`property-section-${relationship.kind}`}
        >
          <RelationshipValues
            layoutProbe={layoutProbe}
            noteId={note.id}
            relationship={relationship}
            onRemoveRelationship={onRemoveRelationship}
            onEnterNeighborhood={onEnterNeighborhood}
            typeDefinitions={typeDefinitions}
            onSelectNote={onSelectNote}
          />
        </PropertySection>
      ))}
      {relationshipSlots.map((slot) => (
        <PlaceholderRelationshipSection key={`${slot.source}:${slot.key}`} layoutProbe={layoutProbe} slot={slot} onPress={() => onAddRelationship(slot.key)} />
      ))}
    </>
  )
}

function PropertyActionsAndReferences({ props }: { props: NotePropertiesProps }) {
  const { layoutProbe, onAddProperty, onAddRelationship, onSelectNote, referenceGroups, typeDefinitions } = props

  return (
    <>
      <PropertyActionRow label={mobileText('inspector.properties.addProperty')} layoutProbe={layoutProbe} layoutProbeId="properties.action.add-property" testID="property-action-add-property" onPress={() => onAddProperty()} />
      <PropertyActionRow label={mobileText('inspector.relationship.addRelationship')} layoutProbe={layoutProbe} layoutProbeId="properties.action.add-relationship" testID="property-action-add-relationship" onPress={() => onAddRelationship()} />
      <ReferenceGroups groups={referenceGroups} layoutProbe={layoutProbe} typeDefinitions={typeDefinitions} onSelectNote={onSelectNote} />
    </>
  )
}

function TypePropertyRow({
  layoutProbe,
  missingTypeName,
  note,
  onCreateMissingType,
  onOpenChangeNoteType,
}: {
  layoutProbe: MobileLayoutProbe
  missingTypeName: string | null
  note: MobileNote
  onCreateMissingType: (typeName: string) => void
  onOpenChangeNoteType: () => void
}) {
  return (
    <MobilePropertyRow
      label="Type"
      testID="property-row-type"
      value={
        <View style={typeStyles.value}>
          <EditableChipValue
            label={note.type}
            testID="property-row-type-edit"
            tone={chipTone(note.typeTone)}
            onPress={onOpenChangeNoteType}
          />
          {missingTypeName ? (
            <MissingTypeButton typeName={missingTypeName} onPress={() => onCreateMissingType(missingTypeName)} />
          ) : null}
        </View>
      }
      layoutProbe={layoutProbe}
      layoutProbeId="properties.row.type"
    />
  )
}

function MissingTypeButton({ onPress, typeName }: { onPress: () => void; typeName: string }) {
  const label = mobileText('inspector.properties.missingTypeAria').replace('{type}', typeName)

  return (
    <Pressable
      accessibilityHint={mobileText('sidebar.action.createType')}
      accessibilityLabel={label}
      accessibilityRole="button"
      style={({ pressed }) => [typeStyles.missingButton, pressed ? propertyStyles.editableValuePressed : null]}
      testID="missing-type-warning"
      onPress={onPress}
    >
      <WarningCircle color={mobileColors.orange} size={14} weight="bold" />
      <Text numberOfLines={1} style={typeStyles.missingText}>
        {mobileText('inspector.properties.missingType')}
      </Text>
    </Pressable>
  )
}

function EditableChipValue({
  label,
  onPress,
  testID,
  tone,
}: {
  label: string
  onPress: () => void
  testID: string
  tone: Parameters<typeof MobileChip>[0]['tone']
}) {
  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" testID={testID} onPress={onPress}>
      <MobileChip label={label} tone={tone} />
    </Pressable>
  )
}

function EditableTagsValue({ labels, onPress }: { labels: string[]; onPress: () => void }) {
  if (labels.length > 0) {
    return (
      <Pressable accessibilityLabel="Tags" accessibilityRole="button" testID="property-tags-edit" onPress={onPress}>
        <TagWrap labels={labels} />
      </Pressable>
    )
  }

  return (
    <Pressable
      accessibilityLabel="Tags"
      accessibilityRole="button"
      style={({ pressed }) => [propertyStyles.emptyEditableValue, pressed ? propertyStyles.editableValuePressed : null]}
      testID="property-tags-edit"
      onPress={onPress}
    >
      <Text style={propertyStyles.emptyEditableText}>{'\u2014'}</Text>
    </Pressable>
  )
}

function EditablePropertyRow({
  layoutProbe,
  noteId,
  onEditProperty,
  propertyDisplayModes,
  property,
}: {
  layoutProbe: MobileLayoutProbe
  noteId: string
  onEditProperty: (noteId: string, key: string, value: MobilePropertyValue) => void
  propertyDisplayModes?: Record<string, MobilePropertyDisplayMode> | null
  property: MobileProperty
}) {
  const testId = `property-row-${testIdSegment(property.key)}`
  const display = mobilePropertyDisplay(
    property.key,
    property.value,
    {
      false: mobileText('inspector.properties.no'),
      true: mobileText('inspector.properties.yes'),
    },
    propertyDisplayModes,
  )

  return (
    <MobilePropertyRow
      label={property.label}
      layoutProbe={layoutProbe}
      layoutProbeId={`properties.row.${testIdSegment(property.key)}`}
      testID={testId}
      value={
        <Pressable
          accessibilityLabel={`${property.label}: ${display.text}`}
          accessibilityRole="button"
          style={({ pressed }) => [propertyStyles.editableValue, pressed ? propertyStyles.editableValuePressed : null]}
          testID={`${testId}-edit`}
          onPress={() => onEditProperty(noteId, property.key, property.value)}
        >
          <EditablePropertyValueDisplay display={display} />
        </Pressable>
      }
    />
  )
}

function EditablePropertyValueDisplay({ display }: { display: MobilePropertyDisplay }) {
  if (display.kind === 'list' && display.listItems.length > 0) {
    return (
      <View style={propertyDisplayStyles.listValue}>
        {display.listItems.map((item) => (
          <MobileChip key={item} label={item} tone={tagTone(item)} />
        ))}
      </View>
    )
  }

  if (display.kind === 'status') {
    return <MobileChip label={display.text} tone={statusTone(display.text)} />
  }

  if (display.kind === 'color') {
    return <EditableColorValue colorValue={display.colorValue} text={display.text} />
  }

  return (
    <Text numberOfLines={1} style={editablePropertyTextStyle(display.kind)}>
      {display.text}
    </Text>
  )
}

function EditableColorValue({ colorValue, text }: { colorValue?: string; text: string }) {
  return (
    <View style={propertyDisplayStyles.colorValue}>
      <View
        style={[
          propertyDisplayStyles.colorSwatch,
          colorValue ? { backgroundColor: colorValue } : null,
        ]}
      />
      <Text numberOfLines={1} style={propertyStyles.editableText}>
        {text}
      </Text>
    </View>
  )
}

function editablePropertyTextStyle(kind: MobilePropertyDisplay['kind']) {
  return [
    propertyStyles.editableText,
    kind === 'number' ? propertyDisplayStyles.numberText : null,
    kind === 'url' ? propertyDisplayStyles.urlText : null,
  ]
}

function PropertiesEmptyState() {
  return (
    <View style={emptyStateStyles.emptyState}>
      <Text style={emptyStateStyles.emptyTitle}>{mobileText('inspector.empty.noNoteSelected')}</Text>
      <Text style={emptyStateStyles.emptyText}>{mobileText('inspector.empty.noProperties')}</Text>
    </View>
  )
}

function PlaceholderPropertyRow({
  layoutProbe,
  onPress,
  slot,
}: {
  layoutProbe: MobileLayoutProbe
  onPress: () => void
  slot: MobileInspectorPropertySlot
}) {
  const sourceSegment = slot.source === 'typeDerived' ? 'type-derived' : 'suggested'
  const testID = `property-placeholder-${sourceSegment}-${testIdSegment(slot.key)}`

  return (
    <MobilePropertyRow
      accessibilityLabel={slot.label}
      label={slot.label}
      layoutProbe={layoutProbe}
      layoutProbeId={`properties.placeholder.${testIdSegment(slot.key)}`}
      testID={testID}
      onPress={onPress}
      value={
        <View pointerEvents="none" style={propertyStyles.placeholderAddValue} testID={`${testID}-add`}>
          <Plus color={mobileColors.textFaint} size={14} />
          <Text numberOfLines={1} style={propertyStyles.placeholderValue}>
            {mobileInspectorPlaceholderActionLabel('property')}
          </Text>
        </View>
      }
    />
  )
}

function PropertySection({
  children,
  label,
  labelVariant = 'default',
  layoutProbe,
  layoutProbeId,
  testID,
}: {
  children: ReactNode
  label: string
  labelVariant?: 'default' | 'placeholder'
  layoutProbe?: MobileLayoutProbe
  layoutProbeId?: string
  testID?: string
}) {
  const metricId = layoutProbeId ?? testID

  return (
    <View {...propertyProbe(layoutProbe, metricId, 'row')} style={propertyStyles.sectionRow} testID={testID}>
      <Text
        {...propertyProbe(layoutProbe, metricId, 'label')}
        style={[propertyStyles.sectionLabel, labelVariant === 'placeholder' ? propertyStyles.placeholderLabel : null]}
        testID={testID ? `${testID}-label` : undefined}
      >
        {label}
      </Text>
      <View
        {...propertyProbe(layoutProbe, metricId, 'value')}
        style={propertyStyles.sectionValue}
        testID={testID ? `${testID}-value` : undefined}
      >
        {children}
      </View>
    </View>
  )
}

function PropertyActionRow({
  label,
  layoutProbe,
  layoutProbeId,
  onPress,
  testID,
}: {
  label: string
  layoutProbe?: MobileLayoutProbe
  layoutProbeId?: string
  onPress: () => void
  testID: string
}) {
  const visibleLabel = label.replace(/^\+\s*/, '')
  const metricId = layoutProbeId ?? testID

  return (
    <Pressable
      {...propertyProbe(layoutProbe, metricId, 'row')}
      accessibilityLabel={label}
      accessibilityRole="button"
      style={actionStyles.row}
      testID={testID}
      onPress={onPress}
    >
      <View {...propertyProbe(layoutProbe, metricId, 'label')} pointerEvents="none" style={actionStyles.label}>
        <View style={actionStyles.iconSlot}>
          <Plus color={mobileColors.textFaint} size={14} />
        </View>
        <Text numberOfLines={1} style={actionStyles.text}>
          {visibleLabel}
        </Text>
      </View>
      <View {...propertyProbe(layoutProbe, metricId, 'value')} pointerEvents="none" style={actionStyles.value} />
    </Pressable>
  )
}

function PlaceholderRelationshipSection({
  layoutProbe,
  onPress,
  slot,
}: {
  layoutProbe: MobileLayoutProbe
  onPress: () => void
  slot: MobileInspectorRelationshipSlot
}) {
  const sourceSegment = slot.source === 'typeDerived' ? 'type-derived' : 'suggested'
  const testID = `relationship-placeholder-${sourceSegment}-${testIdSegment(slot.key)}`

  return (
    <PropertySection
      label={slot.label}
      labelVariant="placeholder"
      layoutProbe={layoutProbe}
      layoutProbeId={`properties.relationship-placeholder.${testIdSegment(slot.key)}`}
      testID={testID}
    >
      <Pressable
        accessibilityLabel={mobileText('inspector.relationship.add')}
        accessibilityRole="button"
        style={({ pressed }) => [
          propertyStyles.placeholderRelationshipButton,
          pressed ? propertyStyles.editableValuePressed : null,
        ]}
        testID={`${testID}-add`}
        onPress={onPress}
      >
        <View style={actionStyles.label}>
          <View style={actionStyles.iconSlot}>
            <Plus color={mobileColors.textFaint} size={14} />
          </View>
          <Text numberOfLines={1} style={[actionStyles.text, propertyStyles.placeholderButtonText]}>
            {mobileInspectorPlaceholderActionLabel('relationship')}
          </Text>
        </View>
      </Pressable>
    </PropertySection>
  )
}

function RelationshipValues({
  layoutProbe,
  noteId,
  onRemoveRelationship,
  onEnterNeighborhood,
  onSelectNote,
  relationship,
  typeDefinitions,
}: {
  layoutProbe: MobileLayoutProbe
  noteId: string
  relationship: MobileRelationship
  typeDefinitions?: MobileTypeDefinitions
  onRemoveRelationship: (noteId: string, key: string, ref: string) => void
  onEnterNeighborhood?: (noteId: string) => void
  onSelectNote: (noteId: string) => void
}) {
  const rowSegments = mobileRelationshipValueMetricSegments(relationship.values)

  return (
    <View style={relationshipStyles.values}>
      {relationship.values.map((value, valueIndex) => {
        const rowSegment = rowSegments[valueIndex] ?? relationshipValueSegment(value, valueIndex)

        return (
          <View
            key={rowSegment}
            {...propertyProbe(layoutProbe, `properties.relationship.${rowSegment}`, 'row')}
            style={[relationshipStyles.row, relationshipRowTone(value.typeTone)]}
            testID={`relationship-row-${rowSegment}`}
          >
            <Pressable
              accessibilityLabel={value.title}
              accessibilityRole="button"
              disabled={!value.id}
              {...propertyProbe(layoutProbe, `properties.relationship.${rowSegment}`, 'target')}
              style={relationshipStyles.openTarget}
              testID={`relationship-row-${rowSegment}-open`}
              onPress={() => {
                if (!value.id) return
                onSelectNote(value.id)
              }}
              onLongPress={() => {
                if (value.id) onEnterNeighborhood?.(value.id)
              }}
            >
              <MobileTypeIcon
                size={desktopRelationshipParity.iconSize}
                tone={value.typeTone}
                type={value.type}
                typeDefinitions={typeDefinitions}
              />
              <Text
                numberOfLines={1}
                {...propertyProbe(layoutProbe, `properties.relationship.${rowSegment}`, 'text')}
                style={[relationshipStyles.text, relationshipTextTone(value.typeTone)]}
                testID={`relationship-row-${rowSegment}-text`}
              >
                {value.title}
              </Text>
            </Pressable>
            <Pressable
              accessibilityLabel={mobileText('common.remove')}
              accessibilityRole="button"
              hitSlop={8}
              style={relationshipStyles.remove}
              testID={`relationship-row-${rowSegment}-remove`}
              onPress={() => {
                if (relationship.key && value.ref) onRemoveRelationship(noteId, relationship.key, value.ref)
              }}
            >
              <X color={noteTypeColor(value.typeTone)} size={desktopRelationshipParity.removeIconSize} weight="bold" />
            </Pressable>
          </View>
        )
      })}
    </View>
  )
}

function propertyProbe(layoutProbe: MobileLayoutProbe | undefined, metricId: string | undefined, part: string) {
  return metricId ? probeProps(layoutProbe, `${metricId}.${part}`) : {}
}

function ReferenceGroups({
  groups,
  layoutProbe,
  typeDefinitions,
  onSelectNote,
}: {
  groups: MobileNeighborhoodGroup[]
  layoutProbe?: MobileLayoutProbe
  typeDefinitions?: MobileTypeDefinitions
  onSelectNote: (noteId: string) => void
}) {
  if (groups.length === 0) return null

  return (
    <View style={referenceStyles.container} testID="inspector-reference-groups">
      {groups.map((group) => (
        <PropertySection
          key={`${group.source}-${group.id}`}
          label={referenceGroupLabel(group)}
          testID={`inspector-reference-group-${group.id}`}
        >
          <ReferenceValues
            group={group}
            layoutProbe={layoutProbe}
            typeDefinitions={typeDefinitions}
            onSelectNote={onSelectNote}
          />
        </PropertySection>
      ))}
    </View>
  )
}

function ReferenceValues({
  group,
  layoutProbe,
  typeDefinitions,
  onSelectNote,
}: {
  group: MobileNeighborhoodGroup
  layoutProbe?: MobileLayoutProbe
  typeDefinitions?: MobileTypeDefinitions
  onSelectNote: (noteId: string) => void
}) {
  return (
    <View style={relationshipStyles.values}>
      {group.notes.map((note) => (
        <Pressable
          key={`${group.id}-${note.id}`}
          accessibilityLabel={note.title}
          accessibilityRole="button"
          {...propertyProbe(layoutProbe, referenceRowMetricId(group, note), 'row')}
          style={({ pressed }) => [
            referenceStyles.row,
            relationshipRowTone(note.typeTone),
            pressed ? propertyStyles.editableValuePressed : null,
          ]}
          testID={`inspector-reference-row-${testIdSegment(note.title)}`}
          onPress={() => onSelectNote(note.id)}
        >
          <MobileTypeIcon
            fileKind={note.fileKind}
            size={mobileInspectorReferenceRowLayoutContract.iconSize}
            tone={note.typeTone}
            type={note.type}
            typeDefinitions={typeDefinitions}
          />
          <Text numberOfLines={1} style={[referenceStyles.text, relationshipTextTone(note.typeTone)]}>
            {note.title}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}

function referenceGroupLabel(group: MobileNeighborhoodGroup) {
  return group.source === 'instances' ? `${group.label} (${group.notes.length})` : group.label
}

function referenceRowMetricId(group: MobileNeighborhoodGroup, note: MobileNote) {
  return `properties.reference.${testIdSegment(group.id)}.${testIdSegment(note.title)}`
}

function relationshipHeading(relationship: MobileRelationship): string {
  if (relationship.kind === 'custom') {
    return relationship.label ?? 'Custom'
  }

  if (relationship.kind === 'belongsTo') return 'Belongs to'
  if (relationship.kind === 'has') return 'Has'
  return 'Related to'
}

function TagWrap({ labels }: { labels: string[] }) {
  return (
    <View style={propertyStyles.tagWrap} testID="property-tags-wrap">
      {labels.map((label) => (
        <MobileChip key={label} label={label} tone={tagTone(label)} />
      ))}
    </View>
  )
}

function WorkspaceBadge({ label }: { label: string }) {
  return <Text style={propertyStyles.workspaceBadge}>{label}</Text>
}

function relationshipRowTone(tone: MobileTone) {
  return { backgroundColor: noteTypeSoftColor(tone) }
}

function relationshipTextTone(tone: MobileTone) {
  return { color: noteTypeColor(tone) }
}

function relationshipValueSegment(value: MobileRelationship['values'][number], index: number) {
  return mobileRelationshipValueMetricSegments([value])[0] ?? `relationship-${index + 1}`
}

function testIdSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
