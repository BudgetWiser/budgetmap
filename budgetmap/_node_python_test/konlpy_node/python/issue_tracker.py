# -*- coding: utf-8 -*-

from bs4 import BeautifulSoup as Soup
from newspaper import Article
from konlpy.tag import Kkma#, Hannanum
import math, re, requests

def getArticles(url):
    req = requests.get(url)
    markup = req.text

    soup = Soup(markup)
    anchors = soup.select('h3.r > a')

    for anchor in anchors:
        a_url = "http://google.com" + str(anchor['href'])
        getArticle(a_url)

def getArticle(url):
    article = Article(url, language='ko')
    article.download()
    article.parse()

    title = article.title
    text = article.text
    image = article.top_image

    getKeywords(text)

def getKeywords(src):
    kkma = Kkma()

    words = kkma.nouns(src)
    words = list(set(words))
    words_calc = []

    words_num = len(words)
    for word in words:
        if not word.isdigit() and not u'서울' in word and re.match('(.*)?\d+(.*)?', word) is None:
            word_count = src.count(word)
            word_idf = word_count * math.log(len(word))
            if word_idf > 1:
                words_calc.append((word, word_idf))

    words_sort = sorted(words_calc, key = lambda w: w[1], reverse = True)
    words_real = []

    for word in words_sort:
        words_real.append(word[0])

    print (" / ".join(words_real[:5])).encode('utf-8')


search_keyword = raw_input()
url = "https://www.google.com/search?q=서울+예산" + search_keyword + "&oq=서울+예산" + search_keyword + "&hl=ko&gl=kr&tbm=nws"

getArticles(url)
