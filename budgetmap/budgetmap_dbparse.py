from pymongo import MongoClient

f = open("budgetmap_dbtoy.tsv", 'r')
f.readline()
lines = f.readlines()
print len(lines)

client = MongoClient()
db = client.budgetmap_proto
collection = db.seoul_functional

for line in lines:
    print line
    row = line.split("\t")
    document = {
        "level1_code": row[0],
        "level1": row[1],
        "level2_code": row[2],
        "level2": row[3],
        "yr_2014": "".join(row[4].split(",")),
        "yr_2013": "".join(row[5].split(",")),
        "yr_2012": "".join(row[6].split(",")),
        "yr_2011": "".join(row[7].split(",")),
        "yr_2010": "".join(row[8].split(",")),
        "yr_2009": "".join(row[9].split(",")),
        "note": row[10],
    }

    document_id = collection.insert(document)
    print document_id

f.close()
