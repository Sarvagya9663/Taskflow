const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { getDb } = require('../db/database');
const { authenticate, requireProjectAccess, requireProjectAdmin } = require('../middleware/auth');

// GET /api/projects
router.get('/', authenticate, (req, res) => {
  const db = getDb();
  const projects = db.prepare(`
    SELECT p.*, u.name as owner_name, u.avatar as owner_avatar,
      pm.role as my_role,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') as done_count,
      (SELECT COUNT(*) FROM project_members pm2 WHERE pm2.project_id = p.id) as member_count
    FROM projects p
    JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
    JOIN users u ON u.id = p.owner_id
    ORDER BY p.created_at DESC
  `).all(req.user.id);
  res.json(projects);
});

// POST /api/projects
router.post('/', authenticate, [
  body('name').trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { name, description = '', color = '#6366f1' } = req.body;
  const db = getDb();
  const r = db.prepare('INSERT INTO projects (name, description, color, owner_id) VALUES (?, ?, ?, ?)').run(name, description, color, req.user.id);
  db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(r.lastInsertRowid, req.user.id, 'admin');
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(r.lastInsertRowid);
  res.status(201).json(project);
});

// GET /api/projects/:id
router.get('/:id', authenticate, requireProjectAccess, (req, res) => {
  const db = getDb();
  const project = db.prepare(`
    SELECT p.*, u.name as owner_name,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') as done_count
    FROM projects p JOIN users u ON u.id = p.owner_id WHERE p.id = ?
  `).get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });
  const members = db.prepare(`
    SELECT u.id, u.name, u.email, u.avatar, pm.role, pm.joined_at
    FROM project_members pm JOIN users u ON u.id = pm.user_id WHERE pm.project_id = ?
  `).all(req.params.id);
  res.json({ ...project, members, my_role: req.projectRole });
});

// PUT /api/projects/:id
router.put('/:id', authenticate, requireProjectAdmin, [
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('status').optional().isIn(['active', 'archived', 'completed']),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/),
], (req, res) => {
  const db = getDb();
  const p = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  const { name = p.name, description = p.description, color = p.color, status = p.status } = req.body;
  db.prepare('UPDATE projects SET name=?, description=?, color=?, status=? WHERE id=?').run(name, description, color, status, req.params.id);
  res.json(db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id));
});

// DELETE /api/projects/:id
router.delete('/:id', authenticate, requireProjectAdmin, (req, res) => {
  getDb().prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

// POST /api/projects/:id/members
router.post('/:id/members', authenticate, requireProjectAdmin, [
  body('userId').isInt(),
  body('role').optional().isIn(['admin', 'member']),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { userId, role = 'member' } = req.body;
  const db = getDb();
  const user = db.prepare('SELECT id, name, email, avatar FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  try {
    db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(req.params.id, userId, role);
    res.status(201).json({ ...user, role });
  } catch {
    res.status(409).json({ error: 'Already a member' });
  }
});

// DELETE /api/projects/:id/members/:userId
router.delete('/:id/members/:userId', authenticate, requireProjectAdmin, (req, res) => {
  const db = getDb();
  const project = db.prepare('SELECT owner_id FROM projects WHERE id = ?').get(req.params.id);
  if (parseInt(req.params.userId) === project.owner_id) return res.status(400).json({ error: 'Cannot remove owner' });
  db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?').run(req.params.id, req.params.userId);
  res.json({ message: 'Removed' });
});

module.exports = router;
