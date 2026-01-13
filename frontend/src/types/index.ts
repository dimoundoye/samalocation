export interface User {
    id: string;
    email: string;
    full_name: string;
    role: 'owner' | 'tenant' | 'admin';
    created_at?: string;
    is_blocked?: boolean;
}

export interface Property {
    id: string;
    name: string;
    address: string;
    description?: string;
    property_type: string;
    photo_url?: string;
    photos?: string[];
    is_published: boolean;
    owner_id: string;
    owner_name?: string;
    min_rent?: number;
    units_count?: number;
    created_at: string;
    property_units?: PropertyUnit[];
    owner_profiles?: any; // To be refined if needed
}

export interface PropertyUnit {
    id: string;
    property_id: string;
    unit_number: string;
    unit_type: string;
    rent_amount: number;
    is_available: boolean;
    properties?: Property;
}

export interface Tenant {
    id: string;
    user_id?: string;
    full_name: string;
    email: string;
    phone: string;
    property_id: string;
    unit_id: string;
    monthly_rent: number;
    move_in_date: string;
    status: 'active' | 'inactive';
    property_name?: string;
    unit_number?: string;
    created_at?: string;
}

export interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    message: string;
    property_id?: string;
    is_read: boolean;
    created_at: string;
    sender_name?: string;
    sender_email?: string;
    receiver_name?: string;
    receiver_email?: string;
}

export interface CreateReceiptData {
    tenant_id: string;
    property_id: string;
    month: number;
    year: number;
    amount: number;
    payment_date: string;
    payment_method?: string;
    notes?: string;
}

export interface Receipt {
    id: string;
    tenant_id: string;
    property_id: string;
    month: number;
    year: number;
    amount: number;
    payment_date: string;
    payment_method: string;
    receipt_number: string;
    notes?: string;
    created_at: string;
    // Informations jointes
    tenant_name?: string;
    property_name?: string;
    property_address?: string;
    owner_name?: string;
}

export interface Report {
    id: string;
    sender_id: string;
    sender_name?: string;
    reporter_name?: string;
    reporter_email?: string;
    reported_id: string;
    reported_name?: string;
    reported_is_blocked: boolean;
    reason: string;
    description?: string;
    status: 'pending' | 'reviewed' | 'resolved';
    admin_notes?: string;
    created_at: string;
}

export interface AdminStatistics {
    totalUsers: number;
    owners: number;
    tenants: number;
    totalProperties: number;
    publishedProperties: number;
    newUsersCount: number;
    newPropertiesCount: number;
    pendingReportsCount: number;
}
