#!/bin/bash

# Script để setup environment variables cho Netlify
# Usage: ./setup-netlify-env.sh

echo "🚀 Setting up Netlify Environment Variables..."
echo ""

# Check if netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI chưa được cài đặt"
    echo "📦 Đang cài đặt Netlify CLI..."
    npm install -g netlify-cli
    echo "✅ Netlify CLI đã được cài đặt"
    echo ""
fi

# Check if user is logged in
echo "🔐 Checking Netlify login status..."
if ! netlify status &> /dev/null; then
    echo "⚠️  Bạn chưa login vào Netlify"
    echo "🌐 Đang mở trang login..."
    netlify login
fi

echo ""
echo "🔗 Linking to Netlify site..."
netlify link

echo ""
echo "📝 Setting environment variables..."
echo ""

# Set VITE_GOOGLE_SHEETS_API_KEY
echo "Setting VITE_GOOGLE_SHEETS_API_KEY..."
netlify env:set VITE_GOOGLE_SHEETS_API_KEY "AIzaSyC9NlfiP4qs-Hfaej4RpmxxWXRcAoKM7ao"

# Set VITE_GOOGLE_SHEET_ID
echo "Setting VITE_GOOGLE_SHEET_ID..."
netlify env:set VITE_GOOGLE_SHEET_ID "1HhIpXU6Egq9MZmyCAvPnEjCT8V4n9soD7EY4LQ8Nt0w"

# Set VITE_APPS_SCRIPT_URL
echo "Setting VITE_APPS_SCRIPT_URL..."
netlify env:set VITE_APPS_SCRIPT_URL "https://script.google.com/macros/s/AKfycbwYzdx-Bswcg5OxvIg7uFD0ki3dRg6MI_z_BfGtHaRkLelqW4bjOFOsLEJVZxdjh6Rs/exec"

# Set VITE_API_MODE
echo "Setting VITE_API_MODE..."
netlify env:set VITE_API_MODE "apps-script"

echo ""
echo "✅ Tất cả environment variables đã được set!"
echo ""
echo "📋 Verifying environment variables..."
echo ""
netlify env:list

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Setup hoàn tất!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📌 Next steps:"
echo "  1. Deploy site: netlify deploy --prod"
echo "  2. Hoặc push code lên git để auto deploy"
echo ""
echo "🔍 Kiểm tra:"
echo "  - Site settings: netlify open:admin"
echo "  - Environment vars: https://app.netlify.com/sites/YOUR_SITE/settings/env"
echo ""
