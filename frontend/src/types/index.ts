export interface User {
    id: string;
    customId?: string;
    email: string;
    full_name: string;
    role: 'owner' | 'tenant' | 'admin';
    setupRequired?: boolean;
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
    latitude?: number;
    longitude?: number;
    equipments?: string[];
    bedrooms?: number;
    bathrooms?: number;
    area_sqm?: number;
    created_at: string;
    property_units?: PropertyUnit[];
    owner_profiles?: any; // To be refined if needed
}

export interface PropertyUnit {
    id: string;
    property_id: string;
    unit_number: string;
    unit_type: string;
    monthly_rent: number;
    rent_amount?: number; // legacy field if used elsewhere
    area_sqm?: number;
    bedrooms?: number;
    bathrooms?: number;
    is_available: boolean;
    rent_period?: string;
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
    unit_id?: string;
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
    unit_id?: string;
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
    pendingVerificationsCount: number;
}

export interface CreateContractData {
    tenant_id: string;
    property_id: string;
    unit_id: string;
    start_date: string;
    duration_months: number;
    rent_amount: number;
    deposit_amount: number;
    payment_day: number;
    payment_method: string;
    notes?: string;
    contract_type?: 'standard' | 'premium';
    owner_id_type?: string;
    owner_id_number?: string;
    owner_id_date?: string;
    owner_dob?: string;
    owner_birthplace?: string;
    tenant_id_type?: string;
    tenant_id_number?: string;
    tenant_id_date?: string;
    tenant_dob?: string;
    tenant_birthplace?: string;
    detailed_address?: string;
    charges_info?: { description: string };
    occupancy_limit?: number;
    inventory?: Record<string, string>;
}

export interface RentalContract extends CreateContractData {
    id: string;
    owner_id: string;
    status: 'draft' | 'active' | 'terminated' | 'pending_signature';
    owner_signed: boolean;
    tenant_signed: boolean;
    owner_signed_at?: string;
    tenant_signed_at?: string;
    contract_number: string;
    created_at: string;
    // Joined fields
    tenant_name?: string;
    tenant_email?: string;
    tenant_phone?: string;
    property_name?: string;
    unit_number?: string;
    owner_name?: string;
    owner_email?: string;
    owner_phone?: string;
    owner_address?: string;
    owner_signature?: string;
}
