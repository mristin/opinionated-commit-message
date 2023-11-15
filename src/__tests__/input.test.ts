import * as input from '../input';
import fs from 'fs';

it('parses commas, semi-colons and newlines.', () => {
  const text = 'one, two; three\nfour\n';

  const verbs = input.parseVerbs(text);

  expect(verbs).toEqual(['one', 'two', 'three', 'four']);
});

it('trims before and after.', () => {
  const text = 'one, two  ; three\r\nfour\r\n';

  const verbs = input.parseVerbs(text);

  expect(verbs).toEqual(['one', 'two', 'three', 'four']);
});

it('parses the inputs.', () => {
  const pathToVerbs = '/some/path/to/additional/verbs';

  (fs as any).existsSync = (path: string) => path === pathToVerbs;

  (fs as any).readFileSync = (path: string) => {
    if (path === pathToVerbs) {
      return 'rewrap\ntable';
    }

    throw new Error(`Unexpected readFileSync in the unit test from: ${path}`);
  };

  const maybeInputs = input.parseInputs({
    additionalVerbsInput: 'integrate\nanalyze',
    pathToAdditionalVerbsInput: pathToVerbs,
    allowOneLinersInput: 'true',
    maxSubjectLengthInput: '90',
    maxBodyLineLengthInput: '100',
    enforceSignOffInput: 'true',
    validatePullRequestCommitsInput: 'true',
    skipBodyCheckInput: 'true',
  });

  expect(maybeInputs.error).toBeNull();

  const inputs = maybeInputs.mustInputs();
  expect(inputs.hasAdditionalVerbsInput).toBeTruthy();
  expect(inputs.pathToAdditionalVerbs).toEqual(pathToVerbs);
  expect(inputs.additionalVerbs).toEqual(
    new Set<string>(['rewrap', 'table', 'integrate', 'analyze'])
  );
  expect(inputs.allowOneLiners).toBeTruthy();
  expect(inputs.maxSubjectLength).toEqual(90);
  expect(inputs.maxBodyLineLength).toEqual(100);
  expect(inputs.enforceSignOff).toBeTruthy();
  expect(inputs.validatePullRequestCommits).toBeTruthy();
  expect(inputs.skipBodyCheck).toBeTruthy();
});
