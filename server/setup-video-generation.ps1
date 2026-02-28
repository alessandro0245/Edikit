# Navigate to server directory
Set-Location -Path "d:\Nextjs Projects\Freelance fiverr\Edikit\Edikit\server"

Write-Host "Installing Claude AI SDK and Remotion packages..." -ForegroundColor Green

# Install packages
pnpm install @anthropic-ai/sdk @remotion/lambda @remotion/renderer remotion react react-dom

Write-Host "`nPackages installed successfully!" -ForegroundColor Green

Write-Host "`nGenerating Prisma client..." -ForegroundColor Yellow
pnpm prisma:generate

Write-Host "`nRunning database migration..." -ForegroundColor Yellow
pnpx prisma migrate dev --name add_video_table

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Add CLAUDE_API_KEY to your .env file" -ForegroundColor White
Write-Host "2. Restart your server" -ForegroundColor White
Write-Host "3. Test the /video/generate-prompt endpoint" -ForegroundColor White
