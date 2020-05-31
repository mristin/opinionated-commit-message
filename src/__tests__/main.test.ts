import * as core from '@actions/core';

import * as mainImpl from '../mainImpl';
import * as commitMessages from '../commitMessages';

jest.mock('@actions/core');
jest.mock('../commitMessages');

/* eslint eqeqeq: "off", curly: "error" */

it('formats properly no error message.', () => {
  (commitMessages.retrieve as any).mockImplementation(() => [
    'Change SomeClass to OtherClass\n' +
      '\n' +
      'This replaces the SomeClass with OtherClass in all of the module \n' +
      'since Some class was deprecated.'
  ]);

  const mockSetFailed = jest.fn();
  (core as any).setFailed = mockSetFailed;

  mainImpl.run();

  expect(mockSetFailed.mock.calls).toEqual([]);
});

it('formats properly a single error message.', () => {
  (commitMessages.retrieve as any).mockImplementation(() => [
    'SomeClass to OtherClass\n\nSomeClass with OtherClass'
  ]);

  const mockSetFailed = jest.fn();
  (core as any).setFailed = mockSetFailed;

  mainImpl.run();
  expect(mockSetFailed.mock.calls).toEqual([
    [
      'The message 1 is invalid:\n' +
        '* The subject must start with a capitalized verb (e.g., "Change").\n' +
        '* The body must start with a capitalized word.\n' +
        'The original message was:\n' +
        'SomeClass to OtherClass\n' +
        '\n' +
        'SomeClass with OtherClass\n'
    ]
  ]);
});

it('formats properly two error messages.', () => {
  (commitMessages.retrieve as any).mockImplementation(() => [
    'SomeClass to OtherClass\n\nSomeClass with OtherClass',
    'Change other subject\n\nChange body'
  ]);

  const mockSetFailed = jest.fn();
  (core as any).setFailed = mockSetFailed;

  mainImpl.run();

  expect(mockSetFailed.mock.calls).toEqual([
    [
      'The message 1 is invalid:\n' +
        '* The subject must start with a capitalized verb (e.g., "Change").\n' +
        '* The body must start with a capitalized word.\n' +
        'The original message was:\n' +
        'SomeClass to OtherClass\n' +
        '\n' +
        'SomeClass with OtherClass\n' +
        '\n' +
        'The message 2 is invalid:\n' +
        '* The first word of the subject must not match ' +
        'the first word of the body.\n' +
        'The original message was:\n' +
        'Change other subject\n' +
        '\n' +
        'Change body\n'
    ]
  ]);
});
