import ExpoModulesCore
import Foundation
import UIKit
import UniformTypeIdentifiers

private let managedWorkspaceDirectoryName = "Tolaria Vault"
private let managedWorkspaceLabelKey = "tolaria.workspace.label"

private final class WorkspacePickerDelegate: NSObject, UIDocumentPickerDelegate,
  UIAdaptivePresentationControllerDelegate {
  private let onCancel: () -> Void
  private let onPick: (URL) -> Void

  init(onCancel: @escaping () -> Void, onPick: @escaping (URL) -> Void) {
    self.onCancel = onCancel
    self.onPick = onPick
  }

  func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
    guard let source = urls.first else {
      onCancel()
      return
    }
    onPick(source)
  }

  func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
    onCancel()
  }

  func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
    onCancel()
  }
}

private struct WorkspacePickerContext {
  let delegate: WorkspacePickerDelegate
  let promise: Promise
}

public class TolariaWorkspaceAccessModule: Module {
  private var pickerContext: WorkspacePickerContext?

  public func definition() -> ModuleDefinition {
    Name("TolariaWorkspaceAccess")

    AsyncFunction("importWorkspace") { (uri: String) -> [String: String]? in
      return self.importWorkspace(uri)
    }

    AsyncFunction("pickAndImportWorkspace") { (promise: Promise) in
      self.presentWorkspacePicker(promise)
    }.runOnQueue(.main)

    AsyncFunction("restoreWorkspace") { () -> [String: String]? in
      return self.restoreWorkspace()
    }
  }

  private func importWorkspace(_ uri: String) -> [String: String]? {
    guard let source = URL(string: uri), source.isFileURL else { return nil }

    let usesSecurityScope = source.startAccessingSecurityScopedResource()
    defer {
      if usesSecurityScope {
        source.stopAccessingSecurityScopedResource()
      }
    }
    guard usesSecurityScope || FileManager.default.isReadableFile(atPath: source.path) else {
      return nil
    }

    return copyWorkspace(from: source)
  }

  private func copyWorkspace(from source: URL) -> [String: String]? {
    let label = source.deletingPathExtension().lastPathComponent
    guard !label.isEmpty else { return nil }

    do {
      let managed = try managedWorkspaceURL()
      if source.standardizedFileURL == managed.standardizedFileURL {
        UserDefaults.standard.set(label, forKey: managedWorkspaceLabelKey)
        return workspaceRecord(uri: managed.absoluteString, label: label)
      }
      let staging = managed.deletingLastPathComponent()
        .appendingPathComponent(".tolaria-import-\(UUID().uuidString)", isDirectory: true)
      defer { try? FileManager.default.removeItem(at: staging) }
      try FileManager.default.copyItem(at: source, to: staging)
      try replaceManagedWorkspace(at: managed, with: staging)
      UserDefaults.standard.set(label, forKey: managedWorkspaceLabelKey)
      return workspaceRecord(uri: managed.absoluteString, label: label)
    } catch {
      return nil
    }
  }

  private func presentWorkspacePicker(_ promise: Promise) {
    guard pickerContext == nil else {
      promise.resolve(nil)
      return
    }
    guard let currentViewController = appContext?.utilities?.currentViewController() else {
      promise.resolve(nil)
      return
    }

    let picker = UIDocumentPickerViewController(
      forOpeningContentTypes: [.folder],
      asCopy: false
    )
    let delegate = WorkspacePickerDelegate(
      onCancel: { [weak self] in self?.cancelWorkspacePicker() },
      onPick: { [weak self] source in self?.importPickedWorkspace(source) }
    )
    picker.allowsMultipleSelection = false
    if UIDevice.current.userInterfaceIdiom == .pad {
      let viewFrame = currentViewController.view.frame
      picker.popoverPresentationController?.sourceRect = CGRect(
        x: viewFrame.midX,
        y: viewFrame.maxY,
        width: 0,
        height: 0
      )
      picker.popoverPresentationController?.sourceView = currentViewController.view
      picker.modalPresentationStyle = .pageSheet
    }
    picker.delegate = delegate
    picker.presentationController?.delegate = delegate

    pickerContext = WorkspacePickerContext(delegate: delegate, promise: promise)
    currentViewController.present(picker, animated: true)
  }

  private func importPickedWorkspace(_ source: URL) {
    guard let promise = takePickerPromise() else { return }
    let usesSecurityScope = source.startAccessingSecurityScopedResource()
    guard usesSecurityScope || FileManager.default.isReadableFile(atPath: source.path) else {
      promise.resolve(nil)
      return
    }

    DispatchQueue.global(qos: .userInitiated).async {
      let record = self.copyWorkspace(from: source)
      if usesSecurityScope {
        source.stopAccessingSecurityScopedResource()
      }
      promise.resolve(record)
    }
  }

  private func cancelWorkspacePicker() {
    takePickerPromise()?.resolve(nil)
  }

  private func takePickerPromise() -> Promise? {
    let promise = pickerContext?.promise
    pickerContext = nil
    return promise
  }

  private func restoreWorkspace() -> [String: String]? {
    guard let label = UserDefaults.standard.string(forKey: managedWorkspaceLabelKey) else {
      return nil
    }
    guard let managed = try? managedWorkspaceURL() else { return nil }
    guard FileManager.default.isReadableFile(atPath: managed.path) else { return nil }
    return workspaceRecord(uri: managed.absoluteString, label: label)
  }

  private func managedWorkspaceURL() throws -> URL {
    let documents = try FileManager.default.url(
      for: .documentDirectory,
      in: .userDomainMask,
      appropriateFor: nil,
      create: true
    )
    return documents.appendingPathComponent(managedWorkspaceDirectoryName, isDirectory: true)
  }

  private func replaceManagedWorkspace(at managed: URL, with staging: URL) throws {
    let fileManager = FileManager.default
    let backup = managed.deletingLastPathComponent()
      .appendingPathComponent(".tolaria-backup-\(UUID().uuidString)", isDirectory: true)
    let hadManagedWorkspace = fileManager.fileExists(atPath: managed.path)

    if hadManagedWorkspace {
      try fileManager.moveItem(at: managed, to: backup)
    }

    do {
      try fileManager.moveItem(at: staging, to: managed)
      if hadManagedWorkspace {
        try? fileManager.removeItem(at: backup)
      }
    } catch {
      try? fileManager.removeItem(at: staging)
      if hadManagedWorkspace {
        try? fileManager.moveItem(at: backup, to: managed)
      }
      throw error
    }
  }

  private func workspaceRecord(uri: String, label: String) -> [String: String] {
    return ["label": label, "uri": uri]
  }
}
