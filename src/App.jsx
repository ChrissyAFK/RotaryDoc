import { useState } from 'react'
import { Wrench, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp, Loader2, RotateCcw, Zap } from 'lucide-react'

const EXAMPLES = [
  { symptom: 'Rough idle, hesitates under load, slight loss of power', code: 'P0421', vehicle: '2007 Mazda RX-8' },
  { symptom: 'Squealing from the front when braking, worse when cold', code: '', vehicle: '' },
  { symptom: 'Battery keeps dying overnight, dash lights flicker', code: '', vehicle: '' },
]

const SYSTEM_PROMPT = `You are RotaryDoc, an expert automotive diagnostic assistant. Given a symptom description, an optional OBD-II code, and an optional vehicle, return the most probable causes ranked by likelihood. Be specific and practical: prefer concrete components and tests over vague advice. If a vehicle is given, tailor causes to that platform's known failure modes. Respond with ONLY a JSON object — no markdown, no code fences, no commentary — matching exactly this schema:

{
  "safety": "safe" | "caution" | "danger",
  "safetyNote": string,
  "causes": [
    {
      "title": string,
      "likelihood": number,
      "explanation": string,
      "diagnosticSteps": [string],
      "likelyParts": [string],
      "difficulty": number,
      "estCostRange": string
    }
  ]
}`

function WrenchIcons({ level }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Wrench
          key={n}
          size={14}
          className={n <= level ? 'text-amber-400' : 'text-zinc-700'}
        />
      ))}
    </span>
  )
}

function SafetyBanner({ safety, safetyNote }) {
  const cfg = {
    safe:    { bg: 'bg-emerald-900/60', border: 'border-emerald-500', text: 'text-emerald-300', icon: CheckCircle,    label: 'SAFE TO DRIVE' },
    caution: { bg: 'bg-amber-900/60',   border: 'border-amber-500',   text: 'text-amber-300',   icon: AlertTriangle,  label: 'DRIVE WITH CAUTION' },
    danger:  { bg: 'bg-red-900/60',     border: 'border-red-500',     text: 'text-red-300',     icon: XCircle,        label: 'DO NOT DRIVE' },
  }[safety] ?? { bg: 'bg-zinc-800', border: 'border-zinc-600', text: 'text-zinc-300', icon: AlertTriangle, label: 'UNKNOWN' }

  const Icon = cfg.icon
  return (
    <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${cfg.bg} ${cfg.border}`}>
      <Icon size={20} className={`mt-0.5 shrink-0 ${cfg.text}`} />
      <div>
        <div className={`text-xs font-bold tracking-widest ${cfg.text}`}>{cfg.label}</div>
        <div className="mt-0.5 text-sm text-zinc-300">{safetyNote}</div>
      </div>
    </div>
  )
}

function CauseCard({ cause }) {
  const [open, setOpen] = useState(false)
  const pct = Math.max(0, Math.min(100, cause.likelihood))

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800/60 overflow-hidden">
      <button
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-zinc-700/40 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-zinc-100 truncate">{cause.title}</div>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-zinc-700">
              <div
                className="h-1.5 rounded-full bg-amber-500 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-mono text-amber-400 shrink-0">{pct}%</span>
          </div>
        </div>
        {open
          ? <ChevronUp size={16} className="text-zinc-500 shrink-0" />
          : <ChevronDown size={16} className="text-zinc-500 shrink-0" />
        }
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-zinc-700/60 space-y-4">
          <p className="text-sm text-zinc-400">{cause.explanation}</p>

          {cause.diagnosticSteps?.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Diagnostic Steps</div>
              <ol className="space-y-1.5">
                {cause.diagnosticSteps.map((step, i) => (
                  <li key={i} className="flex gap-2 text-sm text-zinc-300">
                    <span className="shrink-0 font-mono text-amber-500">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {cause.likelyParts?.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Likely Parts</div>
              <div className="flex flex-wrap gap-1.5">
                {cause.likelyParts.map((part, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-zinc-700 text-zinc-300 border border-zinc-600">
                    {part}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">Repair Difficulty</div>
              <WrenchIcons level={cause.difficulty} />
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">Est. Cost</div>
              <div className="text-sm font-mono text-amber-400">{cause.estCostRange}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800/60 px-4 py-3 animate-pulse space-y-2">
      <div className="h-4 w-2/3 rounded bg-zinc-700" />
      <div className="h-2 w-full rounded bg-zinc-700" />
      <div className="h-2 w-1/2 rounded bg-zinc-700" />
    </div>
  )
}

export default function App() {
  const [symptom, setSymptom] = useState('')
  const [code, setCode] = useState('')
  const [vehicle, setVehicle] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  function fillExample(ex) {
    setSymptom(ex.symptom)
    setCode(ex.code)
    setVehicle(ex.vehicle)
    setStatus('idle')
    setResult(null)
  }

  async function diagnose() {
    if (!symptom.trim()) return
    setStatus('loading')
    setResult(null)
    setErrorMsg('')

    const userContent = `Symptom: ${symptom.trim()}\nOBD-II code: ${code.trim() || 'none'}\nVehicle: ${vehicle.trim() || 'unspecified'}`
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
          ...(apiKey ? { 'x-api-key': apiKey } : {}),
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 2048,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userContent }],
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        throw new Error(`API error ${res.status}: ${err}`)
      }

      const data = await res.json()
      const raw = data.content
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('')
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '')
        .trim()

      const parsed = JSON.parse(raw)
      parsed.causes = [...(parsed.causes ?? [])].sort((a, b) => b.likelihood - a.likelihood)
      setResult(parsed)
      setStatus('success')
    } catch (e) {
      setErrorMsg(e.message || 'Unknown error')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 px-4 py-5">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-amber-500 flex items-center justify-center">
            <Zap size={18} className="text-zinc-950" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-zinc-100">RotaryDoc</div>
            <div className="text-xs text-zinc-500">Describe the symptom. Get a plan.</div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Input panel */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
              Describe the symptom
            </label>
            <textarea
              rows={3}
              value={symptom}
              onChange={e => setSymptom(e.target.value)}
              placeholder="e.g. Rough idle at startup, stumbles under acceleration, faint burning smell"
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                OBD-II Code <span className="normal-case font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="P0421"
                maxLength={8}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm font-mono text-amber-300 placeholder-zinc-600 focus:outline-none focus:border-amber-500 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Vehicle <span className="normal-case font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={vehicle}
                onChange={e => setVehicle(e.target.value)}
                placeholder="2007 Mazda RX-8"
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <button
            onClick={diagnose}
            disabled={status === 'loading' || !symptom.trim()}
            className="w-full rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed text-zinc-950 font-bold py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
          >
            {status === 'loading' ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Running diagnostics…
              </>
            ) : (
              'Diagnose'
            )}
          </button>

          {/* Example chips */}
          <div>
            <div className="text-xs text-zinc-600 mb-2">Try an example:</div>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => fillExample(ex)}
                  className="px-3 py-1 rounded-full text-xs border border-zinc-700 text-zinc-400 hover:border-amber-500 hover:text-amber-400 transition-colors bg-zinc-800"
                >
                  {ex.code ? `${ex.code} · ` : ''}{ex.vehicle || ex.symptom.slice(0, 28) + '…'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading skeleton */}
        {status === 'loading' && (
          <div className="space-y-3">
            <div className="h-12 rounded-lg animate-pulse bg-zinc-800 border border-zinc-700" />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-4 flex items-start gap-3">
            <XCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-red-300">Diagnosis failed</div>
              <div className="text-xs text-red-400 mt-0.5 break-words">{errorMsg}</div>
            </div>
            <button
              onClick={diagnose}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors shrink-0"
            >
              <RotateCcw size={13} />
              Retry
            </button>
          </div>
        )}

        {/* Results */}
        {status === 'success' && result && (
          <div className="space-y-4">
            <SafetyBanner safety={result.safety} safetyNote={result.safetyNote} />
            <div className="space-y-3">
              {result.causes.map((cause, i) => (
                <CauseCard key={i} cause={cause} />
              ))}
            </div>
            <p className="text-xs text-zinc-600 text-center pt-1">
              AI-generated guidance, not a substitute for a qualified mechanic.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
