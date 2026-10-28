// Paste this file into Extensions > Apps Script in the RSVP spreadsheet.
// Deploy as a Web app: Execute as Me; Who has access: Anyone.

function jsonOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function guestSheet() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName('Guests');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('Guests');
    sheet.appendRow(['Код браузера','Имя','Открыто','Дата открытия','Ответ','Гостей','Дата ответа']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function rsvpSheet() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName('RSVP');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('RSVP');
    sheet.appendRow(['Дата','Имя','Ответ','Гостей']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function findGuestRow(sheet, token) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  var codes = sheet.getRange(2,1,lastRow - 1,1).getDisplayValues();
  for (var i = 0; i < codes.length; i++) if (String(codes[i][0]) === token) return i + 2;
  return 0;
}

function doGet(e) {
  try {
    var token = String((e && e.parameter && e.parameter.token) || '').trim();
    if (!/^[A-Za-z0-9_-]{12,100}$/.test(token)) throw new Error('Invalid token');
    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var sheet = guestSheet();
      var row = findGuestRow(sheet,token);
      if (!row) return jsonOutput({ok:false,error:'not_found'});
      var values = sheet.getRange(row,1,1,7).getValues()[0];
      var name = String(values[1] || '').trim();
      if (!name) throw new Error('Guest has no name');
      sheet.getRange(row,3).setValue('Да');
      if (!values[3]) sheet.getRange(row,4).setValue(new Date());
      var attendance = String(values[4] || '');
      return jsonOutput({ok:true,guest:{name:name,attendance:['yes','no'].indexOf(attendance) >= 0 ? attendance : null,guests:values[5] === '' ? null : Number(values[5])}});
    } finally {lock.releaseLock();}
  } catch (err) {return jsonOutput({ok:false,error:'invalid_request'});}
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var name = String(data.name || '').trim();
    var token = String(data.guestToken || '').trim();
    if (String(data.action || '') === 'register') {
      if (!/^[A-Za-z0-9_-]{12,100}$/.test(token) || !name || name.length > 120) throw new Error('Invalid registration');
      if (/^[=+@\-]/.test(name)) name = "'" + name;
      var registerLock = LockService.getScriptLock();
      registerLock.waitLock(10000);
      try {
        var registerSheet = guestSheet();
        var existingRow = findGuestRow(registerSheet,token);
        if (existingRow) {
          if (name && !String(registerSheet.getRange(existingRow,2).getValue() || '').trim()) registerSheet.getRange(existingRow,2).setValue(name);
          var existing = registerSheet.getRange(existingRow,1,1,7).getValues()[0];
          return jsonOutput({ok:true,guest:{name:String(existing[1] || ''),attendance:['yes','no'].indexOf(String(existing[4] || '')) >= 0 ? String(existing[4]) : null,guests:existing[5] === '' ? null : Number(existing[5])}});
        }
        registerSheet.appendRow([token,name,'Да',new Date(),'','','']);
      } finally {registerLock.releaseLock();}
      return jsonOutput({ok:true,guest:{name:name,attendance:null,guests:null}});
    }
    var attendance = String(data.attendance || '');
    var guests = Number(data.guests);
    if (!name || name.length > 120 || ['yes','no'].indexOf(attendance) === -1 || !Number.isInteger(guests) || guests < 0 || guests > 20 || (attendance === 'yes' && guests < 1) || (attendance === 'no' && guests !== 0)) throw new Error('Invalid values');
    if (token && !/^[A-Za-z0-9_-]{12,100}$/.test(token)) throw new Error('Invalid token');
    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      if (token) {
        var sheet = guestSheet();
        var row = findGuestRow(sheet,token);
        if (!row) throw new Error('Guest not found');
        var registeredName = String(sheet.getRange(row,2).getValue() || '').trim();
        if (!registeredName) throw new Error('Guest has no name');
        var openedAt = sheet.getRange(row,4).getValue() || new Date();
        sheet.getRange(row,3,1,5).setValues([['Да',openedAt,attendance,guests,new Date()]]);
      } else {
        if (/^[=+@\-]/.test(name)) name = "'" + name;
        rsvpSheet().appendRow([new Date(),name,attendance === 'yes' ? 'Придёт' : 'Не придёт',guests]);
      }
    } finally {lock.releaseLock();}
    return jsonOutput({ok:true});
  } catch (err) {return jsonOutput({ok:false,error:'save_failed'});}
}

function prepareGuestSheet() {
  guestSheet();
}
