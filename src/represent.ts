export function formatErrors(
  message: string,
  messageIndex: number,
  errors: string[],
): string {
  if (errors.length === 0) {
    throw Error('Unexpected empty errors');
  }

  // Parts of the representation to be joined by ''
  const parts: string[] = [];

  parts.push(`The message ${messageIndex + 1} is invalid:\n`);
  for (const error of errors) {
    if (error.endsWith('\n')) {
      throw Error(`Unexpected error ending in a new-line character: ${error}`);
    }
    parts.push(`* ${error}\n`);
  }

  parts.push(`The original message was:\n${message}`);
  if (!message.endsWith('\n')) {
    parts.push('\n');
  }

  return parts.join('');
}
