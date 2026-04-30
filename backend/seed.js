const bcrypt = require('bcryptjs');
const { getDb } = require('./db/database');

async function seed() {
  const db = getDb();

  const adminHash = await bcrypt.hash('admin123', 10);
  const memberHash = await bcrypt.hash('member123', 10);

  const admin = db.prepare('INSERT INTO users (name, email, password, role, avatar) VALUES (?, ?, ?, ?, ?)').run(
    'Alex Admin', 'admin@demo.com', adminHash, 'admin',
    'https://ui-avatars.com/api/?name=Alex+Admin&background=6366f1&color=fff&bold=true'
  );
  const member1 = db.prepare('INSERT INTO users (name, email, password, role, avatar) VALUES (?, ?, ?, ?, ?)').run(
    'Sam Member', 'member@demo.com', memberHash, 'member',
    'https://ui-avatars.com/api/?name=Sam+Member&background=8b5cf6&color=fff&bold=true'
  );
  const member2 = db.prepare('INSERT INTO users (name, email, password, role, avatar) VALUES (?, ?, ?, ?, ?)').run(
    'Jordan Lee', 'jordan@demo.com', await bcrypt.hash('demo123', 10), 'member',
    'https://ui-avatars.com/api/?name=Jordan+Lee&background=ec4899&color=fff&bold=true'
  );

  const p1 = db.prepare('INSERT INTO projects (name, description, color, owner_id) VALUES (?, ?, ?, ?)').run(
    'Website Redesign', 'Complete overhaul with new design system', '#6366f1', admin.lastInsertRowid
  );
  const p2 = db.prepare('INSERT INTO projects (name, description, color, owner_id) VALUES (?, ?, ?, ?)').run(
    'Mobile App v2', 'Q2 feature release: auth, notifications, dark mode', '#10b981', admin.lastInsertRowid
  );

  const am = db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)');
  [p1, p2].forEach(p => {
    am.run(p.lastInsertRowid, admin.lastInsertRowid, 'admin');
    am.run(p.lastInsertRowid, member1.lastInsertRowid, 'member');
  });
  am.run(p1.lastInsertRowid, member2.lastInsertRowid, 'member');

  const today = new Date();
  const d = (n) => new Date(today.getTime() + n * 86400000).toISOString().split('T')[0];

  const it = db.prepare('INSERT INTO tasks (title, description, status, priority, project_id, assignee_id, reporter_id, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

  const t1 = it.run('Design new homepage layout', 'Wireframes and mockups for the new homepage', 'done', 'high', p1.lastInsertRowid, member2.lastInsertRowid, admin.lastInsertRowid, d(-5));
  const t2 = it.run('Implement design system', 'Build reusable component library with Tailwind', 'in_progress', 'urgent', p1.lastInsertRowid, member1.lastInsertRowid, admin.lastInsertRowid, d(3));
  const t3 = it.run('Write About page content', 'Company story and team profiles', 'todo', 'medium', p1.lastInsertRowid, member2.lastInsertRowid, admin.lastInsertRowid, d(7));
  const t4 = it.run('SEO audit and fixes', 'Improve meta tags and page speed score', 'review', 'medium', p1.lastInsertRowid, member1.lastInsertRowid, admin.lastInsertRowid, d(-1));
  it.run('Set up Google Analytics', null, 'todo', 'low', p1.lastInsertRowid, null, admin.lastInsertRowid, d(14));

  const t6 = it.run('Push notification system', 'FCM integration for iOS and Android', 'in_progress', 'urgent', p2.lastInsertRowid, member1.lastInsertRowid, admin.lastInsertRowid, d(2));
  it.run('Biometric authentication', 'Face ID and fingerprint login support', 'todo', 'high', p2.lastInsertRowid, member1.lastInsertRowid, admin.lastInsertRowid, d(5));
  it.run('Dark mode support', 'Full dark mode implementation across all screens', 'review', 'medium', p2.lastInsertRowid, admin.lastInsertRowid, admin.lastInsertRowid, d(1));
  it.run('Performance optimization', 'Reduce app startup time by 40%', 'done', 'high', p2.lastInsertRowid, admin.lastInsertRowid, admin.lastInsertRowid, d(-3));

  const ic = db.prepare('INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)');
  ic.run(t2.lastInsertRowid, admin.lastInsertRowid, 'Please use Tailwind for the component library — it aligns with our existing stack.');
  ic.run(t2.lastInsertRowid, member1.lastInsertRowid, 'On it! Starting with Button, Input, and Card components.');
  ic.run(t6.lastInsertRowid, member1.lastInsertRowid, 'FCM credentials configured. Working on the notification payload now.');
  ic.run(t4.lastInsertRowid, member2.lastInsertRowid, 'Lighthouse score is currently 67. Target is 90+.');

  console.log('✅ Demo data seeded!');
  console.log('   admin@demo.com / admin123');
  console.log('   member@demo.com / member123');
}

module.exports = seed;

// Allow direct execution: node seed.js
if (require.main === module) {
  const { initDb } = require('./db/database');
  initDb().then(seed).then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
