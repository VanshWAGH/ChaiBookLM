"use client";

import Link from "next/link";
import { Scale, Sparkles, FileText, MessageSquare, ShieldCheck, ArrowRight } from "lucide-react";
import { buttonVariants, Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";

export function LandingHero() {
    return (
        <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-background">
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 z-0 gradient-bg opacity-30 dark:opacity-20"></div>
            
            {/* Grid Pattern */}
            <div className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            <div className="relative z-10 flex w-full max-w-5xl flex-col items-center px-6 py-16 text-center animate-fade-up delay-100">
                <div className="mb-6 flex size-20 items-center justify-center rounded-3xl bg-primary/10 shadow-lg shadow-primary/20 ring-1 ring-primary/20 animate-float">
                    <Scale className="size-10 text-primary" />
                </div>
                
                <h1 className="max-w-3xl font-heading text-5xl font-bold tracking-tight sm:text-7xl">
                    Your AI Legal <br className="hidden sm:block" />
                    <span className="gradient-text">Co-founder</span>
                </h1>
                
                <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl font-medium">
                    Upload startup contracts, NDAs, and legal documents — get instant risk analysis
                    and plain-English summaries under Indian Law.
                </p>
                
                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                    <Show when="signed-out">
                        <SignUpButton mode="modal">
                            <Button size="lg" className="gap-2 h-14 px-8 rounded-full shadow-lg shadow-primary/25 transition-all hover:scale-105">
                                <Sparkles className="size-5" />
                                <span className="text-base font-semibold">Get Started for Free</span>
                            </Button>
                        </SignUpButton>
                        <SignInButton mode="modal">
                            <Button variant="outline" size="lg" className="gap-2 h-14 px-8 rounded-full bg-background/50 backdrop-blur-sm transition-all hover:bg-background/80">
                                <span className="text-base font-medium">Sign In</span>
                                <ArrowRight className="size-4" />
                            </Button>
                        </SignInButton>
                    </Show>
                    <Show when="signed-in">
                        <Link
                            href="/notebooks"
                            className={cn(buttonVariants({ size: "lg" }), "gap-2 h-14 px-8 rounded-full shadow-lg shadow-primary/25 transition-all hover:scale-105")}
                        >
                            <Scale className="size-5" />
                            <span className="text-base font-semibold">Go to Dashboard</span>
                        </Link>
                        <UserButton />
                    </Show>
                </div>
            </div>

            {/* Feature Cards */}
            <div className="relative z-10 mt-16 grid w-full max-w-5xl grid-cols-1 gap-6 px-6 sm:grid-cols-3 animate-fade-up delay-300">
                <div className="glass flex flex-col items-start rounded-3xl p-8 transition-transform hover:-translate-y-2">
                    <div className="mb-4 rounded-2xl bg-blue-500/10 p-3 text-blue-500">
                        <FileText className="size-6" />
                    </div>
                    <h3 className="mb-2 font-heading text-xl font-semibold">Upload Documents</h3>
                    <p className="text-sm text-muted-foreground">
                        Upload contracts, NDAs, founders' agreements, or paste legal clauses to build your case file.
                    </p>
                </div>
                <div className="glass flex flex-col items-start rounded-3xl p-8 transition-transform hover:-translate-y-2 delay-100">
                    <div className="mb-4 rounded-2xl bg-primary/10 p-3 text-primary">
                        <MessageSquare className="size-6" />
                    </div>
                    <h3 className="mb-2 font-heading text-xl font-semibold">Consult AI Lawyer</h3>
                    <p className="text-sm text-muted-foreground">
                        Ask questions about your contracts and get answers with exact clause citations under Indian law.
                    </p>
                </div>
                <div className="glass flex flex-col items-start rounded-3xl p-8 transition-transform hover:-translate-y-2 delay-200">
                    <div className="mb-4 rounded-2xl bg-purple-500/10 p-3 text-purple-500">
                        <ShieldCheck className="size-6" />
                    </div>
                    <h3 className="mb-2 font-heading text-xl font-semibold">Generate Legal Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                        Instantly generate risk audits, compliance checklists, and plain-English contract summaries.
                    </p>
                </div>
            </div>
            
            <div className="absolute bottom-6 z-10 text-xs text-muted-foreground">
                Built for Indian startups. Not a substitute for professional legal advice.
            </div>
        </div>
    );
}
