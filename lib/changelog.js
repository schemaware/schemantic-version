const Chalk = require('chalk');
const Path = require('path');
const Changes = require('./changes');
const Warnings = require('./warnings');
const Versioning = require('./versioning');

const internals = {};

internals.generate = (schemaA, schemaB) => {

    const output = {};

    const changes =  Changes.generateSchemaChanges(schemaA, schemaB);


    output.changes = changes;
    output.change = internals.changeType(changes);
    output.warnings = Warnings.generateSchemaWarnings(schemaB);
    output.versionCurrent = Versioning.getCurrentVersion(schemaA);
    output.versionRevision = Versioning.calculateVersionChanges(changes);
    output.versionNew = Versioning.createNewSemver(output.versionCurrent, output.versionRevision);

    return output;
};

internals.changeType = (changes) => {

    const versions = Versioning.calculateVersionChanges(changes);
    return versions.major ? 'major' :
        versions.minor ? 'minor' :
        versions.patch ? 'patch' :
        '';
};

internals.print = (changelog, options) => {

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

internals.toMarkdown = (changelog, options = {}) => {

    let msg =`
Current version: ${changelog.versionCurrent}
New version: ${changelog.versionNew}\n`;

    if (changelog.changes.major && changelog.changes.major.length) {
        msg += `\n##### Breaking changes ❌\n`;
        changelog.changes.major.forEach(c => {
            msg += `*${c.simplePath}* ${c.message}\n`;
        });
    }

    if (changelog.changes.minor && changelog.changes.minor.length) {
        msg += '\n##### Minor changes ✅\n';
        changelog.changes.minor.forEach(c => {
            msg += `*${c.simplePath}* ${c.message}\n`;
        });
    }

    if (changelog.changes.patch && changelog.changes.patch.length) {

        msg += `\n##### Patch changes 🩹\n'`;
        changelog.changes.patch.forEach(c => {
            msg += `*${c.simplePath}* ${c.message}\n`;
        });
    }

    if (changelog.warnings && changelog.warnings.length && !options.ignore) {
        msg += `\n##### Schema warnings ⚠️\n`;
        changelog.warnings.forEach(w => {
            msg += `${w}\n`;
        });
    }

    return msg;
};

internals.template = (templateFile, changelog, options = {}) => {

    const path =  __dirname + '/templates';
    const dots = require('dot').process({ path, templateSettings: { strip: true } })
    console.log('Dots', dots, path);

    return dots.commit(changelog);
};

module.exports = internals;
