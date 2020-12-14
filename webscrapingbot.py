from matplotlib import pyplot as plt
import pandas as pd
from smtplib import SMTP_SSL as SMTP 
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from base64 import b64encode
import datetime, time, os, uuid

from get_data import get_data

from database import (
    create_object,
    get_object, 
    get_objects,
    update_object,
    delete_object
)

EMAIL_PORT = 465
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_HOST_USER = ''
EMAIL_HOST_PASSWORD = ''

#--------- Update object and send email  ---------#

def update_object_and_send_email(id):
    obj = get_object(id=id)
    data = get_data(obj[0][6], obj[0][7], obj[0][8], obj[0][9], obj[0][10], obj[0][11], obj[0][12])
    updated_obj = update_object(id, data)

    timearr = []
    timenumarr = []
    num = 0
    for x in range(0, len(updated_obj[0][13])):
        timearr.append(updated_obj[0][1] + datetime.timedelta(minutes=updated_obj[0][4]))
        timenumarr.append(num)
        num += 1

    file_id = updated_obj[0][0]

    plt.xticks(timenumarr, timearr)
    plt.plot(updated_obj[0][13], linewidth=3)
    plt.ylim(0)
    plt.title(updated_obj[0][5])
    plt.xlabel('Time')
    plt.ylabel('Data')
    plt.style.use('seaborn-colorblind')
    plt.savefig(f'files/{file_id}.png')

    df = pd.DataFrame()
    df['Time'] = timearr
    df['Data'] = updated_obj[0][13]
    df.to_csv(f'files/{file_id}.csv')

    img_data = open(f'files/{file_id}.png', 'rb')
    csv_data = open(f'files/{file_id}.csv', 'rb')

    image = MIMEImage(img_data.read(), name=os.path.basename(f'files/{file_id}.png'))
    csv = MIMEApplication(csv_data.read(),_subtype="csv")
    csv.add_header('Content-Disposition','attachment',filename=f'{file_id}.csv')

    img_data.close()
    csv_data.close()

    message = MIMEMultipart('alternative')
    message['Subject'] = f'{updated_obj[0][5]} Update'
    message['From'] = EMAIL_HOST_USER
    message['To'] = updated_obj[0][2]

    context = f'''
        <h1>{updated_obj[0][5]}</h1><br/>
        <span>url: {updated_obj[0][6]}</span><br/>
        <span>Updates till {updated_obj[0][3]}</span><br/>
        <a href="http://localhost:8000/delete/{file_id}">Stop update me</a>
    ''' 
    context = MIMEText(context, "html")
    message.attach(context)
    message.attach(image)
    message.attach(csv)
    
    conn = SMTP(EMAIL_HOST)
    conn.set_debuglevel(False)
    conn.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)

    try:
        conn.sendmail(EMAIL_HOST_USER, updated_obj[0][2], message.as_string())
        print(f'Email was sended to {updated_obj[0][2]}')
    except Exception:
        print("Email was not sended")
    

while True:
    objects = get_objects()
    for obj in objects:
        print(obj)
        if obj[14] >= obj[3]:
            delete_object(id=obj[0])
            print('Removed from database')
        if obj[14] + datetime.timedelta(minutes=obj[4]) <= datetime.datetime.now():
            update_object_and_send_email(obj[0])
        else:
            print('Not updated')
    time.sleep(2)