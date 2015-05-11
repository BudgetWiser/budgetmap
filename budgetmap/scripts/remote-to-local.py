
import os, pymongo, sys, datetime, csv
import numpy as np
import matplotlib.pyplot as plt
from scipy import stats
from collections import Counter


if __name__ == "__main__":
	# open remote database
	client 	= pymongo.MongoClient('143.248.234.88', 27017)

	localClient = pymongo.MongoClient('localhost', 27017)
 	localClient.admin.command('copydb',
                         fromdb='budgetmap_live',
                         todb='budgetmap_live',
                         fromhost='143.248.234.88')
