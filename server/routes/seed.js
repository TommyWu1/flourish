function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function seedRoute(req, res) {
  const topic = String(req.body?.topic || '').trim();
  if (!topic) {
    return res.status(400).json({ error: 'topic is required' });
  }

  const rootId = `root-${slugify(topic) || 'topic'}`;

  res.json({
    root: {
      id: rootId,
      label: topic,
      parentId: null,
      summary: `A learning tree for ${topic}.`,
      description: `${topic} is the root of this learning tree. Click any growing branch to test your understanding — the tree will adapt to what you actually need to learn.`,
      expandable: true,
      metadata: {
        role: 'Root topic',
        status: 'active',
      },
    },
    nodes: [],
  });
}
