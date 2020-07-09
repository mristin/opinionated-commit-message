import * as core from '@actions/core';
import * as commitMessages from './commitMessages';
import * as inspection from './inspection';
import * as represent from './represent';

/**
 * Main function
 */
export function run(): void {
  try {
    const messages: string[] = commitMessages.retrieve();

    // Parts of the error message to be concatenated with '\n'
    const parts: string[] = [];

    for (const [messageIndex, message] of messages.entries()) {
      const errors = inspection.check(message);

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
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
}
