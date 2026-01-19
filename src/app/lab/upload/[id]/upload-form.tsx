"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { completeLabTest } from "@/lib/actions/lab";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

export default function UploadResultForm({ request }: { request: any }) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fileUrl, setFileUrl] = useState("https://example.com/dummy-report.pdf");

    const handleUpload = async () => {
        setIsSubmitting(true);
        try {
            const res = await completeLabTest(request.id, fileUrl);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Result uploaded successfully!");
                router.push("/lab");
            }
        } catch (e) {
            toast.error("Failed to upload.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardContent className="p-6 space-y-6">
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center bg-slate-50">
                    <div className="w-16 h-16 bg-white rounded-full mx-auto flex items-center justify-center shadow-sm mb-4">
                        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>
                    <p className="text-slate-600 font-medium">Drag and drop result PDF here</p>
                    <p className="text-xs text-slate-400 mt-1">or click to browse</p>
                    <Button variant="outline" className="mt-4" disabled>Coming Soon (File Picker)</Button>
                </div>

                <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                        <p className="text-sm text-yellow-800">
                            <strong>Note for Prototype:</strong> File upload to storage bucket is mocked.
                            We will attach a placeholder link for the patient to "download".
                        </p>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-700">Result File Link (Mock)</label>
                        <Input
                            value={fileUrl}
                            onChange={(e) => setFileUrl(e.target.value)}
                            className="mt-1"
                        />
                    </div>

                    <Button
                        onClick={handleUpload}
                        disabled={isSubmitting}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 text-lg"
                    >
                        {isSubmitting ? "Uploading..." : "Confirm & Complete Request"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
