'use strict';
const Semver = require('semver');

const internals = {};

internals.getCurrentVersion = (schema) => {
    if (!schema.$version) {
        throw new Error('Schema does not have a $version field');
    }

    const version = schema.$version;

    if (!Semver.valid(version)) {
        throw new Error('Schema does not have a valid version');
    }

    return version;
};

internals.calculateVersionChanges = (changes) => {

    const versionChanges = {
        major: false,
        minor: false,
        patch: false
    };

    // If we have removed keys we must release a major version as the contract has changed
    // We can ignore other changes as we will be starting from a new major version
    if (changes.removed.length > 0) {
        versionChanges.major = true;
    }

    // If we have added keys but not removed anything we can say this change is a feature change
    // and will be backwards compatable with older subscribers of this data

    // TODO: Handle additionalProperties as we can't guarintee backwards compatibility with schemas that have allowed
    // additional untracked properties to be saved
    if (changes.added.length > 0) {
        versionChanges.minor = true;
    }

    // If we have changed data that relates to documentation or adjusted the limitations on a key
    // that have made them more restrictive and therefore are still compatable with older consumers
    // we can rev the patch number to show that there's nothing new to be gained
    if (changes.changed.length > 0) {
        versionChanges.patch = true;
    }

    return versionChanges;
};

internals.createNewSemver = (currentVersion, versionChanges) => {
    return versionChanges.major ? `${Semver.major(currentVersion) + 1}.${Semver.minor(currentVersion)}.${Semver.patch(currentVersion)}` :
        versionChanges.minor ? `${Semver.major(currentVersion)}.${Semver.minor(currentVersion) + 1}.${Semver.patch(currentVersion)}` :
            versionChanges.patch ? `${Semver.major(currentVersion)}.${Semver.minor(currentVersion)}.${Semver.patch(currentVersion) + 1}` :
                currentVersion;
};

module.exports = internals;
