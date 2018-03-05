var title = document.getElementById('title');

var note = document.getElementById('noteContent');

$('#title-BK').click(function () {


    title.innerHTML = "Eight Queens Puzzle";
    note.innerHTML = '<h1>Backtracking</h1><br/>';
    note.innerHTML += "<div>Backtracking is a general algorithm for finding all (or some) solutions to some computational " +
        "problems, notably constraint satisfaction problems, that incrementally builds candidates to the solutions, and abandons" +
        " each partial candidate as soon as it determines that the candidate cannot possibly be completed to a valid solution.</div>";
});


$(function () {
    var all_modes = ["BK"];
    $('#title-'+all_modes[Math.floor(Math.random()*1)]).click();

});

function init() {
    document.getElementById('highlight').style.visibility = 'hidden';
    for (var i = 0; i < 8; i++) {
        var id = "queen" + i;
        document.getElementById(id).style.visibility = 'hidden';
    }
    draw();

    init1();
}

function draw() {
    var count = 0;
    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
            id = 'cell' + i + j;
            // document.write(id.toString());
            document.getElementById(id).style.top = (i + 1) * 40 + 30 + "px";
            document.getElementById(id).style.left = (j + 1) * 40 + "px";
            if (count++ % 2 == 0)
                document.getElementById(id).style.backgroundColor = "green";
            else
                document.getElementById(id).style.backgroundColor = "lightGray";
        }
        count++;
    }
}

var k = 0;
var queens = [-1, -1, -1, -1, -1, -1, -1, -1];

/** Search for a solution */
function search() {
    // k - 1 indicates the number of queens placed so far
    // We are looking for a position in the kth row to place a queen

    // Find a position to place a queen in the kth row
    var j = findPosition(k);
    if (j < 0) {
        displayQueens();
        document.getElementById('highlight').style.visibility = 'visible';
        document.getElementById('highlight').style.top = y + (k) * 40 + "px";
        document.getElementById('highlight').style.left = x + "px";

        queens[k] = -1;
        k--; // back track to the previous row
        resetPseudoCode();

        document.getElementById('status').innerHTML
            = "<p style='font-size: 15px'>No queen can be placed in row " + (k + 2)
            + " -> Backtrack to the row " + (k + 1) + "</p>";
        $('#code1').html('');
        $('#code2').html('while (row != 8)');
        $('#code3').html('&nbsp&nbsp; FindPosition(k){');
        $('#code4').html('&nbsp&nbsp; if (!isValid(row, column)');
        $('#code5').html('&nbsp;&nbsp; row--;');
        $('#code6').html('goBack();');
        $('#code7').html('}');

        $("#code5").css("background-color", "black");
        $("#code5").css("color", "white");
        $("#code6").css("background-color", "black");
        $("#code6").css("color", "white");
    } else {
        queens[k] = j;
        k++;
        displayQueens();
        if (k == 8) {
            resetPseudoCode();
            document.getElementById('status').innerHTML
                = "<p style='font-size: 15px'>A solution is found.</p>" +
                "";
            $('#code1').html('');
            $('#code2').html('while (row != 8)');
            $('#code3').html('&nbsp&nbsp; FindPosition(k){');
            $('#code4').html('&nbsp&nbsp; if (!isValid(row, column)');
            $('#code5').html('&nbsp;&nbsp; row--;');
            $('#code6').html('goBack();');
            $('#code7').html('}');

            $("#code7").css("background-color", "black");
            $("#code7").css("color", "white");
        }
        else {
            resetPseudoCode();
            document.getElementById('status').innerHTML
                = "<p style='font-size: 15px'>A queen is placed in row " + k +"</p>";
            $('#code1').html('');
            $('#code2').html('while (row != 8)');
            $('#code3').html('&nbsp&nbsp; FindPosition(k){');

            $("#code3").css("background-color", "black");
            $("#code3").css("color", "white");

            $('#code4').html('&nbsp&nbsp; if (!isValid(row, column)');
            $('#code5').html('&nbsp;&nbsp; row--;');
            $('#code6').html('goBack();');
            $('#code7').html('}');
        }
    }
}

function findPosition(k) {
    var start = queens[k] + 1; // Search for a new placement

    for (var j = start; j < 8; j++) {
        if (isValid(k, j))
            return j; // (k, j) is the place to put the queen now
    }

    return -1;
}

/** Return true if a queen can be placed at (row, column) */
function isValid(row, column) {
    for (var i = 1; i <= row; i++)
        if (queens[row - i] == column // Check column
            || queens[row - i] == column - i // Check upleft diagonal
            || queens[row - i] == column + i) // Check upright diagonal
            return false; // There is a conflict
    return true; // No conflict
}

var myInterval;
function start() {
    if(k != 8){
        myInterval = setInterval(function(){
            next();
        }, 500);
    }

}

function pause(){
    clearInterval(myInterval);
}

function goToEnd(){
    while(k != 8){
        next();
    }
}


function next() {
    if (k == 8) {
        document.getElementById('status').innerHTML
            = "<p style='font-size: 15px'>A solution is already found. Click Restart to start over.</p>"
            ;
    }
    search();
//          displayQueens();
}

function restart() {
    document.getElementById('status').innerHTML
        = "";
    k = 0;
    queens = [-1, -1, -1, -1, -1, -1, -1, -1];
    displayQueens();
    document.getElementById('highlight').style.visibility = 'hidden';
}

function displayQueens() {
    document.getElementById('highlight').style.visibility = 'visible';
    document.getElementById('highlight').style.top = y + (k - 1) * 40 + "px";
    document.getElementById('highlight').style.left = x + "px";

    for (var i = 0; i < k; i++) {
        var id = 'queen' + i;
        document.getElementById(id).style.top = y + (i + 0) * 40 + "px";
        document.getElementById(id).style.left = x + (queens[i] + 0) * 40 + "px";
        document.getElementById(id).style.visibility = "visible";
    }

    for (var i = k < 0 ? 0 : k; i < 8; i++) {
        var id = 'queen' + i;
        document.getElementById(id).style.visibility = "hidden";
    }
}

function init1() {
    posLoc = getElementPos(document.getElementById('program'));
    x = posLoc.x;
    y = posLoc.y;

    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
            var id = 'cell' + i + j;
//                document.getElementById(id).style.visibility = "hidden";
            document.getElementById(id).style.top = y + j * 40 + "px";
            document.getElementById(id).style.left = x + i * 40 + "px";

        }
    }


}

function resetPseudoCode(){
    $("#code1").css("background-color", "white");
    $("#code1").css("color", "black");
    $("#code2").css("background-color", "white");
    $("#code2").css("color", "black");
    $("#code3").css("background-color", "white");
    $("#code3").css("color", "black");
    $("#code4").css("background-color", "white");
    $("#code4").css("color", "black");
    $("#code5").css("background-color", "white");
    $("#code5").css("color", "black");
    $("#code6").css("background-color", "white");
    $("#code6").css("color", "black");
    $("#code7").css("background-color", "white");
    $("#code7").css("color", "black");
}