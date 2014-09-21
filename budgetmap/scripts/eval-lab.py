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
			
			issue_map = {"장애인 복지": [0,0], "육아 지원":[0,0], "안전 예산":[0,0]}

			#total = 0;
			total = {"장애인 복지": 0, "육아 지원":0, "안전 예산":0}		
			# evaluate
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
			print issue_map
			for k, v in issue_map.items():
				if total[k]==0:
					continue
				print k, '-narrow: ', v[0], ",", total[k], ", ", float(v[0])/float(total[k])
				print k, '-broad: ', v[1], ",", total[k], ", ", float(v[1])/float(total[k])
				#print k, '-solution: ', v[2], ",", total[k], ", ", float(v[2])/float(total[k])

if __name__ == '__main__':

	if len(sys.argv)!=3:
		main("budgetmap-solution.csv", "budgetmap-lab-result.csv");
	else:
		main(sys.argv[1],sys.argv[2]);

	
	sys.exit(0)

