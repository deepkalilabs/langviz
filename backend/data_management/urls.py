from django.urls import path
from .views import DataSetCreateView



urlpatterns = [
    path('datasets/', DataSetCreateView.as_view(), name='dataset-create'),
]


