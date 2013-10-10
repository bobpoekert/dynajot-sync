define(["core"], function(core) {

    var schema = {};
    schema.t = {};

    schema.t.array = core.isArray;
    schema.t.element = core.isElement;
    schema.t.fn = core.isFunction;
    schema.t.string = core.isString;
    schema.t.number = core.isNumber;
    schema.t.bool = core.isBoolean;
    schema.t.dict = core.isObject;
    schema.t.any = function(sch) {
        return function(array) {
            return core.every(
                array, core.partial(schema.validate, sch));
        };
    };
    schema.t.nullable = function(sch) {
        return function(val) {
            if (val === null) return true;
            return schema.validate(sch, val);
        };
    };

    schema.errback = function(fn, sch, data) {
        console.log(fn, sch, data);
        console.trace();
    };

    schema.validate = function(sch, data) {
        if (sch == data) return true;
        if (typeof(sch) == 'function') return sch(data);
        if (typeof(sch) != typeof(data)) return false;
        if (core.isArray(sch) != core.isArray(data)) return false;
        if (core.isObject(sch) != core.isObject(data)) return false;
        var res = true;
        var prev_schema = null;
        core.each(data, function(v, k) {
            var sc = sch[k];
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
        core.each(sch, function(v, k) {
            if (!(k in data)) {
                res = false;
                return false;
            }
        });
        return res;
    };

    schema.inp_validated = function(sch, fn, errback) {
        if (!errback) errback = schema.errback;
        return function(arg) {
            if (!schema.validate(sch, arg)) {
                errback(fn, sch, arg);
            }
            return fn(arg);
        };
    };

    schema.outp_validated = function(sch, fn, errback) {
        if (!errback) errback = schema.errback;
        return function() {
            var res = fn.apply(this, arguments);
            if (!schema.validate(sch, res)) {
                errback(fn, sch, res);
            }
            return res;
        };
    };

    schema.Delta = {
        id: schema.t.string,
        name: schema.t.string,
        message_id: schema.t.nullable([
            schema.t.string, // document_id
            schema.t.number, // global timestamps
            schema.t.string, // session ids
            schema.t.number  // local timestamps
        ]),
        attrs: {
            '+': schema.t.dict,
            '-': schema.t.dict
        },
        position: schema.t.nullable({
            parent: schema.t.string,
            offset: schema.t.number
        }),
        children: schema.t.any({kind: schema.t.string, value: schema.t.string})
    };

    schema.Element = {
        id: schema.t.string,
        attrs: schema.t.dict,
        position: {
            parent: schema.t.string,
            index: schema.t.number
        },
        children: schema.t.any({kind: schema.t.string, value: schema.t.string})
    };

    return schema;

});