import { describe, expect, it } from 'vitest'
import {
  mobileNoteListEmptyStateChrome,
  mobileNoteListToolbarChrome,
} from './MobileNoteListPanelChrome'

describe('mobile note-list panel chrome', () => {
  it('keeps note-list toolbar actions to search and direct create', () => {
    expect(mobileNoteListToolbarChrome.actionTestIds).toEqual([
      'note-list-search-action',
      'note-list-create-action',
    ])
  })

  it('does not reserve toolbar chrome for open/archive selectors', () => {
    expect(mobileNoteListToolbarChrome.actionTestIds.join(' ')).not.toMatch(/open|archive|filter|selector/u)
  })

  it('offers the vault picker only for an empty workspace, not empty filters', () => {
    expect(mobileNoteListEmptyStateChrome({ emptyVault: true })).toEqual({
      action: 'openVault',
      detailKey: null,
      titleKey: 'noteList.empty.noNotes',
    })
    expect(mobileNoteListEmptyStateChrome({ emptyVault: false })).toEqual({
      action: null,
      detailKey: 'noteList.empty.noNotes',
      titleKey: 'noteList.empty.allOrganized',
    })
    expect(mobileNoteListEmptyStateChrome({ emptyVault: true, searchQuery: 'roadmap' })).toEqual({
      action: null,
      detailKey: 'noteList.empty.noNotes',
      titleKey: 'noteList.empty.noMatching',
    })
  })
})
