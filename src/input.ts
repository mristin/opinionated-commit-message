import fs from 'fs';

interface InputValues {
  hasAdditionalVerbsInput: boolean;
  pathToAdditionalVerbs: string;
  allowOneLiners: boolean;
  additionalVerbs: Set<string>;
  maxSubjectLength: number;
  minBodyLength: number;
  maxBodyLineLength: number;
  enforceSignOff: boolean;
  validatePullRequestCommits: boolean;
  skipBodyCheck: boolean;
  ignoreMergeCommits: boolean;
  ignorePatterns: RegExp[];
}

export class Inputs implements InputValues {
  public hasAdditionalVerbsInput: boolean;
  public pathToAdditionalVerbs: string;
  public allowOneLiners: boolean;
  public maxSubjectLength: number;
  public minBodyLength: number;
  public maxBodyLineLength: number;
  public skipBodyCheck: boolean;
  public validatePullRequestCommits: boolean;
  public ignoreMergeCommits: boolean;
  public ignorePatterns: RegExp[];

  // This is a complete appendix to the whitelist parsed both from
  // the GitHub action input "additional-verbs" and from the file
  // specified by the input "path-to-additional-verbs".
  additionalVerbs: Set<string>;

  public enforceSignOff: boolean;

  constructor(values: InputValues) {
    this.hasAdditionalVerbsInput = values.hasAdditionalVerbsInput;
    this.pathToAdditionalVerbs = values.pathToAdditionalVerbs;
    this.allowOneLiners = values.allowOneLiners;
    this.additionalVerbs = values.additionalVerbs;
    this.maxSubjectLength = values.maxSubjectLength;
    this.minBodyLength = values.minBodyLength;
    this.maxBodyLineLength = values.maxBodyLineLength;
    this.enforceSignOff = values.enforceSignOff;
    this.validatePullRequestCommits = values.validatePullRequestCommits;
    this.skipBodyCheck = values.skipBodyCheck;
    this.ignoreMergeCommits = values.ignoreMergeCommits;
    this.ignorePatterns = values.ignorePatterns;
  }
}

export class MaybeInputs {
  public inputs: Inputs | null;
  public error: string | null;

  constructor(inputs: Inputs | null, error: string | null) {
    if (inputs === null && error === null) {
      throw Error("Unexpected both 'inputs' and 'error' arguments to be null.");
    }

    if (inputs !== null && error !== null) {
      throw Error(
        "Unexpected both 'inputs' and 'error' arguments to be given.",
      );
    }

    this.inputs = inputs;
    this.error = error;
  }

  public mustInputs(): Inputs {
    if (this.inputs === null) {
      throw Error(
        "The field 'inputs' is expected to be set, but it is null. " +
          `The field 'error' is: ${this.error}`,
      );
    }
    return this.inputs;
  }
}

interface RawInputs {
  additionalVerbsInput?: string;
  pathToAdditionalVerbsInput?: string;
  allowOneLinersInput?: string;
  maxSubjectLengthInput?: string;
  minBodyLengthInput?: string;
  maxBodyLineLengthInput?: string;
  enforceSignOffInput?: string;
  validatePullRequestCommitsInput?: string;
  skipBodyCheckInput?: string;
  ignoreMergeCommitsInput?: string;
  ignorePatternsInput?: string;
}

const infLiteralSet = new Set<string>([
  'inf',
  'infty',
  'infinity',
  '-inf',
  '-infty',
  '-infinity',
]);

/**
 * Parse the `text` as either an integer or `Infinity`.
 *
 * If the `text` could not be parsed, return a `NaN`.
 */
function parseIntOrInfinity(text: string): number {
  if (infLiteralSet.has(text.toLowerCase())) {
    return Infinity;
  }

  return parseInt(text, 10);
}

export function parseInputs(rawInputs: RawInputs): MaybeInputs {
  const {
    additionalVerbsInput = '',
    pathToAdditionalVerbsInput = '',
    allowOneLinersInput = '',
    maxSubjectLengthInput = '',
    minBodyLengthInput = '',
    maxBodyLineLengthInput = '',
    enforceSignOffInput = '',
    validatePullRequestCommitsInput = '',
    skipBodyCheckInput = '',
    ignoreMergeCommitsInput = '',
    ignorePatternsInput = '',
  } = rawInputs;

  const additionalVerbs = new Set<string>();

  const hasAdditionalVerbsInput = additionalVerbsInput.length > 0;

  if (additionalVerbsInput) {
    for (const verb of parseVerbs(additionalVerbsInput)) {
      additionalVerbs.add(verb);
    }
  }

  if (pathToAdditionalVerbsInput) {
    if (!fs.existsSync(pathToAdditionalVerbsInput)) {
      return new MaybeInputs(
        null,
        'The file referenced by path-to-additional-verbs could ' +
          `not be found: ${pathToAdditionalVerbsInput}`,
      );
    }

    const text = fs.readFileSync(pathToAdditionalVerbsInput).toString('utf-8');

    for (const verb of parseVerbs(text)) {
      additionalVerbs.add(verb);
    }
  }

  const allowOneLiners: boolean | null = !allowOneLinersInput
    ? false
    : parseBooleanFromString(allowOneLinersInput);

  if (allowOneLiners === null) {
    return new MaybeInputs(
      null,
      'Unexpected value for allow-one-liners. ' +
        `Expected either 'true' or 'false', got: ${allowOneLinersInput}`,
    );
  }

  const maxSubjectLength: number = !maxSubjectLengthInput
    ? 50
    : parseIntOrInfinity(maxSubjectLengthInput);

  if (Number.isNaN(maxSubjectLength)) {
    return new MaybeInputs(
      null,
      'Unexpected value for max-subject-line-length. ' +
        `Expected a number or nothing, got ${maxSubjectLengthInput}`,
    );
  }

  const minBodyLength: number = !minBodyLengthInput
    ? 0
    : parseInt(minBodyLengthInput, 10);

  if (Number.isNaN(minBodyLength)) {
    return new MaybeInputs(
      null,
      'Unexpected value for min-body-length. ' +
        `Expected a number or nothing, got ${minBodyLengthInput}`,
    );
  }

  const maxBodyLineLength: number = !maxBodyLineLengthInput
    ? 72
    : parseIntOrInfinity(maxBodyLineLengthInput);

  if (Number.isNaN(maxBodyLineLength)) {
    return new MaybeInputs(
      null,
      'Unexpected value for max-body-line-length. ' +
        `Expected a number or nothing, got ${maxBodyLineLengthInput}`,
    );
  }

  const enforceSignOff: boolean | null = !enforceSignOffInput
    ? false
    : parseBooleanFromString(enforceSignOffInput);

  if (enforceSignOff === null) {
    return new MaybeInputs(
      null,
      'Unexpected value for enforce-sign-off. ' +
        `Expected either 'true' or 'false', got: ${enforceSignOffInput}`,
    );
  }

  const validatePullRequestCommits: boolean | null =
    !validatePullRequestCommitsInput
      ? false
      : parseBooleanFromString(validatePullRequestCommitsInput);

  if (validatePullRequestCommits === null) {
    return new MaybeInputs(
      null,
      'Unexpected value for validate-pull-request-commits. ' +
        `Expected either 'true' or 'false', got: ${validatePullRequestCommitsInput}`,
    );
  }

  const skipBodyCheck: boolean | null = !skipBodyCheckInput
    ? false
    : parseBooleanFromString(skipBodyCheckInput);

  if (skipBodyCheck === null) {
    return new MaybeInputs(
      null,
      'Unexpected value for skip-body-check. ' +
        `Expected either 'true' or 'false', got: ${skipBodyCheckInput}`,
    );
  }

  const ignoreMergeCommits: boolean | null = !ignoreMergeCommitsInput
    ? true
    : parseBooleanFromString(ignoreMergeCommitsInput);

  if (ignoreMergeCommits === null) {
    return new MaybeInputs(
      null,
      'Unexpected value for ignore-merge-commits. ' +
        `Expected either 'true' or 'false', got: ${ignoreMergeCommitsInput}`,
    );
  }

  const ignorePatterns: RegExp[] =
    ignorePatternsInput == null
      ? []
      : ignorePatternsInput
          .split('\n')
          .map(s => s.trim())
          .filter(s => s.length > 0)
          .map(s => new RegExp(s));

  return new MaybeInputs(
    new Inputs({
      hasAdditionalVerbsInput,
      pathToAdditionalVerbs: pathToAdditionalVerbsInput,
      allowOneLiners,
      additionalVerbs,
      maxSubjectLength,
      minBodyLength,
      maxBodyLineLength,
      enforceSignOff,
      validatePullRequestCommits,
      skipBodyCheck,
      ignoreMergeCommits,
      ignorePatterns,
    }),
    null,
  );
}

export function parseVerbs(text: string): string[] {
  const lines = text.split('\n');

  const verbs: string[] = [];
  for (const line of lines) {
    const lineVerbs = line
      .split(/[,;]/)
      .map(verb => verb.trim().toLowerCase())
      .filter(verb => verb.length > 0);

    verbs.push(...lineVerbs);
  }

  return verbs;
}

function parseBooleanFromString(text: string): boolean | null {
  if (text === '' || text.toLowerCase() === 'false' || text === '0') {
    return false;
  }

  if (text.toLowerCase() === 'true' || text === '1') {
    return true;
  }

  return null;
}
