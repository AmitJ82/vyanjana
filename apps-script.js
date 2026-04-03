/**
 * ═══════════════════════════════════════════════════════════════
 *   GOOGLE APPS SCRIPT — Blogger Rating & Comment Receiver
 *   Paste this at: script.google.com → New Project
 * ═══════════════════════════════════════════════════════════════
 *
 *  SETUP STEPS:
 *  1. Go to https://script.google.com and create a new project
 *  2. Paste this entire file into the Code.gs editor
 *  3. Replace SPREADSHEET_ID below with your Google Sheet ID
 *     (found in the sheet URL: .../spreadsheets/d/SPREADSHEET_ID/edit)
 *  4. Click Deploy → New Deployment
 *     - Type: Web App
 *     - Execute as: Me
 *     - Who has access: Anyone
 *  5. Authorize the script when prompted
 *  6. Copy the Web App URL
 *  7. Paste the URL into APPS_SCRIPT_URL in your Blogger widget HTML
 * ═══════════════════════════════════════════════════════════════
 */

// ── CONFIGURATION ──────────────────────────────────────────────
var SPREADSHEET_ID = '1HPDacT3S-aPPrY9zhVgtWmKKd5FKhQHSjrOPt0KqHm8';
var SHEET_NAME     = 'Feed';       // Will be created if it doesn't exist
var ALLOWED_ORIGIN = '*';              // Restrict to your blog domain if desired
                                       // e.g. 'https://yourblog.blogspot.com'
// ──────────────────────────────────────────────────────────────

/**
 * Handles POST requests from the Blogger widget.
 * Receives JSON payload and appends a row to the Google Sheet.
 */
function doPost(e) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    // Parse incoming JSON
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('No POST data received');
    }

    var data = JSON.parse(e.postData.contents);

    // Sanitize inputs
    var row = [
      data.timestamp  || new Date().toISOString(),
      data.itemId    || '—',
      data.item  || '—',
      data.name       || '—',
      data.email      || '—',     
      data.comment    || '—',
      data.rating     || 'Not rated' 
    ];

    // Get or create the sheet
    var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }

    // Add header row if sheet is empty
    if (sheet.getLastRow() === 0) {
      _addHeaders(sheet);
    }

    // Append the data row
    sheet.appendRow(row);

    // Auto-resize columns for readability
    sheet.autoResizeColumns(1, 9);

    output.setContent(JSON.stringify({
      status  : 'success',
      message : 'Feedback saved successfully',
      row     : sheet.getLastRow()
    }));

  } catch (err) {
    Logger.log('Error in doPost: ' + err.toString());
    output.setContent(JSON.stringify({
      status  : 'error',
      message : err.toString()
    }));
  }

  return output;
}


/**
 * Handles GET requests — retrieves all reviews grouped by product name.
 */
function doGet(e) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      output.setContent(JSON.stringify({
        status  : 'error',
        message : 'Sheet not found',
        reviews : {}
      }));
      return output;
    }

    var data = sheet.getDataRange().getValues();
    //var groupedReviews = _groupReviewsByProduct(data);

      output.setContent(JSON.stringify({
      status   : 'success',
      message  : 'Reviews retrieved successfully',
      total    : data?.length - 1 || 0,  // Exclude header row
      reviews  : data.slice(1).map(function(row) {
        return {
          timestamp : row[0] || '',
          itemId   : row[1] || '',
          item      : row[2] || '',
          name      : row[3] || '',
          email     : row[4] || '',
          comment    : row[5] || '',
          rating   : row[6] || ''
        };
      })
    }));

  } catch (err) {
    Logger.log('Error in doGet: ' + err.toString());
    output.setContent(JSON.stringify({
      status  : 'error',
      message : err.toString(),
      reviews : {}
    }));
  }

  return output;
}


/**
 * Adds formatted header row to a new sheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 */
function _addHeaders(sheet) {
  var headers = [
    'Timestamp',
    'Item Id',
    'Item ',
    'Name',
    'Email',     
    'Comment',
    'Rating'
  ];

  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);

  // Style the header row
  headerRange
    .setFontWeight('bold')
    .setFontColor('#FFFFFF')
    .setBackground('#1a1a2e')
    .setFontFamily('Arial')
    .setFontSize(10);

  // Freeze the header row
  sheet.setFrozenRows(1);

  // Set column widths for better readability
  sheet.setColumnWidth(1, 180);  // Timestamp
  sheet.setColumnWidth(2, 280);  // ItemId
  sheet.setColumnWidth(3, 200);  // Item
  sheet.setColumnWidth(4, 130);  // Name
  sheet.setColumnWidth(5, 190);  // Email
  sheet.setColumnWidth(6, 130);  // Comment
  sheet.setColumnWidth(7, 350);  // Rating 
}


/**
 * Groups all reviews by product name (Page Title).
 * @param {Array} data - 2D array from sheet.getDataRange().getValues()
 * @return {Object} - Reviews grouped by product name
 */
// function _groupReviewsByProduct(data) {
//   var grouped = {};

//   // Skip header row (index 0)
//   for (var i = 1; i < data.length; i++) {
//     var row = data[i];
//     var productName = row[2] || 'Unknown Product';  // Column 3 is Page Title
    
//     if (!grouped[productName]) {
//       grouped[productName] = [];
//     }

//     grouped[productName].push({
//       timestamp : row[0] || '',
//       itemId   : row[1] || '',
//       item      : row[2] || '',
//       name      : row[3] || '',
//       email     : row[4] || '',
//       comment    : row[5] || '',
//       rating   : row[6] || ''
//     });
//   }

//   return grouped;
// }


/**
 * Counts total number of reviews across all products.
 * @param {Object} groupedReviews - Reviews grouped by product
 * @return {Number} - Total review count
 */
// function _countTotalReviews(groupedReviews) {
//   var total = 0;
//   for (var product in groupedReviews) {
//     total += groupedReviews[product].length;
//   }
//   return total;
// }
 /* Optional: Sends an email notification when new feedback is submitted.
 * Uncomment and configure NOTIFY_EMAIL below to enable.
 *
 * var NOTIFY_EMAIL = 'you@gmail.com';
 */
  var NOTIFY_EMAIL = 'manali.joshi05@gmail.com';
  function _notifyOwner(data) {
    var subject = '📝 New feedback on: ' + (data.pageTitle || 'your blog');
    var body = [
      'New feedback received!\n',
      'Name:    ' + data.name,
      'Email:   ' + data.email,
      'Rating:  ' + data.rating,
      'Comment: ' + data.comment,
      'Item:    ' + data.item,
      'Time:    ' + data.timestamp,
    '\nView all feedback: https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID
  ].join('\n');
    MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
 }
