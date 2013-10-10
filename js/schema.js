define(["core"], function(core) {

    var schema = {};

    schema.t.array = core.isArray;
    schema.t.element = core.isElement;
    schema.t.fn = core.isFunction;
    schema.t.string = core.isString;
    schema.t.number = core.isNumber;
    schema.t.bool = core.isBoolean;
    schema.t.dict = core.isObject;
    schema.t.any = function(sch) {
        return function(array) {
            return core.every(array, core.partial(schema.validate, sch));
        };
    };

    schema.errback = function(schema, data) {
        console.log(schema, data);
        console.trace();
    };

    schema.validate = function(schema, data) {
        if (schema == data) return true;
        if (typeof(schema) == 'function') return schema(data);
        if (typeof(schema) != typeof(data)) return false;
        if (core.isArray(schema) != core.isArray(data)) return false;
        if (core.isObject(schema) != core.isObject(data)) return false;
        var res = true;
        var prev_schema = null;
        core.each(data, function(v, k) {
            var sc = schema[k];
            if (!sc) {
                res = false;
                return false;
            }
            if (!schema.validate(sc, v)) {
                res = false;
                return false;
            }
        });
        if (!res) return res;
        core.each(schema, function(v, k) {
            if (!(k in data)) {
                res = false;
                return false;
            }
        });
        return res;
    };

    schema.validated = function(schema, fn, errback) {
        if (!errback) errback = schema.errback;
        return function(arg) {
            if (!schema.validate(schema, arg)) {
                errback(schema, arg);
                return false;
            }
            return fn(arg);
        };
    };

    schema.Delta = {
        id: schema.t.string,
        name: schema.t.string,
        attrs: schema.t.dict,
        position: {
            parent: schema.t.string,
            offset: schema.t.number
        },
        children: schema.t.more({kind: schema.t.string, value: schema.t.string})
    };

});