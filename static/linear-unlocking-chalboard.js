(function() {
    try {
        var old_renderSubmissionResponse = renderSubmissionResponse;
        renderSubmissionResponse = function (data, cb) {
            old_renderSubmissionResponse(data, cb);
            update();
        }
    } catch (err) {
        console.log('submitkey not defined');
    }

    try {
        var old_loadchals = loadchals;
        loadchals = function(cb) {
            old_loadchals(function() {
                load_linear_unlocking();
            });
        }
        if (cb){
            cb();
        }
    } catch (err) {
        console.log('loadchals not defined');
    }
})();

function load_linear_unlocking() {
    $.get(script_root + '/linearunlockings', function(data) {
        // Enable all challenge buttons first
        $(".challenge-button").prop("disabled", false).css('cursor', '');

        // Check and disable locked challenge buttons
        var linearunlockings = $.parseJSON(JSON.stringify(data));

        for (var i = linearunlockings['linearunlockings'].length - 1; i >= 0; i--) {
            lu_entry = linearunlockings['linearunlockings'][i];
            var wrapperid = lu_entry.chalname.replace(/ /g,"-").hashCode();
            var reqid = lu_entry.requires_chalid;

            // Disable challenges whose prerequisite is not solved yet
            if (reqid != -1 && user_solves.indexOf(reqid) == -1) {
                $("#" + wrapperid + " button").prop("disabled", true).css('cursor', 'not-allowed');
            }
        }
    });
}