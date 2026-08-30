<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import type { DailyStat } from '@/api/types'
import { formatMoney, formatNumber, formatDate } from '@/lib/format'
import { t } from '@/i18n'

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
)

const props = defineProps<{ daily: DailyStat[] }>()

// Brand colours (stone + emerald palette) that read well in both themes.
const SALES = '#0e7490' // info teal
const PROFIT = '#059669' // emerald — profit is the star line
const DEBT = '#b45309' // amber

const data = computed<ChartData<'line'>>(() => ({
  labels: props.daily.map((d) => formatDate(d.date).slice(0, 5)),
  datasets: [
    {
      label: t('dashboard.chartSales'),
      data: props.daily.map((d) => d.salesAmount),
      borderColor: SALES,
      backgroundColor: 'rgba(14, 116, 144, 0.12)',
      fill: true,
      tension: 0.35,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
    },
    {
      label: t('dashboard.chartProfit'),
      data: props.daily.map((d) => d.profit),
      borderColor: PROFIT,
      backgroundColor: 'transparent',
      fill: false,
      tension: 0.35,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
    },
    {
      label: t('dashboard.chartDebt'),
      data: props.daily.map((d) => d.debtCollected),
      borderColor: DEBT,
      backgroundColor: 'transparent',
      fill: false,
      tension: 0.35,
      borderWidth: 2,
      borderDash: [4, 3],
      pointRadius: 0,
      pointHoverRadius: 4,
    },
  ],
}))

const options = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      position: 'top',
      align: 'end',
      labels: { usePointStyle: true, boxWidth: 8, font: { size: 12 }, color: '#94a3b8' },
    },
    tooltip: {
      callbacks: {
        label: (ctx) => `${ctx.dataset.label}: ${formatMoney(ctx.parsed.y)}`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#94a3b8', maxRotation: 0, autoSkipPadding: 16, font: { size: 11 } },
    },
    y: {
      grid: { color: 'rgba(148, 163, 184, 0.15)' },
      ticks: {
        color: '#94a3b8',
        font: { size: 11 },
        callback: (v) => formatNumber(Number(v)),
        maxTicksLimit: 5,
      },
    },
  },
}))
</script>

<template>
  <div class="h-56">
    <Line :data="data" :options="options" />
  </div>
</template>
