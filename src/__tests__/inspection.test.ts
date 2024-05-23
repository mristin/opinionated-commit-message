import {Inputs} from '../input';
import * as input from '../input';
import * as inspection from '../inspection';

const defaultInputs: input.Inputs = input.parseInputs({}).mustInputs();

it('reports no errors on correct multi-line message.', () => {
  const message =
    'Change SomeClass to OtherClass\n' +
    '\n' +
    'This replaces the SomeClass with OtherClass in all of the module \n' +
    'since Some class was deprecated.';

  const errors = inspection.check(message, defaultInputs);
  expect(errors).toEqual([]);
});

it('reports no errors on OK multi-line message with allowed one-liners.', () => {
  const message =
    'Change SomeClass to OtherClass\n' +
    '\n' +
    'This replaces the SomeClass with OtherClass in all of the module \n' +
    'since Some class was deprecated.';

  const errors = inspection.check(message, defaultInputs);
  expect(errors).toEqual([]);
});

it('reports no errors on OK single-line message with allowed one-liners.', () => {
  const inputs = input.parseInputs({allowOneLinersInput: 'true'}).mustInputs();

  const message = 'Change SomeClass to OtherClass';

  const errors = inspection.check(message, inputs);
  expect(errors).toEqual([]);
});

it('tolerates hash code in the subject.', () => {
  const message =
    'Unify all license files to LICENSE.txt naming (#43)\n' +
    '\n' +
    'The license files naming was inconsistent (`LICENSE.TXT` and \n' +
    '`LICENSE.txt`). This makes them all uniform (`LICENSE.txt`).';

  const errors = inspection.check(message, defaultInputs);
  expect(errors).toEqual([]);
});

it('reports too few lines with disallowed one-liners.', () => {
  const message = 'Change SomeClass to OtherClass';
  const errors = inspection.check(message, defaultInputs);
  expect(errors).toEqual([
    'Expected at least three lines (subject, empty, body), but got: 1',
  ]);
});

it('reports no errors on any message when body check is disabled.', () => {
  const message =
    'Change SomeClass to OtherClass\n' +
    '\n' +
    'This replaces the SomeClass with OtherClass in all of the module ' +
    'since Some class was deprecated. This is long message should not ' +
    'be checked.';

  const inputCheckingBody = input
    .parseInputs({skipBodyCheckInput: 'false'})
    .mustInputs();

  expect(inspection.check(message, inputCheckingBody)).not.toEqual([]);

  const inputNotCheckingBody = input
    .parseInputs({skipBodyCheckInput: 'true'})
    .mustInputs();

  expect(inspection.check(message, inputNotCheckingBody)).toEqual([]);
});

it('reports missing body with disallowed one-liners.', () => {
  const message = 'Change SomeClass to OtherClass\n\n';
  const errors = inspection.check(message, defaultInputs);
  expect(errors).toEqual(['Unexpected empty body']);
});

it('reports missing body with allowed one-liners.', () => {
  const inputs = input.parseInputs({allowOneLinersInput: 'true'}).mustInputs();

  const message = 'Change SomeClass to OtherClass\n';
  const errors = inspection.check(message, inputs);
  expect(errors).toEqual([
    'Expected at least three lines (subject, empty, body) ' +
      'in a multi-line message, but got: 2',
  ]);
});

it('reports on missing empty line between subject and body.', () => {
  const message =
    'Change SomeClass to OtherClass\n' +
    '---\n' +
    'This replaces the SomeClass with OtherClass in all of the module \n' +
    'since Some class was deprecated.';

  const errors = inspection.check(message, defaultInputs);
  expect(errors).toEqual([
    'Expected an empty line between the subject and the body, ' +
      'but got a second line of length: 3',
  ]);
});

it('reports the subject starting with a non-word.', () => {
  const message = 'ABC12\n\nThis does something.';

  const errors = inspection.check(message, defaultInputs);
  expect(errors).toEqual([
    'Expected the subject to start with a verb in imperative mood ' +
      'consisting of letters and possibly dashes in-between, ' +
      'but the subject was: "ABC12". ' +
      'Please re-write the subject so that it starts ' +
      'with a verb in imperative mood.',
  ]);
});

it('reports the subject starting with a non-capitalized word.', () => {
  const message =
    'change SomeClass to OtherClass\n' +
    '\n' +
    'This replaces the SomeClass with OtherClass in all of the module \n' +
    'since Some class was deprecated.';

  const errors = inspection.check(message, defaultInputs);
  expect(errors).toEqual([
    'The subject must start with a capitalized word, ' +
      'but the current first word is: "change". ' +
      'Please capitalize to: "Change".',
  ]);
});

it(
  'reports the subject starting with a non-verb ' +
    'with no additional verbs given.',
  () => {
    const message =
      'Replaced SomeClass to OtherClass\n' +
      '\n' +
      'This replaces the SomeClass with OtherClass in all of the module \n' +
      'since Some class was deprecated.';

    const errors = inspection.check(message, defaultInputs);
    expect(errors.length).toBe(1);
    expect(errors).toEqual([
      'The subject must start with a verb in imperative mood, ' +
        'but it started with: "Replaced". ' +
        'Whether the word is in imperative mood is determined by ' +
        'whitelisting. The general whitelist is available at ' +
        'https://github.com/mristin/opinionated-commit-message/' +
        'blob/master/src/mostFrequentEnglishVerbs.ts. ' +
        'You can whitelist additional verbs using "additional-verbs" input ' +
        'to your GitHub action (currently no additional verbs were thus ' +
        'specified). Moreover, you can also whitelist additional verbs ' +
        'in a file given as "path-to-additional-verbs" input to ' +
        'your GitHub action (currently no whitelist file was specified). ' +
        'Please check the whitelist and either change the first word ' +
        'of the subject or whitelist the verb.',
    ]);
  },
);

it(
  'reports the subject starting with a non-verb ' +
    'with additional verbs given as direct input.',
  () => {
    const inputs = input
      .parseInputs({
        additionalVerbsInput: 'table',
        allowOneLinersInput: 'false',
      })
      .mustInputs();

    const message =
      'Replaced SomeClass to OtherClass\n' +
      '\n' +
      'This replaces the SomeClass with OtherClass in all of the module \n' +
      'since Some class was deprecated.';

    const errors = inspection.check(message, inputs);

    expect(errors.length).toBe(1);
    expect(errors).toEqual([
      'The subject must start with a verb in imperative mood, ' +
        'but it started with: "Replaced". ' +
        'Whether the word is in imperative mood is ' +
        'determined by whitelisting. The general whitelist is available at ' +
        'https://github.com/mristin/opinionated-commit-message/' +
        'blob/master/src/mostFrequentEnglishVerbs.ts. You can whitelist ' +
        'additional verbs using "additional-verbs" input to your GitHub ' +
        'action (currently one or more additional verbs were thus specified). ' +
        'Moreover, you can also whitelist additional verbs in a file given ' +
        'as "path-to-additional-verbs" input to your GitHub action ' +
        '(currently no whitelist file was specified). Please check the ' +
        'whitelist and either change the first word of the subject or ' +
        'whitelist the verb.',
    ]);
  },
);

it(
  'reports the subject starting with a non-verb ' +
    'with additional verbs given in a path.',
  () => {
    const inputs = new input.Inputs({
      hasAdditionalVerbsInput: false,
      pathToAdditionalVerbs: '/some/path',
      allowOneLiners: false,
      additionalVerbs: new Set<string>('table'),
      maxSubjectLength: 50,
      minBodyLength: 0,
      maxBodyLineLength: 72,
      enforceSignOff: false,
      validatePullRequestCommits: false,
      skipBodyCheck: false,
      ignoreMergeCommits: false,
      ignorePatterns: [],
    });

    const message =
      'Replaced SomeClass to OtherClass\n' +
      '\n' +
      'This replaces the SomeClass with OtherClass in all of the module \n' +
      'since Some class was deprecated.';

    const errors = inspection.check(message, inputs);

    expect(errors.length).toBe(1);
    expect(errors).toEqual([
      'The subject must start with a verb in imperative mood, ' +
        'but it started with: "Replaced". ' +
        'Whether the word is in imperative mood is ' +
        'determined by whitelisting. The general whitelist is available at ' +
        'https://github.com/mristin/opinionated-commit-message/' +
        'blob/master/src/mostFrequentEnglishVerbs.ts. You can whitelist ' +
        'additional verbs using "additional-verbs" input to your GitHub ' +
        'action (currently no additional verbs were thus specified). ' +
        'Moreover, you can also whitelist additional verbs in a file given ' +
        'as "path-to-additional-verbs" input to your GitHub action ' +
        '(currently the file is: /some/path). Please check the ' +
        'whitelist and either change the first word of the subject or ' +
        'whitelist the verb.',
    ]);
  },
);

it('accepts the subject starting with an additional verb.', () => {
  const inputs = input
    .parseInputs({
      additionalVerbsInput: 'table',
      allowOneLinersInput: 'false',
    })
    .mustInputs();

  const message = 'Table that for me\n\nThis is a dummy commit.';
  const errors = inspection.check(message, inputs);
  expect(errors).toEqual([]);
});

it('reports the subject ending in a dot.', () => {
  const message =
    'Change SomeClass to OtherClass.\n' +
    '\n' +
    'This replaces the SomeClass with OtherClass in all of the module \n' +
    'since Some class was deprecated.';

  const errors = inspection.check(message, defaultInputs);
  expect(errors).toEqual([
    "The subject must not end with a dot ('.'). " +
      'Please remove the trailing dot(s).',
  ]);
});

it('reports an incorrect one-line message with allowed one-liners.', () => {
  const inputs = input.parseInputs({allowOneLinersInput: 'true'}).mustInputs();

  const message = 'Change SomeClass to OtherClass.';

  const errors = inspection.check(message, inputs);
  expect(errors).toEqual([
    "The subject must not end with a dot ('.'). " +
      'Please remove the trailing dot(s).',
  ]);
});

it('reports too long a subject line.', () => {
  const message =
    'Change SomeClass to OtherClass in order to handle upstream deprecation\n' +
    '\n' +
    'This replaces the SomeClass with OtherClass in all of the module\n' +
    'since Some class was deprecated.';

  const errors = inspection.check(message, defaultInputs);
  expect(errors).toEqual([
    `The subject exceeds the limit of 50 characters ` +
      `(got: 70, JSON: "Change SomeClass to OtherClass in order to handle upstream deprecation").` +
      'Please shorten the subject to make it more succinct.',
  ]);
});

it('reports too long a subject line with custom max length.', () => {
  const message =
    'Change SomeClass to OtherClass in order to handle upstream deprecation\n' +
    '\n' +
    'This replaces the SomeClass with OtherClass in all of the module\n' +
    'since Some class was deprecated.';

  const inputs = input.parseInputs({maxSubjectLengthInput: '60'}).mustInputs();

  const errors = inspection.check(message, inputs);
  expect(errors).toEqual([
    `The subject exceeds the limit of 60 characters ` +
      `(got: 70, JSON: "Change SomeClass to OtherClass in order to handle upstream deprecation").` +
      'Please shorten the subject to make it more succinct.',
  ]);
});

it('reports too short a body length.', () => {
  const message =
    'Change SomeClass to OtherClass\n' +
    '\n' +
    'This replaces the SomeClass with OtherClass in all of the module\n' +
    'since Some class was deprecated.';

  const inputs = input.parseInputs({minBodyLengthInput: '100'}).mustInputs();

  const errors = inspection.check(message, inputs);
  expect(errors).toEqual([
    `The body must contain at least 100 characters. ` +
    `The body contains 97 characters.`
  ]);
});

it('accepts a body length.', () => {
  const message =
    'Change SomeClass to OtherClass\n' +
    '\n' +
    'This replaces the SomeClass with OtherClass in all of the module\n' +
    'since Some class was deprecated.';

  const inputs = input.parseInputs({minBodyLengthInput: '97'}).mustInputs();

  const errors = inspection.check(message, inputs);
  expect(errors).toEqual([]);
});

it('accepts a no minimum body length.', () => {
  const message =
    'Change SomeClass to OtherClass\n' +
    '\n' +
    'This changes SomeClass to OtherClass';

  const inputs = input.parseInputs({}).mustInputs();

  const errors = inspection.check(message, inputs);
  expect(errors).toEqual([]);
});

it('reports too long a body line.', () => {
  const message =
    'Change SomeClass to OtherClass\n' +
    '\n' +
    'This replaces the SomeClass with OtherClass in all of the module ' +
    'since Some class was deprecated.';

  const errors = inspection.check(message, defaultInputs);
  expect(errors).toEqual([
    'The line 3 of the message (line 1 of the body) exceeds the limit of ' +
      '72 characters. The line contains 97 characters: ' +
      '"This replaces the SomeClass with OtherClass in all of the module since ' +
      'Some class was deprecated.". ' +
      'Please reformat the body so that all the lines fit 72 characters.',
  ]);
});

it('reports too long a body line with custom max length.', () => {
  const message =
    'Change SomeClass to OtherClass\n' +
    '\n' +
    'This replaces the SomeClass with OtherClass in all of the module ' +
    'since Some class was deprecated.';

  const inputs = input.parseInputs({maxBodyLineLengthInput: '90'}).mustInputs();

  const errors = inspection.check(message, inputs);
  expect(errors).toEqual([
    'The line 3 of the message (line 1 of the body) exceeds the limit of ' +
      '90 characters. The line contains 97 characters: ' +
      '"This replaces the SomeClass with OtherClass in all of the module since ' +
      'Some class was deprecated.". ' +
      'Please reformat the body so that all the lines fit 90 characters.',
  ]);
});

it('accepts a body line of exactly 72 characters.', () => {
  const message =
    'Do something\n' +
    '\n' +
    'This patch fixes a typo in the readme file where this project ' +
    'was called\n' +
    'dead-csharp instead of doctest-csharp.\n' +
    '1234567890' +
    '1234567890' +
    '1234567890' +
    '1234567890' +
    '1234567890' +
    '1234567890' +
    '1234567890' +
    '12';

  const errors = inspection.check(message, defaultInputs);
  expect(errors).toEqual([]);
});

it('ignores the carriage return.', () => {
  const message =
    'Do something\n' +
    '\n' +
    'This patch fixes a typo in the readme file where this project ' +
    'was called\r\n' +
    'dead-csharp instead of doctest-csharp.\r\n' +
    '1234567890' +
    '1234567890' +
    '1234567890' +
    '1234567890' +
    '1234567890' +
    '1234567890' +
    '1234567890' +
    '12';

  const errors = inspection.check(message, defaultInputs);
  expect(errors).toEqual([]);
});

it('accepts body that does not start with a word.', () => {
  const message = 'Change SomeClass to OtherClass\n\n* Do something';

  const errors = inspection.check(message, defaultInputs);
  expect(errors).toEqual([]);
});

it('reports duplicate starting word in subject and body.', () => {
  const message =
    'Change SomeClass to OtherClass\n' +
    '\n' +
    'Change SomeClass so that OtherClass does not conflict.';

  const errors = inspection.check(message, defaultInputs);
  expect(errors).toEqual([
    'The first word of the subject ("Change") must not match ' +
      'the first word of the body. ' +
      'Please make the body more informative by adding more information ' +
      'instead of repeating the subject. For example, start by explaining ' +
      'the problem that this change is intended to solve or what was ' +
      'previously missing (e.g., "Previously, ....").',
  ]);
});

it.each([
  // Local merge to default branch
  "Merge branch 'fantastic-feature'",
  // Local merge to alternate branch
  "Merge branch 'V20DataModel' into miho/Conform-to-spec",
  // Local merge from remote
  "Merge remote-tracking branch 'origin/remote-branch' into local-branch",
  // Web UI merge pull request
  'Merge pull request #11 from acme-corp/the-project',
])('ignores merge messages.', message => {
  const inputs = new Inputs({
    ...defaultInputs,
    ignoreMergeCommits: true,
    // Ensure all messages would fail if not for ignoring merge commits.
    maxSubjectLength: 1,
  });

  const errors = inspection.check(message, inputs);
  expect(errors).toEqual([]);
});

it('ignores messages with given pattern.', () => {
  const inputs = new Inputs({
    ...defaultInputs,
    ignorePatterns: [/\[ALWAYS VALID]/],
    // Ensure all messages would fail if not for the ignore pattern.
    maxSubjectLength: 1,
  });

  const message =
    'Change SomeClass to OtherClass\n' +
    '\n' +
    'This replaces the SomeClass with OtherClass in all of the module.\n' +
    '[ALWAYS VALID] ';

  const errors = inspection.check(message, inputs);
  expect(errors).toEqual([]);
});

it('ignores URL on a separate line.', () => {
  const url =
    'http://mristin@some-domain.com/some/very/very/very/very/' +
    'very/very/very/long/path/index.html';

  const message = `Do something

This patch does something with the URL:
${url}
The next line conforms to the line length.`;

  const errors = inspection.check(message, defaultInputs);
  expect(errors).toEqual([]);
});

it('ignores URL on a separate line, but reports non-conform lines.', () => {
  const long = 'long, long, long, long, long, long, long, long, long';
  const url =
    'http://mristin@some-domain.com/some/very/very/very/very/' +
    'very/very/very/long/path/index.html';

  const message = `Do something

This ${long} patch does something with the URL.
${url}`;

  const errors = inspection.check(message, defaultInputs);
  expect(errors).toEqual([
    'The line 3 of the message (line 1 of the body) exceeds ' +
      'the limit of 72 characters. The line contains 92 characters: ' +
      `"This ${long} patch does something with the URL.". ` +
      'Please reformat the body so that all the lines fit 72 characters.',
  ]);
});

it('ignores link definitions.', () => {
  const url =
    'http://mristin@some-domain.com/some/very/very/very/very/' +
    'very/very/very/long/path/index.html';

  const message = `Do something

This patch does something with the URL: [1]

[1]: ${url}

The next line conforms to the line length.`;

  const errors = inspection.check(message, defaultInputs);
  expect(errors).toEqual([]);
});

it('ignores link definitions, but reports non-conform lines.', () => {
  const url =
    'http://mristin@some-domain.com/some/very/very/very/very/' +
    'very/very/very/long/path/index.html';
  const long = 'long, long, long, long, long, long, long, long, long';

  const message = `Do something

This patch does something with the URL: [1]

[1]: ${url}

The ${long} line is too long.`;

  const errors = inspection.check(message, defaultInputs);
  expect(errors).toEqual([
    'The line 7 of the message (line 5 of the body) exceeds ' +
      'the limit of 72 characters. The line contains 74 characters: ' +
      `"The ${long} line is too long.". ` +
      'Please reformat the body so that all the lines fit 72 characters.',
  ]);
});

it('accepts the valid body when enforcing the sign-off.', () => {
  const inputs = input.parseInputs({enforceSignOffInput: 'true'}).mustInputs();

  const message = `Do something

It does something.

Signed-off-by: Somebody <some@body.com>

Signed-off is not necessarily the last line.

And multiple sign-offs are possible!
Signed-off-by: Somebody Else <some@body-else.com>
`;

  const errors = inspection.check(message, inputs);
  expect(errors).toEqual([]);
});

it('rejects invalid sign-offs.', () => {
  const inputs = input.parseInputs({enforceSignOffInput: 'true'}).mustInputs();

  const message = `Do something

It does something.

None of the following satisfy the sign-off:
Signed-off-by Random Developer <random@developer.example.org>
signed-off-by: Random Developer <random@developer.example.org>
Signed-off-by: Random Developer <randomdeveloper.example.org>
Signed-off-by: Random Developer (random@developer.example.org)
Signed-off-by: Random Developer random@developer.example.org
Signed off by: Random Developer <random@developer.example.org>
Signed_off_by: Random Developer <random@developer.example.org>
Signed-off-by: Random Developer
`;

  const errors = inspection.check(message, inputs);
  expect(errors).toEqual([
    "The body does not contain any 'Signed-off-by: ' line. Did you sign off the commit with `git commit --signoff`?",
  ]);
});
