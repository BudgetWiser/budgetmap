Issue = {};

Issue.listIssues = function(budget_item) {
    $("#issue-list").empty()
    if (!budget_item) {
        var issue_html = '<div id="issue-list"><h3>시민들이 생각하는 서울시 예산 이슈</h3>';
        $.getJSON("/issue/list", function(data) {
            var issues = [];
            for (var i in data) {
                issues[data[i].name] = data[i]._budget_ids;
                issue_html += '<span class="issue-title" id="' + data[i]._id 
                    + '">' + data[i].name.slice(0, 20) + '</span>';
            }
            issue_html += '<div id="budget-issue-relation"></div></div>';
            $("#issue-list").append(issue_html).hide().fadeIn(200);
            Issue.relateBudget(issues);
        });
    } else {
        var issue_query = budget_item.category1 + budget_item.category2 + budget_item.name + budget_item.year;
        var issue_html = '<div id="issue-list"><h3>' + budget_item.name + '</h3>';
        $.getJSON("/issue/" + issue_query, function(data) {
            var issues = [];
            if (data.length) {
                for (var i in data) {
                    issues[data[i].name] = data[i]._budget_ids;
                    issue_html += '<span class="issue-title" id="' + data[i]._id
                        + '">' + data[i].name.slice(0, 20) + '</span>';
                }
            } else {
                issue_html += '<span>아직 연결된 이슈가 없습니다.</span><br />'
                    + '<button id="relate-issue">이슈 추가하기</button>';
            }
            issue_html += '<div id="budget-issue-relation"></div></div>';
            $("#issue-list").append(issue_html).hide().fadeIn(200);
            $("#relate-issue").bind('click', function() {
                $("#accordion").accordion("option", "active", 0);
                $("#issue").focus();
            });
            Issue.relateBudget(issues);
        });
    }
};

Issue.relateBudget = function(issues) {
    $(".issue-title").each(function() {
        $(this).bind('click', function() {
            document.getElementById("query").value = $(this).text();
        });
        /*
         * TODO: Show other budget categories related to this issue.
        $(this).bind('click', function() {
            $("#budget-issue-relation").empty();
            if (Budget.list) {
                var relation_html = '<h3>' + $(this).text() + ' 와 관련된 예산 분류</h3>';
                var budget_id_list = issues[$(this).text()];
                if (!budget_id_list) {
                    relation_html += '<span>아직 연결된 예산이 없습니다.</span><br />'
                        + '<button id="relate-budget">예산 연결하기</button>';
                } else {
                    for (var i in budget_id_list) {
                        relation_html += '<span class="budget-title">'
                            + Budget.list[budget_id_list[i]] + '</span>';
                    }
                }
                $("#budget-issue-relation").hide().append(relation_html).fadeIn(200);
                    + '<button>이슈 연결하기</button>';
                $("#relate-budget").bind('click', function() {
                    $("#accordion").accordion("option", "active", 0);
                    $("#issue").focus();
                });
            } else {
                alert("페이지 로딩이 완료되지 않았습니다 ㅜㅜ. 조금만 기다려주세요");
            }
        });
        */
    });
};

Issue.addIssue = function(event){
    event.preventDefault(); //
    //input validation
    if ($('#issue').val() == '') {
        alert('이슈를 입력해야합니다!');
        return;
    }
    $.post(
        $("#add_issue").attr("action"),
        $("#add_issue").serialize(),
        function(res){
            if (res.success) {
                $("#add_issue_success").show().delay(1000).fadeOut();
                $("#btn-add-issue").hide().delay(1500).fadeIn().delay(1000);
                $("#btn-reset-issue").hide().delay(1500).fadeIn().delay(1000);
                $("#issue").val('');
                Issue.listIssues(selected_budget);
            } else {
                alert(res.errcode);
            }
        }
    );        
    
    Issue.autocomplete();
};

Issue.autocomplete = function() {
    $.getJSON("/issue/list", function(data) {
        var issue_names = [];
        for (var i in data) {
            issue_names.push(data[i]['name']);
        }
        $('#issue').autocomplete({
            source: issue_names
        });    
    });
};

Issue.search = function(event, query) {
    event.preventDefault();

    if (query) {
        $("#query").val(query);
    }
    if ($("#query").val() == '') {
        alert("검색어를 입력해주세요!");
        return;
    }
    $.post(
        $("#search-issue").attr("action"),
        $("#search-issue").serialize(),
        function(res) {
            if (res.success) {
                $("#search-result").empty();
                var result = res.result.results;
                var search_result = '<span id="search-summary">"'+$("#query").val()+'"에 대한 '+result.length+'개의 검색 결과:</span><br />';
                if (selected_budget) {
                    var c_1 = selected_budget.category1;
                    var c_2 = selected_budget.category2;
                    var c_3 = selected_budget.name;
                    var rel = [];
                    for (var i in result) {
                        if (result[i].category_one === c_1 && result[i].category_two === c_2 && result[i].category_three === c_3) {
                            rel.push(result[i]);
                            result.splice(i, 1);
                        }
                    }
                    if (rel.length) {
                        search_result += '<span>"'+c_1+' > '+c_2+' > '+name+'"에 관련된 '+rel.length+'개의 검색 결과:</span><br />'
                            + '<div id="related-services">';
                        for (var i in rel) {
                            search_result += '<div class="search-result">'
                                + '<span class="search-result-category">'+rel[i].category_one+' > '
                                    + rel[i].category_two+' > '+rel[i].category_three+'</span><br />'
                                + '<span class="search-result-service">'+rel[i].service+' ('+rel[i].year+')'+'</span>'
                                + '</div>';
                        }
                        search_result += '</div><span>그 외 ' + (result.length-rel.length) + '개의 검색 결과:</span>';
                    }
                }
                for (var i in result) {
                    search_result += '<div class="search-result">'
                        + '<span class="search-result-category">'+result[i].category_one+' > '
                            + result[i].category_two+' > '+result[i].category_three+'</span><br />'
                        + '<span class="search-result-service"> - '+result[i].service+' ('+result[i].year+')'+'</span>'
                        + '</div>';
                }
                $("#search-result").append(search_result);
            } else {
                alert(res.errcode);
            }
        }
    );    
};

Budget = {};

$(document).ready(function() {
    Issue.autocomplete();
    Issue.listIssues();

    $("#add_issue").submit(Issue.addIssue);
    $("#search-issue").submit(Issue.search);

    $("#accordion").accordion({
        collapsible: true,
        heightStyle: "content",
        active: false
    }).show();
    $("#budget_selected").html('없음');

    $.getJSON("/budget/kvpairs", function(data) {
        Budget.list = data;
    });
});
