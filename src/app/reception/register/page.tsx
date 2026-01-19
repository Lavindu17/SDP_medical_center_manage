import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPatientPage() {
    return (
        <div className="max-w-xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h1 className="text-2xl font-bold text-slate-900">Register New Patient</h1>
                <p className="text-slate-500">Create a patient record for walk-ins</p>
            </div>

            <Card>
                <CardContent className="p-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Feature Under Maintenance</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">
                        The "Quick Registration" feature requires Admin API access which is currently disabled in this prototype.
                        Please use the public Sign Up page for now.
                    </p>
                    <Button variant="outline" className="w-full max-w-xs">
                        Back to Dashboard
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
