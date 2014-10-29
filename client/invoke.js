/**
 * @fileoverview invoke - browser library for invoke
 * @version 0.1.0
 * 
 * @license MIT, see http://github.com/asvd/invoke
 * Copyright (c) 2014 asvd <heliosframework@gmail.com> 
 * 
 * Client-site invoke library script. Establishes a connection to the
 * invoke-server and provides a wrappers for the functions exposed by
 * the server
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['exports'], factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports);
    } else {
        factory((root.invoke = {}));
    }
}(this, function (exports) {

    /**
     * A special kind of event:
     *  - which can only be emitted once;
     *  - executes a set of subscribed handlers upon emission;
     *  - if a handler is subscribed after the event was emitted, it
     *    will be invoked immideately.
     */
    var Whenable = function() {
        this._emitted = false;  // event state, may be emitted or not
        this._listeners = [];
        this._result = [];      // args to transfer to the listener
    }
      
      
    /**
     * @returns {Function} whenable subscriber to the event
     */
    Whenable.prototype.getSubscriber = function() {
        var me = this;
        return function(listener) {
            me._whenEmitted(listener);
        }
    }

      
    /**
     * Adds another listener to be executed upon the event emission
     * 
     * @param {Function} func listener function to subscribe
     * @param {Object} ctx optional context to call the listener in
     */
    Whenable.prototype._whenEmitted = function(func, ctx){
        func = this._checkListener(func);
        if (this._emitted) {
            this._invoke(func, ctx, this._result);
        } else {
            this._listeners.push([func, ctx||null]);
        }
    }
      
      
    /**
     * Checks if the provided object is suitable for being subscribed
     * to the event (= is a function), throws an exception otherwise
     * 
     * @param {Object} listener to check for being subscribable
     * 
     * @throws {Exception} if object is not suitable for subscription
     * @returns {Object} the provided object if yes
     */
    Whenable.prototype._checkListener = function(listener){
        var type = typeof listener;
        if (type != 'function') {
            var msg =
                'A function may only be subsribed to the event, '
                + type
                + ' was provided instead'
            throw new Error(msg);
        }

        return listener;
    }
      
      
    /**
     * (Asynchronously) invokes the given listener in the context with
     * the arguments
     * 
     * @param {Function} listener to invoke
     * @param {Object} ctx context to invoke the listener in
     * @param {Array} args to provide to the listener
     */
    Whenable.prototype._invoke = function(listener, ctx, args) {
        setTimeout(function() {
            listener.apply(ctx, args);
        },0);
    }

      
    /**
     * Fires the event, issues the listeners
     * 
     * @param ... all given arguments are forwarded to the listeners
     */
    Whenable.prototype.emit = function(){
        if (!this._emitted) {
            this._emitted = true;

            for (var i = 0; i < arguments.length; i++) {
                this._result.push(arguments[i]);
            }

            var listener;
            while(listener = this._listeners.pop()) {
                this._invoke(listener[0], listener[1], this._result);
            }
        }
    }
      
      
      
    /**
     * Creates a new Host object, represents a connection to a single
     * invoke-server
     * 
     * @param {String} url pointing to the invoke server
     */
    var Host = function(url) {
        this.api = {};
        this._url = url;

        this._connection = new Whenable;
        this._failure = new Whenable;

        this.whenConnected = this._connection.getSubscriber();
        this.whenFailed = this._failure.getSubscriber();

        this._connect();
    }
      
      
    /**
     * Connects to the invoke-server, retrieves a list of exposed
     * functions
     */
    Host.prototype._connect = function() {
        var me = this;
        var sCb = function(api) {
            me._genApi(api);
            me._connection.emit();
        }
        
        var fCb = function(reason) {
            me._failure.emit(reason);
        }

        this._sendMessage({type:'connect'}, sCb, fCb);
    }
      
      
    /**
     * Generates a set of wrapper functions for the functions exposed
     * by the server
     * 
     * @param {Appay} api a list of function names exposed by server
     */
    Host.prototype._genApi = function(api) {
        var name;
        for (var i = 0; i < api.length; i++) {
            name = api[i];
            this.api[name] = this._genWrapper(name);
        }
    }
      
      
    /**
     * Generates a single wrapper for a function exposed by the server
     * 
     * @param {String} name of the method to generate wrapper for
     */
    Host.prototype._genWrapper = function(name) {
        var me = this;
        var wrapper = function() {
            var args = arguments;

            var fCb = function(){};
            var lastArg = args[args.length-1];
            if (typeof lastArg == 'function') {
                fCb = lastArg;
            }
            
            var sCb = function(result) {
                switch(result.type) {
                case 'callback':
                    args[result.idx].apply(null, result.args);
                    break;
                case 'error':
                    fCb(result);
                    break;
                }
            }
            
            me._sendMessage({
                type: 'invoke',
                name: name,
                args: me._wrap(args)
            }, sCb, fCb);
        };

        return wrapper;
    }
      
      
    /**
     * Prepares the provided set of arguments to be sent to the
     * invoke-server for a remote function. All the callbacks are
     * replaced with respective identifiers.
     * 
     * @param {Array} args arguments to wrap 
     * 
     * @returns {Array} wrapped arguments
     */
    Host.prototype._wrap = function(args) {
        var wrapped = [];
        for (var i = 0; i < args.length; i++) {
            if (typeof args[i] == 'function') {
                wrapped.push({type: 'callback', idx: i});
            } else {
                wrapped.push({type: 'argument', value: args[i]});
            }
        }

        return wrapped;
    }
      
      
    /**
     * Sends an ajax-request with the given data to the invoke-server
     * 
     * @param {Object} data to send
     * @param {Function} sCb callback to provide result into
     * @param {Function} fCb failure callback
     */
    Host.prototype._sendMessage = function(data, sCb, fCb) {
        var xhr = new XMLHttpRequest;
        xhr.open("POST", this._url);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify(data));
        xhr.onreadystatechange = function() { 
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    sCb(JSON.parse(xhr.responseText));
                } else {
                    fCb('Remote request failed');
                }
            }
        }
    }
      
      
    exports.Host = Host;
  
}));

