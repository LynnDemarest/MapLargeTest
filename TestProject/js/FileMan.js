
// FileManModel
//
// knockoutJS viewmodel. Much of the action happens here. 
// 
//
function FileManModel(searchPhrase, rootFolder) {
    var self = this;

    if (searchPhrase == undefined) searchPhrase = "";

    // rootFolder is used to display the folders and files panels
    // It's the second piece in the URL after #:  #searchPhrase&rootFolder
    //
    if (rootFolder == undefined) rootFolder = "";

    //
    // observables
    //

    self.rootFolder = ko.observable(rootFolder);
    self.searchPhrase = ko.observable(searchPhrase);

    self.newFolderName = ko.observable("");

    self.DirectoryTree = ko.observableArray();
    self.collapsedFolders = ko.observableArray([]);

    // This is the current root folder name or "root" for the beginning "" folder.
    // Used to display rootFolder
    self.computedFolder = ko.computed(function () {
        if (self.rootFolder() == "")
            return "root";
        else
            return this.rootFolder();
    }, this);

    self.currentFile = ko.observable("");
    self.currentFileContents = ko.observable("");  // displayed contents 

    //self.currentFolder = ko.observable("Code");

    self.folders = ko.observableArray();  // folders panel: list of folders in current folder
    self.files = ko.observableArray();    // files panel: list of files in current folder 

    self.searchResults = ko.observableArray();
    self.numberOfSearchResults = ko.observable(0);

    self.numberOfFolders = ko.observable(0);
    self.numberOfFiles = ko.observable(0);
    self.statusMessage = ko.observable("");

    //////////////////////////////////////////////////////////////////////////////////////
    // not done
    self.findPreviousFilePath = (currentFilePath) => {
        var tree = self.DirectoryTree()

    }

    // showFolderUL
    // Returns true or false depending on whether the filepath is collapsed or not.
    // All child .FolderUL elements get collapsed when its parent does. 
    // 
    self.showFolderUL = (filepath) => {
        if (filepath == undefined) filepath = "";
        var path = self.getFolderNameFromPath(filepath, true);
        return !self.pathIsCollapsed(path);
    }
    // showFileUL
    // Returns true or false depending on whether the first file's path is collapsed.
    //
    //
    self.showFileUL = (filepatharr) => {
        var filepath = "";
        if (filepatharr != undefined && filepatharr.length > 0) filepath = filepatharr[0];
        var path = self.getFolderNameFromPath(filepath, true);
        return !self.pathIsCollapsed(path);
    }
    // getUpDownClass
    // Returns class "up" or "down" depending on the collapsed state of the filepath. 
    //
    //
    self.getUpDownClass = (filepath) => {
        if (filepath == undefined) filepath = "";
        if (self.pathIsCollapsed(filepath))
            return "down";
        else
            return "up";
    }

    self.rename = (path, newname) => {
        console.log(`New name is ${newname} for ${path}`);


        $.ajax({
            url: '/default/rename',
            method: "POST",
            data: { path, newname }
        }).done(function (res) {
            //var success = res.success == "true";
            //var msg = res.msg;
            var [success, msg, data] = self.getParams(res);

            consolelog(msg);
            self.UpdateStatusMessage(msg);

            if (success) {
                self.rootFolder(data);     // change the root folder for getFolderData
                self.refreshBothLists();
            }
        }).fail(function (err) {
            self.UpdateStatusMessage(`Error renaming item : ${err.statusText}`);
        });

    }


    self.isCurrentFile = (data) => {
        consolelog("isCurrentFile: " + data);
        return data == self.currentFile();
    };

    self.isCurrentFolder = (data) => {
        var r = self.rootFolder();

        console.log(r + " " + data);

        return (r == data);
    };

    self.pathIsCollapsed = (path) => {
        if (path == "")
            return false;
        else
            return (self.collapsedFolders.indexOf(path) >= 0);
    }
    self.removeFromCollapsed = (path) => {
        self.collapsedFolders.remove(path);
    }
    self.addToCollapsed = (path) => {
        console.log("added " + path + " to collapsed");
        if (!self.pathIsCollapsed(path)) {
            self.collapsedFolders.push(path);
        }
    }

    // selectFolder
    // User clicks on folder name. 
    // This is used by the folder panel, not the tree view.
    //
    self.selectFolder = function (folder) {
        self.rootFolder(folder);
        self.getFolderData();
    }

    // selectFolderObject
    // Used by the tree view, each node of which is a object containing files[], folders[] and a path.
    //
    self.selectFolderObject = function (folder) {
        self.rootFolder(folder.path);
        self.getFolderData();              // Note: No need to refresh tree view
    }

    // canGoUp
    // Returns true if we're not already on the root folder.
    // Causes the up-folder icon to disappear if false.
    self.canGoUp = function () {
        consolelog("canGoUp rootFolder: " + self.rootFolder());
        return (self.rootFolder() != "");
    }

    // selectFile
    // Read the given file and display it.
    // 
    self.selectFile = async function (file) {
        self.currentFile(file);
        await self.getCurrentFileContents();
    }

    // getCurrentFileContents
    // Updates self.currentFileContents using path in self.currentFile
    //
    self.getCurrentFileContents = async () => {

        //
        // if currentFile were an actual observable...
        //
        //self.currentFile.subscribe(
        //    p => alert("Subscribed to currentFile: " + p),
        //    err => alert(err),
        //    () => alert("finally")
        //);

        var path = self.currentFile();

        if (self.filenameIsOKToDisplay(path)) {
            consolelog('Loading : ' + path);

            // https://api.jquery.com/jquery.ajax/
            var xhr = await self.getFile(path);

        } else {
            self.UpdateStatusMessage("Can't display that kind of file. Try downloading it.");
        }
    }
    // downloadFile
    // TODO: Add to tree view. Add delete, too. 
    //
    self.downloadFile = async (filename) => {
        var path = filename;

        // https://api.jquery.com/jquery.ajax/
        //
        var xhr = await self.getFile(filename).then((res) => {
            var [success, msg, data] = self.getParams(res);

            self.UpdateStatusMessage(msg);
            if (success) {
                var contentType = self.GetContentTypeForFilename(path);
                download(data, filename, contentType);
            }
        });

    }

    // getFile
    // 
    // Called by : getCurrentFileContents, downloadFile (above)  
    //
    self.getFile = (path) => {
        return $.ajax('/default/GetFile', {
            method: "POST",
            data: { 'filepath': path }
        }).done(function (res) {
            var [success, msg, data] = self.getParams(res);

            if (success) self.currentFileContents(data);

            self.UpdateStatusMessage(msg);
            consolelog(msg);

        }).fail(function (err) {
            self.UpdateStatusMessage(`${path} could not be loaded. Error: ${err.responseText}`);
        }).always(() => {
            // alert("always fired");
        });

    }

    // getParams
    // Picks success, msg, and data from an incoming ajax response, returns it as an array that can be deconstructed.
    //
    self.getParams = (res) => {
        var success = res.success;
        var msg = res.msg;
        var data = res.data;

        return [success, msg, data];
    }

    // addFolder
    // Add a new folder to the current rootFolder.
    //
    self.addFolder = (e) => {
        var path;
        var root = self.rootFolder();
        var newfolder = self.newFolderName();

        if (newfolder == "") return;

        if (root != "") {
            path = root + "\\" + self.newFolderName();
        } else path = self.newFolderName();

        var xhr = $.ajax('/default/AddFolder',
            {
                method: "POST",
                data: { 'newfolderpath': path }
            }
        ).done(function (res) {
            //var success = res.success == "true";
            //var msg = res.msg;
            var [success, msg, data] = self.getParams(res);

            consolelog(msg);
            self.UpdateStatusMessage(msg);

            if (success) {
                self.refreshBothLists();
            }

        }).fail(function (err) {
            self.UpdateStatusMessage(`Error adding folder : ${err.statusText}`);
        });

    }


    // GetContentTypeForFilename
    //
    //
    self.GetContentTypeForFilename = (filename) => {
        return ""; // TODO: finish this! Although it doesn't seem to matter.
    }

    // filenameIsOKToDisplay
    // TODO: needs work
    //
    self.filenameIsOKToDisplay = (filename) => {
        if (filename != undefined) {
            var pieces = filename.split(".");
            var ext = pieces[pieces.length - 1];
            var badexts = ['exe', 'png', 'jpg', 'gif', 'dat', 'bak', 'zip', 'rar', 'pdf']; // TODO: Get these from server?
            return !badexts.includes(ext);
        } return false;
    }

    // copyToClipboard
    //
    // Copies the currently displayed file to the clipboard asynchronously.
    // Note: Shows that the second argument to the 'then' function is the "catch" callback. 
    //       In other words, catch is just sugar.
    self.copyToClipboard = async () => {

        //await navigator.clipboard.writeText(self.currentFileContents())
        //    .then(() => {
        //        /* clipboard successfully set */
        //        self.UpdateStatusMessage(`Copied ${self.currentFile()} to clipboard.`);
        //    }, function () {
        //        /* clipboard write failed */
        //        self.UpdateStatusMessage(`Could not copy ${self.currentFile()} to clipboard.`);
        //    });

        // This is classic way of writing it.
        //
        await navigator.clipboard.writeText(self.currentFileContents())
            .then(() => {
                /* clipboard successfully set */
                self.UpdateStatusMessage(`Copied ${self.currentFile()} to clipboard.`);
            }).catch(() => {
                /* clipboard write failed */
                self.UpdateStatusMessage(`Could not copy ${self.currentFile()} to clipboard.`);
            });

    }


    // currentFolderCanBeDeleted
    // It has no files or folders.
    //
    self.currentFolderCanBeDeleted = () => {
        return self.numberOfFiles() == 0 && self.numberOfFolders() == 0;
    }



    // copyFile
    //
    //
    self.copyFile = function (frompath, topath) {

        var xhr = $.ajax('/default/CopyFileOrDirectory', {
            method: "POST",                // should always delete with POST 
            data: { frompath, topath }
        }).done(function (res) {
            consolelog(res);
            self.UpdateStatusMessage(res);

            self.refreshBothLists();
            // TODO: Only do this if the file just deleted is in the search listing
            // 
            self.doSearch();
        }).fail(function (err) {
            consolelog('Error: ' + err);
            self.UpdateStatusMessage("Error: " + err.statusText);
        });
    }

    // moveFile 
    //
    //
    self.moveFile = function (frompath, topath) {
        var xhr = $.ajax('/default/MoveFileOrDirectory', {
            method: "POST",                // should always delete with POST 
            data: { frompath, topath }
        }).done(function (res) {
            consolelog(res);
            self.UpdateStatusMessage(res);
            self.refreshBothLists();
            // TODO: Only do this if the file just deleted is in the search listing
            // 
            self.doSearch();
        }).fail(function (err) {
            consolelog('Error: ' + err);
            self.UpdateStatusMessage("Error: " + err.statusText);
        });
    }

    // TODO: change name to deleteFileOrDirectory
    self.deleteFileOrDirectory = function (file, bForced) {
        var filepath;
        filepath = file;
        if (bForced == undefined) bForced = false;

        //// If we're deleting the currently displayed file, 
        //// clear the display
        //if (file == self.currentFile()) {
        //    self.currentFile("");
        //    self.currentFileContents("");
        //} else {
        //    if (file == self.rootFolder()) {
        //        self.goUp();
        //    }
        //}

        var xhr = $.ajax('/default/DeleteFileOrDirectory', {
            method: "POST",                // should always delete with POST 
            data: { filepath, bForced }
        }).done(function (res) {
            consolelog(res);
            self.UpdateStatusMessage(res);

            // If we're deleting the currently displayed file, 
            // clear the display
            if (file == self.currentFile()) {
                self.currentFile("");
                self.currentFileContents("");
            } else {
                if (file == self.rootFolder()) {
                    self.goUp();
                }
            }

            self.refreshBothLists();
            // TODO: Only do this if the file just deleted is in the search listing
            // 
            self.doSearch();
        }).fail(function (err) {
            consolelog('Error: ' + err);
            self.UpdateStatusMessage("Error: " + err)
        });

    }

    // goUp
    // Removes the last segment of the rootFolder, then refreshes both views. 
    //
    //
    self.goUp = () => {
        //alert(self.rootFolder());
        var newpath = self.rootFolder();
        if (newpath != "") {
            newpath = self.RemoveLastDirectoryPartOf(newpath);
        }
        self.rootFolder(newpath);
        self.refreshBothLists();
    }

    //
    //
    //
    //
    self.UpdateStatusMessage = function (msg) {

        if (msg === "")
            self.statusMessage("");
        else {
            var d = new Date();
            var t = d.getHours() + ":" + d.getMinutes();
            self.statusMessage(t + ' -- ' + msg + "<hr/>" + self.statusMessage());
        }

        //document.getElementById("statusMessage").classList.remove("hidden");
    }

    //
    // Used to go up a folder level. 
    //
    self.RemoveLastDirectoryPartOf = function (the_url) {
        return the_url.substring(0, the_url.lastIndexOf('\\'));
    }


    // doSearch 
    //
    //
    //
    self.doSearch = async () => {
        //alert("Search called");
        var searchphrase = self.searchPhrase();

        // Clear the search if blank phrase is entered.
        if (searchphrase == undefined || searchphrase == "") {
            self.searchPhrase("");
            self.numberOfSearchResults(0);
            self.searchResults([]);
            return;
        }

        var path = self.rootFolder();
        var xhr = await $.ajax('/default/searchFolder', {
            method: "POST",
            data: { searchphrase, path }
        }).done(function (res) {
            var success = res.success;
            var msg = res.msg;
            var data = res.data;

            //alert(JSON.stringify(res));
            self.searchResults(data);
            self.UpdateStatusMessage(msg);

            self.numberOfSearchResults(data.length);

            self.updateUrlWithState();

            updateDragClassesAndHandlers();  // because new elements have been added
        }).fail(function (err) {
                alert("There was an error searching. See the log for details.");
                self.UpdateStatusMessage(err.responseText);
        });
    }

    // updateUrlWithState
    // Adds data after # in url to hold the state, in case a user wants to share a particular search or rootFolder by just sharing the URL.
    //
    self.updateUrlWithState = function () {
        var location = document.location.href;
        document.location = location.split("#")[0] + "#" + self.searchPhrase() + "&" + self.rootFolder();
    }

    // refreshBothLists
    // This makes ajax calls to refresh both displays
    //
    self.refreshBothLists = async () => {

        //await self.getDirectoryTree();  // tree view

        self.getDirectoryTreeJS();  // tree view, using worker 

        await self.getFolderData();     // folder/file panel view 
    }

    // getDirectoryTreeJS
    // Uses the WebWorker to make the ajax call to get the directory tree data.
    //
    //
    self.getDirectoryTreeJS = function () {

        // worker is in DirectoryTreeWorker.js and DTreeWorker.js (the worker code)
        if (true) {
            directoryTreeWorker.postMessage({ msg: "start", path: "" });  // start WebWorker : get tree starting at root 
        }
        else {
            // for testing, 
            var path = "";
            var url = '/default/getFullDirectoryTree';

            var xhr = new XMLHttpRequest();

            // async = true 
            xhr.open('POST', url, true);  // no username/password

            //
            // processing data when loaded 
            //
            xhr.onload = (d) => {
                var resp = d.currentTarget;  // XMLHttpRequest
                var loaded = resp.loaded;    // total bytes loaded so far 
                var total = resp.total;      // total bytes in job
                if (resp.status == 200 && resp.statusText == "OK") {
                    var json = JSON.parse(d.currentTarget.responseText);
                    self.DirectoryTree(json);
                    updateDragClassesAndHandlers();
                    //
                    // collapse any paths in collapseFolders array
                    //
                    //if (self.collapsedFolders().length > 0) {
                    //    $.each($(".up"), (idx, toggleIcon) => {

                    //        var fullpath = $(toggleIcon).attr("fullpath");
                    //        if (self.pathIsCollapsed(fullpath)) {
                    //            $(toggleIcon).click();   // simulate clicking the UP icon to close the folder's contents
                    //        }
                    //    });
                    //}
                }
                else {
                    self.UpdateStatusMessage("ERROR reading directory tree : " + resp.status + " " + resp.statusText);
                }
            };

            xhr.onerror = (err) => {
                self.UpdateStatusMessage("Error in getDirectoryTreeJS: " + err);
            }

            var formdata = new FormData();
            formdata.append("rootpath", path);
            xhr.send(formdata);
        }


    }
    //
    // Gets a JSON object representing a tree structure. 
    // This object is displayed by a recursive knockoutJS template.
    // The tree always starts at the root folder, but this is changeable.
    //
    //self.getDirectoryTree = async function () {

    //    var path = "";
    //    await $.ajax({
    //        url: '/default/getFullDirectoryTree',
    //        method: 'POST',
    //        data: { 'rootpath': path }
    //    }).done(function (res) {
    //        // To view the json data, uncomment this and run the program.
    //        // self.currentFileContents(JSON.stringify(res, null, '\t'));

    //        self.DirectoryTree(res);  // knockoutJS template works its magic 

    //        //
    //        // collapse any paths in collapseFolders array
    //        //
    //        if (self.collapsedFolders().length > 0) {
    //            $.each($(".up"), (idx, toggleIcon) => {

    //                var fullpath = $(toggleIcon).attr("fullpath");
    //                if (self.pathIsCollapsed(fullpath)) {
    //                    // This makes the UI jump because folders are collapsed in turn. 
    //                    //val.click();
    //                    $(toggleIcon).parent().next("UL").css("display", "none");
    //                    $(toggleIcon).addClass("down");
    //                    $(toggleIcon).removeClass("up");
    //                }
    //            });
    //        }


    //        //
    //        // Temp code to test DirectoryTree.js 
    //        //
    //        //var data = self.DirectoryTree();
    //        //var foundnode = { path: "", folders: [], files: [] };
    //        //var node = findFolder(data, "Code\\js", foundnode);

    //        //console.log(`${node.path} has ${node.folders.length} folders and ${node.files.length} files.`);

    //        //var foldernode = findNextFolder(node);

    //    }).fail(function (err) {
    //        self.UpdateStatusMessage('Error: ' + err);
    //    });
    //}



    // getFolderData
    // Gets folder data from the API for a single folder, including list of folders and files.
    // The view is updated automatically via knockout observables.
    //
    self.getFolderData = async () => {

        var path = self.rootFolder();

        await $.ajax({
            url: '/default/getFolder',
            method: "POST",
            data: { p: path }
        }).done(function (res) {
            if (path == "") path = "root";
            self.UpdateStatusMessage(`Current Folder (${path}) refreshed.`);
            self.folders(res.folders);
            self.rootFolder(res.relativePath);

            //var prefix = "";
            //if (res.relativePath != "") {
            //    prefix = res.relativePath + "\\";
            //    res.files = res.files.map((x) => prefix + x);
            //}
            self.files(res.files);

            self.numberOfFiles(res.files.length);
            self.numberOfFolders(res.folders.length);

            self.updateUrlWithState();
            //
            // After files and folders are created, add drag-and-drop handlers to 
            // elements with .file, .folder, and .trashicon
            // 
            updateDragClassesAndHandlers();
        }).fail(function (err) {
            self.UpdateStatusMessage('Error: ' + JSON.stringify(err));
        });
    };

    self.getFileNameFromPath = (path) => {
        if (path != undefined) {
            //if (path == "Code") {
            //    debugger;
            //}
            var pieces = path.split("\\");
            //if (pieces.length > 1)
            return pieces[pieces.length - 1];
            //else
            //    return "";

        } else { return ""; }
    }

    self.getFolderNameFromPath = (path, bIsFile) => {
        if (path != undefined) {
            var pieces = path.split("\\");
            // remove all but the last element
            var name;
            if (pieces.length > 1) {
                name = pieces.slice(0, pieces.length - 1).join("\\");
            } else {
                if (bIsFile)
                    name = "";
                else
                    name = pieces[0];
            }

            return name;
        } else { return ""; }
    }

    self.init = async () => {
        if (self.searchPhrase() != "") {
            await self.doSearch();
        }
        await self.refreshBothLists();
    }
    // Note: I have stopped these methods from being called automatically on startup by using javascript "bind,"
    //       like this:
    //
    //       data-bind="click: myFunction.bind($data, 'param1', 'param2')"
    //
    // Here, we trigger getFolderData explicity on startup, and also run a search if a search term came in 
    // on the url after the #. These url params are passed into the contructor at the top of this file.
    //
    self.init();
}

// For DirectoryTree display 
class FolderTree {
    path = "";
    folders = [];
    files = [];
}










