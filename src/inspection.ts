import * as mostFrequentEnglishVerbs from './mostFrequentEnglishVerbs';

interface SubjectBody {
  subject: string;
  bodyLines: string[];
}

interface MaybeSubjectBody {
  subjectBody?: SubjectBody;
  errors: string[];
}

function splitSubjectBody(message: string): MaybeSubjectBody {
  const result: MaybeSubjectBody = {errors: []};

  const lines = message.split('\n');
  if (lines.length < 3) {
    result.errors.push(
      `Expected at least three lines (subject, empty, body), ` +
        `but got: ${lines.length}`
    );
    return result;
  }

  if (lines[1].length !== 0) {
    result.errors.push(
      `Expected an empty line between the subject and the body, ` +
        `but got a second line of length: ${lines[1].length}`
    );
  }

  result.subjectBody = {subject: lines[0], bodyLines: lines.slice(2)};

  return result;
}

const capitalizedWordRe = new RegExp('^([A-Z][a-z]*)[^a-zA-Z]');

const suffixHashCodeRe = new RegExp('\\s?\\(\\s*#[a-zA-Z_0-9]+\\s*\\)$');

function checkSubject(subject: string): string[] {
  const errors: string[] = [];

  // Tolerate the hash code referring, e.g., to a pull request.
  // These hash codes are usually added automatically by Github and
  // similar services.
  const subjectWoCode = subject.replace(suffixHashCodeRe, '');

  if (subjectWoCode.length > 50) {
    errors.push(
      `The subject exceeds the limit of 50 characters ` +
        `(got: ${subject.length}, JSONified: ${JSON.stringify(subjectWoCode)})`
    );
  }

  const match = capitalizedWordRe.exec(subjectWoCode);

  if (!match) {
    errors.push(
      'The subject must start with a capitalized verb (e.g., "Change").'
    );
  } else {
    if (match.length < 2) {
      throw Error(
        'Expected at least one group to match the first capitalized word, ' +
          'but got none.'
      );
    }
    const word = match[1];
    if (!mostFrequentEnglishVerbs.SET.has(word.toLowerCase())) {
      errors.push(
        'The subject must start in imperative mood with one of the ' +
          `most frequent English verbs, but got: ${JSON.stringify(word)}. ` +
          'Please see ' +
          'https://github.com/mristin/opinionated-commit-message/blob/master/' +
          'src/mostFrequentEnglishVerbs.ts ' +
          'for a complete list.'
      );
    }
  }

  if (subjectWoCode.endsWith('.')) {
    errors.push("The subject must not end with a dot ('.').");
  }

  return errors;
}

function checkBody(subject: string, bodyLines: string[]): string[] {
  const errors: string[] = [];

  if (bodyLines.length === 0) {
    errors.push(
      'At least one line is expected in the body, ' + 'but got empty body.'
    );
  }

  for (const [i, line] of bodyLines.entries()) {
    if (line.length > 72) {
      errors.push(
        `The line ${i + 3} of the message (line ${i + 1} of the body) ` +
          'exceeds the limit of 72 characters. ' +
          `The line contains ${line.length} characters: ${JSON.stringify(line)}`
      );
    }
  }

  const bodyFirstWordMatch = capitalizedWordRe.exec(bodyLines[0]);

  if (!bodyFirstWordMatch) {
    errors.push('The body must start with a capitalized word.');
  } else {
    const bodyFirstWord = bodyFirstWordMatch[1];

    const subjectFirstWordMatch = capitalizedWordRe.exec(subject);
    if (
      subjectFirstWordMatch !== undefined &&
      subjectFirstWordMatch !== null &&
      subjectFirstWordMatch.length > 0
    ) {
      const subjectFirstWord = subjectFirstWordMatch[1];
      if (subjectFirstWord.toLowerCase() === bodyFirstWord.toLowerCase()) {
        errors.push(
          'The first word of the subject must not match ' +
            'the first word of the body.'
        );
      }
    }
  }

  return errors;
}

export function check(message: string): string[] {
  const errors: string[] = [];

  const maybeSubjectBody = splitSubjectBody(message);
  if (maybeSubjectBody.errors.length > 0) {
    errors.push(...maybeSubjectBody.errors);
  } else {
    if (maybeSubjectBody.subjectBody === undefined) {
      throw Error('Unexpected undefined subjectBody');
    }
    const subjectBody = maybeSubjectBody.subjectBody;

    errors.push(...checkSubject(subjectBody.subject));
    errors.push(...checkBody(subjectBody.subject, subjectBody.bodyLines));
  }

  // Post-condition
  for (const error in errors) {
    if (error.endsWith('\n')) {
      throw Error(`Unexpected error ending in a new-line character: ${error}`);
    }
  }

  return errors;
}
