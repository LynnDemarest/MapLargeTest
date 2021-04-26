# File Manager Exercise 

I wrote this single page web application as an exercise.
It essentially allows you to manage a tree of folders and files on the server.

It illustrates the use of a number of coding techniques, including: 

* drag and drop 
* WebWorkers
* JQuery ajax and XMLHttpRequest (used in the web worker) 
* my first ever use of knockoutjs
* recursion, used to traverse the folder structure
* jQuery DOM traversal 
* Deep-linking, so URL after # contains state info 
* Upload process that accepts files from the browser's local file system and transfers them using ajax
* Collapseable folders 
* Download files by reading them from the server and then creating a blob and faking a download event. Here's the code:

`function download(content, filename, contentType) {
            //debugger;
            if (!contentType) contentType = 'application/octet-stream'; // default to binary
            // create link (anchor) element
            var a = document.createElement('a');

            // see: https://javascript.info/blob for more on blobs
            //
            // args are: 1. an array of Blob/BufferSource/String values.
            //           2. options object
            var blob = new Blob([content], { 'type': contentType });

            a.href = window.URL.createObjectURL(blob);
            // HTML 5 "download" : https://developers.google.com/web/updates/2011/08/Downloading-resources-in-HTML5-a-download
            a.download = filename;
            a.click();  // fake the click

            //
            // We're not going to use the blob again, so release the memory!
            //
            window.URL.revokeObjectURL(a.href);
        }`

