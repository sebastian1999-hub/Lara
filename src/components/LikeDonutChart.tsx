interface LikeDonutChartProps {
  label: string
  imageSrc: string
  yesLabel: string
  yesCount: number
  noLabel: string
  noCount: number
}

const RADIUS = 42
const STROKE_WIDTH = 13
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/**
 * Gráfico circular (donut) de dos segmentos (sí / no) con una imagen
 * redonda en el centro. Usado en la vista de Buscar para mostrar cuántas
 * latas le gustan a cada gato.
 */
export function LikeDonutChart({ label, imageSrc, yesLabel, yesCount, noLabel, noCount }: LikeDonutChartProps) {
  const total = yesCount + noCount
  const yesFraction = total > 0 ? yesCount / total : 0
  const yesLength = yesFraction * CIRCUMFERENCE
  const yesPercent = total > 0 ? Math.round(yesFraction * 100) : 0
  const noPercent = total > 0 ? 100 - yesPercent : 0

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-periwinkle-200 bg-white/80 p-4 shadow-soft">
      <h3 className="text-sm font-semibold text-periwinkle-900">{label}</h3>

      <div className="relative h-36 w-36 shrink-0 sm:h-40 sm:w-40">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="#e9edfd" strokeWidth={STROKE_WIDTH} />
          {total > 0 && (
            <>
              <circle
                cx="50"
                cy="50"
                r={RADIUS}
                fill="none"
                stroke="#6f85e8"
                strokeWidth={STROKE_WIDTH}
                strokeDasharray={`${yesLength} ${CIRCUMFERENCE - yesLength}`}
              />
              <circle
                cx="50"
                cy="50"
                r={RADIUS}
                fill="none"
                stroke="#eae878"
                strokeWidth={STROKE_WIDTH}
                strokeDasharray={`${CIRCUMFERENCE - yesLength} ${yesLength}`}
                strokeDashoffset={-yesLength}
              />
            </>
          )}
        </svg>
        <div className="absolute inset-[20%] overflow-hidden rounded-full border-2 border-white shadow-inner">
          <img src={imageSrc} alt="" className="h-full w-full object-cover" />
        </div>
      </div>

      {total > 0 ? (
        <div className="flex w-full flex-col gap-1 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2 w-2 shrink-0 rounded-full bg-periwinkle-500" aria-hidden />
              {yesLabel}
            </span>
            <span className="font-semibold text-periwinkle-900">
              {yesCount} ({yesPercent}%)
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2 w-2 shrink-0 rounded-full bg-butter-300" aria-hidden />
              {noLabel}
            </span>
            <span className="font-semibold text-periwinkle-900">
              {noCount} ({noPercent}%)
            </span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-400">Sin datos suficientes todavía.</p>
      )}
    </div>
  )
}
