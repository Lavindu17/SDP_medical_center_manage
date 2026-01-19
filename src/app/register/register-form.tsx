"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUpPatient } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterForm() {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        setError(null);

        // Validate passwords match
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            setIsLoading(false);
            return;
        }

        try {
            const result = await signUpPatient(formData);

            if (result.error) {
                setError(result.error);
                setIsLoading(false);
                return;
            }

            if (result.success && result.redirectTo) {
                router.push(result.redirectTo);
                router.refresh();
            }
        } catch (err) {
            console.error("Registration error:", err);
            setError("An unexpected error occurred");
            setIsLoading(false);
        }
    }

    return (
        <form action={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-slate-300">
                        First Name *
                    </Label>
                    <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        placeholder="John"
                        required
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-400"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-slate-300">
                        Last Name
                    </Label>
                    <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        placeholder="Doe"
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-400"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">
                    Email *
                </Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-400"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="contactNumber" className="text-slate-300">
                    Contact Number
                </Label>
                <Input
                    id="contactNumber"
                    name="contactNumber"
                    type="tel"
                    placeholder="+94 77 123 4567"
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-400"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">
                    Password *
                </Label>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-400"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300">
                    Confirm Password *
                </Label>
                <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-400"
                />
            </div>

            <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-white font-medium py-5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-emerald-500/25 mt-6"
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
                        Creating account...
                    </span>
                ) : (
                    "Create Account"
                )}
            </Button>
        </form>
    );
}
