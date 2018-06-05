$(document).ready(function(){

    var count = 0;

    function addChallenge(category_name) {
        var $sel = $("<select>", {
            "id" : "challenge-select-" + count,
            "class" : "form-control",
            "name" : "challenge[" + count + "]"
        });
        var chals = challenge_categories[category_name];
        $.each(chals, function(key, value) {
            $sel.append($("<option>").attr("value", key).text(value));
        });

        var $deletebutton = $("<button>", {
            "type" : "button",
            "value" : count,
            "class" : "btn btn-danger delete-row-button",
            "style" : "padding : 6px 12px;",
            "html" : "X"
        }).click(function(e) {
            deleteChallenge(this.value);
        });
        var $deletewrap = $("<div>", { "class" : "ml-1 input-group-append" });
        $deletewrap.append($deletebutton);

        var $row = $("<div>", { "class" : "input-group mb-3" });
        $row.append($sel);
        $row.append($deletewrap);
        var $wrap = $("<li>");
        $wrap.append($row);

        $("#challenge-list").append($wrap);
        count += 1;
    }

    function deleteChallenge(index) {
        index = parseInt(index);
        $("#challenge-list li:nth-child("+(index + 1)+")").remove();
        reindexChallengeList();
    }

    function reindexChallengeList() {
        count = 0;
        $("#challenge-list").children("li").each(function() {
            var $select = $(this).find("select");
            $select.attr("id", "challenge-select-" + count)
                   .attr("name", "challenge[" + count + "]");
            var $deletebutton = $(this).find(".delete-row-button");
            $deletebutton.val(count);
            count += 1;
        });
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
        if (count < 2) {
            event.preventDefault();
            alert("A chain should contain at least 2 challenges.");
            return;
        }

        var chal_ids = [];
        for (i = 0; i < count; i++) {
            var chalid = parseInt($("#challenge-select-" + i).val());
            if (linearunlocking_used_chal_ids.indexOf(chalid) > -1) {
                event.preventDefault();
                alert("A challenge already exists in another existing chain.");
                return;
            } else if (chal_ids.indexOf(chalid) > -1) {
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
            window.location.href = window.location.href;
        });
    });
});