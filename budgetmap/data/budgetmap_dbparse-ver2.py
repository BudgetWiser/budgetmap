from pymongo import MongoClient

f = open("budgetmap_dbtoy.tsv", 'r')
f.readline()
lines = f.readlines()
print len(lines)

client = MongoClient()
db = client.budgetmap_proto
collection = db.seoul_budget

collection.remove()

is_created = {}
parent_ids = {}
for line in lines:
    print line
    row = line.split("\t")

    if is_created.get(row[0]) is None:
        #create a parent
        document = {
            "_parent_id" : None,
            "code"  : int(row[0]),
            "name"  : row[1],
            "year"  : 2014,
            "type"  : 0, # functional
            "budget": 0 #int("".join(row[4].split(",")))
        }
        document_id = collection.insert(document)
        parent_ids[row[0]+"2014"] = document_id
        print "parent elements created (", 2014,", ",document_id, ")"
        document = {
            "_parent_id" : None,
            "code"  : int(row[0]),
            "name"  : row[1],
            "year"  : 2013,
            "type"  : 0,
            "budget": 0 #int("".join(row[5].split(",")))
        }
        document_id = collection.insert(document)
        parent_ids[row[0]+"2013"] = document_id
        print "parent elements created (", 2013,", ",document_id, ")"

        is_created[row[0]] = "created";

    parent2014_id = parent_ids[row[0]+"2014"];
    parent2013_id = parent_ids[row[0]+"2013"];
    budget2014 = int("".join(row[4].split(",")))
    budget2013 = int("".join(row[5].split(",")))

    #update the parent total amount
    collection.update({
        "_id": parent2014_id
    },
    {
        "$inc": { "budget" : budget2014}
    })
    collection.update({
        "_id": parent2013_id
    },
    {
        "$inc": { "budget" : budget2013}
    })

    #create second-level budget
    document = {
        "_parent_id": parent2014_id,
        "year": 2014,
        "code": int(row[2]),
        "name": row[3],
        "type"  : 0,
        "budget": budget2014

    }
    document_id = collection.insert(document)
    print "child elements created (", 2014,", ",document_id, ")"

    document = {
        "_parent_id": parent2013_id,
        "year": 2013,
        "code": int(row[2]),
        "name": row[3],
        "type"  : 0,
        "budget": budget2013

    }

    document_id = collection.insert(document)
    print "child elements created (", 2013,", ",document_id, ")"

print len(list(collection.find()))," records created!"
f.close()
