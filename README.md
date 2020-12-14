# webscraping-informer
This is an application in which the user selects a numerical element in a webpage of his choice, selects the parameters, and based on them he will be informed via email automatically.

### Installation
* ``` git clone https://github.com/konstantinosbaktalias/webscraping-informer.git ```
* ``` cd  webscraping-informer ```
* ``` pip install -r requirements.txt  ```
* ``` Fill the database fields in file webscraping-informer/database.py ```
* ``` Uncomment line 80 in file webscraping-informer/database.py and run python database.py to create the database table ```
* ``` Comment or delete line 80 in file webscraping-informer/database.py ```
* ``` Fill the email fields in file webscraping-informer/webscrapingbot.py ```
* ``` cd client ```
* ``` npm install ```

### Execution
#### Run Server
  * ``` uvicorn server:app --reload ```
#### Run Webscraping Bot
  * ``` python webscrapingbot.py ```
#### Run client webapp
  * ``` cd client ```
  * ``` npm run dev ```
  
##### Notes
* You need to Postgresql installed in your machine
