

function FileManModel(searchPhrase, rootFolder) {
    var self = this;
    //debugger;
    if (searchPhrase == undefined) searchPhrase = "";
    if (rootFolder == undefined) rootFolder = "";

    self.searchPhrase = ko.observable(searchPhrase);
    self.rootFolder = ko.observable(rootFolder);

    // to add a new folder 
    self.newFolderName = ko.observable("");

    self.DirectoryTree = ko.observableArray();

    self.currentFolder = ko.computed(function () {
        if (self.rootFolder() == "")
            return "root";
        else
            return this.rootFolder();
    }, this);

    self.currentFile = ko.observable("");
    self.currentFileContents = ko.observable("");  // displayed

    //self.downloadFileContents = ko.observable(""); // not displayed, so big files and binary files work

    self.folders = ko.observableArray();
    self.files = ko.observableArray();

    self.searchResults = ko.observableArray();
    self.numberOfSearchResults = ko.observable(0);

    self.numberOfFolders = ko.observable(0);
    self.numberOfFiles = ko.observable(0);
    self.statusMessage = ko.observable("");


    //
    // user clicks on folder name. The name of the folder is passed in automatically by knockout. 
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
    self.selectFolderObject = function (folder) {
        //var newpath = self.rootFolder();
        //if (newpath != "") {
        //    newpath += "\\";
        //}
        //newpath += folder.path;
        //self.rootFolder(newpath);
        self.rootFolder(folder.path);
        self.getFolderData();
    }

    self.canGoUp = function () {
        console.log(self.rootFolder());
        return (self.rootFolder() != "");
    }
    //
    // We want to read the file and download it to the browser.
    // 
    self.selectFile = async function (file) {

        //self.UpdateStatusMessage(file + " selected");

        self.currentFile(file);

        await self.getCurrentFileContents();
    }
    self.getCurrentFileContents = async () => {
        //self.currentFileContents(`current file contents for ${self.currentFile()}`);

        //var rootFolder = self.rootFolder();
        //var filename = self.currentFile();

        var path = self.currentFile();

        if (self.filenameIsOKToDisplay(path)) {

            self.UpdateStatusMessage('Loading : ' + path);

            // https://api.jquery.com/jquery.ajax/
            await $.ajax({
                url: '/default/GetFile',
                method: "POST",
                data: { 'filepath': path }
            }).done(function (res) {
                //alert(res);
                self.currentFileContents(res);
                self.UpdateStatusMessage('Done loading : ' + path);
            })
                .fail(function (err) {
                    self.UpdateStatusMessage(`${path} could not be loaded. Error: ${err.statusText}`);
                });
        } else {
            self.UpdateStatusMessage("Can't display that kind of file. Try downloading it.");
        }
    }

    self.addFolder = () => {
        // api : addFolder(newfolderpath)
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
            self.UpdateStatusMessage('Done creating : ' + path + ' ' + res);
            self.getFolderData();
        }).fail(function (err) {
            self.UpdateStatusMessage(`${path} could not be added. Error: ${err.statusText}`);
        });

    }

    self.downloadFile = async (filename) => {

        //alert("downloading " + filename);
        //return;
        var path = filename;
        var rootFolder = self.rootFolder();

        //if (filename.indexOf("\\") == -1) {
        //    self.UpdateStatusMessage('Loading : ' + filename + ' in folder ' + rootFolder);
        //}
        //else {
        //    self.UpdateStatusMessage('Loading : ' + filename);
        //    var pieces = filename.split("\\");
        //    filename = pieces[pieces.length - 1];
        //    rootFolder = filename.substring(0, filename.lastIndexOf('\\'));
        //}

        // https://api.jquery.com/jquery.ajax/
        await $.ajax({
            url: '/default/GetFile',
            method: "POST",
            data: { 'filepath': path }
        }).done(function (res) {
            //alert(res);
            //self.downloadFileContents(res);  

            //var thefolder = rootFolder;
            //if (thefolder == "") thefolder = "root";
            self.UpdateStatusMessage('Done loading : ' + path);
            var contentType = self.GetContentTypeForFilename(path);
            //
            // in index.html
            //
            download(res, filename, contentType);
        })
            .fail(function (err) {
                self.UpdateStatusMessage('Error: ' + err.statusText);
            });
    }
    self.GetContentTypeForFilename = (filename) => {
        return ""; // TODO: finish this! 
    }

    self.filenameIsOKToDisplay = (filename) => {
        var pieces = filename.split(".");
        var ext = pieces[pieces.length - 1];
        var badexts = ['exe', 'png', 'jpg', 'gif', 'dat', 'bak', 'zip', 'rar']; // TODO: Get these from server?
        return !badexts.includes(ext);
    }

    //
    // Copies the currently displayed file to the clipboard asynchronously.
    //
    self.copyToClipboard = async () => {
        await navigator.clipboard.writeText(self.currentFileContents()).then(function () {
            /* clipboard successfully set */
            self.UpdateStatusMessage(`Copied ${self.currentFile()} to clipboard.`);
        }, function () {
            /* clipboard write failed */
            self.UpdateStatusMessage(`Could not copy ${self.currentFile()} to clipboard.`);
        });
    }


    self.CalcPath = (file) => {
        var path;
        if (file.indexOf("\\") != -1) {
            // file has path included, so do nothing
            path = file;
        }
        else {
            if (self.rootFolder() !== "") {
                // We only add the rootFolder if it's not the empty string. 
                // If is IS the empty string, the Path.Combine function on the server 
                // will take it (\\file) as an absolute path and that's obviously not right! 
                path = self.rootFolder() + "\\" + file;
            } else path = file;
        }
        return path;
    }

    self.currentFolderCanBeDeleted = () => {
        return self.numberOfFiles() == 0 && self.numberOfFolders() == 0;
    }

    self.deleteFolder = function () {

        var path = self.rootFolder();  // TODO: rename to current folder 

        $.ajax({
            url: '/default/DeleteFolder',
            method: "POST",                // should always delete with POST 
            data: { folderpath: path }
        })
            .done(function (res) {
                //debugger;
                console.log(res);
                self.UpdateStatusMessage(res);

                self.goUp();
                self.getFolderData();

                // TODO: Only do this if the folder just deleted is involved in the search listing
                // 
                self.doSearch();
            })
            .fail(function (err) {
                console.log('Error: ' + err);
            });

    }


    self.deleteFile = function (file) {
        var path;
        path = file;

        $.ajax({
            url: '/default/deleteFile',
            method: "POST",                // should always delete with POST 
            data: { filepath: path }
        })
            .done(function (res) {
                //debugger;
                console.log(res);
                self.UpdateStatusMessage(res);
                self.getFolderData();
                // TODO: Only do this if the file just delete is in the search listing
                // 
                self.doSearch();
            })
            .fail(function (err) {
                console.log('Error: ' + err);
            });

    }

    self.uploadFile = function () {

        doUpload().then(() => {
            self.getFolderData();
            self.getDirectoryTree();
        }).catch((err) => { self.UpdateStatusMessage(err) });  // refresh
    }

    self.goUp = () => {
        //alert(self.rootFolder());
        var newpath = self.rootFolder();
        if (newpath != "") {
            newpath = self.RemoveLastDirectoryPartOf(newpath);
        }
        self.rootFolder(newpath);
        //alert(newpath);
        self.getFolderData();
        if (self.rootFolder() != "") {
            self.UpdateStatusMessage(`New root path is ${self.rootFolder()}`)
        } else self.statusMessage(``);
    }

    self.UpdateStatusMessage = function (msg) {
        if (msg != "") {
            self.statusMessage(msg);
            document.getElementById("statusMessage").classList.remove("hidden");
        } else {
            // there's no message, so hide the panel
            document.getElementById("statusMessage").classList.add("hidden");
        }
    }

    //
    // Used to go up a folder level. 
    //
    self.RemoveLastDirectoryPartOf = function (the_url) {
        return the_url.substring(0, the_url.lastIndexOf('\\'));
    }

    self.doSearch = function () {

        var searchphrase = self.searchPhrase();
        if (searchphrase == undefined || searchphrase == "") return;

        //alert(this.searchPhrase());
        var path = self.rootFolder();

        $.ajax({
            url: '/default/searchFolder',
            method: "POST",
            data: { 'searchphrase': searchphrase, 'path': path }
        })
            .done(function (res) {
                //alert(JSON.stringify(res));
                self.searchResults(res);
                self.UpdateStatusMessage(`${res.length} files found`);
                self.numberOfSearchResults(res.length);
                if (false) {
                    var obj = document.getElementById("divSearchResults");
                    if (res.length == 0) {
                        obj.classList.add("hidden");
                    } else obj.classList.remove("hidden");
                }
                var location = document.location.href;
                if (location.indexOf("#") != -1) {
                    document.location = location.split("#")[0] + "#" + encodeURIComponent(searchphrase) + "&" + self.rootFolder();
                }
            })
            .fail(function (err) {
                self.UpdateStatusMessage('Error: ' + err);
            });
    }

    self.getDirectoryTree = function ()
    {
        var path = self.rootFolder();

        $.ajax({
            url: '/default/getFullDirectoryTree',
            method: 'POST',
            data: { 'rootpath' : path }
        }).done(function (res) {
            if (path == "") path = "root";

            self.currentFileContents(JSON.stringify(res, null, '\t'));

            self.DirectoryTree(res);
                        
          }).fail(function (err) {
                self.UpdateStatusMessage('Error: ' + err);
            });
    }

    

    // getFolderData
    // Gets folder data from the API for a single folder, including list of folders and files.
    // The view is updated automatically via knockout observables.
    //
    self.getFolderData = function () {
        var path = self.rootFolder();

        $.ajax({
            url: '/default/getFolder?p=' + path
        })
            .done(function (res) {
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

                //
                // after files and folders are created, add drag and drop stuff
                //
                updateDragClassesAndHandlers();
            })
            .fail(function (err) {
                self.UpdateStatusMessage('Error: ' + err);
            });
    };

    self.getFileNameFromPath = (path) => {
        if (path != undefined) {
            var pieces = path.split("\\");
            return pieces[pieces.length - 1];
        } else { return ""; }
    }

    // Note: I have stopped these methods from being called automatically on startup by using javascript "bind,"
    //       like this:
    //
    //       data-bind="click: myFunction.bind($data, 'param1', 'param2')"
    //
    // Here, we trigger getFolderData explicity on startup, and also run a search if a search term came in 
    // on the url after the #. These url params are passed into the contructor at the top of this file.
    //
    self.getFolderData();
    if (self.searchPhrase() != "") {
        self.doSearch();
    }

    self.getDirectoryTree();
}

class FolderTree {
    path = "";
    folders = [];
    files = [];
}


//var FileManModel = {
//    rootFolder: ko.observable(""),
//    folders: ko.observableArray(["one","two"]),
//    files: ko.observableArray([])
//}




//class FileMan {

    // Returns a json object with information about the folders, files in the given path.
    // The path is relative to the root path on the server, which is variable. 
    // 
    //
    //getFolderData = (path) => {
    //    //
    //    // 
    //    //
    //    if (path == undefined) path = "";
    //    $.ajax({
    //        url: '/default/getFolder?p=' + path
    //    })
    //        .done(function (res) {
    //            console.log(res);
    //            debugger;
    //            //this.folders.push(res.folders);
    //            //FileManModel.rootFolder = res.relativePath;
    //            //FileManModel.folders = res.folders;
    //            //FileManModel.files = res.files;
    //        })
    //        .fail(function (err) {
    //            console.log('Error: ' + err);
    //        });
    //};

//}







