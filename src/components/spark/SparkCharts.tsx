import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function RevenueBars({ data }: { data: { label: string; income: number; expenses: number }[] }) {
  const safe = data.length ? data : [{ label: "—", income: 0, expenses: 0 }];
  return (
    <div style={{ width: "100%", height: 220 }}>
      <ResponsiveContainer>
        <BarChart data={safe} barGap={3} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#6c7e75", fontSize: 11, fontWeight: 600 }}
          />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: "rgba(7,47,31,0.06)" }}
            contentStyle={{ borderRadius: 12, border: "1px solid #e9efef", fontSize: 12, fontWeight: 700 }}
          />
          <Bar dataKey="income" fill="#072f1f" radius={[4, 4, 0, 0]} maxBarSize={22} name="Deals" />
          <Bar dataKey="expenses" fill="#b4f105" radius={[4, 4, 0, 0]} maxBarSize={22} name="Deep cuts" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Sparkline({ data, color }: { data: number[]; color: string }) {
  const points = useMemo(() => {
    if (!data.length) return "";
    const w = 200;
    const h = 44;
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const span = Math.max(max - min, 1);
    return data
      .map((v, i) => {
        const x = (i / Math.max(data.length - 1, 1)) * w;
        const y = h - 5 - ((v - min) / span) * (h - 10);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [data]);
  const last = data[data.length - 1] ?? 0;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const span = Math.max(max - min, 1);
  const dotX = 200;
  const dotY = 44 - 5 - ((last - min) / span) * (44 - 10);
  return (
    <div className="mt-3" style={{ height: 46 }}>
      <svg viewBox="0 0 200 44" className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
        <polyline points={points} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={dotX - 2} cy={dotY} r="3.4" fill={color} />
      </svg>
    </div>
  );
}

export function Donut({
  segments,
}: {
  segments: { name: string; value: number; color: string }[];
}) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const main = segments[0];
  return (
    <div className="relative" style={{ height: 230 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={segments} dataKey="value" nameKey="name" innerRadius="70%" outerRadius="95%" paddingAngle={3} strokeWidth={0}>
            {segments.map((s) => (
              <Cell key={s.name} fill={s.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e9efef", fontSize: 12, fontWeight: 700 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-[11px] font-semibold text-[#6c7e75]">Total Count</div>
          <div className="text-[26px] font-extrabold leading-none text-[#0b130f]">{total}</div>
          <div className="mt-1 text-[11px] font-bold" style={{ color: main?.color ?? "#072f1f" }}>
            {main ? `${Math.round((main.value / total) * 100)}% ${main.name}` : ""}
          </div>
        </div>
      </div>
    </div>
  );
}
