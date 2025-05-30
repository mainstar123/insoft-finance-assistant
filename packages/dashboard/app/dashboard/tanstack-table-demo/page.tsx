import TanStackTransactionsTable from "@/components/tanstack-transactions-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function TanStackTableDemo() {
    return (
        <div className="container h-full gap-4 overflow-y-auto mx-auto p-6">
            <div className="flex justify-between items-center">
                <h1 className="mb-4 text-2xl font-bold">Transações</h1>

                <div>
                    <Button className="bg-light">
                        <Plus />
                        Nova transação
                    </Button>
                </div>
            </div>

            <div className="rounded-lg border bg-white p-6 shadow-sm">
                <TanStackTransactionsTable />
            </div>
        </div>
    )
} 