# opinionated-commit-message

![version](
https://img.shields.io/github/v/release/mristin/opinionated-commit-message?style=flat-square
)
![build-and-test](
https://github.com/mristin/opinionated-commit-message/workflows/build-and-test/badge.svg?branch=master
)

Opinionated-commit-message is a Github Action which checks commit messages 
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

You can set up a Github workflow to automatically check messages. 
Put the following file in `.github/workflows/check-commit-message.yml` and 
Github should pick it and set it up.

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
        uses: mristin/opinionated-commit-message@v2.0.0-pre1
```

## Checked Events

Opinionated-commit-message verifies commit messages on the Github events
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
        uses: mristin/opinionated-commit-message@v2.0.0-pre1
        with:
          additional-verbs: 'chrusimusi, unit-test'
```

If you prefer to have your additional verbs in imperative mood in a separate
file (*e.g.*, to keep the workflow file succinct), you can supply the path
as input:

```yaml
    steps:
      - name: Check
        uses: mristin/opinionated-commit-message@v2.0.0-pre1
        with:
          path-to-additional-verbs: 'src/additional-verbs.txt'
```

## Local Usage

We translated the opinionanted-commit-message to a powershell script so that
you can include it in your local pre-commit and pre-push checks.

The script is available at: [`local/powershell/OpinionatedCommitMessage.ps1`](
local/powershell/OpinionatedCommitMessage.ps1
)

You can just copy & paste it into your project. There are no dependencies
to be installed.

## Known Issue

Commit messages of the pull request are not verified unless you trigger the 
workflow on the push as well. Github does not include the content of commit 
messages in the context payload, so checking all the commit messages of 
the pull request would involve various API call and additional complexity.

To overcome this issue, run opinionanted-commit-message both on `pull_request`
and `push`. Please upvote [this issue](
https://github.com/mristin/opinionated-commit-message/issues/28
) to signal the visibility and so that we could judge when this feature merits 
the effort.

## Contributing

If you would like to report bugs or request a feature, please create 
a [new issue](https://github.com/mristin/opinionated-commit-message/issues/new).

Please see [CONTRIBUTING.md](CONTRIBUTING.md) if you
would like to contribute to the code.

## License

This project is released under the terms of the [MIT License](LICENSE).
