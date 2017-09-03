from django.conf.urls import url
from . import views


urlpatterns = [
    url(r'^$', views.index, name='enrich'),
    url(r'^dispatch/', views.dispatch, name='dispatch'),
]
