function load_user_solves(cb){
    $.get(script_root + '/solves', function(data) {
        var solves = $.parseJSON(JSON.stringify(data));

        for (var i = solves['solves'].length - 1; i >= 0; i--) {
            var chal_id = solves['solves'][i].chalid;
            user_solves.push(chal_id);

        }
        if (cb) {
            cb();
        }

        load_linear_unlocking();
    });
}

function load_linear_unlocking() {
    $.get(script_root + '/linearunlockings', function(data) {
        var linearunlockings = $.parseJSON(JSON.stringify(data));

        for (var i = linearunlockings['linearunlockings'].length - 1; i >= 0; i--) {
            lu_entry = linearunlockings['linearunlockings'][i];
            var wrapperid = lu_entry.chalname.replace(/ /g,"-").hashCode();
            var reqid = lu_entry.requires_chalid;

            // Disable challenges whose prerequisite is not solved yet
            if (reqid != -1 && user_solves.indexOf(reqid) == -1) {
                $("#"+wrapperid + " button").prop("disabled", true).css('cursor', 'not-allowed');
            }
        }
    });
}