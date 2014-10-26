
var genfail = function(test) {
    return test.protect(function() {
        test.check(false);
        test.done();
    });
}

var tests = {
    'Initialization':
    function() {
        lighttest.check(typeof invoke.Host != 'undefined');
        lighttest.done();
    },
    
    'Connection failure':
    function() {
        var host = new invoke.Host('http://127.0.0.1:1338/');

        var success = lighttest.protect(function() {
            lighttest.check(true);
            lighttest.done();
        });

        host.whenConnected(genfail(lighttest));
        host.whenFailed(success);
    },
    
    
    'Connection':
    function() {
        var host = new invoke.Host('http://127.0.0.1:1337/');

        var start = lighttest.protect(function() {
            lighttest.check(true);
            lighttest.done();
        });

        host.whenConnected(start);
        host.whenFailed(genfail(lighttest));
    },
    
    
    'Echo method invocation':
    function() {
        var host = new invoke.Host('http://127.0.0.1:1337/');

        var start = lighttest.protect(function() {
            lighttest.check(true);
            
            var msg = 'hello'
            host.api.echo(msg, lighttest.protect(function(result) {
                lighttest.check(result == msg);
                lighttest.done();
            }));
        });

        host.whenConnected(start);
        host.whenFailed(genfail(lighttest));
    },
    
    
    'Invoking a method without a callback':
    function() {
        var host = new invoke.Host('http://127.0.0.1:1337/');

        var start = lighttest.protect(function() {
            lighttest.check(true);
            
            var hello = 'world'
            host.api.send(hello);
            
            var finalize = lighttest.protect(function() {
                lighttest.done();
            });
            
            setTimeout(finalize, 1000);
        });

        host.whenConnected(start);
        host.whenFailed(genfail(lighttest));
    },
    
    
    'Invoking several methods':
    function() {
        var host = new invoke.Host('http://127.0.0.1:1337/');

        var start = lighttest.protect(function() {
            lighttest.check(true);
            
            var msg1 = 'hello1';
            var cb1 = lighttest.protect(function(result1) {
                lighttest.check(result1 == msg1);
                stage2();
            });
                                          
            host.api.echo1(msg1, cb1);

            var stage2 = lighttest.protect(function() {
                var msg2 = 'hello2';
                var cb2 = lighttest.protect(function(result2) {
                    lighttest.check(result2 == msg2);
                    lighttest.done();
                });
                                              
                host.api.echo2(msg2, cb2);
            });
        });

        host.whenConnected(start);
        host.whenFailed(genfail(lighttest));
    },
    
    
    'Invoking method with several callbacks':
    function() {
        var host = new invoke.Host('http://127.0.0.1:1337/');

        var start = lighttest.protect(function() {
            lighttest.check(true);
            
            var cb3 = lighttest.protect(function() {
                lighttest.check(true);
                lighttest.done();
            });
                                          
            var cbfail = genfail(lighttest);
                                          
            host.api.back(cbfail, cbfail, cb3, cbfail);
        });

        host.whenConnected(start);
        host.whenFailed(genfail(lighttest));
    },
    
    
    'Invoking broken method':
    function() {
        var host = new invoke.Host('http://127.0.0.1:1337/');

        var start = lighttest.protect(function() {
            lighttest.check(true);
            
            var fCb = lighttest.protect(function(data) {
                lighttest.check(data.type == 'error');
                lighttest.done();
            });
                                          
            var sCb = genfail(lighttest);
                                          
            host.api.broken(sCb, fCb);
        });

        host.whenConnected(start);
        host.whenFailed(genfail(lighttest));
    },
    
    
    'Invoking unexisting method':
    function() {
        var host = new invoke.Host('http://127.0.0.1:1337/');

        var start = lighttest.protect(function() {
            lighttest.check(true);

            var failed = false;
            try {
                host.api.broken(sCb, fCb);
            } catch(e) {
                failed = true;
            }
                                          
            lighttest.check(failed);
            
            var finalize = lighttest.protect(function() {
                lighttest.check(true);
                lighttest.done();
            });
                                          
            host.api.proceed(finalize, genfail(lighttest));
        });

        host.whenConnected(start);
        host.whenFailed(genfail(lighttest));
    }
};


lighttest.start(tests);



