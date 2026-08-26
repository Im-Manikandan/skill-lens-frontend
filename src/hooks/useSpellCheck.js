import { useState, useRef, useCallback, useEffect } from 'react';

// Domain / tech terms that should never be flagged
const SKIP_WORDS = new Set([
  'hcm', 'erp', 'crm', 'api', 'ui', 'ux', 'hr', 'hrms', 'hris',
  'sap', 'hana', 'java', 'js', 'ts', 'css', 'html', 'json', 'xml',
  'sql', 'nosql', 'devops', 'saas', 'paas', 'iaas', 'okr', 'kpi',
  'agile', 'scrum', 'kanban', 'workday', 'successfactors', 'peoplesoft',
  'salesforce', 'linkedin', 'github', 'gitlab', 'aws', 'gcp', 'azure',
  'python', 'golang', 'kotlin', 'typescript', 'javascript',
  'powershell', 'sharepoint', 'docusign', 'quickbooks', 'netsuite',
  'westlaw', 'lexisnexis', 'adobe', 'wordpress', 'mongodb', 'mysql',
  'graphql', 'oauth', 'ebay', 'iphone', 'ipad', 'ios', 'macos', 'paypal',
]);

// Module-level cache — shared across all component instances
let cachedSpell = null;
let loadPromise = null;

async function loadSpeller() {
  if (cachedSpell) return cachedSpell;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const rawBase = import.meta.env.BASE_URL ?? '/';
    const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
    const [{ default: NSpell }, affRes, dicRes] = await Promise.all([
      import('nspell'),
      fetch(`${base}dict/en.aff`),
      fetch(`${base}dict/en.dic`),
    ]);
    const [aff, dic] = await Promise.all([affRes.text(), dicRes.text()]);
    cachedSpell = NSpell(aff, dic);
    return cachedSpell;
  })();

  return loadPromise;
}

export function useSpellCheck() {
  const spellRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadSpeller()
      .then((spell) => {
        if (!cancelled) {
          spellRef.current = spell;
          setReady(true);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const check = useCallback((word) => {
    if (!spellRef.current) return true;
    const lower = word.toLowerCase();
    if (SKIP_WORDS.has(lower)) return true;
    if (word.length < 3) return true;
    if (/\d/.test(word)) return true;
    // Skip all-caps acronyms (HCM, API, etc.)
    if (word === word.toUpperCase() && word.length <= 6) return true;
    return spellRef.current.correct(word);
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const suggest = useCallback((word) => {
    if (!spellRef.current) return [];
    return spellRef.current.suggest(word).slice(0, 6);
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  return { ready, check, suggest };
}
