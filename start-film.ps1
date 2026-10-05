$ErrorActionPreference = 'Stop'
$filmRoot = $PSScriptRoot
$filmUrl = 'http://127.0.0.1:4197'
if (-not (Test-Path -LiteralPath (Join-Path $filmRoot 'dist/index.html'))) {
    throw '완성 빌드를 찾을 수 없습니다. 먼저 npm run build를 실행해 주세요.'
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'Node.js 22.12 이상이 필요합니다.'
}
$filmReady = $false
try {
    $filmResponse = Invoke-WebRequest -Uri $filmUrl -UseBasicParsing -TimeoutSec 2
    if ($filmResponse.Content -match '끝까지 사랑하시니') { $filmReady = $true }
    else { throw '4197 포트에 다른 프로그램이 있습니다. FILM_PORT 환경 변수로 다른 포트를 지정해 직접 실행해 주세요.' }
} catch [System.Net.WebException] {}
if (-not $filmReady) {
    Start-Process -FilePath 'node' -ArgumentList @('scripts/serve.mjs') -WorkingDirectory $filmRoot -WindowStyle Hidden
    for ($filmAttempt = 0; $filmAttempt -lt 30; $filmAttempt++) {
        Start-Sleep -Milliseconds 1000
        try {
            $filmResponse = Invoke-WebRequest -Uri $filmUrl -UseBasicParsing -TimeoutSec 2
            if ($filmResponse.Content -match '끝까지 사랑하시니') { $filmReady = $true; break }
        } catch {}
    }
}
if ($filmReady) { Start-Process $filmUrl }
else { throw '서버를 시작하지 못했습니다. 터미널에서 node scripts/serve.mjs를 실행해 상태를 확인해 주세요.' }
