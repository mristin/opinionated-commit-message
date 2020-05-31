import * as core from '@actions/core';
import * as github from '@actions/github';

// This code has been taken from https://github.com/GsActions/commit-message-checker/blob/master/src/input-helper.ts
// and slightly modified.

/**
 * Gets all commit messages of a push or title and body of a pull request
 * concatenated to one message.
 *
 * @returns   string[]
 */
export function retrieve(): string[] {
  const result: string[] = [];

  switch (github.context.eventName) {
    case 'pull_request': {
      if (
        github.context.payload &&
        github.context.payload.pull_request &&
        github.context.payload.pull_request.title
      ) {
        let msg: string = github.context.payload.pull_request.title;
        if (github.context.payload.pull_request.body) {
          msg = msg.concat('\n\n', github.context.payload.pull_request.body);
        }
        result.push(msg);
      } else {
        throw new Error(`No pull_request found in the payload.`);
      }
      break;
    }
    case 'push': {
      if (
        github.context.payload &&
        github.context.payload.commits &&
        github.context.payload.commits.length
      ) {
        for (const i in github.context.payload.commits) {
          if (github.context.payload.commits[i].message) {
            result.push(github.context.payload.commits[i].message);
          }
        }
      }
      if (result.length === 0) {
        throw new Error(`No commits found in the payload.`);
      }
      break;
    }
    default: {
      throw new Error(`Unhandled event: ${github.context.eventName}`);
    }
  }

  return result;
}
