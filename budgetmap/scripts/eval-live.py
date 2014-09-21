# -*- coding: utf-8 -*-

from pymongo import MongoClient
# -*- coding: utf-8 -*-
import sys
import math
import csv
def main(sol_file, eval_file):
	serv_idx 	= 0
	nidx 		= [5, 6, 7]
	bidx 		= [8, 9, 10]
	sidx 		= [11, 12, 13]

	eval_issue_idx 	= 2
	eval_serv_idx	= 3
	with open(sol_file, 'r') as sol_csv:

		sols = csv.reader(sol_csv)
		next(sols)
		next(sols)

		# construct solution map
		sol_map = {}
		for sol in sols:
			if sol[serv_idx]=="":
				continue
			#key =unicode(sol[serv_idx].strip())
			key = sol[serv_idx].strip().decode(encoding='UTF-8',errors='strict')
			#print key, type(key)
			row = sol_map[key] = {}
			#narrow
			row['narrow'] 	= {u"장애인 복지": int(sol[nidx[0]]) , u"육아 지원": int(sol[nidx[1]]), u"안전 예산": int(sol[nidx[2]])}
			#broad
			row['broad'] 	= {u"장애인 복지": int(sol[bidx[0]]) , u"육아 지원": int(sol[bidx[1]]), u"안전 예산": int(sol[bidx[2]])}
			#solution
			row['solution'] = {u"장애인 복지": int(sol[sidx[0]]) , u"육아 지원": int(sol[sidx[1]]), u"안전 예산": int(sol[sidx[2]])}


		# evaluate
		client = MongoClient('mongodb://143.248.234.88:27017/')
		db = client.budgetmap_live
		issue_coll	= db.issues.find()
		budget_coll	= db.budgets.find()

		budget_map = {}
		for service in budget_coll:
			budget_map[service["_id"]] = service

		evals = []
		for issue in issue_coll:			
			for rel in issue["budgets"]:				
				if rel["related"]!=0 and rel["related"]>=rel["unrelated"]:
					evals.append({"issue_name": issue["name"], "service_name": budget_map[rel["id"]]["service"]})
		
		total = {u"장애인 복지": 0, u"육아 지원":0, u"안전 예산":0}		
		issue_map = {u"장애인 복지": [0,0], u"육아 지원":[0,0], u"안전 예산":[0,0]}		
		for evl in evals:				
			issue = evl["issue_name"].strip()
			serv  = evl["service_name"].strip()
			#print serv
			#print issue.replace(" ", ""), ",", serv.replace(" ", "")
			if serv in sol_map and sol_map[serv] is not None:
				print serv, sol_map[serv]
				#narrow
				issue_map[issue][0] += sol_map[serv]['narrow'][issue]
				#broad
				issue_map[issue][1] += sol_map[serv]['broad'][issue]
				#solution
				#issue_map[issue][2] += sol_map[serv]['solution'][issue]
				#total
				total[issue]+=1

		
		#print total
		for k, v in issue_map.items():
			if total[k]==0:
					continue
			print k, '-narrow: ', v[0], ",", total[k], ", ", float(v[0])/float(total[k])
			print k, '-broad: ', v[1], ",", total[k], ", ", float(v[1])/float(total[k])
			#print k, '-solution: ', v[2], ",", total, ", ", float(v[2])/float(total)

if __name__ == '__main__':

	if len(sys.argv)!=3:
		main("budgetmap-solution.csv", "budgetmap-live-result.csv");
	else:
		main(sys.argv[1],sys.argv[2]);

	
	sys.exit(0)

