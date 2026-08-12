import ExpoModulesCore
import Foundation

private let workspaceBookmarkKey = "tolaria.workspace.bookmark"

public class TolariaWorkspaceAccessModule: Module {
  private var activeURL: URL?

  public func definition() -> ModuleDefinition {
    Name("TolariaWorkspaceAccess")

    AsyncFunction("rememberWorkspace") { (uri: String) -> Bool in
      return self.rememberWorkspace(uri)
    }

    AsyncFunction("restoreWorkspace") { () -> String? in
      return self.restoreWorkspace()
    }

    OnDestroy {
      self.releaseActiveWorkspace()
    }
  }

  private func rememberWorkspace(_ uri: String) -> Bool {
    guard let url = URL(string: uri), url.isFileURL else { return false }

    do {
      let bookmark = try url.bookmarkData()
      UserDefaults.standard.set(bookmark, forKey: workspaceBookmarkKey)
      replaceActiveWorkspace(with: url)
      return true
    } catch {
      url.stopAccessingSecurityScopedResource()
      return false
    }
  }

  private func restoreWorkspace() -> String? {
    guard let bookmark = UserDefaults.standard.data(forKey: workspaceBookmarkKey) else {
      return nil
    }

    do {
      var isStale = false
      let url = try URL(
        resolvingBookmarkData: bookmark,
        options: [],
        relativeTo: nil,
        bookmarkDataIsStale: &isStale
      )
      guard url.startAccessingSecurityScopedResource() else { return nil }

      do {
        if isStale {
          UserDefaults.standard.set(try url.bookmarkData(), forKey: workspaceBookmarkKey)
        }
        replaceActiveWorkspace(with: url)
        return url.absoluteString
      } catch {
        url.stopAccessingSecurityScopedResource()
        return nil
      }
    } catch {
      return nil
    }
  }

  private func replaceActiveWorkspace(with url: URL) {
    activeURL?.stopAccessingSecurityScopedResource()
    activeURL = url
  }

  private func releaseActiveWorkspace() {
    activeURL?.stopAccessingSecurityScopedResource()
    activeURL = nil
  }
}
