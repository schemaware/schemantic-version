const Warnings = require('../lib/warnings');

test('check schema warnings', () => {
    const schema = {};

    const warnings = Warnings.generateSchemaWarnings(schema);

    expect(warnings.length).toBe(3);
    expect(warnings[0].message).toBe('Schema is missing recommended key $schema');
    expect(warnings[1].message).toBe('Schema is missing recommended key $id');
    expect(warnings[2].message).toBe('Schema is missing recommended key description');
});

test('warn no description set', () => {
    const object = {
        type: 'string'
    };

    const warnings = Warnings.generateDocumentationWarnings(object, 'key');

    expect(warnings.length).toBe(1);
    expect(warnings[0]).toBe('key no description set');
});

test('warn no string length set', () => {
    const object = {
        type: 'string'
    };

    const warnings = Warnings.generateStringWarnings(object, 'key');

    expect(warnings.length).toBe(1);
    expect(warnings[0]).toBe('key no length set: default recommendation 16383');
});

test('warn no object additional properties set', () => {
    const object = {
        type: 'object',
        properties: {}
    };

    const warnings = Warnings.generateObjectWarnings(object, 'key');

    expect(warnings.length).toBe(1);
    expect(warnings[0]).toBe('key object does not have additionalProperties set. If you are unsure set this to false');
});

test('warn no number range set', () => {
    const object = {
        type: 'number'
    };

    const warnings = Warnings.generateNumberWarnings(object, 'key');

    expect(warnings.length).toBe(2);
    expect(warnings[0]).toBe('key no minimum value set. Consider setting an acceptable range');
    expect(warnings[1]).toBe('key no maximum value set. Consider setting an acceptable range');
});
