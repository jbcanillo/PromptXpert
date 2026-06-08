function analyzePrompt(text) {
  const lines = text.split('\n').filter(l => l.trim());
  const wordCount = text.split(/\s+/).filter(w => w).length;
  const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim()).length;
  const hasGoal = /goal|objective|aim|purpose|i want|i need/i.test(text);
  const hasContext = /context|background|situation|scenario|as a|you are/i.test(text);
  const hasFormat = /format|output|response|result|json|list|table|csv|markdown|html/i.test(text);
  const hasConstraints = /constraint|limitation|must not|should not|cannot|don't|avoid|without/i.test(text);
  const hasExamples = /example|sample|for instance|e\.g\.|such as|like this/i.test(text);
  const hasTone = /tone|style|voice|formal|casual|professional|friendly|authoritative/i.test(text);
  const clarity = [hasGoal, hasContext, hasFormat, hasConstraints, hasExamples, hasTone].filter(Boolean).length;

  return {
    wordCount,
    sentenceCount,
    structure: {
      hasGoal,
      hasContext,
      hasFormat,
      hasConstraints,
      hasExamples,
      hasTone,
    },
    clarityScore: Math.round((clarity / 6) * 100),
    issues: [],
  };
}

function generateIssues(analysis) {
  const issues = [];
  if (!analysis.structure.hasGoal) issues.push({ severity: 'high', message: 'Missing a clear goal or objective — what do you want the AI to do?' });
  if (!analysis.structure.hasContext) issues.push({ severity: 'high', message: 'Missing context or role definition — the AI needs to understand the situation.' });
  if (!analysis.structure.hasFormat) issues.push({ severity: 'medium', message: 'No output format specified — define how the response should be structured.' });
  if (!analysis.structure.hasConstraints) issues.push({ severity: 'medium', message: 'No constraints or boundaries defined — specify what the AI must avoid.' });
  if (!analysis.structure.hasExamples) issues.push({ severity: 'low', message: 'No examples provided — examples help the AI match your expectations.' });
  if (!analysis.structure.hasTone) issues.push({ severity: 'low', message: 'No tone or style specified — the AI may default to a generic voice.' });
  if (analysis.wordCount < 10) issues.unshift({ severity: 'high', message: 'Prompt is very short — provide more detail for a useful response.' });
  if (analysis.sentenceCount > 20) issues.push({ severity: 'low', message: 'Prompt is long and may contain multiple concerns — consider splitting into separate prompts.' });
  return issues;
}

function buildSection(key, label, value) {
  const sectionTitles = {
    goal: '## Goal / Objective',
    context: '## Context & Role',
    task: '## Task Description',
    format: '## Output Format',
    constraints: '## Constraints & Boundaries',
    examples: '## Examples',
    tone: '## Tone & Style',
  };
  return { key, label, content: sectionTitles[key] ? `${sectionTitles[key]}\n\n${value}` : value };
}

function generateSpecSheet(original, analysis) {
  const sections = [];

  if (analysis.structure.hasGoal) {
    const goalMatch = original.match(/(?:goal|objective|aim|purpose|i want|i need)[:\s]+(.+?)(?:\n|$)/i);
    sections.push(buildSection('goal', 'Goal / Objective', goalMatch ? goalMatch[1].trim() : 'Not explicitly defined'));
  }

  if (analysis.structure.hasContext) {
    const ctxMatch = original.match(/(?:context|background|situation|scenario|as a|you are)[:\s]+(.+?)(?:\n|$)/i);
    sections.push(buildSection('context', 'Context & Role', ctxMatch ? ctxMatch[1].trim() : 'Provided context'));
  }

  sections.push(buildSection('task', 'Task Description', original));

  if (analysis.structure.hasFormat) {
    const fmtMatch = original.match(/(?:format|output|response|result)[:\s]+(.+?)(?:\n|$)/i);
    sections.push(buildSection('format', 'Output Format', fmtMatch ? fmtMatch[1].trim() : 'Specified format'));
  }

  if (analysis.structure.hasConstraints) {
    const conLines = original.split('\n').filter(l => /must not|should not|cannot|don't|avoid|without|constraint|limitation/i.test(l));
    sections.push(buildSection('constraints', 'Constraints & Boundaries', conLines.length > 0 ? conLines.join('\n') : 'Provided constraints'));
  }

  if (analysis.structure.hasTone) {
    const toneMatch = original.match(/(?:tone|style|voice)[:\s]+(.+?)(?:\n|$)/i);
    sections.push(buildSection('tone', 'Tone & Style', toneMatch ? toneMatch[1].trim() : 'Specified tone'));
  }

  if (analysis.structure.hasExamples) {
    const exLines = original.split('\n').filter(l => /example|sample|for instance|e\.g\.|such as|like this/i.test(l));
    sections.push(buildSection('examples', 'Examples', exLines.length > 0 ? exLines.join('\n') : 'Provided examples'));
  }

  return { sections };
}

function rewrite(prompt) {
  const analysis = analyzePrompt(prompt);
  const issues = generateIssues(analysis);
  const specSheet = generateSpecSheet(prompt, analysis);

  const rewritten = [
    '# Optimized Prompt',
    '',
    '## Role',
    `You are an expert assistant specializing in ${issues.length > 0 ? 'the requested domain' : 'this domain'}.`,
    '',
    ...specSheet.sections.flatMap(s => [s.content, '']),
  ].join('\n').trim();

  return {
    original: prompt,
    rewritten,
    analysis: {
      wordCount: analysis.wordCount,
      sentenceCount: analysis.sentenceCount,
      clarityScore: analysis.clarityScore,
      missingElements: analysis.structure,
    },
    issues,
    specSheet,
  };
}

module.exports = { rewrite };
