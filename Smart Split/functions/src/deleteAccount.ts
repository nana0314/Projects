import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();

/**
 * deleteAccount - Callable function to permanently delete a user's account
 * and all associated data (Firestore, Storage, Auth).
 *
 * Requires the user to be authenticated. Can only delete own account.
 */
export const deleteAccount = functions.https.onCall(async (data, context) => {
    // Must be authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "You must be signed in to delete your account."
        );
    }

    const uid = context.auth.uid;

    try {
        // 1. Delete user's Firestore subcollections
        const subcollections = ["settings", "insights", "blocked_users", "usage"];
        for (const sub of subcollections) {
            const subRef = db.collection(`users/${uid}/${sub}`);
            const subDocs = await subRef.listDocuments();
            for (const doc of subDocs) {
                await doc.delete();
            }
        }

        // 2. Delete user's main Firestore document
        await db.collection("users").doc(uid).delete();

        // 3. Delete expenses created by this user
        const expenseQuery = await db
            .collection("expenses")
            .where("createdBy", "==", uid)
            .get();
        const expenseBatch = db.batch();
        expenseQuery.docs.forEach((doc) => {
            expenseBatch.delete(doc.ref);
        });
        await expenseBatch.commit();

        // 4. Delete friend requests involving this user (as sender)
        const sentRequests = await db
            .collection("friendRequests")
            .where("userId", "==", uid)
            .get();
        const friendBatch1 = db.batch();
        sentRequests.docs.forEach((doc) => {
            friendBatch1.delete(doc.ref);
        });
        await friendBatch1.commit();

        // 5. Delete friend requests involving this user (as receiver)
        const receivedRequests = await db
            .collection("friendRequests")
            .where("friendId", "==", uid)
            .get();
        const friendBatch2 = db.batch();
        receivedRequests.docs.forEach((doc) => {
            friendBatch2.delete(doc.ref);
        });
        await friendBatch2.commit();

        // 6. Remove user from all groups (update memberIds arrays)
        const groupQuery = await db
            .collection("groups")
            .where("memberIds", "array-contains", uid)
            .get();
        const groupBatch = db.batch();
        groupQuery.docs.forEach((doc) => {
            const data = doc.data();
            const updatedMemberIds = (data.memberIds || []).filter(
                (id: string) => id !== uid
            );
            const updatedMembers = (data.members || []).filter(
                (m: { userId: string }) => m.userId !== uid
            );
            groupBatch.update(doc.ref, {
                memberIds: updatedMemberIds,
                members: updatedMembers,
            });
        });
        await groupBatch.commit();

        // 7. Delete Storage files (profile pictures + receipts)
        const bucket = storage.bucket();
        try {
            await bucket.deleteFiles({ prefix: `users/${uid}/` });
        } catch {
            // Ignore if no files exist
        }
        try {
            await bucket.deleteFiles({ prefix: `receipts/${uid}/` });
        } catch {
            // Ignore if no files exist
        }

        // 8. Delete Firebase Auth record
        await admin.auth().deleteUser(uid);

        return { success: true };
    } catch (error: any) {
        console.error("Error deleting account:", error);
        throw new functions.https.HttpsError(
            "internal",
            "Failed to delete account. Please try again."
        );
    }
});
