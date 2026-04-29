import { ai } from './client.js';
import {
  MODEL_PRO,
  MODEL_FLASH,
  groundedConfig,
  structuredConfig,
} from './models.js';

const expansionSchema = {
  type: 'OBJECT',
  properties: {
    nodes: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          label: { type: 'STRING' },
          summary: { type: 'STRING' },
          description: { type: 'STRING' },
          question: { type: 'STRING' },
        },
        required: ['label', 'summary', 'description', 'question'],
      },
    },
  },
  required: ['nodes'],
};

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function research(topic, focus) {
  const prompt = `You are a learning architect. Research the 3 most important concepts a complete beginner needs to understand BEFORE they can learn ${focus} (within the broader topic of ${topic}). For each concept, write a one-sentence justification grounded in pedagogy. Return as a numbered list — concept name followed by justification.`;

  const response = await ai.models.generateContent({
    model: MODEL_PRO,
    contents: prompt,
    config: groundedConfig,
  });
  return response.text || '';
}

async function structure({ topic, focus, researchText, existingChildren, depth }) {
  const avoid = existingChildren.length
    ? `\nAvoid duplicating any of these existing siblings: ${existingChildren.join(', ')}.`
    : '';

  const source = researchText
    ? `\n\nResearch notes:\n${researchText}`
    : '';

  const prompt = `You are designing 3 nodes in a diagnostic learning tree.

Topic: ${topic}
Current focus: ${focus}
Depth in tree: ${depth}${avoid}${source}

Produce exactly 3 nodes. For each node, generate:
- "label": a short topic name (≤6 words)
- "summary": ≤25 words, shown in a hover panel
- "description": ≤80 words, shown in a detail modal — explains the concept clearly
- "question": ONE diagnostic question that tests *understanding*, not recall. ≤2 sentences. The learner should have to apply or explain, not just name something.

Return JSON matching the schema.`;

  const response = await ai.models.generateContent({
    model: MODEL_FLASH,
    contents: prompt,
    config: structuredConfig(expansionSchema),
  });
  const json = JSON.parse(response.text || '{"nodes":[]}');
  return Array.isArray(json.nodes) ? json.nodes : [];
}

export async function expandNode({ nodeId, context }) {
  const topic = context.rootTopic || context.nodeLabel || 'the topic';
  const focus = context.nodeLabel || topic;
  const depth = Number(context.depth || 0);
  const existingChildren = Array.isArray(context.existingChildren)
    ? context.existingChildren
    : [];

  let researchText = '';
  if (depth === 0) {
    try {
      researchText = await research(topic, focus);
    } catch (err) {
      console.warn('research call failed, falling back to flash-only:', err.message);
    }
  }

  const rawNodes = await structure({
    topic,
    focus,
    researchText,
    existingChildren,
    depth,
  });

  const seenIds = new Set();
  const nodes = rawNodes.slice(0, 3).map((raw, index) => {
    const baseId = slugify(raw.label || `node-${index}`);
    let id = `${nodeId}--${baseId}`;
    let suffix = 1;
    while (seenIds.has(id)) {
      id = `${nodeId}--${baseId}-${suffix++}`;
    }
    seenIds.add(id);

    return {
      id,
      label: String(raw.label || `Concept ${index + 1}`),
      parentId: nodeId,
      summary: String(raw.summary || ''),
      description: String(raw.description || raw.summary || ''),
      expandable: true,
      metadata: {
        question: String(raw.question || ''),
        depth: depth + 1,
        parentTopic: focus,
      },
    };
  });

  return {
    parentId: nodeId,
    parentPatch: { expandable: false },
    nodes,
  };
}
