//
// drag and drop handling 
//
//var elementBeingDragged;
//var elementBeingTargeted;

function updateDragClassesAndHandlers() {
    const files = document.querySelectorAll(".file");
    for (var f of files) {
        f.addEventListener("dragstart", dragStart);
        f.addEventListener("dragend", dragEnd);
        //f.addEventListener("drop", dragDrop);
    }
    const folders = document.querySelectorAll('.folder');
    for (var d of folders) {
        d.addEventListener("dragover", dragOver)
        d.addEventListener("dragenter", dragEnter)
        d.addEventListener("dragleave", dragLeave)
        d.addEventListener("drop", dragDrop);
    }

}
function dragStart(e) {
    console.log("dragStart currentTarget.id = " + e.currentTarget.id);
    console.log("dragStart target.id = " + e.target.id);
    //debugger;
    var fullpath = e.currentTarget.attributes.fullpath.nodeValue;
    e.dataTransfer.setData("text", fullpath);
    console.log("text set to " + fullpath);
}
function dragEnd(e) {
    //console.log("dragEnd currentTarget.id = " + e.currentTarget.id);
    //console.log("dragEnd target.id = " + e.target.id);
    //console.log("text = " + e.dataTransfer.getData("text"));

}
function dragDrop(e) {
    //e.preventDefault();
    //console.log("dragDrop target.id = " + e.target.id);  // folder_0
    //console.log("dragDrop currentTarget = " + JSON.stringify(e.currentTarget));
    //debugger;
    var frompath = e.dataTransfer.getData("text");
    //console.log("text = " + file);

    var topath;
    //frompath = document.getElementById(file).attributes.fullpath.textContent;
    topath = document.getElementById(e.target.id).innerText;

    // dragLeave doesn't get fired if dragDrop is fired, so remove the highlight here.
    //
    e.currentTarget.classList.remove("dragEnter");

    //alert(JSON.stringify(e));
    //debugger;
    if (true) {
        if (e.ctrlKey === true) {
            model.viewModel.copyFile(frompath, topath);
            //copyFile(frompath, topath);
        }
        else {
            model.viewModel.moveFile(frompath, topath);
        }
    } else {
        alert(frompath + " >>> " + topath);
    }
    //updateDragClassesAndHandlers();
}
function copyFile(frompath, topath) {
    //alert("Would move " + frompath + " to " + topath);
    //return; 
    $.ajax({
        url: '/default/CopyFile',
        method: "POST",                // should always delete with POST 
        data: { frompath, topath }
    }).done(function (res) {
        //debugger;
        console.log(JSON.stringify(res));

        model.viewModel.refreshBothLists();

        // TODO: Only do this if the file just deleted is in the search listing
        // 
        model.viewModel.doSearch();

        model.viewModel.UpdateStatusMessage(res.statusText);
    }).fail(function (err) {
        console.log('Error: ' + err);
    });

}
function dragOver(e) {
    e.preventDefault();
    //console.log("dragOver currentTarget.id = " + e.currentTarget.id);
    //console.log("dragOver target.id = " + e.target.id);
}
function dragEnter(e) {
    e.preventDefault();
    //console.log("dragEnter currentTarget.id = " + e.currentTarget.id);
    //console.log("dragEnter target.id = " + e.target.id);
    e.currentTarget.classList.add("dragEnter");
    //debugger;
    //var fullpath = $("#" + e.target.id).attr("fullpath");
    //alert("fullpath = " + fullpath);
    //e.dataTransfer.setData("text", fullpath);
}
function dragLeave(e) {
    console.log("dragLeave currentTarget.id = " + e.currentTarget.id);
    console.log("dragLeave target.id = " + e.target.id);

    e.currentTarget.classList.remove("dragEnter");

}
