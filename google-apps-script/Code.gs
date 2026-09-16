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
var PRODUCTS_SHEET_NAME     = 'Products'; 
var ORDERS_SHEET_NAME = 'Orders';
var DELIVERY_CONFIG_SHEET_NAME = 'DeliveryConfig';
var OTP_TTL_SECONDS = 600;
var SESSION_TTL_SECONDS = 1800;
var ALLOWED_ORIGIN = '*';              // Restrict to your blog domain if desired
                                       // e.g. 'https://yourblog.blogspot.com'
// ──────────────────────────────────────────────────────────────

/**
 * Run this function once from the Apps Script editor to trigger authorization.
 * It does not send email or change sheet data.
 */
function authorizeServices() {
  SpreadsheetApp.openById(SPREADSHEET_ID).getName();
  MailApp.getRemainingDailyQuota();
  CacheService.getScriptCache().put('authorization-check', 'ok', 60);
  Logger.log('Services authorized successfully');
}

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

    if (data.action === 'requestOtp') {
      return requestOtp(data.email);
    }

    if (data.action === 'verifyOtp') {
      return verifyOtp(data.email, data.otp);
    }

    if (data.action === 'adminLogin') {
      return adminLogin(data.username, data.password);
    }

    if (data.action === 'adminUpdateOrder') {
      return adminUpdateOrder(data);
    }

    if (data.action === 'adminUpdateInventory') {
      return adminUpdateInventory(data);
    }

    if (data.type === 'order') {
      return saveOrder(data);
    }

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


function requestOtp(email) {
  email = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ status: 'error', message: 'A valid email is required' });
  }

  var otp = String(Math.floor(100000 + Math.random() * 900000));
  CacheService.getScriptCache().put('otp:' + email, otp, OTP_TTL_SECONDS);
  MailApp.sendEmail(
    email,
    'Your Vyanjana login code',
    'Your one-time login code is ' + otp + '. It expires in 10 minutes.'
  );
  return jsonResponse({ status: 'success', message: 'OTP sent' });
}


function verifyOtp(email, otp) {
  email = String(email || '').trim().toLowerCase();
  var cache = CacheService.getScriptCache();
  var expectedOtp = cache.get('otp:' + email);
  if (!expectedOtp || expectedOtp !== String(otp || '').trim()) {
    return jsonResponse({ status: 'error', message: 'Invalid or expired OTP' });
  }

  cache.remove('otp:' + email);
  var token = Utilities.getUuid();
  cache.put('session:' + token, email, SESSION_TTL_SECONDS);
  return jsonResponse({ status: 'success', email: email, token: token });
}

function adminLogin(username, password) {
  var settings = getOrderSettings();
  if (!settings.adminUsername || !settings.adminPassword ||
      String(username || '').trim() !== settings.adminUsername ||
      String(password || '') !== settings.adminPassword) {
    return jsonResponse({ status: 'error', message: 'Invalid owner credentials' });
  }

  var token = Utilities.getUuid();
  CacheService.getScriptCache().put('admin-session:' + token, settings.adminUsername, SESSION_TTL_SECONDS);
  return jsonResponse({ status: 'success', token: token, expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000 });
}

function isAdminSessionValid(token) {
  return Boolean(CacheService.getScriptCache().get('admin-session:' + String(token || '')));
}

function adminUpdateOrder(data) {
  if (!isAdminSessionValid(data.token)) {
    return jsonResponse({ status: 'error', message: 'Unauthorized' });
  }

  var orderId = String(data.orderId || '').trim();
  if (!orderId) return jsonResponse({ status: 'error', message: 'Order ID is required' });

  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ORDERS_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return jsonResponse({ status: 'error', message: 'Order not found' });

  var rows = sheet.getDataRange().getValues();
  var updated = 0;
  rows.slice(1).forEach(function(row, index) {
    if (String(row[0] || '').trim() !== orderId) return;
    sheet.getRange(index + 2, 3).setValue(String(data.status || row[2] || 'Pending'));
    sheet.getRange(index + 2, 20).setValue(String(data.deliveryDate || ''));
    sheet.getRange(index + 2, 21).setValue(String(data.adminComment || ''));
    updated += 1;
  });

  return updated
    ? jsonResponse({ status: 'success', message: 'Order updated', rows: updated })
    : jsonResponse({ status: 'error', message: 'Order not found' });
}

function adminUpdateInventory(data) {
  if (!isAdminSessionValid(data.token)) {
    return jsonResponse({ status: 'error', message: 'Unauthorized' });
  }

  var productId = String(data.productId || '').trim();
  var weight = String(data.weight || '').trim();
  var inventory = Number(data.inventory);
  if (!productId || !weight || !Number.isInteger(inventory) || inventory < 0) {
    return jsonResponse({ status: 'error', message: 'A valid product and non-negative inventory are required' });
  }

  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(PRODUCTS_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return jsonResponse({ status: 'error', message: 'Products sheet not found' });

  var rows = sheet.getDataRange().getValues();
  var headers = rows[0].map(function(header) { return String(header).trim().toLowerCase(); });
  var itemIdIndex = headers.indexOf('item id');
  var inventoryIndex = headers.indexOf('inventory');
  var weightIndex = headers.indexOf('item weight');
  if (itemIdIndex === -1 || weightIndex === -1 || inventoryIndex === -1) {
    return jsonResponse({ status: 'error', message: 'Products sheet needs Item ID and Inventory columns' });
  }

  var updated = 0;
  rows.slice(1).forEach(function(row, index) {
    if (String(row[itemIdIndex] || '').trim() !== productId || String(row[weightIndex] || '').trim() !== weight) return;
    sheet.getRange(index + 2, inventoryIndex + 1).setValue(inventory);
    updated += 1;
  });

  return updated
    ? jsonResponse({ status: 'success', message: 'Inventory updated', rows: updated, inventory: inventory })
    : jsonResponse({ status: 'error', message: 'Product not found' });
}


/**
 * Saves one invoice to the Orders sheet, with one row per line item.
 */
function saveOrder(order) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(ORDERS_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(ORDERS_SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 21).setValues([[
      'Order ID',
      'Order Date',
      'Status',
      'Payment Method',
      'Payment ID',
      'Customer Name',
      'Customer Mobile',
      'Customer Email',
      'Delivery Address',
      'City',
      'State',
      'Product ID',
      'Product Name',
      'Item Weight',
      'Unit Price',
      'Quantity',
      'Line Total',
      'Delivery Charge',
      'Invoice Total',
      'Delivery Date',
      'Admin Comment'
    ]]);
    sheet.getRange(1, 1, 1, 19).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  var lineItems = order.lineItems || [];
  if (!lineItems.length) {
    throw new Error('Order must contain at least one line item');
  }

  decrementInventory(ss, lineItems);

  var rows = lineItems.map(function(item) {
    return [
      order.id || '',
      order.orderDate || new Date().toISOString(),
      order.status || '',
      order.paymentMethod || '',
      order.paymentId || '',
      order.customerName || '',
      order.customerMobile || '',
      order.customerEmail || '',
      order.deliveryAddress || '',
      order.city || '',
      order.state || '',
      item.productId || '',
      item.productName || '',
      item.weight || '',
      item.price || 0,
      item.quantity || 0,
      item.total || 0,
      order.deliveryCharge || 0,
      order.totalAmount || 0,
      order.deliveryDate || '',
      order.adminComment || ''
    ];
  });

  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 19).setValues(rows);
  var settings = getOrderSettings();
  if (settings.orderNotificationEmail) {
    var itemSummary = lineItems.map(function(item) {
      return item.productName + ' (' + item.weight + ') x' + item.quantity;
    }).join(', ');
    MailApp.sendEmail(
      settings.orderNotificationEmail,
      'New order ' + (order.id || ''),
      [
        'A new order was submitted.',
        '',
        'Order ID: ' + (order.id || ''),
        'Customer: ' + (order.customerName || ''),
        'Email: ' + (order.customerEmail || ''),
        'Mobile: ' + (order.customerMobile || ''),
        'Location: ' + (order.city || '') + ', ' + (order.state || ''),
        'Items: ' + itemSummary,
        'Payment: ' + (order.paymentMethod || ''),
        'Status: ' + (order.status || ''),
        'Total: INR ' + (order.totalAmount || 0)
      ].join('\n')
    );
  }
  return jsonResponse({
    status: 'success',
    message: 'Order saved successfully',
    orderId: order.id || '',
    rows: rows.length
  });
}

function getOrderSettings() {
  var settings = { orderNotificationEmail: '', upiId: '', adminUsername: '', adminPassword: '' };
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Settings');
  if (!sheet || sheet.getLastRow() < 2) return settings;
  sheet.getDataRange().getValues().slice(1).forEach(function(row) {
    var key = String(row[0] || '').trim();
    var value = String(row[1] || '').trim();
    if (key === 'orderNotificationEmail') settings.orderNotificationEmail = value;
    if (key === 'adminUsername') settings.adminUsername = value;
    if (key === 'adminPassword') settings.adminPassword = value;
    if (key === 'upiId') settings.upiId = value;
  });
  return settings;
}

function decrementInventory(ss, lineItems) {
  var sheet = ss.getSheetByName(PRODUCTS_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return;

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var rows = sheet.getDataRange().getValues();
    var headers = rows[0].map(function(header) { return String(header).trim().toLowerCase(); });
    var itemIdIndex = headers.indexOf('item id');
    var weightIndex = headers.indexOf('item weight');
    var inventoryIndex = headers.indexOf('inventory');
    if (itemIdIndex === -1 || weightIndex === -1 || inventoryIndex === -1) return;

    var requested = {};
    lineItems.forEach(function(item) {
      var key = String(item.productId || '').trim() + '|' + String(item.weight || '').trim();
      requested[key] = (requested[key] || 0) + Number(item.quantity || 0);
    });

    var rowIndexes = {};
    rows.slice(1).forEach(function(row, index) {
      var id = String(row[itemIdIndex] || '').trim();
      var weight = String(row[weightIndex] || '').trim();
      if (id && weight && rowIndexes[id + '|' + weight] === undefined) rowIndexes[id + '|' + weight] = index + 1;
    });

    Object.keys(requested).forEach(function(key) {
      var rowIndex = rowIndexes[key];
      if (rowIndex === undefined) throw new Error('Product variant ' + key + ' was not found');
      var current = Number(rows[rowIndex][inventoryIndex]);
      if (!Number.isFinite(current)) return;
      if (current < requested[key]) throw new Error('Insufficient inventory for product variant ' + key);
      sheet.getRange(rowIndex + 1, inventoryIndex + 1).setValue(current - requested[key]);
    });
  } finally {
    lock.releaseLock();
  }
}


function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}


/**
 * Handles GET requests — retrieves all reviews grouped by product name.
 */
function doGet(e) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  if (e && e.parameter && e.parameter.action === 'orders') {
    return getOrderHistory(e.parameter.email, e.parameter.token);
  }

  if (e && e.parameter && e.parameter.action === 'adminOrders') {
    return getAdminOrders(e.parameter.token);
  }

  if (e && e.parameter && e.parameter.action === 'adminProducts') {
    return getAdminProducts(e.parameter.token);
  }

  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    var products = getProducts();
    var deliveryConfig = getDeliveryConfig();

    if (!sheet) {
      output.setContent(JSON.stringify({
        status   : 'success',
        message  : 'Products retrieved successfully; review sheet not found',
        total    : 0,
        reviews  : [],
        products : products,
        deliveryConfig: deliveryConfig
      }));
      return output;
    }

    var data = sheet.getDataRange().getValues();
    //var groupedReviews = _groupReviewsByProduct(data);

      output.setContent(JSON.stringify({
      status   : 'success',
      message  : 'Reviews retrieved successfully',
      total    : data.length > 1 ? data.length - 1 : 0,  // Exclude header row
      products : products,
      deliveryConfig: deliveryConfig,
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
      reviews : [],
      products: [],
      deliveryConfig: getDefaultDeliveryConfig()
    }));
  }

  return output;
}


function getOrderHistory(email, token) {
  email = String(email || '').trim().toLowerCase();
  var sessionEmail = CacheService.getScriptCache().get('session:' + String(token || ''));
  if (!sessionEmail || sessionEmail !== email) {
    return jsonResponse({ status: 'error', message: 'Unauthorized', orders: [] });
  }

  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ORDERS_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) {
    return jsonResponse({ status: 'success', orders: [] });
  }

  var rows = sheet.getDataRange().getValues();
  var orders = {};
  rows.slice(1).forEach(function(row) {
    if (String(row[7] || '').trim().toLowerCase() !== email) return;
    var orderId = String(row[0] || '');
    if (!orders[orderId]) {
      orders[orderId] = {
        id: orderId,
        orderDate: row[1],
        status: row[2],
        paymentMethod: row[3],
        customerEmail: row[7],
        deliveryAddress: row[8],
        city: row[9],
        state: row[10],
        deliveryCharge: Number(row[17]) || 0,
        totalAmount: Number(row[18]) || 0,
        deliveryDate: row[19] || '',
        adminComment: row[20] || '',
        lineItems: []
      };
    }
    orders[orderId].lineItems.push({
      productId: row[11],
      productName: row[12],
      weight: row[13],
      price: Number(row[14]) || 0,
      quantity: Number(row[15]) || 0,
      total: Number(row[16]) || 0
    });
  });

  return jsonResponse({ status: 'success', orders: Object.keys(orders).map(function(id) { return orders[id]; }) });
}

function getAdminOrders(token) {
  if (!isAdminSessionValid(token)) {
    return jsonResponse({ status: 'error', message: 'Unauthorized', orders: [] });
  }

  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ORDERS_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return jsonResponse({ status: 'success', orders: [] });

  var rows = sheet.getDataRange().getValues();
  var orders = {};
  rows.slice(1).forEach(function(row) {
    var orderId = String(row[0] || '');
    if (!orderId) return;
    if (!orders[orderId]) {
      orders[orderId] = {
        id: orderId,
        orderDate: row[1],
        status: row[2],
        paymentMethod: row[3],
        paymentId: row[4],
        customerName: row[5],
        customerMobile: row[6],
        customerEmail: row[7],
        deliveryAddress: row[8],
        city: row[9],
        state: row[10],
        deliveryCharge: Number(row[17]) || 0,
        totalAmount: Number(row[18]) || 0,
        deliveryDate: row[19] || '',
        adminComment: row[20] || '',
        lineItems: []
      };
    }
    orders[orderId].lineItems.push({
      productId: row[11],
      productName: row[12],
      weight: row[13],
      price: Number(row[14]) || 0,
      quantity: Number(row[15]) || 0,
      total: Number(row[16]) || 0
    });
  });

  return jsonResponse({ status: 'success', orders: Object.keys(orders).map(function(id) { return orders[id]; }) });
}

function getAdminProducts(token) {
  if (!isAdminSessionValid(token)) {
    return jsonResponse({ status: 'error', message: 'Unauthorized', products: [] });
  }
  return jsonResponse({ status: 'success', products: getProducts() });
}


/**
 * Reads product variants from the Products sheet.
 * Required columns: Item ID, Item, Item Weight, Price.
 * Multiple rows with the same Item ID represent different weight/price options.
 */
function getProducts() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(PRODUCTS_SHEET_NAME);

  if (!sheet || sheet.getLastRow() < 2) {
    return [];
  }

  var rows = sheet.getDataRange().getValues();
  var headers = rows[0].map(function(header) {
    return String(header).trim().toLowerCase();
  });
  var itemIdIndex = headers.indexOf('item id');
  var itemIndex = headers.indexOf('item');
  var weightIndex = headers.indexOf('item weight');
  var priceIndex = headers.indexOf('price');
  var inventoryIndex = headers.indexOf('inventory');

  if ([itemIdIndex, itemIndex, weightIndex, priceIndex].indexOf(-1) !== -1) {
    throw new Error('Products sheet must contain: Item ID, Item, Item Weight, Price');
  }

  return rows.slice(1).map(function(row) {
    return {
      itemId: row[itemIdIndex],
      item: row[itemIndex],
      weight: row[weightIndex],
      price: row[priceIndex],
      inventory: inventoryIndex === -1 || row[inventoryIndex] === '' || row[inventoryIndex] === null
        ? undefined
        : Math.max(0, Number(row[inventoryIndex]) || 0)
    };
  }).filter(function(product) {
    return product.itemId !== '' && product.item && product.weight !== '' && product.price !== '';
  });
}


function getDefaultDeliveryConfig() {
  var settings = getOrderSettings();
  return {
    shopCity: 'Bangalore',
    shopCityAliases: ['Bengaluru'],
    shopState: 'Karnataka',
    buffer: 15,
    zoneCities: [],
    slabs: [
      { maxGrams: 500, label: 'Upto 500 grams', local: 28, withinState: 76, zoneMetro: 82, otherStates: 90 },
      { maxGrams: 1000, label: '501 - 1000 grams', local: 48, withinState: 101, zoneMetro: 137, otherStates: 143 },
      { maxGrams: 1500, label: '1001 - 1500 grams', local: 60, withinState: 130, zoneMetro: 182, otherStates: 228 },
      { maxGrams: 2000, label: '1501 - 2000 grams', local: 87, withinState: 178, zoneMetro: 254, otherStates: 319 },
      { maxGrams: 3000, label: '2001 - 3000 grams', local: 116, withinState: 243, zoneMetro: 355, otherStates: 450 },
      { maxGrams: 4000, label: '3001 - 4000 grams', local: 145, withinState: 298, zoneMetro: 441, otherStates: 560 },
      { maxGrams: 5000, label: '4001 - 5000 grams', local: 174, withinState: 361, zoneMetro: 539, otherStates: 686 }
    ],
    additionalKg: { label: 'Additional 1 kilogram', local: 35, withinState: 60, zoneMetro: 95, otherStates: 120 },
    upiId: settings.upiId,
    orderNotificationEmail: settings.orderNotificationEmail
  };
}


/**
 * Reads Settings and DeliveryConfig sheets. Settings uses Key/Value columns.
 * DeliveryConfig uses Weight Slab, Local, Within State, Zone / Metro, Other States.
 */
function getDeliveryConfig() {
  var config = getDefaultDeliveryConfig();
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var settings = ss.getSheetByName('Settings');
  if (settings && settings.getLastRow() > 1) {
    settings.getDataRange().getValues().slice(1).forEach(function(row) {
      var key = String(row[0] || '').trim();
      var value = String(row[1] || '').trim();
      if (key === 'shopCity' && value) config.shopCity = value;
      if (key === 'shopCityAliases') config.shopCityAliases = value.split(',').map(function(city) { return city.trim(); }).filter(Boolean);
      if (key === 'shopState' && value) config.shopState = value;
      if (key === 'buffer' && value !== '') config.buffer = Number(value) || 0;
      if (key === 'zoneCities') config.zoneCities = value.split(',').map(function(city) { return city.trim(); }).filter(Boolean);
      if (key === 'upiId') config.upiId = value;
      if (key === 'orderNotificationEmail') config.orderNotificationEmail = value;
    });
  }

  var sheet = ss.getSheetByName(DELIVERY_CONFIG_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return config;
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0].map(function(header) { return String(header).trim().toLowerCase(); });
  var indexes = {
    label: headers.indexOf('weight slab'),
    local: headers.indexOf('local'),
    withinState: headers.indexOf('within state'),
    zoneMetro: headers.indexOf('zone / metro'),
    otherStates: headers.indexOf('other states')
  };
  if (Object.keys(indexes).some(function(key) { return indexes[key] === -1; })) return config;

  var slabRows = rows.slice(1).filter(function(row) { return row[indexes.label] && row[indexes.local] !== ''; });
  var standardSlabs = slabRows.slice(0, 7);
  config.slabs = standardSlabs.map(function(row, index) {
    return {
      maxGrams: config.slabs[index] ? config.slabs[index].maxGrams : undefined,
      label: row[indexes.label],
      local: Number(row[indexes.local]) || 0,
      withinState: Number(row[indexes.withinState]) || 0,
      zoneMetro: Number(row[indexes.zoneMetro]) || 0,
      otherStates: Number(row[indexes.otherStates]) || 0
    };
  });
  var additional = slabRows[7];
  if (additional) {
    config.additionalKg = {
      label: additional[indexes.label],
      local: Number(additional[indexes.local]) || 0,
      withinState: Number(additional[indexes.withinState]) || 0,
      zoneMetro: Number(additional[indexes.zoneMetro]) || 0,
      otherStates: Number(additional[indexes.otherStates]) || 0
    };
  }
  return config;
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


function getProductsSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(PRODUCTS_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(PRODUCTS_SHEET_NAME);
    sheet.appendRow(['Item ID', 'Item', 'Item Weight', 'Price']);
  }

  return sheet;
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
