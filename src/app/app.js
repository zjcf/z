requirejs.config({
    baseUrl: '../src/lib',
    paths: {
        app: '../src/app'
    },
    shim: {
        'jquery.min' : {
            exports: '$'
        },
        'jquery.lazyload.min' : ['jquery.min'],
        'z.dom': {
            deps: ['z'],
            exports: "DOM"
        }
    },
    urlArgs: 'bust=' + (new Date()).getTime()
});

requirejs(['jquery.min'], function(){
    console.log(arguments);
})

requirejs(['z.dom'], function(dom){
    console.log(z);
    console.log(z.dom);
})

