export const mobileNoteListToolbarChrome = {
  actionTestIds: ['note-list-search-action', 'note-list-create-action'],
} as const

const emptyStateChrome = {
  emptyVault: {
    action: 'openVault',
    detailKey: null,
    titleKey: 'noteList.empty.noNotes',
  },
  filtered: {
    action: null,
    detailKey: 'noteList.empty.noNotes',
    titleKey: 'noteList.empty.allOrganized',
  },
  search: {
    action: null,
    detailKey: 'noteList.empty.noNotes',
    titleKey: 'noteList.empty.noMatching',
  },
} as const

export function mobileNoteListEmptyStateChrome({
  emptyVault,
  searchQuery,
}: {
  emptyVault: boolean
  searchQuery?: string
}) {
  if (searchQuery) return emptyStateChrome.search
  return emptyVault ? emptyStateChrome.emptyVault : emptyStateChrome.filtered
}
