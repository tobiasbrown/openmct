
define([
    './DsnParser'
], function (
    DsnParser
) {
    'use strict';

    var compositionProvider,
        dictionary,
        listeners = {},
        objectProvider,
        omct,
        realTimeProvider;

    var DOWN_SIGNAL = 'down',
        DSN_COLLECTION_TYPE = 'dsn.collection',
        DSN_DICTIONARY_URI = 'src/plugins/dsn/res/dsn-dictionary.json',
        DSN_KEY = 'dsn',
        DSN_NAMESPACE = 'deep.space.network',
        DSN_TELEMETRY_SOURCE = 'https://eyes.nasa.gov/dsn/data/dsn.xml',
        DSN_TELEMETRY_TYPE = 'dsn.telemetry',
        SIGNAL_AND_TARGET_IDENTIFIERS = [
            // DSN_NAMESPACE + ':dss14.targets',
            // DSN_NAMESPACE + ':dss14.downSignals',
            // DSN_NAMESPACE + ':dss14.upSignals',
            // DSN_NAMESPACE + ':dss15.targets',
            // DSN_NAMESPACE + ':dss15.downSignals',
            // DSN_NAMESPACE + ':dss15.upSignals',
            // DSN_NAMESPACE + ':dss24.targets',
            // DSN_NAMESPACE + ':dss24.downSignals',
            // DSN_NAMESPACE + ':dss24.upSignals',
            // DSN_NAMESPACE + ':dss25.targets',
            // DSN_NAMESPACE + ':dss25.downSignals',
            // DSN_NAMESPACE + ':dss25.upSignals',
            // DSN_NAMESPACE + ':dss26.targets',
            // DSN_NAMESPACE + ':dss26.downSignals',
            // DSN_NAMESPACE + ':dss26.upSignals',
            DSN_NAMESPACE + ':dss34.targets',
            DSN_NAMESPACE + ':dss34.downSignals',
            DSN_NAMESPACE + ':dss34.upSignals',
            DSN_NAMESPACE + ':dss35.targets',
            DSN_NAMESPACE + ':dss35.downSignals',
            DSN_NAMESPACE + ':dss35.upSignals',
            DSN_NAMESPACE + ':dss36.targets',
            DSN_NAMESPACE + ':dss36.downSignals',
            DSN_NAMESPACE + ':dss36.upSignals',
            DSN_NAMESPACE + ':dss43.targets',
            DSN_NAMESPACE + ':dss43.downSignals',
            DSN_NAMESPACE + ':dss43.upSignals'
            // DSN_NAMESPACE + ':dss54.targets',
            // DSN_NAMESPACE + ':dss54.downSignals',
            // DSN_NAMESPACE + ':dss54.upSignals',
            // DSN_NAMESPACE + ':dss55.targets',
            // DSN_NAMESPACE + ':dss55.downSignals',
            // DSN_NAMESPACE + ':dss55.upSignals',
            // DSN_NAMESPACE + ':dss63.targets',
            // DSN_NAMESPACE + ':dss63.downSignals',
            // DSN_NAMESPACE + ':dss63.upSignals',
            // DSN_NAMESPACE + ':dss65.targets',
            // DSN_NAMESPACE + ':dss65.downSignals',
            // DSN_NAMESPACE + ':dss65.upSignals'
        ],
        UP_SIGNAL = 'up';

    function getDsnDictionary() {
        // TODO: Replace http with library from npm
        return http.get(DSN_DICTIONARY_URI)
            .then(function (result) {
                return result.data;
            });
    }

    function getDsnData(domainObject) {
        // Add the same query string parameter the DSN site sends with each request
        var url = '/proxyUrl?url=' + encodeURIComponent(DSN_TELEMETRY_SOURCE + '?r=' + Math.floor(new Date().getTime() / 5000));

        return http.get(url)
            .then(function (resp) {
                var dsn,
                    parser = new DsnParser();

                dsn = parser.parseXml(resp.request.responseXML);

                console.log('dsn');
                console.log(dsn);

                for (var property in dsn) {
                    // console.log(property);

                    if (property.endsWith('targets') && dsn[property].length > 0) {
                        // console.log('adding target');
                        // console.log(dsn[property]);
                        addTargetToDictionary(property, dsn.timestamp, dsn[property]);
                    } else if (property.endsWith('downSignals') && dsn[property].length > 0) {
                        // console.log('adding down signal');
                        // console.log(dsn[property]);
                        addSignalToDictionary(property, dsn.timestamp, dsn[property], DOWN_SIGNAL);
                    } else if (property.endsWith('upSignals') && dsn[property].length > 0) {
                        // console.log('adding up signal');
                        // console.log(dsn[property]);
                        addSignalToDictionary(property, dsn.timestamp, dsn[property], UP_SIGNAL);
                    }
                }

                // Refresh composition of domain objects containing targets and signals
                // for (var i = 0; i < SIGNAL_AND_TARGET_IDENTIFIERS.length; i++) {
                //     console.log('loading composition for:' + SIGNAL_AND_TARGET_IDENTIFIERS[i]);
                //     console.log(dictionary.domainObjects[SIGNAL_AND_TARGET_IDENTIFIERS[i]]);
                //     compositionProvider.load(dictionary.domainObjects[SIGNAL_AND_TARGET_IDENTIFIERS[i]]);
                // }

                return dsn[domainObject.identifier.key];
            });
    }

    function addSignalToDictionary(key, timestamp, signals, signalType) {
        var dish = key.split('.').shift(),
            signalsIdentifier = {
                namespace: DSN_NAMESPACE,
                key: key
            };

        if (dish === 'dss34' || dish === 'dss35' || dish === 'dss36' || dish === 'dss43') {

            // Reset composition of parent domain object
            dictionary.domainObjects[serializeIdentifier(signalsIdentifier)].composition = [];

            for (var i = 0; i < signals.length; i++) {
                var signal,
                    signalKey,
                    type;

                type = signalType === DOWN_SIGNAL ? 'downSignal'
                    : signalType === UP_SIGNAL ? 'upSignal' : 'unknown';

                signalKey = dish + '.' + type + '.' + signals[i].spacecraft
                    + '.' + signals[i]['signal.type'];

                signal = {
                    identifier: {
                        namespace: DSN_NAMESPACE,
                        key: signalKey
                    },
                    name: signals[i].spacecraft + ' - ' + signals[i]['signal.type'].toUpperCase(),
                    type: DSN_TELEMETRY_TYPE,
                    timestamp: timestamp,
                    telemetry: {
                        values: [
                            {
                                name: 'Spacecraft ID',
                                key: 'spacecraft.id',
                                hints: {
                                    domain: 1
                                }
                            },
                            {
                                name: 'Spacecraft',
                                key: 'spacecraft',
                                hints: {
                                    domain: 1
                                }
                            },
                            {
                                name: 'Signal Type',
                                key: 'signal.type',
                                hints: {
                                    domain: 1
                                }
                            },
                            {
                                name: 'Signal Type Debug',
                                key: 'signal.type.debug',
                                hints: {
                                    domain: 1
                                }
                            },
                            {
                                name: 'Data Rate',
                                key: 'data.rate',
                                hints: {
                                    domain: 1
                                }
                            },
                            {
                                name: 'Frequency',
                                key: 'frequency',
                                hints: {
                                    domain: 1
                                }
                            },
                            {
                                name: 'Power',
                                key: 'power',
                                hints: {
                                    domain: 1
                                }
                            }
                        ]
                    }
                };

                // Only add the signal if it doesn't exist already
                // if (!dictionary.domainObjects.hasOwnProperty(serializeIdentifier(signal.identifier))) {
                    dictionary.domainObjects[serializeIdentifier(signal.identifier)] = signal;
                    dictionary.domainObjects[serializeIdentifier(signalsIdentifier)].composition.push(serializeIdentifier(signal.identifier));
                // }
            }

            compositionProvider.load(dictionary.domainObjects[serializeIdentifier(signalsIdentifier)]);
            // compositionProvider.load(dictionary.domainObjects[DSN_NAMESPACE + ':canberra.' + dish]);
        }
    }

    function addTargetToDictionary(key, timestamp, targets) {
        var dish = key.split('.').shift(),
            targetsIdentifier = {
                namespace: DSN_NAMESPACE,
                key: key
            };

        if (dish === 'dss34' || dish === 'dss35' || dish === 'dss36' || dish === 'dss43') {

            // Reset composition of parent domain object
            dictionary.domainObjects[serializeIdentifier(targetsIdentifier)].composition = [];

            for (var i = 0; i < targets.length; i++) {
                var target,
                    targetKey = dish + '.target.' + targets[i].name; 

                target = {
                    identifier: {
                        namespace: DSN_NAMESPACE,
                        key: targetKey
                    },
                    name: targets[i].name,
                    type: 'table',
                    timestamp: timestamp,
                    composition: []
                };



                target = {
                    identifier: {
                        namespace: DSN_NAMESPACE,
                        key: targetKey
                    },
                    name: targets[i].name,
                    type: DSN_TELEMETRY_TYPE,
                    timestamp: timestamp,
                    telemetry: {
                        values: [
                            {
                                name: 'ID',
                                key: 'id',
                                hints: {
                                    domain: 1
                                }
                            },
                            {
                                name: 'Name',
                                key: 'name',
                                hints: {
                                    domain: 1
                                }
                            },
                            {
                                name: 'Downleg Range',
                                key: 'downleg.range',
                                hints: {
                                    domain: 1
                                }
                            },
                            {
                                name: 'Upleg Range',
                                key: 'upleg.range',
                                hints: {
                                    domain: 1
                                }
                            },
                            {
                                name: 'Round-trip Light Time',
                                key: 'rtlt',
                                hints: {
                                    domain: 1
                                }
                            }
                        ]
                    }
                };

                // Only add the target if it doesn't exist already
                // if (!dictionary.domainObjects.hasOwnProperty(serializeIdentifier(target.identifier))) {
                    dictionary.domainObjects[serializeIdentifier(target.identifier)] = target;
                    dictionary.domainObjects[serializeIdentifier(targetsIdentifier)].composition.push(serializeIdentifier(target.identifier));
                // }
            }

            compositionProvider.load(dictionary.domainObjects[serializeIdentifier(targetsIdentifier)]);
        }

        console.log('added to dictionary');
        console.log(dictionary);
    }

    function serializeIdentifier(identifier) {
        return identifier.namespace + ':' + identifier.key;
    }

    function deserializeIdentifier(identifier) {
        var tokens = identifier.split(':');
        return {
            namespace: tokens[0],
            key: tokens[1]
        };
    }

    objectProvider = {
        get: function (identifier) {
            console.log('object provider');
            console.log(identifier);

            if (identifier.key === 'dsn') {
                return Promise.resolve({
                    identifier: {
                        namespace: 'deep.space.network',
                        key: 'dsn'
                    },
                    type: 'dsn.collection',
                    location: 'ROOT',
                    name: 'Deep Space Network',
                    composition: []
                });
            } else {
                return Promise.resolve(dictionary.domainObjects[serializeIdentifier(identifier)]);
            }
        }
    };

    compositionProvider = {
        appliesTo: function (domainObject) {
            return domainObject.identifier.namespace === DSN_NAMESPACE
                    && domainObject.composition !== undefined;
        },
        load: function (domainObject) {
            console.log('composition provider');
            console.log(domainObject);

            if (domainObject.identifier.key === DSN_KEY) {
                return Promise.resolve(Object.keys(dictionary.domainObjects).filter(function (key) {
                    return dictionary.domainObjects[key].location === DSN_NAMESPACE + ':' + DSN_KEY;
                }).map(function (key) {
                    var childId = deserializeIdentifier(key);
                    return {
                        namespace: childId.namespace,
                        key: childId.key
                    };
                }));
            } else {
                return Promise.resolve(
                    dictionary.domainObjects[serializeIdentifier(domainObject.identifier)].composition.map(function (key) {
                        var childId = deserializeIdentifier(key);
                        return {
                            namespace: childId.namespace,
                            key: childId.key
                        };
                    })
                );
            }
        }
    };

    realTimeProvider = {
        supportsSubscribe: function (domainObject) {
            return domainObject.type === DSN_TELEMETRY_TYPE;
        },
        subscribe: function (domainObject, callback, options) {
            // Keep track of the domain objects subscribed
            if (!listeners[domainObject.identifier.key]) {
                listeners[domainObject.identifier.key] = [];
            }

            listeners[domainObject.identifier.key].push(callback);

            console.log('real time');
            console.log(domainObject);

            // DSN data is updated every 5 seconds
            var interval = setInterval(function () {
                getDsnData(domainObject).then(function (datum) {
                    console.log(datum);
                    // Invoke the callback with the updated datum
                    callback(datum);
                });
            }, 5000);

            return function () {
                // Stop polling the DSN site
                clearInterval(interval);

                // Unsubscribe domain object
                listeners[domainObject.identifier.key] =
                        listeners[domainObject.identifier.key].filter(function (c) {
                    return c !== callback;
                });
            };
        }
    };

    function DsnPlugin() {
        return function install(openmct) {
            omct = openmct;

            openmct.objects.addRoot({
                namespace: DSN_NAMESPACE,
                key: DSN_KEY
            });

            console.log('openmct');
            console.log(openmct);

            // Add providers after the dictionary has been fetched
            getDsnDictionary().then(function (dsnDictionary) {
                dictionary = dsnDictionary;

                openmct.objects.addProvider(DSN_NAMESPACE, objectProvider);
                openmct.composition.addProvider(compositionProvider);
                openmct.telemetry.addProvider(realTimeProvider);
            });

            // This type represents DSN domain objects that contain other DSN objects
            openmct.types.addType(DSN_COLLECTION_TYPE, {
                name: 'DSNCollection',
                description: 'A DSN domain object that contains DSN objects with telemetry.',
                cssClass: 'icon-folder'
            });

            // This type represents DSN domain objects with telemetry
            openmct.types.addType(DSN_TELEMETRY_TYPE, {
                name: 'DSNTelemetry',
                description: 'A DSN domain object with telemetry.',
                cssClass: 'icon-telemetry'
            });
        };
    }

    return DsnPlugin;
});
