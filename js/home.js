var PHP_DOMAIN = "";






function commonAction(retval, msg) {
    //setTimeout(function() {
    if (retval) { // mode == "exploration" && // now not only for exploration mode, but check if this opens other problems
        $('#current-action').show();
        $('#current-action').html(mode == "exploration" ? msg : ("e-Lecture Example (auto play until done)<br>" + msg));
        $('#progress-bar').slider("option", "max", gw.getTotalIteration() - 1);
        isPlaying = true;
    }
    //}, 500);
}

function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable)
            return decodeURIComponent(pair[1]);
    }
    return "";
}



