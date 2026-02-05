import { ExpenseCategory } from '@/src/types';

const categoryColors: Record<ExpenseCategory, string> = {
    Food: 'bg-orange-100 text-orange-800',
    Rental: 'bg-blue-100 text-blue-800',
    Groceries: 'bg-green-100 text-green-800',
    Entertainment: 'bg-purple-100 text-purple-800',
    Beverage: 'bg-yellow-100 text-yellow-800',
    Transportation: 'bg-indigo-100 text-indigo-800',
    Utilities: 'bg-cyan-100 text-cyan-800',
    Shopping: 'bg-pink-100 text-pink-800',
    Travel: 'bg-teal-100 text-teal-800',
    Other: 'bg-gray-100 text-gray-800',
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
