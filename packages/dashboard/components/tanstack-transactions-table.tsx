"use client"

import { useState, useMemo } from "react"
import { MoreVertical, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    useReactTable,
    type SortingState,
    type ColumnFiltersState,
} from "@tanstack/react-table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

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

const columnHelper = createColumnHelper<Transaction>()

export default function TanStackTransactionsTable() {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [statusFilter, setStatusFilter] = useState("All")
    const [activeTab, setActiveTab] = useState("All")

    const columns = useMemo(
        () => [
            columnHelper.accessor("id", {
                header: "Ref ID",
                cell: (info) => info.getValue(),
            }),
            columnHelper.accessor("date", {
                header: "Transaction Date",
                cell: (info) => info.getValue(),
            }),
            columnHelper.accessor("description", {
                header: "Description",
                cell: (info) => {
                    const description = info.getValue()
                    const row = info.row.original
                    return (
                        <div className="flex items-center">
                            <Avatar className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-white">
                                <span>{row.icon}</span>
                            </Avatar>
                            <span className="text-sm">{description.name}</span>
                        </div>
                    )
                },
            }),
            columnHelper.accessor("category", {
                header: "Category / Type",
                cell: (info) => {
                    const category = info.getValue()
                    return (
                        <div>
                            <div className="text-sm font-medium">{category.name}</div>
                            <div className="text-xs text-gray-500">{category.type}</div>
                        </div>
                    )
                },
                filterFn: (row, id, value) => {
                    return value === "All" || row.original.category.type === value
                },
            }),
            columnHelper.accessor("amount", {
                header: "Amount",
                cell: (info) => {
                    const row = info.row.original
                    return <span className={row.isPositive ? "text-green-600" : "text-red-600"}>{info.getValue()}</span>
                },
            }),
            columnHelper.accessor("status", {
                header: "Status",
                cell: (info) => {
                    const status = info.getValue()
                    return (
                        <span
                            className={`rounded-full px-2 py-1 text-xs ${status === "Pago" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-600"
                                }`}
                        >
                            {status}
                        </span>
                    )
                },
                filterFn: (row, id, value) => {
                    return value === "All" || row.original.status === value
                },
            }),
            columnHelper.display({
                id: "actions",
                header: "Actions",
                cell: () => (
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                ),
            }),
        ],
        []
    )

    const filteredData = useMemo(() => {
        if (activeTab === "All") return transactions
        if (activeTab === "Income") return transactions.filter((t) => t.isPositive)
        if (activeTab === "Expenses") return transactions.filter((t) => !t.isPositive)
        if (activeTab === "Savings") return transactions.filter((t) => t.category.name === "Poupança")
        return transactions
    }, [activeTab])

    const table = useReactTable({
        data: filteredData,
        columns,
        state: {
            sorting,
            columnFilters,
            columnVisibility: {},
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    })

    const tabs = ["All", "Savings", "Income", "Expenses"]
    const statusOptions = ["All", "Pago", "Não Pago"]

    const handleStatusFilterChange = (status: string) => {
        setStatusFilter(status)
        if (status !== "All") {
            table.getColumn("status")?.setFilterValue(status)
        } else {
            table.getColumn("status")?.setFilterValue(undefined)
        }
    }

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
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="flex items-center gap-2">
                                    <span>{statusFilter}</span>
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                {statusOptions.map((status) => (
                                    <DropdownMenuItem
                                        key={status}
                                        onClick={() => handleStatusFilterChange(status)}
                                        className={statusFilter === status ? "bg-gray-100" : ""}
                                    >
                                        {status}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id} className="border-b border-gray-200 text-left text-sm font-medium text-gray-500">
                                {headerGroup.headers.map((header) => (
                                    <th key={header.id} className="whitespace-nowrap px-4 py-3">
                                        {header.isPlaceholder ? null : (
                                            <div
                                                className={header.column.getCanSort() ? "flex cursor-pointer items-center gap-1" : ""}
                                                onClick={header.column.getToggleSortingHandler()}
                                            >
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                {header.column.getCanSort() && (
                                                    <span>
                                                        {{
                                                            asc: <ChevronUp className="h-4 w-4" />,
                                                            desc: <ChevronDown className="h-4 w-4" />,
                                                        }[header.column.getIsSorted() as string] ?? null}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map((row) => (
                            <tr key={row.id} className="border-b border-gray-200">
                                {row.getVisibleCells().map((cell) => (
                                    <td key={cell.id} className="whitespace-nowrap px-4 py-4 text-sm">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex items-center justify-between">
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>
                <div className="text-sm text-gray-500">
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </div>
            </div>
        </div>
    )
} 