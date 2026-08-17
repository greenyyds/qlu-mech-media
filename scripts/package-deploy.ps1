# 重新打包部署 zip（修复 Windows 反斜杠问题）
# 用法：powershell -ExecutionPolicy Bypass -File scripts/package-deploy.ps1
# 前置：先执行 npm run build
param(
  [string]$Source = "dist",
  [string]$Out = "docs\deploy\qlu-mech-media-v2.zip"
)

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$src = (Resolve-Path $Source).Path
if (-not (Test-Path $src)) { Write-Error "未找到构建目录 $Source，请先执行 npm run build"; exit 1 }
if (Test-Path $Out) { Remove-Item $Out -Force }

$fs = [System.IO.File]::Open($Out, [System.IO.FileMode]::CreateNew)
$zip = New-Object System.IO.Compression.ZipArchive($fs, [System.IO.Compression.ZipArchiveMode]::Create)

$files = Get-ChildItem -Path $src -Recurse -File
foreach ($f in $files) {
  # 关键：条目路径使用正斜杠 /（zip 规范），否则 EdgeOne 等平台会拒绝上传
  $rel = $f.FullName.Substring($src.Length + 1).Replace('\', '/')
  $entry = $zip.CreateEntry($rel, [System.IO.Compression.CompressionLevel]::Optimal)
  $es = $entry.Open()
  $bytes = [System.IO.File]::ReadAllBytes($f.FullName)
  $es.Write($bytes, 0, $bytes.Length)
  $es.Close()
}

$zip.Dispose()
$fs.Close()

# 自检
$check = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path $Out))
$bad = $check.Entries | Where-Object { $_.FullName -match '\\' }
$root = $check.Entries | Where-Object { $_.FullName -eq 'index.html' }
"打包完成: $Out ($([math]::Round((Get-Item $Out).Length/1KB)) KB)"
"条目数: $($check.Entries.Count) | 反斜杠条目: $($bad.Count) | index.html 在根: $($root.Count -gt 0)"
if ($bad.Count -gt 0 -or $root.Count -eq 0) { Write-Error "打包自检失败"; $check.Dispose(); exit 1 }
$check.Dispose()
"自检通过 ✔"
