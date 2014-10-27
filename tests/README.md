Tests are supposed to be launched *simultaneously* for the client-side
library, and for the server.

Therefore, first launch the tests in the Node.js:

```sh
$ node server/tests.js
```

It will perform several tests, and then start waiting until the
borwser to be connected.

Next, open `client/index.html` in the web-browser. The tests for the
server and the browser will then continue together.

