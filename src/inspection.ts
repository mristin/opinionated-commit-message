import * as mostFrequentEnglishVerbs from './mostFrequentEnglishVerbs';
import * as input from './input';

interface SubjectBody {
  subject: string;
  bodyLines: string[];
}

interface MaybeSubjectBody {
  subjectBody?: SubjectBody;
  errors: string[];
}

function splitLines(message: string): string[] {
  const lines = message.split('\n');
  for (let i = 0; i < lines.length; i++) {
    lines[i] = lines[i].replace(/\r$/, '');
  }

  return lines;
}

function splitSubjectBody(lines: string[]): MaybeSubjectBody {
  const result: MaybeSubjectBody = {errors: []};

  if (lines.length === 0 || lines.length === 1) {
    result.errors.push(
      'Expected at least three lines (subject, empty, body), ' +
        `but got: ${lines.length}`,
    );
    return result;
  } else if (lines.length === 2) {
    result.errors.push(
      'Expected at least three lines (subject, empty, body) ' +
        `in a multi-line message, but got: ${lines.length}`,
    );
    return result;
  }

  if (lines[1].length !== 0) {
    result.errors.push(
      `Expected an empty line between the subject and the body, ` +
        `but got a second line of length: ${lines[1].length}`,
    );
  }

  result.subjectBody = {subject: lines[0], bodyLines: lines.slice(2)};

  return result;
}

const allLettersRe = new RegExp('^[a-zA-Z][a-zA-Z-]+$');
const firstWordBeforeSpaceRe = new RegExp('^([a-zA-Z][a-zA-Z-]+)\\s');
const suffixHashCodeRe = new RegExp('\\s?\\(\\s*#[a-zA-Z_0-9]+\\s*\\)$');

function extractFirstWord(text: string): string | null {
  if (text.length === 0) {
    return null;
  }

  if (text.match(allLettersRe)) {
    return text;
  } else {
    const match = firstWordBeforeSpaceRe.exec(text);
    if (!match) {
      return null;
    }

    return match[1];
  }
}

function capitalize(word: string): string {
  if (word.length === 0) {
    return '';
  } else if (word.length === 1) {
    return word.toUpperCase();
  } else {
    return word[0].toUpperCase() + word.slice(1).toLowerCase();
  }
}

function errorMessageOnNonVerb(
  firstWord: string,
  inputs: input.Inputs,
): string {
  const parts = [
    'The subject must start with a verb in imperative mood, ' +
      `but it started with: ${JSON.stringify(firstWord)}. ` +
      'Whether the word is in imperative mood is determined by ' +
      'whitelisting. The general whitelist is available at ' +
      'https://github.com/mristin/opinionated-commit-message/' +
      'blob/master/src/mostFrequentEnglishVerbs.ts.',
  ];

  if (!inputs.hasAdditionalVerbsInput) {
    parts.push(
      'You can whitelist additional verbs using ' +
        '"additional-verbs" input to your GitHub action ' +
        '(currently no additional verbs were thus specified).',
    );
  } else {
    parts.push(
      'You can whitelist additional verbs using ' +
        '"additional-verbs" input to your GitHub action ' +
        `(currently one or more additional verbs were thus ` +
        'specified).',
    );
  }

  if (inputs.pathToAdditionalVerbs.length === 0) {
    parts.push(
      'Moreover, you can also whitelist additional verbs in a file ' +
        'given as "path-to-additional-verbs" input to your GitHub action ' +
        '(currently no whitelist file was specified).',
    );
  } else {
    parts.push(
      'Moreover, you can also whitelist additional verbs in a file ' +
        'given as "path-to-additional-verbs" input to your GitHub action ' +
        `(currently the file is: ${inputs.pathToAdditionalVerbs}).`,
    );
  }

  parts.push(
    'Please check the whitelist and either change the first word ' +
      'of the subject or whitelist the verb.',
  );

  return parts.join(' ');
}

function checkSubject(subject: string, inputs: input.Inputs): string[] {
  // Pre-condition
  for (const verb of inputs.additionalVerbs) {
    if (verb.length === 0) {
      throw new Error(`Unexpected empty additional verb`);
    }

    if (verb !== verb.toLowerCase()) {
      throw new Error(
        `All additional verbs expected in lower case, but got: ${verb}`,
      );
    }
  }

  const errors: string[] = [];

  // Tolerate the hash code referring, e.g., to a pull request.
  // These hash codes are usually added automatically by GitHub and
  // similar services.
  const subjectWoCode = subject.replace(suffixHashCodeRe, '');

  if (subjectWoCode.length > inputs.maxSubjectLength) {
    errors.push(
      `The subject exceeds the limit of ${inputs.maxSubjectLength} characters ` +
        `(got: ${subject.length}, JSON: ${JSON.stringify(subjectWoCode)}).` +
        'Please shorten the subject to make it more succinct.',
    );
  }

  const firstWord = extractFirstWord(subjectWoCode);
  if (!firstWord) {
    errors.push(
      'Expected the subject to start with a verb in imperative mood ' +
        'consisting of letters and possibly dashes in-between, ' +
        `but the subject was: ${JSON.stringify(subjectWoCode)}. ` +
        'Please re-write the subject so that it starts with ' +
        'a verb in imperative mood.',
    );
  } else {
    const capitalized = capitalize(firstWord);
    if (firstWord !== capitalized) {
      errors.push(
        'The subject must start with a capitalized word, ' +
          `but the current first word is: ${JSON.stringify(firstWord)}. ` +
          `Please capitalize to: ${JSON.stringify(capitalized)}.`,
      );
    }

    if (
      !mostFrequentEnglishVerbs.SET.has(firstWord.toLowerCase()) &&
      !inputs.additionalVerbs.has(firstWord.toLowerCase())
    ) {
      /*
       (mristin, 2020-09-09): It might be worthwhile to refactor the rendering
       of the error messages to a separate module and use classes to represent
       the errors. The complexity is still manageable, so it is not yet the
       moment to do so since the refactoring would be quite time-consuming.

       Originally, I did not foresee that error messages need such a large
       information content.
       */

      errors.push(errorMessageOnNonVerb(firstWord, inputs));
    }
  }

  if (subjectWoCode.endsWith('.')) {
    errors.push(
      "The subject must not end with a dot ('.'). " +
        'Please remove the trailing dot(s).',
    );
  }

  return errors;
}

const urlLineRe = new RegExp('^[^ ]+://[^ ]+$');
const linkDefinitionRe = new RegExp('^\\[[^\\]]+]\\s*:\\s*[^ ]+://[^ ]+$');

function checkBody(
  subject: string,
  bodyLines: string[],
  inputs: input.Inputs,
): string[] {
  const errors: string[] = [];

  if (bodyLines.length === 0) {
    errors.push(
      'At least one line is expected in the body, but got empty body.',
    );
    return errors;
  }

  if (bodyLines.length === 1 && bodyLines[0].trim() === '') {
    errors.push('Unexpected empty body');
    return errors;
  }

  for (const [i, line] of bodyLines.entries()) {
    if (urlLineRe.test(line) || linkDefinitionRe.test(line)) {
      continue;
    }

    if (line.length > inputs.maxBodyLineLength) {
      errors.push(
        `The line ${i + 3} of the message (line ${i + 1} of the body) ` +
          `exceeds the limit of ${inputs.maxBodyLineLength} characters. ` +
          `The line contains ${line.length} characters: ` +
          `${JSON.stringify(line)}. ` +
          'Please reformat the body so that all the lines fit ' +
          `${inputs.maxBodyLineLength} characters.`,
      );
    }
  }

  const bodyFirstWord = extractFirstWord(bodyLines[0]);

  if (bodyFirstWord) {
    const subjectFirstWord = extractFirstWord(subject);

    if (subjectFirstWord) {
      if (subjectFirstWord.toLowerCase() === bodyFirstWord.toLowerCase()) {
        errors.push(
          'The first word of the subject ' +
            `(${JSON.stringify(subjectFirstWord)}) ` +
            'must not match the first word of the body. ' +
            'Please make the body more informative by adding more ' +
            'information instead of repeating the subject. ' +
            'For example, start by explaining the problem that this change ' +
            'is intended to solve or what was previously missing ' +
            '(e.g., "Previously, ....").',
        );
      }
    }
  }

  return errors;
}

const signedOffByRe = new RegExp(
  '^\\s*Signed-off-by:\\s*[^<]+\\s*<[^@>, ]+@[^@>, ]+>\\s*$',
);

function checkSignedOff(bodyLines: string[]): string[] {
  const errors: string[] = [];

  let matches = 0;
  for (const line of bodyLines) {
    if (signedOffByRe.test(line)) {
      matches++;
    }
  }

  if (matches === 0) {
    errors.push(
      "The body does not contain any 'Signed-off-by: ' line. " +
        'Did you sign off the commit with `git commit --signoff`?',
    );
  }

  return errors;
}

const mergeMessageRe = new RegExp(
  "^Merge branch '[^\\000-\\037\\177 ~^:?*[]+' " +
    'into [^\\000-\\037\\177 ~^:?*[]+$',
);

export function check(message: string, inputs: input.Inputs): string[] {
  const errors: string[] = [];

  if (mergeMessageRe.test(message)) {
    return errors;
  }

  const lines = splitLines(message);

  if (lines.length === 0) {
    errors.push(`The message is empty.`);
    return errors;
  } else if (lines.length === 1 && inputs.allowOneLiners) {
    errors.push(...checkSubject(lines[0], inputs));
  } else {
    const maybeSubjectBody = splitSubjectBody(lines);
    if (maybeSubjectBody.errors.length > 0) {
      errors.push(...maybeSubjectBody.errors);
    } else {
      if (maybeSubjectBody.subjectBody === undefined) {
        throw Error('Unexpected undefined subjectBody');
      }
      const subjectBody = maybeSubjectBody.subjectBody;

      errors.push(...checkSubject(subjectBody.subject, inputs));

      if (!inputs.skipBodyCheck) {
        errors.push(
          ...checkBody(subjectBody.subject, subjectBody.bodyLines, inputs),
        );
      }

      if (inputs.enforceSignOff) {
        errors.push(...checkSignedOff(subjectBody.bodyLines));
      }
    }
  }

  // Post-condition
  for (const error of errors) {
    if (error.endsWith('\n')) {
      throw Error(`Unexpected error ending in a new-line character: ${error}`);
    }
  }

  return errors;
}
