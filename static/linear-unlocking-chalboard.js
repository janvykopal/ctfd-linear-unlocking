function updatesolves(cb){
    $.get(script_root + '/chals/solves', function (data) {
        var solves = $.parseJSON(JSON.stringify(data));
        var chalids = Object.keys(solves);

        for (var i = 0; i < chalids.length; i++) {
            for (var z = 0; z < challenges['game'].length; z++) {
                var obj = challenges['game'][z];
                var solve_cnt = solves[chalids[i]];
                if (obj.id == chalids[i]){
                    if (solve_cnt) {
                        obj.solves = solve_cnt;
                    } else {
                        obj.solves = 0;
                    }
                }
            }
        };
        
        load_user_solves(function () {
            load_linear_unlocking();
        });

        if (cb) {
            cb();
        }
    });
}

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