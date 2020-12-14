from fastapi import FastAPI, Body, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import datetime

from database import create_object, delete_object
from get_data import get_data

app = FastAPI()

origins = [
    'http://localhost:5000'
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post('/')
def create_obj(
email: str = Body(...), 
period: int = Body(...), 
title: str = Body(...),
url: str = Body(...), 
data_id: str = Body(...), 
int_or_float: bool = Body(...),
symbols: bool = Body(...), 
id_or_class: bool = Body(...), 
index_start: int = Body(...), 
index_end: int = Body(...), 
notif_time: int = Body(...)
):
    if '@' and '.' not in email:
        content = 'Invalid email'
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content=content)
    if notif_time < 1:
        content = 'Invalid time'
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content=content)
    try:
        data = get_data(
            url=url,
            data_id=data_id,
            int_or_float=int_or_float,
            symbols=symbols,
            id_or_class=id_or_class,
            index_start=index_start,
            index_end=index_end
        )
    except Exception:
        content = 'Invalid link'
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content=content)
    create_object(
        email=email,
        period=datetime.datetime.now() + datetime.timedelta(days=period),
        notif_time=notif_time,
        url=url,
        title=title,
        data_id=data_id,
        int_or_float=int_or_float,
        id_or_class=id_or_class,
        symbols=symbols,
        index_start=index_start,
        index_end=index_end,
        data_obj=data
    )
    return JSONResponse(status_code=status.HTTP_201_CREATED, content='Created')

@app.get('/delete/{id}')
def delete_obj(id: str):
    delete_obj(id)
    return f"Object deleted {id}"