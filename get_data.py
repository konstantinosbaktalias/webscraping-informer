from bs4 import  BeautifulSoup
import requests

#--------- Scrape data ---------#

def get_data(url, data_id, int_or_float ,id_or_class, symbols, index_start, index_end):
    res = requests.get(url=url)
    soup = BeautifulSoup(res._content, 'html5lib')
    data = ''
    datastr = ''
    if id_or_class:
        try:
            data = soup.find(id=data_id)
            data = data.text
        except Exception:
            return 'Invalid id'
    else:
        try:
            data = soup.find_all(class_=data_id)
            data = data[0].text
        except Exception:
            return 'Invalid class name'
    if data is None:
        return 'Invalid data'
    if symbols:
        data = data[index_start:index_end]
    if ',' in data:
        datastr = ''
        for x in range(0, len(data)):
            if data[x] == ',':
                datastr += '.'
            else:
                datastr += data[x]
        data = datastr
    if int_or_float:
        try:
            data = int(data)
        except Exception:
            return 'This is neither an int nor float type'
    else:
        try:
            data = float(data)
        except:
            return 'This is neither an int nor float type'
    return data