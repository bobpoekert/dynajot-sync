({
    appDir: "../",
    baseUrl: "js",
    dir: "../../dynajot-build",
    modules: [
	{
            name: "sync",
            include: ['jquery',
		      'underscore',
		      'load_swf',
		      'msgpack'
 	    ]
        }
    ]
})
