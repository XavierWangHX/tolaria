import { describe, expect, it, vi } from 'vitest'
import { workspaceScenarioForId } from '../fixtures/workspaceFixtures'
import type { ReadOnlyWorkspaceRepository } from '../workspace/readOnlyWorkspaceRepository'
import {
  mobileUiRequestedWorkspaceSource,
  resolveMobileUiWorkspace,
} from './mobileUiLabWorkspaceResolution'

describe('resolveMobileUiWorkspace', () => {
  it('prioritizes an isolated persistence repository over the ambient dev vault', () => {
    const probeSnapshot = workspaceScenarioForId('empty')
    const readSnapshot = vi.fn(() => probeSnapshot)
    const probeRepository: ReadOnlyWorkspaceRepository = {
      persistWrites: vi.fn(),
      readNoteContent: vi.fn(),
      readSnapshot,
    }

    const result = resolveMobileUiWorkspace({
      devVaultState: {
        noteContents: {},
        snapshot: workspaceScenarioForId('default'),
      },
      persistenceProbeEnabled: true,
      probeRepository,
      repositoryRequest: { source: 'native' },
      source: 'dev',
    })

    expect(result.repository).toBe(probeRepository)
    expect(result.baseSnapshot).toBe(probeSnapshot)
    expect(readSnapshot).toHaveBeenCalledWith({ source: 'native' })
  })
})

describe('mobileUiRequestedWorkspaceSource', () => {
  it('starts interactive launches on the native workspace instead of fixture data', () => {
    expect(mobileUiRequestedWorkspaceSource({
      hasNativeWorkspace: false,
      platform: 'ios',
      requestedSource: null,
      searchParams: new URLSearchParams(),
    })).toBe('native')
  })

  it('keeps the browser QA harness on deterministic fixture data by default', () => {
    expect(mobileUiRequestedWorkspaceSource({
      hasNativeWorkspace: false,
      platform: 'web',
      requestedSource: null,
      searchParams: new URLSearchParams(),
    })).toBe('fixture')
  })

  it('isolates deterministic editor probes from ambient dev-vault configuration', () => {
    expect(mobileUiRequestedWorkspaceSource({
      hasNativeWorkspace: false,
      platform: 'ios',
      requestedSource: 'dev-vault',
      searchParams: new URLSearchParams('wysiwygAutocompleteProbe=1'),
    })).toBe('fixture')
  })

  it('uses the native repository for persistence probes', () => {
    expect(mobileUiRequestedWorkspaceSource({
      hasNativeWorkspace: false,
      platform: 'ios',
      requestedSource: 'dev-vault',
      searchParams: new URLSearchParams('wysiwygPersistenceProbe=1'),
    })).toBe('native')
  })

  it('keeps ordinary layout QA on the configured real-vault source', () => {
    expect(mobileUiRequestedWorkspaceSource({
      hasNativeWorkspace: false,
      platform: 'ios',
      requestedSource: 'dev-vault',
      searchParams: new URLSearchParams('layoutProbe=1'),
    })).toBe('dev')
  })
})
