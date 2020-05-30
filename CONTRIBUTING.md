# Contributing

## Build & Test

Change to the root directory of the cloned repository.

First install the dependencies with: `npm install`

Various `npm` scripts are provided to build, check code quality and test. Please invoke:

* `npm run build` to build the source code to `lib/` directory
* `npm run format` to format the code
* `npm run lint` to run the linter over the code
* `npm run pack` to bundle the packages in `dist/` directory
* `npm run test` to run the test suite
* `npm run all` to run all the checks and build

## Pull Requests

I develop using the feature branches, see this section of the Git book:
https://git-scm.com/book/en/v2/Git-Branching-Branching-Workflows.

Please prefix the branch with your user name 
(*e.g.,* `mristin/Add-some-feature`).

The commit messages follow the guidelines from 
from https://chris.beams.io/posts/git-commit:

* Separate subject from body with a blank line
* Limit the subject line to 50 characters
* Capitalize the subject line
* Do not end the subject line with a period
* Use the imperative mood in the subject line
* Wrap the body at 72 characters
* Use the body to explain *what* and *why* (instead of *how*)

If you would like to contribute in code, please fork the repository and create
the feature branch in your forked repository. See [this Github tuturial](
https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request-from-a-fork
) for more guidance. 
