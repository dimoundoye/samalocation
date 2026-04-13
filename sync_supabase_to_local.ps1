# Script pour synchroniser la base de données Supabase vers le Docker local
# Usage: .\sync_supabase_to_local.ps1

# 1. Charger les variables d'environnement
if (Test-Path "backend/.env") {
    $envFile = Get-Content "backend/.env"
    foreach ($line in $envFile) {
        if ($line -match "^([^#\s][^=]+)=(.*)$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            Set-Item -Path "env:$name" -Value $value
        }
    }
}

Write-Host "--- Début de la synchronisation Supabase -> Local Docker ---" -ForegroundColor Cyan

# Variables (récupérées du .env ou valeurs par défaut)
$SB_HOST = $env:DB_HOST
$SB_USER = $env:DB_USER
$SB_PASS = $env:DB_PASS
$SB_NAME = $env:DB_NAME
$SB_PORT = $env:DB_PORT

$LOCAL_USER = "postgres"
$LOCAL_DB = "samalocation"
$LOCAL_PASS = "password" # Doit correspondre au docker-compose

Write-Host "Extraction des données depuis Supabase ($SB_HOST)..." -ForegroundColor Yellow

# Utiliser Docker pour exécuter pg_dump (évite d'installer Postgres sur Windows)
docker run --rm --network samalocation-network `
    -e PGPASSWORD=$SB_PASS `
    postgres:16-alpine `
    pg_dump -h $SB_HOST -p $SB_PORT -U $SB_USER -d $SB_NAME --clean --if-exists --no-owner --no-privileges `
    | docker exec -i samalocation-db psql -U $LOCAL_USER -d $LOCAL_DB

if ($LASTEXITCODE -eq 0) {
    Write-Host "--- Synchronisation terminée avec succès ! ---" -ForegroundColor Green
    Write-Host "Vos données locales sont maintenant identiques à celles de Supabase."
} else {
    Write-Host "--- Erreur lors de la synchronisation. Vérifiez vos identifiants dans backend/.env ---" -ForegroundColor Red
}
