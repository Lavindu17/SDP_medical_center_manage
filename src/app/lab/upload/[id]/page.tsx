import { getLabRequestDetails } from "@/lib/actions/lab";
import { getAuthUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import UploadResultForm from "./upload-form";

type Props = {
    params: { id: string };
};

export default async function LabUploadPage({ params }: Props) {
    const user = await getAuthUser();
    if (!user || user.role !== "lab_assistant") redirect("/login");

    const request = await getLabRequestDetails(params.id);

    if (!request) return notFound();

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h1 className="text-2xl font-bold text-slate-900">Upload Lab Results</h1>
                <p className="text-slate-500">Test: {request.test_name} • Patient: {request.appointment?.patient?.first_name}</p>
            </div>

            <UploadResultForm request={request} />
        </div>
    );
}
