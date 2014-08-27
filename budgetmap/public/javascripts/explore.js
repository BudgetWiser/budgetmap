Explore = {};

Explore.pass = function(msg, old_id) {
    console.log(old_id);
    var item = $("#data-candidate-"+old_id);
    item.empty();
    item.attr('data-candidate-id', msg._id);
    item.attr('id', 'data-candidate-'+msg._id);
    console.log(msg.budget);
    var new_candidate = '<strong>' + msg.service
        + '</strong><br />'
        + '<span class="explore-category" style="margin-top: 5px;">'
        + msg.one + '&nbsp; &gt; &nbsp;'
        + msg.three + '</span>'
        + '<div style="text-align: right"><span class="explore-department">'
        + msg.department + '&nbsp;'
        + msg.team + '</span><br /><span class="explore-budget">'
        + msg.budget.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
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
        var old_id = $(this).parent().parent().parent().attr("data-candidate-id");
        $.ajax({
            type: 'POST',
            url: "/explore/related",
            data: {
            },
        }).done(function(msg) {
            Explore.pass(msg, old_id);
        });
    });
    $("#data-candidate-"+msg._id+" #btn-unrelated").click(function() {
        var old_id = $(this).parent().parent().parent().attr("data-candidate-id");
        $.ajax({
            type: 'GET',
            url: "/explore/pass",
        }).done(function(msg) {
            Explore.pass(msg, old_id);
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
