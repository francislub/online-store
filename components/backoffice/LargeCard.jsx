// components/backoffice/LargeCard.jsx
import { Layers } from "lucide-react";
import { tones } from "./dashboardTones";

export default function LargeCard({ data }) {
  const tone = tones[data.tone] || tones.green;
  const Icon = data.icon || Layers;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-6 transition-transform duration-200 hover:-translate-y-1 ${tone.card}`}
    >
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium opacity-80">{data.period}</p>
          {/* No truncate: the full figure always shows and wraps if needed.
              Font size steps down on narrower cards so long UGX amounts fit. */}
          <h2
            className="mt-2 break-words text-xl font-bold leading-tight tabular-nums sm:text-2xl xl:text-2xl 2xl:text-3xl"
            title={data.value}
          >
            {data.value}
          </h2>
          {data.hint && (
            <p className="mt-2 break-words text-xs opacity-80">{data.hint}</p>
          )}
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone.iconWrap}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <Icon className="pointer-events-none absolute -bottom-5 -right-5 h-28 w-28 opacity-10" />
    </div>
  );
}