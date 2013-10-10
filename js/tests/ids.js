define(["ids"], function(ids) {
    module("ids (js/ids.js)");

    // putStorage
    // getStorage

    var mockedStorage = function(fn) {
        localStorage.clear();
        var res = fn();
        localStorage.clear();
        return res;
    };

    test("counter", function () {
        mockedStorage(function () {
            ok(ids.counter("testcase") === 0);
            ok(ids.counter("testcase") === 1);
            ok(ids.counter("testcase") === 2);
        });
    });
    
    test("global_timestamp", function () {
        mockedStorage(function () {
            var dID = 'testID';
            ok(ids.global_timestamp(dID, 1) === 1);
            ok(ids.global_timestamp(dID, 0) === 1);
            ok(ids.global_timestamp(dID, 5) === 5);
        });
    });
});