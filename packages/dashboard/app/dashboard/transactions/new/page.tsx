"use client";

import { useRouter } from "next/navigation";
import { TransactionForm } from "@/components/transactions/transaction-form";

export default function NewTransactionPage() {
    const router = useRouter();

    const handleSubmit = async (data: any) => {
        try {
            const response = await fetch("/api/transactions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error("Failed to create transaction");
            }

            router.push("/dashboard/transactions");
            router.refresh();
        } catch (error) {
            console.error("Error creating transaction:", error);
            // Here you would typically show an error toast/notification
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">New Transaction</h1>
            <div className="max-w-2xl">
                <TransactionForm onSubmit={handleSubmit} />
            </div>
        </div>
    );
} 