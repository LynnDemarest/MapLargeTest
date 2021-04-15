

function FileManModel(searchPhrase, rootFolder) {
    var self = this; 
    //debugger;
    if (searchPhrase == undefined) searchPhrase = "";
    if (rootFolder == undefined) rootFolder = "";

    self.searchPhrase = ko.observable(searchPhrase);
    self.rootFolder = ko.observable(rootFolder);

    self.currentFolder = ko.computed(function () {
        if (self.rootFolder() == "")
            return "root";
        else
            return this.rootFolder();
    }, this);

    self.currentFile = ko.observable("");
    self.currentFileContents = ko.observable("");
  
    self.folders = ko.observable([]);
    self.files = ko.observable([]);

    self.searchResults = ko.observable([]);
    self.numberOfSearchResults = ko.observable(0);

    self.numberOfFolders = ko.observable(0);
    self.numberOfFiles = ko.observable(0);
    self.statusMessage = ko.observable("");


    //
    // user clicks on folder name. The name of the folder is passed in automatically by knockout. 
    //
    self.selectFolder = function (folder) {
        var newpath = self.rootFolder();
        if (newpath != "")
        {
            newpath += "\\";
        }
        newpath += folder;
        self.rootFolder(newpath);
        
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
    self.getCurrentFileContents = async () =>
    {
        //self.currentFileContents(`current file contents for ${self.currentFile()}`);

        var rootFolder = self.rootFolder();
        var filename = self.currentFile(); 

        self.UpdateStatusMessage('Loading : ' + filename + ' in folder ' + rootFolder);

        // https://api.jquery.com/jquery.ajax/
        await $.ajax({
            url: '/default/GetFile',
            method: "POST",
            data: { 'filepath': rootFolder, 'filename': filename }
        }).done(function (res) {
                //alert(res);
                self.currentFileContents(res);
                self.UpdateStatusMessage('Done loading : ' + filename + ' in folder ' + rootFolder);
          })
          .fail(function (err) {
                self.UpdateStatusMessage('Error: ' + err);
          });
    }
    //
    // Copies the currently displayed file to the clipboard asynchronously.
    //
    self.copyToClipboard = async () =>
    {
        await navigator.clipboard.writeText(self.currentFileContents()).then(function () {
            /* clipboard successfully set */
            self.UpdateStatusMessage(`Copied ${self.currentFile()} to clipboard.`);
        }, function () {
            /* clipboard write failed */
            self.UpdateStatusMessage(`Could not copy ${self.currentFile()} to clipboard.`);
        });
    }


    self.deleteFile = function (file) {
        //alert(file + " deleted");
        var path;
        if (self.rootFolder() !== "") {
            // We only add the rootFolder if it's not the empty string. 
            // If is IS the empty string, the Path.Combine function on the server 
            // will take it (\\file) as an absolute path and that's obviously not right! 
            path = self.rootFolder() + "\\" + file;
        }
        else path = file;
        //alert(path);
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
        })
        .fail(function (err) {
            console.log('Error: ' + err);
        });

    }
    self.uploadFile = function () {
        
        doUpload().then( () => self.getFolderData() );  // refresh
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

    self.UpdateStatusMessage = function (msg)
    {
        if (msg != "") {
            self.statusMessage(msg);
            document.getElementById("statusMessage").classList.remove("hidden");
        } else {
            // there's no message, so hide the panel
            document.getElementById("statusMessage").classList.add("hidden");
        }
    }

    self.RemoveLastDirectoryPartOf = function(the_url) {
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

    //
    //
    // Download the file clicked. 
    //
    //self.downloadFile(filename)
    //{
    //    var url = "/default/GetFile";

    //    fetch(url)
    //        .then(resp => resp.blob())
    //        .then(blob => {
    //            const url = window.URL.createObjectURL(blob);
    //            const a = document.createElement('a');
    //            a.style.display = 'none';
    //            a.href = url;
    //            // the filename you want
    //            a.download = filename;
    //            document.body.appendChild(a);
    //            a.click();
    //            window.URL.revokeObjectURL(url);
    //            self.UpdateStatusMessage('Your file has downloaded!');
    //        })
    //        .catch(() => alert('oh no!'));
    //}

    // getFolderData
    // Gets folder data from the API, including list of folders and files.
    // The view is updated automatically via knockout observables.
    //
    self.getFolderData = function() {
        var path = self.rootFolder();

        $.ajax({
            url: '/default/getFolder?p=' + path
        })
            .done(function (res) {
                if (path == "") path = "root";
                self.UpdateStatusMessage(`Current Folder (${path}) refreshed.`);
                self.folders(res.folders);
                self.rootFolder(res.relativePath);
                self.files(res.files);
                self.numberOfFiles(res.files.length);
                self.numberOfFolders(res.folders.length);
            })
            .fail(function (err) {
                self.UpdateStatusMessage('Error: ' + err);
            });
    };

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







