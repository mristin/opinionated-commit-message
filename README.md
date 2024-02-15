# opinionated-commit-message

![version](
https://img.shields.io/github/v/release/mristin/opinionated-commit-message?style=flat-square
)
![build-and-test](
https://github.com/mristin/opinionated-commit-message/workflows/build-and-test/badge.svg?branch=master
)

Opinionated-commit-message is a GitHub Action which checks commit messages 
according to an opinionated style.

The style was inspired by https://chris.beams.io/posts/git-commit/:

* Separate subject from body with a blank line
* Limit the subject line to 50 characters
* Capitalize the subject line
* Do not end the subject line with a period
* Use the imperative mood in the subject line
* Wrap the body at 72 characters
* Use the body to explain what and why (instead of how)

Here is an example commit message:

```
Set up Open ID HttpClient with default proxy

Previously, the Open ID HttpClient was simply instantiated without 
default proxy credentials. However, if there are company proxies,
HttpClient must use the default proxy with OpenID Connect.
```

## Prior Art

There exist a good action to check commit messages, commit-message-checker 
(https://github.com/GsActions/commit-message-checker). However, it is limited 
to regular expressions which makes more complex checks (such as imperative mood) 
hard or impossible to implement.

I based my implementation heavily on commit-message-checker and would like to 
thank the author for the great work!

## Example Workflow

You can set up a GitHub workflow to automatically check messages. 
Put the following file in `.github/workflows/check-commit-message.yml` and 
GitHub should pick it and set it up.

```yml
name: 'Check commit message style'
on:
  pull_request:
    types:
      - opened
      - edited
      - reopened
      - synchronize
  push:
    branches:
      - master
      - 'dev/*'

jobs:
  check-commit-message-style:
    name: Check commit message style
    runs-on: ubuntu-latest
    steps:
      - name: Check
        uses: mristin/opinionated-commit-message@v3.1.0
```

## Checked Events

Opinionated-commit-message verifies commit messages on the GitHub events
[`pull_request`](
https://docs.github.com/en/actions/reference/events-that-trigger-workflows#pull_request
) and [`push`](
https://docs.github.com/en/actions/reference/events-that-trigger-workflows#push
).

In the case of pull requests only the title and the body of the pull request
are checked. 

On push, all the commit messages *of the push* are verified.

## List of Verbs

Since the subject needs to start with a verb in the imperative mood, we 
pre-compiled a whitelist of most frequent English verbs together with verbs 
frequently used in commit messages from our own projects.

However, given the variety of projects in the wild, this whitelist is not
sufficient to cover all the possible verbs. We therefore introduce the action
input `additional-verbs` so that you can add your own verbs.

The additional verbs are given as a comma, semicolon or new line separated 
string in the workflow file. For example:

```yaml
    steps:
      - name: Check
        uses: mristin/opinionated-commit-message@v3.1.0
        with:
          additional-verbs: 'chrusimusi, unit-test'
```

If you prefer to have your additional verbs in imperative mood in a separate
file (*e.g.*, to keep the workflow file succinct), you can supply the path
as input:

```yaml
    steps:
      - name: Check
        uses: mristin/opinionated-commit-message@v3.1.0
        with:
          path-to-additional-verbs: 'src/additional-verbs.txt'
```

## Long URLs

Splitting URLs on separate lines to satisfy the maximum character lenght 
breaks the link functionality on most readers
(*e.g.*, in a terminal or on GitHub). Therefore we need to tolerate long URLs
in the message body. 

Nevertheless, in order to make the text readable the URL should be put either on 
a separate line or defined as a link in markdown. 

For example, this is how you can write a message with an URL on a separate line:

```
Please see this page for more details:
http://some-domain.com/very/long/long/long/long/long/long/long/long/long/path.html
or read the manual.
```

Here is the same message with a link definition (arguably a bit more readable):

```
Please see [this page for more details][1] or read the manual.

[1]: http://some-domain.com/very/long/long/long/long/long/long/long/long/long/path.html
```

## One-liners

Usually, you need to write elaborate commit messages with a shorter header
and more verbose body for an informative Git history. However, this might be
too rigid for certain projects.

You can allow one-liner commit messages by setting the flag `allow-one-liners`:
 
```yaml
    steps:
      - name: Check
        uses: mristin/opinionated-commit-message@v3.1.0
        with:
          allow-one-liners: 'true'
```

## Custom subject length

For use in terminals and monospaced GUIs it is a good practice to limit length of the subject to 50 characters.
For some projects, though, this limit is too restrictive.
For example, if you include tags in the subject (such as `[FIX]`) there is not much space left for the actual subject.

You can change the imposed maximum subject length by setting the flag `max-subject-line-length`:

```yaml
    steps:
      - name: Check
        uses: mristin/opinionated-commit-message@v2
        with:
          max-subject-line-length: '100'
```

## Custom line length on the body

Similar to the subject line, for terminals and monospaced GUIs it is a good practice to limit the line length of the body to 72 characters.
However, the restriction is unnecessarily harsh for teams that use modern GUIs such as GitHub Web.
This is especially so when using a description of the pull request as the body, since there is no such limitation in the GitHub UI itself.

You can change the imposed maximum line length by setting the flag `max-body-line-length`:

```yaml
    steps:
      - name: Check
        uses: mristin/opinionated-commit-message@v2
        with:
          max-body-line-length: '100'
```

## Skip Body Check

For some repositories only the subject matters while the body is allowed to be free-form.
For example, this is the case when the body of the commit is automatically generated (*e.g.*, by a third-party service that we do not control).
In such situations, we want check the subject line, but ignore the body in the checks.

You can disable checking the body by setting the flag `skip-body-check`:

```yaml
    steps:
      - name: Check
        uses: mristin/opinionated-commit-message@v2
        with:
          skip-body-check: 'true'
```

## Validating PR commit messages

When triggered by a `pull_request` event, the action checks the title and the
body of the pull request by default. GitHub does not include the content of the
commit message in the workflow context, so checking all the commit messages of
the PR requires additional API calls. If you want to check the commit messages
for pull requests you can either:

- Trigger the action on `push` events. This will check the commit messages of
  each pushed commit, but it will run even for branches that do not have a PR 
  associated with them.
- Set the `validate-pull-request-commits` option to `true`. This will check the
  messages of every commit in the PR. However, because it requires extra API calls
  to retrieve the commit messages, setting this on option on _private_ repositories
  require a GitHub token with at least `read` permission on the `contents` scope.

```yaml
    steps:
      - name: Check
        uses: mristin/opinionated-commit-message@v3.1.0
        with:
          validate-pull-request-commits: 'true'
          # Required for private repos
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

#### Permissions

The default permissions for a GitHub Actions workflow is sufficient for this action to work.
You only need to check permissions if you are already customizing the permissions of the workflow
See the [GitHub documentation](https://docs.github.com/en/actions/reference/authentication-in-a-workflow#permissions-for-the-github_token).

```yaml
jobs:
  check-commits:
    # If you have this line,
    permissions:
      # Make sure this you also have this line
      contents: read
    steps:
      - uses: mristin/opinionated-commit-message@v3.1.0
        with:
          validate-pull-request-commits: 'true'
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Enforce Sign-off

Most projects do not require a sign-off on the commits.
However, there are projects which need every commit to be signed off to avoid legal, safety and other official 
repercussions (for more information, 
see [this issue](https://github.com/mristin/opinionated-commit-message/issues/73) and
[this StackOverflow question](https://stackoverflow.com/questions/1962094/what-is-the-sign-off-feature-in-git-for)). 

We provide an `enforce-sign-off` flag so that you can enforce the sign-off in the commits by:

```yaml
    steps:
      - name: Check
        uses: mristin/opinionated-commit-message@v3.1.0
        with:
          enforce-sign-off: 'true'
```

The check expects that the body of the commit contains one or more lines like this one:

```
Signed-off-by: Some Body <some@body.com>
```

You usually sign off the commits using `git commit --signoff`. 

## Contributing

If you would like to report bugs or request a feature, please create 
a [new issue](https://github.com/mristin/opinionated-commit-message/issues/new).

Please see [CONTRIBUTING.md](CONTRIBUTING.md) if you
would like to contribute to the code.

## License

This project is released under the terms of the [MIT License](LICENSE).
