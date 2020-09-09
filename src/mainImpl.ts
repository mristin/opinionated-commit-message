import * as core from '@actions/core';

import * as commitMessages from './commitMessages';
import * as inspection from './inspection';
import * as represent from './represent';
import * as input from './input';

function runWithExceptions(): void {
  const messages: string[] = commitMessages.retrieve();

  ////
  // Parse inputs
  ////

  const additionalVerbsInput =
    core.getInput('additional-verbs', {required: false}) ?? '';

  const pathToAdditionalVerbsInput =
    core.getInput('path-to-additional-verbs', {required: false}) ?? '';

  const allowOneLinersInput =
    core.getInput('allow-one-liners', {required: false}) ?? '';

  const maybeInputs = input.parseInputs(
    additionalVerbsInput,
    pathToAdditionalVerbsInput,
    allowOneLinersInput
  );

  if (maybeInputs.error !== null) {
    core.error(maybeInputs.error);
    core.setFailed(maybeInputs.error);
    return;
  }

  const inputs = maybeInputs.mustInputs();

  ////
  // Inspect
  ////

  // Parts of the error message to be concatenated with '\n'
  const parts: string[] = [];

  for (const [messageIndex, message] of messages.entries()) {
    const errors = inspection.check(message, inputs);

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
