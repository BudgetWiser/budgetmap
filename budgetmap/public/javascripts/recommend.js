function getRecommendedService(issue, filter, recent_history){
    var FRUSTRATION_THRESHOLD = 5;
    console.log("getRecommendedService Start Time:", new Date());
    var frustration = 0;
    for (var i in recent_history.reverse()) {
        if (recent_history[i] == 1) break;
        if (recent_history[i] == 3) {
            frustration += Math.random();
        }
    }
    // Defrustration: show from already added list
    if (frustration > FRUSTRATION_THRESHOLD) {
    var budgets_list = [];
        for (var i in issue.budgets) {
            for (var j in all_services) {
                if (issue.budgets[i].id === all_services[j]._id) {
                    budgets_list.push(all_services[j]);
                    break;
                }
            }
        }
        if (budgets_list.length) return getRandomService(issue, budgets_list);
    }
 
    if (Math.floor(Math.random() * 5) == 0) {
        // Choose from narrower filter list
        var cat_list = [], serv_list = [];
        for (var i in issue.budgets) {
            var sel = null;
            for (var j in all_services) {
                if (issue.budgets[i].id === all_services[j]._id
                        && issue.budgets[i].related > 0
                        && issue.budgets[i].unrelated == 0) {
                    sel = all_services[j];
                    break;
                }
            }
            if (!sel) continue;
            if (cat_list.indexOf(sel.category_three) == -1) {
                cat_list.push(sel.category_three);
            }
        }
        for (var i in all_services) {
            if (cat_list.indexOf(all_services[i].category_three) != -1) {
                serv_list.push(all_services[i]);
            }
        }
        if (serv_list.length) return getRandomService(issue, serv_list);
    }
    console.log("getRecommendedService End Time:", new Date());
    return getRandomService(issue, all_services);
}
function getRandomService(issue, filter_list) {
    console.log("filter size", filter_list.length);
    var rand_idx = -1, valid = true, count=0;
    do {
        rand_idx = Math.floor(Math.random() * filter_list.length);
        for (var i in issue.budgets) {
            if (issue.budgets[i].id === filter_list[rand_idx]._id) {
                if (issue.budgets[i].unrelated - issue.budgets[i].related > 2) {
                    // Difference in unrelated and related is greater than 2
                    console.log("invalid of previous votes");
                    valid = false;
                }
            }
            if (filter_list[rand_idx].budget_assigned === 0) {
                // Budget amount is 0
                console.log("invalid of budget assigned");
                valid = false;
            }
            if (filter_list[rand_idx].service.indexOf('기본경비') === 0) {
                // Service usage is fixed costs
                console.log("invalid of service name");
                valid = false;
            }
        }
        // counter to avoid infinite loop
        count++;
        console.log("issue.budgets", issue.budgets);
        console.log("all_services[i]", all_services[rand_idx]);
    } while (!valid && count < 10);
    if (valid && count < 10) {
        console.log("getRecommendedService End Time:", new Date());
        return filter_list[rand_idx]
    } else {
        return getRandomService(issue, all_services);
    }
}