from pymongo import MongoClient

f = open("budgetmap_issue.csv", 'r')
lines = f.readlines()
print len(lines)

client = MongoClient()
db = client.budgetmap_proto
collection = db.issue_names

collection.remove()

for line in lines:
    print line
    row = line.split(",")
    document_id = collection.insert({
        "name": row[0],
        "desc": row[1]
        })  
    print document_id, " created!"
f.close()
