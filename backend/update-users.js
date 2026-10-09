const db = require('./src/db');

async function main() {
    await db.query('UPDATE usuarios SET nome = $1, email = $2 WHERE id = $3', [
        'Juliana Batista',
        'juliana.batista@sgpi.corp',
        'USR-SUPER-01'
    ]);
    await db.query('UPDATE usuarios SET email = $1 WHERE id = $2', [
        'flipe.messias@sgpi.corp',
        'USR-ANA-FM'
    ]);
    const res = await db.query('SELECT * FROM usuarios');
    console.log('Usuarios atualizados:', res.rows);
}

main().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
