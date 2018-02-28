var statusCodetraceWidth = 420;

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

var Sorting = function () {

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
    var maxNumOfElements = 20;
    var gapBetweenPrimaryAndSecondaryRows = 30; // of the bars
    var maxElementValue = 50;


// green, pink, blue, red, yellow, indigo, orange, lime


    var transitionTime = 750;
    var issPlaying;
    var animInterval;
    var currentStep;
    var centreBarsOffset;
    var computeInversionIndex = false;

    this.selectedSortFunction;

// list of states

    var scaler;
    var canvas;
    var width;

    scaler = d3.scale
        .linear()
        .range([0, maxHeight]);

    width = $(".gridGraph").width() - 10;

    canvas = d3.select("#viz-canvas")
        .attr("height", maxHeight * 2  + gapBetweenPrimaryAndSecondaryRows)
        .attr("width", width);

    var statelist = new Array();


    // var canvas = d3.select("#viz-canvas")
    //     .attr("height", maxHeight * 2 + gapBetweenPrimaryAndSecondaryRows)
    //     .attr("width", barWidth * maxNumOfElements);



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

    var State = function (entries, backlinks, barsCountOffset, status, lineNo, logMessage) {
        this.entries = entries; // array of Entry's
        this.backlinks = backlinks; // array of Backlink's
        this.barsCountOffset = barsCountOffset; // how many bars to "disregard" (+ve) or to "imagine" (-ve) w.r.t. state.entries.length when calculating the centre position
        this.status = status;
        this.lineNo = lineNo; //integer or array, line of the code to highlight
        this.logMessage = logMessage;
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

        return new State(newEntries, newBacklinks, oldState.barsCountOffset, oldState.status, newLineNo, oldState.logMessage);
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
            return 'translation(0, 0)';
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

    var initLogMessage = function (state) {
        state.logMessage = "original array = [";

        for (var i = 0; i < state.backlinks.length - 1; i++) {
            state.logMessage += state.backlinks[i].value + ", ";
        }

        state.logMessage += state.backlinks[state.backlinks.length - 1].value + "]";
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

        initLogMessage(state);

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
                    state.status = 'Swapping the positions of {val1} and {val2}.<div>Set swapped = true.</div>'
                        .replace("{val1}", state.backlinks[i - 1].value)
                        .replace("{val2}", state.backlinks[i].value);
                    state.logMessage = '<div>swap {val1} and {val2}</div>'
                        .replace("{val1}", state.backlinks[i - 1].value)
                        .replace("{val2}", state.backlinks[i].value) + state.logMessage;
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

        initLogMessage(state);

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
                    state.status = 'Set {val} as the new minimum.'
                        .replace("{val}", state.backlinks[j].value);
                    state.logMessage = '<div>{val} is the current minimum</div>'
                        .replace("{val}", state.backlinks[j].value) + state.logMessage;
                    state.lineNo = 5;
                    state.backlinks[minPosition].highlight = HIGHLIGHT_NONE;
                    state.backlinks[j].highlight = HIGHLIGHT_SPECIAL;

                    minPosition = j;
                    StateHelper.updateCopyPush(statelist, state);
                }
            }

            if (minPosition != i) { // Highlight the first-most unswapped position, if it isn't the minimum
                // Set {val} as the new minimum.
                state.status = 'Swap the minimum ({minVal}) with the first unsorted element ({element}).'
                    .replace("{minVal}", state.backlinks[minPosition].value)
                    .replace("{element}", state.backlinks[i].value);

                state.logMessage = '<div>swap {minVal} and {element}</div>'
                    .replace("{minVal}", state.backlinks[minPosition].value)
                    .replace("{element}", state.backlinks[i].value) + state.logMessage;

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
            state.backlinks[i].highlight = HIGHLIGHT_SORTED; // highlight everything
        // The array/list is now sorted.
        // (After all iterations, the last element will naturally be sorted.)
        state.status = 'List sorted!' + '<br>' + '(After all iterations, the last element will naturally be sorted.)';
        status.lineNo = 0;
        StateHelper.updateCopyPush(statelist, state);

        this.play(callback);
        return true;
    }

    var quickSortUseRandomizedPivot;

    var quickSortStart = function () {
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

        initLogMessage(state);

        quickSortSplit(state, 0, numElements - 1);

        state.lineNo = 0;
        state.status = 'List sorted!';

        for (var i = 0; i < numElements; i++)
            state.backlinks[i].highlight = HIGHLIGHT_SORTED; //unhighlight everything
        StateHelper.updateCopyPush(statelist, state);
    }

    var quickSortSplit = function (state, startIndex, endIndex) { //startIndex & endIndex inclusive
        state.status = 'Working on partition [{partition}] (index {startIndex} to {endIndex} both inclusive).'
            .replace("{partition}", state.backlinks.slice(startIndex, endIndex + 1).map(function (d) {
                return d.value;
            }))
            .replace("{startIndex}", startIndex).replace("{endIndex}", endIndex);
        state.lineNo = 1;

        if (startIndex > endIndex)
            return;

        if (startIndex == endIndex) {
            state.status += '<div>Since partition size == 1, element inside partition is necessarily at sorted position.</div>';
            state.backlinks[startIndex].highlight = HIGHLIGHT_SORTED;
            StateHelper.updateCopyPush(statelist, state);
            return;
        }

        var middleIndex = quickSortPartition(state, startIndex, endIndex);
        quickSortSplit(state, startIndex, middleIndex - 1);
        quickSortSplit(state, middleIndex + 1, endIndex);
    }

    var quickSortPartition = function (state, startIndex, endIndex) {

        var pivotIndex;
        if (quickSortUseRandomizedPivot) {

            pivotIndex = generateRandomNumber(startIndex, endIndex);

            state.status += ' Randomly selected {pivot} (index {index}) as pivot.'.replace("{pivot}", state.backlinks[pivotIndex].value).replace("{index}", pivotIndex);
            state.lineNo = [1, 2];

            state.backlinks[pivotIndex].highlight = HIGHLIGHT_PIVOT;
            StateHelper.updateCopyPush(statelist, state);

            if (pivotIndex != startIndex) {
                state.status = 'Swap pivot ({pivot}}, index {index}) with first element ({first}, index {firstIndex}). (storeIndex = {storeIndex}.)'
                    .replace("{pivot}", state.backlinks[pivotIndex].value)
                    .replace("{index}", pivotIndex)
                    .replace("{first}", state.backlinks[startIndex].value)
                    .replace("{firstIndex}", startIndex)
                    .replace("{storeIndex}", (startIndex + 1));

                state.lineNo = [2, 3];

                EntryBacklinkHelper.swapBacklinks(state.backlinks, pivotIndex, startIndex);
                pivotIndex = startIndex;
                StateHelper.updateCopyPush(statelist, state);
            }
        }
        else {
            pivotIndex = startIndex;

            state.status += '<div>Selecting {pivot} as pivot. (storeIndex = {storeIndex}.)</div>'
                .replace("{pivot}", state.backlinks[pivotIndex].value)
                .replace("{storeIndex}", (startIndex + 1));

            state.logMessage = '<div>Select {val} as pivot</div>'
                .replace("{val}", state.backlinks[pivotIndex].value) + state.logMessage;

            state.lineNo = [1, 2, 3];

            state.backlinks[pivotIndex].highlight = HIGHLIGHT_PIVOT;
            StateHelper.updateCopyPush(statelist, state);
        }

        var storeIndex = pivotIndex + 1;
        var pivotValue = state.backlinks[pivotIndex].value;

        for (var i = storeIndex; i <= endIndex; i++) {
            state.status = 'Checking if {val} < {pivot} (pivot).'
                .replace("{val}", state.backlinks[i].value)
                .replace("{pivot}", pivotValue);
            state.lineNo = [4, 5];

            state.backlinks[i].highlight = HIGHLIGHT_SPECIAL;
            StateHelper.updateCopyPush(statelist, state);
            if (state.backlinks[i].value < pivotValue) {

                state.status = '{val} < {pivot} (pivot) is true. <div>Swapping index {idx} (value = {valI}) with element at storeIndex (index = {storeIdx}, value = {storeVal}).</div> (Value of storeIndex after swap = {newStoreIdx}).'
                    .replace("{idx}", i)
                    .replace("{val}", state.backlinks[i].value)
                    .replace("{valI}", state.backlinks[i].value)
                    .replace("{pivot}", pivotValue)
                    .replace("{storeIdx}", storeIndex)
                    .replace("{storeVal}", state.backlinks[storeIndex].value)
                    .replace("{newStoreIdx}", (storeIndex + 1));

                state.lineNo = [4, 6];

                if (i != storeIndex) {
                    state.logMessage = '<div>Swap {val1} and {val2}</div>'
                        .replace("{val1}", state.backlinks[i].value)
                        .replace("{val2}", state.backlinks[storeIndex].value) + state.logMessage;
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
            state.status = 'Swapping pivot (index = {pivotIdx}, value = {pivot}) with element at storeIndex - 1 (index = {newIdx}, value = {newVal}).'
                .replace("{pivotIdx}", pivotIndex)
                .replace("{pivot}", pivotValue)
                .replace("{newIdx}", (storeIndex - 1))
                .replace("{newVal}", state.backlinks[storeIndex - 1].value);

            state.logMessage = '<div>Swap {val1} and {val2}</div>'
                .replace("{val1}", pivotValue)
                .replace("{val2}", state.backlinks[storeIndex - 1].value) + state.logMessage;

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

    this.quickSort = function (callback) {
        quickSortUseRandomizedPivot = false;
        quickSortStart();

        this.play(callback);
        return true;
    }

    this.insertionSort = function (callback) {
        var numElements = statelist[0].backlinks.length;
        var state = StateHelper.copyState(statelist[0]);

        populatePseudocode([
            'mark first element as sorted',
            '  for each unsorted element X',
            '    extract the element X',
            '    for j = lastSortedIndex down to 0',
            '      if current element j > X',
            '        move sorted element to the right by 1',
            '      break loop and insert X here'
        ]);

        initLogMessage(state);

        // Mark first element is sorted
        state.status = "Mark the first element ({first}) as sorted"
            .replace('{first}', state.backlinks[0].value);
        state.backlinks[0].highlight = HIGHLIGHT_SORTED;
        state.lineNo = 1;
        StateHelper.updateCopyPush(statelist, state);

        // Start loop forward
        for (var i = 1; i < numElements; i++) {
            state.backlinks[i].highlight = HIGHLIGHT_SPECIAL;
            state.lineNo = [2, 3];
            state.status = "Extract the first unsorted element ({val})".replace('{val}', state.backlinks[i].value);
            StateHelper.updateCopyPush(statelist, state);
            state.backlinks[i].secondaryPositionStatus = POSITION_USE_SECONDARY_IN_DEFAULT_POSITION;

            // Start loop backward from i index
            for (var j = (i - 1); j >= 0; j--) {
                state.backlinks[j].highlight = HIGHLIGHT_STANDARD;
                state.lineNo = 4;
                state.status = "Figure where to insert extracted element; comparing with sorted element {val}.".replace('{val}', state.backlinks[j].value);
                StateHelper.updateCopyPush(statelist, state);
                if (state.backlinks[j].value > state.backlinks[j + 1].value) {
                    // Swap
                    state.backlinks[j].highlight = HIGHLIGHT_SORTED;
                    state.lineNo = [5, 6];
                    state.status = "<div>{val1} > {val2} is true, hence move current sorted element ({val1}) to the right by 1.</div>"
                        .replace('{val1}', state.backlinks[j].value).replace('{val2}', state.backlinks[j + 1].value);
                    EntryBacklinkHelper.swapBacklinks(state.backlinks, j, j + 1);

                    if (j > 0) {
                        state.backlinks[j - 1].highlight = HIGHLIGHT_STANDARD;
                        StateHelper.updateCopyPush(statelist, state);
                    }
                } else {
                    state.backlinks[j].highlight = HIGHLIGHT_SORTED;
                    state.backlinks[j + 1].highlight = HIGHLIGHT_SORTED;
                    state.lineNo = 7;
                    state.status = "{val1} > {val2} is false, insert element at current position."
                        .replace('{val1}', state.backlinks[j].value)
                        .replace('{val2}', state.backlinks[j + 1].value);
                    state.backlinks[j + 1].secondaryPositionStatus = POSITION_USE_PRIMARY;
                    StateHelper.updateCopyPush(statelist, state);
                    break;
                }

                if (j == 0) {
                    StateHelper.updateCopyPush(statelist, state);

                    state.backlinks[j].secondaryPositionStatus = POSITION_USE_PRIMARY;
                    // StateHelper.updateCopyPush(statelist, state);
                    state.backlinks[j].highlight = HIGHLIGHT_SORTED;
                    StateHelper.updateCopyPush(statelist, state);

                }
            } // End backward loop
        } // End forward loop

        state.lineNo = 0;
        state.status = "List sorted!";
        StateHelper.updateCopyPush(statelist, state);

        this.play(callback);
        return true;
    }

    this.cocktailShakerSort = function (callback) {
        var numElements = statelist[0].backlinks.length;
        var state = StateHelper.copyState(statelist[0]);

        var swapped = true;
        var start = 0;
        var end = numElements;

        // Start while loop
        while (swapped) {
            // Reset the swapped flag to enter the loop
            swapped = false;

            // Start loop forward, sort like bubble sort
            for (var i = start; i < end - 1; i++) {
                state.backlinks[i].highlight = HIGHLIGHT_STANDARD;
                StateHelper.updateCopyPush(statelist, state);

                if (i + 1 <= end) {
                    state.backlinks[i + 1].highlight = HIGHLIGHT_SPECIAL;
                    StateHelper.updateCopyPush(statelist, state);
                }

                if (state.backlinks[i].value > state.backlinks[i + 1].value) {
                    EntryBacklinkHelper.swapBacklinks(state.backlinks, i, i + 1);
                    StateHelper.updateCopyPush(statelist, state);

                    state.backlinks[i].highlight = HIGHLIGHT_NONE;
                    if (i === end - 2) {
                        state.backlinks[end - 1].highlight = HIGHLIGHT_SORTED;
                    }
                    StateHelper.updateCopyPush(statelist, state);
                    swapped = true;
                } else {
                    state.backlinks[i].highlight = HIGHLIGHT_NONE;
                    if (i < end - 2) {
                        state.backlinks[i + 1].highlight = HIGHLIGHT_STANDARD;
                    } else if (i === end - 2) {
                        state.backlinks[end - 1].highlight = HIGHLIGHT_SORTED;
                    }
                    StateHelper.updateCopyPush(statelist, state);
                }
            }

            if (!swapped) {
                break;
            }

            // Set swapped flag to run loop backward
            swapped = false;

            // Last index is already sorted
            end = end - 1;

            for (var i = end - 1; i > start; i--) {
                state.backlinks[i].highlight = HIGHLIGHT_STANDARD;
                StateHelper.updateCopyPush(statelist, state);

                if (i - 1 >= start) {
                    state.backlinks[i - 1].highlight = HIGHLIGHT_SPECIAL;
                    StateHelper.updateCopyPush(statelist, state);
                }

                if (state.backlinks[i].value < state.backlinks[i - 1].value) {
                    EntryBacklinkHelper.swapBacklinks(state.backlinks, i, i - 1);
                    StateHelper.updateCopyPush(statelist, state);

                    state.backlinks[i].highlight = HIGHLIGHT_NONE;
                    if (i === start + 1) {
                        state.backlinks[start].highlight = HIGHLIGHT_SORTED;
                    }
                    StateHelper.updateCopyPush(statelist, state);
                    swapped = true;
                } else {
                    state.backlinks[i].highlight = HIGHLIGHT_NONE;
                    if (i > start + 1) {
                        state.backlinks[i - 1].highlight = HIGHLIGHT_STANDARD;
                    } else if (i === start + 1) {
                        state.backlinks[start].highlight = HIGHLIGHT_SORTED;
                    }
                    StateHelper.updateCopyPush(statelist, state);
                }
            }

            // First index is already sorted
            start = start + 1;
        } // End while loop

        state.status = "List sorted!";
        for (var i = 0; i < numElements; i++) {
            state.backlinks[i].highlight = HIGHLIGHT_SORTED;
        }
        StateHelper.updateCopyPush(statelist, state);

        this.play(callback);
        return true;
    }

    this.shellSort = function (callback) {
        var numElements = statelist[0].backlinks.length;
        var state = StateHelper.copyState(statelist[0]);

        // Start big gap loop, then reduce gap by 1
        // You have to floor the gap, or it will get bug
        for (var gap = Math.floor(numElements / 2); gap > 0; gap = Math.floor(gap / 2)) {

            for (var i = gap; i < numElements; i++) {

                for (var j = i; j >= gap;) {
                    state.backlinks[j].highlight = HIGHLIGHT_STANDARD;
                    state.backlinks[j].secondaryPositionStatus = POSITION_USE_SECONDARY_IN_DEFAULT_POSITION;
                    state.backlinks[j - gap].highlight = HIGHLIGHT_STANDARD;
                    state.backlinks[j - gap].secondaryPositionStatus = POSITION_USE_SECONDARY_IN_DEFAULT_POSITION;
                    StateHelper.updateCopyPush(statelist, state);
                    if (state.backlinks[j - gap].value > state.backlinks[j].value) {
                        EntryBacklinkHelper.swapBacklinks(state.backlinks, j, j - gap);
                        StateHelper.updateCopyPush(statelist, state);

                        state.backlinks[j].secondaryPositionStatus = POSITION_USE_PRIMARY;
                        state.backlinks[j - gap].secondaryPositionStatus = POSITION_USE_PRIMARY;
                        StateHelper.updateCopyPush(statelist, state);


                        state.backlinks[j].highlight = HIGHLIGHT_NONE;
                        state.backlinks[j - gap].highlight = HIGHLIGHT_NONE;
                        StateHelper.updateCopyPush(statelist, state);
                    } else {
                        state.backlinks[j].secondaryPositionStatus = POSITION_USE_PRIMARY;
                        state.backlinks[j - gap].secondaryPositionStatus = POSITION_USE_PRIMARY;
                        StateHelper.updateCopyPush(statelist, state);

                        state.backlinks[j].highlight = HIGHLIGHT_NONE;
                        state.backlinks[j - gap].highlight = HIGHLIGHT_NONE;
                        StateHelper.updateCopyPush(statelist, state);
                        break;
                    }
                    j -= gap;
                }
            } // End for i

        } // End for gap

        state.status = "List sorted!";
        for (var i = 0; i < numElements; i++) {
            state.backlinks[i].highlight = HIGHLIGHT_SORTED;
            StateHelper.updateCopyPush(statelist, state);
        }
        this.play(callback);

        return true;
    }

    this.mergeSort = function (callback) {
        var numElements = statelist[0].backlinks.length;
        var state = StateHelper.copyState(statelist[0]);

        populatePseudocode([
            'split each element into partitions of size 1',
            'recursively merge adjancent partitions',
            '  for i = leftPartStartIndex to rightPartLastIndex inclusive',
            '    if leftPartHeadValue <= rightPartHeadValue',
            '      copy leftPartHeadValue',
            '    else: copy rightPartHeadValue',
            'copy elements back to original array'
        ]);

        this.mergeSortSplit(state, 0, numElements);

        state.status = "List sorted!";
        for (var i = 0; i < numElements; i++) {
            state.backlinks[i].highlight = HIGHLIGHT_SORTED;
        }
        StateHelper.updateCopyPush(statelist, state);
        this.play(callback);

        return true;
    }

    this.mergeSortSplit = function (state, startIndex, endIndex) {
        if (endIndex - startIndex <= 1) {
            return;
        }

        var midIndex = Math.ceil((startIndex + endIndex) / 2);
        this.mergeSortSplit(state, startIndex, midIndex);
        this.mergeSortSplit(state, midIndex, endIndex);
        this.mergeSortMerge(state, startIndex, midIndex, endIndex);

        // Copy sorted array back to original array
        state.status = "Copy sorted elements back to original array.";
        state.lineNo = 7;

        var duplicatedArray = new Array();
        for (var i = startIndex; i < endIndex; i++) {
            var newPosition = state.backlinks[i].secondaryPositionStatus;
            duplicatedArray[newPosition] = state.backlinks[i];
        }

        for (var i = startIndex; i < endIndex; i++) {
            state.backlinks[i] = duplicatedArray[i];
        }

        for (var i = startIndex; i < endIndex; i++) {
            state.backlinks[i].secondaryPositionStatus = POSITION_USE_PRIMARY;
            state.backlinks[i].highlight = HIGHLIGHT_NONE;
            StateHelper.updateCopyPush(statelist, state);
        }
    }

    this.mergeSortMerge = function (state, startIndex, midIndex, endIndex) {
        var leftIndex = startIndex;
        var rightIndex = midIndex;

        for (var i = startIndex; i < endIndex; i++) {
            state.backlinks[i].highlight = HIGHLIGHT_STANDARD;
        }
        state.lineNo = 2;
        StateHelper.updateCopyPush(statelist, state);

        for (var i = startIndex; i < endIndex; i++) {

            if (leftIndex < midIndex && (rightIndex >= endIndex || state.backlinks[leftIndex].value <= state.backlinks[rightIndex].value)) {
                state.backlinks[leftIndex].secondaryPositionStatus = i;
                state.lineNo = [3, 4, 5];

                leftIndex++;
                StateHelper.updateCopyPush(statelist, state);
            } else {
                state.backlinks[rightIndex].secondaryPositionStatus = i;
                state.lineNo  = [3, 6];

                rightIndex++;
                StateHelper.updateCopyPush(statelist, state);
            }
        }
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
        $('#log p').html(statelist[stateIndex].logMessage);
        highlightLine(statelist[stateIndex].lineNo);
    };

    var drawBars = function (state) {
        barWidth = width / (state.entries.length);
        scaler.domain([0, d3.max(state.entries, function (d) {
            return d.value;
        })]);

        centreBarsOffset = 0;

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
            .attr("x", (barWidth - gapBetweenBars - 10) / 2)
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
        transitionTime = 750;
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

    this.init = function () {
        this.createList();
        // showCodetracePanel();
        // showStatusPanel();
    }

    this.setSelectedSortFunction = function (f) {
        this.selectedSortFunction = f;
        // this.sort();
        // isRadixSort = (this.selectedSortFunction == this.radixSort);
        // isCountingSort = (this.selectedSortFunction == this.countingSort);
    }

    this.sort = function (callback) {
        return this.selectedSortFunction(callback);
    }

    this.getCurrentIteration = function () {
        return currentStep;
    }

    this.getTotalIteration = function () {
        return statelist.length;
    }

    this.forceNext = function () {
        if ((currentStep + 1) < statelist.length)
            currentStep++;
        drawCurrentState();
    }

    this.forcePrevious = function () {
        if ((currentStep - 1) >= 0)
            currentStep--;
        drawCurrentState();
    }

    this.jumpToIteration = function (n) {
        currentStep = n;
        drawCurrentState();
    }

}

var title = document.getElementById('title');

var note = document.getElementById('noteContent');

// var gw = new Sorting();

$('#bubbleSort').click(function () {
    if (!gw.issPlaying) {
        title.innerHTML = "Bubble Sort";
        changeSortType(gw.bubbleSort);
        note.innerHTML = '<h1>Bubble Sort</h1><br/>';
        note.innerHTML += "<div>Bubble sort, sometimes referred to as sinking sort, is a simple sorting algorithm that repeatedly steps through the list to be sorted, compares each pair of adjacent items and swaps them if they are in the wrong order. The pass through the list is repeated until no swaps are needed, which indicates that the list is sorted.</div>";

    } else {
        sort();
    }
});

$('#selectionSort').click(function () {
    if (!gw.issPlaying) {
        title.innerHTML = "Selection Sort";
        changeSortType(gw.selectionSort);

        note.innerHTML = '<h1>Selection Sort</h1><br/>';
        note.innerHTML += "<div>Selection sort is a sorting algorithm, specifically an in-place comparison sort. It has O(n2) time complexity, making it inefficient on large lists, and generally performs worse than the similar insertion sort. Selection sort is noted for its simplicity, and it has performance advantages over more complicated algorithms in certain situations, particularly where auxiliary memory is limited.</div>";
    } else {
        sort();
    }
});

$('#quickSort').click(function () {
    if (!gw.issPlaying) {
        title.innerHTML = "Quick Sort";
        changeSortType(gw.quickSort);

        note.innerHTML = '<h1>Quick Sort</h1><br/>';
        note.innerHTML += "<div>Quicksort (sometimes called partition-exchange sort) is an efficient sorting algorithm, serving as a systematic method for placing the elements of an array in order. Developed by Tony Hoare in 1959, with his work published in 1961, it is still a commonly used algorithm for sorting. When implemented well, it can be about two or three times faster than its main competitors, merge sort and heapsort.</div>";
    } else {
        sort();
    }
});

$('#insertionSort').click(function () {
    if (!gw.issPlaying) {
        title.innerHTML = "Insertion Sort";
        changeSortType(gw.insertionSort);

        note.innerHTML = '<h1>Insertion Sort</h1><br/>';
        note.innerHTML += "<div>Insertion sort is a simple sorting algorithm that builds the final sorted array (or list) one item at a time. It is much less efficient on large lists than more advanced algorithms such as quicksort, heapsort, or merge sort.</div>";

    } else {
        sort();
    }
});

$('#cocktailSort').click(function () {
    if (!gw.issPlaying) {
        title.innerHTML = "Cocktail Shaker Sort";
        changeSortType(gw.cocktailShakerSort);

        note.innerHTML = '<h2>Cocktail Shaker Sort</h2><br/>';
        note.innerHTML += "<div>Cocktail shaker sort, also known as bidirectional bubble sort, cocktail sort, shaker sort (which can also refer to a variant of selection sort), ripple sort, shuffle sort, or shuttle sort, is a variation of bubble sort that is both a stable sorting algorithm and a comparison sort. The algorithm differs from a bubble sort in that it sorts in both directions on each pass through the list. This sorting algorithm is only marginally more difficult to implement than a bubble sort, and solves the problem of turtles in bubble sorts</div>  ";

    } else {
        sort();
    }
});

$('#shellSort').click(function () {
    if (!gw.issPlaying) {
        title.innerHTML = "Shell Sort";
        changeSortType(gw.shellSort);

        note.innerHTML = '<h1>Shell Sort</h1><br/>';
        note.innerHTML += "<div>Shellsort, also known as Shell sort or Shell's method, is an in-place comparison sort. It can be seen as either a generalization of sorting by exchange (bubble sort) or sorting by insertion (insertion sort). The method starts by sorting pairs of elements far apart from each other, then progressively reducing the gap between elements to be compared.</div>";
    } else {
        sort();
    }
});

$('#mergeSort').click(function () {
    if (!gw.issPlaying) {
        title.innerHTML = "Merge Sort";
        changeSortType(gw.mergeSort);

        note.innerHTML = '<h1>Merge Sort</h1><br/>';
        note.innerHTML += "<div>In computer science, merge sort (also commonly spelled mergesort) is an efficient, general-purpose, comparison-based sorting algorithm. Most implementations produce a stable sort, which means that the implementation preserves the input order of equal elements in the sorted output. Mergesort is a divide and conquer algorithm that was invented by John von Neumann in 1945. A detailed description and analysis of bottom-up mergesort appeared in a report by Goldstine and Neumann as early as 1948.</div>";
    } else {
        sort();
    }
});

window.onload = function () {
    var reloading = sessionStorage.getItem("type");
    // gw = new Sorting();
    switch (reloading) {
        case "bubble" :
            title.innerHTML = "Bubble Sort";
            gw.init();
            gw.bubbleSort();
            break;
        case "selection" :
            title.innerHTML = "Selection Sort";
            gw.init();
            gw.selectionSort();
            break;
        case "quick":
            title.innerHTML = "Quick Sort";
            gw.init();
            gw.quickSort();
            break;
    }
    sessionStorage.removeItem("type");
}

function responsivefy(svg) {

    var container = d3.select(svg.node().parentNode),
        width = parseInt(svg.style("width")),
        height = parseInt(svg.style("height")),
        aspect = width / height;

    svg.attr("viewBox", "0 0 " + width + " " + height)
        .attr("preserveAspectRatio", "xMinYMid")
        .call(resize);

    d3.select(window).on("resize." + container.attr("id"), resize);

    function resize() {
        var targetWidth = parseInt(container.style("width"));
        svg.attr("width", targetWidth);
        svg.attr("height", Math.round(targetWidth / aspect));
    }
}

function changeSortType(newSortingFunction) {

    createList();

    if (isPlaying) stop();
    gw.clearPseudocode();
    gw.setSelectedSortFunction(newSortingFunction);
    $('#play').hide();
    sort();

}

function createList() {
    if (isPlaying) stop();
    setTimeout(function () {
        gw.createList();
        isPlaying = false;
    }, 1000);
}

function sort(callback) {
    if (isPlaying) stop();
    setTimeout(function () {
        if (gw.sort(callback)) {
            isPlaying = true;
        }
    }, 1000);
}


