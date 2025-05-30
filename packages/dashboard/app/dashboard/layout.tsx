import { SidebarDemo } from "@/components/ui/sidebar-demo";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="h-full">
            <SidebarDemo>
                {children}
            </SidebarDemo>
        </div>
    );
}