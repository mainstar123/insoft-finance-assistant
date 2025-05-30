"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TransactionForm } from "@/components/transactions/transaction-form";

interface PageProps {
    params: {
        id: string;
    };
}

export default function EditTransactionPage({ params }: PageProps) {
    const router = useRouter();
    const [transaction, setTransaction] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTransaction = async () => {
            try {
                const response = await fetch(`/api/transactions/${params.id}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch transaction");
                }
                const data = await response.json();
                setTransaction(data);
            } catch (error) {
                console.error("Error fetching transaction:", error);
                // Here you would typically show an error toast/notification
            } finally {
                setIsLoading(false);
            }
        };

        fetchTransaction();
    }, [params.id]);

    const handleSubmit = async (data: any) => {
        try {
            const response = await fetch(`/api/transactions/${params.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error("Failed to update transaction");
            }

            router.push("/dashboard/transactions");
            router.refresh();
        } catch (error) {
            console.error("Error updating transaction:", error);
            // Here you would typically show an error toast/notification
        }
    };

    if (isLoading) {
        return (
            <div className="p-6">
                <div>Loading...</div>
            </div>
        );
    }

    if (!transaction) {
        return (
            <div className="p-6">
                <div>Transaction not found</div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Edit Transaction</h1>
            <div className="max-w-2xl">
                <TransactionForm
                    initialData={transaction}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
} 