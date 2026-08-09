export type PresetId = 'sunset' | 'drive' | 'poolside'

export interface PresetInfo {
  id: PresetId
  label: string
  blurb: string
}

interface StepContext {
  ctx: AudioContext
  bus: GainNode
  step: number
  beat: number
  chord: number[]
  time: number
  stepDur: number
}

interface Preset extends PresetInfo {
  bpm: number
  gain: number
  chords: number[][]
  step: (c: StepContext) => void
}

const STEPS_PER_BAR = 16
const LOOKAHEAD_MS = 25
const SCHEDULE_AHEAD_S = 0.12
const SILENT = 0.0001

function hz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12)
}

const noiseCache = new WeakMap<AudioContext, AudioBuffer>()

function noiseBuffer(ctx: AudioContext): AudioBuffer {
  const cached = noiseCache.get(ctx)
  if (cached) return cached

  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.random() * 2 - 1
  }
  noiseCache.set(ctx, buffer)
  return buffer
}

interface ToneOptions {
  midi: number
  time: number
  dur: number
  type?: OscillatorType
  peak?: number
  attack?: number
  detune?: number
  cutoff?: number
  cutoffEnd?: number
}

function tone(ctx: AudioContext, dest: AudioNode, o: ToneOptions): void {
  const { time, dur } = o
  const attack = o.attack ?? 0.01
  const peak = o.peak ?? 0.25

  const osc = ctx.createOscillator()
  osc.type = o.type ?? 'triangle'
  osc.frequency.value = hz(o.midi)
  if (o.detune) osc.detune.value = o.detune

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(SILENT, time)
  gain.gain.exponentialRampToValueAtTime(peak, time + attack)
  gain.gain.exponentialRampToValueAtTime(SILENT, time + dur)

  let source: AudioNode = osc
  if (o.cutoff) {
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(o.cutoff, time)
    if (o.cutoffEnd) {
      filter.frequency.exponentialRampToValueAtTime(o.cutoffEnd, time + dur)
    }
    filter.Q.value = 0.9
    osc.connect(filter)
    source = filter
  }

  source.connect(gain)
  gain.connect(dest)
  osc.start(time)
  osc.stop(time + dur + 0.05)
}

function percussion(
  ctx: AudioContext,
  dest: AudioNode,
  time: number,
  dur: number,
  peak: number,
  highpass: number,
): void {
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer(ctx)
  src.playbackRate.value = 1 + Math.random() * 0.1

  const filter = ctx.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = highpass

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(SILENT, time)
  gain.gain.exponentialRampToValueAtTime(peak, time + 0.004)
  gain.gain.exponentialRampToValueAtTime(SILENT, time + dur)

  src.connect(filter)
  filter.connect(gain)
  gain.connect(dest)
  src.start(time)
  src.stop(time + dur + 0.05)
}

function kick(ctx: AudioContext, dest: AudioNode, time: number, peak: number): void {
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(130, time)
  osc.frequency.exponentialRampToValueAtTime(46, time + 0.11)

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(SILENT, time)
  gain.gain.exponentialRampToValueAtTime(peak, time + 0.006)
  gain.gain.exponentialRampToValueAtTime(SILENT, time + 0.26)

  osc.connect(gain)
  gain.connect(dest)
  osc.start(time)
  osc.stop(time + 0.3)
}

/** Stacked, slightly detuned chord voices for a warm analog pad. */
function padChord(c: StepContext, peak: number, cutoff: number): void {
  const dur = c.stepDur * STEPS_PER_BAR * 1.02
  c.chord.forEach((midi, i) => {
    for (const detune of [-6, 6]) {
      tone(c.ctx, c.bus, {
        midi,
        time: c.time,
        dur,
        type: 'sawtooth',
        peak: peak / (i + 1.6),
        attack: dur * 0.35,
        detune,
        cutoff,
        cutoffEnd: cutoff * 0.7,
      })
    }
  })
}

/** Walks chord tones upward, wrapping into higher octaves. */
function chordTone(chord: number[], index: number): number {
  return chord[index % chord.length] + 12 * Math.floor(index / chord.length)
}

const PRESETS: Preset[] = [
  {
    id: 'sunset',
    label: 'Sunset Cruise',
    blurb: 'Warm major chords, slow and easy',
    bpm: 74,
    gain: 0.5,
    chords: [
      [53, 60, 64, 69],
      [57, 64, 67, 72],
      [58, 65, 69, 74],
      [60, 67, 69, 76],
    ],
    step(c) {
      const { ctx, bus, beat, chord, time, stepDur } = c

      if (beat === 0) {
        padChord(c, 0.16, 1500)
        tone(ctx, bus, {
          midi: chord[0] - 12,
          time,
          dur: stepDur * 10,
          type: 'sine',
          peak: 0.3,
          attack: 0.05,
        })
      }

      const bells = [0, 3, 6, 10, 12]
      const slot = bells.indexOf(beat)
      if (slot !== -1) {
        tone(ctx, bus, {
          midi: chordTone(chord, slot + 1) + 12,
          time,
          dur: 1.4,
          type: 'triangle',
          peak: 0.14,
          attack: 0.012,
          cutoff: 3800,
          cutoffEnd: 1200,
        })
      }
    },
  },
  {
    id: 'drive',
    label: 'Neon Drive',
    blurb: 'Uptempo synthwave with a pulse',
    bpm: 106,
    gain: 0.42,
    chords: [
      [53, 57, 60, 65],
      [52, 55, 60, 64],
      [50, 57, 60, 65],
      [46, 53, 58, 62],
    ],
    step(c) {
      const { ctx, bus, beat, chord, time, stepDur } = c

      if (beat === 0) padChord(c, 0.1, 1900)

      if (beat % 4 === 0) kick(ctx, bus, time, 0.5)
      if (beat === 4 || beat === 12) percussion(ctx, bus, time, 0.16, 0.16, 1800)
      if (beat % 2 === 1) percussion(ctx, bus, time, 0.045, 0.055, 9000)

      if (beat % 2 === 0) {
        tone(ctx, bus, {
          midi: chord[0] - 12,
          time,
          dur: stepDur * 1.7,
          type: 'sawtooth',
          peak: 0.32,
          attack: 0.008,
          cutoff: 900,
          cutoffEnd: 380,
        })
      }

      tone(ctx, bus, {
        midi: chordTone(chord, beat % 8) + 12,
        time,
        dur: stepDur * 1.5,
        type: 'square',
        peak: 0.075,
        attack: 0.006,
        cutoff: 3400,
        cutoffEnd: 1500,
      })
    },
  },
  {
    id: 'poolside',
    label: 'Poolside',
    blurb: 'Bright tropical plucks and shakers',
    bpm: 94,
    gain: 0.55,
    chords: [
      [48, 60, 64, 67, 71],
      [53, 60, 65, 69, 72],
      [55, 62, 67, 71, 74],
      [48, 60, 64, 67, 72],
    ],
    step(c) {
      const { ctx, bus, beat, chord, time, stepDur } = c

      if (beat === 0) {
        padChord(c, 0.075, 2400)
        tone(ctx, bus, {
          midi: chord[0] - 12,
          time,
          dur: stepDur * 7,
          type: 'sine',
          peak: 0.26,
          attack: 0.04,
        })
      }

      const marimba = [0, 2, 5, 7, 8, 11, 13]
      const slot = marimba.indexOf(beat)
      if (slot !== -1) {
        tone(ctx, bus, {
          midi: chordTone(chord, slot + 1) + 12,
          time,
          dur: 0.75,
          type: 'triangle',
          peak: 0.2,
          attack: 0.005,
          cutoff: 4200,
          cutoffEnd: 1400,
        })
      }

      if (beat % 4 === 2) percussion(ctx, bus, time, 0.07, 0.075, 7000)
      if (beat === 8) percussion(ctx, bus, time, 0.14, 0.05, 3200)
    },
  },
]

export const PRESET_LIST: PresetInfo[] = PRESETS.map(({ id, label, blurb }) => ({
  id,
  label,
  blurb,
}))

export class AmbientEngine {
  private ctx: AudioContext | null = null
  private bus: GainNode | null = null
  private timer = 0
  private step = 0
  private nextTime = 0
  private preset: Preset | null = null
  private volume = 0.6

  async play(id: PresetId): Promise<void> {
    const preset = PRESETS.find((p) => p.id === id)
    if (!preset) return

    const ctx = this.ensureContext()
    await ctx.resume()

    this.preset = preset
    this.step = 0
    this.nextTime = ctx.currentTime + 0.08
    this.fadeTo(preset.gain * this.volume)

    if (!this.timer) {
      this.timer = window.setInterval(() => this.tick(), LOOKAHEAD_MS)
    }
  }

  stop(): void {
    this.fadeTo(0)
    window.clearInterval(this.timer)
    this.timer = 0
    this.preset = null
  }

  setVolume(volume: number): void {
    this.volume = volume
    if (this.preset) this.fadeTo(this.preset.gain * volume)
  }

  dispose(): void {
    window.clearInterval(this.timer)
    this.timer = 0
    this.preset = null
    void this.ctx?.close()
    this.ctx = null
    this.bus = null
  }

  private ensureContext(): AudioContext {
    if (this.ctx && this.bus) return this.ctx

    const ctx = new AudioContext()
    const bus = ctx.createGain()
    bus.gain.value = 0
    bus.connect(ctx.destination)

    this.ctx = ctx
    this.bus = bus
    return ctx
  }

  private fadeTo(value: number): void {
    if (!this.ctx || !this.bus) return
    const now = this.ctx.currentTime
    this.bus.gain.cancelScheduledValues(now)
    this.bus.gain.setValueAtTime(this.bus.gain.value, now)
    this.bus.gain.linearRampToValueAtTime(value, now + 0.5)
  }

  private tick(): void {
    const { ctx, bus, preset } = this
    if (!ctx || !bus || !preset) return

    const stepDur = 60 / preset.bpm / 4

    while (this.nextTime < ctx.currentTime + SCHEDULE_AHEAD_S) {
      const bar = Math.floor(this.step / STEPS_PER_BAR) % preset.chords.length
      preset.step({
        ctx,
        bus,
        step: this.step,
        beat: this.step % STEPS_PER_BAR,
        chord: preset.chords[bar],
        time: this.nextTime,
        stepDur,
      })
      this.nextTime += stepDur
      this.step += 1
    }
  }
}
