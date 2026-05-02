import { parseUser, parseAssistant } from './parser.js';

let _id = 0;

export function renderPairs(messages) {
  const pairs = [];
  for (let i = 0; i < messages.length - 1; i++) {
    if (messages[i].role === 'user' && messages[i + 1].role === 'assistant') {
      pairs.push({ user: messages[i].content, assistant: messages[i + 1].content });
      i++;
    }
  }

  const container = document.getElementById('pairs-container');
  container.innerHTML = '';

  const navData = [];

  pairs.forEach((pair, idx) => {
    const u = parseUser(pair.user);
    const a = parseAssistant(pair.assistant);
    const isError = pair.assistant.toLowerCase().includes('something went wrong');

    navData.push({ artist: u.artist_name, idx });

    const el = document.createElement('div');
    el.className = 'pair';
    el.id = `pair-${idx}`;
    el.style.animationDelay = `${idx * 0.04}s`;

    el.innerHTML = `
      <div class="pair-index">— запрос #${idx + 1} —</div>

      <!-- USER -->
      <div class="card">
        <div class="card-header">
          <span class="role-badge user">User</span>
        </div>
        <div class="card-body">
          <div class="sec-title u">Parameters · Lyrics Settings</div>
          ${cb('Artist Name',       u.artist_name)}
          ${cb('Core Theme',        u.core_theme,    true)}
          ${cb('Mood Tag',          u.mood_tag,      true)}
          ${cb('Banned Words',      u.banned_words,  true)}
          ${cb('Length',            u.length)}
          ${cb('Explicit Language', u.explicit)}

          <div class="spacer"></div>
          <div class="sec-title u">Parameters · Rhyme Controls</div>
          ${cb('Rhyme Density',      u.rhyme_density)}
          ${cb('Rhyme Complexity',   u.rhyme_complexity)}
          ${u.rhyme_placement  ? cb('Rhyme Placement',    u.rhyme_placement,  true) : ''}
          ${u.rhyme_quality    ? cb('Rhyme Quality',      u.rhyme_quality,    true) : ''}
          ${u.struct_patterns  ? cb('Structure Patterns', u.struct_patterns,  true) : ''}
          ${u.poetic_forms     ? cb('Poetic Forms',       u.poetic_forms,     true) : ''}

          <div class="spacer"></div>
          <div class="sec-title u">Prompt</div>
          ${cb('', u.prompt, false, true)}
        </div>
      </div>

      <!-- ASSISTANT -->
      <div class="card">
        <div class="card-header">
          <span class="role-badge assistant">Assistant</span>
        </div>
        <div class="card-body">
          ${isError
            ? `<div class="err-badge">⚠ Ошибка генерации</div>`
            : `
          <div class="sec-title a">Model Info</div>
          ${cb('', a.modelInfo)}
          <div class="spacer"></div>
          <div class="sec-title a">Production</div>
          ${cb('', a.production, true)}
          <div class="spacer"></div>
          <div class="sec-title a">Lyrics</div>
          ${cb('', a.lyrics, false, true)}
          `}
        </div>
      </div>
    `;

    container.appendChild(el);
  });

  container.style.display = 'block';
  return navData;
}

// ── COPY BLOCK ───────────────────────────────────────────────
function cb(label, value, scroll = false, large = false) {
  if (!value && value !== 0) return '';
  const id = 'cb' + (++_id);
  const cls = 'cb' + (large ? ' scroll-lg' : scroll ? ' scroll' : '');
  return `
    <div class="field">
      ${label ? `<div class="field-label">${esc(label)}</div>` : ''}
      <div class="${cls}" id="${id}">${esc(value)}<button class="cp" onclick="window.__lyra_copy('${id}',this)">copy</button></div>
    </div>`;
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// expose copy fn globally (needed for inline onclick)
window.__lyra_copy = function(id, btn) {
  const el = document.getElementById(id);
  if (!el) return;
  const clone = el.cloneNode(true);
  clone.querySelectorAll('.cp').forEach(b => b.remove());
  navigator.clipboard.writeText((clone.innerText || clone.textContent).trim()).then(() => {
    btn.textContent = '✓ ok';
    btn.classList.add('ok');
    setTimeout(() => { btn.textContent = 'copy'; btn.classList.remove('ok'); }, 1800);
  });
};
