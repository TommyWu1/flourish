import { diagnose } from '../vertex/diagnose.js';

export default async function diagnoseRoute(req, res) {
  const {
    topic,
    nodeId,
    nodeLabel,
    question,
    answer,
    parentId,
    existingNodeIds,
  } = req.body || {};

  if (!topic || !nodeId || !nodeLabel || !question) {
    return res.status(400).json({
      error: 'topic, nodeId, nodeLabel, and question are required',
    });
  }

  try {
    const result = await diagnose({
      topic,
      nodeId,
      nodeLabel,
      question,
      answer,
      parentId,
      existingNodeIds,
    });
    res.json(result);
  } catch (err) {
    console.error('diagnose failed:', err);
    res.status(500).json({ error: err.message || 'diagnose failed' });
  }
}
