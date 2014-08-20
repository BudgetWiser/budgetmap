from pymongo import MongoClient

client = MongoClient('mongodb://143.248.234.88:27017/')
bs_db = client.budgetspider
from_budget = bs_db.budgetspider
bmp_db = client.budgetmap_proto
to_budget = bmp_db.budgets
bmp_db.budgets.remove()
i = 0
budgets = []
for budget in from_budget.find():
    budgets.append(budget)
    i+=1
    if i%1000==0:
        print i, 'records pushed for insert.'
inserted = to_budget.insert(budgets)
print 'FINISHED', len(inserted), 'records are migrated!'

