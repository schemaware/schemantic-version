
const Changes = require('../lib/changes');

test('check documentation changes', () => {

    const sourceField = {
        type: 'string',
        description: 'source description'
    };

    const destField = {
        type: 'string',
        description: 'destination description'
    };

    const changes = Changes.documentationChanges(sourceField, destField, { key: 'key', path: 'properties.key' });

    expect(changes.length).toBe(1);
    expect(changes[0].message).toBe(`changed description from 'source description' to 'destination description'`);
});

test('check major string changes', () => {

    const sourceField = {
        type: 'string',
        maxLength: 64
    };

    const destField = {
        type: 'string',
        maxLength: 32
    };

    const changes = Changes.stringChanges(sourceField, destField, { key: 'key', path: 'properties.key' });

    expect(changes.length).toBe(1);
    expect(changes[0].message).toBe(`changed length from '64' to '32'`);
    expect(changes[0].changeType).toBe('major');
});

test('check patch string changes', () => {

    const sourceField = {
        type: 'string',
        maxLength: 32
    };

    const destField = {
        type: 'string',
        maxLength: 64
    };

    const changes = Changes.stringChanges(sourceField, destField, { key: 'key', path: 'properties.key' });

    expect(changes.length).toBe(1);
    expect(changes[0].message).toBe(`changed length from '32' to '64'`);
    expect(changes[0].changeType).toBe('patch');
});

test('schema changes', () => {
    const schemaA = require('./schemas/v1.0.0/sample.schema.json');
    const schemaB = require('./schemas/v2.0.0/sample.schema.json');

    const changes = Changes.generateSchemaChanges(schemaA, schemaB);

    expect(changes.major.length).toBe(2);
    expect(changes.major[0].key).toBe('url');
    expect(changes.major[1].key).toBe('dtstart');

    expect(changes.minor.length).toBe(6);
    expect(changes.minor[0].key).toBe('category_number');
    expect(changes.minor[0].path).toBe('properties.category_number');
    expect(changes.minor[0].simplePath).toBe('category_number');
    expect(changes.minor[1].key).toBe('number');
    expect(changes.minor[1].path).toBe('properties.nested_object.properties.number');
    expect(changes.minor[1].simplePath).toBe('nested_object.number');

    expect(changes.patch.length).toBe(4);
    expect(changes.patch[0].key).toBe('dtstart');
    expect(changes.patch[0].path).toBe('properties.dtstart');
    expect(changes.patch[0].simplePath).toBe('dtstart');
    expect(changes.patch[0].message).toBe(`changed description from 'Event starting time' to 'Event starting time in UTC'`);

    expect(changes.patch[1].key).toBe('dtend');
    expect(changes.patch[1].path).toBe('properties.dtend');
    expect(changes.patch[1].simplePath).toBe('dtend');
    expect(changes.patch[1].message).toBe(`changed description from 'Event ending time' to 'Event ending time in UTC'`);

    expect(changes.patch[2].key).toBe('location');
    expect(changes.patch[2].path).toBe('properties.location');
    expect(changes.patch[2].simplePath).toBe('location');
    expect(changes.patch[2].message).toBe(`changed length from '32' to '64'`);

    expect(changes.patch[3].key).toBe('string');
    expect(changes.patch[3].path).toBe('properties.nested_object.properties.string');
    expect(changes.patch[3].simplePath).toBe('nested_object.string');
    expect(changes.patch[3].message).toBe(`changed description from 'schemaA' to 'schemaB'`);
});

test('empty schema changes', () => {
    const schema = {

    };

    const changes = Changes.processPropertiesKeys(schema);

    expect(changes.length).toBe(0);
});