import { getAuthUser } from "@/lib/auth";
import { getSystemStats, getAllUsers } from "@/lib/actions/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, Calendar, Activity } from "lucide-react";

export default async function AdminDashboard() {
    const user = await getAuthUser();
    const stats = await getSystemStats();
    const users = await getAllUsers();

    if (!user) return <div>Unauthorized</div>;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
                <p className="text-slate-500">System Overview & Staff Management</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Patients</p>
                            <h3 className="text-2xl font-bold text-slate-900">{(stats as any).patients}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Appointments</p>
                            <h3 className="text-2xl font-bold text-slate-900">{(stats as any).appointments}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                            <h3 className="text-2xl font-bold text-slate-900">Rs. {(stats as any).revenue?.toLocaleString()}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Active Staff</p>
                            <h3 className="text-2xl font-bold text-slate-900">{(stats as any).doctors + 3}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Management Preview */}
                <Card className="min-h-[400px]">
                    <CardHeader><CardTitle>Recent Users</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Joined</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.slice(0, 5).map((u: any) => (
                                    <TableRow key={u.id + u.role}>
                                        <TableCell className="font-medium">{u.first_name} {u.last_name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={
                                                u.role === 'Doctor' ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                                                    u.role === 'Patient' ? "bg-slate-50 text-slate-700 border-slate-200" :
                                                        "bg-orange-50 text-orange-700 border-orange-200"
                                            }>{u.role}</Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-500">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* System Logs Placeholder */}
                <Card className="min-h-[400px]">
                    <CardHeader><CardTitle>System Activity</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="text-sm text-slate-500 italic text-center py-4">
                                Real-time activity logs are not enabled in this prototype version.
                            </div>
                            {/* Mock Logs for Visualization */}
                            {[1, 2, 3].map((_, i) => (
                                <div key={i} className="flex gap-3 text-sm border-b pb-3 last:border-0">
                                    <div className="text-slate-400 font-mono text-xs mt-1">10:{30 - i} AM</div>
                                    <div>
                                        <p className="font-medium text-slate-800">System Check</p>
                                        <p className="text-slate-500">Routine database verification passed.</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
