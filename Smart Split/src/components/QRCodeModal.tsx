import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';

interface QRCodeModalProps {
    uniqueId: string;
    displayName: string;
    onClose: () => void;
}

export default function QRCodeModal({ uniqueId, displayName, onClose }: QRCodeModalProps) {
    const [inviteUrl, setInviteUrl] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setInviteUrl(`${window.location.origin}/friends?invite_id=${uniqueId}`);
        }
    }, [uniqueId]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl p-8 max-w-sm w-full relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Scan to Add</h2>
                    <p className="text-gray-600 mb-6">
                        Ask your friend to scan this code to add <span className="font-semibold">{displayName}</span>
                    </p>

                    <div className="bg-white p-4 rounded-xl border-2 border-gray-100 inline-block mb-6 shadow-sm">
                        {inviteUrl && (
                            <QRCodeSVG
                                value={inviteUrl}
                                size={200}
                                level="H"
                                includeMargin={true}
                                className="w-full h-auto"
                            />
                        )}
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-semibold">Your Unique ID</p>
                        <p className="text-2xl font-mono font-bold text-gray-800 tracking-wider select-all">
                            {uniqueId}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
