import ExpoModulesCore
import UIKit

private let keyboardProbeLogPrefix = "TOLARIA_MOBILE_KEYBOARD_SHORTCUT_PROBE"
private let keyboardProbeEnvironmentName = "TOLARIA_MOBILE_KEYBOARD_SHORTCUT_PROBE"
private let mobileSearchEnvironmentName = "TOLARIA_MOBILE_SEARCH"

private struct TolariaKeyCommand {
  let action: String
  let altKey: Bool
  let code: String
  let ctrlKey: Bool
  let input: String
  let key: String
  let metaKey: Bool
  let modifierFlags: UIKeyModifierFlags
  let shiftKey: Bool
}

public struct TolariaApplicationKeyCommand {
  public let input: String
  public let modifierFlags: UIKeyModifierFlags
}

public class TolariaKeyCommandsModule: Module {
  private static weak var activeModule: TolariaKeyCommandsModule?
  private static let commands: [TolariaKeyCommand] = [
    TolariaKeyCommand(
      action: "commandPalette",
      altKey: false,
      code: "KeyK",
      ctrlKey: false,
      input: "k",
      key: "k",
      metaKey: true,
      modifierFlags: .command,
      shiftKey: false
    ),
    TolariaKeyCommand(
      action: "findInNote",
      altKey: false,
      code: "KeyF",
      ctrlKey: false,
      input: "f",
      key: "f",
      metaKey: true,
      modifierFlags: .command,
      shiftKey: false
    ),
    TolariaKeyCommand(
      action: "search",
      altKey: false,
      code: "KeyO",
      ctrlKey: false,
      input: "o",
      key: "o",
      metaKey: true,
      modifierFlags: .command,
      shiftKey: false
    ),
    TolariaKeyCommand(
      action: "search",
      altKey: false,
      code: "KeyP",
      ctrlKey: false,
      input: "p",
      key: "p",
      metaKey: true,
      modifierFlags: .command,
      shiftKey: false
    ),
    TolariaKeyCommand(
      action: "toggleRawEditor",
      altKey: false,
      code: "Backslash",
      ctrlKey: false,
      input: "\\",
      key: "\\",
      metaKey: true,
      modifierFlags: .command,
      shiftKey: false
    ),
    TolariaKeyCommand(
      action: "createNote",
      altKey: false,
      code: "KeyN",
      ctrlKey: false,
      input: "n",
      key: "n",
      metaKey: true,
      modifierFlags: .command,
      shiftKey: false
    ),
    TolariaKeyCommand(
      action: "previousNote",
      altKey: false,
      code: "ArrowUp",
      ctrlKey: false,
      input: UIKeyCommand.inputUpArrow,
      key: "ArrowUp",
      metaKey: false,
      modifierFlags: [],
      shiftKey: false
    ),
    TolariaKeyCommand(
      action: "nextNote",
      altKey: false,
      code: "ArrowDown",
      ctrlKey: false,
      input: UIKeyCommand.inputDownArrow,
      key: "ArrowDown",
      metaKey: false,
      modifierFlags: [],
      shiftKey: false
    )
  ]

  public func definition() -> ModuleDefinition {
    Name("TolariaKeyCommands")

    Events("onShortcut")

    Function("isSupported") {
      return true
    }

    Function("launchArguments") {
      return ProcessInfo.processInfo.arguments
    }

    Function("environmentValue") { (name: String) -> String? in
      return ProcessInfo.processInfo.environment[name]
    }

    OnStartObserving("onShortcut") {
      Self.activeModule = self
      var proof: [String: Any] = [
        "kind": "bridge",
        "nativeModuleAvailable": true
      ]
      if let qaRun = self.keyboardProbeRun() {
        proof["qaRun"] = qaRun
      }
      self.logKeyboardProbe(proof)
    }

    OnStopObserving("onShortcut") {
      if Self.activeModule === self {
        Self.activeModule = nil
      }
    }
  }

  public static func applicationKeyCommands() -> [TolariaApplicationKeyCommand] {
    return commands.map {
      TolariaApplicationKeyCommand(input: $0.input, modifierFlags: $0.modifierFlags)
    }
  }

  public static func dispatchApplicationKeyCommand(
    input: String?,
    modifierFlags: UIKeyModifierFlags
  ) {
    guard let input else { return }
    guard let command = commands.first(where: {
      $0.input == input && $0.modifierFlags == modifierFlags
    }) else { return }
    activeModule?.sendShortcut(command)
  }

  private func sendShortcut(_ command: TolariaKeyCommand) {
    logKeyboardProbe([
      "action": command.action,
      "altKey": command.altKey,
      "code": command.code,
      "ctrlKey": command.ctrlKey,
      "kind": "action",
      "key": command.key,
      "metaKey": command.metaKey,
      "shiftKey": command.shiftKey,
      "source": "native"
    ])
    sendEvent("onShortcut", [
      "action": command.action,
      "altKey": command.altKey,
      "code": command.code,
      "ctrlKey": command.ctrlKey,
      "key": command.key,
      "metaKey": command.metaKey,
      "shiftKey": command.shiftKey,
      "source": "native"
    ])
  }

  private func logKeyboardProbe(_ proof: [String: Any]) {
    guard keyboardProbeLoggingEnabled() else { return }

    guard
      let data = try? JSONSerialization.data(withJSONObject: proof),
      let json = String(data: data, encoding: .utf8)
    else {
      return
    }

    NSLog("%@ %@", keyboardProbeLogPrefix, json)
  }

  private func keyboardProbeLoggingEnabled() -> Bool {
    let environment = ProcessInfo.processInfo.environment

    return environment[keyboardProbeEnvironmentName] == "1"
      || environment[mobileSearchEnvironmentName]?.contains("mobileKeyboardShortcutProbe=1") == true
  }

  private func keyboardProbeRun() -> String? {
    guard let search = ProcessInfo.processInfo.environment[mobileSearchEnvironmentName] else { return nil }
    return URLComponents(string: "tolaria://qa?\(search)")?
      .queryItems?
      .first(where: { $0.name == "qaRun" })?
      .value
  }
}

public final class TolariaKeyCommandsReactDelegateHandler: ExpoReactDelegateHandler {
  public override func createRootViewController() -> UIViewController? {
    return TolariaKeyCommandsRootViewController()
  }
}

private final class TolariaKeyCommandsRootViewController: UIViewController {
  override var keyCommands: [UIKeyCommand]? {
    TolariaKeyCommandsModule.applicationKeyCommands().map { specification in
      let command = UIKeyCommand(
        input: specification.input,
        modifierFlags: specification.modifierFlags,
        action: #selector(handleTolariaKeyCommand(_:))
      )
      command.wantsPriorityOverSystemBehavior = true
      return command
    }
  }

  @objc private func handleTolariaKeyCommand(_ command: UIKeyCommand) {
    TolariaKeyCommandsModule.dispatchApplicationKeyCommand(
      input: command.input,
      modifierFlags: command.modifierFlags
    )
  }
}
