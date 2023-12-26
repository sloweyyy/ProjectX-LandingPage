// sheetClient.js
const { google } = require('googleapis');

const { client_email, private_key } = require('../secret.json');

const SHEET_ID = '1HA42o3I_RfxeHLao2CG995kIuU4cdY-sGoK6K6316n4';

const client = new google.auth.JWT(client_email, undefined, private_key, ['https://www.googleapis.com/auth/spreadsheets']);

const sheets = google.sheets({ version: 'v4', auth: client });

module.exports = sheets;