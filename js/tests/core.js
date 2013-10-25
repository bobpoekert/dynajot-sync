define(["core"], function(core) {
    module("Core (js/core.js)");

    test("inherit", function () {
        var orig = {'a':3};
        var copy = core.inherit(orig);
        ok(orig.a == copy.a, "unchanged object is unchanged"); // [TODO] isEqual
        copy.b = 2;
        ok(copy.b == 2, "change happened");
        ok(typeof(orig.b) == 'undefined', "change not happened upstream");
        orig.a = 1;
        ok(copy.a === 1, "upstream change reflected in downstream");
        copy.a = 2;
        ok(copy.a == 2, "overwrite downstream");
        ok(orig.a == 1, "upstream unchanged by overwrite");
    });

    test("isWindow", function () {
        ok(core.isWindow(window), "window is window");
        ok(!core.isWindow(document), "document is not a window");
    });

    // core.isPlainObject from jQuery
    // core.mapAll from jQuery

    test("stringCompare", function () {
        ok(core.stringCompare("aa", "aa") === 0, "aa and aa are the same");
        ok(core.stringCompare("aa", "ab") < 0, "ab comes after aa");
        ok(core.stringCompare("ab", "aa") > 0, "aa comes before ab");
    });

    // core.noop does nothing
    // core.identity returns its argument
    // core.gattr higher order fn to return a fn

    test("unsplat", function () {
        var unsplatted_fn = core.unsplat(function(args){
            ok(core.isEqual(args, [1, 2, 3]), "1 2 3 is 1 2 3");
        });
        unsplatted_fn(1, 2, 3);

        var varisplatted_fn = core.unsplat(2, function(a, b, rest){
            ok(a === 1, "a is 1");
            ok(b === 2, "b is 2");
            ok(core.isEqual(rest, [3, 4]), "rest is [3, 4]");
        });
        varisplatted_fn(1, 2, 3, 4);
    });

    test("splat", function () {
        var splatted_fn = core.splat(function (a, b, c) {
            ok(a === 1, "a is 1");
            ok(b === 2, "b is 2");
            ok(c === 3, "c is 3");
        });
        splatted_fn([1, 2, 3]);
    });

    test("truthiness", function () {
        var t = core.truthiness;
        ok(!t(0));
        ok(!t(undefined));
        ok(!t(false));
        ok(!t(null));
        ok(!t({}));
        ok(!t([]));
        ok(t({'a': 1}));
        ok(t([1]));
        ok(t(true));
        ok(t(1));
    });

    test("removeWhitespace", function () {
        var rw = core.removeWhitespace;
        ok(rw("a b c") == "abc");
        ok(rw("a b_c") == "ab_c");
        ok(rw(" ") === "");
    });

    test("whitespaceEqual", function () {
        var wse = core.whitespaceEqual;
        ok(wse("a b c", "abc"));
        ok(wse("a bc ", "abc"));
        ok(wse(" ab c", "abc"));
    });

    test("future", function () {
        var f = core.future();
        var test_data = "foobar";
        var check_test_data = function(datum) {
            ok(datum === test_data);
        };
        f(check_test_data);
        f.fire(test_data);
        f(check_test_data);

        var ffail = core.future();
        ffail(core.noop, check_test_data);
        ffail.fail(test_data);
        ffail(core.noop, check_test_data);
    });

    test("multi", function () {
        var f1, f2, f3, d1, d2, d3;
        f1 = core.future();
        f2 = core.future();
        f3 = core.future();
        d1 = 1;
        d2 = 2;
        d3 = 3;
        var m = core.multi(function (data) {
            ok(data[0] == 1);
            ok(data[1] == 2);
            ok(data[2] == 3);
        });
        f1(m.getCallback());
        f2(m.getCallback());
        f3(m.getCallback());
        m.start();
        f3.fire(d3);
        f1.fire(d1);
        f2.fire(d2);
    });

    test("pipe", function () {
        expect(3);
        var p = core.pipe();
        var scratch = 1;

        var checkResult = function(result) {
            ok(result == scratch);
        };

        var checkDatum = function() {
            scratch = Math.random();
            p.write(scratch);
        };

        checkDatum();
        var read_handle = p.addReader(checkResult);
        checkDatum();
        p.removeReader(read_handle);
        checkDatum();
        p.addReader(checkResult);
    });

    test("maybe_function", function () {
        var mf = core.maybe_function;
        ok(mf(core.noop) == core.noop, "returns fn if fn");
        ok(mf(1)() == 1, "returns a fn that returns 1");
    });

    asyncTest("uniqueDebounce", function () {
        expect(5);
        var test_data = [1, 2, 3, 4, 5, 5, 5, 5, 5];
        var debounced = core.uniqueDebounce(function(datum) {
            ok(true);
        }, 100);
        core.each(test_data, debounced);
        setTimeout(start, 201);
    });

    test("reTester", function() {
        var rt = core.reTester(/\s/g);
        ok(rt(" "));
        ok(!rt(""));
    });

    test("hasOnlyKeys", function () {
        var dict = {'a': 1, 'b': 2, 'c': 3};
        var keys = ['a', 'b', 'c'];

        ok(core.hasOnlyKeys(dict, keys));
        dict['failkey'] = true;
        ok(!core.hasOnlyKeys(dict, keys));
    });

    test("clean", function () {
        var arr = [0, 1, null, undefined, false, true, [], {}, [1], {'a': 1}];
        ok(core.isEqual(core.clean(arr), [1, true, [1], {'a': 1}]));
    });

    // fCamelCase from jQuery
    // camelCase from jQuery

    test("replace", function () {
        var arr = [1, 2, 3, 4];
        core.replace(arr, function (el) { return el%2 === 0; });
        ok(core.isEqual(
            arr,
            [1, true, 3, true]));
    });

    test("indexOf", function () {
        var iof = core.indexOf;
        var arr = [1, 2, 3];
        ok(iof(arr, 1) === 0);
        ok(iof(arr, 2) === 1);
        ok(iof(arr, 42) === -1);
    });

    test("sentenceSplit", function () {
        var sentence = "testing sentence.however;the end.";
        ok(true); // TODO
    });


    // logsErrors for debugging

    // throttle from jQuery
    // extend from jQuery
});
