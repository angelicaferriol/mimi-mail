const http = require('http');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'mimi_mail.db');
const db = new Database(dbPath);

// Initialize schema
const schemaPath = path.join(__dirname, 'schema.sql');
if (fs.existsSync(schemaPath)) {
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
}

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { action, sql, params } = JSON.parse(body);
        let result;
        
        if (action === 'get') {
          result = db.prepare(sql).get(...(params || []));
        } else if (action === 'all') {
          result = db.prepare(sql).all(...(params || []));
        } else if (action === 'run') {
          const runRes = db.prepare(sql).run(...(params || []));
          result = {
            changes: runRes.changes,
            lastInsertRowid: Number(runRes.lastInsertRowid),
          };
        } else if (action === 'exec') {
          db.exec(sql);
          result = { success: true };
        }
        
        res.writeHead(200);
        res.end(JSON.stringify({ result }));
      } catch (err) {
        console.error('[DB BRIDGE ERROR] Query failed:', err.message);
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(3002, '127.0.0.1', () => {
  console.log('[DB BRIDGE] Local database bridge listening on port 3002');
});
