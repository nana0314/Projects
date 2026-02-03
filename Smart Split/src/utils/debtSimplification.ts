/**
 * Debt Simplification Utility
 * Minimizes the number of transactions needed to settle all debts
 */

export interface SimplifiedDebt {
    from: string; // userId who pays
    to: string; // userId who receives
    amount: number;
}

/**
 * Simplify debts using greedy algorithm
 * Takes a map of balances and returns minimized transactions
 * 
 * @param balances - Map of userId to net balance (positive = owed to them, negative = they owe)
 * @returns Array of simplified debt transactions
 */
export function simplifyDebts(balances: { [userId: string]: number }): SimplifiedDebt[] {
    const result: SimplifiedDebt[] = [];

    // Create arrays of debtors and creditors
    const debtors: { userId: string; amount: number }[] = [];
    const creditors: { userId: string; amount: number }[] = [];

    // Separate into debtors (owe money) and creditors (are owed money)
    Object.entries(balances).forEach(([userId, balance]) => {
        if (balance < -0.01) {
            // They owe money (negative balance)
            debtors.push({ userId, amount: Math.abs(balance) });
        } else if (balance > 0.01) {
            // They are owed money (positive balance)
            creditors.push({ userId, amount: balance });
        }
    });

    // Sort debtors and creditors by amount (descending) for greedy approach
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    // Use greedy algorithm to minimize transactions
    let i = 0; // debtor index
    let j = 0; // creditor index

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];

        // Settle the minimum of what debtor owes and what creditor is owed
        const settleAmount = Math.min(debtor.amount, creditor.amount);

        if (settleAmount > 0.01) {
            result.push({
                from: debtor.userId,
                to: creditor.userId,
                amount: settleAmount,
            });
        }

        // Update remaining amounts
        debtor.amount -= settleAmount;
        creditor.amount -= settleAmount;

        // Move to next debtor/creditor if fully settled
        if (debtor.amount < 0.01) {
            i++;
        }
        if (creditor.amount < 0.01) {
            j++;
        }
    }

    return result;
}

/**
 * Calculate net balances from owedTo and owedFrom maps
 * 
 * @param owedTo - Map of userId to amount owed to the current user
 * @param owedFrom - Map of userId to amount the current user owes
 * @returns Net balance for each user
 */
export function calculateNetBalances(
    owedTo: { [userId: string]: number },
    owedFrom: { [userId: string]: number }
): { [userId: string]: number } {
    const netBalances: { [userId: string]: number } = {};

    // Add all users from both maps
    const allUserIds = new Set([...Object.keys(owedTo), ...Object.keys(owedFrom)]);

    allUserIds.forEach((userId) => {
        const owed = owedTo[userId] || 0;
        const owing = owedFrom[userId] || 0;
        netBalances[userId] = owing - owed; // Net amount (positive = they owe you, negative = you owe them)
    });

    return netBalances;
}
