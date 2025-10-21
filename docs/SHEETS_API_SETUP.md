# Hướng dẫn Setup Google Sheets API

## Vấn đề hiện tại

Project đang sử dụng Google Apps Script để ghi dữ liệu vào Sheet, gây ra lỗi **duplicate append row** khi có nhiều request cùng lúc.

Giải pháp: Chuyển sang sử dụng **Google Sheets API** trực tiếp, có các tính năng:

- ✅ Atomic operations (tránh duplicate)
- ✅ Batch updates (nhiều thao tác cùng lúc)
- ✅ Retry logic với exponential backoff
- ✅ Better error handling

## Phương án setup

### Phương án 1: OAuth2 (Khuyến nghị cho môi trường phát triển)

#### Bước 1: Tạo OAuth2 Credentials

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project hoặc tạo project mới
3. Enable **Google Sheets API**:
   - Vào `APIs & Services` → `Library`
   - Tìm "Google Sheets API" và enable
4. Tạo OAuth2 Credentials:
   - Vào `APIs & Services` → `Credentials`
   - Click `Create Credentials` → `OAuth client ID`
   - Chọn `Web application`
   - Thêm Authorized redirect URIs:
     - `http://localhost:5174/auth/callback` (cho dev)
     - URL production của bạn
   - Lưu lại **Client ID** và **Client Secret**

#### Bước 2: Implement OAuth2 Flow

Tạo file `src/services/google-auth.ts`:

```typescript
import axios from 'axios'

const CLIENT_ID = 'YOUR_CLIENT_ID'
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET'
const REDIRECT_URI = 'http://localhost:5174/auth/callback'
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets'

export const getAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export const exchangeCodeForToken = async (code: string) => {
  const response = await axios.post('https://oauth2.googleapis.com/token', {
    code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
  })

  const { access_token, refresh_token } = response.data

  // Lưu tokens
  localStorage.setItem('sheets_access_token', access_token)
  if (refresh_token) {
    localStorage.setItem('sheets_refresh_token', refresh_token)
  }

  return { access_token, refresh_token }
}

export const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('sheets_refresh_token')

  if (!refreshToken) {
    throw new Error('No refresh token available')
  }

  const response = await axios.post('https://oauth2.googleapis.com/token', {
    refresh_token: refreshToken,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'refresh_token',
  })

  const { access_token } = response.data
  localStorage.setItem('sheets_access_token', access_token)

  return access_token
}
```

Tạo page auth callback `src/pages/auth/GoogleCallback.vue`:

```vue
<template>
  <div class="flex items-center justify-center h-screen">
    <VaProgressCircle indeterminate />
    <p class="ml-4">Đang xác thực với Google...</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { exchangeCodeForToken } from '../../services/google-auth'

const router = useRouter()

onMounted(async () => {
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')

  if (code) {
    try {
      await exchangeCodeForToken(code)
      router.push('/') // Redirect về trang chủ
    } catch (error) {
      console.error('Auth error:', error)
      router.push('/login')
    }
  }
})
</script>
```

Thêm route trong `src/router/index.ts`:

```typescript
{
  path: '/auth/callback',
  name: 'google-callback',
  component: () => import('../pages/auth/GoogleCallback.vue'),
}
```

Thêm button login Google trong `src/pages/auth/Login.vue`:

```vue
<VaButton @click="loginWithGoogle" color="primary" outline>
  <VaIcon name="mso-login" />
  Đăng nhập với Google Sheets
</VaButton>

<script setup>
import { getAuthUrl } from '../../services/google-auth'

const loginWithGoogle = () => {
  window.location.href = getAuthUrl()
}
</script>
```

### Phương án 2: Service Account (Khuyến nghị cho Production)

#### Bước 1: Tạo Service Account

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. `APIs & Services` → `Credentials`
3. `Create Credentials` → `Service Account`
4. Điền thông tin và tạo
5. Vào Service Account vừa tạo → `Keys` → `Add Key` → `JSON`
6. Download file JSON về

#### Bước 2: Share Sheet với Service Account

1. Mở file JSON, copy email của service account (dạng `xxx@xxx.iam.gserviceaccount.com`)
2. Mở Google Sheet của bạn
3. Click `Share` → Paste email service account → Give `Editor` permission

#### Bước 3: Setup Backend Server

**LƯU Ý**: Service Account key không nên để ở frontend!

Tạo simple Node.js server:

```javascript
// server.js
const express = require('express')
const { google } = require('googleapis')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

// Load service account credentials
const credentials = require('./service-account-key.json')

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

const sheets = google.sheets({ version: 'v4', auth })

// Endpoint để append data
app.post('/api/sheets/append', async (req, res) => {
  try {
    const { sheetName, values } = req.body

    const result = await sheets.spreadsheets.values.append({
      spreadsheetId: '1HhIpXU6Egq9MZmyCAvPnEjCT8V4n9soD7EY4LQ8Nt0w',
      range: sheetName,
      valueInputOption: 'RAW',
      requestBody: {
        values: values,
      },
    })

    res.json({ status: 'success', data: result.data })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ status: 'error', error: error.message })
  }
})

// Endpoint để update data
app.post('/api/sheets/update', async (req, res) => {
  try {
    const { sheetName, range, values } = req.body

    const result = await sheets.spreadsheets.values.update({
      spreadsheetId: '1HhIpXU6Egq9MZmyCAvPnEjCT8V4n9soD7EY4LQ8Nt0w',
      range: `${sheetName}!${range}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: values,
      },
    })

    res.json({ status: 'success', data: result.data })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ status: 'error', error: error.message })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
```

Update `data-from-sheet.ts` để gọi backend:

```typescript
// Update baseUrl to point to your backend
const backendUrl = process.env.VITE_BACKEND_URL || 'http://localhost:3000'

export async function appendDataToSheet(
  sheetName: string,
  data: any[],
): Promise<{ status: string; data?: any; error?: any }> {
  try {
    const response = await axiosInstance.post(`${backendUrl}/api/sheets/append`, {
      sheetName,
      values: data,
    })

    return response.data
  } catch (error: any) {
    return {
      status: 'error',
      error: error?.response?.data || error.message,
    }
  }
}
```

### Phương án 3: Hybrid (Tạm thời - Dùng Apps Script nhưng cải thiện)

Nếu không muốn thay đổi nhiều, có thể cải thiện Apps Script:

```javascript
// apps-script.gs
// Thêm idempotency key để tránh duplicate

function doGet(e) {
  const action = e.parameter.action
  const param = JSON.parse(e.parameter.param)
  const idempotencyKey = e.parameter.key || ''

  // Check if this request was already processed
  if (idempotencyKey) {
    const cache = CacheService.getScriptCache()
    const cached = cache.get(idempotencyKey)

    if (cached) {
      return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON)
    }
  }

  // Process request
  const result = processAction(action, param)

  // Cache result for 1 hour
  if (idempotencyKey) {
    const cache = CacheService.getScriptCache()
    cache.put(idempotencyKey, JSON.stringify(result), 3600)
  }

  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON)
}
```

Update frontend để gửi idempotency key:

```typescript
export const sendRequest = async (action: string, param: any) => {
  // Generate unique key for this request
  const idempotencyKey = `${action}_${Date.now()}_${Math.random()}`

  const response = await axiosInstance.get(
    `${scriptUrl}?action=${action}&param=${JSON.stringify(param)}&key=${idempotencyKey}`,
  )

  return response.data
}
```

## Khuyến nghị

1. **Development**: Dùng OAuth2 (Phương án 1)
2. **Production**: Dùng Service Account với Backend (Phương án 2)
3. **Tạm thời**: Cải thiện Apps Script với idempotency (Phương án 3)

## Kiểm tra sau khi setup

```bash
# Test append
curl -X POST http://localhost:3000/api/sheets/append \
  -H "Content-Type: application/json" \
  -d '{"sheetName": "TestSheet", "values": [["Test", "Data"]]}'

# Test update
curl -X POST http://localhost:3000/api/sheets/update \
  -H "Content-Type: application/json" \
  -d '{"sheetName": "TestSheet", "range": "A1:B1", "values": [["Updated", "Data"]]}'
```

## Các bước tiếp theo

1. Chọn phương án phù hợp với dự án
2. Setup theo hướng dẫn trên
3. Test với data mẫu
4. Migrate dần từ Apps Script sang Sheets API
5. Monitor lỗi và hiệu suất

## Lưu ý bảo mật

- ❌ **KHÔNG** commit API keys, Client Secret, hoặc Service Account keys vào Git
- ✅ Sử dụng environment variables
- ✅ Thêm vào `.gitignore`:
  ```
  .env
  .env.local
  service-account-key.json
  ```
- ✅ Rotate keys định kỳ
- ✅ Set up proper CORS và rate limiting
