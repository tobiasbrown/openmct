
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

    var DSN_DICTIONARY_URI = 'src/plugins/dsn/res/dsn-dictionary.json',
        DSN_KEY = 'dsn',
        DSN_NAMESPACE = 'deep.space.network',
        DSN_TELEMETRY_SOURCE = 'https://eyes.nasa.gov/dsn/data/dsn.xml',
        DSN_TELEMETRY_TYPE = 'dsn.telemetry';

    function getDsnDictionary() {
        // TODO: Replace http with library from npm
        return http.get(DSN_DICTIONARY_URI)
            .then(function (result) {
                return result.data;
            });
    }

    function synchroniseDomainObjects(dsn) {
        console.log('syncing 2');
        console.log(dsn);

        for (var station in dsn.stations) {
            synchroniseDishes(station, dsn.stations[station].dishes);
            synchroniseDownSignals(station.downSignals);
            synchroniseUpSignals(station.upSignals);
        }
    }

    function getDsnData(domainObject) {
        // Add the same query string parameter the DSN site sends with each request
        var url = '/proxyUrl?url=' + encodeURIComponent(DSN_TELEMETRY_SOURCE + '?r=' + Math.floor(new Date().getTime() / 5000));

        return http.get(url)
            .then(function (resp) {
                console.log('parsing');
                var parser = new DsnParser();
                return parser.parseXml(resp.request.responseXML);
            })
            .then(function (dsn) {
                console.log('syncing');

                // Synchronise domain objects here
                //synchroniseDomainObjects(dsn);

                // Refresh dictionary to remove existing domain objects
                

                // Add dishes to parent's composition
                console.log(dsn);

                // Add latest domain objects to dictionary
                Object.assign(dictionary.domainObjects, dsn.domainObjects);                

                var regex = /dss[0-9]+$/;

                for (var station in dsn.stations) {
                    var stationKey = DSN_NAMESPACE + ':' + station;
                    var stationDomainObject = dictionary.domainObjects[stationKey];
                    for (var i = 0; i < dictionary.domainObjects[stationKey].composition.length; i++) {
                        var childIdentifier = deserializeIdentifier(dictionary.domainObjects[stationKey].composition[i]);
                        // console.log(childIdentifier.key);
                        // console.log(regex.test(childIdentifier.key));
                        if (regex.test(childIdentifier.key)) {
                            if (!dsn.stations[station][childIdentifier.key]) {
                                // omct.objects.delete()
                                console.log(childIdentifier.key);
                                console.log(omct.objects);

                                // Remove from composition
                                // dictionary.domainObjects[stationKey].composition.splice(i, 1);
                                var composition = omct.composition.get(stationDomainObject);
                                console.log(composition);
                                var childDomainObject = dictionary.domainObjects[serializeIdentifier(childIdentifier)];
                                composition.remove(childDomainObject);

                                // Remove from dictionary
                                // omct.objects.delete(childIdentifier);
                            }
                        }
                    }

                    for (var dish in dsn.stations[station]) {
                        var childIdentifier = serializeIdentifier(dsn.stations[station][dish].identifier),
                            parent = dsn.stations[station][dish].location;

                        if (!dictionary.domainObjects[parent].composition.includes(childIdentifier)) {
                            dictionary.domainObjects[parent].composition.push(childIdentifier);
                        }
                    }

                    // omct.objects.mutate(dictionary.domainObjects[stationKey], 'composition', dictionary.domainObjects[stationKey].composition);
                }

                // Add latest domain objects to dictionary
                // Object.assign(dictionary.domainObjects, dsn.domainObjects);

                // Mutate object tree?

                return dsn;
            })
            .then(function (dsn) {
                console.log('returning datum');
                // Return the datum
                return dsn.data[domainObject.identifier.key];
            });
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
        delete: function (identifier) {

            // Remove from composition
            // dictionary.domainObjects[stationKey].composition.splice(i, 1);

            var key = serializeIdentifier(identifier);

            if (dictionary.domainObjects[key].hasOwnProperty('composition')) {
                // Delete children
                for (var i = 0; i < dictionary.domainObjects[key].composition.length; i++) {
                    this.delete(deserializeIdentifier(dictionary.domainObjects[key].composition[i]));
                }
            }

            delete dictionary.domainObjects[key];
        },
        get: function (identifier) {
            if (identifier.key === 'dsn') {
                return Promise.resolve({
                    identifier: {
                        namespace: 'deep.space.network',
                        key: 'dsn'
                    },
                    type: 'folder',
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
        },
        remove: function (domainObject, identifier) {
            console.log('removing');
            console.log(domainObject);

            var index = dictionary.domainObjects[serializeIdentifier(domainObject.identifier)]
                            .composition.indexOf(serializeIdentifier(identifier));

            if (index !== -1) {
                dictionary.domainObjects[serializeIdentifier(domainObject.identifier)]
                    .composition.splice(index, 1);
            }

            // return Promise.resolve();
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

            // DSN data is updated every 5 seconds
            var interval = setInterval(function () {
                getDsnData(domainObject).then(function (datum) {
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

            // Add providers after the dictionary has been fetched
            getDsnDictionary().then(function (dsnDictionary) {
                dictionary = dsnDictionary;

                openmct.objects.addProvider(DSN_NAMESPACE, objectProvider);
                openmct.composition.addProvider(compositionProvider);
                openmct.telemetry.addProvider(realTimeProvider);
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
