function getEl(id) { return document.getElementById(id); }

function show(id) { getEl(id).classList.remove('hidden'); }
function hide(id) { getEl(id).classList.add('hidden'); }
function val(id) { return getEl(id).value; }
function html(id, content) { getEl(id).innerHTML = content; }
function text(id, content) { getEl(id).textContent = content; }

async function rewrite() {
  const prompt = val('prompt-input').trim();
  if (!prompt) {
    alert('Please enter a prompt.');
    return;
  }

  const btn = getEl('rewrite-btn');
  btn.disabled = true;
  btn.textContent = 'Rewriting...';

  try {
    const res = await fetch('/api/rewrite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || 'Something went wrong.');
      return;
    }

    const data = await res.json();
    showResults(data);
  } catch (err) {
    alert('Network error. Is the server running?');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Rewrite';
  }
}

function showResults(data) {
  text('rewritten-output', data.rewritten);
  renderAnalysis(data.analysis, data.issues);
  renderSpecSheet(data.specSheet);
  show('results-section');
  switchTab('rewritten');
}

function renderAnalysis(analysis, issues) {
  const score = analysis.clarityScore;
  const label = score >= 70 ? 'good' : score >= 40 ? 'fair' : 'poor';
  const labels = score >= 70 ? 'Well Structured' : score >= 40 ? 'Needs Improvement' : 'Poorly Structured';

  html('score-card', `
    <h3>Prompt Clarity Score</h3>
    <div class="score-value ${label}">${score}/100</div>
    <div style="color:#94a3b8;margin-top:0.25rem">${labels}</div>
    <div class="score-bar">
      <div class="score-fill ${label}" style="width:${score}%"></div>
    </div>
    <div style="margin-top:0.75rem;color:#64748b;font-size:0.85rem">
      ${analysis.wordCount} words · ${analysis.sentenceCount} sentences
    </div>
  `);

  if (issues.length === 0) {
    html('issues-list', '<div style="color:#22c55e;padding:0.5rem 0">✓ No issues found — your prompt is well structured!</div>');
    return;
  }

  html('issues-list', issues.map(i => `
    <div class="issue ${i.severity}">
      <span class="issue-severity">${i.severity}</span>
      <span class="issue-message">${i.message}</span>
    </div>
  `).join(''));
}

function renderSpecSheet(specSheet) {
  html('spec-sections', specSheet.sections.map(s => `
    <h3>${s.label}</h3>
    <pre>${escHtml(s.content)}</pre>
  `).join(''));
}

function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelector(`.tab[data-tab="${name}"]`).classList.add('active');
  getEl(`tab-${name}`).classList.add('active');
}

function clearInput() {
  val('prompt-input', '');
  hide('results-section');
}

function copyRewritten() {
  const text = getEl('rewritten-output').textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = getEl('copy-btn');
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy to Clipboard'; }, 2000);
  });
}
