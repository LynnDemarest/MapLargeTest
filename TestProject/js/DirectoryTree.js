
//
// node may be either a folder or file node. 
// If it's a folder node, return the first file in the folder. If there are no files, recurse to the next folder and continue.
// If it's a file node, find the next file. If there is no next file, find the next sibling of the containing folder. If there
// is no next sibling, get the containing folder's parent and try again, and so on until you reach the top of the tree. 
// 
function findNextFile(node) {



}


//
// 
//
function findNextFolder(node) {

    // go to the parent, walk through the folders until you get to node.path
    // then select the next folder if there is one. 
    // return null if there isn't one. 
    var prevFolderPath = removeLastSegment(node.path);
    var nextFolder = {};
    var theFolder = findFolder(null, prevFolderPath, nextFolder);

}

function removeLastSegment(path) {
    if (path.length > 0 && path.indexOf("\\") != -1) {
        var pieces = path.split("\\");
        pieces = pieces.slice(0, pieces.length - 1);
        return pieces.join("\\");
    } return path;
}


function findFolder(node, folderPath, foundnode) {

    if (node == null) node = model.viewModel.DirectoryTree()[0];

    console.log(node.path);
    var thenode;
    if (node.path == folderPath) {
        foundnode = node;
        return foundnode;
    } else {
        if (node.folders.length > 0) {
            //node.folders.forEach(n => findFolder(n, folderPath));
            for (var x = 0; x < node.folders.length; x++) {
                var anode = findFolder(node.folders[x], folderPath, foundnode);
                if (anode != undefined) {
                    foundnode = anode;
                    return foundnode;
                }
            }
        }
    }

}




