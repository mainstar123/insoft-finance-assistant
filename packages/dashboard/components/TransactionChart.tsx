import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

// Sample data structure for the chart
interface TransactionChartData {
    name: string;
    income: number;
    expenses: number;
}

interface TransactionChartProps {
    data: TransactionChartData[];
    height?: number | string;
}

/**
 * A component that renders a bar chart showing income vs expenses
 * for transactions across different periods (months, weeks, etc.)
 */
export function TransactionChart({
    data,
    height = 300
}: TransactionChartProps) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart
                data={data}
                margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                    formatter={(value) => {
                        const numValue = typeof value === 'number' ? value : parseFloat(String(value));
                        return isNaN(numValue) ? value : `R$ ${numValue.toFixed(2)}`;
                    }}
                />
                <Legend />
                <Bar dataKey="income" name="Receitas" fill="#10b981" />
                <Bar dataKey="expenses" name="Despesas" fill="#ef4444" />
            </BarChart>
        </ResponsiveContainer>
    );
} 