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
