'use client';

import { useState } from 'react';
import { blockUser, unblockUser, reportUser, ReportReason } from '@/src/utils/moderation';

interface BlockReportMenuProps {
    currentUserId: string;
    targetUserId: string;
    targetName: string;
    isBlocked: boolean;
    onBlockChange: () => void;
}

export default function BlockReportMenu({
    currentUserId,
    targetUserId,
    targetName,
    isBlocked,
    onBlockChange,
}: BlockReportMenuProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showBlockConfirm, setShowBlockConfirm] = useState(false);
    const [reportReason, setReportReason] = useState<ReportReason>('spam');
    const [reportDetails, setReportDetails] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    const handleBlock = async () => {
        setLoading(true);
        try {
            if (isBlocked) {
                await unblockUser(currentUserId, targetUserId);
            } else {
                await blockUser(currentUserId, targetUserId);
            }
            onBlockChange();
            setShowBlockConfirm(false);
            setShowMenu(false);
        } catch (err) {
            console.error('Block/unblock error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleReport = async () => {
        setLoading(true);
        try {
            await reportUser(currentUserId, targetUserId, reportReason, reportDetails);
            setSuccess('Report submitted. Thank you.');
            setTimeout(() => {
                setShowReportModal(false);
                setShowMenu(false);
                setSuccess('');
                setReportDetails('');
            }, 1500);
        } catch (err) {
            console.error('Report error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative">
            {/* Three-dot trigger button */}
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                }}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="More options"
            >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
            </button>

            {/* Dropdown menu */}
            {showMenu && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-8 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-44">
                        <button
                            onClick={() => {
                                setShowBlockConfirm(true);
                                setShowMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            <span className={isBlocked ? 'text-green-600' : 'text-red-600'}>
                                {isBlocked ? 'Unblock User' : 'Block User'}
                            </span>
                        </button>
                        <button
                            onClick={() => {
                                setShowReportModal(true);
                                setShowMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <span className="text-orange-600">Report User</span>
                        </button>
                    </div>
                </>
            )}

            {/* Block Confirmation Modal */}
            {showBlockConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowBlockConfirm(false)}>
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {isBlocked ? 'Unblock' : 'Block'} {targetName}?
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            {isBlocked
                                ? `${targetName} will be visible again in your friends and groups.`
                                : `${targetName} will be hidden from your friends list. You won\u2019t see their activity.`}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowBlockConfirm(false)}
                                disabled={loading}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBlock}
                                disabled={loading}
                                className={`flex-1 px-4 py-2 rounded-lg font-medium text-white ${isBlocked ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                            >
                                {loading ? '...' : isBlocked ? 'Unblock' : 'Block'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowReportModal(false)}>
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
                        {success ? (
                            <div className="text-center py-4">
                                <p className="text-green-600 font-medium">{success}</p>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Report {targetName}</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                                        <select
                                            value={reportReason}
                                            onChange={(e) => setReportReason(e.target.value as ReportReason)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                        >
                                            <option value="spam">Spam</option>
                                            <option value="harassment">Harassment</option>
                                            <option value="inappropriate">Inappropriate Content</option>
                                            <option value="fraud">Fraud / Fake Expenses</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Details (optional)</label>
                                        <textarea
                                            value={reportDetails}
                                            onChange={(e) => setReportDetails(e.target.value)}
                                            placeholder="Describe the issue..."
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={() => setShowReportModal(false)}
                                        disabled={loading}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleReport}
                                        disabled={loading}
                                        className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700"
                                    >
                                        {loading ? 'Submitting...' : 'Submit Report'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
