# Backend Server for Google Sheets API

## Setup Instructions

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Create Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sheets API
4. Create Service Account:
   - Go to `IAM & Admin` → `Service Accounts`
   - Click `Create Service Account`
   - Fill in details and click `Create`
   - Skip optional steps
5. Create Key:
   - Click on the service account you just created
   - Go to `Keys` tab
   - Click `Add Key` → `Create new key`
   - Choose `JSON` format
   - Download and save as `service-account-key.json` in this directory

### 3. Share Google Sheet with Service Account

1. Open the downloaded `service-account-key.json`
2. Copy the `client_email` (looks like: `xxx@xxx.iam.gserviceaccount.com`)
3. Open your Google Sheet
4. Click `Share` button
5. Paste the service account email
6. Give `Editor` permission
7. Click `Send`

### 4. Configure Environment

Create `.env` file:

```bash
PORT=3000
SPREADSHEET_ID=1HhIpXU6Egq9MZmyCAvPnEjCT8V4n9soD7EY4LQ8Nt0w
```

### 5. Start Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

## Testing Endpoints

### Health Check

```bash
curl http://localhost:3000/health
```

### Append Data

```bash
curl -X POST http://localhost:3000/api/sheets/append \
  -H "Content-Type: application/json" \
  -d '{
    "sheetName": "TestSheet",
    "values": [
      ["Test", "Data", "Row1"],
      ["Test", "Data", "Row2"]
    ]
  }'
```

### Update Data

```bash
curl -X POST http://localhost:3000/api/sheets/update \
  -H "Content-Type: application/json" \
  -d '{
    "sheetName": "TestSheet",
    "range": "A1:C1",
    "values": [["Updated", "Data", "Here"]]
  }'
```

### Get Data

```bash
curl "http://localhost:3000/api/sheets/get?sheetName=DanhSach&range=A1:Z100"
```

## Security Notes

⚠️ **IMPORTANT**:

- Never commit `service-account-key.json` to Git
- Add it to `.gitignore`
- Keep it secure
- Rotate keys regularly

## Deploying to Production

### Option 1: VPS/Cloud Server

1. Upload code to server
2. Upload `service-account-key.json` securely
3. Install Node.js
4. Run `npm install`
5. Use PM2 to keep server running:
   ```bash
   npm install -g pm2
   pm2 start server.js --name sheets-api
   pm2 save
   pm2 startup
   ```

### Option 2: Cloud Functions/Serverless

- Deploy as Google Cloud Function
- Or AWS Lambda
- Or Azure Functions

### Option 3: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

## Monitoring

Check logs:

```bash
# If using PM2
pm2 logs sheets-api

# If running directly
# Logs will appear in console
```

## Troubleshooting

### Error: Cannot find module './service-account-key.json'

- Make sure you've downloaded and placed the key file in backend directory

### Error: Permission denied

- Check if you've shared the sheet with service account email
- Verify the service account has Editor permission

### Error: The caller does not have permission

- Enable Google Sheets API in Cloud Console
- Check service account scopes

## Rate Limits

Google Sheets API has quotas:

- 500 requests per 100 seconds per project
- 100 requests per 100 seconds per user

The server implements basic error handling for rate limits.
