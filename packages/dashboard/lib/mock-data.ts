/**
 * Generates mock transaction data for the chart
 * @returns Array of transaction data points with income and expenses
 */
export function generateMockTransactionData() {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  // Get the last 6 months
  const currentMonth = new Date().getMonth();
  const lastSixMonths = Array(6)
    .fill(0)
    .map((_, i) => {
      const monthIndex = (currentMonth - 5 + i + 12) % 12;
      return months[monthIndex];
    });
  
  return lastSixMonths.map((month, index) => {
    // Generate random income between 3000 and 8000
    const income = Math.round((3000 + Math.random() * 5000) * 100) / 100;
    
    // Generate random expenses between 2000 and 6000
    const expenses = Math.round((2000 + Math.random() * 4000) * 100) / 100;
    
    return {
      name: month,
      income,
      expenses
    };
  });
} 