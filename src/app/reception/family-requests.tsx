"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Users } from "lucide-react";
import { approveFamilyRequest, rejectFamilyRequest } from "@/lib/actions/reception";
import { toast } from "sonner";

export default function FamilyRequests({ requests }: { requests: any[] }) {
    const [loadingId, setLoadingId] = useState<number | null>(null);

    const handleAction = async (id: number, action: 'approve' | 'reject') => {
        setLoadingId(id);
        try {
            const res = action === 'approve'
                ? await approveFamilyRequest(id)
                : await rejectFamilyRequest(id);

            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(`Request ${action}d`);
            }
        } catch (e) {
            toast.error("Action failed");
        } finally {
            setLoadingId(null);
        }
    };

    if (!requests || requests.length === 0) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Family Requests
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-slate-500 text-sm">
                        No pending requests.
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full border-blue-100">
            <CardHeader className="bg-blue-50/50 border-b border-blue-50">
                <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
                    <Users className="w-5 h-5" />
                    Family Requests
                    <span className="ml-auto bg-blue-200 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                        {requests.length}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                    {requests.map((req) => (
                        <div key={req.id} className="p-4 flex flex-col gap-3">
                            <div>
                                <p className="font-semibold text-slate-900 text-sm">
                                    {req.requester?.first_name} {req.requester?.last_name}
                                </p>
                                <p className="text-xs text-slate-500">wants to link</p>
                                <p className="font-semibold text-slate-900 text-sm">
                                    {req.target?.first_name} {req.target?.last_name}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    Relationship: <span className="font-medium text-slate-700">{req.relationship}</span>
                                </p>
                            </div>
                            <div className="flex gap-2 mt-1">
                                <Button
                                    size="sm"
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-8 text-xs"
                                    onClick={() => handleAction(req.id, 'approve')}
                                    disabled={loadingId === req.id}
                                >
                                    <Check className="w-3 h-3 mr-1" /> Approve
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 border-red-200 text-red-700 hover:bg-red-50 h-8 text-xs"
                                    onClick={() => handleAction(req.id, 'reject')}
                                    disabled={loadingId === req.id}
                                >
                                    <X className="w-3 h-3 mr-1" /> Reject
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
