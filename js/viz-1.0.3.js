var mode = "exploration";
var codetraceColor = 'white';
actionsWidth = 0;

function highlightLine(lineNumbers) {
    $('#codetrace p').css('background-color', 'white').css('color', 'black');
    if (lineNumbers instanceof Array) {
        for (var i = 0; i < lineNumbers.length; i++)
            if (lineNumbers[i] != 0)
                $('#code' + lineNumbers[i]).css('background-color', 'black').css('color', 'white');
    }
    else
        $('#code' + lineNumbers).css('background-color', 'black').css('color', 'white');
}

var isPlaying = false;
var cur_slide = null;
var last_click = 0;

function isActionsOpen() {
    return $('#actions-hide img').hasClass('rotateRight');
}

function isStatusOpen() {
    return $('#status-hide img').hasClass('rotateRight');
}

function isCodetraceOpen() {
    return $('#codetrace-hide img').hasClass('rotateRight');
}

function showActionsPanel() {
    if (!isActionsOpen()) {
        $('#actions-hide img').removeClass('rotateLeft').addClass('rotateRight');
        $('#actions').animate({width: "+=" + actionsWidth,});
    }
}

function hideActionsPanel() {
    if (isActionsOpen()) {
        $('#actions-hide img').removeClass('rotateRight').addClass('rotateLeft');
        $('#actions').animate({width: "-=" + actionsWidth,});
    }
}

function showStatusPanel() {
    if (!isStatusOpen()) {
        $('#status-hide img').removeClass('rotateLeft').addClass('rotateRight');
        $('#current-action').show();
        $('#status').animate({width: "+=" + statusCodetraceWidth,});
    }
}

function hideStatusPanel() {
    if (isStatusOpen()) {
        $('#status-hide img').removeClass('rotateRight').addClass('rotateLeft');
        $('#current-action').hide();
        $('#status').animate({width: "--=" + statusCodetraceWidth,});
    }
}

function showCodetracePanel() {
    if (!isCodetraceOpen()) {
        $('#codetrace-hide img').removeClass('rotateLeft').addClass('rotateRight');
        $('#codetrace').animate({width: "+=" + statusCodetraceWidth,});
    }
}

function hideCodetracePanel() {
    if (isCodetraceOpen()) {
        $('#codetrace-hide img').removeClass('rotateRight').addClass('rotateLeft');
        $('#codetrace').animate({width: "-=" + statusCodetraceWidth,});
    }
}

function triggerRightPanels() {
    hideEntireActionsPanel();
    showStatusPanel();
    showCodetracePanel();
}

function extractQnGraph(graph) {
    var vList = graph.internalAdjList;
    var eList = graph.internalEdgeList;
    for (var key in vList) {
        var temp;
        var v = vList[key];
        temp = v.cxPercentage;
        v.cxPercentage = v.cx;
        v.cx = (temp / 100) * MAIN_SVG_WIDTH;
        temp = v.cyPercentage;
        v.cyPercentage = v.cy;
        v.cy = (temp / 100) * MAIN_SVG_HEIGHT;
    }
    return graph;
}

function closeSlide(slide, callback) {
    if (typeof slide == 'undefined' || slide == null) {
        if (typeof callback == "function") callback();
        return
    }
    lectureDropdownSelect = $('#electure-dropdown');
    $(".menu-highlighted").removeClass("menu-highlighted");
    $('.electure-dialog#electure-' + slide).fadeOut(100, function () {
        var lectureDropdownSelect = $('#electure-dropdown');
        lectureDropdownSelect.detach();
        lectureDropdownSelect.appendTo('#dropdown-temp-holder');
        if (typeof callback == "function") callback();
    })
}

function canContinue() {
    var this_click = (new Date()).getTime();
    if ((this_click - last_click) < 200) return false;
    last_click = this_click;
    return true;
}

function openSlide(slide, callback) {
    mode = 'e-Lecture';
    isPlaying = false;
    if (typeof gw != 'undefined' && gw != null && typeof gw.stop == 'function' && isPlaying) {
        try {
            gw.stop();
        }
        catch (err) {
        }
    }
    if (!canContinue()) return;
    closeSlide(cur_slide, function () {
        cur_slide = slide;
        var lectureDropdownSelect = $('#electure-dropdown');
        lectureDropdownSelect.detach();
        lectureDropdownSelect.appendTo('.electure-dialog#electure-' + cur_slide);
        $('select.lecture-dropdown').val(cur_slide);
        $('.electure-dialog#electure-' + cur_slide).fadeIn(100, function () {
            if (typeof callback == "function") callback();
        });
    });
    setTimeout(function () {
        $('select.lecture-dropdown').focus();
    }, 150);
}

function initUI() {
    var actionsHeight = ($('#actions p').length) * 27 + 10;
    $('#actions').css('height', actionsHeight);
    $('#actions').css('width', actionsWidth);
    var actionsHideTop = Math.floor((actionsHeight - 16) / 2);
    var actionsHideBottom = (actionsHeight - 16) - actionsHideTop;
    $('#actions-hide').css('padding-top', actionsHideTop);
    $('#actions-hide').css('padding-bottom', actionsHideBottom);
    $('#current-action').hide();
    $('#actions-hide img').addClass('rotateRight');
    $('.electure-end').css("background-color", surpriseColour);
    $('.electure-prev').css("background-color", surpriseColour);
    $('.electure-next').css("background-color", surpriseColour);
    $('#hide-popup').css('background-color', surpriseColour);
    $('#progress-bar .ui-slider-range').css("background-color", surpriseColour);
    $('#actions').css("background-color", colourTheSecond);
    $('#actions-hide').css("background-color", colourTheSecond);
    $('.action-menu-pullout').css('left', actionsWidth + 43 + 'px');
    $('.action-menu-pullout').children().css('float', 'left');
    $('.coloured-menu-option').css("background-color", colourTheSecond).css('color', 'white');
    $('#codetrace').css("background-color", colourTheThird);
    $('#codetrace-hide').css("background-color", colourTheThird);
    if (colourTheThird == '#fec515' || colourTheThird == '#a7d41e') {
        $('#codetrace').css('color', 'black');
        var imgUrl = $('#codetrace-hide img').attr('src');
        if (imgUrl) {
            $('#codetrace-hide img').attr('src', imgUrl.replace('white', 'black'));
        }
        codetraceColor = 'black';
    }
    $('#status').css("background-color", colourTheFourth);
    $('#status-hide').css("background-color", colourTheFourth);
    if (colourTheFourth == '#fec515' || colourTheFourth == '#a7d41e') {
        $('#status').css('color', 'black');
        var imgUrl = $('#status-hide img').attr('src');
        if (imgUrl) {
            $('#status-hide img').attr('src', imgUrl.replace('white', 'black'));
        }
    }
}


var isPaused = false;

function isAtEnd() {
    return (gw.getCurrentIteration() == (gw.getTotalIteration() - 1));
}


function pause() {
    if (isPlaying) {
        isPaused = true;
        gw.pause();
        $('#play').show();
        $('#pause').hide();
    }
}

function play() {
    if (isPlaying) {
        isPaused = false;
        $('#pause').show();
        $('#play').hide();
        if (isAtEnd())
            gw.replay(); else
            gw.play();
    }
}

function stepForward() {
    if (isPlaying) {
        pause();
        gw.forceNext(250);
    }
}

function stepBackward() {
    if (isPlaying) {
        pause();
        gw.forcePrevious(250);
    }
}

function goToBeginning() {
    if (isPlaying) {
        gw.jumpToIteration(0, 0);
        pause();
    }
}

function goToEnd() {
    if (isPlaying) {
        gw.jumpToIteration(gw.getTotalIteration() - 1, 0);
        pause();
    }
}

function stop() {
    try {
        gw.stop();
    }
    catch (err) {
    }
    isPaused = false;
    isPlaying = false;
    $('#pause').show();
    $('#play').hide();
}


$('#status').bind("DOMSubtreeModified",function(){

    $('#console').prepend($('#status').html());

});

function clearConsole(callback) {
    $('#console').html('');
}

function removeFirstLine(){
    $('#console').find('p').first().remove();
    $('#console').find('p').first().remove();
    $('#console').find('p').first().remove();
    $('#console').find('p').first().remove();
}


function checkPlay(){
    if (isAtEnd()){
        clearConsole();
    }
}

function checkEnd(){
    if (!isAtEnd()){
        goToEnd();
    }
}
