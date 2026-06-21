const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres:jonas1385@localhost:5432/petcare"
  });
  await client.connect();
  try {
    const res = await client.query('SELECT * FROM petshops');
    console.log("PETSHOPS ROWS:");
    console.log(JSON.stringify(res.rows, null, 2));
    
    const users = await client.query('SELECT * FROM "user"');
    console.log("USERS ROWS:");
    console.log(JSON.stringify(users.rows.map(u => ({ id: u.id, name: u.name, role: u.role })), null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
