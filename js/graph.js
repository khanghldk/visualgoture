var colourArray = ["#52bc69", "#d65775"/*"#ed5a7d"*/, "#2ebbd1", "#d9513c", "#fec515", "#4b65ba", "#ff8a27", "#a7d41e"]; // green, pink, blue, red, yellow, indigo, orange, lime

var generatedColours = getColours();
var surpriseColour = colourArray[generatedColours[0]];
var colourTheSecond = colourArray[generatedColours[1]];
var colourTheThird = colourArray[generatedColours[2]];
var colourTheFourth = colourArray[generatedColours[3]];

function getColours() {
    var generatedColours = new Array();
    while (generatedColours.length < 4) {
        var n = (Math.floor(Math.random() * colourArray.length));
        if ($.inArray(n, generatedColours) == -1)
            generatedColours.push(n);
    }
    return generatedColours;
}

var GraphTraversal = function () {
    var self = this;
    var gw = new GraphWidget();

    var iVL = {};
    var iEL = {};
    var amountVertex = 0;
    var amountEdge = 0;

    this.getGraphWidget = function () {
        return gw;
    }

    fixJSON = function () {
        amountVertex = 0;
        amountEdge = 0;
        for (var key in iVL) amountVertex++;
        for (var key in iEL) amountEdge++;

    }

    takeJSON = function (graph) {
        if (graph == null) return;
        graph = JSON.parse(graph);
        iVL = graph["vl"];
        iEL = graph["el"];
        fixJSON();
    }

    statusChecking = function () {
        $("#draw-status p").html('Draw graph with varying properties then try to run various graph traversal algorithms on it.<br>The default drawing mode is directed graph (each edge has one or at most two arrows).');
    }

    warnChecking = function () {
        var warn = "";
        if (amountVertex >= 10) warn += 'Too much vertex on screen, consider drawing smaller graph. ';
        if (warn == "") $("#draw-warn p").html('No Warning.');
        else $("#draw-warn p").html(warn);
    }

    errorChecking = function () {
        var error = "";
        if (amountVertex == 0) {
            $("#draw-err p").html('Graph cannot be empty. ');
            return;
        }

        if (error == "") $("#draw-err p").html('No Error');
        else $("#draw-err p").html(error);
    }

    var intervalID;

    this.startLoop = function () {
        intervalID = setInterval(function () {
            takeJSON(JSONresult);
            warnChecking();
            errorChecking();
            statusChecking();
        }, 10000);
    }

    this.stopLoop = function () {
        clearInterval(intervalID);
    }

    this.draw = function () {
        if ($("#draw-err p").html() != 'No Error')
            return false;
        if ($("#submit").is(':checked'))
            this.submit(JSONresult);
        if ($("#copy").is(':checked'))
            window.prompt('Copy to clipboard:', JSONresult);

        DIRECTED_GR = true;
        OLD_POSITION = amountEdge;

        graph = createState(iVL, iEL);
        gw.updateGraph(graph, 1000);
        return true;
    }

    this.importjson = function (text) {
        takeJSON(text);
        statusChecking();

        DIRECTED_GR = true;
        OLD_POSITION = amountEdge;

        graph = createState(iVL, iEL);
        gw.updateGraph(graph, 1000);
    }

    var DIRECTED_GR;
    var OLD_POSITION;

    this.directedChange = function () {
        for (var key in iVL) iVL[key]["extratext"] = "";
        if (DIRECTED_GR == true) {
            DIRECTED_GR = false;
            for (var i = 0; i < OLD_POSITION; i++) {
                var ok = false;
                for (var j = 0; j < amountEdge; j++)
                    if (iEL[i]["u"] == iEL[j]["v"] && iEL[i]["v"] == iEL[j]["u"]) {
                        ok = true;
                        break;
                    }
                if (ok == false)
                    iEL[amountEdge++] = {
                        "u": iEL[i]["v"],
                        "v": iEL[i]["u"]
                    }
            }
        }
        else {
            DIRECTED_GR = true;
            for (var i = OLD_POSITION; i < amountEdge; i++)
                delete iEL[i];
            amountEdge = OLD_POSITION;
        }

        var newState = createState(iVL, iEL);
        gw.updateGraph(newState, 1000);
        // $('#directedChange-err').html("Successful")
        //   .delay(1000)
        //   .queue(function(n) {
        //     $(this).html("");
        //   });
        return true;
    }

    this.getGraph = function () {
        return {
            'vl': iVL,
            'el': iEL
        };
    }

    this.getV = function () {
        return amountVertex;
    }

    this.dfs = function (sourceVertex, callback) {
        var vertexHighlighted = {}, edgeHighlighted = {}, vertexTraversed = {}, vertexTraversing = {}, treeEdge = {},
            backEdge = {}, forwardEdge = {}, crossEdge = {};
        var stateList = [];
        var cs;

        // error checks
        if (amountVertex == 0) { // no graph
            $('#dfs-err').html('There is no graph to run this on. Please select an example graph first');
            return false;
        }

        if (sourceVertex >= amountVertex || sourceVertex < 0) { // source vertex not in range
            $('#dfs-err').html('This vertex does not exist in the graph. Please select another source vertex');
            return false;
        }

        var UNVISITED = 0, EXPLORED = 1, VISITED = 2;
        var p = {}, num = {}, Count = 0; // low = {},
        for (var i = 0; i < amountVertex; i++) {
            p[i] = -1;
            num[i] = UNVISITED;
        }
        p[sourceVertex] = -2;
        for (var key in iVL) iVL[key]["extratext"] = "";
        iVL[sourceVertex]["extratext"] = "source";

        function dfsRecur(u) {
            vertexHighlighted[u] = true;
            cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, treeEdge, backEdge, crossEdge, forwardEdge);
            cs["status"] = "DFS(" + u + ")";
            cs["lineNo"] = 1;
            stateList.push(cs);

            delete vertexHighlighted[u];
            vertexTraversing[u] = true;
            num[u] = EXPLORED; // low[u] = ++Count;

            var neighbors = [];
            for (var j = 0; j < amountEdge; j++) if (iEL[j]["u"] == u) neighbors.push(j);
            neighbors.sort(function (a, b) {
                return iEL[a]["v"] - iEL[b]["v"]
            });

            while (neighbors.length > 0) {
                var j = neighbors.shift();
                var u = iEL[j]["u"], v = iEL[j]["v"];
                edgeHighlighted[j] = true;
                for (var key in iEL) if (iEL[key]["u"] == v && iEL[key]["v"] == u) edgeHighlighted[key] = true;
                cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, treeEdge, backEdge, crossEdge, forwardEdge);
                cs["status"] = 'Try edge {u} -> {v}'.replace("{u}", u).replace("{v}", v);
                cs["lineNo"] = 2;
                cs["el"][j]["animateHighlighted"] = true;
                stateList.push(cs);

                for (var key in iVL) delete vertexHighlighted[key];
                for (var key in iEL) delete edgeHighlighted[key];

                if (num[v] == UNVISITED) {
                    vertexTraversing[v] = true;
                    treeEdge[j] = true;
                    for (var key in iEL) if (iEL[key]["u"] == v && iEL[key]["v"] == u) treeEdge[key] = true;
                    cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, treeEdge, backEdge, crossEdge, forwardEdge);
                    cs["lineNo"] = [3];
                    cs["status"] = 'Try edge {u} -> {v}<br>Vertex {v} is unvisited, we have a <font color="red">tree edge</font>.'
                        .replace("{u}", u)
                        .replace("{v}", v);
                    stateList.push(cs);

                    p[v] = u;
                    dfsRecur(v);

                    vertexHighlighted[u] = true;
                    delete vertexHighlighted[v];
                    cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, treeEdge, backEdge, crossEdge, forwardEdge);
                    cs["status"] = 'Finish DFS({v}), backtrack to DFS({u}).'.replace("{u}", u).replace("{v}", v);
                    cs["lineNo"] = 1;
                    stateList.push(cs);
                }
                else if (num[v] == EXPLORED) {
                    if (p[u] != v) {
                        backEdge[j] = true;
                        for (var key in iEL) if (iEL[key]["u"] == v && iEL[key]["v"] == u) backEdge[key] = true;
                    }
                    cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, treeEdge, backEdge, crossEdge, forwardEdge);
                    var thisStatus = 'Try edge {u} -> {v}<br>Vertex {v} is explored, we have a '.replace("{u}", u).replace("{v}", v);
                    if (p[u] == v)
                        thisStatus = thisStatus + '<font color="blue">bidirectional edge</font> (a trivial cycle).';
                    else
                        thisStatus = thisStatus + '<font color="blue">back edge</font> (a true cycle).';
                    cs["status"] = thisStatus;
                    cs["lineNo"] = 4;
                    stateList.push(cs);
                }
                else if (num[v] == VISITED) {
                    forwardEdge[j] = true;
                    for (var key in iEL) if (iEL[key]["u"] == v && iEL[key]["v"] == u) forwardEdge[key] = true;
                    cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, treeEdge, backEdge, crossEdge, forwardEdge);
                    cs["status"] = 'Try edge {u} -> {v}<br>Vertex {v} is visited, we have a <font color="grey">forward/cross edge</font>.'.replace("{u}", u).replace("{v}", v);
                    cs["lineNo"] = 5;
                    stateList.push(cs);
                }
            }
            num[u] = VISITED;
            vertexTraversed[u] = true;
            delete vertexTraversing[u];
        }

        dfsRecur(sourceVertex);

        cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, treeEdge, backEdge, crossEdge, forwardEdge);
        cs["status"] = 'DFS({sourceVertex}) is completed. <font color="red">Red</font>/<font color="grey">grey</font>/<font color="blue">blue</font> edge is <font color="red">tree</font>/<font color="grey">cross/forward</font>/<font color="blue">back</font> edge of the DFS spanning tree, respectively.'.replace("{sourceVertex}", sourceVertex);
        cs["lineNo"] = 0;
        stateList.push(cs);

        populatePseudocode(0);
        gw.startAnimation(stateList, callback);
        return true;
    }

    this.bfs = function (sourceVertex, callback) {
        var notVisited = {}, vertexHighlighted = {}, edgeHighlighted = {}, vertexTraversed = {}, vertexTraversing = {},
            treeEdge = {}, backEdge = {}, forwardEdge = {}, crossEdge = {};
        var stateList = [];
        var key, i, cs;

        // error checks
        if (amountVertex == 0) { // no graph
            $('#bfs-err').html('There is no graph to run this on. Please select an example graph first');
            return false;
        }

        if (sourceVertex >= amountVertex || sourceVertex < 0) { // source vertex not in range
            $('#bfs-err').html('This vertex does not exist in the graph. Please select another source vertex');
            return false;
        }

        var p = {}, d = {};
        for (var i = 0; i < amountVertex; i++) {
            p[i] = -1;
            d[i] = 999;
        }
        d[sourceVertex] = 0;
        for (var key in iVL) iVL[key]["extratext"] = "";
        iVL[sourceVertex]["extratext"] = "source";

        var q = []; //, EdgeProcessed = 0;
        q.push(sourceVertex);
        p[sourceVertex] = -2;
        vertexHighlighted[sourceVertex] = true;
        cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, treeEdge, backEdge, crossEdge, forwardEdge);
        cs["status"] = 'Start from source s = {sourceVertex}.<br>Set Q = {{sourceVertex}}.'.replace("{sourceVertex}", sourceVertex); // d[" + sourceVertex + "] = 0,
        cs["lineNo"] = 1;
        stateList.push(cs);
        delete vertexHighlighted[sourceVertex];

        while (q.length > 0) {
            delete vertexTraversing[q[0]];
            vertexHighlighted[q[0]] = true;
            cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, treeEdge, backEdge, crossEdge, forwardEdge);
            cs["status"] = 'The queue is now {{queue}}.<br>Exploring neighbors of vertex u = {neighbors}.'.replace("{queue}", q).replace("neighbors", q[0]);
            cs["lineNo"] = [2, 3];
            stateList.push(cs);

            var f = q.shift();
            vertexTraversed[f] = true;

            var neighbors = [];
            for (var j = 0; j < amountEdge; j++) if (iEL[j]["u"] == f) neighbors.push(j);
            neighbors.sort(function (a, b) {
                return iEL[a]["v"] - iEL[b]["v"]
            });

            while (neighbors.length > 0) {
                var j = neighbors.shift();
                var u = iEL[j]["u"], v = iEL[j]["v"];
                for (var key in iVL) delete vertexHighlighted[key];
                for (var key in iEL) delete edgeHighlighted[key];
                if (u == f) { // outgoing edge from vertex u
                    //EdgeProcessed++;
                    //var thisStatus = 'relax(' + u + ', ' + v + ', 1), #edge_processed = ' + EdgeProcessed + '.';
                    edgeHighlighted[j] = true;
                    for (var key in iEL) if (iEL[key]["u"] == v && iEL[key]["v"] == u) edgeHighlighted[key] = true;
                    cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, treeEdge, backEdge, crossEdge, forwardEdge);
                    cs["status"] = 'Try edge {u} -> {v}'.replace("{u}", u).replace("{v}", v);
                    cs["lineNo"] = 3;
                    cs["el"][j]["animateHighlighted"] = true;
                    stateList.push(cs);

                    if (d[v] == 999) {
                        d[v] = d[u] + 1;
                        p[v] = u;
                        treeEdge[j] = true;
                        for (var key in iEL) if (iEL[key]["u"] == v && iEL[key]["v"] == u) treeEdge[key] = true;
                        q.push(v);
                        vertexTraversing[v] = true;
                        cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, treeEdge, backEdge, crossEdge, forwardEdge);
                        cs["status"] = 'Try edge {u} -> {v}<br>Vertex {v} is unvisited, we have a <font color="red">tree edge</font>.'.replace("{u}", u).replace("{v}", v);
                        cs["lineNo"] = 4;
                    }
                    else {
                        var grey_it = true;
                        for (var key in iEL) if ((iEL[key]["u"] == v && iEL[key]["v"] == u) && treeEdge[key]) grey_it = false;
                        if (grey_it) {
                            forwardEdge[j] = true; // use grey to signify non-tree edge
                            for (var key in iEL) if (iEL[key]["u"] == v && iEL[key]["v"] == u) forwardEdge[key] = true;
                        }
                        cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, treeEdge, backEdge, crossEdge, forwardEdge);
                        cs["status"] = 'Try edge {u} -> {v}<br>Vertex {v} is explored, we ignore this <font color="grey">non-tree edge</font>.'.replace("{u}", u).replace("{v}", v);
                        cs["lineNo"] = 5;
                    }
                    stateList.push(cs);
                }
            }
            delete vertexHighlighted[u];
        }

        for (var key in iVL) delete vertexHighlighted[key];
        for (var key in iEL) delete edgeHighlighted[key];
        vertexHighlighted[sourceVertex] = true;
        cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, treeEdge, backEdge, crossEdge, forwardEdge);
        cs["status"] = 'BFS({sourceVertex}) is completed. <font color="red">Red</font>/<font color="grey">grey</font> edge is <font color="red">tree</font>/<font color="grey">non-tree</font> edge of the BFS & SSSP spanning tree (for unweighted graph).'.replace("{sourceVertex}", sourceVertex);
        stateList.push(cs);

        populatePseudocode(1);
        gw.startAnimation(stateList, callback);
        return true;
    }

    this.toposortDfs = function (callback) {
        var vertexHighlighted = {}, edgeHighlighted = {}, vertexTraversed = {}, vertexTraversing = {}, treeEdge = {},
            backEdge = {}, forwardEdge = {}, crossEdge = {}, hiddenEdge = {};
        var stateList = [];
        var cs, flag = true;

        // check error
        if (!DIRECTED_GR) {
            // cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, hiddenEdge);
            // cs["status"] = "The input graph is not set as 'directed' graph yet.<br>This algorithm only works with directed graphs.";
            // cs["lineNo"] = 0;
            // stateList.push(cs);

            this.directedChange(); // force change

            // cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, hiddenEdge);
            // cs["status"] = "We turn on the directed graph mode.<br>This action is irreversible.";
            // cs["lineNo"] = 0;
            // stateList.push(cs);

            // $('#topo-err').html("Undirected graph clearly has no topological sort. Give a directed input graph.");
            // return false;
        }

        if (amountVertex == 0) { // no graph
            $('#topo-err').html('There is no graph to run this on. Please select an example graph first');
            return false;
        }

        // main code
        var p = {}, stack = [], stackNum = -1;
        for (var i = 0; i < amountVertex; i++) p[i] = -1
        for (var key in iVL) iVL[key]["extratext"] = "";

        for (var i = 0; i < amountVertex; i++)
            if (p[i] == -1) {
                cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, treeEdge, backEdge, crossEdge, forwardEdge, hiddenEdge);
                cs["status"] = 'Vertex {i} has not been visited.'.replace("{i}", i);
                cs["lineNo"] = 1;
                stateList.push(cs);
                p[i]--;
                Tdfs(i);
            }

        function Tdfs(u) {
            if (flag == false) return;
            vertexTraversing[u] = true;
            vertexHighlighted[u] = true;
            cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, treeEdge, backEdge, crossEdge, forwardEdge, hiddenEdge);
            cs["status"] = "DFS(" + u + ").";
            cs["lineNo"] = 2;
            stateList.push(cs);
            delete vertexHighlighted[u];

            var neighbors = [];
            for (var j = 0; j < amountEdge; j++) if (iEL[j]["u"] == u) neighbors.push(j);
            neighbors.sort(function (a, b) {
                return iEL[a]["v"] - iEL[b]["v"]
            });

            while (neighbors.length > 0) {
                var j = neighbors.shift();
                var vertexA = iEL[j]["u"], vertexB = iEL[j]["v"];
                if (u == vertexA) {
                    edgeHighlighted[j] = true;
                    cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, treeEdge, backEdge, crossEdge, forwardEdge, hiddenEdge);
                    cs["status"] = 'Try edge {vertexA} -> {vertexB}.<br>List = [{stack}].'.replace("{vertexA}", vertexA).replace("{vertexB}", vertexB).replace("{stack}", stack);
                    cs["lineNo"] = 3;
                    cs["el"][j]["animateHighlighted"] = true;
                    stateList.push(cs);

                    if (p[vertexB] == -1) {
                        cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, treeEdge, backEdge, crossEdge, forwardEdge, hiddenEdge);
                        cs["status"] = 'Vertex {vertexB} has not been visited, continue.<br>List = [{stack}].'.replace("{vertexB}", vertexB).replace("{stack}", stack);
                        cs["lineNo"] = 4;
                        stateList.push(cs);

                        p[vertexB] = u;
                        Tdfs(vertexB);
                    }
                    else {
                        var k = u;
                        while (k != -2) {
                            k = p[k];
                            if (k == vertexB) flag = false;
                        }
                        cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, treeEdge, backEdge, crossEdge, forwardEdge, hiddenEdge);
                        cs["status"] = 'Vertex {vertexB} has been visited, ignore this edge.<br>List = [{stack}].'.replace("{vertexB}", vertexB).replace("{stack}", stack);
                        cs["lineNo"] = 5;
                        stateList.push(cs);
                    }
                }
            }
            stack.push(u);
            delete vertexTraversing[u];
            vertexTraversed[u] = true;
            cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, treeEdge, backEdge, crossEdge, forwardEdge, hiddenEdge);
            cs["status"] = 'DFS({u}) is completed, add {u} to the back of the list.<br>List = [{stack}].'.replace("{u}", u).replace("{stack}", stack);
            cs["lineNo"] = 7;
            stateList.push(cs);
        }

        if (flag == false) { // not DAG
            $('#topo-err').html('This graph is not a DAG, unable to perform Topological Sort.');
            return false;
        }
        vertexHighlighted = {}, edgeHighlighted = {};
        vertexTraversed = {}, vertexTraversing = {}, treeEdge = {}, backEdge = {}, forwardEdge = {}, crossEdge = {}, hiddenEdge = {};
        stack.reverse();
        for (var key in stack) iVL[stack[key]]["extratext"] = key;
        cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, treeEdge, backEdge, crossEdge, forwardEdge, hiddenEdge);
        cs["status"] = 'Topological Sort is completed after reversing the list.<br>List = [{stack}], also see the <font color="red">red</font> indices above.'.replace("{stack}", stack);
        cs["lineNo"] = 0;
        stateList.push(cs);

        populatePseudocode(2);
        gw.startAnimation(stateList, callback);
        return true;
    }

    this.toposortBfs = function (callback) {
        var vertexHighlighted = {}, edgeHighlighted = {}, vertexTraversed = {}, vertexTraversing = {}, treeEdge = {},
            backEdge = {}, forwardEdge = {}, crossEdge = {}, hiddenEdge = {};
        var stateList = [];
        var cs, key;

        // error checks
        if (amountVertex == 0) { // no graph
            $('#topo-err').html('There is no graph to run this on. Please select an example graph first');
            return false;
        }

        if (!DIRECTED_GR) {
            this.directedChange(); // force change
            // $('#topo-err').html("Undirected graph clearly has no topological sort. Give a directed input graph.");
            // return false;
        }

        var fr = {}, cc = {};
        for (var i = 0; i < amountVertex; i++)
            fr[i] = true, cc[i] = 0;
        for (var j = 0; j < amountEdge; j++)
            cc[iEL[j]["v"]]++;

        for (key in iVL)
            iVL[key]["state"] = VERTEX_DEFAULT, iVL[key]["extratext"] = "";

        var q = [], EdgeProcessed = 0, Lis = [];
        for (var i = 0; i < amountVertex; i++)
            if (cc[i] == 0)
                q.push(i), vertexHighlighted[i] = vertexTraversing[i] = true;
        cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, treeEdge, backEdge, crossEdge, forwardEdge);
        cs["status"] = 'Queue = [{queue}].'.replace("{queue}", q);
        cs["lineNo"] = 1;
        stateList.push(cs);
        for (var i = 0; i < amountVertex; i++)
            if (cc[i] == 0)
                delete vertexHighlighted[i];

        while (q.length > 0) {
            cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, treeEdge, backEdge, crossEdge, forwardEdge, hiddenEdge);
            cs["status"] = 'Queue = [{queue}].'.replace("{queue}", q);
            cs["lineNo"] = 2;
            stateList.push(cs);

            var u = q.shift(); // front most item
            Lis.push(u);
            vertexHighlighted[u] = true;
            cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, treeEdge, backEdge, crossEdge, forwardEdge, hiddenEdge);
            cs["status"] = 'Pop vertex {u} from queue and add it to the back of the list.<br>List = [{Lis}].'.replace("{u}", u).replace("{Lis}", Lis);
            cs["lineNo"] = 3;
            stateList.push(cs);

            var neighbors = [];
            for (var j = 0; j < amountEdge; j++) if (iEL[j]["u"] == u) neighbors.push(j);
            neighbors.sort(function (a, b) {
                return iEL[a]["v"] - iEL[b]["v"]
            });

            while (neighbors.length > 0) {
                var j = neighbors.shift();
                var vertexA = iEL[j]["u"], vertexB = iEL[j]["v"];
                cc[vertexB]--;

                hiddenEdge[j] = true;
                var thisStatus = 'Queue = [{queue}].<br>Delete edge {vertexA} -> {vertexB}.'.replace("{queue}", q).replace("{vertexA}", vertexA).replace("{vertexB}", vertexB);
                cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, treeEdge, backEdge, crossEdge, forwardEdge, hiddenEdge);
                cs["status"] = thisStatus;
                cs["lineNo"] = [4, 5];
                cs["el"][j]["animateHighlighted"] = true;
                stateList.push(cs);

                if (cc[vertexB] == 0) {
                    q.push(vertexB);
                    vertexTraversing[vertexB] = true;
                    cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, treeEdge, backEdge, crossEdge, forwardEdge, hiddenEdge);
                    cs["status"] = 'Queue = [{queue}].<br>Vertex {vertexB} now has no incoming edge, add it to queue.'.replace("{queue}", q).replace("vertexB", vertexB);
                    cs["lineNo"] = 6;
                    stateList.push(cs);
                }
                else {
                    cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, treeEdge, backEdge, crossEdge, forwardEdge, hiddenEdge);
                    cs["status"] = 'Queue = [{queue}]<br>Vertex {vertexB} still has incoming edge, ignore it.'.replace("{queue}", q).replace("vertexB", vertexB);
                    cs["lineNo"] = 6;
                    stateList.push(cs);
                }
            }
            delete vertexHighlighted[u];
            delete vertexTraversing[u];
            vertexTraversed[u] = true;
        }

        var thisStatus = 'Kahn&#39;s algorithm is completed.<br>';
        var flag = true;
        for (var j = 0; j < amountEdge; j++)
            if (hiddenEdge[j] == null) {
                flag = false;
                $('#topo-err').html('This graph is not a DAG, unable to perform Topological Sort.');
                return false;
                // thisStatus += "Edge " + iEL[j]["u"] + "->" + iEL[j]["v"] + " has not been visited, the graph has cycle."
                // break;
            }
        if (flag)
            thisStatus += 'Topological order = [{Lis}]'.replace("{Lis}", Lis);
        for (var key in Lis) iVL[Lis[key]]["extratext"] = key;
        cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, treeEdge, backEdge, crossEdge, forwardEdge, hiddenEdge);
        cs["lineNo"] = 7;
        cs["status"] = thisStatus;
        stateList.push(cs);

        populatePseudocode(3);
        gw.startAnimation(stateList, callback);
        return true;
    }

    this.bipartiteDfs = function (callback) {
        var p = {}, vertexHighlighted = {}, edgeHighlighted = {}, vertexTraversed = {}, vertexTraversing = {};
        var stateList = [];
        var key, cs, flag = false;

        // error checks
        if (amountVertex == 0) { // no graph
            $('#bipartite-err').html('There is no graph to run this on. Please select an example graph first');
            return false;
        }

        if (DIRECTED_GR) {
            cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing);
            cs["status"] = "The input graph is not set as 'undirected' graph yet.<br>Bipartite Graph is usually only defined for undirected graphs.";
            cs["lineNo"] = 0;
            stateList.push(cs);

            this.directedChange(); // force change

            cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing);
            cs["status"] = "We add bidirectional edges as necessary and hide the arrows.<br>This action is irreversible (you may have to redraw your graph again).";
            cs["lineNo"] = 0;
            stateList.push(cs);

            // $('#bipartite-err').html("Bipartite graph is only defined for undirected graph. Please make the graph undirected.");
            // return false;
        }

        for (var key in iVL) {
            p[key] = -1;
            iVL[key]["extratext"] = "";
        }
        for (var i = 0; i < amountVertex; i++)
            if (p[i] == -1) {
                vertexTraversed[i] = true;
                cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing);
                cs["status"] = "Vertex " + i + " is unvisited.";
                cs["lineNo"] = 1;
                if (vertexTraversed[i] != null) cs["vl"][i]["state"] = VERTEX_HIGHLIGHTED;
                else cs["vl"][i]["state"] = VERTEX_BLUE_FILL;
                stateList.push(cs);
                p[i] = -2;
                dfsRecur(i);
                if (flag) break;
            }

        function dfsRecur(u) {
            if (flag) return;
            cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing);
            cs["status"] = "DFS(" + u + ").";
            cs["lineNo"] = 2;
            if (vertexTraversed[u] != null) cs["vl"][u]["state"] = VERTEX_HIGHLIGHTED;
            else cs["vl"][u]["state"] = VERTEX_BLUE_FILL;
            stateList.push(cs);

            var neighbors = [];
            for (var j = 0; j < amountEdge; j++) if (iEL[j]["u"] == u) neighbors.push(j);
            neighbors.sort(function (a, b) {
                return iEL[a]["v"] - iEL[b]["v"]
            });

            while (neighbors.length > 0) {
                var j = neighbors.shift();
                var vertexA = iEL[j]["u"], vertexB = iEL[j]["v"];
                if (edgeHighlighted[j] == null) {
                    if (u == vertexA) {
                        edgeHighlighted[j] = true;
                        cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing);
                        cs["status"] = "Try edge " + u + " &rarr; " + vertexB + ".";
                        cs["lineNo"] = 3;
                        if (vertexTraversed[u] != null) cs["vl"][u]["state"] = VERTEX_HIGHLIGHTED;
                        else cs["vl"][u]["state"] = VERTEX_BLUE_FILL;
                        cs["el"][j]["animateHighlighted"] = true;
                        stateList.push(cs);

                        if (p[vertexB] == -1) {
                            if (vertexTraversed[u] == null) vertexTraversed[vertexB] = true;
                            else vertexTraversing[vertexB] = true;
                            p[vertexB] = u;
                            cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing);
                            cs["status"] = "Try edge " + u + " &rarr; " + vertexB + ".<br>Give vertex " + vertexB + " different color from vertex " + u + ".";
                            cs["lineNo"] = 4;
                            if (vertexTraversed[u] != null) cs["vl"][u]["state"] = VERTEX_HIGHLIGHTED;
                            else cs["vl"][u]["state"] = VERTEX_BLUE_FILL;
                            stateList.push(cs);
                            dfsRecur(vertexB);
                        }
                        else {
                            var cu = 0, cv = 0;
                            if (vertexTraversing[u] != null) cu = 1;
                            if (vertexTraversing[vertexB] != null) cv = 1;
                            if (cu == cv) {
                                flag = true;
                                cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing);
                                cs["status"] = "Vertex " + u + " and vertex " + vertexB + " have the same color.";
                                cs["lineNo"] = 5;
                                if (vertexTraversed[u] != null) cs["vl"][u]["state"] = VERTEX_HIGHLIGHTED;
                                else cs["vl"][u]["state"] = VERTEX_BLUE_FILL;
                                if (vertexTraversed[vertexB] != null) cs["vl"][vertexB]["state"] = VERTEX_HIGHLIGHTED;
                                else cs["vl"][vertexB]["state"] = VERTEX_BLUE_FILL;
                                stateList.push(cs);
                                break;
                            }
                        }
                        if (flag) break;
                    }
                    if (flag) break;
                }
                else {
                    cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing);
                    cs["status"] = "Try edge " + vertexA + " &rarr; " + vertexB + ".<br>Vertex " + vertexA + " and vertex " + vertexB + " (already visited) have different color, continue.";
                    cs["lineNo"] = 5;
                    stateList.push(cs);
                }
            }
            if (flag) return;
            cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing);
            cs["status"] = "Finish DFS(" + u + ")<br>Back to the parent.";
            cs["lineNo"] = 2;
            if (vertexTraversed[u] != null) cs["vl"][u]["state"] = VERTEX_HIGHLIGHTED;
            else cs["vl"][u]["state"] = VERTEX_BLUE_FILL;
            stateList.push(cs);
        }

        cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing);
        if (flag == false) cs["status"] = "This is a bipartite graph!";
        else cs["status"] = "This is NOT a bipartite graph!";
        cs["lineNo"] = 0;
        if (flag == true) cs["lineNo"] = 6;
        stateList.push(cs);

        populatePseudocode(4);
        gw.startAnimation(stateList, callback);
        return true;
    }

    this.bipartiteBfs = function (callback) {
        var p = {}, vertexHighlighted = {}, edgeHighlighted = {}, vertexTraversed = {}, vertexTraversing = {};
        var stateList = [];
        var key, cs, flag = true;

        // error checks
        if (amountVertex == 0) { // no graph
            $('#bipartite-err').html('There is no graph to run this on. Please select an example graph first');
            return false;
        }

        if (DIRECTED_GR) {
            cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing);
            cs["status"] = "The input graph is not set as 'undirected' graph yet.<br>Bipartite Graph is usually only defined for undirected graphs.";
            cs["lineNo"] = 0;
            stateList.push(cs);

            this.directedChange(); // force change

            cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing);
            cs["status"] = "We add bidirectional edges as necessary and hide the arrows.<br>This action is irreversible (you may have to redraw your graph again).";
            cs["lineNo"] = 0;
            stateList.push(cs);

            // $('#bipartite-err').html("Bipartite graph is only defined for undirected graph. Please make the graph undirected.");
            // return false;
        }

        for (key in iVL) {
            p[key] = -1;
            iVL[key]["state"] = VERTEX_DEFAULT;
            iVL[key]["extratext"] = "";
        }

        for (var s = 0; s < amountVertex; s++)
            if (p[s] == -1) {
                p[s] = -2;
                vertexTraversed[s] = true;
                cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing);
                cs["status"] = 'Vertex ' + s + ' is unvisited.';
                cs["lineNo"] = 1;
                if (vertexTraversed[s] != null) cs["vl"][s]["state"] = VERTEX_HIGHLIGHTED;
                else cs["vl"][s]["state"] = VERTEX_BLUE_FILL;
                stateList.push(cs);

                var q = [];
                q.push(s);
                cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing);
                cs["status"] = "Queue = [" + q + "].";
                cs["lineNo"] = 2;
                stateList.push(cs);

                while (q.length > 0) {
                    var u = q.shift();

                    cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing);
                    cs["status"] = "Extract " + u + " from queue.";
                    cs["lineNo"] = 3;
                    if (vertexTraversed[u] != null) cs["vl"][u]["state"] = VERTEX_HIGHLIGHTED;
                    else cs["vl"][u]["state"] = VERTEX_BLUE_FILL;
                    stateList.push(cs);

                    var neighbors = [];
                    for (var j = 0; j < amountEdge; j++) if (iEL[j]["u"] == u) neighbors.push(j);
                    neighbors.sort(function (a, b) {
                        return iEL[a]["v"] - iEL[b]["v"]
                    });

                    while (neighbors.length > 0) {
                        var j = neighbors.shift();
                        var vertexA = iEL[j]["u"], vertexB = iEL[j]["v"];
                        if (edgeHighlighted[j] == null) {
                            if (u == vertexA) {
                                edgeHighlighted[j] = true;
                                cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing);
                                cs["status"] = "Queue = [" + q + "].<br>Try edge " + vertexA + " &rarr; " + vertexB + ".";
                                cs["lineNo"] = 4;
                                if (vertexTraversed[u] != null) cs["vl"][u]["state"] = VERTEX_HIGHLIGHTED;
                                else cs["vl"][u]["state"] = VERTEX_BLUE_FILL;
                                cs["el"][j]["animateHighlighted"] = true;
                                stateList.push(cs);

                                if (p[vertexB] == -1) {
                                    p[vertexB] = vertexA;
                                    q.push(vertexB);
                                    if (vertexTraversed[u] != null) vertexTraversing[vertexB] = true;
                                    else vertexTraversed[vertexB] = true;

                                    cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing);
                                    cs["status"] = "Queue = [" + q + "].<br>Vertex " + vertexB + " is free, assign another color and push it to queue.";
                                    cs["lineNo"] = 6;
                                    if (vertexTraversed[u] != null) cs["vl"][u]["state"] = VERTEX_HIGHLIGHTED;
                                    else cs["vl"][u]["state"] = VERTEX_BLUE_FILL;
                                    stateList.push(cs);
                                }
                                else {
                                    var cu = 0, cv = 0;
                                    if (vertexTraversing[u] != null) cu = 1;
                                    if (vertexTraversing[vertexB] != null) cv = 1;
                                    if (cu == cv) {
                                        flag = false;
                                        cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing);
                                        cs["status"] = "Vertex " + u + " and vertex " + vertexB + " have the same color.<br>This is NOT a bipartite graph!";
                                        cs["lineNo"] = 5;
                                        if (vertexTraversed[u] != null) cs["vl"][u]["state"] = VERTEX_HIGHLIGHTED;
                                        else cs["vl"][u]["state"] = VERTEX_BLUE_FILL;
                                        if (vertexTraversed[vertexB] != null) cs["vl"][vertexB]["state"] = VERTEX_HIGHLIGHTED;
                                        else cs["vl"][vertexB]["state"] = VERTEX_BLUE_FILL;
                                        stateList.push(cs);
                                        break;
                                    }
                                }
                                if (flag == false) break;
                            }
                            if (flag == false) break;
                        }
                        else {
                            cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing);
                            cs["status"] = "Try edge " + vertexA + " &rarr; " + vertexB + ".<br>Vertex " + vertexA + " and vertex " + vertexB + " (already visited) have different color, continue.";
                            cs["lineNo"] = 5;
                            stateList.push(cs);
                        }
                        if (flag == false) break;
                    }
                    if (flag == false) break;
                }
                if (flag == false) break;
            }

        if (flag) {
            cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing);
            cs["status"] = "This is a bipartite graph!";
            cs["lineNo"] = 0;
            stateList.push(cs);
        }

        populatePseudocode(5);
        gw.startAnimation(stateList, callback);
        return true;
    }

    this.bridge = function (callback) {
        var vertexHighlighted = {}, edgeHighlighted = {}, vertexTraversed = {}, vertexTraversing = {}, bridge = {},
            articulationPoint = {};
        var stateList = [];
        var cs;

        // check error
        if (amountVertex == 0) { // no graph
            $('#bridge-err').html('There is no graph to run this on. Please select an example graph first');
            return false;
        }

        if (DIRECTED_GR) {
            cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, {});
            cs["status"] = "The input graph is not set as 'undirected' graph yet.<br>This algorithm only works with undirected graphs.";
            cs["lineNo"] = 0;
            stateList.push(cs);

            this.directedChange(); // force change

            cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, {});
            cs["status"] = "We add bidirectional edges as necessary and hide the arrows.<br>This action is irreversible (you may have to redraw your graph again).";
            cs["lineNo"] = 0;
            stateList.push(cs);
            //$('#bridge-err').html("This algorithm can only work for undirected graph.");
            //return false;
        }

        // main code
        var p = {}, stack = {}, stackNum = -1, Count = -1, low = {}, num = {}, lab = {}, labNum = 0;
        var ROOT, chilNum = {};
        for (var i = 0; i < amountVertex; i++) {
            p[i] = lab[i] = -1, chilNum[i] = 0;
            iVL[i]["extratext"] = "N/A";
        }

        function highlightArticulationPointsAndBridges() {
            for (var key in bridge) {
                cs["el"][key]["state"] = EDGE_GREEN;
                for (var z = 0; z < amountEdge; z++)
                    if (iEL[z]["u"] == iEL[key]["v"] && iEL[z]["v"] == iEL[key]["u"])
                        cs["el"][z]["state"] = EDGE_GREEN;
            }
            for (var key in articulationPoint) cs["vl"][key]["state"] = VERTEX_GREEN_OUTLINE;
        }

        for (var i = 0; i < amountVertex; i++)
            if (p[i] == -1) {
                cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, {});
                cs["status"] = "Vertex " + i + " has not been visited.<br>DFSCount = " + Count + ".";
                cs["lineNo"] = 1;
                highlightArticulationPointsAndBridges();
                stateList.push(cs);
                p[i]--;
                ROOT = i;
                Tdfs(i);
            }

        function Tdfs(u) {
            stack[++stackNum] = u;
            num[u] = low[u] = ++Count;
            iVL[u]["extratext"] = "" + num[u] + "," + low[u];
            vertexTraversing[u] = true;
            vertexHighlighted[u] = true;
            cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, {});
            cs["status"] = "DFS(" + u + ").<br>DFSCount = " + Count + ".";
            cs["lineNo"] = 2;
            highlightArticulationPointsAndBridges();
            stateList.push(cs);
            delete vertexHighlighted[u];

            var neighbors = [];
            for (var j = 0; j < amountEdge; j++) if (iEL[j]["u"] == u) neighbors.push(j);
            neighbors.sort(function (a, b) {
                return iEL[a]["v"] - iEL[b]["v"]
            });

            while (neighbors.length > 0) {
                var j = neighbors.shift();
                var vertexA = iEL[j]["u"], vertexB = iEL[j]["v"];
                if (lab[vertexB] == -1 && u == vertexA) {
                    edgeHighlighted[j] = true;
                    for (var z = 0; z < amountEdge; z++)
                        if (iEL[z]["u"] == vertexB && iEL[z]["v"] == vertexA)
                            edgeHighlighted[z] = true;
                    cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, {});
                    cs["status"] = "Try edge " + vertexA + " -> " + vertexB + "<br>DFSCount = " + Count + ".";
                    cs["lineNo"] = 3;
                    cs["el"][j]["animateHighlighted"] = true;
                    highlightArticulationPointsAndBridges();
                    stateList.push(cs);

                    if (p[vertexB] == -1) {
                        vertexTraversing[vertexB] = true;
                        cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, {});
                        cs["status"] = "" + vertexB + " has not been visited<br>DFSCount = " + Count + ".";
                        cs["lineNo"] = 4;
                        highlightArticulationPointsAndBridges();
                        stateList.push(cs);

                        p[vertexB] = u;
                        Tdfs(vertexB);
                        chilNum[u]++;
                        var thisStatus = "low[" + u + "] is unchanged.";
                        if (low[u] > low[vertexB]) {
                            low[u] = low[vertexB];
                            thisStatus = "update low[" + u + "] from low[" + vertexB + "].<br>There is <b>another</b> path to go from vertex " + u + " to vertex with num " + low[u] + ".";
                        }
                        iVL[u]["extratext"] = "" + num[u] + "," + low[u];

                        cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, {});
                        cs["status"] = thisStatus;
                        cs["lineNo"] = 5;
                        highlightArticulationPointsAndBridges();
                        stateList.push(cs);

                        var thisStatus = "";
                        if (low[vertexB] >= num[u] && u != ROOT) {
                            thisStatus = thisStatus + "low[" + vertexB + "] >= num[" + u + "] and " + u + " is not the root, vertex " + u + " is a cut vertex.<br>";
                            articulationPoint[u] = true;
                        }
                        else if (low[vertexB] >= num[u] && u == ROOT)
                            thisStatus = thisStatus + "low[" + vertexB + "] >= num[" + u + "] but " + u + " is the root, so it is not a cut vertex.<br>";
                        else
                            thisStatus = thisStatus + "low[" + vertexB + "] < num[" + u + "], so " + u + " is not a cut vertex.<br>";

                        if (low[vertexB] > num[u]) {
                            thisStatus = thisStatus + "low[" + vertexB + "] > num[" + u + "], so edge (" + u + ", " + vertexB + ") is a bridge.";
                            bridge[j] = true;
                        }
                        else
                            thisStatus = thisStatus + "low[" + vertexB + "] <= num[" + u + "], so edge (" + u + ", " + vertexB + ") is not a bridge.";

                        cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, {});
                        cs["status"] = thisStatus;
                        cs["lineNo"] = 6;
                        highlightArticulationPointsAndBridges();
                        stateList.push(cs);
                    }
                    else if (vertexB != p[u]) {
                        var thisStatus = "low[" + u + "] is unchanged.";
                        if (low[u] > num[vertexB]) {
                            low[u] = num[vertexB];
                            thisStatus = "update low[" + u + "] from num[" + vertexB + "].<br>There is <b>another</b> path to go from vertex " + u + " to vertex with num " + low[u] + ".";
                        }
                        iVL[u]["extratext"] = "" + num[u] + "," + low[u];
                        cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, {});
                        cs["status"] = "" + vertexB + " is visited, " + thisStatus; // update low[" + u + "] from num[" + vertexB + "]<br>DFSCount = " + Count + ".";
                        cs["lineNo"] = 7;
                        highlightArticulationPointsAndBridges();
                        stateList.push(cs);
                    }
                    else {
                        cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, {});
                        cs["status"] = "" + vertexB + " is the parent of " + u + ", ignore!<br>DFSCount = " + Count + ".";
                        cs["lineNo"] = 7;
                        highlightArticulationPointsAndBridges();
                        stateList.push(cs);
                    }
                }
            }

            delete vertexTraversing[u];
            vertexHighlighted[u] = true;
            vertexTraversed[u] = true;
            cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, {});
            cs["status"] = "Finish DFS(" + u + "), backtrack.<br>DFSCount = " + Count + ".";
            if (u == ROOT && chilNum[u] >= 2) {
                cs["status"] = "Finish DFS(" + u + "), " + u + " is the root and u has more than 1 childs<br>Hence " + u + " is an articulation point.";
                articulationPoint[u] = true;
            }
            cs["lineNo"] = 0;
            highlightArticulationPointsAndBridges();
            cs["vl"][u]["state"] = VERTEX_HIGHLIGHTED;
            stateList.push(cs);
            delete vertexHighlighted[u];
        }

        cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, {});
        cs["status"] = "Finished.<br>Green vertices/edges are articulation points/bridges, respectively.";
        cs["lineNo"] = 0;
        highlightArticulationPointsAndBridges();
        stateList.push(cs);

        populatePseudocode(6);
        gw.startAnimation(stateList, callback);
        for (var key in iVL) iVL[key]["extratext"] = "";
        return true;
    }

    this.kosaraju = function (callback) {
        var vertexHighlighted = {}, edgeHighlighted = {}, vertexTraversed = {}, vertexTraversing = {}, hiddenEdge = {};
        var stateList = [];
        var cs;

        // check error
        if (amountVertex == 0) { // no graph
            $('#scc-err').html('There is no graph to run this on. Please select an example graph first');
            return false;
        }

        if (!DIRECTED_GR) {
            cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, hiddenEdge);
            cs["status"] = "The input graph is not set as 'directed' graph yet.<br>This algorithm only works with directed graphs.";
            cs["lineNo"] = 0;
            stateList.push(cs);

            this.directedChange(); // force change

            cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, hiddenEdge);
            cs["status"] = "We turn on the directed graph mode.<br>This action is irreversible.";
            cs["lineNo"] = 0;
            stateList.push(cs);

            // $('#scc-err').html("Please make the graph directed");
            // return false;
        }

        // main code
        var p = {}, stack = {}, stackNum = -1, Count = 0, low = {}, num = {}, lab = {}, labNum = 0;
        for (var i = 0; i < amountVertex; i++) {
            p[i] = lab[i] = -1;
            iVL[i]["extratext"] = "";
        }
        for (var i = 0; i < amountVertex; i++)
            if (p[i] == -1) {
                cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, hiddenEdge);
                cs["status"] = "Vertex " + i + " has not been visited.";
                cs["lineNo"] = 1;
                stateList.push(cs);
                p[i]--;
                Tdfs(i);
            }

        vertexHighlighted = {}, edgeHighlighted = {};
        vertexTraversed = {}, vertexTraversing = {};
        for (var j = 0; j < amountEdge; j++) { // reverse edge directions
            var vertexA = iEL[j]["u"];
            var vertexB = iEL[j]["v"];
            iEL[j]["u"] = vertexB;
            iEL[j]["v"] = vertexA;
        }
        cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, hiddenEdge);
        cs["status"] = "Then, we transpose the directed graph.";
        cs["lineNo"] = 4;
        stateList.push(cs);

        while (stackNum >= 0) {
            if (lab[stack[stackNum]] == -1) {
                labNum++;
                DFS2(stack[stackNum]);
                for (var j = 0; j < amountEdge; j++) {
                    var vertexA = iEL[j]["u"], vertexB = iEL[j]["v"];
                    if (lab[vertexA] != lab[vertexB]) hiddenEdge[j] = true;
                }

                cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, hiddenEdge);
                cs["status"] = getStack() + ".<br>Finish DFS(" + stack[stackNum] + ") and we get 1 Strongly Connected Component.";
                cs["lineNo"] = 7;
                stateList.push(cs);
            }
            else {
                cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, hiddenEdge);
                cs["status"] = getStack() + ".<br>" + stack[stackNum] + " is visited, ignore.";
                cs["lineNo"] = 5;
                stateList.push(cs);
            }
            stackNum--;
        }

        function getStack() {
            var status = "List = [";
            for (var i = stackNum; i > 0; i--) status = status + stack[i] + ",";
            if (stackNum >= 0) status += stack[0] + "]";
            else status += "]";
            return status;
        }

        function Tdfs(u) {
            vertexTraversing[u] = true;
            vertexHighlighted[u] = true;
            cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, hiddenEdge);
            cs["status"] = getStack() + ".<br>DFS(" + u + ").";
            cs["lineNo"] = 1;
            stateList.push(cs);
            delete vertexHighlighted[u];

            var neighbors = [];
            for (var j = 0; j < amountEdge; j++) if (iEL[j]["u"] == u) neighbors.push(j);
            neighbors.sort(function (a, b) {
                return iEL[a]["v"] - iEL[b]["v"]
            });

            while (neighbors.length > 0) {
                var j = neighbors.shift();
                var vertexA = iEL[j]["u"], vertexB = iEL[j]["v"];
                if (lab[vertexB] == -1 && u == vertexA) {
                    edgeHighlighted[j] = true;
                    for (var key in iEL) if (iEL[key]["v"] == vertexA && iEL[key]["u"] == vertexB) edgeHighlighted[key] = true;
                    cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, hiddenEdge);
                    cs["status"] = getStack() + ".<br>Try edge " + vertexA + " &rarr; " + vertexB + ".";
                    cs["lineNo"] = 2;
                    cs["el"][j]["animateHighlighted"] = true;
                    stateList.push(cs);

                    if (p[vertexB] == -1) {
                        cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, hiddenEdge);
                        cs["status"] = getStack() + ".<br>Vertex " + vertexB + " has not been visited.";
                        cs["lineNo"] = 2;
                        stateList.push(cs);

                        p[vertexB] = u;
                        Tdfs(vertexB);
                    }
                }
            }

            stack[++stackNum] = u;
            delete vertexTraversing[u];
            vertexTraversed[u] = true;
            cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, hiddenEdge);
            cs["status"] = getStack() + ".<br>DFS(" + u + ") is completed, add " + u + " to the front of the list.";
            cs["lineNo"] = 3;
            stateList.push(cs);
        }

        function DFS2(u) {
            lab[u] = labNum;
            vertexTraversing[u] = true;
            vertexHighlighted[u] = true;
            cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, hiddenEdge);
            cs["status"] = getStack() + "<br>DFS(" + u + ").";
            cs["lineNo"] = 5;
            stateList.push(cs);
            delete vertexHighlighted[u];

            var neighbors = [];
            for (var j = 0; j < amountEdge; j++) if (iEL[j]["u"] == u) neighbors.push(j);
            neighbors.sort(function (a, b) {
                return iEL[a]["v"] - iEL[b]["v"]
            });

            while (neighbors.length > 0) {
                var j = neighbors.shift();
                var vertexA = iEL[j]["u"], vertexB = iEL[j]["v"];
                if (hiddenEdge[j] == null) {
                    edgeHighlighted[j] = true;
                    cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, hiddenEdge);
                    cs["status"] = getStack() + ".<br>Try edge " + vertexA + " &rarr; " + vertexB + ".";
                    cs["lineNo"] = 6;
                    cs["el"][j]["animateHighlighted"] = true;
                    stateList.push(cs);

                    if (lab[vertexB] == -1) {
                        cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, hiddenEdge);
                        cs["status"] = getStack() + "<br>Vertex " + vertexB + " has not been visited.";
                        cs["lineNo"] = 6;
                        stateList.push(cs);

                        DFS2(vertexB);
                    }
                    else {
                        cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, hiddenEdge);
                        cs["status"] = getStack() + "<br>" + vertexB + " is visited";
                        cs["lineNo"] = 6;
                        stateList.push(cs);
                    }
                }
            }

            delete vertexTraversing[u];
            vertexTraversed[u] = true;
            cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, hiddenEdge);
            cs["status"] = getStack() + "<br>DFS from " + u + " is completed, back to the parent";
            cs["lineNo"] = 5;
            stateList.push(cs);
        }

        for (var i = 0; i < amountEdge; i++) {
            var vertexA = iEL[i]["u"];
            var vertexB = iEL[i]["v"];
            iEL[i]["u"] = vertexB;
            iEL[i]["v"] = vertexA;
        }
        cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, hiddenEdge);
        cs["status"] = "We transpose the directed graph again.<br>In total, we have " + labNum + " Strongly Connected Component(s) as seen above.";
        cs["lineNo"] = 0;
        stateList.push(cs);

        populatePseudocode(7);
        gw.startAnimation(stateList, callback);
        return true;
    }

    this.tarjan = function (callback) {
        var vertexHighlighted = {}, edgeHighlighted = {}, vertexTraversed = {}, vertexTraversing = {}, hiddenEdge = {};
        var stateList = [];
        var cs;

        //check error
        if (amountVertex == 0) { // no graph
            $('#scc-err').html('There is no graph to run this on. Please select an example graph first');
            return false;
        }

        if (!DIRECTED_GR) {
            cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, hiddenEdge);
            cs["status"] = "The input graph is not set as 'directed' graph yet.<br>This algorithm only works with directed graphs.";
            cs["lineNo"] = 0;
            stateList.push(cs);

            this.directedChange(); // force change

            cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, hiddenEdge);
            cs["status"] = "We turn on the directed graph mode.<br>This action is irreversible.";
            cs["lineNo"] = 0;
            stateList.push(cs);

            // $('#scc-err').html("Please make the graph directed");
            // return false;
        }

        // main code
        var p = {}, stack = {}, stackNum = -1, Count = -1, low = {}, num = {}, lab = {}, labNum = 0;
        for (var i = 0; i < amountVertex; i++) {
            p[i] = lab[i] = -1
            iVL[i]["extratext"] = "N/A";
        }
        for (var i = 0; i < amountVertex; i++)
            if (p[i] == -1) {
                cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, hiddenEdge);
                cs["status"] = "Vertex " + i + " has not been visited.";
                cs["lineNo"] = 1;
                stateList.push(cs);
                p[i]--;
                Tdfs(i);
            }

        function getStack() {
            var status = "Stack = [";
            for (var i = 0; i < stackNum; i++) status = status + stack[i] + ",";
            if (stackNum >= 0) status += stack[stackNum] + "]";
            else status += "]";
            return status;
        }

        function Tdfs(u) {
            stack[++stackNum] = u;
            num[u] = low[u] = ++Count;
            iVL[u]["extratext"] = "" + num[u] + "," + low[u];
            vertexTraversing[u] = true;
            vertexHighlighted[u] = true;
            cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, hiddenEdge);
            cs["status"] = getStack() + ".<br>DFS(" + u + ").";
            cs["lineNo"] = 2;
            stateList.push(cs);
            delete vertexHighlighted[u];

            var neighbors = [];
            for (var j = 0; j < amountEdge; j++) if (iEL[j]["u"] == u) neighbors.push(j);
            neighbors.sort(function (a, b) {
                return iEL[a]["v"] - iEL[b]["v"]
            });

            while (neighbors.length > 0) {
                var j = neighbors.shift();
                var vertexA = iEL[j]["u"], vertexB = iEL[j]["v"];
                if (lab[vertexB] == -1 && u == vertexA) {
                    edgeHighlighted[j] = true;
                    cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, hiddenEdge);
                    cs["status"] = getStack() + "<br>Try edge " + vertexA + " &rarr; " + vertexB + ".";
                    cs["lineNo"] = 3;
                    cs["el"][j]["animateHighlighted"] = true;
                    stateList.push(cs);

                    if (p[vertexB] == -1) {
                        cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, hiddenEdge);
                        cs["status"] = getStack() + "<br>Vertex " + vertexB + " has not been visited.";
                        cs["lineNo"] = 4;
                        stateList.push(cs);

                        p[vertexB] = u;
                        Tdfs(vertexB);
                        if (low[u] > low[vertexB]) low[u] = low[vertexB];
                    }
                    else {
                        if (low[u] > num[vertexB]) low[u] = num[vertexB];
                    }
                    iVL[u]["extratext"] = "" + num[u] + "," + low[u];
                    cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, hiddenEdge);
                    cs["status"] = getStack() + "<br>Update low[" + u + "]."; // ambiguous for now " = min(num[" + vertexB + "], low[" + vertexB + "]).";
                    cs["lineNo"] = 5;
                    stateList.push(cs);
                }
            }

            delete vertexTraversing[u];
            vertexTraversed[u] = true;
            vertexHighlighted[u] = true;
            cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, hiddenEdge);
            cs["status"] = getStack() + "<br>DFS(" + u + ") is completed, check if vertex " + u + " is the root of this SCC.";
            cs["lineNo"] = 6;
            stateList.push(cs);
            if (low[u] == num[u]) {
                cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, hiddenEdge);
                cs["status"] = getStack() + "<br>low[" + u + "] == num[" + u + "], that means this vertex " + u + " is the root of this SCC.";
                cs["lineNo"] = 6;
                stateList.push(cs);
                var oldPos = stackNum;
                labNum++;
                while (stack[stackNum] != u)
                    lab[stack[stackNum--]] = labNum;
                lab[stack[stackNum--]] = labNum;

                for (var i = stackNum + 1; i <= oldPos; i++)
                    vertexHighlighted[stack[i]] = true;
                cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, hiddenEdge);
                cs["status"] = getStack() + "<br>We pop the stack until we get vertex " + u + ".";
                cs["lineNo"] = 7;
                stateList.push(cs);
                for (var i = stackNum + 1; i <= oldPos; i++)
                    delete vertexHighlighted[stack[i]];

                for (var j = 0; j < amountEdge; j++) {
                    var vertexA = iEL[j]["u"], vertexB = iEL[j]["v"];
                    if (lab[vertexA] != lab[vertexB]) hiddenEdge[j] = true;
                }
                cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, hiddenEdge);
                cs["status"] = getStack() + "<br>We get 1 Strongly Connected Component.";
                cs["lineNo"] = 7;
                stateList.push(cs);
            }
            delete vertexHighlighted[u];
        }

        cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, hiddenEdge);
        cs["status"] = "In total, we have " + labNum + " Strongly Connected Component(s) as seen above.";
        cs["lineNo"] = 1;
        stateList.push(cs);
        for (var key in iVL) iVL[key]["extratext"] = "";

        populatePseudocode(8);
        gw.startAnimation(stateList, callback);
        return true;
    }

    this.twosat = function (numOfRows, numOfColumns) {
        var vertexHighlighted = {}, edgeHighlighted = {};
        var stateList = [];
        var cs;
        var currentX = 0, currentY = -170, centerX = 200, centerY = 200;

        DIRECTED_GR = true;
        numOfColumns *= 2;
        var blocked = new Array(numOfRows + 1);
        for (var i = 0; i <= numOfRows; i++) {
            blocked[i] = new Array(numOfColumns + 1);
            for (var j = 0; j <= numOfColumns; j++)
                blocked[i][j] = false;
        }

        if (numOfRows < 1 || numOfRows > 5) {
            $('#twosat-err').html("The number of clauses must be [1..5].");
            return false;
        }

        if (numOfColumns < 1 || numOfColumns > 10) {
            $('#twosat-err').html("The number of variables must be [1..5].");
            return false;
        }

        $('#twosat-err').html("");

        this.checkInputt = function (XX) {
            var cc = 0;
            for (var j = 1; j <= numOfColumns; j++)
                if (blocked[XX][j])
                    cc++;
            return cc;
        }

        this.checkInput = function () { // each clause can only have two variables
            for (var i = 1; i <= numOfRows; i++) {
                var cc = 0;
                for (var j = 1; j <= numOfColumns; j++) if (blocked[i][j]) cc++;
                if (cc != 2) return false;
            }
            return true;
        }

        this.changeState = function (rowIndex, columnIndex) {
            var temp = '#cell' + rowIndex + columnIndex;
            if (blocked[rowIndex][columnIndex]) {
                $(temp).attr("bgcolor", "white");
                blocked[rowIndex][columnIndex] = false;
            }
            else {
                $(temp).attr("bgcolor", "black");
                blocked[rowIndex][columnIndex] = true;
            }
            if (this.checkInputt(rowIndex) > 2) {
                $('#twosat-board-err').html("Row " + rowIndex + " has more than 2 black cells.")
                    .delay(1000)
                    .queue(function (n) {
                        $(this).html("");
                    });
            }
        }

        this.createGraph = function () {
            iVL = {};
            iEL = {};
            amountEdge = 0;
            amountVertex = numOfColumns;

            getvar = function (i) {
                return i % 2 == 0 ? "-x" + (i / 2 + 1) : "x" + (i + 1) / 2;
            }
            getOpp = function (i) {
                return i % 2 == 0 ? i + 1 : i - 1;
            }

            for (var i = 1; i <= numOfColumns; ++i) {
                var angle = Math.acos(-1) * 2 / amountVertex;
                var x1 = currentX * Math.cos(angle) - currentY * Math.sin(angle);
                var y1 = currentX * Math.sin(angle) + currentY * Math.cos(angle);
                currentX = x1, currentY = y1;
                iVL[i - 1] = {
                    "x": currentX + centerX,
                    "y": currentY + centerY,
                    "extratext": i % 2 == 0 ? "x" + i / 2 : "-x" + (i + 1) / 2
                }
            }

            cs = createState(iVL, iEL);
            cs["status"] = "Create 2 vertices for each variable.<br>One for xi, the other for -xi.";
            cs["lineNo"] = 1;
            stateList.push(cs);

            for (var i = 1; i <= numOfRows; ++i) { // clauses
                var a, b;
                for (var j = 0; j < numOfColumns; j++) if (blocked[i][j + 1]) a = j; // a
                for (var j = numOfColumns - 1; j >= 0; j--) if (blocked[i][j + 1]) b = j; // b
                // clause = (a v b)
                var pos1 = -1, pos2 = -1;
                var flag = true;
                for (var j = 0; j < amountEdge; j++)
                    if (iEL[j]["u"] == getOpp(a) && iEL[j]["v"] == b)
                        flag = false, pos1 = j;
                if (flag && getOpp(a) !== b) {
                    iEL[amountEdge++] = {
                        "u": getOpp(a),
                        "v": b,
                        "w": 1
                    }
                    pos1 = amountEdge - 1;
                }

                flag = true;
                for (var j = 0; j < amountEdge; j++)
                    if (iEL[j]["u"] == getOpp(b) && iEL[j]["v"] == a)
                        flag = false, pos2 = j;
                if (flag && getOpp(b) !== a) {
                    iEL[amountEdge++] = {
                        "u": getOpp(b),
                        "v": a,
                        "w": 1
                    }
                    pos2 = amountEdge - 1;
                }

                cs = createState(iVL, iEL);
                cs["status"] = "Clause = (" + getvar(a) + " or " + getvar(b) + ").<br>" +
                    "Create edge " + getvar(getOpp(a)) + " &rarr; " + getvar(b) + " (" + getOpp(a) + " &rarr; " + b + ") and " + getvar(getOpp(b)) + " &rarr; " + getvar(a) + " (" + getOpp(b) + " &rarr; " + a + ").";
                cs["lineNo"] = [2, 3];
                if (pos1 != -1) cs["el"][pos1]["animateHighlighted"] = true;
                if (pos2 != -1) cs["el"][pos2]["animateHighlighted"] = true;
                stateList.push(cs);
            }
            return true;
        }

        this.runAlgo = function () {
            var vertexHighlighted = {}, edgeHighlighted = {}, vertexTraversed = {}, vertexTraversing = {},
                hiddenEdge = {};
            var cs;

            cs = createState(iVL, iEL);
            cs["status"] = "We run an SCC finding algorithm (either Kosaraju's or Tarjan's) to see if there is a conflict (a variable and its negation in the same SCC).";
            cs["lineNo"] = 4;
            stateList.push(cs);

            // main code
            var p = {}, stack = {}, stackNum = -1, Count = 0, low = {}, num = {}, lab = {}, labNum = 0;
            for (var i = 0; i < amountVertex; i++)
                p[i] = lab[i] = -1;
            for (var i = 0; i < amountVertex; i++)
                if (p[i] == -1) {
                    p[i]--;
                    Tdfs(i);
                }

            for (var j = 0; j < amountEdge; j++) {
                var vertexA = iEL[j]["u"];
                var vertexB = iEL[j]["v"];
                iEL[j]["u"] = vertexB;
                iEL[j]["v"] = vertexA;
            }

            while (stackNum >= 0) {
                if (lab[stack[stackNum]] == -1) {
                    labNum++;
                    DFS2(stack[stackNum]);
                    var flag = -1;
                    for (var z = 0; z < amountVertex; z += 2)
                        if ((lab[z] == lab[z + 1]) && (lab[z] == labNum))
                            flag = z;

                    if (flag != -1) {
                        for (var key in iVL)
                            if (lab[key] == lab[flag])
                                vertexTraversed[key] = true;
                        vertexHighlighted[flag] = vertexHighlighted[flag + 1] = true;
                        cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, hiddenEdge);
                        cs["status"] = "" + getvar(flag) + " (vertex " + flag + ") and " + getvar(flag + 1) + " (vertex " + (flag + 1) + ") are in the same SCC.<br>The 2-SAT instance is not satisfiable!";
                        cs["lineNo"] = 7;
                        stateList.push(cs);
                        return true;
                    }
                }
                stackNum--;
            }

            function Tdfs(u) {
                var neighbors = [];
                for (var j = 0; j < amountEdge; j++) if (iEL[j]["u"] == u) neighbors.push(j);
                neighbors.sort(function (a, b) {
                    return iEL[a]["v"] - iEL[b]["v"]
                });

                while (neighbors.length > 0) {
                    var j = neighbors.shift();
                    var vertexA = iEL[j]["u"], vertexB = iEL[j]["v"];
                    if (lab[vertexB] == -1 && u == vertexA)
                        if (p[vertexB] == -1) {
                            p[vertexB] = u;
                            Tdfs(vertexB);
                        }
                }

                stack[++stackNum] = u;
            }

            function DFS2(u) {
                lab[u] = labNum;

                var neighbors = [];
                for (var j = 0; j < amountEdge; j++) if (iEL[j]["u"] == u) neighbors.push(j);
                neighbors.sort(function (a, b) {
                    return iEL[a]["v"] - iEL[b]["v"]
                });

                while (neighbors.length > 0) {
                    var j = neighbors.shift();
                    var vertexA = iEL[j]["u"], vertexB = iEL[j]["v"];
                    if (hiddenEdge[j] == null)
                        if (lab[vertexB] == -1)
                            DFS2(vertexB);
                }
            }

            for (var i = 0; i < amountEdge; i++) {
                var vertexA = iEL[i]["u"];
                var vertexB = iEL[i]["v"];
                iEL[i]["u"] = vertexB;
                iEL[i]["v"] = vertexA;
            }

            cs = createState(iVL, iEL, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, {}, {}, {}, {}, hiddenEdge);
            cs["status"] = "SCC algorithm is completed without any conflict.<br>So the 2-SAT instance is satisfiable!";
            cs["lineNo"] = 5;
            stateList.push(cs);
        }

        this.CloseBox = function () {
            $('.overlays').hide("slow");
            $('#dark-overlay').hide("slow");
            $('#rookattack-board').hide("slow");
        }

        this.inputExample1 = function () {
            numOfRows = 2;
            numOfColumns = 4;
            blocked = new Array(numOfRows + 1);
            for (var i = 0; i <= numOfRows; i++) {
                blocked[i] = new Array(numOfColumns + 1);
                for (var j = 0; j <= numOfColumns; j++)
                    blocked[i][j] = false;
            }
            var toWrite = '<html>\n';
            toWrite += '<br>Click on any cell to toggle between black/white cell</br>\n';
            toWrite += '<br>Each black cell presents a clause. Each row should have exactly 2 black cells.</br>\n';
            toWrite += '<table border="1" id="board">'
            for (var j = 0; j <= numOfColumns; ++j)
                toWrite += '<col width="50">';

            toWrite += '<tr><td height="50" bgcolor="white" id="cell00"></td>';
            for (var j = 1; j <= numOfColumns; j++)
                if (j % 2 == 1)
                    toWrite += '<td height="50" bgcolor="white" id="cell' + 0 + j + '">-x' + (j + 1) / 2 + '</td>';
                else
                    toWrite += '<td height="50" bgcolor="white" id="cell' + 0 + j + '">x' + j / 2 + '</td>';
            toWrite += "</tr>"

            for (var i = 1; i <= numOfRows; ++i) {
                toWrite += '<tr>';
                toWrite += '<td height="50" bgcolor="white" id="cell00">' + i + '</td>';
                for (var j = 1; j <= numOfColumns; ++j)
                    toWrite += '<td height="50" bgcolor="white" id="cell' + i + j + '" onclick=gtw.changeState(' + i + ',' + j + ')></td>';
                toWrite += '</tr>';
            }

            toWrite += '</table>\n';
            toWrite += '<button onclick=gtw.inputRandomized()>Randomized</button>';
            toWrite += '<button onclick=gtw.inputFinished()>Done</button>';
            toWrite += '<button onclick=gtw.inputExample1()>Example 1</button>';
            toWrite += '<button onclick=gtw.inputExample2()>Example 2</button>';
            toWrite += '<button onclick=gtw.CloseBox()>Close</button>';
            toWrite += '<div id="twosat-board-err" class="err"></div>';
            toWrite += '</html>\n';
            $('#twosat-board').html(toWrite);

            this.changeState(1, 1);
            this.changeState(1, 3);
            this.changeState(2, 2);
            this.changeState(2, 4);
        }

        this.inputExample2 = function () {
            numOfRows = 4;
            numOfColumns = 6;
            blocked = new Array(numOfRows + 1);
            for (var i = 0; i <= numOfRows; i++) {
                blocked[i] = new Array(numOfColumns + 1);
                for (var j = 0; j <= numOfColumns; j++)
                    blocked[i][j] = false;
            }
            var toWrite = '<html>\n';
            toWrite += '<br>Click on any cell to toggle between black/white cell</br>\n';
            toWrite += '<br>Each black cell presents a clause. Each row should have exactly 2 black cells.</br>\n';
            toWrite += '<table border="1" id="board">'
            for (var j = 0; j <= numOfColumns; ++j)
                toWrite += '<col width="50">';

            toWrite += '<tr><td height="50" bgcolor="white" id="cell00"></td>';
            for (var j = 1; j <= numOfColumns; j++)
                if (j % 2 == 1)
                    toWrite += '<td height="50" bgcolor="white" id="cell' + 0 + j + '">-x' + (j + 1) / 2 + '</td>';
                else
                    toWrite += '<td height="50" bgcolor="white" id="cell' + 0 + j + '">x' + j / 2 + '</td>';
            toWrite += "</tr>"

            for (var i = 1; i <= numOfRows; ++i) {
                toWrite += '<tr>';
                toWrite += '<td height="50" bgcolor="white" id="cell00">' + i + '</td>';
                for (var j = 1; j <= numOfColumns; ++j)
                    toWrite += '<td height="50" bgcolor="white" id="cell' + i + j + '" onclick=gtw.changeState(' + i + ',' + j + ')></td>';
                toWrite += '</tr>';
            }

            toWrite += '</table>\n';
            toWrite += '<button onclick=gtw.inputRandomized()>Randomized</button>';
            toWrite += '<button onclick=gtw.inputFinished()>Done</button>';
            toWrite += '<button onclick=gtw.inputExample1()>Example 1</button>';
            toWrite += '<button onclick=gtw.inputExample2()>Example 2</button>';
            toWrite += '<button onclick=gtw.CloseBox()>Close</button>';
            toWrite += '<div id="twosat-board-err" class="err"></div>';
            toWrite += '</html>\n';
            $('#twosat-board').html(toWrite);

            this.changeState(1, 2);
            this.changeState(1, 4);
            this.changeState(2, 1);
            this.changeState(2, 4);
            this.changeState(3, 3);
            this.changeState(3, 6);
            this.changeState(4, 3);
            this.changeState(4, 5);
        }

        this.inputFinished = function () {
            if (!this.checkInput()) {
                $('#twosat-board-err').html("Each row should have exactly 2 black cells.")
                    .delay(1000)
                    .queue(function (n) {
                        $(this).html("");
                    });
                return false;
            }

            $('.overlays').hide("slow");
            $('#dark-overlay').hide("slow");
            $('#rookattack-board').hide("slow");
            this.createGraph();
            this.runAlgo();
            gw.startAnimation(stateList);
            $('#current-action').show();
            $('#current-action p').html("2-SAT Modeling");
            $('#progress-bar').slider("option", "max", gw.getTotalIteration() - 1);
            triggerRightPanels();
            populatePseudocode(9);
            isPlaying = true;
            return true;
        }

        this.inputRandomized = function () {
            var randNumMin = 1;
            var randNumMax = numOfColumns;
            for (var i = 1; i <= numOfRows; i++) {
                for (var j = 1; j <= numOfColumns; j++)
                    if (blocked[i][j])
                        this.changeState(i, j);
                var a = (Math.floor(Math.random() * (randNumMax - randNumMin + 1)) + randNumMin);
                var b = (Math.floor(Math.random() * (randNumMax - randNumMin + 1)) + randNumMin);
                while (a == b)
                    b = (Math.floor(Math.random() * (randNumMax - randNumMin + 1)) + randNumMin);
                this.changeState(i, a);
                this.changeState(i, b);
            }
        }

        $('#dark-overlay').show("slow");
        var toWrite = '<html>\n';
        toWrite += '<br>Click on any cell to toggle between black/white cell</br>\n';
        toWrite += '<br>Each black cell presents a clause. Each row should have exactly 2 black cells.</br>\n';
        toWrite += '<table border="1" id="board">'
        for (var j = 0; j <= numOfColumns; ++j)
            toWrite += '<col width="50">';

        toWrite += '<tr><td height="50" bgcolor="white" id="cell00"></td>';
        for (var j = 1; j <= numOfColumns; j++)
            if (j % 2 == 1)
                toWrite += '<td height="50" bgcolor="white" id="cell' + 0 + j + '">-x' + (j + 1) / 2 + '</td>';
            else
                toWrite += '<td height="50" bgcolor="white" id="cell' + 0 + j + '">x' + j / 2 + '</td>';
        toWrite += "</tr>"

        for (var i = 1; i <= numOfRows; ++i) {
            toWrite += '<tr>';
            toWrite += '<td height="50" bgcolor="white" id="cell00">' + i + '</td>';
            for (var j = 1; j <= numOfColumns; ++j)
                toWrite += '<td height="50" bgcolor="white" id="cell' + i + j + '" onclick=gtw.changeState(' + i + ',' + j + ')></td>';
            toWrite += '</tr>';
        }

        toWrite += '</table>\n';
        toWrite += '<button onclick=gtw.inputRandomized()>Randomized</button>';
        toWrite += '<button onclick=gtw.inputFinished()>Done</button>';
        toWrite += '<button onclick=gtw.inputExample1()>Example 1</button>';
        toWrite += '<button onclick=gtw.inputExample2()>Example 2</button>';
        toWrite += '<button onclick=gtw.CloseBox()>Close</button>';
        toWrite += '<div id="twosat-board-err" class="err"></div>';
        toWrite += '</html>\n';
        $('#twosat-board').html(toWrite);
        $('#twosat-board').show("slow");
    }

    this.examples = function (id) {
        iVL = getExampleGraph(id, VL);
        iEL = getExampleGraph(id, EL);
        amountVertex = 0;
        amountEdge = 0;
        for (var key in iVL) amountVertex++;
        for (var key in iEL) amountEdge++;

        DIRECTED_GR = true;
        OLD_POSITION = amountEdge;

        var newState = createState(iVL, iEL);
        gw.updateGraph(newState, 1000);
        return true;
    }

    this.loadGraph = function (vertexList, edgeList) {
        iVL = vertexList;
        iEL = edgeList;
        fixJSON();
        var newState = createState(iVL, iEL);
        gw.updateGraph(newState, 1000);
    }

    function createState(iVLObject, iELObject, vertexHighlighted, edgeHighlighted, vertexTraversed, vertexTraversing, treeEdge, backEdge, crossEdge, forwardEdge, hiddenEdge) {
        if (vertexHighlighted == null) vertexHighlighted = {};
        if (edgeHighlighted == null) edgeHighlighted = {};
        if (vertexTraversed == null) vertexTraversed = {};
        if (vertexTraversing == null) vertexTraversing = {};
        if (treeEdge == null) treeEdge = {};
        if (backEdge == null) backEdge = {};
        if (crossEdge == null) crossEdge = {};
        if (forwardEdge == null) forwardEdge = {};
        if (hiddenEdge == null) hiddenEdge = {};

        var key, state = {
            "vl": {},
            "el": {}
        };

        for (key in iVLObject) {
            state["vl"][key] = {};
            state["vl"][key]["cx"] = iVLObject[key]["x"];
            state["vl"][key]["cy"] = iVLObject[key]["y"];
            state["vl"][key]["text"] = key;
            state["vl"][key]["extratext"] = iVLObject[key]["extratext"];
            if (iVLObject[key]["state"] == OBJ_HIDDEN)
                state["vl"][key]["state"] = OBJ_HIDDEN;
            else
                state["vl"][key]["state"] = VERTEX_DEFAULT;
        }

        for (key in iELObject) {
            state["el"][key] = {};
            state["el"][key]["vertexA"] = iELObject[key]["u"];
            state["el"][key]["vertexB"] = iELObject[key]["v"];
            if (DIRECTED_GR == false)
                state["el"][key]["type"] = EDGE_TYPE_UDE;
            else
                state["el"][key]["type"] = EDGE_TYPE_DE;
            state["el"][key]["weight"] = iELObject[key]["w"];
            if (iELObject[key]["state"] == OBJ_HIDDEN)
                state["el"][key]["state"] = OBJ_HIDDEN;
            else
                state["el"][key]["state"] = EDGE_DEFAULT;
            state["el"][key]["displayWeight"] = false;
            state["el"][key]["animateHighlighted"] = false;
        }

        for (key in vertexTraversed) state["vl"][key]["state"] = VERTEX_TRAVERSED;
        for (key in vertexTraversing) state["vl"][key]["state"] = VERTEX_BLUE_OUTLINE;
        for (key in treeEdge) state["el"][key]["state"] = EDGE_RED;
        for (key in backEdge) state["el"][key]["state"] = EDGE_BLUE;
        for (key in crossEdge) state["el"][key]["state"] = EDGE_GREEN;
        for (key in forwardEdge) state["el"][key]["state"] = EDGE_GREY;

        for (key in vertexHighlighted) state["vl"][key]["state"] = VERTEX_HIGHLIGHTED;
        for (key in edgeHighlighted) {
            state["el"][key]["state"] = EDGE_HIGHLIGHTED;
            for (var keyR in iEL) if ((iEL[key]["u"] == iEL[keyR]["v"]) && (iEL[key]["v"] == iEL[keyR]["u"])) edgeHighlighted[keyR] = true;
        }

        for (key in hiddenEdge) state["el"][key]["state"] = EDGE_GREY;

        return state;
    }

    function populatePseudocode(act) {
        switch (act) {
            case 0: // DFS
                $('#code1').html('DFS(u)');
                $('#code2').html('for each neighbor v of u');
                $('#code3').html('&nbsp;&nbsp;if v is unvisited, tree edge, DFS(v)');
                $('#code4').html('&nbsp;&nbsp;else if v is explored, bidirectional/back edge');
                $('#code5').html('&nbsp;&nbsp;else if v is visited, forward/cross edge');
                $('#code6').html('');
                break
            case 1: // BFS
                $('#code1').html('BFS(u), Q = {u}');
                $('#code2').html('while !Q.empty // Q is a normal queue');
                $('#code3').html('&nbsp;&nbsp;for each neighbor v of u = Q.front, Q.pop');
                $('#code4').html('&nbsp;&nbsp;&nbsp;&nbsp;if v is unvisited, tree edge, Q.push(v)');
                $('#code5').html('&nbsp;&nbsp;&nbsp;&nbsp;else if v is visited, we ignore this edge'); // bidirectional/back edge
                $('#code6').html('');
                break;
            case 2: // Topological Sort using DFS
                $('#code1').html('for each unvisited vertex u');
                $('#code2').html('&nbsp;&nbsp;DFS(u)');
                $('#code3').html('&nbsp;&nbsp;&nbsp;&nbsp;for each neighbor v of u');
                $('#code4').html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;if v is unvisited, DFS(v)');
                $('#code5').html('&nbsp;&nbsp;&nbsp;&nbsp;else skip v;');
                $('#code6').html('&nbsp;&nbsp;&nbsp;&nbsp;finish DFS(u), add u to the back of list');
                break
            case 3: // Topological Sort using BFS
                $('#code1').html('add vertices with no incoming edge to queue Q');
                $('#code2').html('while !Q.empty // Q is a normal queue');
                $('#code3').html('&nbsp;&nbsp;u = Q.front, Q.pop, add u to the front of list');
                $('#code4').html('&nbsp;&nbsp;for each neighbor v of u');
                $('#code5').html('&nbsp;&nbsp;&nbsp;&nbsp;delete edge u &rarr; v');
                $('#code6').html('&nbsp;&nbsp;&nbsp;&nbsp;if v has no incoming edge, add v to queue');
                $('#code7').html('// done'); // not in CP3, only as exercise at the moment?
                break;
            case 4: // bipartite DFS
                $('#code1').html('for each unvisited vertex u');
                $('#code2').html('&nbsp;&nbsp;DFS(u)');
                $('#code3').html('&nbsp;&nbsp;&nbsp;&nbsp;for each neighbor v of u');
                $('#code4').html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;if v is unvisited, different color, DFS(v)');
                $('#code5').html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;else if u and v have the same color');
                $('#code6').html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;not bipartite graph, exit.');
                $('#code7').html(''); // not in CP3, only as exercise at the moment? // <b><a href="http://cpbook.net/#downloads" target="_blank">ch4_01_dfs.cpp/java, ch4, CP3</a></b>');
                break
            case 5: // bipartite BFS
                $('#code1').html('for each unvisited vertex u');
                $('#code2').html('&nbsp;&nbsp;push u to the queue');
                $('#code3').html('&nbsp;&nbsp;while !Q.empty // Q is a normal queue');
                $('#code4').html('&nbsp;&nbsp;&nbsp;&nbsp;for each neighbor v of u = Q.front, Q.pop');
                $('#code5').html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;if u and v have the same color &rarr; exit');
                $('#code6').html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;assign another color to v, push v to queue');
                break
            case 6: // articulation points and bridges
                $('#code1').html('try all vertex u, if u hasnt been visited, DFS(u)');
                $('#code2').html('DFS(u), initiate num[u] = low[u] = DFSCount');
                $('#code3').html('&nbsp;&nbsp;try all neighbor v of u');
                $('#code4').html('&nbsp;&nbsp;&nbsp;&nbsp;if v is free, DFS(v)');
                $('#code5').html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;low[u] = min(low[u], low[v])');
                $('#code6').html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;check the condition');
                $('#code7').html('&nbsp;&nbsp;&nbsp;&nbsp;else low[u] = min(low[u], num[v])');
                break;
            case 7: // Kosaraju's algorithm
                $('#code1').html('for each unvisited vertex u, DFS(u)');
                $('#code2').html('&nbsp;&nbsp;try all free neighbor v of u, DFS(v)');
                $('#code3').html('&nbsp;&nbsp;finish DFS(u), add u to the front of list');
                $('#code4').html('transpose the graph');
                $('#code5').html('DFS in order of the list, DFS(u)');
                $('#code6').html('&nbsp;&nbsp;try all free neighbor v of u, DFS(v)');
                $('#code7').html('each time we complete a DFS, we get an SCC');
                break;
            case 8: // Tarjan's algorithm
                $('#code1').html('for each unvisited vertex u');
                $('#code2').html('&nbsp;&nbsp;DFS(u), s.push(u), num[u] = low[u] = DFSCount');
                $('#code3').html('&nbsp;&nbsp;&nbsp;&nbsp;for each neighbor v of u');
                $('#code4').html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;if v is unvisited, DFS(v)');
                $('#code5').html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;low[u] = min(low[u], low[v])');
                $('#code6').html('&nbsp;&nbsp;&nbsp;&nbsp;if low[u] == num[u] // root of an SCC');
                $('#code7').html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;pop from stack s until we get u');
                break;
            case 9: // two-sat
                $('#code1').html('create graph, each variable creates 2 vertices');
                $('#code2').html('for clause (a or b)');
                $('#code3').html('&nbsp;&nbsp;create edge -a &rarr; b and -b &rarr; a');
                $('#code4').html('run scc algorithm');
                $('#code5').html('if no conflict, the 2-SAT instance is satisfiable');
                $('#code6').html('if a variable and its negation are in the same SCC');
                $('#code7').html('&nbsp;&nbsp;the 2-SAT instance is not satisfiable');
                break;
        }
    }
}

var title = document.getElementById('title');

function dfs(callback) {
    var options = [CP3_4_1, CP3_4_3, CP3_4_4, CP3_4_9, CP3_4_17, CP3_4_18, CP3_4_19];
    gtw.examples(options[Math.floor(Math.random()*7)]);
    title.innerHTML = "Depth-First Search";
    if (isPlaying) stop();
    var input = 0;
    $('#play').hide();
    commonAction(gtw.dfs(input, callback), "DFS(" + input + ")");
    setTimeout(function () {
        $("#dfs-v").val(1 + Math.floor(Math.random() * gtw.getV()));
    }, 1000); // randomized for next click between [0..V-1]
}

function bfs(callback) {
    var options = [CP3_4_1, CP3_4_3, CP3_4_4, CP3_4_9, CP3_4_17, CP3_4_18, CP3_4_19];
    gtw.examples(options[Math.floor(Math.random()*7)]);
    title.innerHTML = "Breath-First Search";
    if (isPlaying) stop();
    var input = 0;
    $('#play').hide();
    commonAction(gtw.bfs(input, callback), "BFS(" + input + ")");
    setTimeout(function () {
        $("#bfs-v").val(1 + Math.floor(Math.random() * gtw.getV()));
    }, 1000);
}