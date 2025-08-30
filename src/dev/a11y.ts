// Lightweight accessibility audit in development using axe-core via CDN
// Enable by setting VITE_A11Y_AUDIT=true and running the dev server.

declare global {
  interface Window {
    axe?: {
      run: (context?: unknown, options?: unknown) => Promise<{
        violations: Array<{ id: string; impact?: string; description: string; helpUrl?: string; nodes: Array<{ html?: string; target?: string[]; failureSummary?: string }> }>;
      }>;
    };
  }
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load ' + src));
    document.head.appendChild(s);
  });
}

async function runAxe() {
  try {
    if (!window.axe) {
      await loadScript('https://unpkg.com/axe-core@4.8.4/axe.min.js');
    }
    if (!window.axe) return;
    const { violations } = await window.axe.run(document);
    if (!violations.length) {
      console.info('[a11y] No accessibility violations found');
      return;
    }
    console.groupCollapsed(`%c[a11y] ${violations.length} violation(s)`, 'color:#b45309');
    for (const v of violations) {
      console.warn(`- ${v.id} (${v.impact || 'n/a'}): ${v.description}\n  ${v.helpUrl || ''}`);
      for (const n of v.nodes.slice(0, 3)) {
        console.log('  node:', n.target?.join(' ') || '', '\n  html:', n.html || '', '\n  summary:', n.failureSummary || '');
      }
    }
    console.groupEnd();
  } catch (e) {
    console.debug('[a11y] audit failed', e);
  }
}

// Defer until the app has rendered once
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(runAxe, 1000);
} else {
  window.addEventListener('DOMContentLoaded', () => setTimeout(runAxe, 1000));
}
