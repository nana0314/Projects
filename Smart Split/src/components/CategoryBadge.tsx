import { ExpenseCategory } from '@/src/types';

const categoryColors: Record<ExpenseCategory, string> = {
    Food: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    Rental: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    Groceries: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    Entertainment: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    Beverage: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    Transportation: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    Utilities: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    Shopping: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
    Travel: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
    Personal: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    Other: 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300',
};

interface CategoryBadgeProps {
    category: ExpenseCategory;
    className?: string;
}

export default function CategoryBadge({ category, className = '' }: CategoryBadgeProps) {
    const colorClass = categoryColors[category] || categoryColors.Other;

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClass} ${className}`}>
            {category}
        </span>
    );
}
