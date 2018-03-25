


var Heap = function () {
    var gw = new GraphWidget();

    /*
     * A: Internal representation of Heap in this object
     * It is a compact 1-based 1-dimensional array (ignoring index 0)
     * The parent/left child/right child can be computed via index manipulation
     *
     * Elements of A are ObjectPair objects, where first element is the value and the second element is the ID of the vertex SVG corresponding to the value
     */

    /*
     * Edge IDs are the index of the child element, so for example edge A[1]-A[2] will have ID "e2" (edge 2)
     * The edges will be set to not change when vertexes are interchanged
     * This eliminates the need to maintain an Adjacency Matrix / List
     */

    var coord = new Array();
    var A = new Array();
    var amountVertex = 0;
    var arr;

    initArrayRandom();
    init();

    var stateList = [];

    this.getGraphWidget = function () {
        return gw;
    };

    function parent(i) {
        return i >> 1;
    } // Math.floor(i/2);

    function left(i) {
        return i << 1;
    } // i*2;

    function right(i) {
        return (i << 1) + 1;
    } // i*2+1;

    this.IsMaxHeap = function (array) {
        for (var i = 1; i < array.length; i++)
            if (array[parent(i)] < array[i])
                return false;
        return true;
    }

    this.generate = function (array) {
        clearScreen();
        array.unshift(999999);
        A = [];
        for (var i = 0; i < array.length; i++) {
            A[i] = new ObjectPair(array[i], amountVertex); // testing layout, to leave the edges there for now
            amountVertex++;
        }
        init();
    };

    this.saveArray = function () {
        arr = new Array();
        for (var i = 0; i < A.length; i++)
            arr[i] = A[i].getFirst();
        return arr;
    }

    this.restoreArray = function (arr) {
        clearScreen();
        amountVertex = arr.length;
        A = [];
        for (var i = 0; i < amountVertex; i++)
            A[i] = new ObjectPair(arr[i], i);
        init();
    }

    function initArrayRandom() {
        A = [];
        amountVertex = 5 + Math.floor(Math.random() * 11); // [5..15]
        A[0] = new ObjectPair(999999, 0);
        arr = new Array();
        for (var i = 1; i < amountVertex; i++) {
            var lb = 20;
            if (i == 1) lb = 80;
            else if (i >= 2 && i <= 3) lb = 60;
            else if (i >= 4 && i <= 7) lb = 40;
            var newVal = lb + Math.floor(Math.random() * 20); // [lb..lb+19]
            while ($.inArray(newVal, arr) != -1)
                newVal = lb + Math.floor(Math.random() * 20);
            arr.push(newVal);
            A[i] = new ObjectPair(newVal, i);
        }
    }

    this.createRandom = function () {
        clearScreen();
        initArrayRandom();
        init();
    }

    function init() {
        var i, j;

        // compute vertex coordinates
        var vtx_count = 1; // 1-based indexing
        for (i = 0; i <= 4; i++) { // we limit our visualization to 4 levels only
            var entriesInThisLevel = 1 << i; // 2^i
            for (j = 0; j < entriesInThisLevel; j++) {
                coord[vtx_count] = new Array();
                coord[vtx_count][0] = (2 * j + 1) * 900 / (2 * entriesInThisLevel); // x Coordinate
                coord[vtx_count][1] = 50 + 40 * i; // y Coordinate
                vtx_count++;
            }
        }

        for (i = 1; i < A.length; i++) // add vertices first
            gw.addVertex(coord[i][0], coord[i][1], A[i].getFirst(), A[i].getSecond(), true, i);

        for (i = 2; i < A.length; i++) { // then add edges, i is edge id
            parentVertex = A[parent(i)].getSecond();
            childVertex = A[i].getSecond();
            gw.addEdge(parentVertex, childVertex, i, EDGE_TYPE_UDE, 1, true);
        }
    }

    function clearScreen() {
        var i;
        for (i = 2; i < A.length; i++) // remove edges first
            gw.removeEdge(i);
        for (i = 1; i < A.length; i++) // then afterwards, remove vertices
            gw.removeVertex(A[i].getSecond());
        amountVertex = 0;
        A = []; // destroy old A, create new one
    }

    this.insert = function (vertexText, startAnimationDirectly, callback) {
        if (A.length > 31) {
            $('#insert-err').html('Sorry, max limit of 31 has been reached');
            if (typeof callback == 'function') callback();
            return false;
        }

        for (i = 0; i < A.length; i++) {
            if (A[i].getFirst() == parseInt(vertexText)) {
                $('#insert-err').html('Sorry, that integer value is already inside the heap, this visualization can only handle unique integers');
                if (typeof callback == 'function') callback();
                return false;
            }
        }

        if (startAnimationDirectly == true) {
            stateList = [];
            populatePseudocode(0);
        }

        var i, key, cs;
        if (A.length > 1) {
            cs = createState(A);
            cs["status"] = "The current Binary Max Heap";
            cs["lineNo"] = !startAnimationDirectly ? 2 : 0;
            stateList.push(cs); // zero-th frame, the starting point
        }

        A[A.length] = new ObjectPair(parseInt(vertexText), amountVertex);
        amountVertex++;
        i = A.length - 1;

        cs = createState(A);
        cs["vl"][A[i].getSecond()]["state"] = VERTEX_HIGHLIGHTED;
        cs["status"] = vertexText + " is inserted at the back of compact array A.";
        cs["lineNo"] = !startAnimationDirectly ? 3 : [1, 2]; // differentiate O(N log N) build vs single insert
        stateList.push(cs); // first frame, highlight the newly inserted vertex

        while (i > 1 && A[parent(i)].getFirst() < A[i].getFirst()) {
            cs = createState(A);
            cs["vl"][A[i].getSecond()]["state"] = VERTEX_HIGHLIGHTED;
            cs["vl"][A[parent(i)].getSecond()]["state"] = VERTEX_TRAVERSED;
            cs["status"] = A[parent(i)].getFirst() + ' < ' + A[i].getFirst() + ', so swap them.';
            cs["lineNo"] = 3;
            stateList.push(cs); // before swap

            var temp = A[i];
            A[i] = A[parent(i)];
            A[parent(i)] = temp;
            cs = createState(A);
            cs["vl"][A[i].getSecond()]["state"] = VERTEX_TRAVERSED;
            cs["vl"][A[parent(i)].getSecond()]["state"] = VERTEX_HIGHLIGHTED;
            cs["status"] = A[parent(i)].getFirst() + ' <-> ' + A[i].getFirst() + ' have been swapped.';
            cs["lineNo"] = !startAnimationDirectly ? 3 : 4;
            stateList.push(cs); // record the successive vertex swap animation
            i = parent(i);
        }

        cs = createState(A); // record the final state of the heap after insertion to stop the highlights
        cs["vl"][A[i].getSecond()]["state"] = VERTEX_HIGHLIGHTED; // highlighted the successful insertion
        cs["status"] = vertexText + ' has been inserted successfully.';
        cs["lineNo"] = !startAnimationDirectly ? 3 : 0;
        stateList.push(cs);

        if (startAnimationDirectly) gw.startAnimation(stateList, callback);
        return true;
    }

    this.shiftDown = function (i, calledFrom) {
        while (i < A.length) {
            var maxV = A[i].getFirst(), max_id = i;
            if (left(i) < A.length && maxV < A[left(i)].getFirst()) {
                maxV = A[left(i)].getFirst();
                max_id = left(i);
            }
            if (right(i) < A.length && maxV < A[right(i)].getFirst()) {
                maxV = A[right(i)].getFirst();
                max_id = right(i);
            }

            if (max_id != i) {
                var cs = createState(A);
                cs["vl"][A[i].getSecond()]["state"] = VERTEX_HIGHLIGHTED;
                cs["vl"][A[max_id].getSecond()]["state"] = VERTEX_TRAVERSED;
                cs["status"] = A[i].getFirst() + ' < ' + A[max_id].getFirst() + ', so swap them.';
                if (calledFrom == 'extractmax')
                    cs["lineNo"] = [4, 5];
                else if (calledFrom == 'createN')
                    cs["lineNo"] = [2, 3];
                else if (calledFrom == 'heapsort')
                    cs["lineNo"] = 2;
                stateList.push(cs); // deal with affected edges first

                var temp = A[i];
                A[i] = A[max_id];
                A[max_id] = temp;
                cs = createState(A);
                cs["status"] = A[i].getFirst() + ' <-> ' + A[max_id].getFirst() + ' have been swapped.';
                if (calledFrom == 'extractmax')
                    cs["lineNo"] = 6;
                else if (calledFrom == 'createN')
                    cs["lineNo"] = [2, 3];
                else if (calledFrom == 'heapsort')
                    cs["lineNo"] = 2;
                stateList.push(cs);

                i = max_id;
            }
            else
                break;
        }
    }

    this.getMax = function () {
        return A[1].getFirst();
    }

    this.extractMax = function (startAnimationDirectly, callback) {
        if (A.length == 2) {
            $('#extractmax-err').html('Sorry, the Binary Max Heap contains only one item. This is the max item. We cannot delete any more item.');
            if (typeof callback == 'function') callback();
            return false;
        }

        if (startAnimationDirectly == true) {
            stateList = [];
            populatePseudocode(1);
        }

        var cs = createState(A);
        cs["vl"][A[1].getSecond()]["state"] = VERTEX_HIGHLIGHTED;
        cs["status"] = 'Root stores the max item.';
        cs["lineNo"] = !startAnimationDirectly ? 2 : 0; // heapsort vs standard extract
        stateList.push(cs); // highlight the root (max element)

        cs = createState(A);
        delete cs["vl"][A[1].getSecond()];
        var maxitem = A[1].getFirst();
        cs["status"] = 'Take out the root ' + maxitem + '.';
        cs["lineNo"] = !startAnimationDirectly ? 2 : 1;
        stateList.push(cs); // move the root (max element) a bit upwards (to simulate 'extract max')

        if (A.length > 2) {
            cs = createState(A);
            delete cs["vl"][A[1].getSecond()];
            cs["status"] = 'Replace root with the last leaf ' + A[A.length - 1].getFirst() + '.';
            cs["vl"][A[A.length - 1].getSecond()]["state"] = VERTEX_HIGHLIGHTED; // highlighted the last leaf
            cs["lineNo"] = !startAnimationDirectly ? 2 : [2, 3];
            stateList.push(cs); // delete bottom-most right-most leaf (later, also remove its associated edge)
        }

        if (A.length > 2) {
            A[1] = A[A.length - 1];
            A.splice(A.length - 1, 1);
            cs = createState(A);
            cs["vl"][A[1].getSecond()]["state"] = VERTEX_HIGHLIGHTED;
            cs["status"] = 'The new root.';
            cs["lineNo"] = !startAnimationDirectly ? 2 : [2, 3];
            stateList.push(cs); // highlight the new root
        }

        this.shiftDown(1, !startAnimationDirectly ? 'heapsort' : 'extractmax');

        cs = createState(A);
        cs["status"] = 'ExtractMax() has been completed<br>We return the max item: ' + maxitem + '.';
        cs["lineNo"] = !startAnimationDirectly ? 1 : 0;
        stateList.push(cs);

        if (startAnimationDirectly) gw.startAnimation(stateList, callback);
        return true;
    }

    this.heapSort = function (callback) {
        if (A.length == 2) {
            $('#heapsort-err').html('Sorry, the Binary Max Heap contains only one item. This is the max item. We cannot delete any more item.');
            if (typeof callback == 'function') callback();
            return false;
        }

        populatePseudocode(2);
        res = []; // copy first
        for (var i = 1; i < A.length; i++)
            res[i - 1] = A[i].getFirst();
        res.sort(function (a, b) {
            return a - b
        });

        stateList = [];
        var len = A.length - 1;
        var partial = [];
        for (var i = 0; i < len; i++)
            partial[i] = -1;

        for (var i = 0; i < len - 1; i++) { // except the last item (minor bug if not stopped here)
            partial[len - 1 - i] = A[1].getFirst();
            this.extractMax(false);
            cs = createState(A);
            cs["status"] = 'The partial sorted order is ' + partial + '.';
            cs["lineNo"] = 1;
            stateList.push(cs);
        }

        cs = createState(A);
        cs["status"] = 'The final sorted order is ' + res + '.';
        cs["lineNo"] = 0;
        stateList.push(cs);

        gw.startAnimation(stateList, callback);
        return true;
    }

    this.createNlogN = function (arr, callback) {
        if (arr.length > 31) {
            $('#createNlogN-err').html('Sorry, you cannot build a Binary Max Heap with more than 31 integers in this visualization.');
            if (typeof callback == 'function') callback();
            return false;
        }

        populatePseudocode(3);
        clearScreen();
        var i, initValue = [999999, parseInt(arr[0])];
        stateList = [];

        var cs = createState(A);
        cs["status"] = 'Start from an empty Binary Max Heap.';
        cs["lineNo"] = 1;
        stateList.push(cs);

        for (i = 0; i < initValue.length; i++) {
            A[i] = new ObjectPair(initValue[i], amountVertex);
            amountVertex++;
        }
        init();

        cs = createState(A);
        cs["status"] = arr[0] + ' is inserted.<br>It becomes the new root.';
        cs["lineNo"] = [2, 3];
        stateList.push(cs);

        for (i = 1; i < arr.length; i++) // insert one by one
            this.insert(parseInt(arr[i]), false);

        cs = createState(A);
        cs["status"] = 'The Binary Max Heap has been successfully created from array A: ' + arr + '.';
        cs["lineNo"] = 0;
        stateList.push(cs);

        gw.startAnimation(stateList, callback);
        return true;
    }

    this.createN = function (arr, callback) {
        if (arr.length > 31) {
            $('#createN-err').html('Sorry, you cannot build a Binary Max Heap with more than 31 integers in this visualization.');
            if (typeof callback == 'function') callback();
            return false;
        }

        populatePseudocode(4);
        clearScreen();
        var i, initValue = [999999];

        for (i = 0; i < arr.length; i++)
            initValue[i + 1] = parseInt(arr[i]);

        for (i = 0; i < initValue.length; i++) {
            A[i] = new ObjectPair(initValue[i], amountVertex);
            amountVertex++;
        }
        init();

        stateList = [];
        var cs = createState(A);
        cs["status"] = 'Leave the content of the input array A as it is (a Complete Binary Tree structure).';
        cs["lineNo"] = 1;
        stateList.push(cs);

        for (i = Math.floor(arr.length / 2); i >= 1; i--) { // check heap property one by one
            cs = createState(A);
            cs["vl"][A[i].getSecond()]["state"] = VERTEX_HIGHLIGHTED;
            cs["status"] = 'shiftDown(' + i + ') to fix the Binary Max Heap property (if necessary) of sub-tree rooted at ' + A[i].getFirst() + '.';
            cs["lineNo"] = [2, 3];
            stateList.push(cs);

            this.shiftDown(i, 'createN');
        }

        cs = createState(A);
        cs["status"] = 'The Binary Max Heap has been successfully created from array A: ' + arr + '.';
        cs["lineNo"] = 0;
        stateList.push(cs);

        gw.startAnimation(stateList, callback);
        return true;
    }

    function createState(iH) {
        var s = {
            "vl": {},
            "el": {},
        };

        for (var i = 1; i < iH.length; i++) {
            var key = iH[i].getSecond();
            s["vl"][key] = {};
            s["vl"][key]["cx"] = coord[i][0];
            s["vl"][key]["cy"] = coord[i][1];
            s["vl"][key]["text"] = iH[i].getFirst();
            s["vl"][key]["extratext"] = i; // the vertex number
            s["vl"][key]["state"] = VERTEX_DEFAULT;
        }

        for (var i = 2; i < iH.length; i++) {
            s["el"][i] = {};
            s["el"][i]["vertexA"] = iH[parent(i)].getSecond();
            s["el"][i]["vertexB"] = iH[i].getSecond();
            s["el"][i]["type"] = EDGE_TYPE_UDE;
            s["el"][i]["weight"] = 1;
            s["el"][i]["state"] = EDGE_DEFAULT;
            s["el"][i]["animateHighlighted"] = false;
        }

        return s;
    }

    function populatePseudocode(act) {
        switch (act) {
            case 0: // Insert
                $('#code1').html('A[A.length] = v');
                $('#code2').html('i = A.length-1');
                $('#code3').html('while (i > 1 &amp;&amp; A[parent(i)] &lt; A[i])');
                $('#code4').html('&nbsp&nbspswap(A[i], A[parent(i)])');
                $('#code5').html('');
                $('#code6').html('');
                $('#code7').html('');
                break;
            case 1: // ExtractMax
                $('#code1').html('take out A[1]');
                $('#code2').html('A[1] = A[A.length-1]');
                $('#code3').html('i = 1; A.length--');
                $('#code4').html('while (i &lt; A.length)');
                $('#code5').html('&nbsp&nbspif A[i] < (L = the larger of i&#39;s children)');
                $('#code6').html('&nbsp&nbsp&nbsp&nbspswap(A[i], L)');
                $('#code7').html('');
                break;
            case 2: // HeapSort
                $('#code1').html('for (i = 0; i &lt; A.length; i++)');
                $('#code2').html('&nbsp&nbspExtractMax()');
                $('#code3').html('');
                $('#code4').html('');
                $('#code5').html('');
                $('#code6').html('');
                $('#code7').html('');
                break;
            case 3: // Create, O(N log N)
                $('#code1').html('Start from an empty Binary Max Heap');
                $('#code2').html('for (i = 0; i &lt; A.length; i++)');
                $('#code3').html('&nbsp&nbspInsert(A[i])');
                $('#code4').html('');
                $('#code5').html('');
                $('#code6').html('');
                $('#code7').html('');
                break;
            case 4: // Create, O(N)
                $('#code1').html('The input array A as it is');
                $('#code2').html('for (i = A.length/2; i &gt;= 1; i--)');
                $('#code3').html('&nbsp&nbspshiftDown(i)');
                $('#code4').html('>');
                $('#code5').html('');
                $('#code6').html('');
                $('#code7').html('');
                break;
        }
    }
}


// Heap Actions
var actionsWidth = 150;
var statusCodetraceWidth = 370;

var isCreateNlogNOpen = false, isCreateNOpen = false, isInsertOpen = false, isExtractmaxOpen = false,
    isHeapsortOpen = false;

function opencreateNlogN() {
    if (!isCreateNlogNOpen) {
        $('.createNlogN').fadeIn('fast');
        isCreateNlogNOpen = true;
    }
}

function closeCreateNlogN() {
    if (isCreateNlogNOpen) {
        $('.createNlogN').fadeOut('fast');
        $('#createNlogN-err').html("");
        isCreateNlogNOpen = false;
    }
}

function opencreateN() {
    if (!isCreateNOpen) {
        $('.createN').fadeIn('fast');
        isCreateNOpen = true;
    }
}

function closeCreateN() {
    if (isCreateNOpen) {
        $('.createN').fadeOut('fast');
        $('#createN-err').html("");
        isCreateNOpen = false;
    }
}

function openInsert() {
    if (!isInsertOpen) {
        $('.insert').fadeIn('fast');
        isInsertOpen = true;
    }
}

function closeInsert() {
    if (isInsertOpen) {
        $('.insert').fadeOut('fast');
        $('#insert-err').html("");
        isInsertOpen = false;
    }
}

function openExtractmax() {
    if (!isExtractmaxOpen) {
        $('.extractmax').fadeIn('fast');
        isExtractmaxOpen = true;
    }
}

function closeExtractmax() {
    if (isExtractmaxOpen) {
        $('.extractmax').fadeOut('fast');
        $('#extractmax-err').html("");
        isExtractmaxOpen = false;
    }
}

function openHeapsort() {
    if (!isHeapsortOpen) {
        $('.heapsort').fadeIn('fast');
        isHeapsortOpen = true;
    }
}

function closeHeapsort() {
    if (isHeapsortOpen) {
        $('.heapsort').fadeOut('fast');
        $('#heapsort-err').html("");
        isHeapsortOpen = false;
    }
}

function hideEntireActionsPanel() {
    closeCreateNlogN();
    closeCreateN();
    closeInsert();
    closeExtractmax();
    closeHeapsort();
    hideActionsPanel();
}

var note = document.getElementById('noteContent');

$('#title-Heap').click(function () {

    // $("#title-LL").text('Linked List');
    title.innerHTML = "Binary Heap";
    note.innerHTML = '<h1>Binary Heap</h1><br/>';
    note.innerHTML += "<div>A Binary Heap is a Binary Tree with following properties.\n"
        + "<br> 1) It’s a complete tree (All levels are completely filled except possibly the last level and the last level has all keys as left as possible).\n"
        + "This property of Binary Heap makes them suitable to be stored in an array.\n"
        + "<br> 2) A Binary Heap is either Min Heap or Max Heap. In a Min Binary Heap, the key at root must be minimum among all keys present in Binary Heap.\n"
        + "The same property must be recursively true for all nodes in Binary Tree. Max Binary Heap is similar to Min Heap.</div>"
    clearConsole();

});
// local
$('#play').hide();
var hw = new Heap();
var gw = hw.getGraphWidget();

$(function () {
    var createHeap = getQueryVariable("create");
    if (createHeap.length > 0) {
        var newHeap = createHeap.split(",");
        if (hw.IsMaxHeap(newHeap)) // the input parameter is already a max heap
            hw.generate(newHeap); // just show
        else {
            $('#arrv2').val(createHeap);
            createN(); // not yet a max heap, build it fast
            stop();
        }
    }

    $('#createNlogN').click(function () {
        closeCreateN();
        closeInsert();
        closeExtractmax();
        closeHeapsort();
        opencreateNlogN();
    });

    $('#createN').click(function () {
        closeCreateNlogN();
        closeInsert();
        closeExtractmax();
        closeHeapsort();
        opencreateN();
    });

    $('#insert').click(function () {
        closeCreateNlogN();
        closeCreateN();
        closeExtractmax();
        closeHeapsort();
        openInsert();
    });

    $('#extractmax').click(function () {
        closeCreateNlogN();
        closeCreateN();
        closeInsert();
        closeHeapsort();
        openExtractmax();
    });

    $('#heapsort').click(function () {
        closeCreateNlogN();
        closeCreateN();
        closeInsert();
        closeExtractmax();
        openHeapsort();
    });
});

function createNlogNWithInput(input, callback) {
    commonAction(hw.createNlogN(input.split(","), callback), "Create(A) - O(N log N): " + input);
}

function createNlogN(callback) {
    if (isPlaying) stop();
    var input = $('#arrv1').val();
    createNlogNWithInput(input, callback);
}

function createNlogNSample(callback) {
    if (isPlaying) stop();
    var input = "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31";
    createNlogNWithInput(input, callback);
}

function createNlogNRandom(callback) {
    if (isPlaying) stop();
    var n = 7 + Math.floor(17 * Math.random());
    var input = new Array();
    while (n > 0) {
        var newVal = 1 + Math.floor(98 * Math.random());
        if ($.inArray(newVal, input) == -1) {
            input.push(newVal);
            n--;
        }
    }
    input = input.join(",");
    createNlogNWithInput(input, callback);
}

function createNWithInput(input, callback) {
    commonAction(hw.createN(input.split(","), callback), "Create(A) - O(N): " + input);
}

function createN(callback) {
    if (isPlaying) stop();
    var input = $('#arrv2').val();
    createNWithInput(input, callback);
}

function createNSample(callback) {
    if (isPlaying) stop();
    var input = "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31";
    createNWithInput(input, callback);
}

// var drawArray = getTreeArray();
function createDraw(callback) {
    if (isPlaying) stop();
    var input = getTreeArray().toString();
    createNWithInput(input, callback);
    // alert(getTreeArray().toString());
}

function createNRandom(callback) {
    if (isPlaying) stop();
    var n = 7 + Math.floor(17 * Math.random());
    var input = new Array();
    while (n > 0) {
        var newVal = 1 + Math.floor(98 * Math.random());
        if ($.inArray(newVal, input) == -1) {
            input.push(newVal);
            n--;
        }
    }
    input = input.join(",");
    commonAction(hw.createN(input.split(","), callback), "Create(A) - O(N): " + input);
}

function insert(callback) {
    if (isPlaying) stop();
    var input = parseInt($("#v").val());
    commonAction(hw.insert(input, true, callback), "Insert " + input);
    setTimeout(function () {
        var existing = hw.saveArray();
        var next_num = 1 + Math.floor(Math.random() * 88);
        while (existing.includes(next_num)) next_num = 1 + Math.floor(Math.random() * 88);
        $("#v").val(next_num); // randomized for next click between [1..89}, and it won't exist before (allow for a few more insertion of 90-99, still two digits)
    }, 500);
}

function insert_top(callback) {
    if (isPlaying) stop();
    var input = hw.getMax() + 1; // always increase the top value by 1
    commonAction(hw.insert(input, true, callback), "Insert " + input);
    setTimeout(function () {
        $("#v").val(1 + Math.floor(Math.random() * 98));
    }, 500); // randomized for next click between [1..99}
}

function extractmax(callback) {
    if (isPlaying) stop();
    commonAction(hw.extractMax(true, callback), "ExtractMax");
}

function heapsort(callback) {
    if (isPlaying) stop();
    commonAction(hw.heapSort(callback), "HeapSort");
}

var exploreModeData = [];

// This function will be called before entering e-Lecture Mode
function ENTER_LECTURE_MODE() {
    exploreModeData = hw.saveArray();
}

// This function will be called before returning to Explore Mode
function ENTER_EXPLORE_MODE() {
    hw.restoreArray(exploreModeData);
}

// Lecture action functions
function CUSTOM_ACTION(action, data, mode) {
    if (action == 'random_insert') {
        hideSlide(function () {
            insert(showSlide);
        });
    }
    else if (action == 'insert_top') {
        hideSlide(function () {
            insert_top(showSlide);
        });
    }
    else if (action == 'extractmax') {
        hideSlide(function () {
            extractmax(showSlide);
        });
    }
    else if (action == 'createN') {
        hideSlide(function () {
            createNWithInput(data, showSlide);
        });
    }
    else if (action == 'createNlogN') {
        hideSlide(function () {
            createNlogNWithInput(data, showSlide);
        });
    }
    else if (action == 'heapsort') {
        hideSlide(function () {
            heapsort(showSlide);
        });
    }
}

function responsivefy(svg) {
    var container = d3.select(svg.node()),
        width = parseInt(svg.style("width")) + 30,
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