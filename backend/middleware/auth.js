const jwt = require('jsonwebtoken');
const { getDb } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'taskflow-super-secret-key-change-in-prod';

const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const db = getDb();
    const user = db.prepare('SELECT id, name, email, role, avatar FROM users WHERE id = ?').get(payload.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireProjectAccess = (req, res, next) => {
  const projectId = req.params.projectId || req.params.id;
  const db = getDb();
  const member = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(projectId, req.user.id);
  if (!member && req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
  req.projectRole = member ? member.role : 'admin';
  next();
};

const requireProjectAdmin = (req, res, next) => {
  const projectId = req.params.projectId || req.params.id;
  const db = getDb();
  const project = db.prepare('SELECT owner_id FROM projects WHERE id = ?').get(projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const isOwner = project.owner_id === req.user.id;
  const isGlobal = req.user.role === 'admin';
  const isProjAdmin = db.prepare("SELECT role FROM project_members WHERE project_id=? AND user_id=? AND role='admin'").get(projectId, req.user.id);
  if (!isOwner && !isGlobal && !isProjAdmin) return res.status(403).json({ error: 'Project admin required' });
  next();
};

module.exports = { authenticate, requireProjectAccess, requireProjectAdmin, JWT_SECRET };
