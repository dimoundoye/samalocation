-- Journal des actions sensibles des administrateurs (retraits forcés, abonnements, blocages, suppressions, paramètres)
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id     VARCHAR(255) NOT NULL,
    admin_name   VARCHAR(255),
    action       VARCHAR(50)  NOT NULL,
    target_type  VARCHAR(30),
    target_id    VARCHAR(255),
    target_label VARCHAR(255),
    details      JSONB,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);
