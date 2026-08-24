-- Migration: Create property_expenses table
DROP TABLE IF EXISTS property_expenses CASCADE;

CREATE TABLE property_expenses (
    id VARCHAR(100) PRIMARY KEY,
    owner_id VARCHAR(255) NOT NULL,
    property_id VARCHAR(255),
    group_id VARCHAR(100),
    category VARCHAR(50) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    receipt_url TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_period VARCHAR(20) DEFAULT 'mensuel',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_property_expenses_owner ON property_expenses(owner_id);
CREATE INDEX IF NOT EXISTS idx_property_expenses_property ON property_expenses(property_id);
CREATE INDEX IF NOT EXISTS idx_property_expenses_group ON property_expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_property_expenses_date ON property_expenses(expense_date);
