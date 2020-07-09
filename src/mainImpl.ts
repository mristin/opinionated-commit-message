import * as core from '@actions/core';
import * as commitMessages from './commitMessages';
import * as inspection from './inspection';
import * as represent from './represent';

function runWithExceptions(): void {
  const messages: string[] = commitMessages.retrieve();

  const additionalVerbsInput = core.getInput('additional-verbs', {
    required: false
  });

  const additionalVerbs =
    additionalVerbsInput !== null && additionalVerbsInput !== undefined
      ? new Set<string>(
          additionalVerbsInput
            .split(/[,;]/)
            .map(verb => verb.trim().toLowerCase())
            .filter(verb => verb.length > 0)
        )
      : new Set<string>();

  // Parts of the error message to be concatenated with '\n'
  const parts: string[] = [];

  for (const [messageIndex, message] of messages.entries()) {
    const errors = inspection.check(message, additionalVerbs);

    if (errors.length > 0) {
      const repr: string = represent.formatErrors(
        message,
        messageIndex,
        errors
      );

      parts.push(repr);
    } else {
      core.info(`The message is OK:\n---\n${message}\n---`);
    }
  }

  const errorMessage = parts.join('\n');
  if (errorMessage.length > 0) {
    core.setFailed(errorMessage);
  }
}

/**
 * Main function
 */
export function run(): void {
  try {
    runWithExceptions();
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
}
