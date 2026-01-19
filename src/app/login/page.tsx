import { redirect } from "next/navigation";
import { getAuthUser, getDashboardPath } from "@/lib/auth";
import LoginForm from "./login-form";

export default async function LoginPage() {
    // If user is already logged in, redirect to their dashboard
    const user = await getAuthUser();
    if (user && user.role) {
        redirect(getDashboardPath(user.role));
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="w-full max-w-md p-8">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
                    {/* Logo/Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 mb-4">
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
                                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                                />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white">
                            IMMS
                        </h1>
                        <p className="text-slate-400 mt-2">
                            Integrated Medical Management System
                        </p>
                    </div>

                    <LoginForm />

                    {/* Register Link */}
                    <div className="mt-6 text-center">
                        <p className="text-slate-400">
                            New patient?{" "}
                            <a
                                href="/register"
                                className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                            >
                                Create an account
                            </a>
                        </p>
                    </div>
                </div>

                {/* Staff Login Notice */}
                <p className="text-center text-slate-500 text-sm mt-6">
                    Staff members use the same login portal
                </p>
            </div>
        </div>
    );
}
