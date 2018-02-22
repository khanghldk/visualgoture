var HIGHLIGHT_NONE = "lightblue";
var HIGHLIGHT_STANDARD = "green";
var HIGHLIGHT_SPECIAL = "#DC143C";
var HIGHLIGHT_SORTED = "orange";

var HIGHLIGHT_LEFT = "#3CB371";
var HIGHLIGHT_RIGHT = "#9932CC";
var HIGHLIGHT_PIVOT = "yellow";

var HIGHLIGHT_GRAY = "#CCCCCC";

var barWidth = 50;
var maxHeight = 230;
var gapBetweenBars = 5;
var maxNumOfElements = 20; //max 20 elements currently
var gapBetweenPrimaryAndSecondaryRows = 30; // of the bars
var maxElementValue = 50;
var statusCodetraceWidth = 420;

// green, pink, blue, red, yellow, indigo, orange, lime
var colourArray = ["#52bc69", "#d65775", "#2ebbd1", "#d9513c", "#fec515", "#4b65ba", "#ff8a27", "#a7d41e"];


function getColours() {
    var generatedColours = new Array();
    while (generatedColours.length < 4) {
        var n = (Math.floor(Math.random() * colourArray.length));
        if ($.inArray(n, generatedColours) == -1)
            generatedColours.push(n);
    }
    return generatedColours;
}

var generatedColours = getColours();
var surpriseColour = colourArray[generatedColours[0]];
var colourTheSecond = colourArray[generatedColours[1]];
var colourTheThird = colourArray[generatedColours[2]];
var colourTheFourth = colourArray[generatedColours[3]];

var transitionTime = 750;
var issPlaying;
var animInterval;
var currentStep;
var centreBarsOffset;
var computeInversionIndex = false;

// list of states
var statelist = new Array();

var scaler = d3.scale
    .linear()
    .range([0, maxHeight]);

// var canvas = d3.select("#viz-canvas")
//     .attr("height", maxHeight * 2 + gapBetweenPrimaryAndSecondaryRows)
//     .attr("width", barWidth * maxNumOfElements);

var width = $(".gridGraph").width() - 10;

var canvas = d3.select("#viz-canvas")
    .attr("height", maxHeight + gapBetweenPrimaryAndSecondaryRows)
    .attr("width", width);

// var canvas = d3.select("div#viz-canvas")
//     .append("svg")
//     .attr("preserveAspectRatio", "xMinYMin meet")
//     .attr("viewBox", "0 0 1000 1000")
//     .classed("svg-content", true);

var POSITION_USE_PRIMARY = "a";
var POSITION_USE_SECONDARY_IN_DEFAULT_POSITION = "b";

// Objects definition

var Entry = function (value, highlight, position, secondaryPositionStatus) {
    this.value = value; // number
    this.highlight = highlight; // string, use HIGHLIGHT_ constants
    this.position = position; // number
    this.secondaryPositionStatus = secondaryPositionStatus; // integer, +ve for position overwrite, -ve for absolute postion (-1 for 0th absolution position)
}

var Backlink = function (value, highlight, entryPosition, secondaryPositionStatus) {
    this.value = value; // number
    this.highlight = highlight; // string, use HIGHLIGHT_ constants
    this.entryPosition = entryPosition; // number
    this.secondaryPositionStatus = secondaryPositionStatus; // integer, +ve for position overwrite
}

var State = function (entries, backlinks, barsCountOffset, status, lineNo) {
    this.entries = entries; // array of Entry's
    this.backlinks = backlinks; // array of Backlink's
    this.barsCountOffset = barsCountOffset; // how many bars to "disregard" (+ve) or to "imagine" (-ve) w.r.t. state.entries.length when calculating the centre position
    this.status = status;
    this.lineNo = lineNo; //integer or array, line of the code to highlight
}

//Helpers

var EntryBacklinkHelper = new Object();
EntryBacklinkHelper.appendList = function (entries, backlinks, numArray) {
    for (var i = 0; i < numArray.length; i++) {
        EntryBacklinkHelper.append(entries, backlinks, numArray[i]);
    }
}

EntryBacklinkHelper.append = function (entries, backlinks, newNumber) {
    entries.push(new Entry(newNumber, HIGHLIGHT_NONE, entries.length, POSITION_USE_PRIMARY));
    backlinks.push(new Backlink(newNumber, HIGHLIGHT_NONE, backlinks.length, POSITION_USE_PRIMARY));
}

EntryBacklinkHelper.update = function (entries, backlinks) {
    for (var i = 0; i < backlinks.length; i++) {
        entries[backlinks[i].entryPosition].highlight = backlinks[i].highlight;
        entries[backlinks[i].entryPosition].position = i;
        entries[backlinks[i].entryPosition].secondaryPositionStatus = backlinks[i].secondaryPositionStatus;
    }
}

EntryBacklinkHelper.copyEntry = function (oldEntry) {
    return new Entry(oldEntry.value, oldEntry.highlight, oldEntry.position, oldEntry.secondaryPositionStatus);
}

EntryBacklinkHelper.copyBacklink = function (oldBacklink) {
    return new Backlink(oldBacklink.value, oldBacklink.highlight, oldBacklink.entryPosition, oldBacklink.secondaryPositionStatus);
}

EntryBacklinkHelper.swapBacklinks = function (backlinks, i, j) {
    var swaptemp = backlinks[i];
    backlinks[i] = backlinks[j];
    backlinks[j] = swaptemp;
}

// class StateHelper
var StateHelper = new Object();

StateHelper.createNewState = function (numArray) {
    var entries = new Array();
    var backlinks = new Array();
    EntryBacklinkHelper.appendList(entries, backlinks, numArray);
    return new State(entries, backlinks, 0, "", 0);
}

StateHelper.copyState = function (oldState) {
    var newEntries = new Array();
    var newBacklinks = new Array();
    for (var i = 0; i < oldState.backlinks.length; i++) {
        newEntries.push(EntryBacklinkHelper.copyEntry(oldState.entries[i]));
        newBacklinks.push(EntryBacklinkHelper.copyBacklink(oldState.backlinks[i]));
    }

    var newLineNo = oldState.lineNo;
    if (newLineNo instanceof Array)
        newLineNo = oldState.lineNo.slice();

    return new State(newEntries, newBacklinks, oldState.barsCountOffset, oldState.status, newLineNo);
}

StateHelper.updateCopyPush = function (list, stateToPush) {
    EntryBacklinkHelper.update(stateToPush.entries, stateToPush.backlinks);
    list.push(StateHelper.copyState(stateToPush));
}
// end class StateHelper

// class FunctionList

var FunctionList = new Object();
FunctionList.text_y = function (d) {
    var barHeight = scaler(d.value);
    if (barHeight < 32) return -15;
    return barHeight - 15;
}

FunctionList.g_transform = function (d) {
    if (d.secondaryPositionStatus == POSITION_USE_PRIMARY)
        return 'translate(' + (centreBarsOffset + d.position * barWidth) + ", " + (maxHeight - scaler(d.value)) + ')';
    else if (d.secondaryPositionStatus == POSITION_USE_SECONDARY_IN_DEFAULT_POSITION)
        return 'translate(' + (centreBarsOffset + d.position * barWidth) + ", " + (maxHeight * 2 + gapBetweenPrimaryAndSecondaryRows - scaler(d.value)) + ')';
    else if (d.secondaryPositionStatus >= 0)
        return 'translate(' + (centreBarsOffset + d.secondaryPositionStatus * barWidth) + ", " + (maxHeight * 2 + gapBetweenPrimaryAndSecondaryRows - scaler(d.value)) + ')';
    else if (d.secondaryPositionStatus < 0)
        return 'translate(' + ((d.secondaryPositionStatus * -1 - 1) * barWidth) + ", " + (maxHeight * 2 + gapBetweenPrimaryAndSecondaryRows - scaler(d.value)) + ')';
    else
        return 'translation(0, 0)'; // error
}

// end class FunctionList

var generateRandomNumber = function (min, max) { //generates a random integer between min and max (both inclusive)
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

var generateRandomNumberArray = function (size, limit) {
    var numArray = new Array();
    for (var i = 0; i < size; i++) {
        numArray.push(generateRandomNumber(1, limit));
    }
    return numArray;
};

var generateRandomNumber = function (min, max) { //generates a random integer between min and max (both inclusive)
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

this.clearPseudocode = function () {
    populatePseudocode([]);
}

var populatePseudocode = function (code) {
    var i = 1;
    for (; i <= 7 && i <= code.length; i++) {
        $("#code" + i).html(
            code[i - 1].replace(
                /^\s+/,
                function (m) {
                    return m.replace(/\s/g, "&nbsp;");
                }
            )
        );
    }
    for (; i <= 7; i++) {
        $("#code" + i).html("");
    }
}

this.bubbleSort = function (callback) {
    var numElements = statelist[0].backlinks.length;
    var state = StateHelper.copyState(statelist[0]);
    var swapCounter = 0;

    populatePseudocode([
        'do',
        '  swapped = false',
        '  for i = 1 to indexOfLastUnsortedElement-1',
        '    if leftElement > rightElement',
        '      swap(leftElement, rightElement)',
        '      swapped = true' + ((this.computeInversionIndex) ? '; swapCounter++' : ""),
        'while swapped'
    ]);

    var swapped;
    var indexOfLastUnsortedElement = numElements;
    do {
        swapped = false;

        // Set the swapped flag to false.
        // Then iterate from 1 to {endIdx} inclusive.
        state.status = 'Set the swapped flag to false.<div>Then iterate from 1 to {endIdx} inclusive.</div>'.replace("{endIdx}", indexOfLastUnsortedElement - 1);
        state.lineNo = [2, 3];
        StateHelper.updateCopyPush(statelist, state);

        for (var i = 1; i < indexOfLastUnsortedElement; i++) {
            state.backlinks[i - 1].highlight = HIGHLIGHT_STANDARD;
            state.backlinks[i].highlight = HIGHLIGHT_STANDARD;

            // Checking if {val1} > {val2} and swap them if that is true.
            // The current value of swapped = {swapped}.
            state.status = '<div>Checking if {val1} &gt; {val2} and swap them if that is true.</div>The current value of swapped = {swapped}.'.replace("{val1}", state.backlinks[i - 1].value).replace("{val2}", state.backlinks[i].value).replace("{swapped}", swapped);
            state.lineNo = 4;
            StateHelper.updateCopyPush(statelist, state);

            if (state.backlinks[i - 1].value > state.backlinks[i].value) {
                swapped = true;

                // Swapping the positions of {val1} and {val2}.
                // Set swapped = true.
                state.status = 'Swapping the positions of {val1} and {val2}.<div>Set swapped = true.</div>'.replace("{val1}", state.backlinks[i - 1].value).replace("{val2}", state.backlinks[i].value);
                if (this.computeInversionIndex) {
                    swapCounter++;
                    // For inversion index computation: Add 1 to swapCounter.
                    // The current value of swapCounter = {swapCounter}.
                    state.status += ' For inversion index: Add 1 to swapCounter.<div>Current value of swapCounter = {swapCounter}.</div>'.replace("{swapCounter}", swapCounter);
                }

                state.lineNo = [5, 6];

                EntryBacklinkHelper.swapBacklinks(state.backlinks, i, i - 1);
                StateHelper.updateCopyPush(statelist, state);
            }

            state.backlinks[i - 1].highlight = HIGHLIGHT_NONE;
            state.backlinks[i].highlight = HIGHLIGHT_NONE;
        }

        indexOfLastUnsortedElement--;
        state.backlinks[indexOfLastUnsortedElement].highlight = HIGHLIGHT_SORTED;
        if (swapped == false)
        // No swap is done in this pass.
        // We can terminate Bubble Sort now.
            state.status = 'No swap is done in this pass.<div>We can terminate Bubble Sort now</div>';
        else
        // Mark last unsorted element as sorted now.
        // As at least one swap is done in this pass, we continue.
            state.status = '<div>Mark last unsorted element as sorted now.</div><div>As at least one swap is done in this pass, we continue.</div>';

        state.lineNo = 7;
        StateHelper.updateCopyPush(statelist, state);
    }
    while (swapped);

    for (var i = 0; i < numElements; i++)
        state.backlinks[i].highlight = HIGHLIGHT_SORTED;

    // The array/list is now sorted.
    state.status = 'List sorted!';
    if (this.computeInversionIndex)
    // Inversion Index = {swapCounter}.
        state.status += ' Inversion Index = {swapCounter}.'.replace("swapCounter", swapCounter);

    state.lineNo = 0;
    StateHelper.updateCopyPush(statelist, state);

    this.play(callback);
    return true;
}

this.selectionSort = function (callback) {
    var numElements = statelist[0].backlinks.length;
    var state = StateHelper.copyState(statelist[0]);

    populatePseudocode([
        'repeat (numOfElements - 1) times',
        '  set the first unsorted element as the minimum',
        '  for each of the unsorted elements',
        '    if element < currentMinimum',
        '      set element as new minimum',
        '  swap minimum with first unsorted position'
    ]);

    for (var i = 0; i < numElements - 1; i++) {
        var minPosition = i;

        // Iteration {iteration}: Set {val} as the current minimum.
        // Then iterate through the rest to find the true minimum.
        state.status = 'Iteration {iteration}: Set {val} as the current minimum, then iterate through the remaining unsorted elements to find the true minimum.'.replace("{iteration}", (i + 1)).replace("{val}", state.backlinks[i].value);
        state.lineNo = [1, 2, 3];
        state.backlinks[minPosition].highlight = HIGHLIGHT_SPECIAL;

        StateHelper.updateCopyPush(statelist, state);

        for (var j = i + 1; j < numElements; j++) {
            // Check if {val} is smaller than the current minimum ({minVal}).
            state.status = 'Check if {val} is smaller than the current minimum ({minVal}).'.replace("{val}", state.backlinks[j].value).replace("{minVal}", state.backlinks[minPosition].value);
            state.lineNo = 4;
            state.backlinks[j].highlight = HIGHLIGHT_STANDARD;
            StateHelper.updateCopyPush(statelist, state);

            state.backlinks[j].highlight = HIGHLIGHT_NONE;

            if (state.backlinks[j].value < state.backlinks[minPosition].value) {
                state.status = 'Set {val} as the new minimum.'.replace("{val}", state.backlinks[j].value);
                state.lineNo = 5;
                state.backlinks[minPosition].highlight = HIGHLIGHT_NONE;
                state.backlinks[j].highlight = HIGHLIGHT_SPECIAL;

                minPosition = j;
                StateHelper.updateCopyPush(statelist, state);
            }
        }

        if (minPosition != i) { // Highlight the first-most unswapped position, if it isn't the minimum
            // Set {val} as the new minimum.
            state.status = 'Swap the minimum ({minVal}) with the first unsorted element ({element}).'.replace("{minVal}", state.backlinks[minPosition].value).replace("{element}", state.backlinks[i].value);
            state.lineNo = 6;
            state.backlinks[i].highlight = HIGHLIGHT_SPECIAL;
            StateHelper.updateCopyPush(statelist, state);

            EntryBacklinkHelper.swapBacklinks(state.backlinks, minPosition, i);
            StateHelper.updateCopyPush(statelist, state);
        }
        else {
            // As the minimum is the first unsorted element, no swap is necessary.
            state.status = 'As the minimum is the first unsorted element, no swap is necessary.';
            state.lineNo = 6;
            StateHelper.updateCopyPush(statelist, state);
        }

        // {val} is now considered sorted.
        state.status = '{val} is now considered sorted.'.replace("{val}", state.backlinks[i].value);
        state.backlinks[minPosition].highlight = HIGHLIGHT_NONE;
        state.backlinks[i].highlight = HIGHLIGHT_SORTED;
        StateHelper.updateCopyPush(statelist, state);
    }

    for (var i = 0; i < numElements; i++)
        state.backlinks[i].highlight = HIGHLIGHT_NONE; // un-highlight everything
    // The array/list is now sorted.
    // (After all iterations, the last element will naturally be sorted.)
    state.status = 'List sorted!' + '<br>' + '(After all iterations, the last element will naturally be sorted.)';
    status.lineNo = 0;
    StateHelper.updateCopyPush(statelist, state);

    this.play(callback);
    return true;
}

var quickSortUseRandomizedPivot;

var quickSortStart = function() {
    var numElements = statelist[0].backlinks.length;
    var state = StateHelper.copyState(statelist[statelist.length - 1]);

    populatePseudocode([
        'for each (unsorted) partition',
        (quickSortUseRandomizedPivot) ? 'randomly select pivot, swap with first element' : 'set first element as pivot',
        '  storeIndex = pivotIndex + 1',
        '  for i = pivotIndex + 1 to rightmostIndex',
        '    if element[i] < element[pivot]',
        '      swap(i, storeIndex); storeIndex++',
        '  swap(pivot, storeIndex - 1)'
    ]);

    quickSortSplit(state, 0, numElements - 1);

    state.lineNo = 0;
    state.status = 'List sorted!';

    for (var i = 0; i < numElements; i++)
        state.backlinks[i].highlight = HIGHLIGHT_SORTED; //unhighlight everything
    StateHelper.updateCopyPush(statelist, state);
}

var quickSortSplit = function(state, startIndex, endIndex) { //startIndex & endIndex inclusive
    state.status = 'Working on partition [{partition}] (index {startIndex} to {endIndex} both inclusive).'
        .replace("{partition}", state.backlinks.slice(startIndex, endIndex + 1).map(function(d) {
            return d.value;
        }))
        .replace("{startIndex}", startIndex).replace("{endIndex}", endIndex);
    state.lineNo = 1;

    if (startIndex > endIndex)
        return;

    if (startIndex == endIndex) {
        state.status += ' Since partition size == 1, element inside partition is necessarily at sorted position.';
        state.backlinks[startIndex].highlight = HIGHLIGHT_SORTED;
        StateHelper.updateCopyPush(statelist, state);
        return;
    }

    var middleIndex = quickSortPartition(state, startIndex, endIndex);
    quickSortSplit(state, startIndex, middleIndex - 1);
    quickSortSplit(state, middleIndex + 1, endIndex);
}

var quickSortPartition = function(state, startIndex, endIndex) {

    var pivotIndex;
    if (quickSortUseRandomizedPivot) {

        pivotIndex = generateRandomNumber(startIndex, endIndex);

        state.status += ' Randomly selected {pivot} (index {index}) as pivot.'.replace("{pivot}", state.backlinks[pivotIndex].value).replace("{index}", pivotIndex);
        state.lineNo = [1, 2];

        state.backlinks[pivotIndex].highlight = HIGHLIGHT_PIVOT;
        StateHelper.updateCopyPush(statelist, state);

        if (pivotIndex != startIndex) {
            state.status = 'Swap pivot ({pivot}}, index {index}) with first element ({first}, index {firstIndex}). (storeIndex = {storeIndex}.)'.replace("{pivot}", state.backlinks[pivotIndex].value).replace("{index}", pivotIndex)
                .replace("{first}", state.backlinks[startIndex].value).replace("{firstIndex}", startIndex).replace("{storeIndex}", (startIndex + 1));

            state.lineNo = [2, 3];

            EntryBacklinkHelper.swapBacklinks(state.backlinks, pivotIndex, startIndex);
            pivotIndex = startIndex;
            StateHelper.updateCopyPush(statelist, state);
        }
    }
    else {
        pivotIndex = startIndex;

        state.status += ' Selecting {pivot} as pivot. (storeIndex = {storeIndex}.)'.replace("{pivot}", state.backlinks[pivotIndex].value).replace("{storeIndex}", (startIndex + 1));
        state.lineNo = [1, 2, 3];

        state.backlinks[pivotIndex].highlight = HIGHLIGHT_PIVOT;
        StateHelper.updateCopyPush(statelist, state);
    }

    var storeIndex = pivotIndex + 1;
    var pivotValue = state.backlinks[pivotIndex].value;

    for (var i = storeIndex; i <= endIndex; i++) {
        state.status = 'Checking if {val} < {pivot} (pivot).'.replace("{val}", state.backlinks[i].value).replace("{pivot}", pivotValue);
        state.lineNo = [4, 5];

        state.backlinks[i].highlight = HIGHLIGHT_SPECIAL;
        StateHelper.updateCopyPush(statelist, state);
        if (state.backlinks[i].value < pivotValue) {
            state.status = '{val} < {pivot} (pivot) is true. Swapping index {idx} (value = {val}) with element at storeIndex (index = {storeIdx}, value = {storeVal}). (Value of storeIndex after swap = {newStoreIdx}).'.replace("{val}", state.backlinks[i].value).replace("{pivot}", pivotValue)
                .replace("{idx}", i).replace("{storeIdx}", storeIndex).replace("{storeVal}", state.backlinks[storeIndex].value).replace("newStoreIdx", (storeIndex + 1));
            state.lineNo = [4, 6];

            if (i != storeIndex) {
                EntryBacklinkHelper.swapBacklinks(state.backlinks, storeIndex, i);
                StateHelper.updateCopyPush(statelist, state);
            }

            state.backlinks[storeIndex].highlight = HIGHLIGHT_LEFT;
            storeIndex++;
        }
        else {
            state.backlinks[i].highlight = HIGHLIGHT_RIGHT;
        }
    }
    state.status = 'Iteration complete.';
    state.lineNo = 4;
    StateHelper.updateCopyPush(statelist, state);
    if (storeIndex - 1 != pivotIndex) {
        state.status = 'Swapping pivot (index = {pivotIdx}, value = {pivot}) with element at storeIndex - 1 (index = {newIdx}, value = {newVal}).'.replace("{pivotIdx}", pivotIndex).replace("{pivot}", pivotValue)
            .replace("{newIdx}", (storeIndex - 1)).replace("{newVal}", state.backlinks[storeIndex - 1].value);
        state.lineNo = 7;
        EntryBacklinkHelper.swapBacklinks(state.backlinks, storeIndex - 1, pivotIndex);
        StateHelper.updateCopyPush(statelist, state);
    }

    state.status = 'Pivot is now at its sorted position.';
    state.lineNo = 7;

    for (var i = startIndex; i <= endIndex; i++)
        state.backlinks[i].highlight = HIGHLIGHT_NONE; //unhighlight everything
    state.backlinks[storeIndex - 1].highlight = HIGHLIGHT_SORTED;
    StateHelper.updateCopyPush(statelist, state);

    return storeIndex - 1;
}

this.quickSort = function(callback) {
    quickSortUseRandomizedPivot = false;
    quickSortStart();

    this.play(callback);
    return true;
}

var drawCurrentState = function () {
    drawState(currentStep);
    if (currentStep == (statelist.length - 1)) {
        pause();
        $('#play img').attr('src', 'https://visualgo.net/img/replay.png').attr('alt', 'replay').attr('title', 'replay');
    }
    else
        $('#play img').attr('src', 'https://visualgo.net/img/play.png').attr('alt', 'play').attr('title', 'play');
}

var drawState = function (stateIndex) {
    drawBars(statelist[stateIndex]);
    $('#status p').html(statelist[stateIndex].status);
    highlightLine(statelist[stateIndex].lineNo);
};

var drawBars = function (state) {
    scaler.domain([0, d3.max(state.entries, function (d) {
        return d.value;
    })]);

    centreBarsOffset = (maxNumOfElements - (state.entries.length - state.barsCountOffset)) * barWidth / 2;

    var canvasData = canvas.selectAll("g").data(state.entries);

    // Exit ==============================
    var exitData = canvasData.exit()
        .remove();

    // Entry ==============================
    var newData = canvasData.enter()
        .append("g")
        .attr("transform", FunctionList.g_transform);

    newData.append("rect")
        .attr("height", 0)
        .attr("width", 0);

    newData.append("text")
        .attr("dy", ".35em")
        .attr("x", (barWidth - gapBetweenBars) / 2)
        .attr("y", FunctionList.text_y)
        .text(function (d) {
            return d.value;
        });

    // Update ==============================
    canvasData.select("text")
        .transition()
        .attr("y", FunctionList.text_y)
        .text(function (d) {
            return d.value;
        });

    canvasData.select("rect")
        .transition()
        .attr("height", function (d) {
            return scaler(d.value);
        })
        .attr("width", barWidth - gapBetweenBars)
        .style("fill", function (d) {
            return d.highlight;
        });

    canvasData.transition()
        .attr("transform", FunctionList.g_transform)
};

this.play = function (callback) {
    issPlaying = true;
    drawCurrentState();
    animInterval = setInterval(function () {
        drawCurrentState();
        if (currentStep < (statelist.length - 1))
            currentStep++;
        else {
            clearInterval(animInterval);
            if (typeof callback == 'function') callback();
        }
    }, transitionTime);
}

this.pause = function () {
    issPlaying = false;
    clearInterval(animInterval);
}

this.replay = function () {
    issPlaying = true;
    currentStep = 0;
    drawCurrentState();
    animInterval = setInterval(function () {
        drawCurrentState();
        if (currentStep < (statelist.length - 1))
            currentStep++;
        else
            clearInterval(animInterval);
    }, transitionTime);
}

this.stop = function () {
    issPlaying = false;
    statelist = [statelist[0]]; //clear statelist to original state, instead of new Array();
    currentStep = 0;
    drawState(0);
    transitionTime = 500;
}

this.loadNumberList = function (numArray) {
    issPlaying = false;
    currentStep = 0;

    statelist = [StateHelper.createNewState(numArray)];
    drawState(0);
}

this.createList = function () {
    var numArrayMaxListSize = 20;
    var numArrayMaxElementValue = maxElementValue;

    var numArray = generateRandomNumberArray(generateRandomNumber(10, numArrayMaxListSize), numArrayMaxElementValue);

    this.loadNumberList(numArray);
}

function init() {
    createList();
    showCodetracePanel();
    showStatusPanel();
}

var title = document.getElementById('title');

$('#bubbleSort').click(function () {
    if (!issPlaying) {
        title.innerHTML = "Bubble Sort";
        init();
        bubbleSort();
    } else {
        reloadBubble();
    }
});

$('#selectionSort').click(function () {
    if (!issPlaying) {
        title.innerHTML = "Selection Sort";
        init();
        selectionSort();
    } else {
        reloadSelection();
    }
});

$('#quickSort').click(function () {
    if (!issPlaying) {
        title.innerHTML = "Bubble Sort";
        init();
        quickSort();
    } else {
        reloadQuick();
    }
});

window.onload = function() {
    var reloading = sessionStorage.getItem("type");
    switch (reloading) {
        case "bubble" :
            title.innerHTML = "Bubble Sort";
            init();
            bubbleSort();
            break;
        case "selection" :
            title.innerHTML = "Selection Sort";
            init();
            selectionSort();
            break;
        case "quick":
            title.innerHTML = "Quick Sort";
            init();
            quickSort();
            break;
    }
    sessionStorage.removeItem("type");
}

function reloadBubble() {
    sessionStorage.setItem("type", "bubble");
    document.location.reload();
}

function reloadSelection() {
    sessionStorage.setItem("type", "selection");
    document.location.reload();
}

function reloadQuick() {
    sessionStorage.setItem("type", "quick");
    document.location.reload();
}

function responsivefy(svg) {
    // get container + svg aspect ratio
    var container = d3.select(svg.node().parentNode),
        width = parseInt(svg.style("width")),
        height = parseInt(svg.style("height")),
        aspect = width / height;

    console.log("width: " + width);
    console.log("height: " + height);

    // add viewBox and preserveAspectRatio properties,
    // and call resize so that svg resizes on inital page load
    svg.attr("viewBox", "0 0 " + width + " " + height)
        .attr("preserveAspectRatio", "xMinYMid")
        .call(resize);

    // to register multiple listeners for same event type,
    // you need to add namespace, i.e., 'click.foo'
    // necessary if you call invoke this function for multiple svgs
    // api docs: https://github.com/mbostock/d3/wiki/Selections#on
    d3.select(window).on("resize." + container.attr("id"), resize);

    // get width of container and resize svg to fit it
    function resize() {
        var targetWidth = parseInt(container.style("width"));
        svg.attr("width", targetWidth);
        svg.attr("height", Math.round(targetWidth / aspect));
    }
}


