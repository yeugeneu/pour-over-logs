import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { PourStage } from '../../types/coffee';
import { WeightDataPoint } from '../../types/scale';
import { formatTime } from '../../utils/coffeeMath';

interface LivePourCurveChartProps {
  data: WeightDataPoint[];
  stages: PourStage[];
  totalTargetWater: number;
  totalTimeSeconds?: number;
}

export const LivePourCurveChart: React.FC<LivePourCurveChartProps> = ({
  data,
  stages,
  totalTargetWater,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-44 w-full flex items-center justify-center bg-stone-950/40 rounded-2xl border border-stone-800/80 text-stone-500 text-xs font-mono">
        Waiting for scale telemetry to plot live pour curve...
      </div>
    );
  }

  // Find stage boundaries for reference lines
  const stageBoundaries = stages.map((st) => ({
    name: st.name,
    time: st.startTimeSeconds + st.durationSeconds,
    targetGrams: st.targetWaterGrams,
  }));

  const maxWeight = Math.max(
    totalTargetWater * 1.1,
    ...data.map((d) => d.weight || 0)
  );

  return (
    <div className="w-full bg-stone-950/70 p-3.5 rounded-2xl border border-stone-800 space-y-2">
      <div className="flex items-center justify-between text-xs text-stone-400 px-1">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-stone-300 font-medium">Actual Water (g)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-0.5 border-t-2 border-dashed border-amber-600/70" />
            <span className="text-stone-400 font-medium">Target Water (g)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-cyan-300 font-medium">Flow (g/s)</span>
          </div>
        </div>
      </div>

      <div className="h-44 sm:h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="actualWaterGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />

            <XAxis
              dataKey="time"
              stroke="#78716c"
              fontSize={10}
              tickFormatter={(sec) => formatTime(sec)}
              domain={[0, 'auto']}
              type="number"
            />

            {/* Left Axis: Water Weight (g) */}
            <YAxis
              yAxisId="weight"
              stroke="#78716c"
              fontSize={10}
              domain={[0, Math.ceil(maxWeight / 50) * 50]}
              tickFormatter={(v) => `${v}g`}
            />

            {/* Right Axis: Flow Rate (g/s) */}
            <YAxis
              yAxisId="flow"
              orientation="right"
              stroke="#06b6d4"
              fontSize={10}
              domain={[0, 8]}
              tickFormatter={(v) => `${v}`}
              hide={false}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload as WeightDataPoint;
                  return (
                    <div className="bg-stone-900 border border-stone-700 rounded-xl p-2.5 shadow-xl text-xs space-y-1 font-mono">
                      <div className="text-stone-400 font-semibold">{formatTime(pt.time)}</div>
                      <div className="text-amber-400">
                        Actual: <strong>{pt.weight.toFixed(1)}g</strong>
                      </div>
                      {pt.targetWeight !== undefined && (
                        <div className="text-stone-400">
                          Target: <strong>{pt.targetWeight}g</strong>
                        </div>
                      )}
                      <div className="text-cyan-400">
                        Flow: <strong>{pt.flowRate.toFixed(1)} g/s</strong>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Stage Boundary Reference Lines */}
            {stageBoundaries.map((b, idx) => (
              <ReferenceLine
                key={idx}
                x={b.time}
                yAxisId="weight"
                stroke="#57534e"
                strokeDasharray="2 2"
              />
            ))}

            {/* Target Water Curve (Linear interpolation across stages) */}
            <Line
              yAxisId="weight"
              type="monotone"
              dataKey="targetWeight"
              stroke="#d97706"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              isAnimationActive={false}
            />

            {/* Actual Water Curve Area & Line */}
            <Area
              yAxisId="weight"
              type="monotone"
              dataKey="weight"
              stroke="#fbbf24"
              strokeWidth={2.5}
              fill="url(#actualWaterGradient)"
              dot={false}
              isAnimationActive={false}
            />

            {/* Flow Rate Line */}
            <Line
              yAxisId="flow"
              type="monotone"
              dataKey="flowRate"
              stroke="#22d3ee"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
