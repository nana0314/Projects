'use client';

import Link from 'next/link';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-gray-50 pb-24">
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
                <h1 className="text-lg font-semibold text-gray-900">Privacy Policy</h1>
                <div className="w-14" />
            </div>

            <div className="max-w-2xl mx-auto p-6 space-y-6">
                <p className="text-sm text-gray-500">Last updated: February 15, 2026</p>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold text-gray-900">1. Information We Collect</h2>
                    <p className="text-gray-700 text-sm leading-relaxed">
                        <strong>Account Information:</strong> When you sign in with Google, we receive your name, email address, and profile picture.<br /><br />
                        <strong>Expense Data:</strong> Amounts, categories, descriptions, dates, and participant information for expenses you create.<br /><br />
                        <strong>Social Data:</strong> Friend connections, group memberships, and related interactions.<br /><br />
                        <strong>Usage Data:</strong> App interaction patterns, feature usage, and device information for analytics.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold text-gray-900">2. How We Use Your Information</h2>
                    <p className="text-gray-700 text-sm leading-relaxed">
                        Your data is used to: provide expense tracking and splitting functionality, generate spending analytics and dashboards, deliver AI-powered insights (if opted in), improve the App&apos;s performance and features, and prevent abuse.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold text-gray-900">3. Third-Party Services</h2>
                    <p className="text-gray-700 text-sm leading-relaxed">
                        <strong>Firebase (Google Cloud):</strong> Authentication, database (Firestore), file storage, and cloud functions. Data is stored in Google Cloud infrastructure.<br /><br />
                        <strong>Google Gemini AI:</strong> If you opt into AI Insights, aggregated spending data is sent to Google Gemini for analysis. This data is processed per Google&apos;s AI data policies.<br /><br />
                        <strong>Vercel:</strong> Hosting and analytics for website performance monitoring.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold text-gray-900">4. AI Features &amp; Data Processing</h2>
                    <p className="text-gray-700 text-sm leading-relaxed">
                        AI features are <strong>opt-in only</strong>. When enabled, your aggregated spending patterns (categories, amounts, trends) are sent to Google Gemini to generate weekly insights. Individual transaction details are not shared — only aggregated summaries. You can disable AI features at any time from the Insights settings.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold text-gray-900">5. Data Storage &amp; Security</h2>
                    <p className="text-gray-700 text-sm leading-relaxed">
                        Your data is stored securely on Firebase (Google Cloud) with encryption at rest and in transit. Access is controlled through Firebase Security Rules. We do not sell your data to third parties.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold text-gray-900">6. Data Retention &amp; Deletion</h2>
                    <p className="text-gray-700 text-sm leading-relaxed">
                        Your data is retained as long as your account is active. You can delete your account at any time from Profile → Delete Account. This permanently removes all your data including: Firestore records, uploaded files, authentication data, and AI insights history.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold text-gray-900">7. Your Rights</h2>
                    <p className="text-gray-700 text-sm leading-relaxed">
                        You have the right to: access your personal data, delete your account and associated data, opt out of AI features, and request information about how your data is used.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold text-gray-900">8. Changes to This Policy</h2>
                    <p className="text-gray-700 text-sm leading-relaxed">
                        We may update this Privacy Policy periodically. Continued use of the App after changes constitutes acceptance.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold text-gray-900">9. Contact</h2>
                    <p className="text-gray-700 text-sm leading-relaxed">
                        For privacy inquiries, please contact us through the App&apos;s support channels. See also our <Link href="/terms" className="text-green-600 underline">Terms of Service</Link>.
                    </p>
                </section>
            </div>
        </div>
    );
}
