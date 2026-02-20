import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { storage } from '@/src/config/firebase';
import { ParsedExpense } from '@/src/types/receipt';

/**
 * Compress an image file to a maximum width while maintaining aspect ratio.
 * Returns a Blob suitable for upload.
 */
export async function compressImage(file: File, maxWidth: number = 1024): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                // Only downscale, never upscale
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Could not compress image'));
                        }
                    },
                    'image/jpeg',
                    0.8 // 80% quality
                );
            };

            img.onerror = () => reject(new Error('Could not load image'));
            img.src = e.target?.result as string;
        };

        reader.onerror = () => reject(new Error('Could not read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Upload a receipt image to Firebase Storage.
 * Returns the download URL.
 */
export async function uploadReceiptImage(userId: string, file: Blob): Promise<string> {
    const fileId = crypto.randomUUID();
    const storageRef = ref(storage, `receipts/${userId}/${fileId}`);

    await uploadBytes(storageRef, file, {
        contentType: 'image/jpeg',
    });

    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
}

/**
 * Call the parseExpense Cloud Function in receipt mode.
 * Compresses and uploads the image, then calls the function.
 */
export async function scanReceipt(userId: string, file: File): Promise<ParsedExpense> {
    // 1. Compress the image
    const compressed = await compressImage(file);

    // 2. Upload to Storage
    const fileUrl = await uploadReceiptImage(userId, compressed);

    // 3. Call the Cloud Function
    const functions = getFunctions();
    const parseExpense = httpsCallable<{ type: string; fileUrl: string }, ParsedExpense>(
        functions,
        'parseExpense'
    );

    const result = await parseExpense({ type: 'receipt', fileUrl });
    return result.data;
}
