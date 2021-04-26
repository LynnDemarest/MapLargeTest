
// Load the worker. Any time we want the directory tree, we can invoke "start".
//
//
var directoryTreeWorker = new Worker("js/DTreeWorker.js");

//
// Watch for messages from the worker process
//
directoryTreeWorker.onmessage = function (e) {
    //alert(JSON.stringify(e.data));
    model.viewModel.DirectoryTree(e.data);
    updateDragClassesAndHandlers();
};

// worker.postMessage("start");  // This is done in FileMan.js 

