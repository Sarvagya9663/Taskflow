const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { getDb } = require('../db/database');
const { authenticate, requireProjectAccess } = require('../middleware/auth');

// GET /api/projects/:projectId/tasks
router.get('/projects/:projectId/tasks', authenticate, requireProjectAccess, (req, res) => {
  const db = getDb();
  const { status, priority, assignee } = req.query;
  let sql = `SELECT t.*, u1.name as assignee_name, u1.avatar as assignee_avatar, u1.email as assignee_email,
    u2.name as reporter_name, u2.avatar as reporter_avatar
    FROM tasks t LEFT JOIN users u1 ON u1.id = t.assignee_id LEFT JOIN users u2 ON u2.id = t.reporter_id
    WHERE t.project_id = ?`;
  const params = [req.params.projectId];
  if (status) { sql += ' AND t.status = ?'; params.push(status); }
  if (priority) { sql += ' AND t.priority = ?'; params.push(priority); }
  if (assignee) { sql += ' AND t.assignee_id = ?'; params.push(assignee); }
  sql += " ORDER BY CASE t.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, t.created_at DESC";
  res.json(db.prepare(sql).all(...params));
});

// POST /api/projects/:projectId/tasks
router.post('/projects/:projectId/tasks', authenticate, requireProjectAccess, [
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim(),
  body('status').optional().isIn(['todo', 'in_progress', 'review', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('assigneeId').optional().isInt(),
  body('dueDate').optional().isISO8601(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { title, description = '', status = 'todo', priority = 'medium', assigneeId, dueDate } = req.body;
  const db = getDb();
  if (assigneeId) {
    const member = db.prepare('SELECT id FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.projectId, assigneeId);
    if (!member) return res.status(400).json({ error: 'Assignee must be a project member' });
  }
  const r = db.prepare(`INSERT INTO tasks (title, description, status, priority, project_id, assignee_id, reporter_id, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(title, description, status, priority, req.params.projectId, assigneeId || null, req.user.id, dueDate || null);
  const task = db.prepare(`SELECT t.*, u1.name as assignee_name, u1.avatar as assignee_avatar, u2.name as reporter_name
    FROM tasks t LEFT JOIN users u1 ON u1.id = t.assignee_id LEFT JOIN users u2 ON u2.id = t.reporter_id WHERE t.id = ?`).get(r.lastInsertRowid);
  res.status(201).json(task);
});

// GET /api/tasks/:id
router.get('/tasks/:id', authenticate, (req, res) => {
  const db = getDb();
  const task = db.prepare(`SELECT t.*, u1.name as assignee_name, u1.avatar as assignee_avatar, u1.email as assignee_email,
    u2.name as reporter_name, u2.avatar as reporter_avatar, p.name as project_name, p.color as project_color
    FROM tasks t LEFT JOIN users u1 ON u1.id = t.assignee_id LEFT JOIN users u2 ON u2.id = t.reporter_id
    LEFT JOIN projects p ON p.id = t.project_id WHERE t.id = ?`).get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const member = db.prepare('SELECT id FROM project_members WHERE project_id = ? AND user_id = ?').get(task.project_id, req.user.id);
  if (!member && req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
  const comments = db.prepare(`SELECT c.*, u.name as user_name, u.avatar as user_avatar
    FROM comments c JOIN users u ON u.id = c.user_id WHERE c.task_id = ? ORDER BY c.created_at ASC`).all(req.params.id);
  res.json({ ...task, comments });
});

// PUT /api/tasks/:id
router.put('/tasks/:id', authenticate, [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('status').optional().isIn(['todo', 'in_progress', 'review', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
], (req, res) => {
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const member = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(task.project_id, req.user.id);
  if (!member && req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const title = req.body.title !== undefined ? req.body.title : task.title;
  const description = req.body.description !== undefined ? req.body.description : task.description;
  const status = req.body.status || task.status;
  const priority = req.body.priority || task.priority;
  const assignee_id = req.body.assignee_id !== undefined ? req.body.assignee_id : (req.body.assigneeId !== undefined ? req.body.assigneeId : task.assignee_id);
  const due_date = req.body.due_date !== undefined ? req.body.due_date : (req.body.dueDate !== undefined ? req.body.dueDate : task.due_date);
  const now = new Date().toISOString();
  db.prepare('UPDATE tasks SET title=?, description=?, status=?, priority=?, assignee_id=?, due_date=?, updated_at=? WHERE id=?')
    .run(title, description, status, priority, assignee_id || null, due_date || null, now, req.params.id);
  const updated = db.prepare(`SELECT t.*, u1.name as assignee_name, u1.avatar as assignee_avatar, u2.name as reporter_name
    FROM tasks t LEFT JOIN users u1 ON u1.id = t.assignee_id LEFT JOIN users u2 ON u2.id = t.reporter_id WHERE t.id = ?`).get(req.params.id);
  res.json(updated);
});

// DELETE /api/tasks/:id
router.delete('/tasks/:id', authenticate, (req, res) => {
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const member = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(task.project_id, req.user.id);
  const canDelete = req.user.role === 'admin' || task.reporter_id === req.user.id || (member && member.role === 'admin');
  if (!canDelete) return res.status(403).json({ error: 'Permission denied' });
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

// POST /api/tasks/:id/comments
router.post('/tasks/:id/comments', authenticate, [body('content').trim().isLength({ min: 1, max: 1000 })], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const db = getDb();
  const task = db.prepare('SELECT project_id FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const member = db.prepare('SELECT id FROM project_members WHERE project_id = ? AND user_id = ?').get(task.project_id, req.user.id);
  if (!member && req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
  const r = db.prepare('INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)').run(req.params.id, req.user.id, req.body.content);
  const comment = db.prepare('SELECT c.*, u.name as user_name, u.avatar as user_avatar FROM comments c JOIN users u ON u.id = c.user_id WHERE c.id = ?').get(r.lastInsertRowid);
  res.status(201).json(comment);
});

// GET /api/dashboard
router.get('/dashboard', authenticate, (req, res) => {
  const db = getDb();
  const myTasks = db.prepare(`
    SELECT t.*, p.name as project_name, p.color as project_color
    FROM tasks t JOIN projects p ON p.id = t.project_id
    JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
    WHERE t.assignee_id = ? ORDER BY t.due_date ASC, t.priority ASC
  `).all(req.user.id, req.user.id);
  const now = new Date().toISOString().split('T')[0];
  const overdue = myTasks.filter(t => t.due_date && t.due_date < now && t.status !== 'done');
  const byStatus = {
    todo: myTasks.filter(t => t.status === 'todo').length,
    in_progress: myTasks.filter(t => t.status === 'in_progress').length,
    review: myTasks.filter(t => t.status === 'review').length,
    done: myTasks.filter(t => t.status === 'done').length,
  };
  const recentActivity = db.prepare(`
    SELECT t.id, t.title, t.status, t.updated_at, p.name as project_name, p.color as project_color
    FROM tasks t JOIN projects p ON p.id = t.project_id
    JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
    ORDER BY t.updated_at DESC LIMIT 10
  `).all(req.user.id);
  res.json({ myTasks, overdue, byStatus, recentActivity, totalTasks: myTasks.length });
});

module.exports = router;
