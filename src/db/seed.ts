import { db, initDbSchema } from './index';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Initialisation de la base de données Turso / SQLite...');

  await initDbSchema();
  console.log('Tables créées avec succès.');

  // 2. Ajout/Mise à jour des comptes dev (admin/admin et user/user)
  const adminHash = bcrypt.hashSync('admin', 10);
  const adminRes = await db.execute({ sql: 'SELECT * FROM users WHERE username = ?', args: ['admin'] });
  if (adminRes.rows.length > 0) {
    await db.execute({ sql: 'UPDATE users SET password_hash = ?, role = ? WHERE username = ?', args: [adminHash, 'admin', 'admin'] });
    console.log('Compte admin mis à jour (admin / admin)');
  } else {
    await db.execute({
      sql: `INSERT INTO users (id, username, password_hash, role, tags) VALUES (?, ?, ?, ?, ?)`,
      args: ['admin_dev_id', 'admin', adminHash, 'admin', JSON.stringify(['milsim', 'dev'])]
    });
    console.log('Compte admin créé (admin / admin)');
  }

  const userHash = bcrypt.hashSync('user', 10);
  const userRes = await db.execute({ sql: 'SELECT * FROM users WHERE username = ?', args: ['user'] });
  if (userRes.rows.length > 0) {
    await db.execute({ sql: 'UPDATE users SET password_hash = ?, role = ? WHERE username = ?', args: [userHash, 'user', 'user'] });
    console.log('Compte user mis à jour (user / user)');
  } else {
    await db.execute({
      sql: `INSERT INTO users (id, username, password_hash, role, tags) VALUES (?, ?, ?, ?, ?)`,
      args: ['user_dev_id', 'user', userHash, 'user', JSON.stringify(['dev'])]
    });
    console.log('Compte user créé (user / user)');
  }

  // 3. Ajout des autres membres de test si absents
  const testRes = await db.execute({ sql: 'SELECT * FROM users WHERE username = ?', args: ['milsim_test'] });
  if (testRes.rows.length === 0) {
    const userId = 'test_user_id';
    const plainPassword = 'password123';
    const passwordHash = bcrypt.hashSync(plainPassword, 10);
    const userTags = JSON.stringify(['milsim']);

    await db.execute({
      sql: `INSERT INTO users (id, username, password_hash, role, tags) VALUES (?, ?, ?, ?, ?)`,
      args: [userId, 'milsim_test', passwordHash, 'user', userTags]
    });
    console.log('Compte de test Milsim créé (milsim_test / password123)');
  }

  console.log('Base de données initialisée.');
}

seed().catch(err => console.error('Seed error:', err));
