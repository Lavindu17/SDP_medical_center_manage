"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginForm() {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        setError(null);

        try {
            const result = await signIn(formData);

            if (result.error) {
                setError(result.error);
                setIsLoading(false);
                return;
            }

            if (result.success && result.redirectTo) {
                // Use router.push for client-side navigation
                router.push(result.redirectTo);
                router.refresh(); // Refresh to update auth state
            }
        } catch (err) {
            console.error("Login error:", err);
            setError("An unexpected error occurred");
            setIsLoading(false);
        }
    }

    return (
        <form action={handleSubmit} className="space-y-5">
            {error && (
                <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
                    {error}
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">
                    Email
                </Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-cyan-400/20"
                />
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-slate-300">
                        Password
                    </Label>
                    <a
                        href="/forgot-password"
                        className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                        Forgot password?
                    </a>
                </div>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-cyan-400/20"
                />
            </div>

            <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-medium py-5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-cyan-500/25"
            >
                {isLoading ? (
                    <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        Signing in...
                    </span>
                ) : (
                    "Sign In"
                )}
            </Button>
        </form>
    );
}
