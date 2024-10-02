from django.shortcuts import render
from rest_framework import viewsets
from .models import Vizualization, DerivedDataset
from .serializers import VizualizationSerializer, DerivedDatasetSerializer

class VizualizationViewSet(viewsets.ModelViewSet):
    queryset = Vizualization.objects.all()
    serializer_class = VizualizationSerializer

class DerivedDatasetViewSet(viewsets.ModelViewSet):
    queryset = DerivedDataset.objects.all()
    serializer_class = DerivedDatasetSerializer
