import { requireOptionalNativeModule } from 'expo'
import type { NativeWorkspaceAccessModule, NativeWorkspaceRecord } from './nativeWorkspaceAccess'

let cachedModule: NativeWorkspaceAccessModule | null | undefined

export function optionalNativeWorkspaceAccessModule(): NativeWorkspaceAccessModule | null {
  if (cachedModule !== undefined) return cachedModule
  cachedModule = requireOptionalNativeModule<NativeWorkspaceAccessModule>('TolariaWorkspaceAccess')
  return cachedModule
}

export async function importNativeWorkspace(
  uri: string,
  module: NativeWorkspaceAccessModule | null = optionalNativeWorkspaceAccessModule(),
): Promise<NativeWorkspaceRecord | null> {
  if (!module) return null

  try {
    return normalizedWorkspaceRecord(await module.importWorkspace(uri))
  } catch {
    return null
  }
}

export async function pickAndImportNativeWorkspace(
  module: NativeWorkspaceAccessModule | null = optionalNativeWorkspaceAccessModule(),
): Promise<NativeWorkspaceRecord | null> {
  if (!module?.pickAndImportWorkspace) return null

  try {
    return normalizedWorkspaceRecord(await module.pickAndImportWorkspace())
  } catch {
    return null
  }
}

export async function restoreNativeWorkspace(
  module: NativeWorkspaceAccessModule | null = optionalNativeWorkspaceAccessModule(),
): Promise<NativeWorkspaceRecord | null> {
  if (!module) return null

  try {
    return normalizedWorkspaceRecord(await module.restoreWorkspace())
  } catch {
    return null
  }
}

function normalizedWorkspaceRecord(record: NativeWorkspaceRecord | null): NativeWorkspaceRecord | null {
  const uri = record?.uri.trim()
  const label = record?.label.trim()
  return uri && label ? { label, uri } : null
}

export type { NativeWorkspaceAccessModule } from './nativeWorkspaceAccess'
