import type { AnimalType, PetMood, GrowthStage } from '../../shared/types'

interface Props {
  animalType: AnimalType
  mood: PetMood
  stage: GrowthStage
  onClick: () => void
}

const CSS = `
@keyframes pet-bob    { 0%,100%{transform:translateY(0)}       50%{transform:translateY(-7px)} }
@keyframes pet-bounce { 0%,100%{transform:translateY(0) scale(1)}  25%{transform:translateY(-14px) scale(1.06)} 60%{transform:translateY(-3px) scale(0.97)} }
@keyframes pet-wiggle { 0%,100%{transform:rotate(0)}            25%{transform:rotate(-9deg) translateY(-4px)} 75%{transform:rotate(9deg) translateY(-4px)} }
@keyframes pet-sad    { 0%,100%{transform:translateY(0) rotate(-2deg)}  50%{transform:translateY(5px) rotate(2deg)} }
@keyframes pet-eat    { 0%,100%{transform:scaleY(1) scaleX(1)}  40%{transform:scaleY(0.88) scaleX(1.08)} }
@keyframes pet-blink  { 0%,85%,100%{transform:scaleY(1)}        90%,93%{transform:scaleY(0.08)} }
@keyframes pet-glow   { 0%,100%{filter:drop-shadow(0 0 8px rgba(251,191,36,.7))} 50%{filter:drop-shadow(0 0 18px rgba(251,191,36,1))} }
@keyframes pet-float  { 0%,100%{transform:translateY(0) scale(1.05)}  50%{transform:translateY(-5px) scale(1.05)} }
.pm-idle    { animation: pet-bob    2.2s ease-in-out infinite }
.pm-happy   { animation: pet-bounce 0.65s ease-in-out infinite }
.pm-playing { animation: pet-wiggle 0.45s ease-in-out infinite }
.pm-sad     { animation: pet-sad    2.8s ease-in-out infinite }
.pm-eating  { animation: pet-eat    0.5s ease-in-out infinite }
.pm-sleeping{ animation: pet-bob    3.5s ease-in-out infinite }
.pm-legend  { animation: pet-float  2s ease-in-out infinite, pet-glow 2s ease-in-out infinite }
.eye-blink  { transform-origin: center; animation: pet-blink 4s ease-in-out infinite }
`

// ── shared helpers ──────────────────────────────────────────────────────────
const Eye = ({ cx, cy, r = 7, pupilColor = '#1a1a2e', irisColor = '#4CAF50' }: {
  cx: number; cy: number; r?: number; pupilColor?: string; irisColor?: string
}) => (
  <g className="eye-blink" style={{ transformOrigin: `${cx}px ${cy}px` }}>
    <circle cx={cx} cy={cy} r={r} fill="white" stroke="#d0d0d0" strokeWidth="0.5" />
    <circle cx={cx} cy={cy + 1} r={r * 0.58} fill={irisColor} />
    <circle cx={cx} cy={cy + 1} r={r * 0.35} fill={pupilColor} />
    <circle cx={cx - r * 0.28} cy={cy - r * 0.3} r={r * 0.18} fill="white" />
  </g>
)

const Blush = ({ cx, cy }: { cx: number; cy: number }) => (
  <ellipse cx={cx} cy={cy} rx={6} ry={4} fill="#FFB8C8" opacity={0.55} />
)

// Scale by stage: 0=tiny, 5=full
const STAGE_SCALE = [0.52, 0.65, 0.75, 0.85, 0.95, 1.0]

// ── CAT ─────────────────────────────────────────────────────────────────────
function CatSVG({ mood }: { mood: PetMood }) {
  const happy = mood === 'happy' || mood === 'playing'
  return (
    <svg viewBox="0 0 100 110" width="100%" height="100%">
      {/* tail */}
      <path d="M72 90 Q88 80 84 96 Q80 105 72 100" stroke="#C06020" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* body */}
      <ellipse cx="50" cy="84" rx="24" ry="20" fill="#FF9A3C" stroke="#C06020" strokeWidth="1.5" />
      {/* belly patch */}
      <ellipse cx="50" cy="85" rx="13" ry="12" fill="#FFDAA0" />
      {/* head */}
      <circle cx="50" cy="46" r="26" fill="#FF9A3C" stroke="#C06020" strokeWidth="1.5" />
      {/* ears */}
      <polygon points="28,28 22,10 42,25" fill="#FF9A3C" stroke="#C06020" strokeWidth="1.5" />
      <polygon points="72,28 78,10 58,25" fill="#FF9A3C" stroke="#C06020" strokeWidth="1.5" />
      <polygon points="30,26 25,14 40,24" fill="#FFB8C8" />
      <polygon points="70,26 75,14 60,24" fill="#FFB8C8" />
      {/* eyes */}
      <Eye cx={40} cy={44} irisColor={happy ? '#60D060' : '#4CAF50'} />
      <Eye cx={60} cy={44} irisColor={happy ? '#60D060' : '#4CAF50'} />
      {/* nose */}
      <path d="M46,54 L50,57 L54,54 L50,51 Z" fill="#FF69B4" />
      {/* mouth */}
      {happy
        ? <path d="M44,58 Q50,64 56,58" stroke="#C06020" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        : <path d="M46,59 Q50,62 54,59" stroke="#C06020" strokeWidth="1.5" fill="none" strokeLinecap="round" />}
      {/* whiskers */}
      {[0, 1].map(side => [0, 1, 2].map(i => (
        <line key={`w${side}${i}`}
          x1={side === 0 ? 22 : 78} y1={52 + i * 4}
          x2={side === 0 ? 44 : 56} y2={53 + i * 2}
          stroke="#C06020" strokeWidth="0.8" opacity="0.7"
        />
      )))}
      <Blush cx={34} cy={56} /><Blush cx={66} cy={56} />
      {/* happy sparkles */}
      {happy && <>
        <text x="76" y="26" fontSize="10" fill="#FFD700">✦</text>
        <text x="14" y="30" fontSize="8" fill="#FFD700">✦</text>
      </>}
    </svg>
  )
}

// ── DOG ─────────────────────────────────────────────────────────────────────
function DogSVG({ mood }: { mood: PetMood }) {
  const happy = mood === 'happy' || mood === 'playing'
  return (
    <svg viewBox="0 0 100 110" width="100%" height="100%">
      {/* tail wagging */}
      <path d="M74 88 Q88 78 90 90 Q86 98 78 96" stroke="#8B5E2E" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* body */}
      <ellipse cx="50" cy="85" rx="25" ry="19" fill="#DBA050" stroke="#8B5E2E" strokeWidth="1.5" />
      <ellipse cx="50" cy="87" rx="14" ry="12" fill="#F5D090" />
      {/* floppy ears */}
      <ellipse cx="26" cy="44" rx="10" ry="16" fill="#C08030" stroke="#8B5E2E" strokeWidth="1.5" transform="rotate(-8,26,44)" />
      <ellipse cx="74" cy="44" rx="10" ry="16" fill="#C08030" stroke="#8B5E2E" strokeWidth="1.5" transform="rotate(8,74,44)" />
      {/* head */}
      <circle cx="50" cy="46" r="24" fill="#DBA050" stroke="#8B5E2E" strokeWidth="1.5" />
      {/* snout */}
      <ellipse cx="50" cy="57" rx="11" ry="8" fill="#C08030" />
      {/* nose */}
      <ellipse cx="50" cy="53" rx="6" ry="4.5" fill="#4a2e1a" />
      <circle cx="48" cy="52" r="1.2" fill="white" />
      {/* eyes */}
      <Eye cx={40} cy={42} irisColor="#8B4513" />
      <Eye cx={60} cy={42} irisColor="#8B4513" />
      {/* mouth */}
      <path d="M44,60 Q50,65 56,60" stroke="#8B5E2E" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* tongue when happy */}
      {happy && <ellipse cx="50" cy="65" rx="5" ry="4" fill="#FF6B8A" />}
      <Blush cx={33} cy={54} /><Blush cx={67} cy={54} />
      {happy && <text x="76" y="24" fontSize="10" fill="#FFD700">✦</text>}
    </svg>
  )
}

// ── DRAGON ──────────────────────────────────────────────────────────────────
function DragonSVG({ mood }: { mood: PetMood }) {
  const happy = mood === 'happy' || mood === 'playing'
  return (
    <svg viewBox="0 0 100 115" width="100%" height="100%">
      {/* wings */}
      <path d="M26 60 Q8 44 14 70 Q20 78 30 72" fill="#3DAF6A" stroke="#1A8A4A" strokeWidth="1" opacity="0.9" />
      <path d="M74 60 Q92 44 86 70 Q80 78 70 72" fill="#3DAF6A" stroke="#1A8A4A" strokeWidth="1" opacity="0.9" />
      {/* body */}
      <ellipse cx="50" cy="86" rx="22" ry="18" fill="#52C878" stroke="#1A8A4A" strokeWidth="1.5" />
      {/* belly */}
      <ellipse cx="50" cy="87" rx="12" ry="11" fill="#A8EFBC" />
      {/* tail */}
      <path d="M68 92 Q82 96 78 106 Q74 112 68 106" stroke="#1A8A4A" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* head */}
      <circle cx="50" cy="47" r="24" fill="#52C878" stroke="#1A8A4A" strokeWidth="1.5" />
      {/* horns */}
      <polygon points="38,26 34,12 42,24" fill="#F39C12" stroke="#E67E22" strokeWidth="1" />
      <polygon points="62,26 66,12 58,24" fill="#F39C12" stroke="#E67E22" strokeWidth="1" />
      {/* snout bump */}
      <ellipse cx="50" cy="58" rx="10" ry="7" fill="#3DAF6A" />
      {/* nostrils */}
      <circle cx="46" cy="57" r="2" fill="#1A8A4A" />
      <circle cx="54" cy="57" r="2" fill="#1A8A4A" />
      {/* eyes — slanted cute */}
      <Eye cx={40} cy={43} irisColor={happy ? '#F39C12' : '#27AE60'} pupilColor="#1a3a1a" />
      <Eye cx={60} cy={43} irisColor={happy ? '#F39C12' : '#27AE60'} pupilColor="#1a3a1a" />
      {/* mouth */}
      <path d={happy ? "M43,63 Q50,70 57,63" : "M45,63 Q50,66 55,63"}
        stroke="#1A8A4A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* fire breath when happy */}
      {happy && <>
        <text x="42" y="80" fontSize="14">🔥</text>
        <text x="78" y="22" fontSize="9" fill="#F39C12">✦</text>
      </>}
      <Blush cx={34} cy={54} /><Blush cx={66} cy={54} />
    </svg>
  )
}

// ── BUNNY ────────────────────────────────────────────────────────────────────
function BunnySVG({ mood }: { mood: PetMood }) {
  const happy = mood === 'happy' || mood === 'playing'
  const sad = mood === 'sad'
  return (
    <svg viewBox="0 0 100 120" width="100%" height="100%">
      {/* long ears */}
      <ellipse cx="36" cy="22" rx="10" ry="22" fill="#F5EEE0" stroke="#D4B8A0" strokeWidth="1.5"
        transform={sad ? "rotate(8,36,22)" : "rotate(-5,36,22)"} />
      <ellipse cx="64" cy="22" rx="10" ry="22" fill="#F5EEE0" stroke="#D4B8A0" strokeWidth="1.5"
        transform={sad ? "rotate(-8,64,22)" : "rotate(5,64,22)"} />
      {/* inner ears */}
      <ellipse cx="36" cy="22" rx="6" ry="16" fill="#FFB8C8" transform={sad ? "rotate(8,36,22)" : "rotate(-5,36,22)"} />
      <ellipse cx="64" cy="22" rx="6" ry="16" fill="#FFB8C8" transform={sad ? "rotate(-8,64,22)" : "rotate(5,64,22)"} />
      {/* body */}
      <ellipse cx="50" cy="88" rx="26" ry="20" fill="#F5EEE0" stroke="#D4B8A0" strokeWidth="1.5" />
      {/* fluffy tail */}
      <circle cx="72" cy="96" r="7" fill="white" stroke="#D4B8A0" strokeWidth="1" />
      {/* head */}
      <circle cx="50" cy="56" r="23" fill="#F5EEE0" stroke="#D4B8A0" strokeWidth="1.5" />
      {/* nose */}
      <ellipse cx="50" cy="62" rx="3.5" ry="2.5" fill="#FFB8C8" />
      {/* mouth */}
      <path d={happy ? "M45,65 Q50,71 55,65" : "M46,66 Q50,69 54,66"}
        stroke="#D4B8A0" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* eyes */}
      <Eye cx={41} cy={52} irisColor={happy ? '#6EC6FF' : '#4A90D9'} />
      <Eye cx={59} cy={52} irisColor={happy ? '#6EC6FF' : '#4A90D9'} />
      {sad && <>
        <line x1="36" y1="46" x2="44" y2="50" stroke="#D4B8A0" strokeWidth="1.5" />
        <line x1="64" y1="46" x2="56" y2="50" stroke="#D4B8A0" strokeWidth="1.5" />
      </>}
      <Blush cx={34} cy={62} /><Blush cx={66} cy={62} />
      {happy && <text x="74" y="28" fontSize="9" fill="#FF69B4">♥</text>}
    </svg>
  )
}

// ── PANDA ────────────────────────────────────────────────────────────────────
function PandaSVG({ mood }: { mood: PetMood }) {
  const happy = mood === 'happy' || mood === 'playing'
  return (
    <svg viewBox="0 0 100 110" width="100%" height="100%">
      {/* ears */}
      <circle cx="28" cy="28" r="12" fill="#2C2C2C" />
      <circle cx="72" cy="28" r="12" fill="#2C2C2C" />
      <circle cx="28" cy="28" r="7" fill="#444" />
      <circle cx="72" cy="28" r="7" fill="#444" />
      {/* body */}
      <ellipse cx="50" cy="86" rx="27" ry="19" fill="white" stroke="#2C2C2C" strokeWidth="1.5" />
      {/* black arms hint */}
      <ellipse cx="24" cy="82" rx="8" ry="12" fill="#2C2C2C" transform="rotate(-15,24,82)" />
      <ellipse cx="76" cy="82" rx="8" ry="12" fill="#2C2C2C" transform="rotate(15,76,82)" />
      {/* head */}
      <circle cx="50" cy="50" r="26" fill="white" stroke="#2C2C2C" strokeWidth="1.5" />
      {/* eye patches */}
      <ellipse cx="39" cy="47" rx="10" ry="10" fill="#2C2C2C" transform="rotate(-10,39,47)" />
      <ellipse cx="61" cy="47" rx="10" ry="10" fill="#2C2C2C" transform="rotate(10,61,47)" />
      {/* eyes */}
      <Eye cx={39} cy={47} r={6} irisColor={happy ? '#60A0FF' : '#2266CC'} pupilColor="#000" />
      <Eye cx={61} cy={47} r={6} irisColor={happy ? '#60A0FF' : '#2266CC'} pupilColor="#000" />
      {/* nose */}
      <ellipse cx="50" cy="60" rx="5" ry="3.5" fill="#2C2C2C" />
      <circle cx="48.5" cy="59" r="1.2" fill="#555" />
      {/* mouth */}
      <path d={happy ? "M44,64 Q50,70 56,64" : "M46,65 Q50,68 54,65"}
        stroke="#2C2C2C" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <Blush cx={30} cy={60} /><Blush cx={70} cy={60} />
      {happy && <text x="76" y="28" fontSize="10" fill="#FFD700">✦</text>}
    </svg>
  )
}

// ── KOALA ────────────────────────────────────────────────────────────────────
function KoalaSVG({ mood }: { mood: PetMood }) {
  const happy = mood === 'happy' || mood === 'playing'
  return (
    <svg viewBox="0 0 100 110" width="100%" height="100%">
      {/* big fluffy ears */}
      <circle cx="22" cy="36" r="18" fill="#B0B0B0" stroke="#808080" strokeWidth="1.5" />
      <circle cx="78" cy="36" r="18" fill="#B0B0B0" stroke="#808080" strokeWidth="1.5" />
      <circle cx="22" cy="36" r="12" fill="#C8C8C8" />
      <circle cx="78" cy="36" r="12" fill="#C8C8C8" />
      {/* body */}
      <ellipse cx="50" cy="86" rx="24" ry="19" fill="#A8A8A8" stroke="#808080" strokeWidth="1.5" />
      <ellipse cx="50" cy="88" rx="14" ry="13" fill="#C8C8C8" />
      {/* head */}
      <circle cx="50" cy="52" r="24" fill="#B0B0B0" stroke="#808080" strokeWidth="1.5" />
      {/* big oval nose */}
      <ellipse cx="50" cy="60" rx="9" ry="7" fill="#5A3A20" />
      <circle cx="47" cy="58" r="1.8" fill="#7A5A40" />
      {/* sleepy eyes */}
      <Eye cx={40} cy={48} r={6} irisColor={happy ? '#88AACC' : '#607080'} />
      <Eye cx={60} cy={48} r={6} irisColor={happy ? '#88AACC' : '#607080'} />
      {/* sleepy eyelid overlay */}
      {mood !== 'happy' && mood !== 'playing' && <>
        <ellipse cx={40} cy={45} rx={6.5} ry={3} fill="#B0B0B0" />
        <ellipse cx={60} cy={45} rx={6.5} ry={3} fill="#B0B0B0" />
      </>}
      {/* mouth */}
      <path d={happy ? "M44,66 Q50,72 56,66" : "M46,67 Q50,69 54,67"}
        stroke="#5A3A20" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <Blush cx={32} cy={60} /><Blush cx={68} cy={60} />
      {happy && <text x="76" y="26" fontSize="9" fill="#FFD700">✦</text>}
    </svg>
  )
}

// ── PENGUIN ──────────────────────────────────────────────────────────────────
function PenguinSVG({ mood }: { mood: PetMood }) {
  const happy = mood === 'happy' || mood === 'playing'
  return (
    <svg viewBox="0 0 100 115" width="100%" height="100%">
      {/* body (black teardrop) */}
      <ellipse cx="50" cy="76" rx="26" ry="30" fill="#2C3E50" stroke="#1a2530" strokeWidth="1.5" />
      {/* white belly */}
      <ellipse cx="50" cy="78" rx="16" ry="22" fill="#ECF0F1" />
      {/* wings */}
      <ellipse cx="24" cy="78" rx="9" ry="18" fill="#2C3E50" stroke="#1a2530" strokeWidth="1" transform="rotate(-12,24,78)" />
      <ellipse cx="76" cy="78" rx="9" ry="18" fill="#2C3E50" stroke="#1a2530" strokeWidth="1" transform="rotate(12,76,78)" />
      {/* head */}
      <circle cx="50" cy="44" r="20" fill="#2C3E50" stroke="#1a2530" strokeWidth="1.5" />
      {/* white face patch */}
      <ellipse cx="50" cy="46" rx="13" ry="14" fill="#ECF0F1" />
      {/* beak */}
      <polygon points="46,52 54,52 50,59" fill="#E67E22" stroke="#C05020" strokeWidth="0.5" />
      {/* eyes */}
      <Eye cx={42} cy={42} r={5.5} irisColor={happy ? '#5588FF' : '#2255CC'} />
      <Eye cx={58} cy={42} r={5.5} irisColor={happy ? '#5588FF' : '#2255CC'} />
      {/* feet */}
      <ellipse cx="41" cy="106" rx="8" ry="4" fill="#E67E22" />
      <ellipse cx="59" cy="106" rx="8" ry="4" fill="#E67E22" />
      <Blush cx={35} cy={50} /><Blush cx={65} cy={50} />
      {happy && <text x="74" y="26" fontSize="10" fill="#60A8FF">✦</text>}
    </svg>
  )
}

// ── SEAL ─────────────────────────────────────────────────────────────────────
function SealSVG({ mood }: { mood: PetMood }) {
  const happy = mood === 'happy' || mood === 'playing'
  return (
    <svg viewBox="0 0 100 115" width="100%" height="100%">
      {/* body blob */}
      <ellipse cx="50" cy="82" rx="30" ry="24" fill="#B8D4E8" stroke="#7AAAC8" strokeWidth="1.5" />
      {/* belly */}
      <ellipse cx="50" cy="85" rx="18" ry="16" fill="#D8EEF8" />
      {/* front flippers */}
      <ellipse cx="22" cy="86" rx="10" ry="7" fill="#A0C4DC" stroke="#7AAAC8" strokeWidth="1" transform="rotate(-30,22,86)" />
      <ellipse cx="78" cy="86" rx="10" ry="7" fill="#A0C4DC" stroke="#7AAAC8" strokeWidth="1" transform="rotate(30,78,86)" />
      {/* tail flipper */}
      <ellipse cx="50" cy="104" rx="14" ry="7" fill="#A0C4DC" stroke="#7AAAC8" strokeWidth="1" />
      {/* head */}
      <circle cx="50" cy="52" r="22" fill="#B8D4E8" stroke="#7AAAC8" strokeWidth="1.5" />
      {/* muzzle */}
      <ellipse cx="50" cy="60" rx="10" ry="8" fill="#C8E0F0" />
      {/* nose */}
      <ellipse cx="50" cy="56" rx="4" ry="3" fill="#4A4A6A" />
      <circle cx="48.5" cy="55" r="1" fill="#6A6A8A" />
      {/* mouth */}
      <path d={happy ? "M43,63 Q50,69 57,63" : "M45,64 Q50,67 55,64"}
        stroke="#7AAAC8" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* whisker dots */}
      {[44, 47, 50, 53, 56].map(x => <circle key={x} cx={x} cy={61} r={1} fill="#7AAAC8" />)}
      {/* eyes */}
      <Eye cx={40} cy={48} r={7} irisColor={happy ? '#5599FF' : '#1A4A8A'} pupilColor="#0a1a3a" />
      <Eye cx={60} cy={48} r={7} irisColor={happy ? '#5599FF' : '#1A4A8A'} pupilColor="#0a1a3a" />
      <Blush cx={32} cy={58} /><Blush cx={68} cy={58} />
      {happy && <text x="74" y="28" fontSize="10" fill="#60AAFF">✦</text>}
    </svg>
  )
}

// ── Animal map ───────────────────────────────────────────────────────────────
const ANIMALS: Record<AnimalType, (props: { mood: PetMood }) => JSX.Element> = {
  cat: CatSVG, dog: DogSVG, dragon: DragonSVG, bunny: BunnySVG,
  panda: PandaSVG, koala: KoalaSVG, penguin: PenguinSVG, seal: SealSVG
}

// ── Main export ──────────────────────────────────────────────────────────────
export function AnimalPet({ animalType, mood, stage, onClick }: Props) {
  const Animal = ANIMALS[animalType] ?? CatSVG
  const scale = STAGE_SCALE[stage] ?? 1
  const isLegend = stage === 5
  const moodClass = `pm-${mood}${isLegend ? ' pm-legend' : ''}`

  return (
    <>
      <style>{CSS}</style>
      <div
        onClick={onClick}
        className={moodClass}
        style={{
          width: 160, height: 160,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', position: 'relative'
        }}
      >
        {/* legend halo */}
        {isLegend && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(251,191,36,0.18) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
        )}
        <div style={{ width: 160 * scale, height: 160 * scale, transition: 'width 0.6s, height 0.6s' }}>
          <Animal mood={mood} />
        </div>
        {/* sleeping Zs */}
        {mood === 'sleeping' && (
          <div style={{ position: 'absolute', top: 10, right: 16, color: '#a78bfa', fontSize: 14, fontWeight: 700 }}>
            z<span style={{ fontSize: 10, marginLeft: 2 }}>z</span>
          </div>
        )}
      </div>
    </>
  )
}
