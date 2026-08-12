import { useCallback } from 'react'
import type { MobileAttachmentImport } from './mobileAttachments'
import {
  importMobileAttachment,
  readMobileAttachmentImportFromGlobal,
  type MobileAttachmentFileSystem,
  type MobileAttachmentImporterDependencies,
  type MobileDocumentPicker,
} from './mobileAttachmentImporterCore'

export {
  importMobileAttachment,
  MOBILE_ATTACHMENT_IMPORTS_GLOBAL_KEY,
  readMobileAttachmentImportFromGlobal,
  type MobileAttachmentFileSystem,
  type MobileAttachmentImporterDependencies,
  type MobileDocumentPicker,
  type MobileDocumentPickerAsset,
  type MobileDocumentPickerResult,
} from './mobileAttachmentImporterCore'

export type MobileAttachmentImporter = () => Promise<MobileAttachmentImport | null>

type NativeMobileAttachmentImportOptions = MobileAttachmentImporterDependencies & {
  readInjectedImport?: () => MobileAttachmentImport | null
  vaultRootUri?: string | null
}

type NativeDocumentPickerModule = {
  getDocumentAsync: MobileDocumentPicker
}

declare const require: (moduleName: string) => unknown

export function useMobileAttachmentImporter(vaultRootUri?: string | null): MobileAttachmentImporter {
  return useCallback(
    async () =>
      importNativeMobileAttachment({
        ...nativeMobileAttachmentDependencies(),
        vaultRootUri,
      }),
    [vaultRootUri],
  )
}

export async function importNativeMobileAttachment({
  readInjectedImport = readMobileAttachmentImportFromGlobal,
  ...options
}: NativeMobileAttachmentImportOptions): Promise<MobileAttachmentImport | null> {
  const injectedImport = readInjectedImport()
  return injectedImport ?? importMobileAttachment(options)
}

function nativeMobileAttachmentDependencies(): MobileAttachmentImporterDependencies {
  const documentPicker = require('expo-document-picker') as NativeDocumentPickerModule
  const fileSystem = require('expo-file-system/legacy') as MobileAttachmentFileSystem

  return {
    fileSystem,
    pickDocument: documentPicker.getDocumentAsync,
  }
}
