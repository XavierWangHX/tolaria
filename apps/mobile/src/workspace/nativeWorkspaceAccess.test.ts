import { describe, expect, it, vi } from 'vitest'
import {
  importNativeWorkspace,
  pickAndImportNativeWorkspace,
  restoreNativeWorkspace,
  type NativeWorkspaceAccessModule,
} from './nativeWorkspaceAccess'

describe('native workspace access', () => {
  it('keeps Expo Go selections session-scoped when the native module is unavailable', async () => {
    await expect(importNativeWorkspace('file:///vault', null)).resolves.toBeNull()
    await expect(restoreNativeWorkspace(null)).resolves.toBeNull()
  })

  it('remembers a picked workspace in standalone iOS builds', async () => {
    const module: NativeWorkspaceAccessModule = {
      importWorkspace: vi.fn().mockResolvedValue({ label: 'Vault', uri: 'file:///managed-vault' }),
      pickAndImportWorkspace: vi.fn().mockResolvedValue(null),
      restoreWorkspace: vi.fn().mockResolvedValue(null),
    }

    await expect(importNativeWorkspace('file:///vault', module)).resolves.toEqual({
      label: 'Vault',
      uri: 'file:///managed-vault',
    })
    expect(module.importWorkspace).toHaveBeenCalledWith('file:///vault')
  })

  it('imports a workspace selected by the standalone iOS picker', async () => {
    const module: NativeWorkspaceAccessModule = {
      importWorkspace: vi.fn(),
      pickAndImportWorkspace: vi.fn().mockResolvedValue({
        label: 'Laputa',
        uri: 'file:///managed/Tolaria%20Vault/',
      }),
      restoreWorkspace: vi.fn(),
    }

    await expect(pickAndImportNativeWorkspace(module)).resolves.toEqual({
      label: 'Laputa',
      uri: 'file:///managed/Tolaria%20Vault/',
    })
  })

  it('restores a persisted workspace URI and rejects malformed native results', async () => {
    const restored: NativeWorkspaceAccessModule = {
      importWorkspace: vi.fn(),
      restoreWorkspace: vi.fn().mockResolvedValue({ label: 'Vault', uri: 'file:///vault' }),
    }
    const malformed: NativeWorkspaceAccessModule = {
      importWorkspace: vi.fn(),
      restoreWorkspace: vi.fn().mockResolvedValue({ label: ' ', uri: '  ' }),
    }

    await expect(restoreNativeWorkspace(restored)).resolves.toEqual({ label: 'Vault', uri: 'file:///vault' })
    await expect(restoreNativeWorkspace(malformed)).resolves.toBeNull()
  })

  it('fails closed when bookmark persistence or restoration throws', async () => {
    const module: NativeWorkspaceAccessModule = {
      importWorkspace: vi.fn().mockRejectedValue(new Error('import failed')),
      restoreWorkspace: vi.fn().mockRejectedValue(new Error('permission revoked')),
    }

    await expect(importNativeWorkspace('file:///vault', module)).resolves.toBeNull()
    await expect(restoreNativeWorkspace(module)).resolves.toBeNull()
  })
})
