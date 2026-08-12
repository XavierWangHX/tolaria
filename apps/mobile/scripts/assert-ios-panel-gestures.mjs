#!/usr/bin/env node
/* global console, process, setTimeout */

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { simulatorWindowTargetPoint } from '../src/qa/nativeSimulatorWindowGeometry.ts'
import {
  mobileLaunchSearchArgumentName,
  mobileLaunchSearchEnvironmentName,
} from '../src/native/mobileNativeKeyCommandsContract.ts'

const defaultBundleId = 'com.tolaria.mobile.dev'
const leftHideRail = 'tablet-left-chrome-hide-rail'
const leftRevealRail = 'tablet-left-chrome-reveal-rail'
const propertiesHideRail = 'tablet-properties-hide-rail'
const propertiesRevealRail = 'tablet-properties-reveal-rail'

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    ...options,
  })
  if (result.status === 0) return result.stdout
  const detail = result.stderr.trim() || result.stdout.trim() || `exit ${result.status}`
  throw new Error(`${command} ${args.join(' ')} failed: ${detail}`)
}

function readOption(args, name, fallback) {
  const index = args.indexOf(name)
  if (index === -1) return fallback
  const value = args[index + 1]
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`)
  return value
}

function bootedDevices() {
  const parsed = JSON.parse(run('xcrun', ['simctl', 'list', 'devices', 'booted', '--json']))
  return Object.values(parsed.devices ?? {}).flat()
}

function selectDevice(requestedDevice) {
  if (requestedDevice) return requestedDevice
  const devices = bootedDevices()
  const selected = devices.find((device) => device.name?.toLowerCase().includes('ipad')) ?? devices[0]
  if (!selected?.udid) throw new Error('No booted iOS Simulator found.')
  return selected.udid
}

function deviceName(device) {
  const selected = bootedDevices().find((candidate) => candidate.udid === device)
  if (!selected?.name) throw new Error(`Unable to find booted Simulator device ${device}`)
  return selected.name
}

function axePath() {
  const configured = process.env.MOBILE_QA_AXE_PATH ?? process.env.XCODEBUILDMCP_AXE_PATH
  if (configured) return configured

  const cacheRoot = run('npm', ['config', 'get', 'cache']).trim()
  const npxRoot = join(cacheRoot, '_npx')
  if (!existsSync(npxRoot)) throw new Error('AXe is unavailable. Set MOBILE_QA_AXE_PATH.')
  const candidates = readdirSync(npxRoot)
    .map((entry) => join(npxRoot, entry, 'node_modules', 'xcodebuildmcp', 'bundled', 'axe'))
    .filter(existsSync)
    .sort((left, right) => statSync(right).mtimeMs - statSync(left).mtimeMs)
  if (!candidates[0]) throw new Error('AXe is unavailable. Set MOBILE_QA_AXE_PATH.')
  return candidates[0]
}

function describeUi(device) {
  return JSON.parse(run(axePath(), ['describe-ui', '--udid', device]))
}

function visitNodes(nodes, visit) {
  for (const node of nodes) {
    visit(node)
    if (Array.isArray(node.children)) visitNodes(node.children, visit)
  }
}

function findElement(nodes, testId) {
  const matches = []
  visitNodes(nodes, (node) => {
    if (node.AXUniqueId === testId && node.frame) matches.push(node)
  })
  if (matches.length !== 1) throw new Error(`Expected one ${testId} target, found ${matches.length}`)
  return matches[0]
}

function assertElementAbsent(nodes, testId) {
  let count = 0
  visitNodes(nodes, (node) => {
    if (node.AXUniqueId === testId) count += 1
  })
  if (count !== 0) throw new Error(`Expected ${testId} to be absent, found ${count}`)
}

function logicalScreen(nodes) {
  const application = nodes.find((node) => node.role_description === 'application' && node.frame)
  if (!application) throw new Error('Unable to resolve the logical Simulator screen.')
  if (application.frame.width <= application.frame.height) {
    throw new Error('Panel gesture QA requires the iPad Simulator in landscape orientation.')
  }
  return application.frame
}

function simulatorSurface(name) {
  const escapedName = name.replaceAll('\\', '\\\\').replaceAll('"', '\\"')
  const output = run('osascript', ['-e', `
    tell application "Simulator" to activate
    tell application "System Events"
      tell process "Simulator"
        set frontmost to true
        repeat with candidateWindow in windows
          if ((name of candidateWindow) as text) starts with "${escapedName}" then
            perform action "AXRaise" of candidateWindow
            repeat with candidateElement in UI elements of candidateWindow
              if role of candidateElement is "AXGroup" then
                set surfacePosition to position of candidateElement
                set surfaceSize to size of candidateElement
                return ((item 1 of surfacePosition) as text) & "," & ((item 2 of surfacePosition) as text) & "," & ((item 1 of surfaceSize) as text) & "," & ((item 2 of surfaceSize) as text)
              end if
            end repeat
          end if
        end repeat
        error "No Simulator display surface found for ${escapedName}"
      end tell
    end tell
  `])
  const [x, y, width, height] = output.trim().split(',').map(Number)
  return { height, width, x, y }
}

function dragBinaryPath() {
  const directory = join(tmpdir(), 'tolaria-mobile-qa')
  const sourcePath = join(directory, 'drag-simulator.swift')
  const binaryPath = join(directory, 'drag-simulator')
  if (existsSync(binaryPath)) return binaryPath

  mkdirSync(directory, { recursive: true })
  writeFileSync(sourcePath, dragSource())
  run('swiftc', [sourcePath, '-o', binaryPath])
  return binaryPath
}

function dragSource() {
  return `
    import CoreGraphics
    import Darwin

    guard CommandLine.arguments.count == 5,
      let startX = Double(CommandLine.arguments[1]),
      let startY = Double(CommandLine.arguments[2]),
      let endX = Double(CommandLine.arguments[3]),
      let endY = Double(CommandLine.arguments[4]) else {
      exit(2)
    }

    let steps = 100
    func post(_ type: CGEventType, _ x: Double, _ y: Double) {
      CGEvent(
        mouseEventSource: nil,
        mouseType: type,
        mouseCursorPosition: CGPoint(x: x, y: y),
        mouseButton: .left
      )?.post(tap: .cghidEventTap)
    }

    post(.mouseMoved, startX, startY)
    usleep(150_000)
    post(.leftMouseDown, startX, startY)
    for index in 1...steps {
      let progress = Double(index) / Double(steps)
      post(
        .leftMouseDragged,
        startX + (endX - startX) * progress,
        startY + (endY - startY) * progress
      )
      usleep(10_000)
    }
    post(.leftMouseUp, endX, endY)
  `
}

function dragRail({ deltaX, device, name, testId }) {
  const ui = describeUi(device)
  const screen = logicalScreen(ui)
  const surface = simulatorSurface(name)
  const target = findElement(ui, testId).frame
  const start = simulatorWindowTargetPoint({ logicalScreen: screen, simulatorSurface: surface, target })
  const destination = {
    ...target,
    x: Math.max(screen.x, Math.min(screen.x + screen.width - target.width, target.x + deltaX)),
  }
  const end = simulatorWindowTargetPoint({ logicalScreen: screen, simulatorSurface: surface, target: destination })
  run(dragBinaryPath(), [String(start.x), String(start.y), String(end.x), String(end.y)])
}

function launchFixture(device, bundleId) {
  const search = '?source=fixture&tabletPanels=all&selectedNote=workflow-orchestration&qaRun=panel-gestures'
  run('xcrun', [
    'simctl',
    'launch',
    '--terminate-running-process',
    device,
    bundleId,
    mobileLaunchSearchArgumentName,
    search,
  ], {
    env: { ...process.env, [`SIMCTL_CHILD_${mobileLaunchSearchEnvironmentName}`]: search },
  })
}

async function assertTransition({ deltaX, device, expected, hidden, name, rail }) {
  dragRail({ deltaX, device, name, testId: rail })
  await new Promise((resolveDelay) => setTimeout(resolveDelay, 2200))
  const ui = describeUi(device)
  findElement(ui, expected)
  assertElementAbsent(ui, hidden)
}

async function main() {
  const args = process.argv.slice(2)
  const device = selectDevice(readOption(args, '--device', process.env.MOBILE_QA_SIMULATOR_UDID))
  const bundleId = readOption(args, '--bundle-id', process.env.MOBILE_QA_APP_BUNDLE_ID ?? defaultBundleId)
  const name = deviceName(device)

  launchFixture(device, bundleId)
  await new Promise((resolveDelay) => setTimeout(resolveDelay, 6000))
  findElement(describeUi(device), leftHideRail)

  await assertTransition({ deltaX: -240, device, expected: leftRevealRail, hidden: leftHideRail, name, rail: leftHideRail })
  await assertTransition({ deltaX: 240, device, expected: leftHideRail, hidden: leftRevealRail, name, rail: leftRevealRail })
  await assertTransition({ deltaX: 240, device, expected: propertiesRevealRail, hidden: propertiesHideRail, name, rail: propertiesHideRail })
  await assertTransition({ deltaX: -240, device, expected: propertiesHideRail, hidden: propertiesRevealRail, name, rail: propertiesRevealRail })

  console.log(JSON.stringify({ bundleId, device, status: 'passed', transitions: 4 }))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
