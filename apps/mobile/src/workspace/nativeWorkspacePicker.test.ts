import { describe, expect, it, vi } from 'vitest'
import {
  nativeWorkspaceSelectionFromDirectory,
  pickNativeWorkspaceDirectoryWithPicker,
  restoreNativeWorkspaceDirectory,
} from './nativeWorkspacePicker'
import type { NativeWorkspaceAccessModule } from './nativeWorkspaceAccess'

describe('native workspace picker', () => {
  it('builds native repository requests from picked directories', () => {
    expect(nativeWorkspaceSelectionFromDirectory({
      name: 'Laputa',
      uri: 'file:///Users/luca/Laputa/',
    })).toEqual({
      vaultAlias: 'laputa',
      vaultLabel: 'Laputa',
      vaultRootUri: 'file:///Users/luca/Laputa/',
    })
  })

  it('derives a decoded vault label when the picker omits a directory name', () => {
    expect(nativeWorkspaceSelectionFromDirectory({
      uri: 'file:///Users/luca/Work%20Vault/',
    })).toEqual({
      vaultAlias: 'work-vault',
      vaultLabel: 'Work Vault',
      vaultRootUri: 'file:///Users/luca/Work%20Vault/',
    })
  })

  it('treats picker cancellation as no selected vault', async () => {
    await expect(pickNativeWorkspaceDirectoryWithPicker(async () => {
      throw new Error('cancelled')
    })).resolves.toBeNull()
  })

  it('restores a bookmarked native workspace without reopening the picker', async () => {
    const module: NativeWorkspaceAccessModule = {
      rememberWorkspace: vi.fn(),
      restoreWorkspace: vi.fn().mockResolvedValue('file:///Users/luca/Work%20Vault/'),
    }

    await expect(restoreNativeWorkspaceDirectory(module)).resolves.toEqual({
      vaultAlias: 'work-vault',
      vaultLabel: 'Work Vault',
      vaultRootUri: 'file:///Users/luca/Work%20Vault/',
    })
  })
})
