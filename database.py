import psycopg2, datetime

connection = psycopg2.connect(database="", user="", password="", host="", port="")
cursor = connection.cursor()
print("Connected to database")

def create_table():
    cursor.execute('''
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    ''')
    cursor.execute('''
        CREATE TABLE OBJECT(
            ID              UUID            DEFAULT uuid_generate_v4 (),
            TS              TIMESTAMP,
            EMAIL           TEXT            NOT NULL,
            PERIOD_TIME     TIMESTAMP,
            NOTIF_TIME      INT             NOT NULL,
            TITLE           TEXT            NOT NULL,
            URL             TEXT            NOT NULL,
            DATA_ID         TEXT            NOT NULL,
            INT_OR_FLOAT    BOOL            NOT NULL,
            ID_OR_CLASS     BOOL            NOT NULL,
            SYMBOLS         BOOL            NOT NULL,
            INDEX_START     INT             DEFAULT 0,
            INDEX_END       INT             DEFAULT 0,
            DATA            FLOAT[]         NOT NULL,
            LAST_UPDATED    TIMESTAMP
        );
    ''')
    connection.commit()

def get_objects():
    cursor.execute('''
        SELECT * FROM OBJECT
    ''')
    objects = cursor.fetchall()
    return objects

def get_object(id):
    cursor.execute(f'''
        SELECT * FROM OBJECT WHERE ID='{id}'
    ''')
    objectx = cursor.fetchall()
    return objectx

def create_object(email, period, notif_time, url, data_id, int_or_float, id_or_class, symbols, index_start, index_end, title, data_obj):
    data = []
    data.append(float(data_obj))
    cursor.execute(f'''
        INSERT INTO OBJECT (TS, EMAIL, PERIOD_TIME, NOTIF_TIME, TITLE, URL, DATA_ID, INT_OR_FLOAT, ID_OR_CLASS, SYMBOLS, INDEX_START, INDEX_END, DATA, LAST_UPDATED) VALUES (
            '{datetime.datetime.now()}', '{email}', '{period}', {notif_time}, '{title}', '{url}', '{data_id}', '{int_or_float}', '{id_or_class}','{symbols}', '{index_start}', {index_end}, ARRAY {data}, '{datetime.datetime.now()}')
    ''') 
    connection.commit()

def update_object(id, new_price):
    cursor.execute(f'''
        SELECT DATA FROM OBJECT WHERE ID='{id}';
    ''')
    data = cursor.fetchall()
    data[0][0].append(float(new_price))
    print(data[0][0])
    cursor.execute(f'''
        UPDATE OBJECT SET DATA=ARRAY {data[0][0]} WHERE ID='{id}';
        UPDATE OBJECT SET LAST_UPDATED= '{datetime.datetime.now()}' WHERE ID='{id}';
    ''')
    connection.commit()
    cursor.execute(f'''
        SELECT * FROM OBJECT WHERE ID='{id}'
    ''')
    objectx = cursor.fetchall()
    return objectx

def delete_object(id):
    cursor.execute(f'''
        DELETE FROM OBJECT WHERE ID='{id}'
    ''')
    connection.commit()

# Uncomment this to create the table
# create_table()
