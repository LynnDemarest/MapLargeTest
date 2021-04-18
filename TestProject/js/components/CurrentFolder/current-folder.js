
<script id="current-folder" type="text/html">
    <div class="divCurrentFolder">
        <div class="currentfolder">
            <div id="currentFolder" data-bind="text: currentFolder"></div>

            <div data-bind="if: canGoUp()">
                <img src="img/upfolder.svg" alt="Go up one level." title="Go up one level."
                    class="clickable goupicon"
                    data-bind="click: function() {goUp();}" onclick="event.stopPropagation()" />
            </div>
        </div>
    </div>
</script>