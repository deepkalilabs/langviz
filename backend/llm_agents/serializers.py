from rest_framework import serializers
from .models import Vizualization, DerivedDataset

class VizualizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vizualization
        fields = '__all__'

class DerivedDatasetSerializer(serializers.ModelSerializer):
    class Meta:
        model = DerivedDataset
        fields = '__all__'
