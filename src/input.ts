import fs from 'fs';

export class Inputs {
  public hasAdditionalVerbsInput: boolean;
  public pathToAdditionalVerbs: string;
  public allowOneLiners: boolean;
  public skipBodyCheck: boolean;

  // This is a complete appendix to the whiltelist parsed both from
  // the GitHub action input "additional-verbs" and from the file
  // specified by the input "path-to-additional-verbs".
  additionalVerbs: Set<string>;

  public enforceSignOff: boolean;

  constructor(
    hasAdditionalVerbsInput: boolean,
    pathToAdditionalVerbs: string,
    allowOneLiners: boolean,
    additionalVerbs: Set<string>,
    enforceSignOff: boolean,
    skipBodyCheck: boolean
  ) {
    this.hasAdditionalVerbsInput = hasAdditionalVerbsInput;
    this.pathToAdditionalVerbs = pathToAdditionalVerbs;
    this.allowOneLiners = allowOneLiners;
    this.additionalVerbs = additionalVerbs;
    this.enforceSignOff = enforceSignOff;
    this.skipBodyCheck = skipBodyCheck;
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
        "Unexpected both 'inputs' and 'error' arguments to be given."
      );
    }

    this.inputs = inputs;
    this.error = error;
  }

  public mustInputs(): Inputs {
    if (this.inputs === null) {
      throw Error(
        "The field 'inputs' is expected to be set, but it is null. " +
          `The field 'error' is: ${this.error}`
      );
    }
    return this.inputs;
  }
}

export function parseInputs(
  additionalVerbsInput: string,
  pathToAdditionalVerbsInput: string,
  allowOneLinersInput: string,
  enforceSignOffInput: string,
  skipBodyCheckInput: string
): MaybeInputs {
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
          `not be found: ${pathToAdditionalVerbsInput}`
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
        `Expected either 'true' or 'false', got: ${allowOneLinersInput}`
    );
  }

  const enforceSignOff: boolean | null = !enforceSignOffInput
    ? false
    : parseBooleanFromString(enforceSignOffInput);

  if (enforceSignOff === null) {
    return new MaybeInputs(
      null,
      'Unexpected value for enforce-sign-off. ' +
        `Expected either 'true' or 'false', got: ${enforceSignOffInput}`
    );
  }

  const skipBodyCheck: boolean | null = !skipBodyCheckInput
    ? false
    : parseBooleanFromString(skipBodyCheckInput);

  if (skipBodyCheck === null) {
    return new MaybeInputs(
      null,
      'Unexpected value for skip-body-check. ' +
        `Expected either 'true' or 'false', got: ${skipBodyCheckInput}`
    );
  }

  return new MaybeInputs(
    new Inputs(
      hasAdditionalVerbsInput,
      pathToAdditionalVerbsInput,
      allowOneLiners,
      additionalVerbs,
      enforceSignOff,
      skipBodyCheck
    ),
    null
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
