import {
  createDevVaultWorkspaceRepository,
  type DevVaultWorkspaceState,
} from '../workspace/devVaultWorkspaceRepository'
import type {
  ReadOnlyWorkspaceRepository,
  ReadOnlyWorkspaceRequest,
} from '../workspace/readOnlyWorkspaceRepository'

type MobileUiWorkspaceResolutionInput = {
  devVaultState: DevVaultWorkspaceState | null
  persistenceProbeEnabled: boolean
  probeRepository: ReadOnlyWorkspaceRepository
  repositoryRequest: ReadOnlyWorkspaceRequest
  source: NonNullable<ReadOnlyWorkspaceRequest['source']>
}

const fixtureProbeParams = [
  'mobileActionAdapterProbe',
  'mobileCommandPaletteProbe',
  'mobileKeyboardShortcutProbe',
  'sourceSelectionProbe',
  'tableOfContentsProbe',
  'wysiwygAutocompleteProbe',
  'wysiwygExternalLinkProbe',
  'wysiwygFormatCommandProbe',
  'wysiwygInputTransformProbe',
  'wysiwygMarkdownBlockProbe',
  'wysiwygMathEditProbe',
  'wysiwygMutationProbe',
  'wysiwygTableCommandMutationProbe',
  'wysiwygWikilinkInsertProbe',
] as const

const configuredWorkspaceSources: Record<string, NonNullable<ReadOnlyWorkspaceRequest['source']>> = {
  'dev-vault': 'dev',
  'host-vault': 'host',
  'local-vault': 'dev',
  'native-vault': 'native',
}

export function mobileUiRequestedWorkspaceSource({
  hasNativeWorkspace,
  requestedSource,
  searchParams,
}: {
  hasNativeWorkspace: boolean
  requestedSource: string | null
  searchParams: URLSearchParams
}): NonNullable<ReadOnlyWorkspaceRequest['source']> {
  if (hasNativeWorkspace) return 'native'
  if (hasPersistenceProbe(searchParams)) return 'native'
  if (fixtureProbeParams.some((key) => searchParams.get(key) === '1')) return 'fixture'
  if (!requestedSource) return 'native'
  return configuredWorkspaceSources[requestedSource] ?? 'fixture'
}

export function resolveMobileUiWorkspace({
  devVaultState,
  persistenceProbeEnabled,
  probeRepository,
  repositoryRequest,
  source,
}: MobileUiWorkspaceResolutionInput) {
  const useDevVault = source === 'dev' && devVaultState !== null && !persistenceProbeEnabled
  const repository = useDevVault
    ? createDevVaultWorkspaceRepository(devVaultState)
    : probeRepository

  return {
    baseSnapshot: useDevVault
      ? devVaultState.snapshot
      : repository.readSnapshot(repositoryRequest),
    repository,
  }
}

function hasPersistenceProbe(searchParams: URLSearchParams): boolean {
  return searchParams.get('workspacePersistenceProbe') === '1'
    || searchParams.get('wysiwygPersistenceProbe') === '1'
}
