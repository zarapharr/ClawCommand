function redactValue(value, rules) {
  let redacted = value;

  for (const rule of rules) {
    const regex = new RegExp(rule.pattern, 'gi');
    redacted = redacted.replace(regex, rule.replacement ?? '[REDACTED]');
  }

  if (redacted === value && value.length > 8) {
    return `${value.slice(0, 2)}***${value.slice(-2)}`;
  }

  return redacted;
}

const rules = [
  { pattern: 'sk-[A-Za-z0-9_-]{8,}', replacement: 'sk-[REDACTED]' },
  { pattern: 'gh[pousr]_[A-Za-z0-9]{10,}', replacement: 'gh_[REDACTED]' },
];

const cases = [
  {
    input: 'sk-live-AbCdEfGh123456789',
    assert: (v) => v === 'sk-[REDACTED]',
    message: 'OpenAI-style key should be fully redacted',
  },
  {
    input: 'ghp_1234567890ABCDE12345',
    assert: (v) => v === 'gh_[REDACTED]',
    message: 'GitHub token should be fully redacted',
  },
  {
    input: 'plain-secret-value-without-prefix',
    assert: (v) => v.includes('***') && v !== 'plain-secret-value-without-prefix',
    message: 'Fallback masking should apply for unknown long values',
  },
];

let failed = 0;

for (const testCase of cases) {
  const output = redactValue(testCase.input, rules);
  const passed = testCase.assert(output);

  if (!passed) {
    failed += 1;
    console.error(`FAIL: ${testCase.message}. Got: ${output}`);
  } else {
    console.log(`PASS: ${testCase.message}`);
  }
}

if (failed > 0) {
  process.exit(1);
}

console.log('Environment/session validation completed.');
