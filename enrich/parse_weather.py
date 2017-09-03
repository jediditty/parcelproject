# -*- coding: utf-8 -*-
import requests
import json
from emergency_enrich import settings


def handle_dispatch(data):
    ''' Handles provided data'''
    lat = data['apparatus'][0]['unit_status']['arrived']['latitude']
    lon = data['apparatus'][0]['unit_status']['arrived']['longitude']
    day, hour = data['apparatus'][0]['unit_status']['arrived']['timestamp'].split('T')
    hour = hour.split(':')[0]
    weather_data = get_weather_data(lat, lon, day)
    data['weather'] = parse_weather(weather_data, hour)
    print data
    return data

def get_weather_data(lat, lon, date):
    ''' Get weather api data'''
    url = settings.WEATHER_API + 'key=' + settings.WEATHER_KEY + '&q=' + str(lat) + ','+ str(lon) +'&format=json&date=' + date
    res = requests.get(url)
    return json.loads(res.text)

def parse_weather(data, hour):
    ''' Get hour data'''
    hours = data['data']['weather'][0]['hourly']
    return closest_hour(hours, hour)

def closest_hour(list, hour):
    ''' Gets the closest by the hour entry from the weather api'''
    best_entry = None
    best_dist = None
    for entry in list:
        dist = float(hour + '00') - float(entry['time'])
        print abs(dist)
        print best_dist
        if abs(dist) < best_dist or best_dist is None:
            best_entry = entry
            best_dist = abs(dist)
    return best_entry
