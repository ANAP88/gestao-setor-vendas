$root = $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://localhost:8123/')
$listener.Start()
Write-Output "serving $root on http://localhost:8123/"
$mime = @{'.html'='text/html; charset=utf-8';'.js'='text/javascript; charset=utf-8';'.css'='text/css'}
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $path = $ctx.Request.Url.AbsolutePath
  if ($path -eq '/') { $path = '/index.html' }
  $file = Join-Path $root ($path.TrimStart('/') -replace '/','\')
  if ((Test-Path $file) -and ([System.IO.Path]::GetFullPath($file)).StartsWith($root)) {
    $bytes = [System.IO.File]::ReadAllBytes($file)
    $ext = [System.IO.Path]::GetExtension($file)
    $ctx.Response.ContentType = if ($mime[$ext]) { $mime[$ext] } else { 'application/octet-stream' }
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else { $ctx.Response.StatusCode = 404 }
  $ctx.Response.Close()
}
