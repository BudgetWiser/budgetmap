# -*- coding: utf-8 -*-

import math, re, requests, json

from bs4 import BeautifulSoup as Soup
from newspaper import Article
from multiprocessing import Process, Queue

import time

def index():
    issue = raw_input()

    start_time = time.time()

    issue = issue.strip()
    issue = issue.split(" ")
    issue = "+" + ("+").join(issue)

    url = "https://www.google.com/search?q=서울+예산" + issue + "&oq=서울+예산" + issue + "&hl=ko&gl=kr&tbm=nws"

    links = getArticles(url)

    #Threads
    def linkParser(q, link):
        content = parseArticle(link)
        budgets = getBudgetInfo(content)
        parsed = []

        for i, budget in enumerate(budgets):
            budget_name = budget[0]
            index = -1

            parsed.append([budget_name, 10 / float(i + 10)])

        q.put(parsed)

    if __name__ == '__main__':
        qs = []
        ps = []
        for i, link in enumerate(links):
            queue = Queue()
            process = Process(target = linkParser, args = (queue, link))
            process.start()
            qs.append(queue)
            ps.append(process)

        origList = []
        calcList = []

        for q in qs:
            for g in q.get():
                origList.append(g)
        for p in ps:
            p.join()

        for origItem in origList:
            index = -1
            for i, calcItem in enumerate(calcList):
                if origItem[0] == calcItem[0]:
                    index = i
                    break
            if index == -1:
                calcList.append(origItem)
            else:
                calcList[index][1] += origItem[1]

        calcList = sorted(calcList, key = lambda w: w[1], reverse = True)

        output = ""

        for i, item in enumerate(calcList[:5]):
            output += item[0]
            if i != 4:
                output += " / "

        print output.encode('utf-8')
        #print "SPENT TIME : ", time.time() - start_time, " (s)"

def getArticles(url):
    req = requests.get(url)
    markup = req.text

    soup = Soup(markup)
    links = soup.select('h3.r > a')

    urls = []

    for link in links:
        newsURL = "http://google.com" + str(link['href'])
        urls.append(newsURL)

    return urls

def parseArticle(url):
    article = Article(url)
    article.download()
    article.parse()

    title = article.title
    content = article.text

    return title + '\n' + content

def getBudgetInfo(content):
    #get words for TF-IDF and service names.
    words = json.loads(open('python/data/services_word.json', 'r').readline())
    services = json.loads(open('python/data/services_info.json', 'r').readline())

    word_list = []
    serv_list = []

    for word in words:
        _word = word['word']
        _weight = word['weight']
        _length = len(_word)

        _count = content.count(_word)

        if _length > 0:
            word_list.append([_word, _count * _weight * math.log(_length)])

    excepts = ['서울', '서울시', '사람', '사회', '문제', '문화', '경우', '우리', '소리', '함께', '시간', '인간', '사실', '시대', '다음', '세계', '설계', '공사', '시설', '사업']

    for service in services:
        _weight = 0
        _words = service['calc_name']

        for _word in word_list:
            if _word[0] in _words:
                _weight += _word[1]

        serv_list.append([service['orig_name'], service, _weight])

    serv_list = sorted(serv_list, key = lambda w: w[2], reverse = True)

    return serv_list[:15]

index()
