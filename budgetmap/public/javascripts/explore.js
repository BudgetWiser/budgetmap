Explore = {
    max_reviewed: 50,
    num_reviewed: 0,
    num_related: 0,
    num_unrelated: 0,
    budget_reviewed: 0,
    budget_related: 0,
    budget_unrelated: 0,
    hints_list: [],
    hint_generator: 0,
    hint_threshold: 7,
};

Explore.pass = function(msg, old_id) {
    var item = $("#data-candidate-"+old_id);
    item.empty();
    item.attr('data-candidate-id', msg._id);
    item.attr('id', 'data-candidate-'+msg._id);
    var new_candidate = '<p><strong style="color: #08298A; cursor: pointer;">'
        + '<a href="'+Explore.searchUrl(msg.service)+'" target="_blank">'
        + msg.service + '</a></strong></p>'
        + '<div id="candidate-detail" style="text-align: right; color: #848484">'
        + '<p><span class="explore-category" style="margin-top: 5px;">'
        + msg.one + '&nbsp; &gt; &nbsp;'
        + msg.three + '</span></p>'
        + '<p><span class="explore-department">'
        + msg.department + '&nbsp;'
        + msg.team + '</span></p>'
        + '<p><span class="explore-budget">'
        + Explore.format(msg.budget)
        + ' 원</span></p></div>'
        + '<div class="btn-group btn-group-justified" style="margin-top: 10px;">'
        + '<div class="btn-group">'
        + '<button type="submit" class="btn btn-default" id="btn-related" style="font-size: 12px;">'
        + '관련 있음</button></div>'
        + '<div class="btn-group">'
        + '<button type="submit" class="btn btn-default" id="btn-pass" style="font-size: 12px;">'
        + '모르겠음</button></div>'
        + '<div class="btn-group">'
        + '<button type="submit" class="btn btn-default" id="btn-unrelated" style="font-size: 12px;">'
        + '관련 없음</button></div></div></div>';
    item.html(new_candidate);

    Explore.treemap.drawBorder(msg.three);

    if (Explore.num_reviewed == Explore.max_reviewed) {
        alert("권장 목표를 모두 달성하였습니다! 찾아주신 사업은 연구자료로 소중히 사용됩니다.  감사합니다!");
        if (confirm("다음 권장 목표에 도전하시겠습니까")) {
            Explore.max_reviewed *= 2;
            $("#max_reviewed").text(Explore.max_reviewed)
        } else {
            $("#max_reviewed").text(Explore.max_reviewed.toString()+"(달성)");
        }
    }


    $("#data-candidate-"+msg._id+" #btn-related").click(function() {
        var issue_id = $("#issue-list-title strong").attr("data-issue-id");
        var service_id = $(this).parent().parent().parent().attr("data-candidate-id");
        Explore.num_reviewed++;
        Explore.num_related++;
        Explore.budget_reviewed += msg.budget;
        Explore.budget_related += msg.budget;
        Explore.hint_generator = 0;
        $("#num_reviewed").text(Explore.num_reviewed);
        $("#num_related").text(Explore.num_related);
        $("#budget_reviewed").text(Explore.format(Explore.budget_reviewed));
        $("#budget_related").text(Explore.format(Explore.budget_related));
        $.ajax({
            type: 'POST',
            url: "/explore/related",
            data: {
                issue: issue_id,
                service: service_id
            },
        }).done(function (msg) {
            Explore.pass(msg, service_id);
        });
    });
    $("#data-candidate-"+msg._id+" #btn-unrelated").click(function() {
        var issue_id = $("#issue-list-title strong").attr("data-issue-id");
        var service_id = $(this).parent().parent().parent().attr("data-candidate-id");
        Explore.num_reviewed++;
        Explore.num_unrelated++;
        Explore.budget_reviewed += msg.budget;
        Explore.budget_unrelated += msg.budget;
        Explore.hint_generator += Math.random();
        $("#num_reviewed").text(Explore.num_reviewed);
        $("#num_unrelated").text(Explore.num_unrelated);
        $("#budget_reviewed").text(Explore.format(Explore.budget_reviewed));
        $("#budget_unrelated").text(Explore.format(Explore.budget_unrelated));

        if (Explore.hint_generator > Explore.hint_threshold) {
            Explore.hint_generator = 0;
            var rand_idx = Math.floor(Math.random() * Explore.hints_list.length);
            var hint_id = Explore.hints_list[rand_idx];
            delete Explore.hints_list[rand_idx];
            $.ajax({
                type: 'POST',
                url: "/explore/pass",
                data: {
                   'hint': hint_id
                },
            }).done(function(msg) {
                Explore.pass(msg, service_id);
            });
        } else {
            $.ajax({
                type: 'POST',
                url: "/explore/unrelated",
                data: {
                    issue: issue_id,
                    service: service_id
                },
            }).done(function(msg) {
                Explore.pass(msg, service_id);
            });
        }
    });
    $("#data-candidate-"+msg._id+" #btn-pass").click(function() {
        var old_id = $(this).parent().parent().parent().attr("data-candidate-id");
        $.ajax({
            type: 'GET',
            url: "/explore/pass",
        }).done(function(msg) {
            Explore.pass(msg, old_id);
        });
    });
};

Explore.format = function(budget, depth) {
    if (arguments.length == 1) {
        depth = 2;
    }
    depth--;
    if (depth < 0)
        return "만";
    var val;
    if ((val = Math.floor(budget/1000000000000)) > 0) {
        var rest = budget-val*1000000000000;
        return val + "조 " + Explore.format(rest, depth);
    } else if ((val = Math.floor(budget/100000000)) > 0) {
        var rest = budget-val*100000000;
        return val + "억 " + Explore.format(rest, depth);
    } else if ((val = Math.floor(budget/10000000))> 0) {
        var rest = budget-val*10000000;
        return val + "천" + Explore.format(rest, depth);
    }
    return budget == 0 ? "": Math.floor(budget/10000) + "만";
};

Explore.searchUrl = function(name) {
                return 'http://opengov.seoul.go.kr/search?sortField=RANK&page=0&searchTarget=section&viewCount=100&isDetailSearch=0&isInitKeyword=0&depth=1&isAll=1&s-category=section&searchKeyword='
                + name + '&srcField%5B%5D=ALL&srcField%5B%5D=TITLE&srcField%5B%5D=CONTENT&srcField%5B%5D=DEPT_NM%2CWRITER&srcField%5B%5D=KWRD&srcField%5B%5D=ATTACH_NM&option=reSearch';
}
