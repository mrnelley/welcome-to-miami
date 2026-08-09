interface SMCXWindow extends Window {
  SMCX?: unknown[] & { show?: () => void }
}

export async function openSurveyMonkeyPopup(): Promise<void> {
  const { SURVEY_SCRIPT_ID, SURVEY_SCRIPT_SRC } = await import('./surveyMonkey')
  const win = window as SMCXWindow
  win.SMCX = win.SMCX ?? []

  if (!document.getElementById(SURVEY_SCRIPT_ID)) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.id = SURVEY_SCRIPT_ID
      script.src = SURVEY_SCRIPT_SRC
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Survey failed to load'))
      document.body.appendChild(script)
    })

    // Popup collectors with "show immediately" behavior open on script load.
    await new Promise((resolve) => setTimeout(resolve, 600))
  }

  const smcx = win.SMCX
  if (smcx && typeof smcx.show === 'function') {
    smcx.show()
  }
}
