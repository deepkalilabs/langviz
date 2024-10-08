from rest_framework import generics, status
from rest_framework.response import Response
from .models import DataSet
from .serializers import DataSetSerializer

class DataSetListView(generics.ListAPIView):
    queryset = DataSet.objects.all()
    serializer_class = DataSetSerializer

    def get_queryset(self):
        return DataSet.objects.filter(user=self.request.user)

class DataSetCreateView(generics.CreateAPIView):
    serializer_class = DataSetSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        
        # Serialize the instance again to get the full representation
        output_serializer = self.get_serializer(instance)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        return serializer.save()