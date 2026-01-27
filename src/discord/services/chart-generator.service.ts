import { ChartConfiguration, Chart } from 'chart.js';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { DailyActivityData } from '@/discord/providers/models/stats.provider.contract';

export class ChartGeneratorService {
  private readonly renderer: ChartJSNodeCanvas;

  constructor() {
    this.renderer = new ChartJSNodeCanvas({
      width: 800,
      height: 350,
      backgroundColour: '#2b2d31',
      plugins: {
        modern: [ChartDataLabels]
      }
    });
  }

  public async generateActivityChart(data: DailyActivityData[]): Promise<Buffer> {
    const configuration: ChartConfiguration = {
      type: 'line',
      data: {
        labels: data.map(d => d.day),
        datasets: [{
          data: data.map(d => d.count),
          borderColor: '#5865f2',
          borderWidth: 4,
          pointBackgroundColor: '#ffffff', 
          pointBorderColor: '#5865f2',
          pointBorderWidth: 2,
          pointRadius: 6,
          fill: 'start',
          backgroundColor: (context: { chart: { ctx: any; }; }) => {
            const canvas = context.chart.ctx;
            const gradient = canvas.createLinearGradient(0, 0, 0, 350);
            gradient.addColorStop(0, 'rgba(88, 101, 242, 0.3)');
            gradient.addColorStop(1, 'rgba(88, 101, 242, 0)');
            return gradient;
          },
          tension: 0.4,
        }]
      },
      options: {
        layout: { padding: { top: 30, left: 20, right: 30, bottom: 20 } },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
          datalabels: {
            align: 'top',
            offset: 8,
            color: '#ffffff',
            font: { weight: 'bold', size: 14, family: 'Noto Sans' },
            formatter: (value: number) => value > 0 ? value : '',
          }
        },
        scales: {
          y: {
            display: false, 
            beginAtZero: true,
            grid: { display: false }
          },
          x: {
            grid: { display: false },
            ticks: { 
                color: '#949ba4', 
                font: { size: 14, family: 'Noto Sans' } 
            }
          }
        }
      }
    };

    return this.renderer.renderToBuffer(configuration);
  }
}