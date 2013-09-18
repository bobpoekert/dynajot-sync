define(["core", "indexdb_storage", "localstorage_storage"],
       function(core, indexdb, localstorage) {

    if (indexdb) {
        return indexdb;
    } else {
        return localstorage;
    }

});
