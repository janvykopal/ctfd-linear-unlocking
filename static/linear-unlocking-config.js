$(document).ready(function(){

    var count = 0;
    function addChallenge(category_name) {
        var $sel = $("<select>", {
            "id" : "challenge-select-" + count,
            "class" : "form-control mb-3",
            "name" : "challenge[" + count + "]"
        });
        var chals = challenge_categories[category_name];
        $.each(chals, function(key, value) {
            $sel.append($("<option>").attr("value", key).text(value));
        });
        $("#challenge-list").append($sel);
        count += 1;
    }

    function resetChallengeList(category_name) {
        $("#challenge-list").empty();
        count = 0;
        addChallenge(category_name);
        addChallenge(category_name);
        $("#add-challenge-button").val(category_name);
    }
    
    $("#category-select").val("--");
    $("#category-select").change(function() {
        if (this.value === "--") {
            $("#linear_unlocking_create_form").hide();
            return;
        }
        resetChallengeList(this.value);
        $("#linear_unlocking_create_form").show();
    });

    $("#add-challenge-button").click(function() {
        addChallenge(this.value);
    });

    $("#linear_unlocking_create_form").submit(function(event) {
        var chal_ids = [];
        for (i = 0; i < count; i++) {
            var chalid = $("#challenge-select-" + i).val();
            if ($.inArray(chalid, chal_ids) > -1) {
                event.preventDefault();
                alert("Duplicate challenges are not allowed in a single chain.");
                return;
            } else {
                chal_ids.push(chalid);
            }
        }
    });

    $(".toggle_hide").click(function(e) {
        e.preventDefault();
        e.stopPropagation();

        var hide = $(this).is(":checked");
        $.post( script_root + '/admin/plugins/linear-unlocking/toggle-hide', 
                { "lu_id":this.value, "is_hide":hide, "nonce":$("#nonce").val() }, 
                function(data) 
        {
            location.reload(true);
        });
    });
});