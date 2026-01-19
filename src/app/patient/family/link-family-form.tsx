"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { sendLinkRequest } from "@/lib/actions/family";

export default function LinkFamilyForm() {
    const [email, setEmail] = useState("");
    const [relationship, setRelationship] = useState("Parent");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!email) return;
        setLoading(true);

        const result = await sendLinkRequest(email, relationship);

        if (result.success) {
            toast.success(result.message);
            setEmail("");
        } else {
            toast.error(result.error);
        }

        setLoading(false);
    };

    return (
        <Card className="bg-slate-50 border-slate-200">
            <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Add Family Member</h3>
                <div className="flex flex-col md:flex-row gap-4">
                    <Input
                        placeholder="Enter patient email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1"
                    />
                    <div className="w-40">
                        <Select value={relationship} onValueChange={setRelationship}>
                            <SelectTrigger>
                                <SelectValue placeholder="Relation" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Parent">Parent</SelectItem>
                                <SelectItem value="Child">Child</SelectItem>
                                <SelectItem value="Spouse">Spouse</SelectItem>
                                <SelectItem value="Guardian">Guardian</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? "Sending..." : "Send Request"}
                    </Button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    * The request will need to be approved by a receptionist before linking is active.
                </p>
            </CardContent>
        </Card>
    );
}
