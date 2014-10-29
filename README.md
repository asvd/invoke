Invoke
======

Invoke is an exeprimental http-server and a browser library
dramatically simplifying client-server communication down to a
function call. That is literally: declare a function on a server, then
directly use it in a browser:

*Server (Node.js):*

```js
var invoke = require('invoke-server');

// starting a server on port 1337
var server = new invoke.Server(1337);

// a set of functions available to the browser
server.expose({
    // prints a message on the server console
    log: console.log,
                  
    // provides the content of that file
    readThatFile: function(cb) {
        cb(require("fs").readFileSync('thatFile.txt').toString());
    }
});
```
*Client (web-browser):*

```html
<script type="text/javascript" src="invoke.js"></script>
```

```js
// connecting to the server
var host = new invoke.Host('http://127.0.0.1:1337/');

var start = function() {
    // functions exposed by the server are available at host.api

    // printing a message on the SERVER console
    host.api.log('hello');

    // reading the content of that file
    host.api.readThatFile(function(content) {
        // printing the content on the browser console
        console.log(content);
    });
}


host.whenConnected(start);
```

### What's happening?

A list of exposed function names is provided to the browser upon
connection. For each exposed function browser then creates a wrapper
under the same name. Upon being called, the wrapper serializes the
provided arguments into a JSON-string, and performs an ordinary
request to the server, which in turn rebuilds the arguments, and calls
the actual function. A callback invoked by that function similarly
leads to a responce sent back to the browser, which finally calls the
actual callback (preserved in advance when sending the request).

The messaging mechanism reused beyond the remote function invocation
introduces some natural limitations for the exposed functions and
their usage (nevertheless the most common use-cases are still
straightforward):

- Exposed function arguments may only be either simple objects (which
  are then serialized and sent within a request), or callbacks (which
  are preserved and replaced with special identifiers before
  sending). Custom object instance may not be used as an argument.

- A callback can not be executed several times, a responce is sent
  upon the first invocation.

- If several callbacks are provided, only one of them may be called.

- Returned value of an exposed function is ignored, result should be
  provided to a callback instead.


### Setting-up


##### Server (Node.js)

Install `invoke-server` using `npm`:

```sh
$ npm install invoke-server
```

Load the library:

```js
var invoke = require('invoke-server');
```

Optionally you may load the script from the
[distribution](https://github.com/asvd/invoke/releases/download/v0.1.0/invoke-server-0.1.0.tar.gz):

```js
var invoke = require('path/to/invoke-server.js');
```

Create a script which starts the server and exposes the needed
functions:

```js
var invoke = require('invoke-server');

var server = new invoke.Server(1337);

server.expose({
    doThis: function() {
        // do this
        ...
    },

    doThat: function() {
        // do whatever else
        ...
    }
});

```

`Server` object constructor argument is an optional port number
(defaults to 80).

Finally save the file and launch it using Node.js:

```sh
$ node server.js
```

In order to close the server programmatically, use `close()`
method. The provided callback is invoked after the connection is
closed:

```js
server.close(cb);
```





##### Client (browser)

Download the [client-side
library](https://github.com/asvd/invoke/releases/download/v0.1.0/invoke-0.1.0.tar.gz),
unpack it and load the `invoke.js` in a preferrable way. That is an
UMD module, thus for instance it may simply be loaded as a plain
JavaScript file using the `<script>` tag:

```html
<script type="text/javascript" src="invoke/invoke.js"></script>
```

To connect to a host running an invoke-server, create a `Host`
instance:

```js
var host = new invoke.Host('http://127.0.0.1:1337/');

var start = function() {
    // using functions provided by the server
    host.api.doThis();
    host.api.doThat();
}


host.whenConnected(start);
```

The `whenConnected()` method subscribes a listener to the connection
event. After the listener is executed, a set of function exposed by
the server is directly available at the `api` property of the host
object. You may subscribe a listener using `whenConnected()` function
even after the server is already connected (in this case the listener
is invoked immediately).

In addition to `whenConnected()` method, the `Host` object also
provides the `whenFailed()` subscriber to an event triggered if the
connection to the server could not be established. Just like as for
`whenConnected()` method, the `whenFailed()` may also be used several
times or even after the event has actually been fired.


Normally an exposed function takes a callback (or sereval callbacks)
in order to report the result. If no callbacks are provided upon the
function call, the responce is sent immediately. Otherwise the
response is only sent when an exposed function invokes a callback on
the server side.

If a problem has occured during the exposed function execution, the
error is sent in a responce and provided as an argument to the last
callback on the arguments list (which is assumed to be the failure
callback).



--

Follow me on twitter: [https://twitter.com/asvd0](https://twitter.com/asvd0)

Also check out some of my other projects on github (ordered by my
personal impression of their significance):

[Helios Kernel](https://github.com/asvd/helios-kernel): isomorphic
javascript module loader

[Jailed](https://github.com/asvd/jailed): sandboxed execution of
untrusted code (with the similar killer feature to export a set of
functions into the sandbox)

[Lighttest](https://github.com/asvd/lighttest): isomorphic
unit-testing library

