Explore = {
    num_reviewed: 0
};

/* TODO List:
 * - Progress check
 *   - number of clicks
 *   - total budget
 * - Number readability
 * - Crawling, DB merge
 */

Explore.pass = function(msg, old_id) {
    var item = $("#data-candidate-"+old_id);
    item.empty();
    item.attr('data-candidate-id', msg._id);
    item.attr('id', 'data-candidate-'+msg._id);
    var new_candidate = '<strong>' + msg.service
        + '</strong><br />'
        + '<span class="explore-category" style="margin-top: 5px;">'
        + msg.one + '&nbsp; &gt; &nbsp;'
        + msg.three + '</span>'
        + '<div style="text-align: right"><span class="explore-department">'
        + msg.department + '&nbsp;'
        + msg.team + '</span><br /><span class="explore-budget">'
        + Explore.format(msg.budget)
        + ' 원</span></div>'
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
    $("#data-candidate-"+msg._id+" #btn-related").click(function() {
        var issue_id = $("#issue-list-title strong").attr("data-issue-id");
        var service_id = $(this).parent().parent().parent().attr("data-candidate-id");
        Explore.num_reviewed++;
        $("#num_reviewed").text(Explore.num_reviewed);
        console.log(Explore.num_reviewed);
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
        $("#num_reviewed").text(Explore.num_reviewed);
        console.log(Explore.num_reviewed);
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

Explore.format = function(budget) {
    var val;
    if ((val = Math.floor(budget/100000000000)) > 0) {
        var rest = budget-val*1000000000000;
        return val + "조 " + Math.floor(rest/100000000) + "억원";
    }
    val = Math.floor(budget/10000000);
    var rest = budget-val*10000000;
    return val + "억 " + Math.floor(rest/10000) + "만원";
}
