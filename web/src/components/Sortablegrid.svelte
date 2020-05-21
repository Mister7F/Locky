<script>
    import { createEventDispatcher } from "svelte";
    import { onMount } from "svelte";

    export let items;
    export let dragging = false;

    const dispatch = createEventDispatcher();

    let actionsSlot;

    function getElementIndex(element) {
        // Return the index of the elemnt in its parent
        return [].indexOf.call(element.parentNode.children, element);
    }

    function resetGrid() {
        // trigger change event if there's no change
        // to reset the list (with a deep copy)
        setTimeout(() => {
            items = JSON.parse(JSON.stringify(items));
        });
    }

    let draggedElement = null;
    let draggedIndex = -1;
    let destIndex = -1;
    let action = null;
    let intoFolder = false;

    let ghostElement = null;

    // Position of the mouse on the dragged element
    let xPosElement = 0;
    let yPosElement = 0;

    let mouseTimer = null;

    let mobile = false;

    function mouseDown(event) {
        if (event.button !== 0 && !event.touches) {
            return;
        }
        let target = event.currentTarget;

        mouseTimer = setTimeout(() => {
            dragging = true;

            draggedElement = target;
            draggedIndex = getElementIndex(draggedElement);

            if (event.touches) {
                // mobile
                xPosElement = draggedElement.offsetWidth / 2;
                yPosElement = draggedElement.offsetHeight / 2;
                mobile = true;
            } else {
                // desktop
                xPosElement = event.x - draggedElement.offsetLeft;
                yPosElement = event.y - draggedElement.offsetTop + document.querySelector(".grid").scrollTop;
                mobile = false;
            }

            // move the element in absolute position
            let x = draggedElement.offsetLeft;
            let y =
                draggedElement.offsetTop -
                document.querySelector(".grid").scrollTop;

            draggedElement.classList.add("dragged");
            draggedElement.style.setProperty("--x", x + "px");
            draggedElement.style.setProperty("--y", y + "px");

            // create a ghost element to fill the space
            ghostElement = document.createElement("div");
            ghostElement.style.width = draggedElement.offsetWidth + "px";
            ghostElement.style.height = draggedElement.offsetHeight + "px";
            ghostElement.setAttribute("class", "ghost");
            draggedElement.parentNode.insertBefore(
                ghostElement,
                draggedElement
            );

            document.body.appendChild(draggedElement);

        }, 150);
    }

    function mouseUp(event) {
        if (mouseTimer) {
            clearTimeout(mouseTimer);
        }
        if (!draggedElement || (event.button !== 0 && !event.touches)) {
            return;
        }

        let draggedItem = items[draggedIndex];

        if (action) {
            dispatch("action", {
                action: action,
                item: draggedItem,
            });
        } else if (
            draggedIndex !== destIndex &&
            destIndex >= 0 &&
            draggedIndex >= 0
        ) {
            let destItem = items[destIndex];

            if (!intoFolder) {
                let item = items.splice(draggedIndex, 1)[0];
                items.splice(destIndex, 0, item);
                ghostElement.parentNode.insertBefore(
                    draggedElement,
                    ghostElement
                );
            } else {
                items.splice(draggedIndex, 1);
            }

            dispatch("move", {
                from: draggedIndex,
                to: destIndex,
                fromItem: draggedItem,
                intoFolder: intoFolder,
                destItem: destItem,
            });
        } else {
            ghostElement.parentNode.insertBefore(draggedElement, ghostElement);
        }

        // clean the state
        ghostElement.remove();
        draggedElement.classList.remove("dragged");
        draggedElement = null;
        draggedIndex = -1;
        destIndex = -1;
        dragging = false;
        action = null;
        intoFolder = false;
        let previousFolder = document.querySelector(".move_into");
        if (previousFolder) {
            previousFolder.classList.remove("move_into");
        }
        resetGrid();
    }

    function mouseMove(event) {
        if (mouseTimer) {
            clearTimeout(mouseTimer);
        }
        if (!draggedElement) {
            return;
        }

        // move the dragged element to the mouse position
        if (event.touches) {
            // mobile
            var mouseX = event.touches[0].clientX;
            var mouseY = event.touches[0].clientY;
        } else if (!mobile) {
            // desktop
            var mouseX = event.x;
            var mouseY = event.y;
        } else {
            // mouse move event on mobile
            // must ignore
            return;
        }

        draggedElement.style.setProperty("--x", mouseX - xPosElement + "px");
        draggedElement.style.setProperty("--y", mouseY - yPosElement + "px");

        // move the ghost element if necessary
        let hoverElements = document.elementsFromPoint(mouseX, mouseY);

        // check if will perform an action
        let actionElement = hoverElements.filter(
            (el) =>
                el.parentNode &&
                el.parentNode.getAttribute &&
                el.parentNode.getAttribute("slot") === "actions"
        );

        if (actionElement.length) {
            action = actionElement[0];
            return;
        }

        // check if will move the item
        let destItemsFiltered = hoverElements.filter((el) =>
            el.classList.contains("container")
        );
        destItemsFiltered = destItemsFiltered.filter(
            (el) => el !== draggedElement
        );

        if (destItemsFiltered.length) {
            let destelement = destItemsFiltered[0];
            destIndex = getElementIndex(destelement);

            intoFolder = parseInt(destelement.getAttribute("folder"));

            if (intoFolder) {
                destelement.classList.add("move_into");
            } else {
                let previousFolder = document.querySelector(".move_into");
                if (previousFolder) {
                    previousFolder.classList.remove("move_into");
                }

                let ghostIndex = getElementIndex(ghostElement);
                if (ghostIndex < destIndex) {
                    destelement.parentNode.insertBefore(
                        ghostElement,
                        destelement.nextSibling
                    );
                } else {
                    destelement.parentNode.insertBefore(
                        ghostElement,
                        destelement
                    );
                }
            }
        } else {
            intoFolder = false;
            destIndex = getElementIndex(ghostElement);
            let previousFolder = document.querySelector(".move_into");
            if (previousFolder) {
                previousFolder.classList.remove("move_into");
            }
        }
    }

    window.addEventListener("mouseup", mouseUp);
    window.addEventListener("touchend", mouseUp);

    window.addEventListener("mousemove", mouseMove);
    window.addEventListener("touchmove", mouseMove);
</script>

<style>
    .grid {
        overflow-x: hidden;
        overflow-y: auto;
        max-height: 100%;
        background: transparent;

    }

    .items {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: space-around;
        align-items: flex-start;
        align-content: flex-start;
    }

    .container {
        width: auto;
        display: block;
        transition: -webkit-filter 0.5s;
    }

    .container > * {
        width: auto;
        display: block;
        cursor: pointer;
    }

    :global(.dragged) {
        position: absolute;
        left: var(--x);
        top: var(--y);
        opacity: 0.2;
        transform: rotate(-3deg);
    }

    :global(.dragged),
    :global(.dragged) *,
    :global(.dragged) div {
        cursor: grabbing!important;
        cursor: -moz-grabbing!important;
        cursor: -webkit-grabbing!important;
    }

    :global(.ghost) {
        opacity: 0;
    }

    :global(.move_into) {
        -webkit-filter: brightness(50%);
    }
</style>

<div class="grid" oncontextmenu="return false;">
    <div class="actions" bind:this={actionsSlot}>
        <slot name="actions">
            <!-- Actions when items are dropped on the elements -->
        </slot>
    </div>
    <div class="items">
        {#each items as item, index (item)}
            <div
                class="container"
                folder={item.folder || 0}
                on:mousedown={mouseDown}
                on:touchstart={mouseDown}>
                <slot name="item" class="item" {item} {index} />
            </div>
        {/each}
    </div>
</div>
