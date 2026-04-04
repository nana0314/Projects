import { useEffect, useRef } from 'react'
import type { GrowthStage, PetMood } from '../types'

interface Props {
  stage: GrowthStage
  mood: PetMood
  onClick: () => void
}

// ─── Color palette ───────────────────────────────────────────────────────────
const C: Record<string, string> = {
  ' ': 'transparent',
  K: '#1a0a3c',   // dark outline
  P: '#7c3aed',   // main purple body
  L: '#a78bfa',   // light purple
  H: '#ddd6fe',   // highlight
  W: '#f0f0f8',   // eye white
  E: '#1e1b4b',   // pupil
  B: '#fca5a5',   // blush pink
  G: '#fbbf24',   // gold
  S: '#60a5fa',   // shimmer blue
  T: '#34d399',   // teal
  R: '#f87171',   // red
  N: '#f59e0b',   // amber
}

// ─── Sprites per stage ───────────────────────────────────────────────────────
// Each char = 1 pixel, rendered at SCALE px each

const SPRITES: Record<GrowthStage, { frames: string[][] }> = {
  // Egg — wobbles slightly
  0: {
    frames: [
      [
        '   KKKKKK   ',
        '  KPPPPPPK  ',
        ' KPPLHPPPK  ',
        ' KPPLHPPPK  ',
        ' KPPPPPPPK  ',
        ' KPPPPPPPK  ',
        ' KPPPPPPPK  ',
        ' KPPPPPPPK  ',
        '  KPPPPPPK  ',
        '   KKKKKK   ',
      ],
      [
        '   KKKKKK   ',
        '  KPPPPPPK  ',
        ' KPPPLHPPK  ',
        ' KPPPLHPPK  ',
        ' KPPPPPPPK  ',
        ' KPPPPPPPK  ',
        ' KPPPPPPPK  ',
        ' KPPPPPPPK  ',
        '  KPPPPPPK  ',
        '   KKKKKK   ',
      ]
    ]
  },
  // Baby blob — tiny, big eyes
  1: {
    frames: [
      [
        '  KKKKKKKK  ',
        ' KPPPPPPPPK ',
        'KPPLLLPLLPK ',
        'KPPWHPWHPPK ',
        'KPPWEPWEPPK ',
        'KPPWHPWHPPK ',
        'KPPLLLPLLPK ',
        'KPPKPPPKPPK ',
        'KPBBPPPBBPK ',
        ' KPPPPPPPPK ',
        '  KKKKKKKK  ',
      ],
      [
        '   KKKKKK   ',
        ' KPPPPPPPPK ',
        'KPPLLLPLLPK ',
        'KPPWHPWHPPK ',
        'KPPWEPWEPPK ',
        'KPPWHPWHPPK ',
        'KPPLLLPLLPK ',
        'KPPKPPPKPPK ',
        'KPBBPPPBBPK ',
        ' KPPPPPPPPK ',
        '   KKKKKK   ',
      ]
    ]
  },
  // Child — slightly bigger, small arms
  2: {
    frames: [
      [
        '  KKKKKKKK  ',
        ' KPPPPPPPPK ',
        'KPPHLLPLLHPK',
        'KPPWHPPWHPPK',
        'KPPWEPPWEPPK',
        'KPPWHPPWHPPK',
        'KPPHLLPLLHPK',
        'KPPPKKKPPPK ',
        'KPBBBPBBBPK ',
        'KPPPPPPPPPK ',
        'KPKPPPPPKPK ',
        ' KKKKKKKK   ',
      ],
      [
        ' KKKKKKKKK  ',
        'KPPPPPPPPPK ',
        'KPPHLLPLLHPK',
        'KPPWHPPWHPPK',
        'KPPWEPPWEPPK',
        'KPPWHPPWHPPK',
        'KPPHLLPLLHPK',
        'KPPPKKKPPPK ',
        'KPBBBPBBBPK ',
        'KPPPPPPPPPK ',
        'KPKPPPPPKPK ',
        ' KKKKKKKK   ',
      ]
    ]
  },
  // Teen — taller, small horns
  3: {
    frames: [
      [
        ' KK  KKKKK  ',
        'KPKKKPPPPPK ',
        'KPPPPPPPPPK ',
        'KPPHLPPHLPK ',
        'KPPWHPPWHPK ',
        'KPPWEPPWEPK ',
        'KPPWHPPWHPK ',
        'KPPHLPPHLPK ',
        'KPPPKPKPPPK ',
        'KPBBBPBBBPK ',
        'KPPPPPPPPPPK',
        'KPK KKKK KPK',
        ' K    K    K',
      ],
      [
        '  KK KKKKK  ',
        ' KPKKKPPPPK ',
        'KPPPPPPPPPPK',
        'KPPHLPPHLPPK',
        'KPPWHPPWHPPK',
        'KPPWEPPWEPPK',
        'KPPWHPPWHPPK',
        'KPPHLPPHLPPK',
        'KPPPKPKPPPPK',
        'KPBBBPBBBPPK',
        'KPPPPPPPPPPPK',
        'KPK KKKK KPK',
        ' K    K    K',
      ]
    ]
  },
  // Adult — wings appear
  4: {
    frames: [
      [
        'K         K ',
        'KPKKKKKKKPK ',
        'KPPPPPPPPPK ',
        'KPPHLPPHLPK ',
        'SPPWHPPWHPPS',
        'SPPWEPPWEPPS',
        'SPPWHPPWHPPS',
        'KPPHLPPHLPK ',
        'KPPPKPKPPPK ',
        'KPBBBPBBBPK ',
        'KPPPPPPPPPPK',
        'KPKK   KKPK ',
        ' K       K  ',
      ],
      [
        'K         K ',
        'KPKKKKKKKPK ',
        ' KPPPPPPPK  ',
        'KPPHLPPHLPK ',
        'SSPPWHPPWHPSS',
        'SSPPWEPPWEPSS',
        'SSPPWHPPWHPSS',
        'KPPHLPPHLPK ',
        'KPPPKPKPPPK ',
        'KPBBBPBBBPK ',
        'KPPPPPPPPPPK',
        'KPKK   KKPK ',
        ' K       K  ',
      ]
    ]
  },
  // Legend — golden glow + crown
  5: {
    frames: [
      [
        ' G G G G G  ',
        'KGGGGGGGGGK ',
        'KPGPPPPPGPK ',
        'KPPHLPPHLPK ',
        'GPPWHPPWHPPG',
        'GPPWEPPWEPPG',
        'GPPWHPPWHPPG',
        'KPPHLPPHLPK ',
        'KPPPKPKPPPK ',
        'KPBBBPBBBPK ',
        'KPPPPPPPPPPK',
        'KPKK   KKPK ',
        ' K       K  ',
      ],
      [
        'G G G G G G ',
        'KGGGGGGGGGK ',
        'KPGPPPPPGPK ',
        'KPPHLPPHLPK ',
        'GPPWHPPWHPPG',
        'GPPWEPPWEPPG',
        'GPPWHPPWHPPG',
        'KPPHLPPHLPK ',
        'KPPPKPKPPPK ',
        'KPNNNPNNNPK ',
        'KPPPPPPPPPPK',
        'KPKK   KKPK ',
        ' K       K  ',
      ]
    ]
  }
}

const SCALE = 8

function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: string[],
  offsetX = 0,
  offsetY = 0
) {
  for (let row = 0; row < sprite.length; row++) {
    const line = sprite[row]
    for (let col = 0; col < line.length; col++) {
      const ch = line[col]
      const color = C[ch]
      if (!color || color === 'transparent') continue
      ctx.fillStyle = color
      ctx.fillRect(
        offsetX + col * SCALE,
        offsetY + row * SCALE,
        SCALE,
        SCALE
      )
    }
  }
}

// Mood overlay effects
function drawMoodOverlay(ctx: CanvasRenderingContext2D, mood: PetMood, frame: number, w: number, h: number) {
  if (mood === 'happy') {
    // Draw small stars
    ctx.fillStyle = '#fbbf24'
    ctx.font = '14px serif'
    const angle = (frame * 0.1) % (Math.PI * 2)
    const x = w / 2 + Math.cos(angle) * 30
    const y = h / 3 + Math.sin(angle) * 20
    ctx.fillText('✦', x, y)
  }
  if (mood === 'eating') {
    ctx.fillStyle = '#f87171'
    ctx.font = '16px serif'
    ctx.fillText('♥', w - 24, 20)
  }
  if (mood === 'sad') {
    ctx.fillStyle = '#60a5fa'
    ctx.font = '12px serif'
    ctx.fillText('·', w / 2 - 8, h - 20 + Math.sin(frame * 0.05) * 3)
    ctx.fillText('·', w / 2 + 4, h - 16 + Math.cos(frame * 0.05) * 3)
  }
  if (mood === 'sleeping') {
    ctx.fillStyle = '#a78bfa'
    ctx.font = `${12 + Math.sin(frame * 0.03) * 2}px serif`
    ctx.fillText('z', w - 20, 30)
    ctx.font = `${10 + Math.sin(frame * 0.03) * 2}px serif`
    ctx.fillText('z', w - 10, 22)
  }
}

export function PetCanvas({ stage, mood, onClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef(0)
  const animFrame = useRef(0)
  const tickRef = useRef(0)

  const sprites = SPRITES[stage]
  const spriteFrameCount = sprites.frames.length

  const spriteRows = sprites.frames[0]
  const spriteW = (sprites.frames[0][0]?.length ?? 12) * SCALE
  const spriteH = spriteRows.length * SCALE

  // Mood-based vertical bounce
  function getYOffset(): number {
    const t = tickRef.current
    if (mood === 'happy') return Math.sin(t * 0.15) * 6
    if (mood === 'playing') return Math.abs(Math.sin(t * 0.2)) * -8
    if (mood === 'sad') return Math.sin(t * 0.05) * 2
    return Math.sin(t * 0.04) * 2 // idle breathe
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let running = true

    function render() {
      if (!running || !ctx) return
      tickRef.current++

      // Switch animation frame every 20 ticks
      if (tickRef.current % 20 === 0) {
        frameRef.current = (frameRef.current + 1) % spriteFrameCount
      }

      const sprite = sprites.frames[frameRef.current]
      const yOff = getYOffset()

      ctx.clearRect(0, 0, canvas!.width, canvas!.height)

      // Background glow for legend
      if (stage === 5) {
        const grad = ctx.createRadialGradient(
          canvas!.width / 2, canvas!.height / 2, 10,
          canvas!.width / 2, canvas!.height / 2, 80
        )
        grad.addColorStop(0, 'rgba(251,191,36,0.15)')
        grad.addColorStop(1, 'rgba(251,191,36,0)')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, canvas!.width, canvas!.height)
      }

      drawSprite(ctx, sprite, (canvas!.width - spriteW) / 2, (canvas!.height - spriteH) / 2 + yOff)
      drawMoodOverlay(ctx, mood, tickRef.current, canvas!.width, canvas!.height)

      animFrame.current = requestAnimationFrame(render)
    }

    render()
    return () => {
      running = false
      cancelAnimationFrame(animFrame.current)
    }
  }, [stage, mood])

  return (
    <canvas
      ref={canvasRef}
      width={160}
      height={160}
      onClick={onClick}
      style={{ cursor: 'pointer', imageRendering: 'pixelated' }}
    />
  )
}
