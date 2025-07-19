$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)
Get-Command node -ErrorAction Stop | Out-Null
node ./backlink-files.js
node ./create-indexes.js
node ./create-main-index.js