function Point(x, y) {
    this.x = x;
    this.y = y;
}

function Vector (pointFrom, pointTo) {
    this.start = pointFrom;
    this.end = pointTo;
}

function drawVector (context, vector, color) {
    context.beginPath();
    context.moveTo(vector.start.x, vector.start.y);
    context.lineTo(vector.end.x, vector.end.y);
    context.strokeStyle = color;
    context.stroke();
    context.closePath();
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

var title = $('#title');
var note = $('#noteContent');

var Recursion = function() {
    var maxLevel = 6;
    var level = 0;
    var side = 300;
    var angle = 0;

    var transitionTime = 1000;
    var isPlaying;
    var animInterval;
    var currentStep = 0;

    // List of state
    var scaler;
    var width;
    var height;

    this.selectedDrawFunction;

    var stateList = new Array();
    var lineCollection = new Array();


    var State = function (vectors, status, lineNo, logMessage) {
        this.vectors = vectors;
        this.status = status;
        this.lineNo = lineNo; //integer or array, line of the code to highlight
        this.logMessage = logMessage;
    }

    var StateHelper = new Object();

    StateHelper.createNewState = function (lineCollection) {
        return new State(lineCollection, "", "", "");
    }

    StateHelper.copyState = function (oldState) {
        var newVectors = new Array();
        for (var i = 0; i < oldState.vectors.length; i++) {
            newVectors.push(oldState.vectors[i]);
        }
        var newLineNo = oldState.lineNo;
        if (newLineNo instanceof Array)
            newLineNo = oldState.lineNo.slice();

        return new State(newVectors, oldState.status, newLineNo, oldState.logMessage);
    }

    StateHelper.updateCopyPush = function (list, stateToPush) {
        list.push(StateHelper.copyState(stateToPush));
    }

    width = $('.gridGraph').width() - 10;
    height = $('.gridGraph').height() - 10;

    var currentPoint = new Point(width / 2, 100);


    // canvas = d3.select('#viz-canvas')
    //     .attr('width', width)
    //     .attr('height', height);

    var drawCurrentState = function () {
        drawState(currentStep);
        if (currentStep === (stateList.length - 1)) {
            pause();
            $('#play img').attr('src', 'https://visualgo.net/img/replay.png').attr('alt', 'replay').attr('title', 'replay');
        } else {
            $('#play img').attr('src', 'https://visualgo.net/img/play.png').attr('alt', 'play').attr('title', 'play');
        }
    }

    var drawState = function (stateIndex) {
        drawLines(stateList[stateIndex]);
        $('#status p').html(stateList[stateIndex].status);
        $('#log p').html(stateList[stateIndex].logMessage);
        highlightLine(stateList[stateIndex].lineNo);
    }

    var drawLines = function(state) {
        var vectors = state.vectors;
        for (var i = 0; i < vectors.length - 1; i++) {
            drawVector(ctx, vectors[i], 'black');
        }
    }

    this.setSelectedDrawFunction = function (f) {
        this.selectedDrawFunction = f;
    }

    this.changeDrawType = function (newDrawingFunction) {
        debugger;
        lineCollection = new Array();
        stateList = [StateHelper.createNewState(lineCollection)];
        // gw.setSelectedDrawFunction(newDrawingFunction);
        this.selectedDrawFunction = newDrawingFunction;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        $('#play').hide();
        draw();
    }

    this.draw = function (callback) {
        return this.selectedDrawFunction(callback);
    }

    var populatePseudocode = function (code) {
        var i = 1;
        for (; i <= 12 && i <= code.length; i++) {
            $("#code" + i).html(
                code[i - 1].replace(
                    /^\s+/,
                    function (m) {
                        return m.replace(/\s/g, "&nbsp;");
                    }
                )
            );
        }
        for (; i <= 12; i++) {
            $("#code" + i).html("");
        }
    }

    this.play = function (callback) {
        isPlaying = true;
        drawCurrentState();
        animInterval = setInterval(function () {
            drawCurrentState();
            if (currentStep < stateList.length - 1) {
                currentStep++;
            } else {
                clearInterval(animInterval);
                if (typeof  callback == 'function') callback();
            }
        }, transitionTime);
    }

    this.pause = function () {
        isPlaying = false;
        clearInterval(animInterval);
    }

    this.replay = function () {
        isPlaying = true;
        currentStep = 0;
        drawCurrentState();
        animInterval = setInterval(function () {
            drawCurrentState();
            if (currentStep < stateList.length - 1) {
                currentStep++;
            } else {
                clearInterval(animInterval);
            }
        }, transitionTime);
    }

    this.stop = function () {
        isPlaying = false;
        stateList = [stateList[0]];
        currentStep = 0;
        drawState(0);
        transitionTime = 500;
    }

    this.getCurrentIteration = function () {
        return currentStep;
    }

    this.getTotalIteration = function () {
        return stateList.length;
    }

    this.forceNext = function () {
        if ((currentStep + 1) < stateList.length)
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

    var left = function (x) {
        return angle -= x;
    }

    var right = function (x) {
        return angle += x;
    }

    this.kochCurve = function (callback) {
        var state = StateHelper.copyState(stateList[0]);
        var kochLevel = parseInt($('#koch-level').val().replace("&quot;", ""));

        populatePseudocode([
            'for i = 1 to 3',
            '  draw4Lines(length, kochLevel)',
            '    if (kochLevel = 0) drawLine()',
            '    else',
            '      draw4Lines(length / 3, kochLevel - 1)',
            '      turnLeft(60deg)',
            '      draw4Lines(length / 3, kochLevel - 1)',
            '      turnRight(120deg)',
            '      draw4Lines(length / 3, kochLevel - 1)',
            '      turnLeft(60deg)',
            '      draw4Lines(length / 3, kochLevel - 1)',
            '  turnRight(120deg)'
        ]);

        for (var i = 0; i < 3; i++) {
            gw.drawFourLines(state, side, kochLevel);
            right(120);
        }
        StateHelper.updateCopyPush(stateList, state);

        this.play(callback);
        return true;
    }

    this.drawFourLines = function (state, side, level) {
        if (level === 0) {
            var tmpPoint = new Point(side * Math.cos(angle * Math.PI / 180) + currentPoint.x, side * Math.sin(angle * Math.PI / 180) + currentPoint.y);
            // tmpPoint.x = Math.cos(angle * Math.PI / 180) + currentPoint.x;
            // tmpPoint.y = Math.sin(angle * Math.PI / 180) + currentPoint.y;

            var vect = new Vector(currentPoint, tmpPoint);

            lineCollection.push(vect);
            state.vectors = lineCollection;
            StateHelper.updateCopyPush(stateList, state);
            currentPoint = tmpPoint;
        } else {
            gw.drawFourLines(state, side / 3, level - 1);
            left(60);
            gw.drawFourLines(state, side / 3, level - 1);
            right(120);
            gw.drawFourLines(state, side / 3, level - 1);
            left(60);
            gw.drawFourLines(state, side / 3, level - 1);
        }
    }
}

$('#kochCurve').click(function () {
    if (!gw.isPlaying) {
        title.html('Koch Curve');
        note.html('<h1>Koch Curve (Snowflake)</h1>' +
            'The Koch snowflake (also known as the Koch curve, Koch star, or Koch island)' +
            ' is a mathematical curve and one of the earliest fractal curves to have been described.' +
            ' It is based on the Koch curve, which appeared in a 1904 paper titled "On a continuous curve without tangents,' +
            ' constructible from elementary geometry" by the Swedish mathematician Helge von Koch.');
        // stateList = [StateHelper.createNewState(lineCollection)];
        // gw.kochCurve();
        gw.changeDrawType(gw.kochCurve);
    }
    draw();
});

function draw (callback) {
    if (isPlaying) stop();
    setTimeout(function () {
        if(gw.draw(callback)) {
            isPlaying = true;
        }
    }, 1000);
}

$('#execute').click(function() {
    draw();
});