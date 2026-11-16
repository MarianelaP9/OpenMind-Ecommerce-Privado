# Windows PowerShell 5.1+ / PowerShell 7. Entorno aislado de Arquitectura.
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$envFile = '.env.arquitectura.local'
$marker = '.env.arquitectura.seeded'
$project = 'openmind-arquitectura-demo'
function dc {
    & docker compose --project-name $project --env-file $envFile -f docker-compose.arquitectura.yml @args
    if ($LASTEXITCODE -ne 0) { throw 'Docker Compose fallo. Revisa la salida anterior.' }
}
function New-Key([switch]$Fernet) {
    $bytes = New-Object byte[] 32
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    if ($Fernet) { return [Convert]::ToBase64String($bytes).Replace('+','-').Replace('/','_') }
    return ([BitConverter]::ToString($bytes)).Replace('-','').ToLowerInvariant()
}
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Instala Docker Desktop e inicialo.' }
& docker info --format '{{.ServerVersion}}'
if ($LASTEXITCODE -ne 0) { throw 'Inicia Docker Desktop y vuelve a ejecutar este archivo.' }
if (-not (Test-Path -LiteralPath $envFile)) {
    if (Test-Path -LiteralPath $marker) { throw 'Faltan las claves locales originales. No se regeneran sobre datos existentes.' }
    @(
        'ARQ_POSTGRES_PASSWORD=' + (New-Key)
        'ARQ_MONGO_PASSWORD=' + (New-Key)
        'ARQ_SECRET_KEY=' + (New-Key)
        'ARQ_PAYMENT_KEY=' + (New-Key -Fernet)
        'ARQ_DEMO_OWNER_PASSWORD=Demo!' + (New-Key).Substring(0,20)
    ) | Set-Content -LiteralPath $envFile -Encoding ASCII
}
$values = @{}
Get-Content -LiteralPath $envFile | ForEach-Object {
    if ($_ -match '^(ARQ_[A-Z_]+)=(.+)$') { $values[$Matches[1]] = $Matches[2] }
}
foreach ($key in @('ARQ_POSTGRES_PASSWORD','ARQ_MONGO_PASSWORD','ARQ_SECRET_KEY','ARQ_PAYMENT_KEY','ARQ_DEMO_OWNER_PASSWORD')) {
    if (-not $values[$key]) { throw "Falta $key en el archivo local." }
    # Anular variables homonimas del proceso para usar exclusivamente las del archivo local.
    Remove-Item "Env:$key" -ErrorAction SilentlyContinue
}
Write-Host 'Preparando servicios aislados...'
dc up -d --wait db mongodb mailpit
dc build backend frontend
dc run --rm --no-deps -T backend python manage.py migrate --noinput
dc run --rm --no-deps -T backend python manage.py sync_mongo_indexes
if (-not (Test-Path -LiteralPath $marker)) {
    dc run --rm --no-deps -T -e "ARQ_DEMO_OWNER_PASSWORD=$($values['ARQ_DEMO_OWNER_PASSWORD'])" backend python manage.py shell -c "exec(compile(open('scripts/seed_arquitectura.py', encoding='utf-8').read(), 'scripts/seed_arquitectura.py', 'exec'))"
    'seed completado' | Set-Content -LiteralPath $marker -Encoding ASCII
}
dc run --rm --no-deps -T backend python manage.py check
dc up -d --wait backend frontend expirador_pedidos
dc ps
function Wait-Http([string]$url) {
    for ($i = 0; $i -lt 60; $i++) {
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 4
            if ($response.StatusCode -eq 200) { return }
        } catch {}
        Start-Sleep -Seconds 2
    }
    throw "No se pudo comprobar $url. Revisa los logs del entorno de Arquitectura."
}
Wait-Http 'http://127.0.0.1:8010/api/tienda/configuracion/'
Wait-Http 'http://127.0.0.1:5183/plantilla/2'
Write-Host ''
Write-Host 'Tienda: http://127.0.0.1:5183/plantilla/2'
Write-Host 'Correo de pruebas: http://127.0.0.1:8035'
Write-Host 'Cuenta de evaluacion: demo@ecocrespo.example'
Write-Host "Clave local de evaluacion: $($values['ARQ_DEMO_OWNER_PASSWORD'])"
Write-Host 'No compartas el archivo .env.arquitectura.local.'
Start-Process 'http://127.0.0.1:5183/plantilla/2'
