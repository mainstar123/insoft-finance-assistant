"use client"

import { useState } from "react"
import { MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"

type Transaction = {
    id: string
    date: string
    description: {
        name: string
        email?: string
        account?: string
    }
    icon: string
    category: {
        name: string
        type: string
    }
    amount: string
    status: "Pago" | "Não Pago"
    isPositive: boolean
}

export default function TransactionsTable() {
    const [activeTab, setActiveTab] = useState("All")
    const [statusFilter, setStatusFilter] = useState("All")

    const transactions: Transaction[] = [
        {
            id: "456789356",
            date: "Sep 9, 2024, 04:30pm",
            description: {
                name: "fadel@email.com",
                email: "fadel@email.com",
            },
            icon: "F",
            category: {
                name: "Salário",
                type: "Receita",
            },
            amount: "+$5,670.00",
            status: "Pago",
            isPositive: true,
        },
        {
            id: "456789356",
            date: "Sep 8, 2024, 03:13pm",
            description: {
                name: "Wise - 5466xxxx",
                account: "5466xxxx",
            },
            icon: "W",
            category: {
                name: "Freela",
                type: "Receita",
            },
            amount: "+$15,000.00",
            status: "Pago",
            isPositive: true,
        },
        {
            id: "456789356",
            date: "Sep 7, 2024, 1:00pm",
            description: {
                name: "Paypal - 3345xxxx",
                account: "3345xxxx",
            },
            icon: "P",
            category: {
                name: "Alimentação",
                type: "Despesa",
            },
            amount: "-$3,456.00",
            status: "Não Pago",
            isPositive: false,
        },
        {
            id: "456789356",
            date: "Sep 6, 2024, 07:00am",
            description: {
                name: "kikikarisma@email.com",
                email: "kikikarisma@email.com",
            },
            icon: "F",
            category: {
                name: "Alimentação",
                type: "Receita",
            },
            amount: "+$30,000.00",
            status: "Não Pago",
            isPositive: true,
        },
        {
            id: "456789356",
            date: "Sep 8, 2024, 03:13pm",
            description: {
                name: "Wise - 5466xxxx",
                account: "5466xxxx",
            },
            icon: "W",
            category: {
                name: "Alimentação",
                type: "Receita",
            },
            amount: "+$8,000.00",
            status: "Pago",
            isPositive: true,
        },
    ]

    const tabs = ["All", "Savings", "Income", "Expenses"]

    return (
        <div>
            <div className="mb-4 border-b border-gray-200">
                <div className="flex justify-between">
                    <div className="flex">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`relative px-4 py-4 text-sm font-medium ${activeTab === tab ? "text-purple-700" : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                {tab}
                                {activeTab === tab && <span className="absolute bottom-0 left-0 h-0.5 w-full bg-purple-700"></span>}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center">
                        <span className="mr-2 text-sm text-gray-500">Status:</span>
                        <Button variant="outline" className="flex items-center gap-2">
                            <span>All</span>
                            <ChevronDownIcon className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200 text-left text-sm font-medium text-gray-500">
                            <th className="whitespace-nowrap px-4 py-3">Ref ID</th>
                            <th className="whitespace-nowrap px-4 py-3">Transaction Date</th>
                            <th className="whitespace-nowrap px-4 py-3">Description</th>
                            <th className="whitespace-nowrap px-4 py-3">Category / Type</th>
                            <th className="whitespace-nowrap px-4 py-3">Amount</th>
                            <th className="whitespace-nowrap px-4 py-3">Status</th>
                            <th className="whitespace-nowrap px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((transaction, index) => (
                            <tr key={index} className="border-b border-gray-200">
                                <td className="whitespace-nowrap px-4 py-4 text-sm">{transaction.id}</td>
                                <td className="whitespace-nowrap px-4 py-4 text-sm">{transaction.date}</td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center">
                                        <Avatar className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-white">
                                            <span>{transaction.icon}</span>
                                        </Avatar>
                                        <span className="text-sm">{transaction.description.name}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <div>
                                        <div className="text-sm font-medium">{transaction.category.name}</div>
                                        <div className="text-xs text-gray-500">{transaction.category.type}</div>
                                    </div>
                                </td>
                                <td
                                    className={`whitespace-nowrap px-4 py-4 text-sm ${transaction.isPositive ? "text-green-600" : "text-red-600"
                                        }`}
                                >
                                    {transaction.amount}
                                </td>
                                <td className="whitespace-nowrap px-4 py-4">
                                    <span
                                        className={`rounded-full px-2 py-1 text-xs ${transaction.status === "Pago" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-600"
                                            }`}
                                    >
                                        {transaction.status}
                                    </span>
                                </td>
                                <td className="whitespace-nowrap px-4 py-4">
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

import { ChevronDownIcon } from "lucide-react"
