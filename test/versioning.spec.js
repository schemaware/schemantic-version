const Versioning = require('../lib/versioning');

test('get schema version', () => {
    const schema = require('./schemas/v1.0.0/sample.schema.json');

    const version = Versioning.getCurrentVersion(schema);

    expect(version).toBe('1.0.0');
});

test('get schema version throw error if no $version exists', () => {
    const schema = {
        $id: 'id'
    };

    expect.assertions(1);

    try {
        Versioning.getCurrentVersion(schema);
    } catch (error) {
        expect(error.message).toBe('Schema does not have a $version field');
    }

});

test('get schema version throw error if invalid $version exists', () => {
    const schema = {
        $id: 'id',
        $version: 'version'
    };

    expect.assertions(1);

    try {
        Versioning.getCurrentVersion(schema);
    } catch (error) {
        expect(error.message).toBe('Schema does not have a valid version');
    }

});

test('bump major version', () => {

    const currentVersion = '1.0.0';

    const versionChanges = {
        major: true,
        minor: false,
        patch: false
    };

    const version = Versioning.createNewSemver(currentVersion, versionChanges);
    expect(version).toBe('2.0.0');
});

test('bump minor version', () => {

    const currentVersion = '1.0.0';

    const versionChanges = {
        major: false,
        minor: true,
        patch: false
    };

    const version = Versioning.createNewSemver(currentVersion, versionChanges);
    expect(version).toBe('1.1.0');
});

test('bump patch version', () => {

    const currentVersion = '1.0.0';

    const versionChanges = {
        major: false,
        minor: false,
        patch: true
    };

    const version = Versioning.createNewSemver(currentVersion, versionChanges);
    expect(version).toBe('1.0.1');
});

test('bump major version only even with minor and patch changes', () => {

    const currentVersion = '1.0.0';

    const versionChanges = {
        major: true,
        minor: true,
        patch: true
    };

    const version = Versioning.createNewSemver(currentVersion, versionChanges);
    expect(version).toBe('2.0.0');
});

test('no version changes', () => {

    const currentVersion = '1.0.0';

    const versionChanges = {
        major: false,
        minor: false,
        patch: false
    };

    const version = Versioning.createNewSemver(currentVersion, versionChanges);
    expect(version).toBe('1.0.0');
});