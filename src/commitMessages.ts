import * as github from '@actions/github';
import {Inputs} from './input';
import type {PullRequest} from '@octokit/webhooks-types';
import type {RestEndpointMethodTypes} from '@octokit/plugin-rest-endpoint-methods';

// This code has been taken from https://github.com/GsActions/commit-message-checker/blob/master/src/input-helper.ts
// and slightly modified.

/**
 * Gets all commit messages of a push or title and body of a pull request
 * concatenated to one message.
 *
 * @returns   string[]
 */
export async function retrieve(
  inputs: Inputs,
  token?: string,
): Promise<string[]> {
  const result: string[] = [];

  switch (github.context.eventName) {
    case 'pull_request': {
      const pullRequest = github.context.payload?.pull_request;

      if (pullRequest) {
        return extractMessagesFromPullRequest(
          // Action payloads are the same as WebHook payloads, so cast is safe.
          pullRequest as PullRequest,
          inputs,
          token,
        );
      } else {
        throw new Error(`No pull_request found in the payload.`);
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

async function extractMessagesFromPullRequest(
  pullRequest: PullRequest,
  inputs: Inputs,
  token?: string,
): Promise<string[]> {
  if (!inputs.validatePullRequestCommits) {
    let msg: string = pullRequest.title;
    if (pullRequest.body) {
      msg = msg.concat('\n\n', pullRequest.body);
    }
    return [msg];
  }

  return getCommits(pullRequest, token);
}

async function getCommits(
  pullRequest: PullRequest,
  token?: string,
): Promise<string[]> {
  // Head repository where commits are registered. Value is null when the PR within a single repository,
  // in which use base repository instead.
  const repo = pullRequest.head.repo ?? pullRequest.base.repo;

  if (repo.private && token === undefined) {
    throw new Error(
      'GitHub token is required to validate pull request commits on private repository.',
    );
  }

  const octokit = github.getOctokit(token ?? '');

  type Commits =
    RestEndpointMethodTypes['pulls']['listCommits']['response']['data'];

  const commits = await octokit.request<Commits>({
    method: 'GET',
    url: pullRequest.commits_url,
  });

  return commits.data.map(({commit}) => commit.message);
}
