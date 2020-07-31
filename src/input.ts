export function parseVerbs(text: string): string[] {
  const lines = text.split('\n');

  const verbs: string[] = [];
  for (const line of lines) {
    const lineVerbs = line
      .split(/[,;]/)
      .map(verb => verb.trim().toLowerCase())
      .filter(verb => verb.length > 0);

    verbs.push(...lineVerbs);
  }

  return verbs;
}

export function parseAllowOneLiners(text: string): boolean | null {
  if (text === '' || text.toLowerCase() === 'false' || text === '0') {
    return false;
  }

  if (text.toLowerCase() === 'true' || text === '1') {
    return true;
  }

  return null;
}
