"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, UserPlus } from "lucide-react";
import CreateStaffDialog from "./create-staff-dialog";
import EditStaffDialog from "./edit-staff-dialog";
import DeleteStaffDialog from "./delete-staff-dialog";

interface StaffMember {
    id: string;
    first_name: string;
    last_name: string | null;
    email: string | null;
    role: string;
    contact_number?: string | null;
    specialization?: string | null;
    slmc_reg_number?: string | null;
    consultation_fee?: number | null;
    license_number?: string | null;
    desk_id?: string | null;
    created_at: string;
}

interface StaffTableClientProps {
    initialStaff: StaffMember[];
}

const roleColors: Record<string, string> = {
    "Doctor": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Pharmacist": "bg-purple-50 text-purple-700 border-purple-200",
    "Receptionist": "bg-amber-50 text-amber-700 border-amber-200",
    "Lab Assistant": "bg-indigo-50 text-indigo-700 border-indigo-200",
    "Admin": "bg-red-50 text-red-700 border-red-200",
};

export default function StaffTableClient({ initialStaff }: StaffTableClientProps) {
    const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all");

    // Dialog states
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

    // Filter staff based on search and tab
    const filteredStaff = staff.filter((s) => {
        const matchesSearch =
            s.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.last_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (s.email?.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesTab =
            activeTab === "all" ||
            s.role.toLowerCase().replace(" ", "_") === activeTab;

        return matchesSearch && matchesTab;
    });

    const handleEdit = (member: StaffMember) => {
        setSelectedStaff(member);
        setEditDialogOpen(true);
    };

    const handleDelete = (member: StaffMember) => {
        setSelectedStaff(member);
        setDeleteDialogOpen(true);
    };

    const getRoleDetail = (member: StaffMember): string => {
        switch (member.role) {
            case "Doctor":
                return member.specialization || "General";
            case "Pharmacist":
                return member.license_number || "-";
            case "Receptionist":
                return member.desk_id || "-";
            default:
                return "-";
        }
    };

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Staff Management</h1>
                            <p className="text-slate-500">Manage all staff accounts and permissions</p>
                        </div>
                        <Button
                            onClick={() => setCreateDialogOpen(true)}
                            className="bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-700 hover:to-rose-600"
                        >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add Staff
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Search */}
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search by name or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            {/* Role Tabs */}
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                                <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full sm:w-auto">
                                    <TabsTrigger value="all">All</TabsTrigger>
                                    <TabsTrigger value="doctor">Doctors</TabsTrigger>
                                    <TabsTrigger value="pharmacist">Pharm.</TabsTrigger>
                                    <TabsTrigger value="receptionist">Recep.</TabsTrigger>
                                    <TabsTrigger value="lab_assistant">Lab</TabsTrigger>
                                    <TabsTrigger value="admin">Admin</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </CardContent>
                </Card>

                {/* Staff Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">
                            Staff Members ({filteredStaff.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {filteredStaff.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <UserPlus className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-900 mb-1">No staff found</h3>
                                <p className="text-slate-500 mb-4">
                                    {searchQuery
                                        ? "Try adjusting your search query"
                                        : "Get started by adding your first staff member"}
                                </p>
                                {!searchQuery && (
                                    <Button onClick={() => setCreateDialogOpen(true)}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Staff
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Details</TableHead>
                                            <TableHead>Joined</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredStaff.map((member) => (
                                            <TableRow key={member.id}>
                                                <TableCell className="font-medium">
                                                    {member.first_name} {member.last_name || ""}
                                                </TableCell>
                                                <TableCell className="text-slate-500">
                                                    {member.email || "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={roleColors[member.role] || ""}
                                                    >
                                                        {member.role}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-slate-500 text-sm">
                                                    {getRoleDetail(member)}
                                                </TableCell>
                                                <TableCell className="text-slate-500 text-sm">
                                                    {new Date(member.created_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontal className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleEdit(member)}>
                                                                <Pencil className="w-4 h-4 mr-2" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleDelete(member)}
                                                                className="text-red-600 focus:text-red-600"
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Dialogs */}
            <CreateStaffDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
            />
            <EditStaffDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                staff={selectedStaff}
            />
            <DeleteStaffDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                staff={selectedStaff}
            />
        </>
    );
}
