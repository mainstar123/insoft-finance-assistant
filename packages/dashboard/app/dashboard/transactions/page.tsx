import { CalendarIcon, ChevronDownIcon, Download, Plus } from "lucide-react"
import TransactionsTable from "@/components/transections-table"
import SummaryCards from "@/components/sumary-carts"
import { Button } from "@/components/ui/button"

export default function TransactionsHistory() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Histórico de transações</h1>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center rounded-md border border-gray-200 px-3 py-2">
                        <span className="text-sm text-gray-600">Sep 9, 2024 - Sep 15, 2024</span>
                        <CalendarIcon className="ml-2 h-4 w-4 text-gray-500" />
                    </div>

                    <Button variant="outline" className="flex items-center gap-2">
                        <span>Exportar CSV</span>
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                    <div className="relative">
                        <Button variant="outline" className="flex w-[180px] items-center justify-between">
                            <span>Filtrar por status</span>
                            <ChevronDownIcon className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="relative">
                        <Button variant="outline" className="flex w-[150px] items-center justify-between">
                            <span>Ordenar por</span>
                            <ChevronDownIcon className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <Button className="bg-purple-700 hover:bg-purple-800">
                    <Plus className="mr-2 h-4 w-4" />
                    Nova transação
                </Button>
            </div>

            <SummaryCards />

            <div className="mt-8">
                <TransactionsTable />
            </div>
        </div>
    )
}
