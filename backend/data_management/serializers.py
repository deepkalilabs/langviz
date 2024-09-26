from rest_framework import serializers
from .models import DataSet

class DataSetSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataSet
        fields = '__all__'

    def create(self, validated_data):
        """
        Create and return a new `DataSet` instance, given the validated data.
        """
        return DataSet.objects.create(**validated_data)
    