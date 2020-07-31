import fs from 'fs';

import * as core from '@actions/core';

import * as commitMessages from './commitMessages';
import * as inspection from './inspection';
import * as represent from './represent';
import * as input from './input';

function runWithExceptions(): void {
  const messages: string[] = commitMessages.retrieve();

  const additionalVerbs = new Set<string>();

  // Parse additional-verbs input

  const additionalVerbsInput = core.getInput('additional-verbs', {
    required: false
  });

  if (additionalVerbsInput) {
    for (const verb of input.parseVerbs(additionalVerbsInput)) {
      additionalVerbs.add(verb);
    }
  }

  // Parse additional-verbs-from-path input

  const pathToAdditionalVerbs = core.getInput('path-to-additional-verbs', {
    required: false
  });

  if (pathToAdditionalVerbs) {
    if (!fs.existsSync(pathToAdditionalVerbs)) {
      const error =
        'The file referenced by path-to-additional-verbs could ' +
        `not be found: ${pathToAdditionalVerbs}`;
      core.error(error);
      core.setFailed(error);
      return;
    }

    const text = fs.readFileSync(pathToAdditionalVerbs).toString('utf-8');

    for (const verb of input.parseVerbs(text)) {
      additionalVerbs.add(verb);
    }
  }

  // Parse allow-one-liners input
  const allowOneLinersText = core.getInput('allow-one-liners', {
    required: false
  });

  const allowOneLiners: boolean | null = !allowOneLinersText
    ? false
    : input.parseAllowOneLiners(allowOneLinersText);

  if (allowOneLiners === null) {
    const error =
      'Unexpected value for allow-one-liners. ' +
      `Expected either 'true' or 'false', got: ${allowOneLinersText}`;
    core.error(error);
    core.setFailed(error);
    return;
  }

  // Parts of the error message to be concatenated with '\n'
  const parts: string[] = [];

  for (const [messageIndex, message] of messages.entries()) {
    const errors = inspection.check(message, additionalVerbs, allowOneLiners);

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
