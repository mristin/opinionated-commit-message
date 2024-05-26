import * as core from '@actions/core';
import * as commitMessages from './commitMessages';
import * as inspection from './inspection';
import * as represent from './represent';
import * as input from './input';

async function runWithExceptions(): Promise<void> {
  ////
  // Parse inputs
  ////

  const additionalVerbsInput = core.getInput('additional-verbs', {
    required: false,
  });

  const pathToAdditionalVerbsInput = core.getInput('path-to-additional-verbs', {
    required: false,
  });

  const allowOneLinersInput = core.getInput('allow-one-liners', {
    required: false,
  });

  const maxSubjectLengthInput = core.getInput('max-subject-line-length', {
    required: false,
  });

  const minBodyLengthInput = core.getInput('min-body-length', {
    required: false,
  });

  const maxBodyLineLengthInput = core.getInput('max-body-line-length', {
    required: false,
  });

  const enforceSignOffInput = core.getInput('enforce-sign-off', {
    required: false,
  });

  const validatePullRequestCommitsInput = core.getInput(
    'validate-pull-request-commits',
    {
      required: false,
    },
  );

  const skipBodyCheckInput = core.getInput('skip-body-check', {
    required: false,
  });

  const ignoreMergeCommitsInput = core.getInput('ignore-merge-commits', {
    required: false,
  });

  const ignorePatternsInput = core.getInput('ignore-patterns', {
    required: false,
  });

  const maybeInputs = input.parseInputs({
    additionalVerbsInput,
    pathToAdditionalVerbsInput,
    allowOneLinersInput,
    maxSubjectLengthInput,
    minBodyLengthInput,
    maxBodyLineLengthInput,
    enforceSignOffInput,
    validatePullRequestCommitsInput,
    skipBodyCheckInput,
    ignoreMergeCommitsInput,
    ignorePatternsInput,
  });

  if (maybeInputs.error !== null) {
    core.error(maybeInputs.error);
    core.setFailed(maybeInputs.error);
    return;
  }

  const inputs = maybeInputs.mustInputs();

  const messages: string[] = await commitMessages.retrieve(
    inputs,
    core.getInput('github-token', {required: false}),
  );

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
        errors,
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
export async function run(): Promise<void> {
  return runWithExceptions().catch(error => {
    if (error instanceof Error) {
      core.error(error);
      core.setFailed(error.message);
    } else {
      const message = `Unexpected error value: ${error}`;
      core.error(message);
      core.setFailed(message);
    }
  });
}
