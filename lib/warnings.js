
const _ = require('lodash');

const internals = {};

const warningRequiredFields = ['$schema', '$id', 'description'];

internals.generateSchemaWarnings = (schema) => {

    const rootKeys = Object.keys(schema);

    let rootWarnings = _.difference(warningRequiredFields, rootKeys);

    rootWarnings = rootWarnings.map(w => ({
        key: w,
        message: `Schema is missing recommended key ${w}`
    }));

    rootWarnings = rootWarnings.concat(internals.generatePropertyWarnings(schema));

    return rootWarnings;
};


internals.generatePropertyWarnings = (schema, parentKey) => {
    let warnings = [];

    if (!schema.properties) {
        return warnings;
    }

    Object.keys(schema.properties).forEach(key => {
        warnings = warnings.concat(internals.generatePropertyWarning(schema.properties[key], key, parentKey));

        if (schema.properties[key].type === 'object' && schema.properties[key].properties) {
            warnings = warnings.concat(internals.generatePropertyWarnings(schema.properties[key], key));
        }
    });

    return warnings;
};

internals.generatePropertyWarning = (object, key, parentKey) => {

    let warnings = [];

    const path = parentKey ? `${parentKey}.${key}` : key;

    warnings = [...warnings, ...internals.generateDocumentationWarnings(object, path)];

    switch (object.type) {
        case 'string':
            warnings = [...warnings, ...internals.generateStringWarnings(object, path)];
            break;
        case 'integer':
        case 'number':
            warnings = [...warnings, ...internals.generateNumberWarnings(object, path)];
            break;
        case 'boolean':
            warnings = [...warnings, ...internals.generateBooleanWarnings(object, path)];
            break;
        case 'object':
            warnings = [...warnings, ...internals.generateObjectWarnings(object, path)];
            break;
        case 'array':
            warnings = [...warnings, ...internals.generateArrayWarnings(object, path)];
            break;
        case 'null':
            warnings = [...warnings, ...internals.generateNullWarnings(object, path)];
            break;
        default:
    }

    return warnings;
};

internals.generateDocumentationWarnings = (object, path) => {
    const warnings = [];

    if (!object.description) {
        warnings.push(`${path} no description set`)
    }

    return warnings;
};

internals.generateObjectWarnings = (object, path) => {
    const warnings = [];

    if (object.additionalProperties === undefined) {
        warnings.push(`${path} object does not have additionalProperties set. If you are unsure set this to false`);
    }

    return warnings;
};

internals.generateNumberWarnings = (object, path) => {
    const warnings = [];

    if (!object.minimum && !object.exclusiveMinimum) {
        warnings.push(`${path} no minimum value set. Consider setting an acceptable range`)
    }

    if (!object.maximum && !object.exclusiveMaximum) {
        warnings.push(`${path} no maximum value set. Consider setting an acceptable range`)
    }

    return warnings;
};

internals.generateStringWarnings = (object, path) => {
    const warnings = [];

    if (!object.length) {
        warnings.push(`${path} no length set: default recommendation 16383`);
    }

    return warnings;
};

internals.generateBooleanWarnings = (object, path) => {
    const warnings = [];

    if (!object.default) {
        warnings.push(`${path} set a default state for booleans to avoid trooleans`);
    }

    return warnings;
};

internals.generateArrayWarnings = (object, path) => {
    const warnings = [];

    if (!object.items || object.items.length === 0) {
        warnings.push(`${path} set the type of items allowed to be stored in this array`);
    }

    if (!object.maxItems || object.maxItems === 0) {
        warnings.push(`${path} set the maximum amount of items allowed in this array`);
    }

    if (!object.uniqueItems) {
        warnings.push(`${path} explicitly define if unique values are expected`);
    }

    return warnings;
};

internals.generateNullWarnings = (object, path) => {
    const warnings = [];

    warnings.push(`${path} avoid using null as a placeholder until you know the data type required`);
    return warnings;
};

module.exports = internals;
