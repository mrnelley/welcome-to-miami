import { useCallback, useEffect, useRef, useState } from 'react'

export function AudioToggle() {
  const [active, setActive] = useState(false)
  const ctxRef = useRef<AudioContext | null>(null)
  const nodesRef = useRef<{ stop: () => void } | null>(null)

  const stop = useCallback(() => {
    nodesRef.current?.stop()
    nodesRef.current = null
    void ctxRef.current?.close()
    ctxRef.current = null
  }, [])

  const start = useCallback(() => {
    const ctx = new AudioContext()
    ctxRef.current = ctx

    const master = ctx.createGain()
    master.gain.value = 0.04
    master.connect(ctx.destination)

    const pad = ctx.createOscillator()
    pad.type = 'sawtooth'
    pad.frequency.value = 55

    const padFilter = ctx.createBiquadFilter()
    padFilter.type = 'lowpass'
    padFilter.frequency.value = 420

    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.08
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 180
    lfo.connect(lfoGain)
    lfoGain.connect(padFilter.frequency)

    pad.connect(padFilter)
    padFilter.connect(master)

    const arp = ctx.createOscillator()
    arp.type = 'triangle'
    arp.frequency.value = 220
    const arpGain = ctx.createGain()
    arpGain.gain.value = 0.15
    arp.connect(arpGain)
    arpGain.connect(master)

    let step = 0
    const notes = [220, 261.63, 329.63, 392, 329.63, 261.63]
    const interval = window.setInterval(() => {
      arp.frequency.setTargetAtTime(notes[step % notes.length], ctx.currentTime, 0.08)
      step += 1
    }, 900)

    pad.start()
    lfo.start()
    arp.start()

    nodesRef.current = {
      stop: () => {
        window.clearInterval(interval)
        pad.stop()
        lfo.stop()
        arp.stop()
      },
    }
  }, [])

  useEffect(() => () => stop(), [stop])

  function toggle() {
    if (active) {
      stop()
      setActive(false)
      return
    }
    start()
    setActive(true)
  }

  return (
    <button
      type="button"
      className={`audio-toggle ${active ? 'audio-toggle--on' : ''}`}
      onClick={toggle}
      aria-pressed={active}
      aria-label={active ? 'Turn off ambient synth' : 'Turn on ambient synth'}
    >
      {active ? '♫ ON' : '♫ OFF'}
    </button>
  )
}
