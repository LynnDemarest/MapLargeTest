// The Worker script 
//
// This script runs in a WebWorker, and so has no access to the UI.
// It can, however, make AJAX calls and return the data, which is what this
// one does. 
//
//
// Message from main thread 
//
onmessage = function (e) {
    if (e.data.msg === "start") {

        var path = e.data.path;
        var url = '/default/getFullDirectoryTree';

        var xhr = new XMLHttpRequest();

        xhr.open('POST', url, true);  // no username/password

        // data coming back from ajax call 
        xhr.onload = (d) => {

            var json = JSON.parse(d.currentTarget.responseText);

            //self.DirectoryTree(json);
            done(json);
        }

        var formdata = new FormData();
        formdata.append("rootpath", path);
        xhr.send(formdata);

    }
};

function done(d) {
    // Send back the results to the parent page
    postMessage(d);
}