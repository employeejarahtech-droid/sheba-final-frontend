import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';

const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
// Try probable paths
const paths = [
    path.join(appData, 'HMS POS', 'app.db'),
    path.join(appData, 'hms-frontend', 'app.db'),
    path.join('d:\\pos-frontend', 'app.db')
];

let db = null;
let dbPath = '';

for (const p of paths) {
    console.log(`Checking path: ${p}`);
    try {
        const testDb = new Database(p, { fileMustExist: true });
        db = testDb;
        dbPath = p;
        console.log(`Found database at: ${p}`);
        break;
    } catch (e) {
        console.log(`Database not found at ${p}`);
    }
}

if (db) {
    try {
        const count = db.prepare('SELECT COUNT(*) as c FROM purchase_orders').get();
        console.log('Purchase Orders Count:', count);

        const rows = db.prepare('SELECT * FROM purchase_orders ORDER BY id DESC LIMIT 5').all();
        console.log('Recent Purchase Orders:', JSON.stringify(rows, null, 2));

        const seq = db.prepare("SELECT * FROM sqlite_sequence WHERE name = 'purchase_orders'").get();
        console.log('Sequence:', seq);
    } catch (err) {
        console.error('Error querying database:', err);
    }
} else {
    console.error('Could not find database file.');
}
