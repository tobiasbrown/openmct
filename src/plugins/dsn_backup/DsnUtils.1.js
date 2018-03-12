
define([

], function (

) {
    'use strict';

    function capitaliseFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function deserializeIdentifier(identifier) {
        var tokens = identifier.split(':');
        return {
            namespace: tokens[0],
            key: tokens[1]
        };
    }

    function serializeIdentifier(identifier) {
        return identifier.namespace + ':' + identifier.key;
    }

    return {
        capitaliseFirstLetter: capitaliseFirstLetter,
        deserializeIdentifier: deserializeIdentifier,
        serializeIdentifier: serializeIdentifier
    };
});
