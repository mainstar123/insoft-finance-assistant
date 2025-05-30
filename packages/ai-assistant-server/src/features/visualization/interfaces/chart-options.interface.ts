/**
 * Base chart options interface
 */
export interface BaseChartOptions {
  title?: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
  format?: 'png' | 'jpeg' | 'webp' | 'svg';
  responsive?: boolean;
  animation?: boolean;
  theme?: 'light' | 'dark';
  fontFamily?: string;
  legendPosition?: 'top' | 'bottom' | 'left' | 'right' | 'none';
  // Logo/watermark options
  logoUrl?: string;
  logoPosition?:
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'
    | 'center';
  logoWidth?: number;
  logoHeight?: number;
  logoOpacity?: number;
}

/**
 * Line chart options
 */
export interface LineChartOptions extends BaseChartOptions {
  xAxisLabel?: string;
  yAxisLabel?: string;
  showPoints?: boolean;
  fillArea?: boolean;
  lineWidth?: number;
  showGrid?: boolean;
  timeScale?: boolean;
}

/**
 * Bar chart options
 */
export interface BarChartOptions extends BaseChartOptions {
  xAxisLabel?: string;
  yAxisLabel?: string;
  horizontal?: boolean;
  stacked?: boolean;
  showValues?: boolean;
  showGrid?: boolean;
}

/**
 * Pie chart options
 */
export interface PieChartOptions extends BaseChartOptions {
  doughnut?: boolean;
  showPercentage?: boolean;
  showValues?: boolean;
  cutoutPercentage?: number;
}

/**
 * Chart data point interface
 */
export interface ChartDataPoint {
  x: string | number | Date;
  y: number;
  label?: string;
  color?: string;
  [key: string]: any;
}

/**
 * Chart data series interface
 */
export interface ChartDataSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
}

/**
 * Chart data interface
 */
export interface ChartData {
  series: ChartDataSeries[];
  labels?: string[];
}

/**
 * Chart type enum
 */
export enum ChartType {
  LINE = 'line',
  BAR = 'bar',
  PIE = 'pie',
  DOUGHNUT = 'doughnut',
  AREA = 'area',
  STACKED_BAR = 'stacked-bar',
  HORIZONTAL_BAR = 'horizontal-bar',
}

/**
 * Chart request interface
 */
export interface ChartRequest {
  type: ChartType;
  data?: ChartData;
  options?:
    | BaseChartOptions
    | LineChartOptions
    | BarChartOptions
    | PieChartOptions;
  userId: number;
  startDate?: string;
  endDate?: string;
  categories?: string[];
  accounts?: number[];
  creditCards?: number[];
  includeIncome?: boolean;
  groupBy?: 'day' | 'week' | 'month' | 'year' | 'category';
}

/**
 * Chart response interface
 */
export interface ChartResponse {
  imageUrl?: string;
  imageData?: string; // Base64 encoded image
  chartData?: ChartData;
  error?: string;
}
