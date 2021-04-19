//
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
        if (f.getAttribute("dragEventsOK") == null) {
            // model.viewModel.UpdateStatusMessage("Setting drag event handlers : " + f.innerText);
            consolelog("Setting drag event handlers for file : " + f.innerText);
            //f.removeEventListener("dragstart", dragStart);
            //f.removeEventListener("dragend", dragEnd);

            f.addEventListener("dragstart", dragStart);
            f.addEventListener("dragend", dragEnd);

            f.setAttribute("dragEventsOK", 'true');
        }
    }

    const folders = document.querySelectorAll('.folder');
    for (var d of folders) {
        if (d.getAttribute("dragEventsOK") == null) {

            consolelog("Setting drag event handlers for folder : " + d.innerText);

            //d.removeEventListener("dragstart", dragStart);
            //d.removeEventListener("dragend", dragEnd);
            //d.removeEventListener("dragover", dragOver);
            //d.removeEventListener("dragenter", dragEnter);
            //d.removeEventListener("dragleave", dragLeave);
            //d.removeEventListener("drop", dragDrop);

            d.addEventListener("dragstart", dragStart);
            d.addEventListener("dragend", dragEnd);
            d.addEventListener("dragover", dragOver);
            d.addEventListener("dragenter", dragEnter);
            d.addEventListener("dragleave", dragLeave);
            d.addEventListener("drop", dragDrop);

            d.setAttribute("dragEventsOK", 'true');
        }
    }


    // Note: There's only one trashcan now, but if you want to add more you can
    //       because of querySelectorAll. Also, the code is more consistent this way. 
    const trashcans = document.querySelectorAll('.trashicon');
    for (var t of trashcans) {

        if (t.getAttribute("dragEventsOK") == null) {

            consolelog("Setting drag event handlers for trashicon : " + t.innerText);

            //t.removeEventListener("dragover", dragOver);
            //t.removeEventListener("dragenter", dragEnterTrash)
            //t.removeEventListener("dragleave", dragLeaveTrash)
            //t.removeEventListener("drop", dragDelete);

            t.addEventListener("dragover", dragOver);
            t.addEventListener("dragenter", dragEnterTrash)
            t.addEventListener("dragleave", dragLeaveTrash)
            t.addEventListener("drop", dragDelete);

            t.setAttribute("dragEventsOK", 'true');
        }
    }

}

// dragStart
//
//
function dragStart(e) {
    consolelog("dragStart currentTarget.id = " + e.currentTarget.id);
    consolelog("dragStart target.id = " + e.target.id);
    //debugger;
    var fullpath = e.currentTarget.attributes.fullpath.nodeValue;
    e.dataTransfer.setData("text", fullpath);
    consolelog("text set to " + fullpath);
}

// dragEnd
//
//
function dragEnd(e) {
    //console.log("dragEnd currentTarget.id = " + e.currentTarget.id);
    //console.log("dragEnd target.id = " + e.target.id);
    //console.log("text = " + e.dataTransfer.getData("text"));

}

// dragDelete
//
//
function dragDelete(e) {
    //alert(JSON.stringify(e));
    var frompath = e.dataTransfer.getData("text");
    //alert(frompath);
    var bForced = e.ctrlKey;

    e.currentTarget.classList.remove("trashiconhover");
    e.currentTarget.classList.add("trashicon");
    model.viewModel.deleteFile(frompath, bForced);
}

// dragEnterTrash
//
//
function dragEnterTrash(e) {
    e.preventDefault();
    e.currentTarget.classList.add("trashiconhover");
    e.currentTarget.classList.remove("trashicon");

}

// dragLeaveTrash
//
//
function dragLeaveTrash(e) {
    e.currentTarget.classList.remove("trashiconhover");
    e.currentTarget.classList.add("trashicon");
}

// dragDrop
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

}


// dragOver and dragEnter
//
// Note: It is required that any drop target handle both dragOver and dragEnter, 
//       and that e.preventDefault() be executed in each. 
//
// https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Drag_operations#drop
//
function dragOver(e) {
    e.preventDefault();
}
// dragEnter
//
//
function dragEnter(e) {
    e.preventDefault();
    e.currentTarget.classList.add("dragEnter");
}
// dragLeave
//
//
function dragLeave(e) {
    e.currentTarget.classList.remove("dragEnter");
}
