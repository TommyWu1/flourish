import { expandNode } from '../vertex/expandNode.js';

export default async function expandRoute(req, res) {
  const { nodeId, context } = req.body || {};
  if (!nodeId || !context) {
    return res.status(400).json({ error: 'nodeId and context are required' });
  }

  try {
    const result = await expandNode({ nodeId, context });
    res.json(result);
  } catch (err) {
    console.error('expand failed:', err);
    res.status(500).json({ error: err.message || 'expand failed' });
  }
}
