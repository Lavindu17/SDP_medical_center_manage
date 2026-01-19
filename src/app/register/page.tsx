import { redirect } from "next/navigation";
import { getAuthUser, getDashboardPath } from "@/lib/auth";
import RegisterForm from "./register-form";

export default async function RegisterPage() {
    // If user is already logged in, redirect to their dashboard
    const user = await getAuthUser();
    if (user && user.role) {
        redirect(getDashboardPath(user.role));
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12">
            <div className="w-full max-w-md p-8">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 mb-4">
                            <svg
                                className="w-8 h-8 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                                />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white">Create Account</h1>
                        <p className="text-slate-400 mt-2">
                            Register as a new patient
                        </p>
                    </div>

                    <RegisterForm />

                    {/* Login Link */}
                    <div className="mt-6 text-center">
                        <p className="text-slate-400">
                            Already have an account?{" "}
                            <a
                                href="/login"
                                className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                            >
                                Sign in
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
