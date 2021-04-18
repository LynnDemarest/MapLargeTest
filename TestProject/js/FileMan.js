
// FileManModel
// knockoutJS viewmodel. 
//
//
function FileManModel(searchPhrase, rootFolder) {
    var self = this;
    
    if (searchPhrase == undefined) searchPhrase = "";
    if (rootFolder == undefined) rootFolder = "";

    self.rootFolder = ko.observable(rootFolder);
    self.searchPhrase = ko.observable(searchPhrase);
        
    self.newFolderName = ko.observable("");

    self.DirectoryTree = ko.observableArray();

    // This is the current root folder name or "root" for the beginning "" folder.
    self.currentFolder = ko.computed(function () {
        if (self.rootFolder() == "")
            return "root";
        else
            return this.rootFolder();
    }, this);

    self.currentFile = ko.observable("");
    self.currentFileContents = ko.observable("");  // displayed

    self.folders = ko.observableArray();
    self.files = ko.observableArray();

    self.searchResults = ko.observableArray();
    self.numberOfSearchResults = ko.observable(0);

    self.numberOfFolders = ko.observable(0);
    self.numberOfFiles = ko.observable(0);
    self.statusMessage = ko.observable("");

    
    self.isCurrentFile = (data) => {
        consolelog("isCurrentFile: " + data);
        return data == self.currentFile();
    };


    // selectFolder
    // User clicks on folder name. The name of the folder is passed in automatically by knockout. 
    // This is used by the folder panel, not the tree view.
    //
    self.selectFolder = function (folder) {
        var newpath = self.rootFolder();
        if (newpath != "") {
            newpath += "\\";
        }
        newpath += folder;
        self.rootFolder(newpath);

        self.getFolderData();
    }

    // selectFolderObject
    // Used by the tree view, each node of which is a object containing files[], folders[] and a path.
    //
    self.selectFolderObject = function (folder) {
        self.rootFolder(folder.path);
        self.getFolderData();  // Note: No need to refresh tree view
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

        var xxx = self.currentFile().subscribe((p) => {
            alert(p);
        })

        var path = self.currentFile();

        if (self.filenameIsOKToDisplay(path)) {
            consolelog('Loading : ' + path);

            // https://api.jquery.com/jquery.ajax/
            await $.ajax({
                url: '/default/GetFile',
                method: "POST",
                data: { 'filepath': path }
            }).done(function (res) {
                self.currentFileContents(res);
                consolelog('Done loading : ' + path);
            })
                .fail(function (err) {
                    self.UpdateStatusMessage(`${path} could not be loaded. Error: ${err.statusText}`);
                });
        } else {
            self.UpdateStatusMessage("Can't display that kind of file. Try downloading it.");
        }
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

        $.ajax({
            url: '/default/AddFolder',
            method: "POST",
            data: { 'newfolderpath': path }
        }).done(function (res) {
            consolelog('Done creating : ' + path + ' ' + res);
            self.refreshBothLists();
        }).fail(function (err) {
            self.UpdateStatusMessage(`${path} could not be added. Error: ${err.statusText}`);
        });

    }

    // downloadFile
    // TODO: Add to tree view. Add delete, too. 
    //
    self.downloadFile = async (filename) => {
        var path = filename;
        var rootFolder = self.rootFolder();

        // https://api.jquery.com/jquery.ajax/
        await $.ajax({
            url: '/default/GetFile',
            method: "POST",
            data: { 'filepath': path }
        }).done(function (res) {
            //self.UpdateStatusMessage('Done loading : ' + path);
            var contentType = self.GetContentTypeForFilename(path);
            //
            // in index.html
            //
            download(res, filename, contentType);
        }).fail(function (err) {
            self.UpdateStatusMessage('Error: ' + err.statusText);
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
        var pieces = filename.split(".");
        var ext = pieces[pieces.length - 1];
        var badexts = ['exe', 'png', 'jpg', 'gif', 'dat', 'bak', 'zip', 'rar', 'pdf']; // TODO: Get these from server?
        return !badexts.includes(ext);
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
            .then( () => {
                /* clipboard successfully set */
                self.UpdateStatusMessage(`Copied ${self.currentFile()} to clipboard.`);
            }).catch( () => {
                /* clipboard write failed */
                self.UpdateStatusMessage(`Could not copy ${self.currentFile()} to clipboard.`);
            });

    }

    // CalcPath
    // Only add rootFolder prefix if the 
    //
    //self.CalcPath = (file) => {
    //    var path;
    //    if (file.indexOf("\\") != -1) {
    //        // file has the full path included, so do nothing
    //        path = file;
    //    }
    //    else {
    //        if (self.rootFolder() !== "") {
    //            // We only add the rootFolder if it's not the empty string. 
    //            // If is IS the empty string, the Path.Combine function on the server 
    //            // will take it (\\file) as an absolute path and that's obviously not right! 
    //            path = self.rootFolder() + "\\" + file;
    //        } else path = file;
    //    }
    //    return path;
    //}

    // currentFolderCanBeDeleted
    // It has no files or folders.
    //
    self.currentFolderCanBeDeleted = () => {
        return self.numberOfFiles() == 0 && self.numberOfFolders() == 0;
    }


    // deleteFolder
    //
    //
    self.deleteFolder = function () {

        var path = self.rootFolder();  // TODO: rename to current folder 

        $.ajax({
            url: '/default/DeleteFolder',
            method: "POST",                // should always delete with POST 
            data: { folderpath: path }
        })
            .done(function (res) {
                //debugger;
                consolelog(res);
                self.UpdateStatusMessage(res);

                self.goUp();
                //self.getFolderData();
                self.refreshBothLists();
                // TODO: Only do this if the folder just deleted is involved in the search listing
                // 
                self.doSearch();

                // Note: Kludge. Open the tree view, because it sometimes closes! 
                var obj = document.getElementById("divDirectoryTreeContainer");
                obj.hidden = false;

            })
            .fail(function (err) {
                consolelog('Error: ' + err);
            });

    }

    // copyFile
    //
    //
    self.copyFile = function (frompath, topath) {
        //alert("Would copy " + frompath + " to " + topath);
        $.ajax({
            url: '/default/CopyFileOrDirectory',
            method: "POST",                // should always delete with POST 
            data: { frompath, topath }
        }).done(function (res) {
            //debugger;
            consolelog(res);
            self.UpdateStatusMessage(res);
            //self.getFolderData();
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
        $.ajax({
            url: '/default/MoveFileOrDirectory',
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

    self.deleteFile = function (file, bForced) {
        var filepath;
        filepath = file;
        if (bForced == undefined) bForced = false;

        //alert("would delete " + filepath);
        //return;

        // If we're deleting the currently displayed file, 
        // clear the display
        if (file == self.currentFile()) {
            self.currentFile("");
            self.currentFileContents("");
        }

        $.ajax({
            url: '/default/DeleteFileOrDirectory',
            method: "POST",                // should always delete with POST 
            data: { filepath, bForced }
        })
            .done(function (res) {
                //debugger;
                consolelog(res);
                self.UpdateStatusMessage(res);
                
                self.refreshBothLists();
                // TODO: Only do this if the file just deleted is in the search listing
                // 
                self.doSearch();
            })
            .fail(function (err) {
                consolelog('Error: ' + err);
                self.UpdateStatusMessage("Error: " + err)
            });

    }

    //self.uploadFile = function () {

    //    doUpload().then(() => {
    //        self.refreshBothLists();
    //    }).catch((err) => { self.UpdateStatusMessage(err) });  // refresh
    //}

    self.goUp = () => {
        //alert(self.rootFolder());
        var newpath = self.rootFolder();
        if (newpath != "") {
            newpath = self.RemoveLastDirectoryPartOf(newpath);
        }
        self.rootFolder(newpath);

        //alert(newpath);
        //self.getFolderData();
        //self.getDirectoryTree();
        self.refreshBothLists();
        //if (self.rootFolder() != "") {
        //    self.UpdateStatusMessage(`Current folder: New root path is ${self.rootFolder()}`)
        //} 
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
        await $.ajax({
            url: '/default/searchFolder',
            method: "POST",
            data: { searchphrase, path }
        })
            .done(function (res) {
                //alert(JSON.stringify(res));
                self.searchResults(res);
                self.UpdateStatusMessage(`Search for found ${res.length} files.`);

                self.numberOfSearchResults(res.length);

                self.updateUrlWithState();

                updateDragClassesAndHandlers();  // because new elements have been added
            })
            .fail(function (err) {
                alert("There was an error searching. See the log for details.");
                self.UpdateStatusMessage('Search Error: ' + JSON.stringify(err));
            });
    }

    //
    // Adds data after # in url to hold the state, in case a user wants to share a particular search or rootFolder.
    //
    self.updateUrlWithState = function () {
        var location = document.location.href;
        document.location = location.split("#")[0] + "#" + self.searchPhrase() + "&" + self.rootFolder();
    }

    //
    // This makes ajax calls to refresh both displays
    //
    self.refreshBothLists = async () => {
        await self.getDirectoryTree();  // tree view
        await self.getFolderData();     // folder/file panel view 
    }

    //
    // Gets a JSON object representing a tree structure. 
    // This object is displayed by a recursive knockoutJS template.
    // The tree always starts at the root folder, but this is changeable.
    //
    self.getDirectoryTree = async function () {
        var path = "";
        await $.ajax({
            url: '/default/getFullDirectoryTree',
            method: 'POST',
            data: { 'rootpath': path }
        }).done(function (res) {
            //if (path == "") path = "root";

            // To view the json data, uncomment this and run the program.
            // self.currentFileContents(JSON.stringify(res, null, '\t'));

            self.DirectoryTree(res);  // knockoutJS template works its magic 

        }).fail(function (err) {
            self.UpdateStatusMessage('Error: ' + err);
        });
    }



    // getFolderData
    // Gets folder data from the API for a single folder, including list of folders and files.
    // The view is updated automatically via knockout observables.
    //
    self.getFolderData = async () => {

        var path = self.rootFolder();

        await $.ajax({
            url: '/default/getFolder?p=' + path
        }).done(function (res) {
                if (path == "") path = "root";
                self.UpdateStatusMessage(`Current Folder (${path}) refreshed.`);
                self.folders(res.folders);
                self.rootFolder(res.relativePath);

                var prefix = "";
                if (res.relativePath != "") {
                    prefix = res.relativePath + "\\";
                    res.files = res.files.map((x) => prefix + x);
                }
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
                self.UpdateStatusMessage('Error: ' + err);
            });
    };

    self.getFileNameFromPath = (path) => {
        if (path != undefined) {
            var pieces = path.split("\\");
            return pieces[pieces.length - 1];
        } else { return ""; }
    }

    self.getFolderNameFromPath = (path) => {
        if (path != undefined) {
            var pieces = path.split("\\");
            var name = pieces[pieces.length - 1];
            if (name == "") name = "root";
            return name;
        } else { return "root"; }
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










