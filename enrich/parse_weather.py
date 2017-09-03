# -*- coding: utf-8 -*-
import json
import requests
from emergency_enrich import settings


def handle_dispatch(data):
    ''' Handles provided data'''
    # some data pre parsing to simplifiy the following functions
    lat = data['apparatus'][0]['unit_status']['arrived']['latitude']
    lon = data['apparatus'][0]['unit_status']['arrived']['longitude']
    day, hour = data['apparatus'][0]['unit_status']['arrived']['timestamp'].split('T')
    # parse down to just the hour of the day, assuming 24 template
    hour = hour.split(':')[0]
    weather_data = get_weather_data(lat, lon, day)
    data['weather'] = parse_weather(weather_data, hour)

    # Get Parcel data
    data['parcel_data'] = get_parcel_data(str(lat), str(lon))
    # convert to geojson
    return data_to_geojson(data, lat, lon)

def get_weather_data(lat, lon, date):
    ''' Get weather api data'''
    url = settings.WEATHER_API + 'key=' \
        + settings.WEATHER_KEY + '&q=' + \
        str(lat) + ','+ str(lon) +'&format=json&date=' + date
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
    # loop through and grab the lowest absolute value 
    for entry in list:
        dist = float(hour + '00') - float(entry['time'])
        if abs(dist) < best_dist or best_dist is None:
            best_entry = entry
            best_dist = abs(dist)
    # return the closest hourly weather data recorded for the day
    return best_entry

def get_parcel_data(lat, lon):
    ''' Get data from the richmond arc service'''
    coords = '{},{}'.format(lon, lat)
    url = settings.PARCEL_ARC_REST.format(coords)
    res = json.loads(requests.get(url).text)
    if len(res['features']) == 0:
        # return simple message so at least weather data is returned when no parcel data is found
        return {'Parcel': 'No Parcel data found'}
    else:
        return get_specific_parcel(str(res['features'][0]['attributes']['OBJECTID']))

def get_specific_parcel(obj_id):
    ''' Parse individual obj data'''
    url = settings.PARCEL_URL.format(obj_id)
    res = json.loads(requests.get(url).text)
    if res.has_key('feature') is True:
        res['feature']['properties'] = res['feature'].pop('attributes')
        geom = res['feature']['geometry']
        geom['coordinates'] = geom.pop('rings')
        geom['type'] = 'Polygon'
        return res
    else:
        return {'Parcel': 'No Parcel data found'}

def data_to_geojson(data, lat, lon):
    ''' convert to geojson'''
    return {"type": "FeatureCollection",
                "features": [{
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [lon, lat]
                        },
                        "properties": {
                            "parcel_data": data['parcel_data'],
                            "address": data['address'],
                            "description": data['description'],
                            "weather": data['weather']
                        }
                    }
                ]
            }
