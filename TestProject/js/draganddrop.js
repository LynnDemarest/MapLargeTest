﻿//
// drag and drop
//

// updateDragClassesAndHandlers
// Hooks up various events to .file and .folder and .trashicon elements. 
//
// When new elements are added dynamically, they need to be hooked up. We do this here for all drag-and-drop elements. 
//
//
function updateDragClassesAndHandlers() {

    const files = document.querySelectorAll(".file");
    for (var f of files) {
        f.removeEventListener("dragstart", dragStart);
        f.removeEventListener("dragend", dragEnd);

        f.addEventListener("dragstart", dragStart);
        f.addEventListener("dragend", dragEnd);
    }

    const folders = document.querySelectorAll('.folder');
    for (var d of folders) {
        d.removeEventListener("dragstart", dragStart);
        d.removeEventListener("dragend", dragEnd);
        d.removeEventListener("dragover", dragOver);
        d.removeEventListener("dragenter", dragEnter);
        d.removeEventListener("dragleave", dragLeave);
        d.removeEventListener("drop", dragDrop);

        d.addEventListener("dragstart", dragStart);
        d.addEventListener("dragend", dragEnd);
        d.addEventListener("dragover", dragOver);
        d.addEventListener("dragenter", dragEnter);
        d.addEventListener("dragleave", dragLeave);
        d.addEventListener("drop", dragDrop);
    }

    // Note: There's only one trashcan now, but if you want to add more you can
    //       because of querySelectorAll. Also, the code is more consistent this way. 
    const trashcans = document.querySelectorAll('.trashicon');
    for (var t of trashcans) {
        t.removeEventListener("dragover", dragOver);
        t.removeEventListener("dragenter", dragEnterTrash)
        t.removeEventListener("dragleave", dragLeaveTrash)
        t.removeEventListener("drop", dragDelete);


        t.addEventListener("dragover", dragOver);
        t.addEventListener("dragenter", dragEnterTrash)
        t.addEventListener("dragleave", dragLeaveTrash)
        t.addEventListener("drop", dragDelete);
    }
    
}

//
//
//
function dragStart(e) {
    console.log("dragStart currentTarget.id = " + e.currentTarget.id);
    console.log("dragStart target.id = " + e.target.id);
    //debugger;
    var fullpath = e.currentTarget.attributes.fullpath.nodeValue;
    e.dataTransfer.setData("text", fullpath);
    console.log("text set to " + fullpath);
}

//
//
//
function dragEnd(e) {
    //console.log("dragEnd currentTarget.id = " + e.currentTarget.id);
    //console.log("dragEnd target.id = " + e.target.id);
    //console.log("text = " + e.dataTransfer.getData("text"));

}

function dragDelete(e) {
    //alert(JSON.stringify(e));
    var frompath = e.dataTransfer.getData("text");
    //alert(frompath);
    var bForced = e.ctrlKey;

    e.currentTarget.classList.remove("trashiconhover");
    e.currentTarget.classList.add("trashicon");
    model.viewModel.deleteFile(frompath, bForced);
}
function dragEnterTrash(e) {
    e.preventDefault();
    e.currentTarget.classList.add("trashiconhover");
    e.currentTarget.classList.remove("trashicon");

}
function dragLeaveTrash(e) {
    e.currentTarget.classList.remove("trashiconhover");
    e.currentTarget.classList.add("trashicon");
}
//
//
//
function dragDrop(e) {
    //e.preventDefault();
    //console.log("dragDrop target.id = " + e.target.id);  // folder_0
    //console.log("dragDrop currentTarget = " + JSON.stringify(e.currentTarget));
    //debugger;
    var frompath = e.dataTransfer.getData("text");
    //console.log("text = " + file);

    var topath;
    //frompath = document.getElementById(file).attributes.fullpath.textContent;
    //topath = document.getElementById(e.target.id).innerText;
    topath = document.getElementById(e.target.id).attributes.fullpath.textContent;

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

//
//
//
function copyFile(frompath, topath) {
    //alert("Would move " + frompath + " to " + topath);
    //return; 
    $.ajax({
        url: '/default/CopyFile',
        method: "POST",                // should always delete with POST 
        data: { frompath, topath }
    }).done(function (res) {
        //debugger;
        consolelog(JSON.stringify(res));

        model.viewModel.refreshBothLists();

        // TODO: Only do this if the file just deleted is in the search listing
        // 
        model.viewModel.doSearch();

        model.viewModel.UpdateStatusMessage(res.statusText);
    }).fail(function (err) {
        consolelog('Error: ' + err);
        model.viewModel.UpdateStatusMessage(err);
    });

}

// Note: It is required that any drop target handle both dragOver and dragEnter, 
//       and that e.preventDefault() be executed in each. 
// https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Drag_operations#drop
//
function dragOver(e) {
    e.preventDefault();
}
function dragEnter(e) {
    e.preventDefault();
    e.currentTarget.classList.add("dragEnter");
}
function dragLeave(e) {
    e.currentTarget.classList.remove("dragEnter");

}
