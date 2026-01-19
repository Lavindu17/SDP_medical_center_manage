import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import DashboardSidebar from "@/components/dashboard/sidebar";
import DashboardHeader from "@/components/dashboard/header";

export default async function DoctorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getAuthUser();

    if (!user) {
        redirect("/login");
    }

    if (user.role !== "doctor") {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <DashboardSidebar role="doctor" />
            <div className="lg:pl-72">
                <DashboardHeader user={user} />
                <main className="py-6 px-4 sm:px-6 lg:px-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
