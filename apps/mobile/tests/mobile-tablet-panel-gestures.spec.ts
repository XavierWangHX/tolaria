import { expect, test, type Page } from '@playwright/test'
import { desktopPanelParity } from '../src/ui/desktopParity'

test.describe('tablet panel gestures', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'tablet-landscape', 'Panel gestures use the full-width tablet layout.')
    await page.goto('/?tabletPanels=all')
  })

  test('directly drags both left panels away in one gesture', async ({ page }) => {
    await page.getByTestId('editor-properties-action').click()
    await page.waitForTimeout(500)
    await expectPropertiesVisible(page, false)

    const noteList = await requiredBox(page, 'note-list-panel')
    await swipeHorizontally(
      page,
      { x: noteList.x + noteList.width - 20, y: noteList.y + 200 },
      { x: noteList.x - desktopPanelParity.sidebarWidth + 20, y: noteList.y + 200 },
    )
    await page.waitForTimeout(500)

    const leftPanels = await requiredBox(page, 'tablet-left-panel-strip')
    const editor = await requiredBox(page, 'editor-panel')
    expect(leftPanels.x + leftPanels.width).toBeLessThanOrEqual(1)
    expect(editor.x).toBeLessThanOrEqual(1)
  })

  test('toggles Properties from the rightmost editor toolbar action', async ({ page }) => {
    const moreAction = await requiredBox(page, 'editor-more-action')
    const propertiesAction = await requiredBox(page, 'editor-properties-action')
    expect(propertiesAction.x).toBeGreaterThan(moreAction.x)

    await page.getByTestId('editor-properties-action').click()
    await page.waitForTimeout(500)
    await expectPropertiesVisible(page, false)
    await page.getByTestId('editor-properties-action').click()
    await page.waitForTimeout(500)
    await expectPropertiesVisible(page, true)
  })
})

async function requiredBox(page: Page, testId: string) {
  const box = await page.getByTestId(testId).boundingBox()
  if (!box) throw new Error(`Cannot measure missing ${testId}.`)
  return box
}

async function expectPropertiesVisible(page: Page, visible: boolean) {
  const viewport = page.viewportSize()
  if (!viewport) throw new Error('Cannot measure the mobile QA viewport.')
  const panel = await requiredBox(page, 'tablet-properties-panel-host')
  if (visible) expect(Math.abs(panel.x + panel.width - viewport.width)).toBeLessThanOrEqual(1)
  else expect(panel.x).toBeGreaterThanOrEqual(viewport.width - 1)
}

async function swipeHorizontally(
  page: Page,
  start: { x: number; y: number },
  end: { x: number; y: number },
) {
  const client = await page.context().newCDPSession(page)
  const midpoint = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }
  await client.send('Input.dispatchTouchEvent', { touchPoints: [start], type: 'touchStart' })
  await client.send('Input.dispatchTouchEvent', { touchPoints: [midpoint], type: 'touchMove' })
  await client.send('Input.dispatchTouchEvent', { touchPoints: [end], type: 'touchMove' })
  await client.send('Input.dispatchTouchEvent', { touchPoints: [], type: 'touchEnd' })
  await client.detach()
}
