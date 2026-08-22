import React from 'react';
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts';
import { useI18n } from '../../i18n';
import { SensoryProfile } from '../../types/coffee';

interface FlavorRadarChartProps {
  sensory: SensoryProfile;
  comparisonSensory?: SensoryProfile;
  size?: 'sm' | 'md' | 'lg';
}

export const FlavorRadarChart: React.FC<FlavorRadarChartProps> = ({
  sensory,
  comparisonSensory,
  size = 'md',
}) => {
  const { language } = useI18n();

  const data = [
    {
      subject: language === 'zh-TW' ? '酸質 Acidity' : 'Acidity',
      value: sensory.acidity,
      compValue: comparisonSensory?.acidity,
      fullMark: 10,
    },
    {
      subject: language === 'zh-TW' ? '甜感 Sweetness' : 'Sweetness',
      value: sensory.sweetness,
      compValue: comparisonSensory?.sweetness,
      fullMark: 10,
    },
    {
      subject: language === 'zh-TW' ? '醇厚度 Body' : 'Body',
      value: sensory.body,
      compValue: comparisonSensory?.body,
      fullMark: 10,
    },
    {
      subject: language === 'zh-TW' ? '乾淨度 Clarity' : 'Clarity',
      value: sensory.clarity,
      compValue: comparisonSensory?.clarity,
      fullMark: 10,
    },
    {
      subject: language === 'zh-TW' ? '平衡度 Balance' : 'Balance',
      value: sensory.balance,
      compValue: comparisonSensory?.balance,
      fullMark: 10,
    },
    {
      subject: language === 'zh-TW' ? '餘韻 Aftertaste' : 'Aftertaste',
      value: sensory.aftertaste,
      compValue: comparisonSensory?.aftertaste,
      fullMark: 10,
    },
  ];

  const height = size === 'sm' ? 180 : size === 'md' ? 240 : 320;

  return (
    <div className="w-full flex flex-col items-center justify-center relative">
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius={size === 'sm' ? '65%' : '75%'} data={data}>
            <PolarGrid stroke="#44352e" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#d4c4b7', fontSize: size === 'sm' ? 10 : 11 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 10]}
              tick={{ fill: '#8b7a70', fontSize: 9 }}
              stroke="#55443c"
            />
            {comparisonSensory && (
              <Radar
                name="Previous / Golden"
                dataKey="compValue"
                stroke="#60a5fa"
                fill="#3b82f6"
                fillOpacity={0.25}
              />
            )}
            <Radar
              name="Current Brew"
              dataKey="value"
              stroke="#f59e0b"
              fill="#d97706"
              fillOpacity={0.5}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {comparisonSensory && (
        <div className="flex items-center space-x-4 text-xs mt-1">
          <div className="flex items-center space-x-1.5 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span>本次風味 (Current)</span>
          </div>
          <div className="flex items-center space-x-1.5 text-blue-400">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
            <span>對比/神參數 (Reference)</span>
          </div>
        </div>
      )}
    </div>
  );
};
