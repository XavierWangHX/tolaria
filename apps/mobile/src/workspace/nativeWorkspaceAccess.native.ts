import { requireOptionalNativeModule } from 'expo'
import type { NativeWorkspaceAccessModule } from './nativeWorkspaceAccess'

let cachedModule: NativeWorkspaceAccessModule | null | undefined

export function optionalNativeWorkspaceAccessModule(): NativeWorkspaceAccessModule | null {
  if (cachedModule !== undefined) return cachedModule
  cachedModule = requireOptionalNativeModule<NativeWorkspaceAccessModule>('TolariaWorkspaceAccess')
  return cachedModule
}

export async function rememberNativeWorkspace(
  uri: string,
  module: NativeWorkspaceAccessModule | null = optionalNativeWorkspaceAccessModule(),
): Promise<boolean> {
  if (!module) return false

  try {
    return await module.rememberWorkspace(uri)
  } catch {
    return false
  }
}

export async function restoreNativeWorkspace(
  module: NativeWorkspaceAccessModule | null = optionalNativeWorkspaceAccessModule(),
): Promise<string | null> {
  if (!module) return null

  try {
    const normalized = (await module.restoreWorkspace())?.trim()
    return normalized || null
  } catch {
    return null
  }
}

export type { NativeWorkspaceAccessModule } from './nativeWorkspaceAccess'
