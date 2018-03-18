var currentFatherNode;


var node = {
    value: 125,
    left: null,
    right: null
};
function BinarySearchTree() {
    this._root = null;
}

BinarySearchTree.prototype = {

    //restore constructor
    constructor: BinarySearchTree,

    add: function(value){
        //create a new item object, place data in
        var node = {
                value: value,
                left: null,
                right: null
            },

            //used to traverse the structure
            current;

        //special case: no items in the tree yet
        if (this._root === null){
            this._root = node;
        } else {
            current = this._root;

            while(true){

                //if the new value is less than this node's value, go left
                if (value < current.value){

                    //if there's no left, then the new node belongs there
                    if (current.left === null){
                        current.left = node;
                        currentFatherNode = current.value;
                        break;
                    } else {
                        current = current.left;
                    }

                    //if the new value is greater than this node's value, go right
                } else if (value > current.value){

                    //if there's no right, then the new node belongs there
                    if (current.right === null){
                        current.right = node;
                        currentFatherNode = current.value;
                        break;
                    } else {
                        current = current.right;
                    }

                    //if the new value is equal to the current one, just ignore
                } else {
                    break;
                }
            }
        }
    },

};


var bst = new BinarySearchTree();




// set up SVG for d3
var width  = 960,
    height = 500,
    colors = d3.scale.category10();

var svg = d3.select('#graph')
    .append('svg')
    .attr('oncontextmenu', 'return false;')
    .attr('width', width)
    .attr('height', height);

// set up initial nodes and links
//  - nodes are known by 'id', not by index in array.
//  - reflexive edges are indicated on the node (as a bold black circle).
//  - links are always source < target; edge directions are set by 'left' and 'right'.

var Node = function (id, reflexive, color) {
    this.id = id;
    this.reflexive = reflexive;
    this.color = color;
}

var Link = function (source, target, left, right, color) {
    this.source = source;
    this.target = target;
    this.left = left;
    this.right = right;
    this.color = color;
}

var State = function (nodes, links, status, lineNo, logMessage) {
    this.nodes = nodes; // array of Entry's
    this.links = links; // array of Backlink's
    this.status = status;
    this.lineNo = lineNo; //integer or array, line of the code to highlight
    this.logMessage = logMessage;
}

var StateHelper = new Object();

StateHelper.createNewState = function () {
    return new State(nodes, links, "", 0, "");
}

StateHelper.copyState = function (oldState) {
    var newNodes = new Array();
    var newLinks = new Array();
    for (var i = 0; i < oldState.nodes.length; i++) {
        newNodes.push(new Node(oldState.nodes[i].id, oldState.nodes[i].reflexive, oldState.nodes[i].color));
    }

    for (var i = 0; i < oldState.links.length; i++) {
        newLinks.push(new Link(oldState.links[i].source, oldState.links[i].target,
            oldState.links[i].left, oldState.links[i].right, oldState.links[i].color));
    }

    var newLineNo = oldState.lineNo;
    if (newLineNo instanceof Array)
        newLineNo = oldState.lineNo.slice();

    return new State(newNodes, newLinks, oldState.status, newLineNo, oldState.logMessage);
}

StateHelper.updateCopyPush = function (list, stateToPush) {
    list.push(StateHelper.copyState(stateToPush));
}

var nodes = new Array();

// nodes.push(new Node(0, false));
// nodes.push(new Node(1, true));
// nodes.push(new Node(2, false));
// nodes.push(new Node(3, true));



var links = new Array();

// links.push(new Link(nodes[0], nodes[1], false, true, 3));
// links.push(new Link(nodes[1], nodes[2], false, true, 2));
// links.push(new Link(nodes[2], nodes[3], true, false, 5));

var lastNodeId = -1;

// init d3 force layout

var force = d3.layout.force()
    .nodes(nodes)
    .links(links)
    .size([width, height])
    .linkDistance(150)
    .charge(-500)
    .on('tick', tick)
    .start();

// define arrow markers for graph links
svg.append('svg:defs').append('svg:marker')
    .attr('id', 'end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 6)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#000');

svg.append('svg:defs').append('svg:marker')
    .attr('id', 'start-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 4)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M10,-5L0,0L10,5')
    .attr('fill', '#000');

// line displayed when dragging new nodes
var drag_line = svg.append('svg:path')
    .attr('class', 'link dragline hidden')
    .attr('d', 'M0,0L0,0');

// handles to link and node element groups
var path = svg.append('svg:g').selectAll('path');
var circle = svg.append('svg:g').selectAll('g');
var edgelabels = svg.selectAll(".edgelabel");

// mouse event vars
var selected_node = null,
    selected_link = null,
    mousedown_link = null,
    mousedown_node = null,
    mouseup_node = null;

function resetMouseVars() {
    mousedown_node = null;
    mouseup_node = null;
    mousedown_link = null;
}

// update force layout (called automatically each iteration)
function tick() {
    // draw directed edges with proper padding from node centers
    path.attr('d', function(d) {
        var deltaX = d.target.x - d.source.x,
            deltaY = d.target.y - d.source.y,
            dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
            normX = deltaX / dist,
            normY = deltaY / dist,
            sourcePadding = d.left ? 17 : 12,
            targetPadding = d.right ? 17 : 12,
            sourceX = d.source.x + (sourcePadding * normX),
            sourceY = d.source.y + (sourcePadding * normY),
            targetX = d.target.x - (targetPadding * normX),
            targetY = d.target.y - (targetPadding * normY);
        return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
    });

    circle.attr('transform', function(d) {
        return 'translate(' + d.x + ',' + d.y + ')';
    });

    edgelabels.attr('transform',function(d,i){
        if (d.target.x < d.source.x){
            var bbox = this.getBBox();
            var rx = bbox.x+bbox.width/2;
            var ry = bbox.y+bbox.height/2;
            return 'rotate(180 '+rx+' '+ry+')';
        }
        else {
            return 'rotate(0)';
        }
    });

}

// update graph (called when needed)
function restart() {

    // path (link) group
    path = path.data(links);

    // update existing links
    path.classed('selected', function(d) { return d === selected_link; })
        .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
        .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; });


    // add new links
    path.enter().append('svg:path')
        .attr('class', 'link')
        .classed('selected', function(d) { return d === selected_link; })
        .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
        .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; })
        .on('mousedown', function(d) {
            if(d3.event.ctrlKey) return;

            // select link
            mousedown_link = d;
            if(mousedown_link === selected_link) selected_link = null;
            else selected_link = mousedown_link;
            selected_node = null;
            restart();
        });



    // remove old links
    path.exit().remove();


    // circle (node) group
    // NB: the function arg is crucial here! nodes are known by id, not by index!
    circle = circle.data(nodes, function(d) { return d.id; });

    // update existing nodes (reflexive & selected visual states)
    circle.selectAll('circle')
        .style('fill', function(d) { return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id); })
        .classed('reflexive', function(d) { return d.reflexive; });

    // add new nodes
    var g = circle.enter().append('svg:g');

    g.append('svg:circle')
        .attr('class', 'node')
        .attr('r', 12)
        .style('fill', function(d) { return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id); })
        .style('stroke', function(d) { return d3.rgb(colors(d.id)).darker().toString(); })
        .classed('reflexive', function(d) { return d.reflexive; })
        .on('mouseover', function(d) {
            if(!mousedown_node || d === mousedown_node) return;
            // enlarge target node
            d3.select(this).attr('transform', 'scale(1.1)');
        })
        .on('mouseout', function(d) {
            if(!mousedown_node || d === mousedown_node) return;
            // unenlarge target node
            d3.select(this).attr('transform', '');
        })
        .on('mousedown', function(d) {
            if(d3.event.ctrlKey) return;

            // select node
            mousedown_node = d;
            if(mousedown_node === selected_node) selected_node = null;
            else selected_node = mousedown_node;
            selected_link = null;

            // reposition drag line
            drag_line
                .style('marker-end', 'url(#end-arrow)')
                .classed('hidden', false)
                .attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + mousedown_node.x + ',' + mousedown_node.y);

            restart();
        })
        .on('mouseup', function(d) {
            if(!mousedown_node) return;

            // needed by FF
            drag_line
                .classed('hidden', true)
                .style('marker-end', '');

            // check for drag-to-self
            mouseup_node = d;
            if(mouseup_node === mousedown_node) { resetMouseVars(); return; }

            // unenlarge target node
            d3.select(this).attr('transform', '');

            // add link to graph (update if exists)
            // NB: links are strictly source < target; arrows separately specified by booleans
            var source, target, direction;
            if(mousedown_node.id < mouseup_node.id) {
                source = mousedown_node;
                target = mouseup_node;
                direction = 'right';
            } else {
                source = mouseup_node;
                target = mousedown_node;
                direction = 'left';
            }

            var link;
            link = links.filter(function(l) {
                return (l.source === source && l.target === target);
            })[0];

            if(link) {
                link[direction] = true;
            } else {
                link = {source: source, target: target, left: false, right: false};
                link[direction] = false;
                if(nodes.length <= 2)
                    links.push(link);
                else if((link.source.id == currentFatherNode && link.target.id == nodes[nodes.length - 1].id)
                    || (link.source.id == nodes[nodes.length - 1].id && link.target.id == currentFatherNode)){
                    links.push(link);
                }

            }

            // select new link
            selected_link = link;
            selected_node = null;
            restart();
        });




    // show node IDs
    g.append('svg:text')
        .attr('x', 0)
        .attr('y', 4)
        .attr('class', 'id')
        .text(function(d) { return d.id; });

    // remove old nodes
    circle.exit().remove();

    //

    edgelabels = edgelabels.data(links);
    edgelabels
        .enter()
        .append('text')
        .style("pointer-events", "none")
        .attr({'class':'edgelabel',
            'id':function(d,i){return 'edgelabel'+i},
            'dx':80,
            'dy':0,
            'font-size':10,
            'fill':'#aaa'});

    edgelabels
        .append('textPath')
        .attr('xlink:href',function(d,i) {return '#edgepath'+i})
        .style("pointer-events", "none")
        .text(function(d,i){return 'label '+i});

    edgelabels.exit().remove();

    //

    // set the graph in motion
    force.start();

    // getMatrix();
    // showMatrix();

}


function checkNodeNotHavingLink(source){
    var linkNum = 0;

    for (i = 0; i < links.length; i++) {
        if(links[i].source.id == source|| links[i].target.id == source)
            linkNum++;
    }
    if(linkNum == 0)
        return true;
    else
        return false;
}

function mousedown() {
    // prevent I-bar on drag
    //d3.event.preventDefault();

    svg.classed('active', true);

    if(d3.event.ctrlKey || mousedown_node || mousedown_link) return;

    if (nodes.length >=2){
        var lastNode = nodes[nodes.length - 1];
    }


    if (nodes.length >= 2 && checkNodeNotHavingLink(lastNode.id)){
        alert("Please draw link for the lastest node");
    }else{
        // because :active only works in WebKit?


        // insert new node at point
        var inputId =prompt("Please enter node value","1");
        if(inputId != null){
            var point = d3.mouse(this),
                node = {id: inputId, reflexive: false, color: colors(3)};
            node.x = point[0];
            node.y = point[1];
            nodes.push(node);
            bst.add(Number(inputId));
            restart();
        }
    }



}

function mousemove() {
    if(!mousedown_node) return;

    // update drag line
    drag_line.attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + d3.mouse(this)[0] + ',' + d3.mouse(this)[1]);

    restart();
}

function mouseup() {
    if(mousedown_node) {
        // hide drag line
        drag_line
            .classed('hidden', true)
            .style('marker-end', '');
    }

    // because :active only works in WebKit?
    svg.classed('active', false);

    // clear mouse event vars
    resetMouseVars();
}

function spliceLinksForNode(node) {
    var toSplice = links.filter(function(l) {
        return (l.source === node || l.target === node);
    });
    toSplice.map(function(l) {
        links.splice(links.indexOf(l), 1);
    });
}

// only respond once per keydown
var lastKeyDown = -1;

function keydown() {
    // d3.event.preventDefault();

    if(lastKeyDown !== -1) return;
    lastKeyDown = d3.event.keyCode;

    // ctrl
    if(d3.event.keyCode === 17) {
        circle.call(force.drag);
        svg.classed('ctrl', true);
    }

    if(!selected_node && !selected_link) return;
    switch(d3.event.keyCode) {
        case 8: // backspace
        case 46: // delete
            if(selected_node) {
                nodes.splice(nodes.indexOf(selected_node), 1);
                spliceLinksForNode(selected_node);
            } else if(selected_link) {
                links.splice(links.indexOf(selected_link), 1);
            }
            selected_link = null;
            selected_node = null;
            restart();
            break;
        case 66: // B
            if(selected_link) {
                // set link direction to both left and right
                selected_link.left = true;
                selected_link.right = true;
            }
            restart();
            break;
        case 76: // L
            if(selected_link) {
                // set link direction to left only
                selected_link.left = true;
                selected_link.right = false;
            }
            restart();
            break;
        case 82: // R
            if(selected_node) {
                // toggle node reflexivity
                selected_node.reflexive = !selected_node.reflexive;
            } else if(selected_link) {
                // set link direction to right only
                selected_link.left = false;
                selected_link.right = true;
            }
            restart();
            break;
    }
}

function keyup() {
    lastKeyDown = -1;

    // ctrl
    if(d3.event.keyCode === 17) {
        circle
            .on('mousedown.drag', null)
            .on('touchstart.drag', null);
        svg.classed('ctrl', false);
    }
}


function newMatrix( rows, cols, defaultValue){

    var arr = [];

    // Creates all lines:
    for(var i=0; i < rows; i++){

        // Creates an empty line
        arr.push([]);

        // Adds cols to the empty line:
        arr[i].push( new Array(cols));

        for(var j=0; j < cols; j++){
            // Initializes:
            arr[i][j] = defaultValue;
        }
    }

    return arr;
}

var matrix;

var getMatrix = function () {
    matrix = newMatrix(nodes.length, nodes.length, 0);

    for (var i = 0; i < links.length; i++) {
        var l = links[i].left;
        var r = links[i].right;

        if (l) {
            matrix[links[i].target.id][links[i].source.id] = 1;
        }

        if (r) {
            matrix[links[i].source.id][links[i].target.id] = 1;
        }

    }
}

var showMatrix = function () {
    for (var i = 0; i < nodes.length; i++) {
        var message = "";
        for (var j = 0; j < nodes.length; j++) {
            message += matrix[i][j] + " ";
        }
        console.log(message);
    }
}



var Travelsal = function () {
    var normalColor = colors(1);
    var highlightColor = colors(2);
    var sourceColor = colors(0);

    var stateList = new Array();

    stateList.push(createNewState());
    var state = StateHelper.copyState(statelist[0]);
    
    this.dfs = function (sourceVertex ,callback) {
        if (nodes.length === 0) { // no graph
            console.log("no graph");
            return false;
        }

        if (sourceVertex >= nodes.length || sourceVertex < 0) { // source vertex not in range
            console.log('This vertex does not exist in the graph. Please select another source vertex');
            return false;
        }

        var UNVISITED = 0, EXPLORED = 1, VISITED = 2;
        var p = {}, num = {}, Count = 0; // low = {},
        for (var i = 0; i < nodes.length; i++) {
            p[i] = -1;
            num[i] = UNVISITED;
        }
        p[sourceVertex] = -2;

        state.nodes[sourceVertex].color = sourceColor;

        StateHelper.updateCopyPush(stateList, state);

        function dfsRecur(u) {

            if (u != sourceVertex) {
                state.nodes[u].color = highlightColor;
            }

            state["status"] = "DFS(" + u + ")";
            state["lineNo"] = 1;
            StateHelper.updateCopyPush(stateList, state);

            // delete vertexHighlighted[u];
            // vertexTraversing[u] = true;

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

    }
}



// app starts here
svg.on('mousedown', mousedown)
    .on('mousemove', mousemove)
    .on('mouseup', mouseup);
d3.select(window)
    .on('keydown', keydown)
    .on('keyup', keyup);
restart();

function getTreeArray(){
    var array = [];
    for(i = 0; i< nodes.length; i++)
        array[i] = nodes[i].id;

    return array;
}

