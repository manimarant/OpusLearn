import { useEffect, useRef } from "react";

interface ProgressChartProps {
  data?: any[];
  type?: "line" | "bar" | "doughnut";
  height?: number;
}

export default function ProgressChart({ 
  data, 
  type = "line", 
  height = 300 
}: ProgressChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Generate mock data if none provided
    const chartData = data || generateMockData();

    // Draw the chart based on type
    switch (type) {
      case "line":
        drawLineChart(ctx, chartData, canvas.width, canvas.height);
        break;
      case "bar":
        drawBarChart(ctx, chartData, canvas.width, canvas.height);
        break;
      case "doughnut":
        drawDoughnutChart(ctx, chartData, canvas.width, canvas.height);
        break;
    }
  }, [data, type, height]);

  const generateMockData = () => {
    const days = 7;
    const data = [];
    for (let i = 0; i < days; i++) {
      data.push({
        label: `Day ${i + 1}`,
        value: Math.floor(Math.random() * 100) + 20,
      });
    }
    return data;
  };

  const drawLineChart = (ctx: CanvasRenderingContext2D, data: any[], width: number, height: number) => {
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    // Find max value for scaling
    const maxValue = Math.max(...data.map(d => d.value));
    const stepX = chartWidth / (data.length - 1);

    // Draw grid lines
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw line
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 3;
    ctx.beginPath();
    data.forEach((point, index) => {
      const x = padding + stepX * index;
      const y = height - padding - (point.value / maxValue) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw points
    ctx.fillStyle = "#3b82f6";
    data.forEach((point, index) => {
      const x = padding + stepX * index;
      const y = height - padding - (point.value / maxValue) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw labels
    ctx.fillStyle = "#64748b";
    ctx.font = "12px Inter";
    ctx.textAlign = "center";
    data.forEach((point, index) => {
      const x = padding + stepX * index;
      ctx.fillText(point.label, x, height - 10);
    });
  };

  const drawBarChart = (ctx: CanvasRenderingContext2D, data: any[], width: number, height: number) => {
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    const barWidth = chartWidth / data.length * 0.6;
    const barSpacing = chartWidth / data.length * 0.4;

    const maxValue = Math.max(...data.map(d => d.value));

    // Draw axes
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw bars
    ctx.fillStyle = "#3b82f6";
    data.forEach((point, index) => {
      const x = padding + (chartWidth / data.length) * index + barSpacing / 2;
      const barHeight = (point.value / maxValue) * chartHeight;
      const y = height - padding - barHeight;

      ctx.fillRect(x, y, barWidth, barHeight);
    });

    // Draw labels
    ctx.fillStyle = "#64748b";
    ctx.font = "12px Inter";
    ctx.textAlign = "center";
    data.forEach((point, index) => {
      const x = padding + (chartWidth / data.length) * index + (chartWidth / data.length) / 2;
      ctx.fillText(point.label, x, height - 10);
    });
  };

  const drawDoughnutChart = (ctx: CanvasRenderingContext2D, data: any[], width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 40;
    const innerRadius = radius * 0.6;

    const total = data.reduce((sum, item) => sum + item.value, 0);
    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

    let currentAngle = -Math.PI / 2;

    data.forEach((item, index) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      
      // Draw slice
      ctx.fillStyle = colors[index % colors.length];
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
      ctx.closePath();
      ctx.fill();

      currentAngle += sliceAngle;
    });

    // Draw center text
    ctx.fillStyle = "#1f2937";
    ctx.font = "bold 24px Inter";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Progress", centerX, centerY);
  };

  return (
    <div className="w-full">
      <canvas
        ref={canvasRef}
        className="w-full border border-slate-200 rounded-lg"
        style={{ height: `${height}px` }}
      />
    </div>
  );
}
