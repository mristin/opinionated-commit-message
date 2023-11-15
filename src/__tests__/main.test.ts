import fs from 'fs';
import * as core from '@actions/core';
import * as mainImpl from '../mainImpl';
import * as commitMessages from '../commitMessages';

/* eslint eqeqeq: "off", curly: "error" */

beforeEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

it('initializes the core mock to check independence of the tests.', () => {
  jest
    .spyOn(core, 'getInput')
    .mockImplementation(name => (name === 'allow-one-liners' ? 'true' : ''));
});

it('ensures that the core mocks are reset between the tests.', () => {
  // NOTE (mristin, 2022-02-13):
  // This is a regression test. Jest does not reset the mocks between the
  // individual tests. Hence, when we mock getInput on the core module, the mock
  // persists between the tests. This bug in the test code was hard to
  // understand as it only shows up if *all* the tests are run.
  const someInput = core.getInput('allow-one-liners');
  expect(someInput).toEqual('');
});

it('considers additional verbs.', async () => {
  jest
    .spyOn(commitMessages, 'retrieve')
    .mockResolvedValue(['Table SomeClass\n\nThis is a dummy commit.']);

  jest.spyOn(core, 'setFailed');

  jest
    .spyOn(core, 'getInput')
    .mockImplementation(name =>
      name === 'additional-verbs' ? 'rewrap,table' : ''
    );

  await mainImpl.run();

  expect(core.setFailed).not.toHaveBeenCalled();
});

it('considers additional verbs from path.', () => {
  jest
    .spyOn(commitMessages, 'retrieve')
    .mockResolvedValue(['Table SomeClass\n\nThis is a dummy commit.']);

  jest.spyOn(core, 'setFailed');

  const pathToVerbs = 'src/verbs.txt';

  jest
    .spyOn(core, 'getInput')
    .mockImplementation(name =>
      name === 'path-to-additional-verbs' ? pathToVerbs : ''
    );

  jest.spyOn(fs, 'existsSync').mockImplementation(path => path === pathToVerbs);

  jest.spyOn(fs, 'readFileSync').mockImplementation(path => {
    if (path === pathToVerbs) {
      return 'rewrap\ntable';
    }

    throw new Error(`Unexpected readFileSync in the unit test from: ${path}`);
  });

  expect(core.setFailed).not.toHaveBeenCalled();
});

it('considers allow-one-liners.', async () => {
  jest
    .spyOn(commitMessages, 'retrieve')
    .mockResolvedValue(['Do something']);

  jest.spyOn(core, 'setFailed');

  jest
    .spyOn(core, 'getInput')
    .mockImplementation(name => (name === 'allow-one-liners' ? 'true' : ''));

  await mainImpl.run();

  expect(core.setFailed).not.toHaveBeenCalled();
});

it('considers skip-body-check.', async () => {
  jest
    .spyOn(commitMessages, 'retrieve')
    .mockResolvedValue([
      'Change SomeClass to OtherClass\n' +
        '\n' +
        'Change SomeClass to OtherClass.' +
        'This replaces the SomeClass with OtherClass in all of the module ' +
        'since Some class was deprecated.'
    ]);

  jest.spyOn(core, 'setFailed');

  jest
    .spyOn(core, 'getInput')
    .mockImplementation(name => (name === 'skip-body-check' ? 'true' : ''));

  await mainImpl.run();

  expect(core.setFailed).not.toHaveBeenCalled();
});

it('formats properly no error message.', async () => {
  jest
    .spyOn(commitMessages, 'retrieve')
    .mockResolvedValue([
      'Change SomeClass to OtherClass\n' +
        '\n' +
        'This replaces the SomeClass with OtherClass in all of the module \n' +
        'since Some class was deprecated.'
    ]);

  jest.spyOn(core, 'setFailed');

  await mainImpl.run();

  expect(core.setFailed).not.toHaveBeenCalled();
});

it('formats properly errors on a single message.', async () => {
  jest
    .spyOn(commitMessages, 'retrieve')
    .mockResolvedValue([
      'change SomeClass to OtherClass\n\nSomeClass with OtherClass'
    ]);

  jest.spyOn(core, 'setFailed');

  await mainImpl.run();

  expect(core.setFailed).toHaveBeenCalledTimes(1);

  expect(core.setFailed).toBeCalledWith(
    'The message 1 is invalid:\n' +
      '* The subject must start with a capitalized word, but ' +
      'the current first word is: "change". ' +
      'Please capitalize to: "Change".\n' +
      'The original message was:\n' +
      'change SomeClass to OtherClass\n' +
      '\n' +
      'SomeClass with OtherClass\n'
  );
});

it('formats properly errors on two messages.', async () => {
  jest
    .spyOn(commitMessages, 'retrieve')
    .mockResolvedValue([
      `change SomeClass to OtherClass\n\nDo something`,
      'Change other subject\n\nChange body'
    ]);

  jest.spyOn(core, 'setFailed');

  await mainImpl.run();

  expect(core.setFailed).toBeCalledTimes(1);
  expect(core.setFailed).toHaveBeenCalledWith(
    'The message 1 is invalid:\n' +
      '* The subject must start with a capitalized word, ' +
      'but the current first word is: "change". ' +
      'Please capitalize to: "Change".\n' +
      'The original message was:\n' +
      'change SomeClass to OtherClass\n\nDo something\n\n' +
      'The message 2 is invalid:\n' +
      '* The first word of the subject ("Change") must not match ' +
      'the first word of the body. Please make the body more informative ' +
      'by adding more information instead of repeating the subject. ' +
      'For example, start by explaining the problem that this change ' +
      'is intended to solve or what was previously missing ' +
      '(e.g., "Previously, ....").\n' +
      'The original message was:\n' +
      'Change other subject\n\nChange body\n'
  );
});
