/**
 * @fileoverview invoke-server - server-side library for invoke
 * @version 0.1.0
 * 
 * @license MIT, see http://github.com/asvd/invoke
 * Copyright (c) 2014 asvd <heliosframework@gmail.com> 
 * 
 * Server-side invoke library script. Launches a simple http-server
 * and provides an opportunity to expose a set of methods to an
 * http-client
 */



/**
 * Invoke-server object constructor, starts the server
 * 
 * @param {Number} port to start the server on (defaults to 80)
 */
var Server = function(port) {
    this._exposed = {}; // stores the exposed functions

    var me = this;
    var handler = function(request, response) {
        me._handler(request, response);
    }

    var http = require('http');

    this._httpServer = http.createServer(handler).listen(port||80);
}



/**
 * Stores the provided set of functions as available to the
 * client-side
 * 
 * @param {Object} api list of functions to expose
 */
Server.prototype.expose = function(api) {
    for (var name in api) {
        if (api.hasOwnProperty(name)) {
            this._exposed[name] = this._checkFunction(api[name],name);
        }
    }
}



/**
 * Closes the server
 * 
 * @param {Function} cb callback to execute upon server closes
 */
Server.prototype.close = function(cb) {
    this._httpServer.close(cb);
}



/**
 * Checks if the provided object is suitable for being exposed (= is a
 * function), throws an exception otherwise
 * 
 * @param {Object} obj to check
 * @param {String} name of the object
 * 
 * @throws {Exception} if object is not suitable for exposure
 * @returns {Object} the provided object if suitable
 */
Server.prototype._checkFunction = function(obj, name){
    var type = typeof obj;
    if (type != 'function') {
        var msg =
            "The provided '" +
            name + "' entry has the type of '" +
            type + "', but a function may only be exposed";
        throw new Error(msg);
    }

    return obj;
}
      
      
/**
 * Handles the http request, reads the data, performs the response
 * 
 * @param {Object} request
 * @param {Object} response
 */
Server.prototype._handler = function(request, response) {
    response.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers':
            'Origin, X-Requested-With, Content-Type, Accept'
    });

    var data, me = this;
    request.on("data", function(chunk){data = JSON.parse(chunk);});
    request.on("end", function(chunk){
        if (!data) {
            response.end();
        } else {
            var reply = function(result) {
                response.write(JSON.stringify(result));
                response.end();
                request.connection.destroy();
            }

            me._processMessage(data, reply);
        }
    });
}



/**
 * Handles the http-request message, provides the result for the
 * responce to the callback
 * 
 * @param {Object} data sent by the client
 * @param {Function} reply callback to provide the result to
 */
Server.prototype._processMessage = function(data, reply) {
    switch (data.type) {
    case 'connect':
        reply(this._getExposedSignature());
        break;
    case 'invoke':
        this._invoke(data.name, data.args, reply);
        break;
    }
}



/**
 * @returns {Array} a list of exposed functions names
 */
Server.prototype._getExposedSignature = function() {
    var result = [];
    
    for (var name in this._exposed) {
        if (this._exposed.hasOwnProperty(name)) {
            result.push(name);
        }
    }

    return result;
}



/**
 * Handles a method invocation request
 * 
 * @param {String} name of the method to invoke
 * @param {Array} args arguments for the invoked method
 * @param {Function} reply callback to provide the result to
 */
Server.prototype._invoke = function(name, args, reply) {
    var fail = function(reason) {
        reply({type: 'error', reason: reason});
    }
    
    if (!this._exposed.hasOwnProperty(name)) {
        fail('No method with name '+name+' exposed');
    } else {
        var method = this._exposed[name];
        var unwrapped = this._unwrap(args, reply);

        try {
            method.apply(null, unwrapped.args);
        } catch(e) {
            return fail("Method '"+name+"()' failed to perform");
        }

        if (!unwrapped.callbackProvided) {
            // client does not expect any meaningful responce
            reply({type:'success'});
        }
    }
}



/**
 * Unwraps the given set of arguments as provided by the browser
 * 
 * @param {Array} args arguments to unwrap
 * @param {Function} reply callback to provide the result to
 * 
 * @returns {Array} unwrapped arguments
 */
Server.prototype._unwrap = function(args, reply) {
    var unwrapped = [];
    var callbackProvided = false;
    
    for (var i = 0; i < args.length; i++) {
        switch (args[i].type) {
        case 'argument':
            unwrapped[i] = args[i].value;
            break;
        case 'callback':
            unwrapped[i] = this._genCb(i, reply);
            callbackProvided = true;
            break;
        }
    }

    return {
        args: unwrapped,
        callbackProvided: callbackProvided
    };
}


/**
 * Generates a single callback wrapper
 * 
 * @param {Number} idx index of the callback in the arguments array
 * @param {Function} reply callback to provide the result to
 * 
 * @returns {Function} wrapper sending a message invoking the callback
 */
Server.prototype._genCb = function(idx, reply) {
    return function() {
        var args = [];
        for (var i = 0; i < arguments.length; i++) {
            args.push(arguments[i]);
        }

        reply({
            type: 'callback',
            idx: idx,
            args: args
        });
    };
}



exports.Server = Server;

