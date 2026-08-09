type SmcxGlobal = unknown[] & {
  boot?: () => void
  destroy?: () => void
}

interface SMCXWindow extends Window {
  SMCX?: SmcxGlobal
}

const POLL_MS = 100
const MAX_WAIT_MS = 12000

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** SurveyMonkey won't re-show the modal if this cookie exists (see SDK isShowable). */
function clearSurveyShowCookies(): void {
  document.cookie.split(';').forEach((entry) => {
    const name = entry.split('=')[0]?.trim()
    if (!name?.startsWith('smcx_') || !name.endsWith('_last_shown_at')) return
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure`
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
  })
}

function initSmcxQueue(win: SMCXWindow): void {
  if (!win.SMCX) {
    win.SMCX = [] as unknown as SmcxGlobal
  }
}

/** Match the user's original SurveyMonkey embed snippet exactly. */
function injectSurveyScript(scriptId: string, scriptSrc: string): void {
  if (document.getElementById(scriptId)) return

  const scripts = document.getElementsByTagName('script')
  const anchor = scripts[scripts.length - 1]
  const script = document.createElement('script')
  script.type = 'text/javascript'
  script.async = true
  script.id = scriptId
  script.src = scriptSrc
  anchor.parentNode?.insertBefore(script, anchor)
}

function resetSurveyEmbed(scriptId: string): void {
  const win = window as SMCXWindow
  win.SMCX?.destroy?.()

  document.getElementById(scriptId)?.remove()
  document.querySelectorAll('.smcx-widget, .smcx-style, #__smcx__').forEach((node) => node.remove())

  win.SMCX = [] as unknown as SmcxGlobal
}

function revealSurveyWidget(): boolean {
  const widget = document.querySelector('.smcx-widget') as HTMLElement | null
  if (!widget) return false

  widget.classList.remove('smcx-hide', 'smcx-transparent')
  widget.classList.add('smcx-show', 'smcx-opaque')
  widget.style.removeProperty('display')
  widget.style.removeProperty('visibility')
  widget.style.removeProperty('opacity')

  const width = widget.getBoundingClientRect().width
  return width > 0
}

async function waitForSurveyWidget(): Promise<boolean> {
  const deadline = Date.now() + MAX_WAIT_MS
  while (Date.now() < deadline) {
    if (revealSurveyWidget()) return true
    await wait(POLL_MS)
  }
  return revealSurveyWidget()
}

export async function openSurveyMonkeyPopup(): Promise<void> {
  const { SURVEY_SCRIPT_ID, SURVEY_SCRIPT_SRC } = await import('./surveyMonkey')
  const win = window as SMCXWindow

  clearSurveyShowCookies()

  // Already visible — nothing to do
  const visible = document.querySelector('.smcx-widget.smcx-show')
  if (visible && visible.getBoundingClientRect().width > 0) return

  initSmcxQueue(win)

  const scriptPresent = Boolean(document.getElementById(SURVEY_SCRIPT_ID))

  if (!scriptPresent) {
    injectSurveyScript(SURVEY_SCRIPT_ID, SURVEY_SCRIPT_SRC)
  } else {
    // Script loaded earlier — boot again after clearing the show cookie
    win.SMCX?.boot?.()
  }

  if (await waitForSurveyWidget()) return

  // Stale embed state — hard reset once and retry
  resetSurveyEmbed(SURVEY_SCRIPT_ID)
  initSmcxQueue(win)
  injectSurveyScript(SURVEY_SCRIPT_ID, SURVEY_SCRIPT_SRC)

  if (await waitForSurveyWidget()) return

  throw new Error('Survey widget did not appear')
}
