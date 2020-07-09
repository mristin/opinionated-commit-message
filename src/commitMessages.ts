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
      // TODO: remove debug
      core.info(`The payload was: ${JSON.stringify(github.context.payload)}`);

      const pull_request = github.context.payload?.pull_request;

      if (pull_request) {
        let msg: string = pull_request.title;
        if (pull_request.body) {
          msg = msg.concat('\n\n', pull_request.body);
        }
        result.push(msg);
      } else {
        throw new Error(`No pull_request found in the payload.`);
      }

      const commits = github.context.payload?.commits;
      if (commits) {
        for (const commit of commits) {
          if (commit.message) {
            result.push(commit.message);
          }
        }
      }

      break;
    }
    case 'push': {
      const commits = github.context.payload?.commits;
      if (commits) {
        for (const commit of commits) {
          if (commit.message) {
            result.push(commit.message);
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
