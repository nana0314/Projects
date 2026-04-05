'use client';

import Link from 'next/link';

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-gray-50 pb-36">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <Link
                    href="/"
                    className="text-gray-600 hover:text-gray-900 flex items-center gap-1 active:scale-95 transition-transform"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </Link>
                <h1 className="text-lg font-semibold text-gray-900">Terms of Service</h1>
                <div className="w-14" />
            </div>

            <div className="max-w-2xl mx-auto p-6 space-y-6">
                <p className="text-sm text-gray-500">Last updated: February 15, 2026</p>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold text-gray-900">1. Acceptance of Terms</h2>
                    <p className="text-gray-700 text-sm leading-relaxed">
                        By accessing or using Smart Split (&quot;the App&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the App.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold text-gray-900">2. Description of Service</h2>
                    <p className="text-gray-700 text-sm leading-relaxed">
                        Smart Split is an expense-splitting and personal finance tracking application. Features include shared expense management, group expense tracking, personal expense logging, analytics dashboards, and AI-powered insights.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold text-gray-900">3. User Accounts</h2>
                    <p className="text-gray-700 text-sm leading-relaxed">
                        You must sign in with a valid Google account to use the App. You are responsible for maintaining the confidentiality of your account and for all activities under your account.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold text-gray-900">4. Data Collection &amp; Usage</h2>
                    <p className="text-gray-700 text-sm leading-relaxed">
                        We collect and store your expense data, profile information, and usage patterns on Firebase (Google Cloud). If you opt into AI Insights, your aggregated spending data is processed by Google Gemini AI to generate personalized recommendations. See our <Link href="/privacy" className="text-green-600 underline">Privacy Policy</Link> for full details.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold text-gray-900">5. AI Features</h2>
                    <p className="text-gray-700 text-sm leading-relaxed">
                        AI-powered features (Weekly Insights, receipt scanning) are opt-in. AI-generated content is for informational purposes only and should not be considered financial advice. We are not responsible for inaccuracies in AI-generated insights or receipt parsing.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold text-gray-900">6. Acceptable Use</h2>
                    <p className="text-gray-700 text-sm leading-relaxed">
                        You agree not to: abuse or harass other users, submit fraudulent expense data, attempt to access other users&apos; accounts, use the App for illegal purposes, or interfere with the App&apos;s operation.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold text-gray-900">7. Account Deletion</h2>
                    <p className="text-gray-700 text-sm leading-relaxed">
                        You may delete your account at any time from the Profile settings. Deletion permanently removes all your data including expenses, friend connections, group memberships, and stored files.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold text-gray-900">8. Limitation of Liability</h2>
                    <p className="text-gray-700 text-sm leading-relaxed">
                        Smart Split is provided &quot;as is&quot; without warranty. We are not liable for any financial disputes between users, loss of data, or damages arising from use of the App.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold text-gray-900">9. Changes to Terms</h2>
                    <p className="text-gray-700 text-sm leading-relaxed">
                        We may update these terms at any time. Continued use of the App after changes constitutes acceptance of the updated terms.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold text-gray-900">10. Contact</h2>
                    <p className="text-gray-700 text-sm leading-relaxed">
                        For questions about these terms, please contact us through the App&apos;s support channels.
                    </p>
                </section>
            </div>
        </div>
    );
}
