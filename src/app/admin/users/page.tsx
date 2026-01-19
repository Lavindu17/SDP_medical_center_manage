import { getAllStaffDetailed } from "@/lib/actions/admin";
import StaffTableClient from "./staff-table";

export default async function AdminUsersPage() {
    const { data: staff, error } = await getAllStaffDetailed();

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                    Error loading staff: {error}
                </div>
            </div>
        );
    }

    return <StaffTableClient initialStaff={staff || []} />;
}
