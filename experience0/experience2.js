// experience2.js
document.addEventListener('DOMContentLoaded', () => {
    function populateTimeline() {
        // Populate Work Experience
        const workDataSource = document.querySelector('#original-work-exp-items');
        const workLeftPane = document.getElementById('work-left-pane');
        const workRightPane = document.getElementById('work-right-pane');

        if (workDataSource && workLeftPane && workRightPane) {
            const workItemsOriginal = workDataSource.querySelectorAll('.timeline-row');
            workItemsOriginal.forEach((item, index) => {
                const originalItemId = item.dataset.itemId || `work-${index}`;
                const newLeftItemId = `work-item-${index}-left`; 
                const newRightItemId = `work-item-${index}-right`;

                const leftDiv = document.createElement('div');
                leftDiv.classList.add('timeline-entry-left');
                leftDiv.id = newLeftItemId;
                leftDiv.dataset.originalId = originalItemId;

                const dot = document.createElement('div');
                dot.classList.add('timeline-dot-refactored');
                leftDiv.appendChild(dot);

                const title = item.querySelector('.timeline-title');
                if (title) leftDiv.appendChild(title.cloneNode(true));
                const company = item.querySelector('.company');
                if (company) leftDiv.appendChild(company.cloneNode(true));
                const date = item.querySelector('.timeline-date');
                if (date) leftDiv.appendChild(date.cloneNode(true));
                const field = item.querySelector('.timeline-field');
                if (field) { const clone = field.cloneNode(true); clone.setAttribute('data-field', field.textContent.trim()); leftDiv.appendChild(clone); }
                const tags = item.querySelector('.timeline-tags');
                if (tags) leftDiv.appendChild(tags.cloneNode(true));
                workLeftPane.appendChild(leftDiv);

                const rightDiv = document.createElement('div');
                rightDiv.classList.add('timeline-entry-right');
                rightDiv.id = newRightItemId;
                rightDiv.dataset.originalId = originalItemId;
                const desc = item.querySelector('.timeline-desc');
                if (desc) rightDiv.appendChild(desc.cloneNode(true));
                workRightPane.appendChild(rightDiv);
            });
        } else { console.warn('Work experience data source or panes not found.'); }

        // Populate Education
        const eduDataSource = document.querySelector('#original-edu-exp-items');
        const eduLeftPane = document.getElementById('edu-left-pane');
        const eduRightPane = document.getElementById('edu-right-pane');

        if (eduDataSource && eduLeftPane && eduRightPane) {
            const eduItemsOriginal = eduDataSource.querySelectorAll('.edu-row');
            eduItemsOriginal.forEach((item, index) => {
                const originalItemId = item.dataset.itemId || `edu-${index}`;
                const newLeftItemId = `edu-item-${index}-left`;
                const newRightItemId = `edu-item-${index}-right`;

                const leftDiv = document.createElement('div');
                leftDiv.classList.add('timeline-entry-left');
                leftDiv.id = newLeftItemId;
                leftDiv.dataset.originalId = originalItemId;

                const dot = document.createElement('div');
                dot.classList.add('timeline-dot-refactored');
                leftDiv.appendChild(dot);
                
                const title = item.querySelector('.timeline-title.edu-title') || item.querySelector('.edu-title');
                if (title) leftDiv.appendChild(title.cloneNode(true));
                const company = item.querySelector('.company.edu-org') || item.querySelector('.edu-org');
                if (company) leftDiv.appendChild(company.cloneNode(true));
                const date = item.querySelector('.timeline-date.edu-date') || item.querySelector('.edu-date');
                if (date) leftDiv.appendChild(date.cloneNode(true));
                const field = item.querySelector('.timeline-field.edu-role') || item.querySelector('.edu-role');
                if (field) { const clone = field.cloneNode(true); clone.setAttribute('data-field', field.textContent.trim()); leftDiv.appendChild(clone); }
                const tags = item.querySelector('.timeline-tags.edu-tags') || item.querySelector('.edu-tags');
                if (tags) leftDiv.appendChild(tags.cloneNode(true));
                eduLeftPane.appendChild(leftDiv);

                const rightDiv = document.createElement('div');
                rightDiv.classList.add('timeline-entry-right');
                rightDiv.id = newRightItemId;
                rightDiv.dataset.originalId = originalItemId;
                const desc = item.querySelector('.timeline-desc.edu-desc') || item.querySelector('.edu-desc');
                if (desc) rightDiv.appendChild(desc.cloneNode(true));
                eduRightPane.appendChild(rightDiv);
            });
        } else { console.warn('Education data source or panes not found.'); }
    }

    function initDraggable() {
        const workResizableArea = document.getElementById('work-resizable-area');
        const workDragger = document.getElementById('work-dragger');
        const workLeftPane = document.getElementById('work-left-pane');
        const workRightPane = document.getElementById('work-right-pane');
        const eduResizableArea = document.getElementById('edu-resizable-area');
        const eduDragger = document.getElementById('edu-dragger');
        const eduLeftPane = document.getElementById('edu-left-pane');
        const eduRightPane = document.getElementById('edu-right-pane');

        if (!workResizableArea || !workDragger || !workLeftPane || !workRightPane ||
            !eduResizableArea || !eduDragger || !eduLeftPane || !eduRightPane) {
            console.warn('Draggable elements not fully found.'); return;
        }

        let isDragging = false;
        let startX, startY, startWorkLeftSize, startWorkRightSize, startEduLeftSize, startEduRightSize, isColumnLayout;
        let currentDragger = null;

        function startDragging(e, draggerElement) {
            e.preventDefault(); isDragging = true; currentDragger = draggerElement;
            isColumnLayout = window.innerWidth <= 900;
            const currentX = e.clientX || (e.touches && e.touches[0].clientX);
            const currentY = e.clientY || (e.touches && e.touches[0].clientY);

            if (isColumnLayout) {
                startY = currentY;
                if (currentDragger === workDragger) startWorkLeftSize = workLeftPane.offsetHeight;
                else if (currentDragger === eduDragger) startEduLeftSize = eduLeftPane.offsetHeight;
                document.body.style.cursor = 'ns-resize';
            } else {
                startX = currentX;
                if (currentDragger === workDragger) { startWorkLeftSize = workLeftPane.offsetWidth; startWorkRightSize = workRightPane.offsetWidth; }
                else if (currentDragger === eduDragger) { startEduLeftSize = eduLeftPane.offsetWidth; startEduRightSize = eduRightPane.offsetWidth; }
                document.body.style.cursor = 'ew-resize';
            }
            document.addEventListener('mousemove', onMouseMove); document.addEventListener('mouseup', onMouseUp);
            document.addEventListener('touchmove', onMouseMove, { passive: false }); document.addEventListener('touchend', onMouseUp);
        }

        workDragger.addEventListener('mousedown', (e) => startDragging(e, workDragger));
        eduDragger.addEventListener('mousedown', (e) => startDragging(e, eduDragger));
        workDragger.addEventListener('touchstart', (e) => startDragging(e, workDragger), { passive: false });
        eduDragger.addEventListener('touchstart', (e) => startDragging(e, eduDragger), { passive: false });

        function onMouseMove(e) {
            if (!isDragging) return; if (e.touches) e.preventDefault();
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);

            if (isColumnLayout) {
                const dy = clientY - startY;
                let targetPane, parentArea, draggerEl, startSize;
                if (currentDragger === workDragger) { targetPane = workLeftPane; parentArea = workResizableArea; draggerEl = workDragger; startSize = startWorkLeftSize; }
                else { targetPane = eduLeftPane; parentArea = eduResizableArea; draggerEl = eduDragger; startSize = startEduLeftSize; }
                
                const parentHeight = parentArea.clientHeight - draggerEl.offsetHeight;
                const minHeight = parentHeight * 0.15;
                let newHeight = startSize + dy;
                if (newHeight < minHeight) newHeight = minHeight;
                if (newHeight > parentHeight - minHeight) newHeight = parentHeight - minHeight;
                targetPane.style.flexBasis = `${newHeight}px`;
            } else {
                const dx = clientX - startX;
                let leftPane, rightPane, startLeft, startRight, combinedWidth;
                if (currentDragger === workDragger) { leftPane = workLeftPane; rightPane = workRightPane; startLeft = startWorkLeftSize; startRight = startWorkRightSize; }
                else { leftPane = eduLeftPane; rightPane = eduRightPane; startLeft = startEduLeftSize; startRight = startEduRightSize; }
                combinedWidth = startLeft + startRight;
                const minAbsWidth = combinedWidth * 0.20;
                let newLeftWidth = startLeft + dx;
                if (newLeftWidth < minAbsWidth) newLeftWidth = minAbsWidth;
                if (newLeftWidth > combinedWidth - minAbsWidth) newLeftWidth = combinedWidth - minAbsWidth;
                leftPane.style.flexBasis = `${newLeftWidth}px`;
                rightPane.style.flexBasis = `${combinedWidth - newLeftWidth}px`;
            }
        }
        function onMouseUp() {
            isDragging = false; currentDragger = null; document.body.style.cursor = 'auto';
            document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('touchmove', onMouseMove); document.removeEventListener('touchend', onMouseUp);
        }
        window.addEventListener('resize', () => {
            const newIsColumnLayout = window.innerWidth <= 900;
            if (newIsColumnLayout !== isColumnLayout) {
                isColumnLayout = newIsColumnLayout;
                [workLeftPane, workRightPane, eduLeftPane, eduRightPane].forEach(pane => { if (pane) pane.style.flexBasis = ''; });
                alignPaneItemsVertically();
            }
        });
    }

    function alignPaneItemsVertically() {
        function align(leftP, rightP) {
            if (!leftP || !rightP) return;
            const leftItems = leftP.querySelectorAll('.timeline-entry-left');
            const rightItems = rightP.querySelectorAll('.timeline-entry-right');
            if (leftItems.length !== rightItems.length) return;
            leftItems.forEach((leftItem, index) => {
                const rightItem = rightItems[index]; if (!rightItem) return;
                leftItem.style.minHeight = ''; rightItem.style.minHeight = ''; // Reset
                requestAnimationFrame(() => { // Ensure DOM has updated heights
                    const leftH = leftItem.offsetHeight; const rightH = rightItem.offsetHeight;
                    const maxH = Math.max(leftH, rightH);
                    if (maxH > 0) { leftItem.style.minHeight = `${maxH}px`; rightItem.style.minHeight = `${maxH}px`;}
                });
            });
        }
        align(document.getElementById('work-left-pane'), document.getElementById('work-right-pane'));
        align(document.getElementById('edu-left-pane'), document.getElementById('edu-right-pane'));
    }

    populateTimeline();
    initDraggable();
    alignPaneItemsVertically();
    window.addEventListener('resize', alignPaneItemsVertically);

    if (window.finalizePageSetup) {
        window.finalizePageSetup();
    } else { console.error("finalizePageSetup not found."); }
});