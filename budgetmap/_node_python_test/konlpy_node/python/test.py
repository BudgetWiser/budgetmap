# -*- coding: utf-8 -*-

from newspaper import Article

url = 'http://google.com/url?q=http://chosun.com/tw/%3Fid%3D2015041502861&sa=U&ei=D2JAVZrIH4XHmwW9zoBI&ved=0CBMQqQIoADAA&usg=AFQjCNGuPLk07ETI0s7GRzkHKEkwcxCjbQ'

article = Article(url)

article.download()
article.parse()


print article.text
