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
	sessions	= ["c2"]#"2", "4", "5", "6", "7", "8", "9","12", "22", "32", "42", "52", "62", "72", "82", "92", "a2", "b2", "c2"];
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


		# connect db and retrieve data
		for sid in sessions:
			print "session ID: ", sid
			client = MongoClient('mongodb://143.248.234.88:27017/')
			db = client["budgetmap_experiment_"+sid]
			issue_coll	= db.issues.find()
			budget_coll	= db.budgets.find()

			budget_map = {}
			category_map = {}
			for service in budget_coll:
				budget_map[service["_id"]] = service
				category_map[service['category_three']] = service['category_three']

			# collect data to be evaluated
			evals = []
			eval_cats = {u"장애인 복지": {}, u"육아 지원":{}, u"안전 예산":{}}
			all_services = {u"장애인 복지": {}, u"육아 지원":{}, u"안전 예산":{}}
			for issue in issue_coll:			
				for bid in issue["budgets"]:	
					if issue["name"] in eval_cats and eval_cats[issue["name"]] is not None: 
						all_services[issue["name"]][budget_map[bid]["service"]] = 1
						eval_cats[issue["name"]][budget_map[bid]['category_three']] = budget_map[bid]['category_three']
						
						evals.append({"issue_name": issue["name"], "service_name": budget_map[bid]["service"], "weight": 1})
						

			total = {u"장애인 복지": 0, u"육아 지원":0, u"안전 예산":0}		
			issue_map = {u"장애인 복지": [0,0], u"육아 지원":[0,0], u"안전 예산":[0,0]}		

			# evaluate related data
			for evl in evals:				
				issue = evl["issue_name"].strip()
				serv  = evl["service_name"].strip()
				wt    = evl["weight"]
				#print serv
				#print issue.replace(" ", ""), ",", serv.replace(" ", "")
				if serv in sol_map and sol_map[serv] is not None:
					#print serv, sol_map[serv]
					#narrow
					issue_map[issue][0] += (sol_map[serv]['narrow'][issue]*wt)
					#broad				
					issue_map[issue][1] += (sol_map[serv]['broad'][issue]*wt)

					total[issue]+=1

		
			# evaluate coverage
			print '예산 커버리지 측정: '
			for k,v in eval_cats.items():
				print k, " :: ", len(v)/float(len(category_map))

			#print result - related
			print '연관 사업/이슈에 대한 평가 결과:'
			for k, v in issue_map.items():
				if total[k]==0:
						continue
				print k, '-narrow: ', v[0], ",", total[k], ", ", float(v[0])/float(total[k])
				print k, '-broad: ', v[1], ",", total[k], ", ", float(v[1])/float(total[k])

			print '사업 커버리지 측정:'
			for k,v in all_services.items():
				print k, " :: ", len(v)/float(len(budget_map))



if __name__ == '__main__':

	if len(sys.argv)!=3:
		main("budgetmap-solution.csv", "budgetmap-live-result.csv");
	else:
		main(sys.argv[1],sys.argv[2]);

	
	sys.exit(0)

