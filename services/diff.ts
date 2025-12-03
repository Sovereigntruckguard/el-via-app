// services/diff.ts
function normWords(s?: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/).filter(Boolean);
}

export function diffTokens(user: string, expected: string) {
  const U = normWords(user);
  const E = normWords(expected);
  const setU = new Set(U);
  const setE = new Set(E);
  const missing = E.filter(w => !setU.has(w));
  const excess  = U.filter(w => !setE.has(w));
  return { missing, excess };
}
