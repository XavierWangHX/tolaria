export type NativeWorkspaceAccessModule = {
  rememberWorkspace: (uri: string) => Promise<boolean>
  restoreWorkspace: () => Promise<string | null>
}

export function optionalNativeWorkspaceAccessModule(): NativeWorkspaceAccessModule | null {
  return null
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
    return normalizedWorkspaceUri(await module.restoreWorkspace())
  } catch {
    return null
  }
}

function normalizedWorkspaceUri(uri: string | null): string | null {
  const normalized = uri?.trim()
  return normalized || null
}
