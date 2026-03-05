#!/bin/zsh
echo "🔍 检查改动..."
git status --short

echo "\n❓ 确认推送？(y/n)"
read confirm
[ "$confirm" != "y" ] && echo "❌ 已取消" && exit 1

echo "\n📝 输入提交信息："
read msg
git add .
git commit -m "✨ $msg"
git pull --rebase origin main
git push origin main && echo "\n✅ 推送成功！GitHub: https://github.com/junxie01/seismic-app"
