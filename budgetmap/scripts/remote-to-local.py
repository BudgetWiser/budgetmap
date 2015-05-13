
import os, pymongo, sys, datetime, csv
import numpy as np
import matplotlib.pyplot as plt
from scipy import stats
from collections import Counter

if __name__ == "__main__":
	# open remote database
	

	localClient = pymongo.MongoClient('localhost', 27017)
	localClient.drop_database("budgeTag");
 	localClient.admin.command('copydb',
                         fromdb='budgeTag',
                         todb='budgeTag',
                         fromhost='54.191.187.64:38716')
