import { Injectable, Logger } from '@nestjs/common';
import { ChartGeneratorService } from './chart-generator.service';
import { TransactionService } from '../../transaction/transaction.service';
import { BudgetService } from '../../budget/budget.service';
import { CreditCardService } from '../../credit-card/credit-card.service';
import { InvoiceService } from '../../invoice/invoice.service';
import { CategoryService } from '../../category/category.service';
import { GoalService } from '../../goal/goal.service';
import {
  ChartType,
  ChartData,
  ChartDataSeries,
  ChartDataPoint,
  ChartResponse,
  BaseChartOptions,
  LineChartOptions,
  BarChartOptions,
  PieChartOptions,
} from '../interfaces/chart-options.interface';
import { CreateChartDto } from '../dto/create-chart.dto';
import { ITransaction } from '../../transaction/interfaces/transaction.interface';
import { TransactionType } from '@/core/integrations/database/types';

/**
 * Service for generating financial visualizations
 */
@Injectable()
export class VisualizationService {
  private readonly logger = new Logger(VisualizationService.name);

  constructor(
    private readonly chartGeneratorService: ChartGeneratorService,
    private readonly transactionService: TransactionService,
    private readonly budgetService: BudgetService,
    private readonly creditCardService: CreditCardService,
    private readonly invoiceService: InvoiceService,
    private readonly categoryService: CategoryService,
    private readonly goalService: GoalService,
  ) {
    this.logger.log('VisualizationService initialized');
  }

  /**
   * Generate a chart based on the provided DTO
   * @param createChartDto The DTO containing chart parameters
   * @returns A promise that resolves to a chart response
   */
  async generateChart(createChartDto: CreateChartDto): Promise<ChartResponse> {
    try {
      this.logger.log(`Generating chart of type ${createChartDto.type}`);

      // If data is provided directly, use it
      if (createChartDto.data) {
        return this.chartGeneratorService.generateChart(
          createChartDto.type,
          createChartDto.data,
          createChartDto.options,
        );
      }

      // Otherwise, generate data based on the chart type and parameters
      let chartData: ChartData;
      let chartOptions:
        | BaseChartOptions
        | LineChartOptions
        | BarChartOptions
        | PieChartOptions = createChartDto.options || {};

      switch (createChartDto.type) {
        case ChartType.LINE:
        case ChartType.AREA:
          chartData = await this.generateTimeSeriesData(createChartDto);
          break;
        case ChartType.BAR:
        case ChartType.STACKED_BAR:
        case ChartType.HORIZONTAL_BAR:
          chartData = await this.generateCategoryComparisonData(createChartDto);
          break;
        case ChartType.PIE:
        case ChartType.DOUGHNUT:
          chartData = await this.generateDistributionData(createChartDto);
          break;
        default:
          throw new Error(`Unsupported chart type: ${createChartDto.type}`);
      }

      return this.chartGeneratorService.generateChart(
        createChartDto.type,
        chartData,
        chartOptions,
      );
    } catch (error) {
      this.logger.error(
        `Error generating chart: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return {
        error: `Failed to generate chart: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Generate a debt reduction progress chart
   * @param userId The user ID
   * @param options Chart options
   * @returns A promise that resolves to a chart response
   */
  async generateDebtReductionChart(
    userId: number,
    options: LineChartOptions = {},
  ): Promise<ChartResponse> {
    try {
      this.logger.log(`Generating debt reduction chart for user ${userId}`);

      // Get credit cards for the user
      const creditCards = await this.creditCardService.findAll(userId);

      if (creditCards.length === 0) {
        return {
          error: 'No credit cards found for this user',
        };
      }

      // For a real implementation, you would fetch historical debt data
      // For this example, we'll simulate historical data
      const months = 6; // Last 6 months
      const now = new Date();
      const data: ChartData = {
        series: [
          {
            name: 'Total Debt',
            data: [],
          },
        ],
      };

      // Calculate current total debt
      const currentTotalDebt = creditCards.reduce(
        (sum, card) => sum + card.currentDebtCents / 100,
        0,
      );

      // Simulate historical debt (increasing as we go back in time)
      for (let i = 0; i < months; i++) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);

        // Simulate higher debt in the past (5% increase per month back in time)
        const factor = 1 + i * 0.05;
        const debt = currentTotalDebt * factor;

        // Ensure data.series[0].data exists before using it
        if (data.series[0] && Array.isArray(data.series[0].data)) {
          // We can safely use non-null assertion here as we know date is valid
          const dateString = date.toISOString().split('T')[0]!.substring(0, 7); // YYYY-MM format
          data.series[0].data.push({
            x: dateString,
            y: Math.round(debt * 100) / 100, // Round to 2 decimal places
          });
        }
      }

      // Set default options if not provided
      const chartOptions: LineChartOptions = {
        title: 'Debt Reduction Progress',
        xAxisLabel: 'Month',
        yAxisLabel: 'Total Debt ($)',
        showPoints: true,
        fillArea: true,
        timeScale: true,
        ...options,
      };

      return this.chartGeneratorService.generateChart(
        ChartType.AREA,
        data,
        chartOptions,
      );
    } catch (error) {
      this.logger.error(
        `Error generating debt reduction chart: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return {
        error: `Failed to generate debt reduction chart: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Generate a budget vs. actual spending comparison chart
   * @param userId The user ID
   * @param options Chart options
   * @returns A promise that resolves to a chart response
   */
  async generateBudgetComparisonChart(
    userId: number,
    options: BarChartOptions = {},
  ): Promise<ChartResponse> {
    try {
      this.logger.log(`Generating budget comparison chart for user ${userId}`);

      // Get budget data for the user
      const budgetData = await this.budgetService.getCurrentBudget(userId);

      if (!budgetData || !budgetData.limits || !budgetData.spent) {
        return {
          error: 'No budget data found for this user',
        };
      }

      // Prepare data for chart
      const categories = Object.keys(budgetData.limits);
      const data: ChartData = {
        series: [
          {
            name: 'Budget',
            data: categories.map((category) => ({
              x: category,
              y: budgetData.limits[category] || 0,
            })),
          },
          {
            name: 'Actual',
            data: categories.map((category) => ({
              x: category,
              y: budgetData.spent[category] || 0,
            })),
          },
        ],
      };

      // Set default options if not provided
      const chartOptions: BarChartOptions = {
        title: 'Budget vs. Actual Spending',
        xAxisLabel: 'Category',
        yAxisLabel: 'Amount ($)',
        stacked: false,
        showValues: true,
        ...options,
      };

      return this.chartGeneratorService.generateChart(
        ChartType.BAR,
        data,
        chartOptions,
      );
    } catch (error) {
      this.logger.error(
        `Error generating budget comparison chart: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return {
        error: `Failed to generate budget comparison chart: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Generate a cash flow projection chart
   * @param userId The user ID
   * @param months Number of months to project
   * @param options Chart options
   * @returns A promise that resolves to a chart response
   */
  async generateCashFlowProjectionChart(
    userId: number,
    months: number = 6,
    options: LineChartOptions = {},
  ): Promise<ChartResponse> {
    try {
      this.logger.log(
        `Generating cash flow projection chart for user ${userId}`,
      );

      // Get recent transactions to calculate average income and expenses
      const transactions = await this.transactionService.findAll({
        userId,
        // We can't use limit here as it's not in the interface
        // We'll filter after fetching
      });

      if (transactions.length === 0) {
        return {
          error: 'No transactions found for this user',
        };
      }

      // Limit to last 100 transactions if needed
      const recentTransactions = transactions.slice(0, 100);

      // Calculate average monthly income and expenses
      // Determine if a transaction is income based on transactionType
      const incomeTransactions = recentTransactions.filter(
        (t) => t.transactionType === TransactionType.CREDIT,
      );
      const expenseTransactions = recentTransactions.filter(
        (t) => t.transactionType !== TransactionType.CREDIT,
      );

      const avgMonthlyIncome =
        incomeTransactions.reduce((sum, t) => sum + t.amountCents / 100, 0) / 3; // Assume 3 months of data
      const avgMonthlyExpense =
        expenseTransactions.reduce(
          (sum, t) => sum + Math.abs(t.amountCents) / 100,
          0,
        ) / 3;

      // Prepare data for chart
      const now = new Date();
      const data: ChartData = {
        series: [
          {
            name: 'Projected Balance',
            data: [],
          },
          {
            name: 'Income',
            data: [],
          },
          {
            name: 'Expenses',
            data: [],
          },
        ],
      };

      // Start with current balance (simplified)
      let currentBalance = 5000; // Placeholder, in a real app you'd get this from an account service

      // Project for the specified number of months
      for (let i = 0; i < months; i++) {
        const date = new Date(now);
        date.setMonth(date.getMonth() + i);

        // We can safely use non-null assertion here as we know date is valid
        const monthLabel = date.toISOString().split('T')[0]!.substring(0, 7); // YYYY-MM format

        // Add income and expense data points
        if (data.series[1] && Array.isArray(data.series[1].data)) {
          data.series[1].data.push({
            x: monthLabel,
            y: Math.round(avgMonthlyIncome * 100) / 100,
          });
        }

        if (data.series[2] && Array.isArray(data.series[2].data)) {
          data.series[2].data.push({
            x: monthLabel,
            y: Math.round(avgMonthlyExpense * 100) / 100,
          });
        }

        // Update and add balance data point
        currentBalance += avgMonthlyIncome - avgMonthlyExpense;
        if (data.series[0] && Array.isArray(data.series[0].data)) {
          data.series[0].data.push({
            x: monthLabel,
            y: Math.round(currentBalance * 100) / 100,
          });
        }
      }

      // Set default options if not provided
      const chartOptions: LineChartOptions = {
        title: 'Cash Flow Projection',
        xAxisLabel: 'Month',
        yAxisLabel: 'Amount ($)',
        showPoints: true,
        timeScale: true,
        ...options,
      };

      return this.chartGeneratorService.generateChart(
        ChartType.LINE,
        data,
        chartOptions,
      );
    } catch (error) {
      this.logger.error(
        `Error generating cash flow projection chart: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return {
        error: `Failed to generate cash flow projection chart: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Generate time series data for line and area charts
   * @param createChartDto The DTO containing chart parameters
   * @returns A promise that resolves to chart data
   */
  private async generateTimeSeriesData(
    createChartDto: CreateChartDto,
  ): Promise<ChartData> {
    const {
      userId,
      startDate,
      endDate,
      categories,
      groupBy = 'month',
    } = createChartDto;

    // Get transactions for the specified date range and categories
    const transactions = await this.transactionService.findAll({
      userId,
      startDate,
      endDate,
      categories,
    });

    if (transactions.length === 0) {
      throw new Error('No transactions found for the specified criteria');
    }

    // Group transactions by the specified time period
    const groupedTransactions = this.groupTransactionsByTime(
      transactions,
      groupBy === 'category'
        ? 'month'
        : (groupBy as 'day' | 'week' | 'month' | 'year'), // Default to month if category is selected
    );

    // Convert to chart data format
    const series: ChartDataSeries[] = [
      {
        name: 'Spending',
        data: Object.entries(groupedTransactions).map(([period, amount]) => ({
          x: period,
          y: Math.round(amount * 100) / 100,
        })),
      },
    ];

    return { series };
  }

  /**
   * Generate category comparison data for bar charts
   * @param createChartDto The DTO containing chart parameters
   * @returns A promise that resolves to chart data
   */
  private async generateCategoryComparisonData(
    createChartDto: CreateChartDto,
  ): Promise<ChartData> {
    const { userId, startDate, endDate, categories } = createChartDto;

    // Get transactions for the specified date range
    const transactions = await this.transactionService.findAll({
      userId,
      startDate,
      endDate,
    });

    if (transactions.length === 0) {
      throw new Error('No transactions found for the specified criteria');
    }

    // Get category names
    const categoryMap = await this.getCategoryMap();

    // Group transactions by category
    const categoryTotals: Record<string, number> = {};

    for (const transaction of transactions) {
      // Skip if categories filter is provided and this category is not included
      if (
        categories &&
        transaction.categoryId &&
        !categories.includes(
          categoryMap[transaction.categoryId] ||
            transaction.categoryId.toString(),
        )
      ) {
        continue;
      }

      // Only include expenses (non-credit transactions)
      if (transaction.transactionType !== TransactionType.CREDIT) {
        const categoryName = transaction.categoryId
          ? categoryMap[transaction.categoryId] ||
            `Category ${transaction.categoryId}`
          : 'Uncategorized';

        categoryTotals[categoryName] =
          (categoryTotals[categoryName] || 0) +
          Math.abs(transaction.amountCents) / 100;
      }
    }

    // Sort categories by amount (descending)
    const sortedCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10); // Limit to top 10 categories

    // Convert to chart data format
    const data: ChartData = {
      series: [
        {
          name: 'Spending',
          data: sortedCategories.map(([category, amount]) => ({
            x: category,
            y: Math.round(amount * 100) / 100,
          })),
        },
      ],
    };

    return data;
  }

  /**
   * Generate distribution data for pie charts
   * @param createChartDto The DTO containing chart parameters
   * @returns A promise that resolves to chart data
   */
  private async generateDistributionData(
    createChartDto: CreateChartDto,
  ): Promise<ChartData> {
    const { userId, startDate, endDate, categories } = createChartDto;

    // Get transactions for the specified date range
    const transactions = await this.transactionService.findAll({
      userId,
      startDate,
      endDate,
    });

    if (transactions.length === 0) {
      throw new Error('No transactions found for the specified criteria');
    }

    // Get category names
    const categoryMap = await this.getCategoryMap();

    // Group transactions by category
    const categoryTotals: Record<string, number> = {};

    for (const transaction of transactions) {
      // Skip if categories filter is provided and this category is not included
      if (
        categories &&
        transaction.categoryId &&
        !categories.includes(
          categoryMap[transaction.categoryId] ||
            transaction.categoryId.toString(),
        )
      ) {
        continue;
      }

      // Only include expenses (non-credit transactions)
      if (transaction.transactionType !== TransactionType.CREDIT) {
        const categoryName = transaction.categoryId
          ? categoryMap[transaction.categoryId] ||
            `Category ${transaction.categoryId}`
          : 'Uncategorized';

        categoryTotals[categoryName] =
          (categoryTotals[categoryName] || 0) +
          Math.abs(transaction.amountCents) / 100;
      }
    }

    // Sort categories by amount (descending)
    const sortedCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10); // Limit to top 10 categories

    // Convert to chart data format
    const data: ChartData = {
      series: [
        {
          name: 'Spending by Category',
          data: sortedCategories.map(([category, amount]) => ({
            x: category,
            y: Math.round(amount * 100) / 100,
          })),
        },
      ],
    };

    return data;
  }

  /**
   * Group transactions by time period
   * @param transactions The transactions to group
   * @param groupBy The time period to group by
   * @returns A record of time periods to total amounts
   */
  private groupTransactionsByTime(
    transactions: ITransaction[],
    groupBy: 'day' | 'week' | 'month' | 'year',
  ): Record<string, number> {
    const result: Record<string, number> = {};

    for (const transaction of transactions) {
      const date = new Date(transaction.transactionDate);
      let period = '';

      switch (groupBy) {
        case 'day': {
          period = date.toISOString().split('T')[0]!; // YYYY-MM-DD
          break;
        }
        case 'week': {
          // Get the Monday of the week
          const day = date.getDay();
          const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
          const monday = new Date(date);
          monday.setDate(diff);
          period = monday.toISOString().split('T')[0]!; // YYYY-MM-DD of Monday
          break;
        }
        case 'year':
          period = date.getFullYear().toString();
          break;
        case 'month':
        default: {
          period = date.toISOString().split('T')[0]!.substring(0, 7); // YYYY-MM
          break;
        }
      }

      // Add the transaction amount to the period total
      result[period] =
        (result[period] || 0) + Math.abs(transaction.amountCents) / 100;
    }

    return result;
  }

  /**
   * Get a mapping of category IDs to names
   * @returns A promise that resolves to a record of category IDs to names
   */
  private async getCategoryMap(): Promise<Record<number, string>> {
    try {
      const categories = await this.categoryService.findAll(1); // Use default user ID
      const map: Record<number, string> = {};

      for (const category of categories) {
        map[category.id] = category.name;
      }

      return map;
    } catch (error) {
      this.logger.error(
        `Error getting category map: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return {};
    }
  }
}
