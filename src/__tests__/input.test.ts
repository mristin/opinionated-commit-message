import * as input from '../input';

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
