const Commander = require('commander');
const Chalk = require('chalk');
const Path = require('path');
const Package = require('../package.json');

const Changelog = require('./changelog');

const program = new Commander.Command();

program.version(Package.version);
program
    .name('schemantic-version')
    .arguments('<schemaA> <schemaB>')
    .description('Compare two schemas for changes')
    .option('-i, --ignore', 'Ignore warnings')
    .action((schemaFileA, schemaFileB, opt) => {
        console.log(Chalk`{bold JSON schema manager}\n`);

        const schemaPathA = `${process.cwd()}/${schemaFileA}`;
        const schemaPathB = `${process.cwd()}/${schemaFileB}`;

        console.log(Chalk`schemaA: {bold ${schemaPathA}}`);
        console.log(Chalk`schemaB: {bold ${schemaPathB}}`);

        const schemaA = require(schemaPathA);
        const schemaB = require(schemaPathB);

        Changelog.printChangelog(schemaA, schemaB, opt);
    })
    .parse(process.argv);

