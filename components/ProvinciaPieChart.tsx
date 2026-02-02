"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

/** Provincia sales data for the pie chart. */
export interface ProvinciaStat {
  provincia: string;
  total: number;
}

/** Distinct colors for chart segments (mobile: fewer slices, desktop: more). */
const CHART_COLORS = [
  "#007C92", // aqua-700
  "#08D5FA", // aqua-500
  "#C8A96A", // gold-500
  "#1F8A70", // success
  "#2A3441", // smoke
  "#8A8F98", // slate
  "#D8C3A5", // gold-200
  "#0B0F14", // onyx
];

const MOBILE_MAX_SLICES = 5;
const MOBILE_BREAKPOINT = 768;

interface ProvinciaPieChartProps {
  data: ProvinciaStat[];
}

/**
 * Consolidates data to top N + "Otros" for cleaner mobile chart.
 */
function consolidateData(items: ProvinciaStat[], maxSlices: number) {
  if (items.length <= maxSlices) return items;
  const top = items.slice(0, maxSlices);
  const othersTotal = items.slice(maxSlices).reduce((s, d) => s + d.total, 0);
  return [...top, { provincia: "Otros", total: othersTotal }];
}

/**
 * Pie chart showing sales by provincia.
 * Responsive: on mobile, shows top 5 + Otros, smaller chart, compact legend.
 */
export function ProvinciaPieChart({ data }: ProvinciaPieChartProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    setIsMobile(mq.matches);
    const handler = () => setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (data.length === 0) {
    return (
      <div className="h-[260px] md:h-[200px] flex items-center justify-center text-jet/50 text-sm">
        Sin datos de provincias
      </div>
    );
  }

  const consolidated = isMobile ? consolidateData(data, MOBILE_MAX_SLICES) : data;
  const chartData = consolidated.map((d) => ({
    name: d.provincia,
    value: d.total,
  }));

  const formatValue = (value: number) => `RD$ ${value.toLocaleString()}`;

  return (
    <div className="provincia-chart-no-focus w-full">
      <ResponsiveContainer width="100%" height={isMobile ? 260 : 200}>
        <PieChart margin={isMobile ? { top: 4, right: 4, bottom: 4, left: 4 } : undefined} style={{ outline: "none" }}>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={isMobile ? 62 : 50}
            outerRadius={isMobile ? 92 : 75}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            activeShape={false}
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            cursor={false}
            formatter={(value?: number) => (value != null ? formatValue(value) : "")}
            contentStyle={{
              backgroundColor: "#FEFEFE",
              border: "1px solid #D8C3A5",
              borderRadius: "8px",
              fontSize: isMobile ? "11px" : "12px",
            }}
          />
          <Legend
            wrapperStyle={{
              fontSize: isMobile ? "10px" : "12px",
              ...(isMobile && {
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "6px 12px",
                marginTop: "4px",
              }),
            }}
            align="center"
            verticalAlign="bottom"
            iconSize={isMobile ? 8 : 10}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
