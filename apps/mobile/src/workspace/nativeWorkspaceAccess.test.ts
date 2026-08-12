import { describe, expect, it, vi } from 'vitest'
import {
  rememberNativeWorkspace,
  restoreNativeWorkspace,
  type NativeWorkspaceAccessModule,
} from './nativeWorkspaceAccess'

describe('native workspace access', () => {
  it('keeps Expo Go selections session-scoped when the native module is unavailable', async () => {
    await expect(rememberNativeWorkspace('file:///vault', null)).resolves.toBe(false)
    await expect(restoreNativeWorkspace(null)).resolves.toBeNull()
  })

  it('remembers a picked workspace in standalone iOS builds', async () => {
    const module: NativeWorkspaceAccessModule = {
      rememberWorkspace: vi.fn().mockResolvedValue(true),
      restoreWorkspace: vi.fn().mockResolvedValue(null),
    }

    await expect(rememberNativeWorkspace('file:///vault', module)).resolves.toBe(true)
    expect(module.rememberWorkspace).toHaveBeenCalledWith('file:///vault')
  })

  it('restores a persisted workspace URI and rejects malformed native results', async () => {
    const restored: NativeWorkspaceAccessModule = {
      rememberWorkspace: vi.fn(),
      restoreWorkspace: vi.fn().mockResolvedValue('file:///vault'),
    }
    const malformed: NativeWorkspaceAccessModule = {
      rememberWorkspace: vi.fn(),
      restoreWorkspace: vi.fn().mockResolvedValue('  '),
    }

    await expect(restoreNativeWorkspace(restored)).resolves.toBe('file:///vault')
    await expect(restoreNativeWorkspace(malformed)).resolves.toBeNull()
  })

  it('fails closed when bookmark persistence or restoration throws', async () => {
    const module: NativeWorkspaceAccessModule = {
      rememberWorkspace: vi.fn().mockRejectedValue(new Error('bookmark failed')),
      restoreWorkspace: vi.fn().mockRejectedValue(new Error('permission revoked')),
    }

    await expect(rememberNativeWorkspace('file:///vault', module)).resolves.toBe(false)
    await expect(restoreNativeWorkspace(module)).resolves.toBeNull()
  })
})
