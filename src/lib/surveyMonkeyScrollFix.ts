const STYLE_ID = 'smcx-scroll-fix-styles'

const SCROLL_FIX_CSS = `
  .smcx-widget,
  .smcx-widget.smcx-show {
    max-width: min(960px, calc(100vw - 2rem)) !important;
    width: auto !important;
    box-sizing: border-box !important;
  }
  .smcx-iframe-container {
    overflow-x: auto !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
    max-width: calc(100vw - 2rem) !important;
    box-sizing: border-box !important;
  }
  .smcx-iframe-container iframe {
    display: block !important;
    min-width: 720px !important;
    max-width: none !important;
    border: 0;
  }
  @media (max-width: 768px) {
    .smcx-widget,
    .smcx-widget.smcx-show {
      max-width: calc(100vw - 1rem) !important;
    }
    .smcx-iframe-container {
      max-width: calc(100vw - 1rem) !important;
    }
    .smcx-iframe-container iframe {
      min-width: 640px !important;
    }
  }
`

function ensureScrollFixStyles(): void {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = SCROLL_FIX_CSS
  document.head.appendChild(style)
}

function applyScrollFixToWidget(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('.smcx-iframe-container').forEach((container) => {
    container.style.overflowX = 'auto'
    container.style.overflowY = 'auto'
    container.style.setProperty('-webkit-overflow-scrolling', 'touch')

    const iframe = container.querySelector('iframe')
    if (iframe) {
      iframe.style.display = 'block'
      iframe.style.minWidth = window.matchMedia('(max-width: 768px)').matches ? '640px' : '720px'
      iframe.style.maxWidth = 'none'
    }
  })
}

let observer: MutationObserver | null = null

/** Re-apply when SurveyMonkey injects or resizes its popup markup. */
export function enableSurveyMonkeyScrollFix(): void {
  ensureScrollFixStyles()
  applyScrollFixToWidget()

  observer?.disconnect()
  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return
        if (node.matches('.smcx-widget, .smcx-iframe-container') || node.querySelector('.smcx-iframe-container')) {
          applyScrollFixToWidget(node)
        }
      })
    }
    applyScrollFixToWidget()
  })

  observer.observe(document.body, { childList: true, subtree: true })
}

export function disableSurveyMonkeyScrollFix(): void {
  observer?.disconnect()
  observer = null
}
