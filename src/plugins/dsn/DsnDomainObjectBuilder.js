
define([
    './DsnUtils'
], function (
    DsnUtils
) {
    'use strict';

    /**
     * Construct a new Deep Space Network domain object builder.
     *
     * @memberof plugins/dsn
     * @constructor
     */
    function DsnDomainObjectBuilder() {
        this.DSN_NAMESPACE = 'deep.space.network';
        this.domainObjects = {};
    }

    /**
     * Add the composition property.
     *
     * @private
     * @param {Element} stationElement - The station to parse.
     * @returns {object} An object containing the station's data.
     */
    DsnDomainObjectBuilder.prototype.addComposition = function (domainObject, composition) {
        var key = DsnUtils.serializeIdentifier(domainObject.identifier);
        this.domainObjects[key].composition = composition;
        return this.domainObjects[key];
    };

    DsnDomainObjectBuilder.prototype.addTelemetryPanel = function (domainObject) {

    }

    DsnDomainObjectBuilder.prototype.buildTelemetryValue = function (key, name, hints, units) {
        var telemetryValue = {
            name: DsnUtils.getDisplayName(name),
            key: key,
            hints: hints
        };

        if (units) {
            telemetryValue.units = units;
        }

        return telemetryValue;
    };

    DsnDomainObjectBuilder.prototype.buildTelemetryValues = function (domainObject, hints, units) {
        


        var telemetryValue = {
            name: domainObject.name,
            key: domainObject.identifier.key,
            hints: hints
        };

        if (units) {
            telemetryValue.units = units;
        }

        return [telemetryValue];
    };

    /**
     * Add the telemetry property.
     *
     * @param {Element} stationElement - The station to parse.
     * @returns {object} An object containing the station's data.
     */
    DsnDomainObjectBuilder.prototype.addTelemetry = function (domainObject, telemetryValues) {
        var key = DsnUtils.serializeIdentifier(domainObject.identifier);

        this.domainObjects[key].telemetry = {
            values: telemetryValues
        };

        return this.domainObjects[key];
    };

    /**
     * Add the telemetry property.
     *
     * @param {Element} stationElement - The station to parse.
     * @returns {object} An object containing the station's data.
     */
    // DsnDomainObjectBuilder.prototype.addTelemetry = function (domainObject, hints, units) {
    //     var key = DsnUtils.serializeIdentifier(domainObject.identifier),
    //         telemetryValue = {
    //             name: domainObject.name,
    //             key: domainObject.identifier.key,
    //             hints: hints
    //         };

    //     if (units) {
    //         telemetryValue.units = units;
    //     }

    //     this.domainObjects[key].telemetry = {
    //         values: [telemetryValue]
    //     };

    //     return this.domainObjects[key];
    // };

    /**
     * Build the base domain object.
     *
     * @private
     * @param {Element} stationElement - The station to parse.
     * @returns {object} An object containing the station's data.
     */
    DsnDomainObjectBuilder.prototype.buildDomainObject = function (key, name, type, location) {
        var domainObject = {
                identifier: {
                    namespace: this.DSN_NAMESPACE,
                    key: key
                },
                name: name,
                type: type
            },
            domainObjectKey = DsnUtils.serializeIdentifier(domainObject.identifier);

        if (location) {
            domainObject.location = this.DSN_NAMESPACE + ':' + location;
        }

        this.domainObjects[domainObjectKey] = domainObject;

        return this.domainObjects[domainObjectKey];
    };

    DsnDomainObjectBuilder.prototype.buildTelemetryDomainObjects = function (dishId, data, parentDomainObject) {
        var composition = [],
            dishId,
            domainObject,
            hints = {
                domain: 1
            },
            key,
            keyPrefix,
            name;

        if (parentDomainObject.identifier.key.endsWith('antenna')) {
            dishId = parentDomainObject.identifier.key.match(/dss[0-9]+/)[0];
            keyPrefix = dishId + '.antenna.';
        }

        for (var prop in data) {
            if (parentDomainObject.identifier.key.endsWith('antenna')) {
                key = dishId + '.antenna.' + prop;
            } else {
                key = parentDomainObject.identifier.key + '.' + prop;
            }

            if (/\w+\.\w+/.test(prop)) {
                name = DsnUtils.splitAndCapitalise(prop);
            }  else if (prop === 'ddor' || prop === 'mspa') {
                name = prop.toUpperCase();
            } else {
                name = DsnUtils.capitaliseFirstLetter(prop);
            }

            domainObject = this.builder.buildDomainObject(key, name, 'dsn.telemetry', parentDomainObject.identifier.key);
            domainObject = this.builder.addTelemetry(domainObject, hints);
            composition.push(DsnUtils.serializeIdentifier(domainObject.identifier));
        }

        return composition;
    };

    DsnDomainObjectBuilder.prototype.buildChildrenDomainObjects = function (parentDomainObject, data) {
        var composition = [],
            domainObject,
            hints = {
                domain: 1
            },
            name,
            telemetryValues = [];

        for (var prop in data) {
            name = prop.slice(parentDomainObject.identifier.key + 1);
            domainObject = this.buildDomainObject(parentDomainObject.identifier.key + '.' + prop, 
                DsnUtils.getDisplayName(name), 'dsn.telemetry', parentDomainObject.identifier.key);

                values.push(this.buildTelemetryValue(prop, name, hints));

            antennaDomainObject = this.addTelemetry(antennaDomainObject, values);
            domainObject = this.addTelemetry(domainObject, hints);
            composition.push(DsnUtils.serializeIdentifier(domainObject.identifier));
        }

        return composition;
    };

    DsnDomainObjectBuilder.prototype.buildAntennaDomainObjects = function (antennaDomainObject, antenna) {
        var composition = [],
            domainObject,
            hints = {
                domain: 1
            },
            name;

        for (var prop in antenna[antenna.id]) {
            name = prop.slice(antenna.id.length + 1)
            if (/\w+\.\w+/.test(name)) {
                name = DsnUtils.splitAndCapitalise(name);
            }  else if (name === 'ddor' || name === 'mspa') {
                name = name.toUpperCase();
            } else {
                name = DsnUtils.capitaliseFirstLetter(name);
            }

            domainObject = this.buildDomainObject(prop, name, 'dsn.telemetry', antennaDomainObject.identifier.key);
            domainObject = this.addTelemetry(domainObject, hints);
            composition.push(DsnUtils.serializeIdentifier(domainObject.identifier));
        }

        return composition;
    };

    DsnDomainObjectBuilder.prototype.buildSignals = function (dishDomainObject, signals, signalsType) {
        var signalsDomainObject,
            signalsKey,
            signalsName;

        if (signalsType === 'downSignals') {
            signalsKey = dish.id + '.downSignals';
            signalsName = 'Down Signals';
        } else {
            signalsKey = dish.id + '.upSignals';
            signalsName = 'Up Signals';
        }

        signalsDomainObject = this.buildDomainObject(signalsKey, signalsName, 'folder', dishDomainObject.identifier.key);

        for (var signal in signals) {
            signalName = dish.downSignals[signal].spacecraft + ' - ' + dish.downSignals[signal]['signal.type'].toUpperCase();
            signalDomainObject = this.buildDomainObject(signal, downSignalName, 'table', signalsDomainObject.identifier.key);

            // for (var prop in antenna[antenna.id]) {
            //     name = prop.slice(antenna.id.length + 1)
            //     if (/\w+\.\w+/.test(name)) {
            //         name = DsnUtils.splitAndCapitalise(name);
            //     }  else if (name === 'ddor' || name === 'mspa') {
            //         name = name.toUpperCase();
            //     } else {
            //         name = DsnUtils.capitaliseFirstLetter(name);
            //     }

            //     domainObject = this.buildDomainObject(prop, name, 'dsn.telemetry', antennaDomainObject.identifier.key);
            //     domainObject = this.addTelemetry(domainObject, hints);
            //     antennaComposition.push(DsnUtils.serializeIdentifier(domainObject.identifier));
            // }

            // antennaDomainObject = this.addComposition(antennaDomainObject, antennaComposition);

            downSignalComposition = this.buildTelemetryDomainObjects(dish.id, dish.downSignals[signal], downSignalDomainObject);
            downSignalDomainObject = this.addComposition(downSignalDomainObject, downSignalComposition);

            downSignalsComposition.push(DsnUtils.serializeIdentifier(downSignalDomainObject.identifier));
        }

        signalsDomainObject = this.addComposition(signalsDomainObject, downSignalsComposition);
    };

    DsnDomainObjectBuilder.prototype.buildDish = function (dish) {
        var antennaComposition,
            antennaDomainObject,
            antennaKey = dish.id + '.antenna',
            dishComposition = [],
            dishDomainObject,
            dishKey = dish.location + '.' + dish.id,
            dishName = dish.id.substring(0, 3).toUpperCase() + ' ' + dish.id.substring(3),
            downSignalComposition = [],
            downSignalDomainObject,
            downSignalName,
            downSignalsComposition = [],
            downSignalsDomainObject,
            downSignalsKey = dish.id + '.downSignals',
            hints = {
                domain: 1
            },
            name,
            targetComposition = [],
            targetDomainObject,
            targetName,
            targetsComposition = [],
            targetsDomainObject,
            targetsKey = dish.id + '.targets',
            upSignalComposition = [],
            upSignalDomainObject,
            upSignalName,
            upSignalsComposition = [],
            upSignalsDomainObject,
            upSignalsKey = dish.id + '.upSignals',
            values = [];

        dishDomainObject = this.buildDomainObject(dishKey, dishName, 'folder', dish.location);

        // Build antenna and telemetry values
        antennaDomainObject = this.buildDomainObject(antennaKey, 'Antenna', 'folder', dishDomainObject.identifier.key);

        for (var prop in dish[antennaKey]) {
            name = prop.slice(antennaKey.length + 1);
            values.push(this.buildTelemetryValue(prop, name, hints));
        }

        antennaDomainObject = this.addTelemetry(antennaDomainObject, values);

        // Build antenna's children
        antennaComposition = this.buildAntennaDomainObjects(dishDomainObject, dish[antennaKey]);
        antennaDomainObject = this.addComposition(antennaDomainObject, antennaComposition);

        debugger;

        dishComposition.push(DsnUtils.serializeIdentifier(antennaDomainObject.identifier));
        

        // if (Object.keys(dish.downSignals).length) {
        //     downSignalsDomainObject = this.buildDomainObject(downSignalsKey, 'Down Signals', 'folder', dishDomainObject.identifier.key);
        //     dishComposition.push(DsnUtils.serializeIdentifier(downSignalsDomainObject.identifier));

        //     downSignalsComposition = this.buildSignals();
        //     downSignalsDomainObject = this.addComposition(downSignalsDomainObject, downSignalsComposition);

        //     for (var downSignal in dish.downSignals) {
        //         downSignalName = dish.downSignals[downSignal].spacecraft + ' - ' + dish.downSignals[downSignal]['signal.type'].toUpperCase();
        //         downSignalDomainObject = this.buildDomainObject(downSignal, downSignalName, 'table', downSignalsDomainObject.identifier.key);

        //         downSignalComposition = this.buildTelemetryDomainObjects(dish.id, dish.downSignals[downSignal], downSignalDomainObject);
        //         downSignalDomainObject = this.addComposition(downSignalDomainObject, downSignalComposition);

        //         downSignalsComposition.push(DsnUtils.serializeIdentifier(downSignalDomainObject.identifier));
        //     }

        //     downSignalsDomainObject = this.addComposition(downSignalsDomainObject, downSignalsComposition);
        // }

        // if (Object.keys(dish.targets).length) {
        //     targetsDomainObject = this.buildDomainObject(targetsKey, 'Targets', 'folder', dishDomainObject.identifier.key);
        //     dishComposition.push(DsnUtils.serializeIdentifier(targetsDomainObject.identifier));

        //     for (var target in dish.targets) {
        //         targetName = dish.targets[target].name;
        //         targetDomainObject = this.buildDomainObject(target, targetName, 'table', targetsDomainObject.identifier.key);

        //         targetComposition = this.buildTelemetryDomainObjects(dish.id, dish.targets[target], targetDomainObject);
        //         targetDomainObject = this.addComposition(targetDomainObject, targetComposition);

        //         targetsComposition.push(DsnUtils.serializeIdentifier(targetDomainObject.identifier));
        //     }

        //     targetsDomainObject = this.addComposition(targetsDomainObject, targetsComposition);
        // }

        // if (Object.keys(dish.upSignals).length) {
        //     upSignalsDomainObject = this.buildDomainObject(upSignalsKey, 'Up Signals', 'folder', dishDomainObject.identifier.key);
        //     dishComposition.push(DsnUtils.serializeIdentifier(upSignalsDomainObject.identifier));

        //     for (var upSignal in dish.upSignals) {
        //         upSignalName = dish.upSignals[upSignal].spacecraft + ' - ' + dish.upSignals[upSignal]['signal.type'].toUpperCase();
        //         upSignalDomainObject = this.buildDomainObject(upSignal, upSignalName, 'table', upSignalsDomainObject.identifier.key);

        //         upSignalComposition = this.buildTelemetryDomainObjects(dish.id, dish.upSignals[upSignal], upSignalDomainObject);
        //         upSignalDomainObject = this.addComposition(upSignalDomainObject, upSignalComposition);

        //         upSignalsComposition.push(DsnUtils.serializeIdentifier(upSignalDomainObject.identifier));
        //     }

        //     upSignalsDomainObject = this.addComposition(upSignalsDomainObject, upSignalsComposition);
        // }

        dishDomainObject = this.addComposition(dishDomainObject, dishComposition);
    };

    /**
     * Build the antenna.
     *
     * @private
     * @param {Element} stationElement - The station to parse.
     * @returns {object} An object containing the station's data.
     */
    DsnDomainObjectBuilder.prototype.buildAntennaDomainObject = function (dishId, dish) {
        var antennaComposition = [],
            antennaDomainObject,
            antennaKey,
            antennaName;

        // Create the antenna's children
        for (var property in dish) {
            var childDomainObject,
                childKey,
                childName = property.slice(dishId.length + 1),
                hints = {
                    domain: 1
                };

            switch (childName) {
                case 'ddor':
                case 'mspa':
                    childName = childName.toUpperCase();
                    break;
                case 'wind.speed':
                    var tokens = [];
                    for (var token of childName.split('.')) {
                        token = DsnUtils.capitaliseFirstLetter(token);
                        tokens.push(token);
                    }

                    childName = tokens.join(' ');
                    break;
                default:
                    childName = DsnUtils.capitaliseFirstLetter(childName);
            }

            childDomainObject = this.buildDomainObject(property, childName, 'dsn.telemetry');
            childDomainObject = this.addTelemetry(childDomainObject, hints);
            childKey = DsnUtils.serializeIdentifier(childDomainObject.identifier);

            antennaComposition.push(childKey);
            this.domainObjects[childKey] = childDomainObject;
        }

        // Create the antenna
        antennaName = dishId + '.antenna';
        antennaDomainObject = this.buildDomainObject(antennaName, 'Antenna', 'table');
        antennaDomainObject = this.addComposition(antennaDomainObject, antennaComposition);
        antennaKey = DsnUtils.serializeIdentifier(antennaDomainObject.identifier);
        this.domainObjects[antennaKey] = antennaDomainObject;

        return this.domainObjects[antennaKey];
    };

    /**
     * 
     *
     * @private
     * @param {Element} stationElement - The station to parse.
     * @returns {object} An object containing the station's data.
     */
    DsnDomainObjectBuilder.prototype.buildParentAndChildrenDomainObjects = function (dishId, parent, name) {
        var parentComposition = [],
            parentDomainObject,
            parentKey,
            parentName;

        // Create the parent
        parentName = dishId + '.' + name.toLowerCase();
        parentDomainObject = this.buildDomainObject(parentName, name, 'table');
        parentKey = DsnUtils.serializeIdentifier(parentDomainObject.identifier);

        // Create the parent's children
        for (var prop in parent) {
            var childDomainObject,
                childKey,
                childName = prop.slice(dishId.length + 1),
                hints = {
                    domain: 1
                };

            if (/\w+\.\w+/.test(childName)) {
                childName = DsnUtils.splitAndCapitalise(childName);
            }  else if (childName === 'ddor' || childName === 'mspa') {
                childName = childName.toUpperCase();
            } else {
                childName = DsnUtils.capitaliseFirstLetter(childName);
            }

            childDomainObject = this.buildDomainObject(prop, childName, 'dsn.telemetry', parentDomainObject.identifier.key);
            childDomainObject = this.addTelemetry(childDomainObject, hints);
            childKey = DsnUtils.serializeIdentifier(childDomainObject.identifier);

            parentComposition.push(childKey);
            this.domainObjects[childKey] = childDomainObject;
        }

        parentDomainObject = this.addComposition(parentDomainObject, parentComposition);
        this.domainObjects[parentKey] = parentDomainObject;

        return this.domainObjects[parentKey];
    };

    /**
     * Get all domain objects built.
     *
     * @returns {object} An object containing the station's data.
     */
    DsnDomainObjectBuilder.prototype.getDomainObjects = function () {
        return this.domainObjects;
    };

    return DsnDomainObjectBuilder;
});
