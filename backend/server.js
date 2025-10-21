const express = require('express')
const { google } = require('googleapis')
const cors = require('cors')
require('dotenv').config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Load service account credentials
// IMPORTANT: Keep this file secure and never commit to Git!
let auth
try {
  const credentials = require('./service-account-key.json')
  auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
} catch (error) {
  console.error('❌ Error loading service account key:', error.message)
  console.log('ℹ️  Please add service-account-key.json file to backend directory')
  process.exit(1)
}

const sheets = google.sheets({ version: 'v4', auth })
const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1HhIpXU6Egq9MZmyCAvPnEjCT8V4n9soD7EY4LQ8Nt0w'

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running' })
})

/**
 * Append data to sheet
 * POST /api/sheets/append
 * Body: { sheetName: string, values: any[][] }
 */
app.post('/api/sheets/append', async (req, res) => {
  try {
    const { sheetName, values } = req.body

    if (!sheetName || !values) {
      return res.status(400).json({
        status: 'error',
        error: 'Missing sheetName or values',
      })
    }

    console.log(`📝 Appending data to sheet: ${sheetName}`)

    const result = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: sheetName,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: values,
      },
    })

    console.log(`✅ Successfully appended ${values.length} row(s)`)

    res.json({
      status: 'success',
      data: result.data,
    })
  } catch (error) {
    console.error('❌ Error appending data:', error.message)
    res.status(500).json({
      status: 'error',
      error: error.message,
    })
  }
})

/**
 * Update data in sheet
 * POST /api/sheets/update
 * Body: { sheetName: string, range: string, values: any[][] }
 */
app.post('/api/sheets/update', async (req, res) => {
  try {
    const { sheetName, range, values } = req.body

    if (!sheetName || !range || !values) {
      return res.status(400).json({
        status: 'error',
        error: 'Missing sheetName, range, or values',
      })
    }

    console.log(`🔄 Updating data in sheet: ${sheetName}!${range}`)

    const result = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!${range}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: values,
      },
    })

    console.log(`✅ Successfully updated ${values.length} row(s)`)

    res.json({
      status: 'success',
      data: result.data,
    })
  } catch (error) {
    console.error('❌ Error updating data:', error.message)
    res.status(500).json({
      status: 'error',
      error: error.message,
    })
  }
})

/**
 * Batch update sheet
 * POST /api/sheets/batch-update
 * Body: { requests: any[] }
 */
app.post('/api/sheets/batch-update', async (req, res) => {
  try {
    const { requests } = req.body

    if (!requests || !Array.isArray(requests)) {
      return res.status(400).json({
        status: 'error',
        error: 'Missing or invalid requests array',
      })
    }

    console.log(`🔄 Batch updating ${requests.length} request(s)`)

    const result = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: requests,
      },
    })

    console.log(`✅ Successfully completed batch update`)

    res.json({
      status: 'success',
      data: result.data,
    })
  } catch (error) {
    console.error('❌ Error in batch update:', error.message)
    res.status(500).json({
      status: 'error',
      error: error.message,
    })
  }
})

/**
 * Get data from sheet
 * GET /api/sheets/get?sheetName=DanhSach&range=A1:Z100
 */
app.get('/api/sheets/get', async (req, res) => {
  try {
    const { sheetName, range } = req.query

    if (!sheetName) {
      return res.status(400).json({
        status: 'error',
        error: 'Missing sheetName parameter',
      })
    }

    const fullRange = range ? `${sheetName}!${range}` : sheetName

    console.log(`📖 Reading data from: ${fullRange}`)

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: fullRange,
    })

    console.log(`✅ Successfully read ${result.data.values?.length || 0} row(s)`)

    res.json({
      status: 'success',
      data: result.data,
    })
  } catch (error) {
    console.error('❌ Error reading data:', error.message)
    res.status(500).json({
      status: 'error',
      error: error.message,
    })
  }
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({
    status: 'error',
    error: 'Internal server error',
  })
})

// Start server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`
🚀 Backend server is running!
📍 Port: ${PORT}
📊 Spreadsheet ID: ${SPREADSHEET_ID}
🔗 Endpoints:
   - GET  /health
   - POST /api/sheets/append
   - POST /api/sheets/update
   - POST /api/sheets/batch-update
   - GET  /api/sheets/get
  `)
})
