import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { getFamilyMembers, getPendingRequests } from "@/lib/actions/family";
import LinkFamilyForm from "./link-family-form";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function FamilyPage() {
    const user = await getAuthUser();
    if (!user) return null;

    const members = await getFamilyMembers();
    const pendingRequests = await getPendingRequests();

    return (
        <div className="max-w-4xl mx-auto py-8 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Family Members</h1>
                <p className="text-slate-500">Manage linked accounts for your family</p>
            </div>

            <LinkFamilyForm />

            <div className="space-y-6">
                <h2 className="text-xl font-semibold text-slate-800">Linked Accounts</h2>

                {members.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {members.map((item: any) => (
                            <Card key={item.id}>
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                        {item.member?.first_name?.[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{item.member?.first_name} {item.member?.last_name}</h3>
                                        <p className="text-sm text-slate-500">{item.relationship}</p>
                                    </div>
                                    <div className="ml-auto">
                                        <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                                            Active
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed">
                        No family members linked yet
                    </div>
                )}
            </div>

            {pendingRequests.length > 0 && (
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-slate-800">Pending Requests</h2>
                    <div className="space-y-2">
                        {pendingRequests.map((req: any) => (
                            <div key={req.id} className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                                <div>
                                    <p className="font-medium text-yellow-900">
                                        Request to link <strong>{req.target?.first_name} {req.target?.last_name}</strong>
                                    </p>
                                    <p className="text-sm text-yellow-700">
                                        Relation: {req.relationship} • Sent: {new Date(req.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <Badge className="bg-yellow-200 text-yellow-800 hover:bg-yellow-200">
                                    Waiting for Approval
                                </Badge>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
