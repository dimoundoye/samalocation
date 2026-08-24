import { baseClient } from './baseClient';

export interface ExpenseItem {
    id: string;
    owner_id: string;
    property_id?: string | null;
    property_name?: string | null;
    group_id?: string | null;
    category: string;
    amount: number;
    expense_date: string;
    description?: string | null;
    receipt_url?: string | null;
    is_recurring?: boolean;
    recurrence_period?: string;
    created_at?: string;
}

export interface FinancialAnalyticsData {
    year: number;
    availableYears?: number[];
    totalRevenue: number;
    totalExpense: number;
    netCashFlow: number;
    occupancyRate: number;
    totalUnits: number;
    occupiedUnits: number;
    monthlyData: {
        month: number;
        revenue: number;
        expense: number;
        cashFlow: number;
    }[];
    categoryBreakdown: {
        category: string;
        amount: number;
    }[];
    expenses: ExpenseItem[];
}

export const getExpenses = async (filters?: {
    year?: number;
    month?: number;
    property_id?: string;
    group_id?: string;
    category?: string;
}): Promise<ExpenseItem[]> => {
    const params = new URLSearchParams();
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.month) params.append('month', filters.month.toString());
    if (filters?.property_id) params.append('property_id', filters.property_id);
    if (filters?.group_id) params.append('group_id', filters.group_id);
    if (filters?.category) params.append('category', filters.category);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await baseClient(`/expenses${query}`);
    return Array.isArray(res) ? res : (res?.data || []);
};

export const createExpense = async (data: Partial<ExpenseItem>): Promise<ExpenseItem> => {
    const res = await baseClient('/expenses', {
        method: 'POST',
        body: JSON.stringify(data)
    });
    return res?.data || res;
};

export const updateExpense = async (id: string, data: Partial<ExpenseItem>): Promise<ExpenseItem> => {
    const res = await baseClient(`/expenses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
    return res?.data || res;
};

export const deleteExpense = async (id: string): Promise<void> => {
    await baseClient(`/expenses/${id}`, {
        method: 'DELETE'
    });
};

export const getFinancialAnalytics = async (filters?: {
    year?: number;
    property_id?: string;
    group_id?: string;
}): Promise<FinancialAnalyticsData> => {
    const params = new URLSearchParams();
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.property_id) params.append('property_id', filters.property_id);
    if (filters?.group_id) params.append('group_id', filters.group_id);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await baseClient(`/expenses/analytics${query}`);
    return res?.data || res;
};
