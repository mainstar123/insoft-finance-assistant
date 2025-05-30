import { Injectable, Logger } from '@nestjs/common';
import QuickChart from 'quickchart-js';
import {
  ChartType,
  ChartData,
  BaseChartOptions,
  LineChartOptions,
  BarChartOptions,
  PieChartOptions,
  ChartResponse,
} from '../interfaces/chart-options.interface';

/**
 * Service for generating charts using QuickChart API
 */
@Injectable()
export class ChartGeneratorService {
  private readonly logger = new Logger(ChartGeneratorService.name);

  constructor() {
    this.logger.log('ChartGeneratorService initialized');
  }

  /**
   * Generate a chart based on the provided type, data, and options
   * @param type The type of chart to generate
   * @param data The data for the chart
   * @param options The options for the chart
   * @returns A promise that resolves to a chart response
   */
  async generateChart(
    type: ChartType,
    data: ChartData,
    options:
      | BaseChartOptions
      | LineChartOptions
      | BarChartOptions
      | PieChartOptions = {},
  ): Promise<ChartResponse> {
    try {
      this.logger.log(`Generating ${type} chart`);

      // Create a new QuickChart instance
      const chart = new QuickChart();

      // Set chart dimensions
      chart.setWidth(options.width || 800);
      chart.setHeight(options.height || 600);
      chart.setBackgroundColor(options.backgroundColor || 'white');

      // Convert our data format to Chart.js format
      const chartJsData = this.convertToChartJsData(type, data);

      // Create chart configuration
      const config = this.createChartConfig(type, chartJsData, options);

      // Set the chart configuration as a string
      chart.setConfig(config);

      // Generate the chart
      try {
        // Get chart as base64 data URL
        const imageData = await chart.toDataUrl();

        return {
          imageData,
          chartData: data,
        };
      } catch (error) {
        // Fallback to URL if getDataUrl fails
        const imageUrl = chart.getUrl();

        return {
          imageUrl,
          chartData: data,
        };
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error generating chart: ${errorMessage}`);
      return {
        error: `Failed to generate chart: ${errorMessage}`,
      };
    }
  }

  /**
   * Convert our data format to Chart.js format
   * @param type The type of chart
   * @param data Our chart data
   * @returns Chart.js compatible data
   */
  private convertToChartJsData(type: ChartType, data: ChartData): any {
    if (type === ChartType.PIE || type === ChartType.DOUGHNUT) {
      // For pie/doughnut charts, we need a different data structure
      return {
        labels:
          data.series[0]?.data.map(
            (point) => point.label || point.x.toString(),
          ) || [],
        datasets: [
          {
            data: data.series[0]?.data.map((point) => point.y) || [],
            backgroundColor:
              data.series[0]?.data.map(
                (point) => point.color || this.getRandomColor(),
              ) || [],
            label: data.series[0]?.name || 'Data',
          },
        ],
      };
    }

    // For other chart types
    return {
      labels:
        data.labels ||
        data.series[0]?.data.map((point) => point.x.toString()) ||
        [],
      datasets: data.series.map((series) => ({
        label: series.name,
        data: series.data.map((point) => point.y),
        backgroundColor: series.color || this.getRandomColor(),
        borderColor: series.color || this.getRandomColor(),
        fill: type === ChartType.AREA,
      })),
    };
  }

  /**
   * Create a Chart.js configuration
   * @param type The type of chart
   * @param data The Chart.js data
   * @param options The chart options
   * @returns A Chart.js configuration
   */
  private createChartConfig(
    type: ChartType,
    data: any,
    options:
      | BaseChartOptions
      | LineChartOptions
      | BarChartOptions
      | PieChartOptions,
  ): any {
    // Map our chart type to Chart.js type
    let chartJsType: string;
    switch (type) {
      case ChartType.LINE:
        chartJsType = 'line';
        break;
      case ChartType.BAR:
      case ChartType.STACKED_BAR:
      case ChartType.HORIZONTAL_BAR:
        chartJsType = 'bar';
        break;
      case ChartType.PIE:
        chartJsType = 'pie';
        break;
      case ChartType.DOUGHNUT:
        chartJsType = 'doughnut';
        break;
      case ChartType.AREA:
        chartJsType = 'line'; // Area is a line chart with fill
        break;
      default:
        chartJsType = 'line';
    }

    // Create base configuration
    const config: any = {
      type: chartJsType,
      data,
      options: {
        responsive: options.responsive !== false,
        plugins: {
          title: {
            display: !!options.title,
            text: options.title || '',
          },
          legend: {
            display: true,
            position: options.legendPosition || 'top',
          },
        },
      },
    };

    // Add watermark/logo if URL is provided
    if (options.logoUrl) {
      // Add watermark plugin configuration
      config.options.plugins.watermark = {
        image: options.logoUrl,
        x: 20,
        y: 20,
        width: options.logoWidth || 100,
        height: options.logoHeight || 40,
        opacity: options.logoOpacity || 0.1,
        alignX: this.getAlignmentX(options.logoPosition),
        alignY: this.getAlignmentY(options.logoPosition),
        alignToChartArea: false,
        position: 'back',
      };
    }

    // Add type-specific options
    if (type === ChartType.LINE || type === ChartType.AREA) {
      const lineOptions = options as LineChartOptions;
      config.options.scales = {
        x: {
          title: {
            display: !!lineOptions.xAxisLabel,
            text: lineOptions.xAxisLabel || '',
          },
          grid: {
            display: lineOptions.showGrid !== false,
          },
          type: lineOptions.timeScale ? 'time' : 'category',
        },
        y: {
          title: {
            display: !!lineOptions.yAxisLabel,
            text: lineOptions.yAxisLabel || '',
          },
          grid: {
            display: lineOptions.showGrid !== false,
          },
          beginAtZero: true,
        },
      };
    } else if (
      type === ChartType.BAR ||
      type === ChartType.STACKED_BAR ||
      type === ChartType.HORIZONTAL_BAR
    ) {
      const barOptions = options as BarChartOptions;
      config.options.indexAxis = barOptions.horizontal ? 'y' : 'x';
      config.options.scales = {
        x: {
          title: {
            display: !!barOptions.xAxisLabel,
            text: barOptions.xAxisLabel || '',
          },
          stacked: type === ChartType.STACKED_BAR,
          grid: {
            display: barOptions.showGrid !== false,
          },
        },
        y: {
          title: {
            display: !!barOptions.yAxisLabel,
            text: barOptions.yAxisLabel || '',
          },
          stacked: type === ChartType.STACKED_BAR,
          grid: {
            display: barOptions.showGrid !== false,
          },
          beginAtZero: true,
        },
      };
    } else if (type === ChartType.PIE || type === ChartType.DOUGHNUT) {
      const pieOptions = options as PieChartOptions;

      config.options.plugins.datalabels = {
        display: pieOptions.showPercentage || pieOptions.showValues,
        formatter: (value: number, ctx: any) => {
          if (pieOptions.showPercentage) {
            const dataset = ctx.chart.data.datasets[ctx.datasetIndex];
            const total = dataset.data.reduce(
              (acc: number, data: number) => acc + data,
              0,
            );
            const percentage = ((value * 100) / total).toFixed(1) + '%';
            return pieOptions.showValues
              ? `${value} (${percentage})`
              : percentage;
          }
          return value;
        },
      };

      if (type === ChartType.DOUGHNUT && pieOptions.cutoutPercentage) {
        config.options.cutout = `${pieOptions.cutoutPercentage}%`;
      }
    }

    return config;
  }

  /**
   * Get horizontal alignment based on logo position
   * @param position Logo position
   * @returns Horizontal alignment
   */
  private getAlignmentX(position?: string): string {
    if (!position) return 'right';

    if (position.includes('left')) return 'left';
    if (position.includes('right')) return 'right';
    if (position === 'center') return 'center';

    return 'right';
  }

  /**
   * Get vertical alignment based on logo position
   * @param position Logo position
   * @returns Vertical alignment
   */
  private getAlignmentY(position?: string): string {
    if (!position) return 'bottom';

    if (position.includes('top')) return 'top';
    if (position.includes('bottom')) return 'bottom';
    if (position === 'center') return 'center';

    return 'bottom';
  }

  /**
   * Generate a random color
   * @returns A random hex color
   */
  private getRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
}
