'use client';
// Chart kit. Series colours were validated for the dark surface (#202020) with the dataviz palette checker:
// slots 1–3 pass all-pairs (lines/scatter), slot 4 passes adjacent pairs only (bars/stacks).
import React, { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import { Table2, LineChart as LineIcon } from 'lucide-react';

export const SERIES = ['#B88C2C', '#5B7CE0', '#2E9E7A', '#B25FD0'] as const;
const GRID = '#2c2c2c';
const AXIS = {
  stroke: '#353535',
  tick: { fill: '#AAA49A', fontSize: 11 },
  tickLine: false,
} as const;
const tip = {
  contentStyle: {
    background: '#181818',
    border: '1px solid #38342C',
    borderRadius: 10,
    fontSize: 12,
  },
  labelStyle: { color: '#F7F3EA', marginBottom: 4 },
  itemStyle: { color: '#F7F3EA' },
};

export interface Series {
  key: string;
  label: string;
  unit?: string;
}

function TableView<T extends Record<string, unknown>>({
  data,
  x,
  series,
  xLabel,
}: {
  data: T[];
  x: string;
  series: Series[];
  xLabel: string;
}) {
  return (
    <div className="max-h-64 overflow-auto rounded-xl border border-bronze">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-graphite-deep text-xs text-stone">
          <tr>
            <th className="px-3 py-2 font-medium">{xLabel}</th>
            {series.map((s) => (
              <th key={s.key} className="px-3 py-2 font-medium">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-divider">
          {data.map((r, i) => (
            <tr key={i}>
              <td className="px-3 py-1.5 text-stone">{String(r[x])}</td>
              {series.map((s) => (
                <td key={s.key} className="px-3 py-1.5 tabular-nums text-ivory">
                  {r[s.key] == null ? '—' : `${r[s.key]}${s.unit ?? ''}`}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Frame({
  title,
  desc,
  children,
  table,
  height = 220,
}: {
  title?: string;
  desc?: string;
  children: React.ReactNode;
  table: React.ReactNode;
  height?: number;
}) {
  const [asTable, setAsTable] = useState(false);
  return (
    <figure>
      <div className="mb-3 flex items-start justify-between gap-2">
        <figcaption>
          {title && <p className="text-sm font-medium text-ivory">{title}</p>}
          {desc && <p className="text-xs text-stone">{desc}</p>}
        </figcaption>
        <button
          type="button"
          onClick={() => setAsTable((t) => !t)}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-stone hover:bg-white/5 hover:text-ivory"
          aria-pressed={asTable}
        >
          {asTable ? (
            <>
              <LineIcon className="h-3.5 w-3.5" />
              Chart
            </>
          ) : (
            <>
              <Table2 className="h-3.5 w-3.5" />
              Table
            </>
          )}
        </button>
      </div>
      {asTable ? (
        table
      ) : (
        <div style={{ height }} role="img" aria-label={title ?? 'Chart'}>
          {children}
        </div>
      )}
    </figure>
  );
}

const legend = (n: number) =>
  n > 1 ? (
    <Legend iconType="plainline" wrapperStyle={{ fontSize: 12, color: '#AAA49A', paddingTop: 8 }} />
  ) : null;

export function TrendChart<T extends Record<string, unknown>>({
  data,
  x,
  series,
  title,
  desc,
  yDomain,
  height,
  xLabel = 'Date',
}: {
  data: T[];
  x: string;
  series: Series[];
  title?: string;
  desc?: string;
  yDomain?: [number | 'auto', number | 'auto'];
  height?: number;
  xLabel?: string;
}) {
  return (
    <Frame
      title={title}
      desc={desc}
      height={height}
      table={<TableView data={data} x={x} series={series} xLabel={xLabel} />}
    >
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey={x} {...AXIS} minTickGap={24} />
          <YAxis {...AXIS} axisLine={false} domain={yDomain ?? ['auto', 'auto']} width={44} />
          <Tooltip {...tip} cursor={{ stroke: '#514A3C' }} />
          {legend(series.length)}
          {series.slice(0, 3).map((s, i) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              unit={s.unit}
              stroke={SERIES[i]}
              strokeWidth={2}
              connectNulls
              dot={{ r: 3, strokeWidth: 0, fill: SERIES[i] }}
              activeDot={{ r: 5, stroke: '#202020', strokeWidth: 2 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Frame>
  );
}

export function BarsChart<T extends Record<string, unknown>>({
  data,
  x,
  series,
  title,
  desc,
  height,
  xLabel = 'Item',
  yDomain,
  layout = 'horizontal',
}: {
  data: T[];
  x: string;
  series: Series[];
  title?: string;
  desc?: string;
  height?: number;
  xLabel?: string;
  yDomain?: [number, number];
  layout?: 'horizontal' | 'vertical';
}) {
  const vertical = layout === 'vertical';
  return (
    <Frame
      title={title}
      desc={desc}
      height={height}
      table={<TableView data={data} x={x} series={series} xLabel={xLabel} />}
    >
      <ResponsiveContainer>
        <BarChart
          data={data}
          layout={vertical ? 'vertical' : 'horizontal'}
          margin={{ top: 6, right: 12, left: vertical ? 8 : -18, bottom: 0 }}
          barGap={2}
        >
          <CartesianGrid stroke={GRID} vertical={vertical} horizontal={!vertical} />
          {vertical ? (
            <>
              <XAxis type="number" {...AXIS} domain={yDomain ?? [0, 'auto']} />
              <YAxis type="category" dataKey={x} {...AXIS} axisLine={false} width={120} />
            </>
          ) : (
            <>
              <XAxis dataKey={x} {...AXIS} minTickGap={8} />
              <YAxis {...AXIS} axisLine={false} domain={yDomain ?? [0, 'auto']} width={44} />
            </>
          )}
          <Tooltip {...tip} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          {legend(series.length)}
          {series.slice(0, 4).map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              unit={s.unit}
              fill={SERIES[i]}
              radius={vertical ? [0, 4, 4, 0] : [4, 4, 0, 0]}
              maxBarSize={28}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Frame>
  );
}

export function RadarProfile<T extends Record<string, unknown>>({
  data,
  axis,
  series,
  title,
  desc,
  height = 300,
}: {
  data: T[];
  axis: string;
  series: Series[];
  title?: string;
  desc?: string;
  height?: number;
}) {
  return (
    <Frame
      title={title}
      desc={desc}
      height={height}
      table={<TableView data={data} x={axis} series={series} xLabel="Domain" />}
    >
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="#353535" />
          <PolarAngleAxis dataKey={axis} tick={{ fill: '#AAA49A', fontSize: 11 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Tooltip {...tip} />
          {legend(series.length)}
          {series.slice(0, 3).map((s, i) => (
            <Radar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              stroke={SERIES[i]}
              strokeWidth={2}
              fill={SERIES[i]}
              fillOpacity={i === 0 ? 0.22 : 0.08}
              dot={{ r: 3, fill: SERIES[i] }}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </Frame>
  );
}

/** Horizontal meter for a single 0–100 value with its number always printed (never colour-only). */
export function Meter({ value, label, sub }: { value: number; label: string; sub?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
        <span className="text-ivory">{label}</span>
        <span className="tabular-nums text-stone">{Math.round(v)}/100</span>
      </div>
      <div
        className="h-2 rounded-full bg-graphite-deep"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(v)}
        aria-label={label}
      >
        <div className="h-2 rounded-full bg-gold" style={{ width: `${v}%` }} />
      </div>
      {sub && <p className="mt-1 text-xs text-stone">{sub}</p>}
    </div>
  );
}
