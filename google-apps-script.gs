// 1. Create a Google Sheet and open Extensions > Apps Script.
// 2. Paste this code. Deploy > New deployment > Web app.
// 3. Execute as: Me; Who has access: Anyone.
// 4. Paste the deployment /exec URL into Vercel environment variable RSVP_WEBHOOK_URL.
// IMPORTANT: The URL is a secret. Anyone who discovers it may submit rows.
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var name = String(data.name || '').trim();
    var attendance = String(data.attendance || '');
    var guests = Number(data.guests);
    if (!name || name.length > 120 || ['yes','no'].indexOf(attendance) === -1 || !Number.isInteger(guests) || guests < 0 || guests > 20 || (attendance === 'yes' && guests < 1) || (attendance === 'no' && guests !== 0)) throw new Error('Invalid values');
    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('RSVP');
      if (!sheet) {sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('RSVP');sheet.appendRow(['Дата','Имя','Ответ','Гостей']);}
      // Prevent spreadsheet formula injection
      if (/^[=+@\-]/.test(name)) name = "'" + name;
      sheet.appendRow([new Date(),name,attendance === 'yes' ? 'Придёт' : 'Не придёт',guests]);
    } finally {lock.releaseLock();}
    return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {return ContentService.createTextOutput(JSON.stringify({ok:false})).setMimeType(ContentService.MimeType.JSON);}
}
