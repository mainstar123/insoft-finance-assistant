export default function SummaryCards() {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-2 text-sm font-medium text-gray-500">Saldo</div>
                <div className="flex items-center">
                    <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                        <span className="text-xl font-bold">$</span>
                    </div>
                    <span className="text-2xl font-bold">$78,987.00</span>
                </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-2 text-sm font-medium text-gray-500">Saldo</div>
                <div className="flex items-center">
                    <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                        <span className="text-xl">💳</span>
                    </div>
                    <span className="text-2xl font-bold">$23,000.00</span>
                </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-2 text-sm font-medium text-gray-500">Receitas</div>
                <div className="flex items-center">
                    <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                        <span className="text-xl">↓</span>
                    </div>
                    <span className="text-2xl font-bold">$28,670.00</span>
                </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-2 text-sm font-medium text-gray-500">Despesas</div>
                <div className="flex items-center">
                    <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                        <span className="text-xl">↑</span>
                    </div>
                    <span className="text-2xl font-bold">$3,456.00</span>
                </div>
            </div>
        </div>
    )
}
