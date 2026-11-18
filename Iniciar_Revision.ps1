# Instalador local independiente para la revision docente.
# Requiere Windows PowerShell 5.1+ y Docker Desktop.
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

$envFile = '.env.revision.local'
$project = 'openmind-revision-docente'

function Nueva-Clave([switch]$Fernet) {
    $bytes = New-Object byte[] 32
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    if ($Fernet) {
        return [Convert]::ToBase64String($bytes).Replace('+','-').Replace('/','_')
    }
    return ([BitConverter]::ToString($bytes)).Replace('-', '').ToLowerInvariant()
}

function dc {
    & docker compose --project-name $project --env-file $envFile -f docker-compose.yml @args
    if ($LASTEXITCODE -ne 0) { throw 'Docker Compose no pudo completar la operacion. Revisa el mensaje anterior.' }
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Instala Docker Desktop y abrelo antes de ejecutar este archivo.'
}
& docker info --format '{{.ServerVersion}}'
if ($LASTEXITCODE -ne 0) { throw 'Docker Desktop no esta funcionando.' }

if (-not (Test-Path -LiteralPath $envFile)) {
    $passwordRevision = 'Demo!' + (Nueva-Clave).Substring(0,20)
    $contenido = @(
        'DJANGO_SECRET_KEY=' + (Nueva-Clave)
        'DJANGO_DEBUG=1'
        'PAYMENT_CREDENTIALS_KEY=' + (Nueva-Clave -Fernet)
        'DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,backend,testserver'
        'DJANGO_CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173'
        'DJANGO_CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173'
        'DJANGO_SECURE_SSL_REDIRECT=0'
        'DJANGO_SECURE_HSTS_SECONDS=0'
        'POSTGRES_DB=revision_docente'
        'POSTGRES_USER=revision_docente'
        'POSTGRES_PASSWORD=' + (Nueva-Clave)
        'POSTGRES_PORT=5432'
        'MONGO_USER=revision_docente'
        'MONGO_PASSWORD=' + (Nueva-Clave)
        'MONGO_DB_NAME=revision_docente'
        'MONGO_PORT=27017'
        'VITE_API_URL=http://localhost:8000'
        'VITE_GOOGLE_CLIENT_ID='
        'STOREFRONT_PUBLIC_URL=http://localhost:5173/plantilla/1'
        'EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend'
        'EMAIL_HOST=mailpit'
        'EMAIL_PORT=1025'
        'EMAIL_USE_TLS=0'
        'EMAIL_USE_SSL=0'
        'DEFAULT_FROM_EMAIL=demo@tienda.local'
        'STORE_MAIL_EXTERNAL_ENABLED=0'
        'STORE_MAIL_TRANSPORT=mailpit'
        'STORE_MAIL_PUBLIC_API_URL=http://localhost:8000'
        'INSTAGRAM_PUBLISHING_ENABLED=0'
        'REVISION_OWNER_PASSWORD=' + $passwordRevision
    )
    $contenido | Set-Content -LiteralPath $envFile -Encoding ASCII
    Write-Host 'Configuracion local de evaluacion creada. No subir este archivo a GitHub.'
}
$values = @{}
Get-Content -LiteralPath $envFile | ForEach-Object {
    if ($_ -match '^([A-Z_][A-Z0-9_]*)=(.*)$') {
        $values[$Matches[1]] = $Matches[2]
    }
}
foreach ($key in @('DJANGO_SECRET_KEY','PAYMENT_CREDENTIALS_KEY','POSTGRES_PASSWORD','MONGO_PASSWORD','REVISION_OWNER_PASSWORD')) {
    if (-not $values[$key]) { throw "Falta $key en $envFile. No se reescribieron tus datos." }
}
if ($values['POSTGRES_DB'] -ne 'revision_docente' -or $values['MONGO_DB_NAME'] -ne 'revision_docente') {
    throw 'El instalador solo admite las bases de datos aisladas revision_docente.'
}

Write-Host 'Iniciando el ecommerce y sus bases de datos...'
dc up -d --build
Write-Host 'Aplicando migraciones de Django...'
dc exec -T backend python manage.py migrate --noinput
Write-Host 'Creando o verificando la Tienda Demo y el administrador local...'
dc exec -T -e 'REVISION_SETUP_ENABLED=1' -e "REVISION_OWNER_PASSWORD=$($values['REVISION_OWNER_PASSWORD'])" backend python manage.py shell -c "exec(compile(open('scripts/seed_revision_docente.py', encoding='utf-8').read(), 'scripts/seed_revision_docente.py', 'exec'))"
dc ps

Write-Host ''
Write-Host '=============================================='
Write-Host 'REVISION DOCENTE - DATOS LOCALES'
Write-Host '=============================================='
Write-Host 'Tienda: http://localhost:5173/plantilla/1'
Write-Host 'Panel: http://localhost:5173/emprendedor'
Write-Host 'Administrador Django: http://localhost:8000/admin/'
Write-Host 'Correo: tienda@gmail.com'
Write-Host "Clave local: $($values['REVISION_OWNER_PASSWORD'])"
Write-Host 'Estas credenciales solo funcionan en este equipo.'
Write-Host '=============================================='
Write-Host ''
Write-Host 'No publiques ni compartas el archivo .env.revision.local.'
Start-Process 'http://localhost:5173/plantilla/1'
