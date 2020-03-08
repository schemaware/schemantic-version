const Chalk = require('chalk');
const Changes = require('./changes');
const Warnings = require('./warnings');
const Versioning = require('./versioning');

const internals = {};

internals.generate = (schemaA, schemaB) => {

    const output = {};

    output.changes = Changes.generateSchemaChanges(schemaA, schemaB);
    output.warnings = Warnings.generateSchemaWarnings(schemaB);
    output.versionCurrent = Versioning.getCurrentVersion(schemaA);
    output.versionRevision = Versioning.calculateVersionChanges(output.changes);
    output.versionNew = Versioning.createNewSemver(output.versionCurrent, output.versionRevision);

    return output;
};

internals.printChangelog = (schemaA, schemaB, options) => {
    const changelog = internals.generate(schemaA, schemaB);

    console.log(Chalk`Current version: {bold ${changelog.versionCurrent}}`);
    console.log(Chalk`New version: {bold ${changelog.versionNew}}`);

    if (changelog.changes.major && changelog.changes.major.length) {
        console.log(Chalk.red.bold('\nBreaking changes ❌\n'));
        changelog.changes.major.forEach(c => {
            console.log(Chalk`{red - {bold ${c.simplePath}} ${c.message}}`);
        });
    }

    if (changelog.changes.minor && changelog.changes.minor.length) {
        console.log(Chalk.green.bold('\nMinor changes ✅\n'));
        changelog.changes.minor.forEach(c => {
            console.log(Chalk`{green + {bold ${c.simplePath}} ${c.message}}`);
        });
    }

    if (changelog.changes.patch && changelog.changes.patch.length) {

        console.log(Chalk.blueBright.bold('\nPatch changes 🩹\n'));
        changelog.changes.patch.forEach(c => {
            console.log(Chalk`{blueBright -+ {bold ${c.simplePath}} ${c.message}}`);
        });
    }

    if (changelog.warnings && changelog.warnings.length && !options.ignore) {
        console.log(Chalk.yellow.bold('\nSchema warnings ⚠️\n'));
        changelog.warnings.forEach(w => {
            console.log(Chalk`{yellow ${w}}`);
        });
    }
};

module.exports = internals;
