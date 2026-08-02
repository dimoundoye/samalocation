/**
 * Génère le HTML d'attente/chargement élégant pour un nouvel onglet de document.
 */
export const getTabLoaderHtml = (title: string, subtitle: string) => `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            color: #1e293b;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 24px;
        }
        .brand {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 24px;
            font-size: 22px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.5px;
        }
        .brand-dot {
            width: 8px;
            height: 8px;
            background-color: #0d9488;
            border-radius: 50%;
            display: inline-block;
        }
        .card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 20px;
            box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
            max-width: 400px;
            width: 100%;
            padding: 36px 28px;
            text-align: center;
        }
        .spinner-box {
            position: relative;
            width: 52px;
            height: 52px;
            margin: 0 auto 20px auto;
        }
        .spinner {
            box-sizing: border-box;
            position: absolute;
            width: 100%;
            height: 100%;
            border: 3.5px solid #e2e8f0;
            border-top: 3.5px solid #0d9488;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .title {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 6px;
            letter-spacing: -0.3px;
        }
        .subtitle {
            font-size: 13.5px;
            color: #64748b;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <div class="brand">
        Samalocation<span class="brand-dot"></span>
    </div>
    <div class="card">
        <div class="spinner-box">
            <div class="spinner"></div>
        </div>
        <h1 class="title">${title}</h1>
        <p class="subtitle">${subtitle}</p>
    </div>
</body>
</html>
`;

/**
 * Génère le HTML d'erreur haut de gamme et professionnel pour un nouvel onglet de document.
 */
export const getTabErrorHtml = (errorTitle: string, errorMessage: string) => `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Erreur de prévisualisation - Samalocation</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            color: #1e293b;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 24px;
        }
        .brand {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 24px;
            font-size: 22px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.5px;
        }
        .brand-dot {
            width: 8px;
            height: 8px;
            background-color: #0d9488;
            border-radius: 50%;
            display: inline-block;
        }
        .card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 20px;
            box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
            max-width: 440px;
            width: 100%;
            padding: 36px 28px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        .icon-box {
            width: 60px;
            height: 60px;
            background-color: #fff1f2;
            border: 1px solid #ffe4e6;
            color: #e11d48;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px auto;
        }
        .icon-box svg {
            width: 28px;
            height: 28px;
        }
        .title {
            font-size: 19px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 8px;
            letter-spacing: -0.3px;
        }
        .subtitle {
            font-size: 13.5px;
            color: #64748b;
            line-height: 1.5;
            margin-bottom: 20px;
        }
        .error-detail {
            background-color: #f8fafc;
            border: 1px solid #f1f5f9;
            border-radius: 12px;
            padding: 12px 16px;
            font-size: 13px;
            color: #475569;
            text-align: left;
            margin-bottom: 24px;
            display: flex;
            align-items: flex-start;
            gap: 10px;
        }
        .error-detail svg {
            width: 18px;
            height: 18px;
            color: #94a3b8;
            flex-shrink: 0;
            margin-top: 1px;
        }
        .btn-group {
            display: flex;
            gap: 12px;
            flex-direction: column;
        }
        @media (min-width: 400px) {
            .btn-group {
                flex-direction: row;
            }
        }
        .btn {
            flex: 1;
            padding: 11px 18px;
            border-radius: 10px;
            font-size: 13.5px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            text-decoration: none;
            border: none;
        }
        .btn-primary {
            background-color: #0f172a;
            color: #ffffff;
            box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.1);
        }
        .btn-primary:hover {
            background-color: #1e293b;
            transform: translateY(-1px);
        }
        .btn-secondary {
            background-color: #f1f5f9;
            color: #475569;
            border: 1px solid #e2e8f0;
        }
        .btn-secondary:hover {
            background-color: #e2e8f0;
            color: #0f172a;
        }
        .footer-text {
            margin-top: 24px;
            font-size: 12px;
            color: #94a3b8;
        }
    </style>
</head>
<body>
    <div class="brand">
        Samalocation<span class="brand-dot"></span>
    </div>
    <div class="card">
        <div class="icon-box">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        </div>
        <h1 class="title">${errorTitle}</h1>
        <p class="subtitle">Une interruption s'est produite lors de la préparation de votre document.</p>
        
        <div class="error-detail">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>${errorMessage}</div>
        </div>

        <div class="btn-group">
            <button class="btn btn-primary" onclick="window.location.reload()">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Réessayer
            </button>
            <button class="btn btn-secondary" onclick="window.close()">Fermer cet onglet</button>
        </div>
    </div>
    <div class="footer-text">&copy; Samalocation &bull; Plateforme de gestion immobilière</div>
</body>
</html>
`;
