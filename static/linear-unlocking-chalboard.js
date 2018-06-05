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
        loadchals = function(cb) {
            new_loadchals(function() {
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

function new_loadchals(cb) {
    $.get(script_root + "/chals", function (data) {
        var categories = [];
        var chainids = [];
        challenges = $.parseJSON(JSON.stringify(data));

        $('#challenges-board').empty();

        for (var i = 0; i <= challenges['game'].length - 1; i++) {
            var chalinfo = challenges['game'][i];
            chalinfo.solves = 0;

            if ($.inArray(chalinfo.category, categories) == -1) {
                var category = chalinfo.category;
                categories.push(category);

                var categoryid = category.replace(/ /g,"-").hashCode();
                var categoryrow = $('' +
                    '<div id="{0}-row" class="pt-5">'.format(categoryid) +
                        '<div class="category-header col-md-12 mb-3">' +
                        '</div>' +
                        '<div class="category-challenges col-md-12">' +
                            '<div class="challenges-row col-md-12"></div>' +
                        '</div>' +
                    '</div>');
                categoryrow.find(".category-header").append($("<h3>"+ category +"</h3>"));

                $('#challenges-board').append(categoryrow);
            }

            var chainid = chalinfo.chainid;
            var catid = chalinfo.category.replace(/ /g,"-").hashCode();
            if ($.inArray(catid + chainid, chainids) == -1) {
                chainids.push(catid + chainid);
                var chainname = chainid >= 0 ? chalinfo.chainname : "";

                var chainrow = $("<div>", {
                    "id" : chainid + "-chain-row",
                    "class" : "row",
                    "style" : "align-items:center;",
                });
                var chainrowlabel = $("<p>", {
                    "class" : "col-md-1 p-0 text-right",
                    "html" : chainname,
                });
                var chalbuttonswrap = $("<div>", {
                    "class" : "chal-buttons col-md-11 p-0",
                });
                
                chainrow.append(chainrowlabel);
                chainrow.append(chalbuttonswrap);
                $("#"+ catid +"-row").find(".category-challenges > .challenges-row").append(chainrow).append("<hr>");
            }
        }

        for (var i = 0; i <= challenges['game'].length - 1; i++) {
            var chalinfo = challenges['game'][i];
            var challenge = chalinfo.category.replace(/ /g,"-").hashCode();
            var chalid = chalinfo.name.replace(/ /g,"-").hashCode();
            var catid = chalinfo.category.replace(/ /g,"-").hashCode();
            var chainid = chalinfo.chainid;
            var chalwrap = $("<div id='{0}' class='col-md-3 d-inline-block'></div>".format(chalid));

            if (user_solves.indexOf(chalinfo.id) == -1){
                var chalbutton = $("<button class='btn btn-dark challenge-button w-100 text-truncate pt-3 pb-3 mb-2' value='{0}'></button>".format(chalinfo.id));
            } else {
                var chalbutton = $("<button class='btn btn-dark challenge-button solved-challenge w-100 text-truncate pt-3 pb-3 mb-2' value='{0}'><i class='fas fa-check corner-button-check'></i></button>".format(chalinfo.id));
            }

            var chalchainposition = $("<span>{0}</span>".format(chalinfo.chainposition + "."));
            var chalheader = $("<p>{0}</p>".format(chalinfo.name));
            var chalscore = $("<span>{0}</span>".format(chalinfo.value));
            for (var j = 0; j < chalinfo.tags.length; j++) {
                var tag = 'tag-' + chalinfo.tags[j].replace(/ /g, '-');
                chalwrap.addClass(tag);
            }

            if (chainid > -1)
                chalbutton.append(chalchainposition);
            chalbutton.append(chalheader);
            chalbutton.append(chalscore);
            chalwrap.append(chalbutton);

            $("#"+ catid +"-row").find(".category-challenges > .challenges-row > #" + 
                                        chainid + "-chain-row > .chal-buttons").append(chalwrap);
        };

        // marksolves();

        $('.challenge-button').click(function (e) {
            loadchal(this.value);
        });

        if (cb){
            cb();
        }
    });
}