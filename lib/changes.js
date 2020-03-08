const _ = require('lodash');

const internals = {};

internals.generateSchemaChanges = (sourceSchema, destinationSchema) => {

    const changes = {
        major: [],
        minor: [],
        patch: []
    };

    const sourceA = internals.processPropertiesKeys(sourceSchema);
    const sourceB = internals.processPropertiesKeys(destinationSchema);

    const commonProperties = _.intersectionBy(sourceA, sourceB, 'path');

    changes.removed = _.differenceBy(sourceA, commonProperties, 'path').map(r => ({...r, message: 'property was removed'}));
    changes.added = _.differenceBy(sourceB, commonProperties, 'path').map(r => ({...r, message: 'property was added'}));
    changes.changed = internals.processPropertyChanges(sourceSchema, destinationSchema, commonProperties);

    changes.major = [...changes.major, ...changes.removed];
    changes.minor = [...changes.minor, ...changes.added];

    changes.changed.forEach(c => {
        switch (c.changeType) {
            case 'major': changes.major.push(c); break;
            case 'minor': changes.minor.push(c); break;
            case 'patch': changes.patch.push(c); break;
            default: throw new Error('Change does not have a change type');
        }
    });

    return changes;
};

internals.processPropertiesKeys = (schema, parentKey) => {

    let processedKeys = [];

    if (!schema.properties) {
        return processedKeys;
    }

    const keys = Object.keys(schema.properties);

    keys.forEach(key => {
        const type = schema.properties[key].type;
        const simplePath = parentKey ? `${parentKey.simplePath}.${key}` : key;
        const path = parentKey ? `${parentKey.path}.properties.${key}` : `properties.${key}`;

        const processedKey = {
            key,
            path,
            simplePath,
            type
        };

        processedKeys.push(processedKey);

        if (type === 'object' && schema.properties[key].properties) {
            processedKeys = processedKeys.concat(internals.processPropertiesKeys(schema.properties[key], processedKey));
        }
    });

    return processedKeys;
}

internals.processPropertyChanges = (sourceSchema, destinationSchema, commonProperties) => {

    let changes = [];

    commonProperties.forEach(commonProperty => {
        const propertyA = _.get(sourceSchema, commonProperty.path);
        const propertyB = _.get(destinationSchema, commonProperty.path);

        changes = [...changes, ...internals.documentationChanges(propertyA, propertyB, commonProperty)];

        switch (propertyB.type) {
            case 'string':
                changes = [...changes, ...internals.stringChanges(propertyA, propertyB, commonProperty)];
                break;
            case 'integer':
            case 'number':
                changes = [...changes, ...internals.numberChanges(propertyA, propertyB, commonProperty)];
                break;
            case 'boolean':
                changes = [...changes, ...internals.booleanChanges(propertyA, propertyB, commonProperty)];
                break;
            case 'object':
                changes = [...changes, ...internals.objectChanges(propertyA, propertyB, commonProperty)];
                break;
            case 'array':
                changes = [...changes, ...internals.arrayChanges(propertyA, propertyB, commonProperty)];
                break;
            case 'null':
                changes = [...changes, ...internals.nullChanges(propertyA, propertyB, commonProperty)];
                break;
            default:
        }
    });

    return changes;
};


internals.documentationChanges = (p1, p2, p) => {
    const changes = [];

    if (p1.description && p2.description && p1.description !== p2.description) {
        changes.push({ changeType: 'patch', key: p.key, path: p.path, simplePath: p.simplePath, type: p2.type, message: `changed description from '${p1.description}' to '${p2.description}'` });
    }

    return changes;
};

internals.stringChanges = (p1, p2, p) => {
    const changes = [];

    if (p1.maxLength && p2.maxLength && p1.maxLength !== p2.maxLength) {
        const change = { key: p.key, path: p.path, simplePath: p.simplePath, type: p2.type, message: `changed length from '${p1.maxLength}' to '${p2.maxLength}'` };

        change.changeType = (p2.maxLength < p1.maxLength) ? 'major' : 'patch';

        changes.push(change);
    }

    return changes;
};

internals.numberChanges = (p1, p2, p) => {
    const changes = [];

    if (p1.length && p2.length && p1.length !== p2.length) {
        changes.push({ key: p.key, path: p.path, simplePath: p.simplePath, type: p2.type, message: `changed X from '${p1.lrngth}' to '${p2.length}'` });
    }

    return changes;
};

internals.booleanChanges = (p1, p2, p) => {
    const changes = [];

    if (p1.length && p2.length && p1.length !== p2.length) {
        changes.push({ key: p.key, path: p.path, simplePath: p.simplePath, type: p2.type, message: `changed X from '${p1.lrngth}' to '${p2.length}'` });
    }

    return changes;
};

internals.arrayChanges = (p1, p2, p) => {
    const changes = [];

    if (p1.maxmaxLength && p2.maxmaxLength && p1.maxLength !== p2.maxLength) {
        changes.push({ key: p.key, path: p.path, simplePath: p.simplePath, type: p2.type, message: `changed X from '${p1.maxLength}' to '${p2.maxLength}'` });
    }

    return changes;
};

internals.objectChanges = (p1, p2, p) => {
    const changes = [];

    if (p1.length && p2.length && p1.length !== p2.length) {
        changes.push({ key: p.key, path: p.path, simplePath: p.simplePath, type: p2.type, message: `changed X from '${p1.lrngth}' to '${p2.length}'` });
    }

    return changes;
};

internals.nullChanges = (p1, p2, p) => {
    const changes = [];

    if (p1.length && p2.length && p1.length !== p2.length) {
        changes.push({ key: p.key, path: p.path, simplePath: p.simplePath, type: p2.type, message: `changed X from '${p1.lrngth}' to '${p2.length}'` });
    }

    return changes;
};

module.exports = internals;
