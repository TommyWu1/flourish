import { ai } from './client.js';
import { MODEL_FLASH, structuredConfig } from './models.js';

const diagnosisSchema = {
  type: 'OBJECT',
  properties: {
    understanding_level: {
      type: 'STRING',
      enum: ['correct', 'partial', 'wrong'],
    },
    misconception: { type: 'STRING' },
    missing_prerequisite: { type: 'STRING', nullable: true },
    tree_action: {
      type: 'STRING',
      enum: ['continue', 'insert_prerequisite_node'],
    },
    new_node: {
      type: 'OBJECT',
      nullable: true,
      properties: {
        title: { type: 'STRING' },
        insert_before: { type: 'STRING' },
        question: { type: 'STRING' },
        summary: { type: 'STRING' },
        description: { type: 'STRING' },
      },
      required: ['title', 'insert_before', 'question', 'summary', 'description'],
    },
    mascot_response: { type: 'STRING' },
  },
  required: [
    'understanding_level',
    'misconception',
    'tree_action',
    'mascot_response',
  ],
};

export async function diagnose({
  topic,
  nodeId,
  nodeLabel,
  question,
  answer,
  parentId,
  existingNodeIds,
}) {
  const trimmedAnswer = String(answer || '').trim();
  const allowedIds = Array.isArray(existingNodeIds) ? existingNodeIds : [nodeId];

  const prompt = `You are a diagnostic learning agent — NOT a tutor.
Your job: read a learner's answer, identify any misconception, and decide whether the tree must grow a missing prerequisite node before they continue.

Topic of this learning tree: ${topic}
Concept being tested: ${nodeLabel}
Diagnostic question asked: ${question}
Learner's answer: ${trimmedAnswer ? JSON.stringify(trimmedAnswer) : '(empty)'}

Rules:
- Mascot voice: <40 words, action-oriented, no long explanations.
- If understanding_level is "correct", set tree_action="continue", new_node=null. Mascot should celebrate briefly (e.g. "Nice — this branch is strong.").
- If understanding_level is "partial" or "wrong" but a prerequisite isn't *required* to proceed, set tree_action="continue", new_node=null. Mascot gently corrects.
- If a critical prerequisite IS missing, set tree_action="insert_prerequisite_node" and fill new_node:
    - new_node.title: the prerequisite concept name (≤6 words)
    - new_node.insert_before: must be one of: ${allowedIds.join(', ')}
    - new_node.question: ONE diagnostic question testing understanding of the prerequisite
    - new_node.summary: ≤25 words for hover panel
    - new_node.description: ≤80 words explaining the prerequisite
    - mascot_response: action-oriented, like "Something's missing — let's grow that first."
- Empty answers, "idk", "I don't know", or non-answers count as wrong with a missing prerequisite when one is plausible.

Return JSON matching the schema.`;

  const response = await ai.models.generateContent({
    model: MODEL_FLASH,
    contents: prompt,
    config: structuredConfig(diagnosisSchema),
  });

  const json = JSON.parse(response.text || '{}');

  if (json.tree_action === 'insert_prerequisite_node' && json.new_node) {
    if (!allowedIds.includes(json.new_node.insert_before)) {
      json.new_node.insert_before = nodeId;
    }
    json.new_node.id = `${nodeId}--prereq-${Date.now().toString(36)}`;
  } else {
    json.new_node = null;
  }

  return json;
}
