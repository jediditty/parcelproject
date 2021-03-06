# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import json
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .parse_weather import handle_dispatch, get_parcel_data


# Create your views here.
def index(request):
    ''' Returns base project page'''
    return render(request, 'enrich/index.html')

@csrf_exempt
def dispatch(request):
    ''' View for dispatch data'''
    if request.method == 'POST':
        enriched_data = handle_dispatch(json.loads(request.body))
        return JsonResponse(enriched_data)
