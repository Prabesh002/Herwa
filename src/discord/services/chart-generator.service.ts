import { ChartConfiguration } from 'chart.js';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { DailyActivityData } from '@/discord/providers/models/stats.provider.contract';

export class ChartGeneratorService {
  private readonly renderer: ChartJSNodeCanvas;

  constructor() {
    this.renderer = new ChartJSNodeCanvas({
      width: 800,
      height: 400,
      backgroundColour: '#2b2d31',
    });
  }

  public async generateActivityChart(data: DailyActivityData[]): Promise<Buffer> {
    const configuration: ChartConfiguration = {
      type: 'line',
      data: {
        labels: data.map(d => d.day),
        datasets: [{
          label: 'Messages',
          data: data.map(d => d.count),
          borderColor: '#5865F2',
          backgroundColor: 'rgba(88, 101, 242, 0.1)',
          fill: true,
          tension: 0.4, 
          pointRadius: 5,
          pointBackgroundColor: '#5865F2'
        }]
      },
      options: {
        responsive: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: '#ffffff' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#ffffff' }
          }
        }
      }
    };

    return this.renderer.renderToBuffer(configuration);
  }
}