
var invoke = require('../../server/invoke-server.js');
require('./lighttest.js');

var tests = {
    'Initialization':
    function() {
        lighttest.check(typeof invoke.Server != 'undefined');
        lighttest.done();
    },


    'Server launch':
    function() {
        var server = new invoke.Server(1337);
        
        var cb = lighttest.protect(function() {
            lighttest.check(true);
            lighttest.done();
        });

        server.close(cb);
    },

    
    'Echo method expose':
    function() {
        var server = new invoke.Server(1337);

        server.expose({
            echo: lighttest.protect(function(param, cb){
                cb(param);
                lighttest.check(true);

                var finalize = lighttest.protect(function() {
                    lighttest.check(true);
                    lighttest.done();
                });

                server.close(finalize);
            })
        });
    },
    
    'Exposing a method without a callback':
    function() {
        var server = new invoke.Server(1337);

        server.expose({
            send : lighttest.protect(function(hello){
                lighttest.check(hello == 'world');

                var finalize = lighttest.protect(function() {
                    lighttest.check(true);
                    lighttest.done();
                });

                server.close(finalize);
            })
        });
    },
    

    'Exposing several methods':
    function() {
        var server = new invoke.Server(1337);

        server.expose({
            echo1 : lighttest.protect(function(msg, cb){
                lighttest.check(msg == 'hello1');
                cb(msg);
            }),
                          
            echo2 : lighttest.protect(function(msg, cb){
                lighttest.check(msg == 'hello2');
                cb(msg);
                          
                var finalize = lighttest.protect(function() {
                    lighttest.check(true);
                    lighttest.done();
                });

                server.close(finalize);
            })
        });
    },
    

    'Exposing method with several callbacks':
    function() {
        var server = new invoke.Server(1337);

        server.expose({
            back : lighttest.protect(function(cb1, cb2, cb3, cb4){
                lighttest.check(true);
                cb3();
                          
                var finalize = lighttest.protect(function() {
                    lighttest.check(true);
                    lighttest.done();
                });

                server.close(finalize);
            })
        });
    },
    

    'Exposing broken method':
    function() {
        var server = new invoke.Server(1337);

        var finalize = lighttest.protect(function() {
            lighttest.check(true);
            lighttest.done();
        });

        var proceed = lighttest.protect(function() {
            server.close(finalize);
        });

        server.expose({
            broken : function(sCb, fCb){
                lighttest.check(true);
                setTimeout(proceed, 0);
                doSomethingUnexpected();
                sCb();
            }
        });
    },
    

    'Handling an attempt to invoke unexisting method':
    function() {
        var server = new invoke.Server(1337);
        
        server.expose({
            proceed : lighttest.protect(function(scb,fcb){
                lighttest.check(true);
                scb();
                  
                var finalize = lighttest.protect(function() {
                    lighttest.check(true);
                    lighttest.done();
                });

                server.close(finalize);
            })
        });
    },
    

    'Exposing not a function':
    function() {
        var server = new invoke.Server(1337);

        var failed = false;
        try {
            server.expose({
                arr: ['hello', 'world']
            });
        } catch (e) {
            failed = true;
        }
        
        lighttest.check(failed);
        server.close();
        lighttest.check(true);
        lighttest.done();
    }

};


lighttest.start(tests);


