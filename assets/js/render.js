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
      <div class="pair-index">— #${idx + 1} · ${esc(u.artist_name || '—')} —</div>

      <!-- ASSISTANT: Lyrics always visible -->
      <div class="card card-assistant">
        <div class="card-header">
          <span class="role-badge assistant">Lyrics</span>
          ${a.modelInfo ? `<span class="model-info-pill">${esc(a.modelInfo)}</span>` : ''}
        </div>
        <div class="card-body">
          ${isError
            ? `<div class="err-badge">⚠ Ошибка генерации</div>`
            : `
            ${a.production ? `
            <div class="production-block">
              <div class="prod-label">Production</div>
              ${cb('', a.production, true)}
            </div>` : ''}
            ${cb('', a.lyrics, false, true)}
            `
          }
        </div>
      </div>

      <!-- TOGGLE BUTTON -->
      <button class="btn-show-request" data-idx="${idx}" onclick="window.__lyra_toggle(this)">
        <span class="toggle-arrow">↓</span> показать запрос
      </button>

      <!-- USER: collapsed by default -->
      <div class="card card-user user-collapse" id="user-block-${idx}">
        <div class="card-header">
          <span class="role-badge user">User · Parameters</span>
        </div>
        <div class="card-body">
          <div class="sec-title u">Lyrics Settings</div>
          ${cb('Artist Name',       u.artist_name)}
          ${cb('Core Theme',        u.core_theme,    true)}
          ${cb('Mood Tag',          u.mood_tag,       true)}
          ${cb('Banned Words',      u.banned_words,   true)}
          ${cb('Length',            u.length)}
          ${cb('Explicit Language', u.explicit)}

          <div class="spacer"></div>
          <div class="sec-title u">Rhyme Controls</div>
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

// ── TOGGLE USER BLOCK ────────────────────────────────────────
window.__lyra_toggle = function(btn) {
  const idx = btn.dataset.idx;
  const block = document.getElementById(`user-block-${idx}`);
  const arrow = btn.querySelector('.toggle-arrow');
  const isOpen = block.classList.toggle('open');
  arrow.textContent = isOpen ? '↑' : '↓';
  btn.innerHTML = `<span class="toggle-arrow">${isOpen ? '↑' : '↓'}</span> ${isOpen ? 'скрыть запрос' : 'показать запрос'}`;
  btn.dataset.idx = idx; // restore after innerHTML
};

// ── COPY FN ──────────────────────────────────────────────────
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
