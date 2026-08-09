import { useEffect, useRef, useState } from 'react'
import { AmbientEngine, PRESET_LIST, type PresetId } from '../lib/audioEngine'

export function AudioPanel() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<PresetId | null>(null)
  const [volume, setVolume] = useState(0.6)
  const engineRef = useRef<AmbientEngine | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const engine = new AmbientEngine()
    engineRef.current = engine
    return () => engine.dispose()
  }, [])

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function selectPreset(id: PresetId) {
    if (active === id) {
      engineRef.current?.stop()
      setActive(null)
      return
    }
    void engineRef.current?.play(id)
    setActive(id)
  }

  function stopAudio() {
    engineRef.current?.stop()
    setActive(null)
  }

  function changeVolume(next: number) {
    setVolume(next)
    engineRef.current?.setVolume(next)
  }

  const activeLabel = PRESET_LIST.find((p) => p.id === active)?.label

  return (
    <div className="audio-panel" ref={rootRef}>
      <div
        id="audio-panel-menu"
        className={`audio-panel__menu ${open ? 'audio-panel__menu--open' : ''}`}
        aria-hidden={!open}
        inert={!open}
      >
        <div className="audio-panel__corner audio-panel__corner--tl" aria-hidden="true" />
        <div className="audio-panel__corner audio-panel__corner--br" aria-hidden="true" />

        <p className="audio-panel__heading">Select a vibe</p>

        <div className="audio-panel__options" role="radiogroup" aria-label="Ambient soundtrack">
          {PRESET_LIST.map((preset) => {
            const isActive = active === preset.id
            return (
              <button
                key={preset.id}
                type="button"
                role="radio"
                aria-checked={isActive}
                className={`audio-option ${isActive ? 'audio-option--active' : ''}`}
                onClick={() => selectPreset(preset.id)}
              >
                <span className="audio-option__bars" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                <span className="audio-option__text">
                  <span className="audio-option__label">{preset.label}</span>
                  <span className="audio-option__blurb">{preset.blurb}</span>
                </span>
              </button>
            )
          })}

          <button
            type="button"
            role="radio"
            aria-checked={active === null}
            className={`audio-option audio-option--off ${active === null ? 'audio-option--active' : ''}`}
            onClick={stopAudio}
          >
            <span className="audio-option__bars audio-option__bars--muted" aria-hidden="true">
              <span />
            </span>
            <span className="audio-option__text">
              <span className="audio-option__label">Silence</span>
              <span className="audio-option__blurb">No soundtrack</span>
            </span>
          </button>
        </div>

        <label className="audio-panel__volume">
          <span className="audio-panel__volume-label">Volume</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(event) => changeVolume(Number(event.target.value))}
          />
        </label>
      </div>

      <button
        type="button"
        className={`audio-panel__trigger ${active ? 'audio-panel__trigger--on' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="audio-panel-menu"
      >
        <span className="audio-panel__icon" aria-hidden="true">
          ♫
        </span>
        <span className="audio-panel__trigger-text">{activeLabel ?? 'Sound'}</span>
      </button>
    </div>
  )
}
