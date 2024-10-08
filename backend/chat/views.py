from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Dataset as DatasetModel, ChatSession as ChatSessionModel, Message as MessageModel
from accounts.models import User
from .serializers import DatasetSerializer, ChatSessionSerializer, MessageSerializer
import requests
import pandas as pd
from io import StringIO
from llm_agents.helpers.dataset_enrich import DatasetEnrich, DatasetHelper
from llm_agents.helpers.question_viz import DatasetVisualizations
from django.views.decorators.csrf import csrf_exempt
from django.http import Http404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
import uuid
from pprint import pprint


def create_dataset_helper(request):
    name = request.data.get('name', '')
    uri = request.data.get('url', '')
    description = request.data.get('description', '')
    
    if not uri:
        raise ValueError('uri is required')
    
    try:
        enrich_schema = DatasetEnrich(uri).forward()
        
        dataset = DatasetModel.objects.create(name=name, uri=uri, description=description, enriched_columns_properties=enrich_schema['column_properties'], enriched_dataset_schema=enrich_schema['dataset_schema'])
        
        return dataset
    except Exception as e:
        raise ValueError(f'Failed to create dataset: {str(e)}')


@method_decorator(csrf_exempt, name='dispatch')
class ChatSession(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, format=None):
        try:
            dataset = create_dataset_helper(request)
        except Exception as e:
            return Response({'error': f'Failed to create dataset: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        
        chat_session = ChatSessionModel.objects.create(
            user=User.objects.first(),
            session_id=uuid.uuid4(),
            main_dataset=dataset
        )
        
        serializer = ChatSessionSerializer(chat_session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

            
    def get(self, format=None):
        print(DatasetModel.objects.all())
        datasets = DatasetModel.objects.first()
        serializer = DatasetSerializer(datasets)
        return Response(serializer.data)
    
    
@method_decorator(csrf_exempt, name='dispatch')
class ChatSessionMessage(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    
    def post(self, request, format=None):
        questions = request.data.get('questions', [])
        dataset = DatasetModel.objects.last()
        print("dataset", dataset)
        pprint(dataset.enriched_columns_properties)
        pprint(dataset.enriched_dataset_schema)
        enriched_dataset = DatasetHelper(dataset.uri, dataset.enriched_columns_properties, dataset.enriched_dataset_schema)
        
        viz_data_code = DatasetVisualizations(enriched_dataset, questions).forward()
        
        return Response(viz_data_code, status=status.HTTP_200_OK)
        
    def get(self, request, format=None):
        pass