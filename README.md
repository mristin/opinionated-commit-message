# opinionated-commit-message

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
        uses: mristin/opinionated-commit-message@v1.0.0
```

## Contributing

If you would like to report bugs or request a feature, please create 
a [new issue](https://github.com/mristin/opinionated-commit-message/issues/new).

Please see [CONTRIBUTING.md](CONTRIBUTING.md) if you
would like to contribute to the code.

## License

This project is released under the terms of the [MIT License](LICENSE).
