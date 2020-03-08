const _ = require('lodash');
const Ajv = require('ajv');
const Semver = require('semver');

const jsonSchemaDraft7Schema = require('json-schema-spec-types/lib/json-schema-draft-07-schema');

const sourceSchema = require('./test-schema/v1.0.0.json');
const destinationSchema = require('./test-schema/v1.1.0.json');

const ajv = new Ajv();

const warningRequiredFields = ['$schema', '$id', 'description'];

const validFormats = ['date-time', 'time', 'date', 'email', 'idn-email', 'hostname', 'idn-hostname', 'ipv4', 'ipv6', 'uri', 'uri-reference', 'iri', 'iri-reference', 'uri-template', 'json-pointer', 'relative-json-pointer', 'regex']

function getCurrentVersion(schema) {
    const version = schema.$version;

    if (!Semver.valid(version)) {
        console.log('Schema version is not semver compatable');
    }

    return version;
}

function validateSchema(schema) {
    const validate = ajv.compile(jsonSchemaDraft7Schema);
    const valid = validate(sourceSchema);

    if (valid) {
        return {
            valid
        };
    }

    console.log('Schema is invalid', schema, ajv.errorsText(validate.errors || undefined));

    return {
        valid: false,
        errors: ajv.errorsText(validate.errors || undefined)
    }
}

function generatePropertiesWarnings(schema, parentKey) {
    Object.keys(schema.properties).forEach(key => {
        if (schema.properties[key].type === 'object' && schema.properties[key].properties) {
            generatePropertiesWarnings(schema.properties[key], `${parentKey}.${key}`);
        }

        generatePropertyWarning(schema.properties, key, parentKey);
    });
}

function generatePropertyWarning(object, key, parentKey) {
    if (!object[key]) {
        console.error('Object had no key. Something went wrong');
        return null;
    }

    generateDescriptionWarning(object, key, parentKey);

    switch (object[key].type) {
        case 'string':
            return generateStringWarnings(object, key, parentKey);
        case 'integer':
        case 'number':
            return generateNumberWarnings(object, key, parentKey);
        case 'boolean':
            break;
        case 'object':
            return generateObjectWarnings(object, key, parentKey);
        case 'array':
            break;
        case 'null':
            break;
        default:
    }
}

function generateDescriptionWarning(object, key, parentKey) {
    !object[key].description ? console.log(`${parentKey}.${key} has no description set`) : null;
}

function generateObjectWarnings(object, key, parentKey) {
    object[key].additionalProperties !== false ? console.log(`${parentKey}.${key} is an object and does not have additionalProperties set to false. This can lead to issues with schemas in the future as any key can be added to this object and create unknown datatypes`) : null;
}

function generateStringWarnings(object, key, parentKey) {
    !object[key].length ? console.log(`${parentKey}.${key} has no length set: default recommendation 16383`) : null;
}

function generateNumberWarnings(object, key, parentKey) {
    !object[key].minimum && !object[key].exclusiveMinimum ? console.log(`${parentKey}.${key} has minimum value set. You should consider setting an acceptable range`) : null;
    !object[key].maximum && !object[key].exclusiveMaximum ? console.log(`${parentKey}.${key} has maximum value set. You should consider setting an acceptable range`) : null;
}

function checkStringChanges(p1, p2, key, parentKey) {
    const changes = [];

    console.log(key, p1, p2);
    if (p1.description && p2.description && p1.description !== p2.description) {
        changes.push({ key, path: `${parentKey}.${key}`, type: p2.type, message: `${parentKey}.${key} has changed to ${p2.description}` });
    }

    return changes;
}

function fetchType(object, key) {
    if (!object[key]) {
        console.error('Object had no key. Something went wrong');
        return null;
    }

    return object[key].type;
}

function processPropertiesKeys(schema, parentKey) {

    let processedKeys = [];

    if (!schema.properties) {
        return;
    }

    const keys = Object.keys(schema.properties);

    keys.forEach(key => {
        const type = fetchType(schema.properties, key);

        processedKeys.push({
            key,
            path: `${parentKey}.${key}`,
            type: fetchType(schema.properties, key)
        });

        if (type === 'object' && schema.properties[key].properties) {
            console.log('Found a nested object');
            processedKeys = processedKeys.concat(processPropertiesKeys(schema.properties[key], key));
        }
    });

    return processedKeys;
}

function processKeyChanges(sourceSchema, destinationSchema, commonProperties) {

    let changes = [];

    commonProperties.forEach(p => {
        switch (destinationSchema.properties[p.key].type) {
            case 'string':
                changes = changes.concat(checkStringChanges(sourceSchema.properties[p.key], destinationSchema.properties[p.key], p.key));
                break;
            case 'integer':
            case 'number':
            // checkNumberChanges(sourceProperty, destinationProperty)
            case 'boolean':
                break;
            case 'object':
                // checkObjectChanges(sourceProperty, destinationProperty)
                break;
            case 'array':
                break;
            case 'null':
                break;
            default:
        }
    });

    return changes;
}

function calculateVersionChanges(removed, added, changed, currentVersion) {

    const versionChanges = {
        currentVersion,
        major: false,
        minor: false,
        patch: false,
    };

    // If we have removed keys we must release a major version as the contract has changed
    // We can ignore other changes as we will be starting from a new major version
    if (removed.length > 0) {
        versionChanges.major = true;
    }

    // If we have added keys but not removed anything we can say this change is a feature change
    // and will be backwards compatable with older subscribers of this data

    // TODO: Handle additionalProperties as we can't guarintee backwards compatibility with schemas that have allowed
    // additional untracked properties to be saved
    if (added.length > 0) {
        versionChanges.minor = true;
    }

    // If we have changed data that relates to documentation or adjusted the limitations on a key
    // that have made them more restrictive and therefore are still compatable with older consumers
    // we can rev the patch number to show that there's nothing new to be gained
    if (changed.length > 0) {
        versionChanges.patch = true;
    }

    versionChanges.newVersion = createNewSemver(versionChanges);

    return versionChanges;
}

function printChangeLog(changes) {
    console.log('\nSchema changes \n');

    changes.added.forEach(c => { console.log(`Added property ${c.path}:${c.type} to the schema`); });
    changes.removed.forEach(c => { console.log(`Removed property ${c.path}:${c.type} to the schema`); });
    changes.changed.forEach(c => { console.log(`Changed property ${c.path}:${c.type} on the schema - ${c.message}`); });

    changes.version.major ? console.log('Bumping the major version of this schema as there is a breaking change') :
        changes.version.minor ? console.log('Bumping the minor version of this schema as there has been new features added') :
            changes.version.patch ? console.log('Bumping the patch version of this schema as there has been patch changes') : '';

    console.log(`\nChanged version from ${changes.version.currentVersion} to ${changes.version.newVersion}`);

}

function printSchemaWarnings(schema, parentKey) {
    console.log('\nSchema warnings\n');

    const rootKeys = Object.keys(schema);

    const warnings = _.difference(warningRequiredFields, rootKeys);

    warnings.forEach(w => {
        console.warn(`Schema is missing recommended field ${w}`);
    });

    generatePropertiesWarnings(schema, parentKey);
}

function createNewSemver(versionChanges) {
    return versionChanges.major ? `${Semver.major(versionChanges.currentVersion) + 1}.${Semver.minor(versionChanges.currentVersion)}.${Semver.patch(versionChanges.currentVersion)}` :
        versionChanges.minor ? `${Semver.major(versionChanges.currentVersion)}.${Semver.minor(versionChanges.currentVersion) + 1}.${Semver.patch(versionChanges.currentVersion)}` :
            versionChanges.patch ? `${Semver.major(versionChanges.currentVersion)}.${Semver.minor(versionChanges.currentVersion)}.${Semver.patch(versionChanges.currentVersion) + 1}` :
                versionChanges.currentVersion;
}

(async () => {

    rootNode = '$';

    validateSchema(sourceSchema);
    validateSchema(destinationSchema);

    const currentVersion = getCurrentVersion(sourceSchema);


    const sourceA = processPropertiesKeys(sourceSchema, rootNode);
    const sourceB = processPropertiesKeys(destinationSchema, rootNode);


    const commonProperties = _.intersectionBy(sourceA, sourceB, 'path');

    const removedProperties = _.differenceBy(sourceA, commonProperties, 'path');
    const addedProperties = _.differenceBy(sourceB, commonProperties, 'path');

    console.log('Removed', removedProperties, 'Added', addedProperties);
    console.log('SourceB', sourceB);

    const changedProperties = processKeyChanges(sourceSchema, destinationSchema, commonProperties, rootNode);

    const versionChanges = calculateVersionChanges(removedProperties, addedProperties, changedProperties, currentVersion);

    printChangeLog({
        removed: removedProperties || [],
        added: addedProperties || [],
        changed: changedProperties || [],
        version: versionChanges || []
    });

    printSchemaWarnings(destinationSchema, rootNode);
})()
