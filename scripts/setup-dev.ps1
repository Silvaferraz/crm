# Configura ambiente de desenvolvimento local
# Cria auth users e vincula com a tabela usuarios

$SUPABASE_URL = "http://127.0.0.1:54321"
$ANON_KEY = "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH"

$users = @(
  @{ usuario = "admin"; email = "admin@barbearia.com"; senha = "123456" }
  @{ usuario = "amanda"; email = "amanda@clinica.com"; senha = "123456" }
  @{ usuario = "super"; email = "super@admin.com"; senha = "123456" }
)

$headers = @{
  "Content-Type" = "application/json"
  "apikey" = $ANON_KEY
}

foreach ($u in $users) {
  Write-Host "Criando auth user: $($u.email)..."

  # Sign up (idempotente — se já existir, falha silenciosamente)
  $body = @{ email = $u.email; password = $u.senha; email_confirm = $true } | ConvertTo-Json -Compress
  $body | Out-File -FilePath "$env:TEMP\signup-payload.json" -Encoding ascii
  $result = curl.exe -s -X POST "$SUPABASE_URL/auth/v1/signup" -H "Content-Type: application/json" -H "apikey: $ANON_KEY" -d "@$env:TEMP\signup-payload.json" 2>&1 | ConvertFrom-Json

  if ($result.user.id) {
    Write-Host "  Auth ID: $($result.user.id)"
    # Atualiza auth_user_id na tabela usuarios
    $sql = "UPDATE public.usuarios SET auth_user_id = '$($result.user.id)' WHERE usuario = '$($u.usuario)';"
    $sql | Out-File -FilePath "$env:TEMP\update-auth.sql" -Encoding ascii
    npx supabase db query -f "$env:TEMP\update-auth.sql" | Out-Null
    Write-Host "  Vinculado a usuarios.$($u.usuario)"
  } elseif ($result.code -eq 23505) {
    Write-Host "  Ja existe, atualizando vinculo..."
    $sql = @"
UPDATE public.usuarios
SET auth_user_id = (SELECT id FROM auth.users WHERE email = '$($u.email)' LIMIT 1)
WHERE usuario = '$($u.usuario)' AND auth_user_id IS NULL;
"@
    $sql | Out-File -FilePath "$env:TEMP\update-auth.sql" -Encoding ascii
    npx supabase db query -f "$env:TEMP\update-auth.sql" | Out-Null
  } else {
    Write-Host "  Erro: $($result.code) $($result.message)"
  }
}

Write-Host "`nSetup concluido. Credenciais de teste:"
Write-Host "  admin@barbearia.com / 123456 (Barbearia do Ferraz)"
Write-Host "  amanda@clinica.com / 123456 (Clinica Bem-Estar)"
Write-Host "  super@admin.com / 123456 (Super Admin - Painel da Plataforma)"
