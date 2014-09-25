# -*- coding: utf-8 -*-

from pymongo import MongoClient
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
		with open(eval_file, 'r') as eval_csv:

			sols = csv.reader(sol_csv)
			next(sols)
			next(sols)

			evals = csv.reader(eval_csv)
			next(evals)

			# construct solution map
			sol_map = {}
			for sol in sols:
				if sol[serv_idx]=="":
					continue
				row = sol_map[sol[serv_idx]] = {}
				#narrow
				row['narrow'] 	= {"장애인 복지": int(sol[nidx[0]]) , "육아 지원": int(sol[nidx[1]]), "안전 예산": int(sol[nidx[2]])}
				#broad
				row['broad'] 	= {"장애인 복지": int(sol[bidx[0]]) , "육아 지원": int(sol[bidx[1]]), "안전 예산": int(sol[bidx[2]])}
				#solution
				row['solution'] = {"장애인 복지": int(sol[sidx[0]]) , "육아 지원": int(sol[sidx[1]]), "안전 예산": int(sol[sidx[2]])}

			# connect db and retrieve data
			client = MongoClient('mongodb://143.248.234.88:27017/')
			db = client.budgetmap_live
			issue_coll	= db.issues.find()
			budget_coll	= db.budgets.find()

			# evaluate coverage
			budget_map = {}
			category_map = {}
			for service in budget_coll:
				budget_map[service["service"]] = service
				category_map[service['category_three']] = service['category_three']		

			# evaluate related budgets
			total = {"장애인 복지": 0, "육아 지원":0, "안전 예산":0}		
			issue_map = {"장애인 복지": [0,0], "육아 지원":[0,0], "안전 예산":[0,0]}
			eval_cats = {u"장애인 복지": {}, u"육아 지원":{}, u"안전 예산":{}}	
			for evl in evals:				
				issue = evl[2]
				serv  = evl[3]
				#print issue, ", ", serv
				if serv in sol_map and sol_map[serv] is not None:
					#narrow
					issue_map[issue][0] += sol_map[serv]['narrow'][issue]
					#broad
					issue_map[issue][1] += sol_map[serv]['broad'][issue]
					#solution
					#issue_map[issue][2] += sol_map[serv]['solution'][issue]
					total[issue] +=1
				issue_name = evl[2].strip().decode(encoding='UTF-8',errors='strict')
				serv_name = evl[3].strip().decode(encoding='UTF-8',errors='strict')
				service = budget_map[serv_name];
				#print issue_name, serv_name
				#print service

				eval_cats[issue_name][service['category_three']] = service['category_three']

			#print eval_cats
			#print issue_map
			print '연관 사업/이슈에 대한 평가 결과:'
			for k, v in issue_map.items():
				if total[k]==0:
					continue
				print k, '-narrow: ', v[0], ",", total[k], ", ", float(v[0])/float(total[k])
				print k, '-broad: ', v[1], ",", total[k], ", ", float(v[1])/float(total[k])
				#print k, '-solution: ', v[2], ",", total[k], ", ", float(v[2])/float(total[k])

			print '예산 커버리지 측정: '
			for k,v in eval_cats.items():
				print k, " :: ", len(v)/float(len(category_map))



if __name__ == '__main__':

	if len(sys.argv)!=3:
		main("budgetmap-solution.csv", "budgetmap-lab-result.csv");
	else:
		main(sys.argv[1],sys.argv[2]);

	
	sys.exit(0)

